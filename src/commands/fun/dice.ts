import { BotCommand, type CommandMessage, type SlashMessage } from '#lib';

export default class DiceCommand extends BotCommand {
	public constructor() {
		super('dice', {
			aliases: ['dice', 'die'],
			category: 'fun',
			description: 'Roll virtual dice.',
			usage: ['dice'],
			examples: ['dice'],
			clientPermissions: [],
			userPermissions: [],
			slash: true
		});
	}

	public override async exec(message: CommandMessage | SlashMessage) {
		const responses = ['1', '2', '3', '4', '5', '6'];
		const answer = responses[Math.floor(Math.random() * responses.length)];
		return await message.util.reply(`You rolled a **${answer}**.`);
	}
}
