import './lib/setup';
import { LogLevel, SapphireClient } from '@sapphire/framework';
/* @ts-ignore */
import type { Client, Message } from 'discord.js';

declare module 'discord.js' {
    interface Client {
        reportedMessages: { id: string, count: number, emojis: string[], messageRefs: Message[], lastReport: number }[];
    }
}

const client = new SapphireClient({
	defaultPrefix: '!',
	regexPrefix: /^(hey +)?bot[,! ]/i,
	caseInsensitiveCommands: true,
	logger: {
		level: LogLevel.Debug
	},
	shards: 'auto',
	intents: [
		'GUILDS',
		'GUILD_MEMBERS',
		'GUILD_EMOJIS_AND_STICKERS',
		'GUILD_MESSAGES',
		'GUILD_MESSAGE_REACTIONS',
        'MESSAGE_CONTENT'
	],
	partials: ['CHANNEL', 'MESSAGE', 'REACTION'],
	loadMessageCommandListeners: true
});

const main = async () => {
	try {
		client.logger.info('Logging in');
		await client.login();
		client.logger.info('logged in');
	} catch (error) {
		client.logger.fatal(error);
		client.destroy();
		process.exit(1);
	}
};

main();
