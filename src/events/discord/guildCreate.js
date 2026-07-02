import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { logger } from "#utils/logger";
import { config } from "#config/config";

export default {
  name: "guildCreate",
  once: false,

  async execute(guild, client) {
    logger.info("GuildCreate", `Bot joined guild: ${guild.name} (${guild.id})`);

    if (!config.logging.guildLogChannelId) return;

    try {
      const logChannel = await client.channels.fetch(config.logging.guildLogChannelId);
      if (!logChannel || !logChannel.isTextBased()) {
        logger.warn("GuildCreate", "Guild log channel not found or is not a text channel");
        return;
      }

      // Count total users across all servers
      const totalUsers = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);

      // Build the embed
      const embed = new EmbedBuilder()
        .setColor("#00FF00")
        .setTitle("✅ Bot Added to Server")
        .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }) || null)
        .addFields(
          { name: "Server Name", value: guild.name, inline: true },
          { name: "Server ID", value: guild.id, inline: true },
          { name: "Owner", value: `<@${guild.ownerId}>`, inline: true },
          { name: "Member Count", value: guild.memberCount.toString(), inline: true },
          { name: "Created At", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true },
          {
            name: "📊 Stats",
            value: `Servers: **${client.guilds.cache.size}**\nUsers: **${totalUsers}**`,
            inline: true
          }
        )
        .setTimestamp();

      // Send embed + invite link in a single message
      await logChannel.send({
        embeds: [embed]
      });
    } catch (error) {
      logger.error("GuildCreate", "Failed to send guild log", error);
    }
  },
};
