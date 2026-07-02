import { Command } from "#structures/classes/Command";
import {
  ContainerBuilder,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
  ThumbnailBuilder,
  EmbedBuilder
} from "discord.js";
import { config } from "#config/config";
import emoji from "#config/emoji";
import { logger } from "#utils/logger";

class SuggestCommand extends Command {
  constructor() {
    super({
      name: "suggest",
      description: "Suggest new features or improvements for the bot.",
      usage: "suggest <your suggestion>",
      aliases: ["suggestion", "feature", "request"],
      category: "info",
      examples: ["suggest Add spotify playlist import", "suggestion Volume boost feature"],
      cooldown: 30,
      enabledSlash: true,
      slashData: {
        name: "suggest",
        description: "Suggest new features or improvements for the bot.",
        options: [
          {
            name: "suggestion",
            type: 3,
            description: "Your feature suggestion or improvement idea",
            required: true,
          },
        ],
      },
    });
  }

  async execute({ client, message, args }) {
    try {
      if (!args.length) {
        return await message.reply({
          components: [this._createUsageContainer()],
          flags: MessageFlags.IsComponentsV2,
        });
      }

      const suggestionText = args.join(" ");
      const success = await this._sendSuggestion(client, message.author, suggestionText, message.guild);

      if (success) {
        await message.reply({
          components: [this._createSuccessContainer()],
          flags: MessageFlags.IsComponentsV2,
        });
      } else {
        await message.reply({
          components: [this._createErrorContainer("Failed to send suggestion. Please try again later.")],
          flags: MessageFlags.IsComponentsV2,
        });
      }
    } catch (error) {
      logger.error("SuggestCommand", `Error in prefix command: ${error.message}`, error);
      await message
        .reply({
          components: [this._createErrorContainer("An error occurred while sending suggestion.")],
          flags: MessageFlags.IsComponentsV2,
        })
        .catch(() => {});
    }
  }

  async slashExecute({ client, interaction }) {
    try {
      const suggestionText = interaction.options.getString("suggestion");
      const success = await this._sendSuggestion(client, interaction.user, suggestionText, interaction.guild);

      if (success) {
        await interaction.reply({
          components: [this._createSuccessContainer()],
          flags: MessageFlags.IsComponentsV2,
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          components: [this._createErrorContainer("Failed to send suggestion. Please try again later.")],
          flags: MessageFlags.IsComponentsV2,
          ephemeral: true,
        });
      }
    } catch (error) {
      logger.error("SuggestCommand", `Error in slash command: ${error.message}`, error);
      const errorPayload = {
        components: [this._createErrorContainer("An error occurred while sending suggestion.")],
        ephemeral: true,
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply(errorPayload).catch(() => {});
      } else {
        await interaction.reply(errorPayload).catch(() => {});
      }
    }
  }

  async _sendSuggestion(client, user, suggestion, guild) {
    try {
      const channelId = "1421887417174196304"; // <-- replace with your channel ID
      const channel = await client.channels.fetch(channelId).catch(() => null);
      if (!channel) return false;

      const embed = new EmbedBuilder()
        .setTitle("New Suggestion Received")
        .setDescription(
          `**Suggestion:** ${suggestion}\n\n` +
          `**User:** ${user.tag} (${user.id})\n` +
          `**Server:** ${guild ? `${guild.name} (${guild.id})` : "Direct Message"}\n` +
          `**Date:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
          `Crystal Music Suggestion System`
        )
        .setThumbnail(user.displayAvatarURL({ size: 256 }))
        // no .setColor() → default embed color is used
        ;

      await channel.send({ embeds: [embed] });
      return true;
    } catch (error) {
      logger.error("SuggestCommand", `Error sending suggestion: ${error.message}`, error);
      return false;
    }
  }

  _createSuccessContainer() {
    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`${emoji.get("check")} **Suggestion Sent**`)
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    const content =
      `**Thank you for your suggestion!**\n\n` +
      `Your feature idea has been sent to our developers.\n` +
      `We'll review it for future updates.\n\n` +
      `*Helping shape Crystal's future features!*`;

    const section = new SectionBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
      .setThumbnailAccessory(
        new ThumbnailBuilder().setURL(
          config.assets?.defaultThumbnail || config.assets?.defaultTrackArtwork
        )
      );

    container.addSectionComponents(section);

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    return container;
  }

  _createUsageContainer() {
    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`${emoji.get("info")} **Suggestion Usage**`)
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    const content =
      `**How to suggest features:**\n\n` +
      `**Usage:** \`suggest <idea>\`\n` +
      `**Example:** \`suggest Add playlist support\`\n\n` +
      `*Help us build features you want to see!*`;

    const section = new SectionBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
      .setThumbnailAccessory(
        new ThumbnailBuilder().setURL(
          config.assets?.defaultThumbnail || config.assets?.defaultTrackArtwork
        )
      );

    container.addSectionComponents(section);

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    return container;
  }

  _createErrorContainer(message) {
    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`${emoji.get("cross")} **Error**`)
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    const section = new SectionBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(message))
      .setThumbnailAccessory(
        new ThumbnailBuilder().setURL(
          config.assets?.defaultThumbnail || config.assets?.defaultTrackArtwork
        )
      );

    container.addSectionComponents(section);

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    return container;
  }
}

export default new SuggestCommand();
