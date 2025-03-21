import * as Moderation from '#lib/common/Moderation.js';
import { unmuteResponse } from '#lib/extensions/discord.js/ExtendedGuildMember.js';
import { colors, emojis } from '#lib/utils/Constants.js';
import * as Format from '#lib/utils/Format.js';
import { formatUnmuteResponse } from '#lib/utils/FormatResponse.js';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	GuildMember,
	Message,
	PermissionFlagsBits,
	Snowflake
} from 'discord.js';

/**
 * Handles shared auto moderation functionality.
 */
export abstract class Automod {
	/**
	 * Whether or not a punishment has already been given to the user
	 */
	protected punished = false;

	/**
	 * @param member The guild member that the automod is checking
	 */
	protected constructor(protected readonly member: GuildMember) {}

	/**
	 * The user
	 */
	protected get user() {
		return this.member.user;
	}

	/**
	 * The client instance
	 */
	protected get client() {
		return this.member.client;
	}

	/**
	 * The guild member that the automod is checking
	 */
	protected get guild() {
		return this.member.guild;
	}

	/**
	 * Whether or not the member should be immune to auto moderation
	 */
	protected get isImmune() {
		if (this.member.user.isOwner()) return true;
		if (this.member.guild.ownerId === this.member.id) return true;
		if (this.member.permissions.has('Administrator')) return true;

		return false;
	}

	protected buttons(userId: Snowflake, reason: string, undo = true): ActionRowBuilder<ButtonBuilder> {
		const row = new ActionRowBuilder<ButtonBuilder>().addComponents([
			new ButtonBuilder({
				style: ButtonStyle.Danger,
				label: 'Ban User',
				customId: `automod;ban;${userId};${reason}`
			})
		]);

		if (undo) {
			row.addComponents(
				new ButtonBuilder({
					style: ButtonStyle.Success,
					label: 'Unmute User',
					customId: `automod;unmute;${userId}`
				})
			);
		}

		return row;
	}

	protected logColor(severity: Severity) {
		switch (severity) {
			case Severity.DELETE:
				return colors.lightGray;
			case Severity.WARN:
				return colors.yellow;
			case Severity.TEMP_MUTE:
				return colors.orange;
			case Severity.PERM_MUTE:
				return colors.red;
		}
		throw new Error(`Unknown severity: ${severity}`);
	}

	/**
	 * Checks if any of the words provided are in the message
	 * @param words The words to check for
	 * @returns The blacklisted words found in the message
	 */
	protected checkWords(words: BadWordDetails[], str: string): BadWordDetails[] {
		if (words.length === 0) return [];

		const matchedWords: BadWordDetails[] = [];
		for (const word of words) {
			if (word.regex) {
				if (new RegExp(word.match).test(this.format(word.match, word))) {
					matchedWords.push(word);
				}
			} else {
				if (this.format(str, word).includes(this.format(word.match, word))) {
					matchedWords.push(word);
				}
			}
		}
		return matchedWords;
	}

	/**
	 * Format a string according to the word options
	 * @param string The string to format
	 * @param wordOptions The word options to format with
	 * @returns The formatted string
	 */
	protected format(string: string, wordOptions: BadWordDetails) {
		const temp = wordOptions.ignoreCapitalization ? string.toLowerCase() : string;
		return wordOptions.ignoreSpaces ? temp.replace(/ /g, '') : temp;
	}

	/**
	 * Handles the auto moderation
	 */
	protected abstract handle(): Promise<void>;
}

/**
 * Handles the ban button in the automod log.
 * @param interaction The button interaction.
 */
