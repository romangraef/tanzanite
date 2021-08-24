import { BushListener } from '@lib';
import { ClientEvents } from 'discord.js';

export default class InteractionCreateListener extends BushListener {
	public constructor() {
		super('interactionCreate', {
			emitter: 'client',
			event: 'interactionCreate',
			category: 'client'
		});
	}

	public override async exec(...[interaction]: ClientEvents['interactionCreate']): Promise<unknown> {
		if (!interaction) return;
		if (interaction.isCommand()) {
			void client.console.info(
				'SlashCommand',
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
			if (interaction.customId.startsWith('paginate_')) return;
			return await interaction.reply({ content: 'Buttons go brrr', ephemeral: true });
		} else if (interaction.isSelectMenu()) {
			return await interaction.reply({
				content: `You selected ${
					Array.isArray(interaction.values)
						? util.oxford(util.surroundArray(interaction.values, '`'), 'and', '')
						: `\`${interaction.values}\``
				}.`,
				ephemeral: true
			});
		} /* else if (interaction.isContextMenu()) {
			if (interaction.commandName === 'View Raw') {
				await interaction.deferReply({ ephemeral: true });
				const embed = await ViewRawCommand.getRawData(interaction.options.getMessage('message') as BushMessage, {
					json: false,
					js: false
				});
				return await interaction.editReply({ embeds: [embed] });
			}
		} */
	}
}
