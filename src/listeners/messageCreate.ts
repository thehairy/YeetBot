import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import type { Message } from "discord.js";
import { envParseArray } from "../lib/env-parser";
import { sendLogMessage } from "../lib/utils";
import type { ThreadChannel } from "discord.js";

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
        if (arrayForbiddenEmojis.length > 0 && !message.member?.permissions.has('ADMINISTRATOR')) {
            logger.info(`Received a message with a forbidden emoji from ${message.author.tag}: ${message.content}`);
            const deleted = await message.delete().then(() => true).catch(() => false);
            await sendLogMessage(logger, message.url, message.channel.toString(), message.member!, message.client, deleted, arrayForbiddenEmojis)
        } else {
            // 11-bit studios specific:
            if (message.channel.id === '1000374509456593046' && !message.member?.roles.cache.has('973966310872596521')) {
                await message.member?.roles.add('973966310872596521').catch(() => {});
                await message.reply('Role added :)');
                await (message.channel as ThreadChannel).members.remove(message.author.id);
            }
        }
    }
}
