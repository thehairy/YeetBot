import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import  { PermissionFlagsBits, type MessageReaction, type User } from "discord.js";
import { envParseArray } from "../lib/env-parser";
import { sendLogMessage } from "../lib/utils";

@ApplyOptions<Listener.Options>({ once: false })
export class MessageEvent extends Listener {
    public constructor(context: Listener.Context, options: Listener.Options) {
        super(context, {
            ...options,
            once: false,
            event: 'messageReactionAdd'
        })
    }

    public async run(reaction: MessageReaction, user: User) {
        if (reaction.partial) {
            await reaction.fetch();
            if (reaction.message.partial) {
                await reaction.message.fetch();
            }
        }
        const member = await reaction.message.guild?.members.fetch(user.id)
        if (user.bot || member?.permissions.has(PermissionFlagsBits.Administrator)) return;
        if (!reaction.client.reportedMessages) reaction.message.client.reportedMessages = [];

        // Since we don't want any flag reactions anymore, yeet those
        if ((reaction.emoji.name?.match(/[\u{1F1E6}-\u{1F1FF}][\u{1F1E6}-\u{1F1FF}]/gu) ?? []).length > 0) {
            reaction.remove();
        } else {
            const { logger } = this.container;
            const forbiddenEmojis = envParseArray('FORBIDDEN_EMOJIS');
            const arrayForbiddenEmojis = forbiddenEmojis.filter(e => e === reaction.emoji.id || e === reaction.emoji.name);
    
            // If there is a forbidden emoji in the message
            if (arrayForbiddenEmojis.length > 0) {
                logger.info(`Received a reaction with a forbidden emoji from ${user.tag}: ${reaction.emoji}`);
                const deleted = await reaction.users.remove(user).then(() => true).catch(() => false);
                await sendLogMessage(logger, reaction.message.url, reaction.message.channel.toString(), member!, reaction.message.client, deleted, arrayForbiddenEmojis)
            }
        }
    }
}
