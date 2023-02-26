import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { EmbedBuilder, GuildMember, time } from "discord.js";

@ApplyOptions<Listener.Options>({ once: false })
export class GuildMemberLeaveEvent extends Listener {
    public constructor(context: Listener.Context, options: Listener.Options) {
        super(context, {
            ...options,
            once: false,
            event: 'guildMemberRemove'
        })
    }

    public async run(member: GuildMember) {
        const logChannel = member.guild.channels.cache.get('451046804385955861');
        if (!logChannel || !logChannel.isTextBased() || !member.joinedAt) return;

        const left = new Date();
        const embed = new EmbedBuilder()
            .setAuthor({ name: `${member.user.tag} (${member.id})`, iconURL: member.user.displayAvatarURL() })
            .setDescription(`
            • Username: ${member.toString()} - \`${member.user.tag}\` (${member.id})
            • Created: ${time(member.user.createdAt, 'f')} (${time(member.user.createdAt, 'R')}) \`${member.user.createdTimestamp}\`
            • Joined: ${time(member.joinedAt, 'f')} (${time(member.joinedAt, 'R')}) \`${member.joinedTimestamp}\`
            • Left: ${time(left, 'f')} (${time(left, 'R')}) \`${left.getTime()}\`
            `)
            .setTimestamp(new Date())
            .setFooter({ text: 'User left' })
            .setColor('#36393F')

        logChannel.send({ embeds: [embed] });
    }
}
