import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { Message, PermissionFlagsBits, ChannelType } from "discord.js";
import { envParseArray } from "../lib/env-parser";
import { sendLogMessage } from "../lib/utils";

@ApplyOptions<Listener.Options>({ once: false })
export class MessageEvent extends Listener {
    public constructor(context: Listener.Context, options: Listener.Options) {
        super(context, {
            ...options,
            once: false,
            event: 'messageCreate'
        })
    }

    public async run(message: Message) {
        if (message.author.bot) return;
        if (!message.client.reportedMessages) message.client.reportedMessages = [];

        const { logger } = this.container;
        const forbiddenEmojis = envParseArray('FORBIDDEN_EMOJIS');
        const arrayForbiddenEmojis = forbiddenEmojis.filter(e => message.content.includes(e));

        // If there is a forbidden emoji in the message
        if (arrayForbiddenEmojis.length > 0 && !message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
            logger.info(`Received a message with a forbidden emoji from ${message.author.tag}: ${message.content}`);
            const deleted = await message.delete().then(() => true).catch((err) => {console.log(err); return false});
            await sendLogMessage(logger, message.url, message.channel.toString(), message.member!, message.client, deleted, arrayForbiddenEmojis)
        } else {
            // 11-bit studios specific:
            const check = message.content.toLowerCase();
            let bool = (check.match(/(fp2|frostpunk2|frostpunk 2|fp 2)/gm) ?? []).length > 0;
            bool &&= (check.match(/(when)/gm) ?? []).length > 0;
            if (bool) {
                const channel = message.client.channels.cache.get('1070297157539741727');
                if (!channel || channel.type !== ChannelType.GuildText) return;

                const messages = await channel.messages.fetch({ limit: 100 });
                const target = messages.filter(m => m.id !== message.client.lastGif).random();
                await message.reply(target?.attachments.first()?.url ?? 'how')
                message.client.lastGif = target?.id;
            }
        }
    }
}
