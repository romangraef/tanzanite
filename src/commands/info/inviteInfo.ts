import { Arg, ArgType, BotCommand, colors, type CommandMessage, type SlashMessage } from '#lib';
import { ApplicationCommandOptionType, EmbedBuilder, Invite } from 'discord.js';

export default class InviteInfoCommand extends BotCommand {
	public constructor() {
		super('inviteInfo', {
			aliases: ['invite-info', 'ii'],
			category: 'info',
			description: 'Get info about an invite.',
			usage: ['invite-info [invite]'],
			examples: ['invite-info discord.gg/moulberry'],
			args: [
				{
					id: 'invite',
					description: 'The guild to find information about.',
					type: 'invite',
					prompt: 'What invite would you like to find information about?',
					retry: '{error} Choose a valid invite to find information about.',
					slashType: ApplicationCommandOptionType.String
				}
			],
			slash: true,
			hidden: true,
			clientPermissions: ['EmbedLinks'],
			clientCheckChannel: true,
			userPermissions: []
		});
	}

	public override async exec(message: CommandMessage | SlashMessage, args: { invite: ArgType<'invite' | 'string'> }) {
		const invite = message.util.isSlashMessage(message)
			? ((await Arg.cast('invite', message, args.invite as string)) as ArgType<'invite'>)
			: (args.invite as Invite);

		const inviteInfoEmbed = new EmbedBuilder().setTitle(`Invite to ${invite.guild!.name}`).setColor(colors.default);

		this.generateAboutField(inviteInfoEmbed, invite);
	}

	private generateAboutField(embed: EmbedBuilder, invite: Invite) {
		const about = [`**code:** ${invite.code}`, `**channel:** ${invite.channel!.name}`];

		embed.addFields({ name: '» About', value: about.join('\n') });
	}
}
