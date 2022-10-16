import {
	AllowedMentions,
	BotCommand,
	emojis,
	formatUntimeoutResponse,
	Moderation,
	type ArgType,
	type CommandMessage,
	type OptArgType,
	type SlashMessage
} from '#lib';
import assert from 'assert/strict';
import { ApplicationCommandOptionType } from 'discord.js';

export default class UntimeoutCommand extends BotCommand {
	public constructor() {
		super('untimeout', {
			aliases: ['untimeout', 'remove-timeout'],
			category: 'moderation',
			description: 'Removes a timeout from a user.',
			usage: ['untimeout <user> [reason]'],
			examples: ['untimeout 1 2'],
			args: [
				{
					id: 'user',
					description: 'The user to remove a timeout from.',
					type: 'user',
					prompt: 'What user would you like to untimeout?',
					retry: '{error} Choose a valid user to untimeout.',
					slashType: ApplicationCommandOptionType.User
				},
				{
					id: 'reason',
					description: 'The reason for removing the timeout.',
					type: 'string',
					match: 'rest',
					prompt: 'Why should this user have their timeout removed?',
					retry: '{error} Choose a valid reason to remove the timeout.',
					slashType: ApplicationCommandOptionType.String,
					optional: true
				},
				{
					id: 'force',
					description: 'Override permission checks.',
					flag: '--force',
					match: 'flag',
					optional: true,
					slashType: false,
					only: 'text',
					ownerOnly: true
				}
			],
			slash: true,
			channel: 'guild',
			clientPermissions: ['ModerateMembers'],
			userPermissions: ['ModerateMembers']
		});
	}

	public override async exec(
		message: CommandMessage | SlashMessage,
		args: { user: ArgType<'user'>; reason: OptArgType<'string'>; force?: ArgType<'flag'> }
	) {
		assert(message.inGuild());
		assert(message.member);

		const member = await message.guild.members.fetch(args.user.id).catch(() => null);
		if (!member)
			return await message.util.reply(`${emojis.error} The user you selected is not in the server or is not a valid user.`);

		if (!member.isCommunicationDisabled()) return message.util.reply(`${emojis.error} That user is not timed out.`);

		const useForce = args.force && message.author.isOwner();
		const canModerateResponse = await Moderation.permissionCheck(
			message.member,
			member,
			Moderation.Action.Untimeout,
			true,
			useForce
		);

		if (canModerateResponse !== true) {
			return message.util.reply(canModerateResponse);
		}

		const responseCode = await member.customRemoveTimeout({
			reason: args.reason ?? undefined,
			moderator: message.member
		});

		return await message.util.reply({
			content: formatUntimeoutResponse(member, responseCode),
			allowedMentions: AllowedMentions.none()
		});
	}
}
