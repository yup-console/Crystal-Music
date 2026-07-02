import { EmbedBuilder } from "discord.js";
import { logger } from "#utils/logger";
import { config } from "#config/config";

export default {
  name: "guildDelete",
  once: false,
  async execute(guild, client) {
    logger.info("GuildDelete", `Bot removed from guild: ${guild.name} (${guild.id})`);

    if (!config.logging.guildLogChannelId) {
      return;
    }

    try {
      const logChannel = await client.channels.fetch(config.logging.guildLogChannelId);
      
      if (!logChannel || !logChannel.isTextBased()) {
        logger.warn("GuildDelete", "Guild log channel not found or is not a text channel");
        return;
      }

      const totalUsers = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
      

      const embed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("❌ Bot Removed from Server")
        .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }) || null)
        .addFields(
          { name: "Server Name", value: guild.name, inline: true },
          { name: "Server ID", value: guild.id, inline: true },
          { name: "Owner", value: `<@${guild.ownerId}>`, inline: true },
          { name: "Member Count", value: guild.memberCount.toString(), inline: true },
          { name: "Bot was in server for", value: `<t:${Math.floor(guild.joinedTimestamp / 1000)}:R>`, inline: true },
          { 
            name: "📊 Stats",
            value: `Servers: **${client.guilds.cache.size}**\nUsers: **${totalUsers}**`,
            inline: true }
        )
        .setTimestamp();

      await logChannel.send({ embeds: [embed] });
    } catch (error) {
      logger.error("GuildDelete", "Failed to send guild log", error);
    }
  },
};
