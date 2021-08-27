import { BushListener } from '@lib';
import { BushClientEvents } from '../../lib/extensions/discord.js/BushClientEvents';

export default class InteractionCreateListener extends BushListener {
	public constructor() {
		super('interactionCreate', {
			emitter: 'client',
			event: 'interactionCreate',
			category: 'client'
		});
	}

	public override async exec(...[interaction]: BushClientEvents['interactionCreate']): Promise<unknown> {
		if (!interaction) return;
		if (interaction.isCommand()) {
			void client.console.info(
				'slashCommand',
				`The <<${interaction.commandName}>> command was used by <<${interaction.user.tag}>> in <<${
					interaction.channel
						? interaction.channel.type == 'DM'
							? interaction.channel.recipient + 's DMs'
							: interaction.channel.name
						: 'unknown'
				}>>.`
			);
			return;
		} else if (interaction.isButton()) {
			if (interaction.customId.startsWith('paginate_') || interaction.customId.startsWith('command_')) return;
			return await interaction.reply({ content: 'Buttons go brrr', ephemeral: true });
		} else if (interaction.isSelectMenu()) {
			if (interaction.customId.startsWith('command_')) return;
			return await interaction.reply({
				content: `You selected ${
					Array.isArray(interaction.values)
						? util.oxford(util.surroundArray(interaction.values, '`'), 'and', '')
						: `\`${interaction.values}\``
				}.`,
				ephemeral: true
			});
		}
	}
}
