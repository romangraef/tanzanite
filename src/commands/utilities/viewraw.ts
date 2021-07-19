import { Argument, Constants } from 'discord-akairo';
import { DMChannel, Message, MessageEmbed, NewsChannel, Snowflake, TextChannel } from 'discord.js';
import { inspect } from 'util';
import { BushCommand, BushMessage, BushSlashMessage } from '../../lib';

export default class ViewRawCommand extends BushCommand {
	public constructor() {
		super('viewraw', {
			aliases: ['viewraw'],
			category: 'utilities',
			clientPermissions: ['EMBED_LINKS'],
			description: {
				usage: 'viewraw <message id> <channel>',
				examples: ['viewraw 322862723090219008'],
				content: 'Gives information about a specified user.'
			},
			args: [
				{
					id: 'message',
					type: Argument.union(Constants.ArgumentTypes.MESSAGE, Constants.ArgumentTypes.BIGINT),
					match: Constants.ArgumentMatches.PHRASE,
					prompt: {
						start: 'What message would you like to view?',
						retry: '{error} Choose a valid message.',
						optional: false
					}
				},
				{
					id: 'channel',
					type: Constants.ArgumentTypes.CHANNEL,
					match: Constants.ArgumentMatches.PHRASE,
					prompt: {
						start: 'What channel is the message in?',
						retry: '{error} Choose a valid channel.',
						optional: true
					},
					default: (m) => m.channel
				},
				{
					id: 'json',
					match: Constants.ArgumentMatches.FLAG,
					flag: '--json'
				}
			]
		});
	}

	public async exec(
		message: BushMessage | BushSlashMessage,
		args: { message: Message | BigInt; channel: TextChannel | NewsChannel | DMChannel; json?: boolean }
	): Promise<unknown> {
		let newMessage: Message | 0;
		if (!(typeof args.message === 'object')) {
			newMessage = await args.channel.messages.fetch(`${args.message}` as Snowflake).catch(() => {
				return 0;
			});
			if (!newMessage) {
				return await message.util.reply(
					`${this.client.util.emojis.error} There was an error fetching that message, try supplying a channel.`
				);
			}
		} else {
			newMessage = args.message as Message;
		}
		const content = args.json ? inspect(newMessage.toJSON()) || '[No Content]' : newMessage.content || '[No Content]';
		const messageEmbed = new MessageEmbed()
			.setFooter(newMessage.author.tag, newMessage.author.avatarURL({ dynamic: true }))
			.setTimestamp(newMessage.createdTimestamp)
			.setColor(newMessage.member?.roles?.color?.color || this.client.util.colors.default)
			.setTitle('Raw Message Information')
			.setDescription(await this.client.util.codeblock(content, 2048, 'js'));

		return await message.util.reply({ embeds: [messageEmbed] });
	}
}