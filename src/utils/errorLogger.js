import { EmbedBuilder } from "discord.js";
import { logger } from "#utils/logger";
import { config } from "#config/config";

export async function sendErrorLog(client, error, context = {}) {
  if (!config.logging.errorLogChannelId) {
    return;
  }

  try {
    const logChannel = await client.channels.fetch(config.logging.errorLogChannelId);
    
    if (!logChannel || !logChannel.isTextBased()) {
      logger.warn("ErrorLogger", "Error log channel not found or is not a text channel");
      return;
    }

    const { 
      commandName = "Unknown", 
      userId = "Unknown", 
      username = "Unknown",
      guildId = "Unknown", 
      guildName = "Unknown",
      commandType = "Unknown"
    } = context;

    const errorMessage = error.message || "No error message";
    const errorStack = error.stack || "No stack trace";

    const embed = new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle("⚠️ Command Error")
      .addFields(
        { name: "Command", value: `\`${commandName}\``, inline: true },
        { name: "Type", value: commandType, inline: true },
        { name: "User", value: `<@${userId}> (${username})`, inline: false },
        { name: "Guild", value: `${guildName} (\`${guildId}\`)`, inline: false },
        { name: "Error Message", value: `\`\`\`${errorMessage.slice(0, 1000)}\`\`\``, inline: false }
      )
      .setTimestamp();

    // Add stack trace if it fits
    if (errorStack.length <= 1024) {
      embed.addFields({ name: "Stack Trace", value: `\`\`\`${errorStack}\`\`\``, inline: false });
    } else {
      embed.addFields({ name: "Stack Trace", value: `\`\`\`${errorStack.slice(0, 1000)}...\`\`\``, inline: false });
    }

    await logChannel.send({ embeds: [embed] });
  } catch (logError) {
    logger.error("ErrorLogger", "Failed to send error log", logError);
  }
}
