import {ArgType, BotCommand, colors, CommandMessage, OptArgType, SlashMessage} from "#lib";
import {ApplicationCommandOptionType} from "discord-api-types/v10";
import {ConfigOption, latestData as neuConfigData, NEUFileLocation} from '#src/services/neumeta.ts';


export default class NeuConfigSearch extends BotCommand {
    public constructor() {
        super('neuconfig', {
            aliases: ["neuconfig", "neucfg", "neuoption"],
            category: "Moulberry's Bush",
            description: 'Query config options of the NEU mod',
            usage: ['neuconfig [configName]', 'neuconfig [configSearch]'],
            examples: ['neuconfig doOamNotif'],
            args: [
                {
                    id: 'search',
                    optional: false,
                    description: "Search term to find.",
                    type: 'string',
                    slashType: ApplicationCommandOptionType.String,
                    // autocomplete: true
                },
            ],
            slash: true,
            clientPermissions: ['EmbedLinks'],
            clientCheckChannel: true,
            userPermissions: [],
        });
    }

    findOptionByFullPath(category: string, option: string): ConfigOption | null {
        category = category.toLowerCase();
        option = option.toLowerCase();
        return neuConfigData.categories
            .find(it => it.useReference.member.toLowerCase() === category)
            ?.options
            ?.find(it => it.reference.member.toLowerCase() === option) ?? null;
    }


    public override async exec(message: CommandMessage | SlashMessage, args: { search: ArgType<'string'> }) {
        const fullPath = args.search.match(/([^.]).([^.]+)/);
        if (fullPath) {
            let result = this.findOptionByFullPath(fullPath[1], fullPath[2]);
            if (result) {
                await this.showResult(message, result);
            }
        }
    }


    getUrl(location: NEUFileLocation): string {
        return `https://github.com/NotEnoughUpdates/NotEnoughUpdates/blob/master/${location.filename}`
            + (location.line ? `#L${location.line}` : '');
    }

    async showResult(message: CommandMessage | SlashMessage, result: ConfigOption) {
        await message.reply({
            embeds: [
                {
                    title: result.name,
                    color: colors.default,
                    description: result.description,
                    url: this.getUrl(result.location),
                    fields: [
                    ],
                }
            ]
        })
    }
}