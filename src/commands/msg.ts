import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import type { ReplyOptions } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'Say something as the bot'
})
export class UserCommand extends Command {
	// Register Chat Input and Context Menu command
	public override registerApplicationCommands(registry: Command.Registry) {
		// Register Chat Input command
		registry.registerChatInputCommand((builder) => 
			builder.setName(this.name)
				.setDescription(this.description)
				.addStringOption(option => option.setName('content').setDescription('The content to say').setRequired(true))
				.addStringOption(option => option.setName('message').setDescription('The message to reply to (id)').setRequired(false))
				.setDefaultMemberPermissions(1 << 2)
				.setDMPermission(false)
		);
	}

	// Chat Input (slash) command
	public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.sendMessage(interaction);
	}

	private async sendMessage(interaction: Command.ChatInputCommandInteraction) {
		await interaction.deferReply({ ephemeral: true });

        const content = interaction.options.getString('content', true);
		const message = interaction.options.getString('message');

		let reply: ReplyOptions | undefined = undefined;
		if (message) {
			reply = { messageReference: message, failIfNotExists: false }
		}

		const msg = await interaction.channel?.send({ content, reply, flags: 4096});
		return interaction.editReply({ content: `[Message](${msg?.url}) sent.` })
	}
}
