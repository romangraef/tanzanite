import { BotListener, colors, Emitter, humanizeDuration, TanzaniteEvent, type BotClientEvents } from '#lib';
import { EmbedBuilder, GuildMember } from 'discord.js';

export default class CustomBlockListener extends BotListener {
	public constructor() {
		super(TanzaniteEvent.Block, {
			emitter: Emitter.Client,
			event: TanzaniteEvent.Block
		});
	}

	public async exec(
		...[victim, moderator, guild, reason, caseID, duration, dmSuccess, channel]: BotClientEvents[TanzaniteEvent.Block]
	) {
		const logChannel = await guild.getLogChannel('moderation');
		if (!logChannel) return;
		const user = victim instanceof GuildMember ? victim.user : victim;

		const logEmbed = new EmbedBuilder()
			.setColor(colors.Purple)
			.setTimestamp()
			.setFooter({ text: `CaseID: ${caseID}` })
			.setAuthor({ name: user.tag, iconURL: user.avatarURL({ extension: 'png', size: 4096 }) ?? undefined })
			.addFields(
				{ name: '**Action**', value: `${duration ? 'Temp Block' : 'Perm Block'}` },
				{ name: '**Channel**', value: `<#${channel.id}>` },
				{ name: '**User**', value: `${user} (${user.tag})` },
				{ name: '**Moderator**', value: `${moderator} (${moderator.tag})` },
				{ name: '**Reason**', value: `${reason ? reason : '[No Reason Provided]'}` }
			);

		if (duration) logEmbed.addFields({ name: '**Duration**', value: `${humanizeDuration(duration) || duration}` });
		if (dmSuccess === false) logEmbed.addFields({ name: '**Additional Info**', value: 'Could not dm user.' });
		return await logChannel.send({ embeds: [logEmbed] });
	}
}
