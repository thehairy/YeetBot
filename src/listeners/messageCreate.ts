import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import type { Message } from "discord.js";
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
        if (message.author.bot || message.member?.permissions.has('ADMINISTRATOR')) return;
        if (!message.client.reportedMessages) message.client.reportedMessages = [];

        const { logger } = this.container;
        const forbiddenEmojis = envParseArray('FORBIDDEN_EMOJIS');
        const arrayForbiddenEmojis = forbiddenEmojis.filter(e => message.content.includes(e));

        // If there is a forbidden emoji in the message
        if (arrayForbiddenEmojis.length > 0) {
            logger.info(`Received a message with a forbidden emoji from ${message.author.tag}: ${message.content}`);
            const deleted = await message.delete().then(() => true).catch(() => false);
            await sendLogMessage(logger, message.url, message.channel.toString(), message.member!, message.client, deleted, arrayForbiddenEmojis)
        }
    }
}
