import {
	container,
	type ChatInputCommandSuccessPayload,
	type Command,
	type ContextMenuCommandSuccessPayload,
	type MessageCommandSuccessPayload,
	type ILogger
} from '@sapphire/framework';
import { cyan } from 'colorette';
import { EmbedBuilder, type APIUser, type Guild, type User, type Message, type GuildMember, type Client, type GuildTextBasedChannel } from 'discord.js';
import { envParseArray } from './env-parser';

export function logSuccessCommand(payload: ContextMenuCommandSuccessPayload | ChatInputCommandSuccessPayload | MessageCommandSuccessPayload): void {
	let successLoggerData: ReturnType<typeof getSuccessLoggerData>;

	if ('interaction' in payload) {
		successLoggerData = getSuccessLoggerData(payload.interaction.guild, payload.interaction.user, payload.command);
	} else {
		successLoggerData = getSuccessLoggerData(payload.message.guild, payload.message.author, payload.command);
	}

	container.logger.debug(`${successLoggerData.shard} - ${successLoggerData.commandName} ${successLoggerData.author} ${successLoggerData.sentAt}`);
}

export function getSuccessLoggerData(guild: Guild | null, user: User, command: Command) {
	const shard = getShardInfo(guild?.shardId ?? 0);
	const commandName = getCommandInfo(command);
	const author = getAuthorInfo(user);
	const sentAt = getGuildInfo(guild);

	return { shard, commandName, author, sentAt };
}

export async function sendLogMessage(logger: ILogger, url: string, channel: string, member: GuildMember, client: Client, deleted: boolean, emojis: string[]) {
    let count = 1;
    let previousEmojis: string[] | Set<string> = [];
    let timedOut = '';

    // Find previous reported message
    const ref = client.reportedMessages.find(i => i.id === member.id);
    const addToMessage = ref && ref.lastReport + 600000 > Date.now() && ref.inChannel === channel;
    if (ref && !addToMessage) {
        // Remove item from array if more than 5 minutes passed
        client.reportedMessages.splice(client.reportedMessages.indexOf(ref), 1);
    } else if (addToMessage) {
        // Add previous count to current count
        count += ref.count;
        previousEmojis = ref.emojis;
    }

    // If the user did it more than 4 times, timeout for a day
    if (count > 4) {
        await member?.timeout(8.64e+7).then(() => timedOut = ' | User was timed out').catch(() => timedOut = ' | User could not be timed out')
    }

    previousEmojis.push(...emojis);
    previousEmojis = [...(new Set(previousEmojis))];

    // Generate embed to send/edit
    const embed = new EmbedBuilder()
    .setTitle('Forbidden Emoji detected')
    .setDescription(`A blocked emoji has been detected [here](${url})`)
    .addFields(
            { name: 'User', value: `${member.user.tag} (${member.id})` },
            { name: 'Emoji', value: previousEmojis.map(i => Number.isNaN(i) ? i : client.emojis.cache.get(i) || i).join(' '), inline: true },
            { name: 'Channel', value: channel, inline: true },
            { name: 'Count', value: `${count}`, inline: true })
    .setFooter({ text: `Emoji was ${deleted ? 'removed' : 'not removed'}${timedOut}` })
    .setColor(deleted ? 'Green' : 'Red');

    if (addToMessage) {
        // Iterate over sent messages and edit each
        for (const msg of ref.messageRefs) {
            msg.edit({ embeds: [embed]}).catch((err: any) => logger.error(err));
        }
        ref.count = count;
    } else {
        // Send embed in each log channel, then add the message to an array of messages
        let messageRefs: Message[] = [];
        const logChannels = envParseArray('LOG_CHANNELS');
        for (const channel of logChannels) {
            const sentMessage = await (client.channels.cache.get(channel) as GuildTextBasedChannel).send({ embeds: [embed] });
            messageRefs.push(sentMessage);
        }
        client.reportedMessages.push({ id: member.id, count, emojis: previousEmojis, messageRefs, lastReport: Date.now(), inChannel: channel})
    }
}

function getShardInfo(id: number) {
	return `[${cyan(id.toString())}]`;
}

function getCommandInfo(command: Command) {
	return cyan(command.name);
}

function getAuthorInfo(author: User | APIUser) {
	return `${author.username}[${cyan(author.id)}]`;
}

function getGuildInfo(guild: Guild | null) {
	if (guild === null) return 'Direct Messages';
	return `${guild.name}[${cyan(guild.id)}]`;
}