export async function handleAutomodInteraction(interaction: ButtonInteraction) {
	if (!interaction.memberPermissions?.has(PermissionFlagsBits.BanMembers))
		return interaction.reply({
			content: `${emojis.error} You are missing the **Ban Members** permission.`,
			ephemeral: true
		});
	const [action, userId, reason] = interaction.customId.replace('automod;', '').split(';') as ['ban' | 'unmute', string, string];

	if (!(['ban', 'unmute'] as const).includes(action)) throw new TypeError(`Invalid automod button action: ${action}`);

	const victim = await interaction.guild!.members.fetch(userId).catch(() => null);
	const moderator =
		interaction.member instanceof GuildMember ? interaction.member : await interaction.guild!.members.fetch(interaction.user.id);

	switch (action) {
		case 'ban': {
			if (!interaction.guild?.members.me?.permissions.has('BanMembers'))
				return interaction.reply({
					content: `${emojis.error} I do not have permission to ${action} members.`,
					ephemeral: true
				});

			const check = victim ? await Moderation.permissionCheck(moderator, victim, 'ban', true) : true;
			if (check !== true) return interaction.reply({ content: check, ephemeral: true });

			const result = await interaction.guild?.customBan({
				user: userId,
				reason,
				moderator: interaction.user.id,
				evidence: (interaction.message as Message).url ?? undefined
			});

			const victimUserFormatted = (await interaction.client.utils.resolveNonCachedUser(userId))?.tag ?? userId;

			const content = (() => {
				if (result === unmuteResponse.SUCCESS) {
					return `${emojis.success} Successfully banned ${Format.input(victimUserFormatted)}.`;
				} else if (result === unmuteResponse.DM_ERROR) {
					return `${emojis.warn} Banned ${Format.input(victimUserFormatted)} however I could not send them a dm.`;
				} else {
					return `${emojis.error} Could not ban ${Format.input(victimUserFormatted)}: \`${result}\` .`;
				}
			})();

			return interaction.reply({
				content: content,
				ephemeral: true
			});
		}

		case 'unmute': {
			if (!victim)
				return interaction.reply({
					content: `${emojis.error} Cannot find member, they may have left the server.`,
					ephemeral: true
				});

			if (!interaction.guild)
				return interaction.reply({
					content: `${emojis.error} This is weird, I don't seem to be in the server...`,
					ephemeral: true
				});

			const check = await Moderation.permissionCheck(moderator, victim, 'unmute', true);
			if (check !== true) return interaction.reply({ content: check, ephemeral: true });

			const check2 = await Moderation.checkMutePermissions(interaction.guild);
			if (check2 !== true) return interaction.reply({ content: formatUnmuteResponse('/', victim!, check2), ephemeral: true });

			const result = await victim.customUnmute({
				reason,
				moderator: interaction.member as GuildMember,
				evidence: (interaction.message as Message).url ?? undefined
			});

			const victimUserFormatted = victim.user.tag;

			const content = (() => {
				if (result === unmuteResponse.SUCCESS) {
					return `${emojis.success} Successfully unmuted ${Format.input(victimUserFormatted)}.`;
				} else if (result === unmuteResponse.DM_ERROR) {
					return `${emojis.warn} Unmuted ${Format.input(victimUserFormatted)} however I could not send them a dm.`;
				} else {
					return `${emojis.error} Could not unmute ${Format.input(victimUserFormatted)}: \`${result}\` .`;
				}
			})();

			return interaction.reply({
				content: content,
				ephemeral: true
			});
		}
	}
}

/**
 * The severity of the blacklisted word
 */
export const enum Severity {
	/**
	 * Delete message
	 */
	DELETE,

	/**
	 * Delete message and warn user
	 */
	WARN,

	/**
	 * Delete message and mute user for 15 minutes
	 */
	TEMP_MUTE,

	/**
	 * Delete message and mute user permanently
	 */
	PERM_MUTE
}

/**
 * Details about a blacklisted word
 */
export interface BadWordDetails {
	/**
	 * The word that is blacklisted
	 */
	match: string;

	/**
	 * The severity of the word
	 */
	severity: Severity | 1 | 2 | 3;

	/**
	 * Whether or not to ignore spaces when checking for the word
	 */
	ignoreSpaces: boolean;

	/**
	 * Whether or not to ignore case when checking for the word
	 */
	ignoreCapitalization: boolean;

	/**
	 * The reason that this word is blacklisted (used for the punishment reason)
	 */
	reason: string;

	/**
	 * Whether or not the word is regex
	 * @default false
	 */
	regex: boolean;

	/**
	 * Whether to also check a user's status and username for the phrase
	 * @default false
	 */
	userInfo: boolean;
}

/**
 * Blacklisted words mapped to their details
 */
export interface BadWords {
	[category: string]: BadWordDetails[];
}
