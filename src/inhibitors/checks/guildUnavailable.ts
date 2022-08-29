import { BotInhibitor, type SlashMessage } from '#lib';
import { type Message } from 'discord.js';

export default class GuildUnavailableInhibitor extends BotInhibitor {
	public constructor() {
		super('guildUnavailable', {
			reason: 'guildUnavailable',
			type: 'all',
			priority: 70
		});
	}

	public async exec(message: Message | SlashMessage): Promise<boolean> {
		if (message.inGuild() && !message.guild.available) {
			void this.client.console.verbose(
				'guildUnavailable',
				`Blocked message with id <<${message.id}>> from <<${message.author.tag}>> in <<${message.guild.name}>>.`
			);
			return true;
		}
		return false;
	}
}
