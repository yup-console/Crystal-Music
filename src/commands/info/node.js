// commands/node.js
import { Command } from "#structures/classes/Command";
import {
  ContainerBuilder,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
  ThumbnailBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} from "discord.js";
import { logger } from "#utils/logger";
import emoji from "#config/emoji";
import { config } from "#config/config";
import os from "os";

class NodeStatsCommand extends Command {
  constructor() {
    super({
      name: "node",
      description: "Show Lavalink node statistics",
      aliases: ["nodes", "lavastats", "ls", "lavalink"],
      category: "info",
      cooldown: 5,
      enabledSlash: true,
      slashData: {
        name: "node",
        description: "Show Lavalink node statistics"
      }
    });
  }

  async execute({ client, message }) {
    try {
      const container = this._createStatsContainer(client);
      await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      logger.error("NodeStatsCommand", "Error creating stats container:", err);
      console.error("Full error stack:", err);
      await message.reply({
        components: [this._createErrorContainer("Failed to fetch node stats.")],
        flags: MessageFlags.IsComponentsV2
      });
    }
  }

  async slashExecute({ client, interaction }) {
    try {
      const container = this._createStatsContainer(client);
      await interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      logger.error("NodeStatsCommand", err);
      const payload = {
        components: [this._createErrorContainer("Failed to fetch node stats.")],
        ephemeral: true,
        flags: MessageFlags.IsComponentsV2
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply(payload).catch(() => {});
      } else {
        await interaction.reply(payload).catch(() => {});
      }
    }
  }

  _createStatsContainer(client) {
    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`${emoji.get?.("music") ?? "🎵"} **Lavalink Node Stats**`)
    );
    container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));

    const lavalink = client.music?.lavalink;
    if (!client.music?.initialized || !lavalink) {
      return this._createErrorContainer("Lavalink isn't initialized.");
    }

    const nodes = [...(lavalink.nodeManager?.nodes?.values?.() ?? [])];
    if (!nodes.length) {
      return this._createErrorContainer("No Lavalink nodes are connected.");
    }

    for (const node of nodes) {
      const stats = node.stats ?? {};
      const uptimeMs = stats.uptime ?? 0;
      const uptime = this._formatMS_HHMMSS(uptimeMs);

      const mem = stats.memory
        ? `${(stats.memory.used / 1024 / 1024).toFixed(2)} MB / ${(stats.memory.allocated / 1024 / 1024).toFixed(2)} MB`
        : "N/A";

      const cpu = stats.cpu
        ? `${(stats.cpu.systemLoad * 100).toFixed(2)}% system / ${(stats.cpu.lavalinkLoad * 100).toFixed(2)}% app`
        : "N/A";

      const nodePlayers = stats.players ?? 0;
      const playingPlayers = stats.playingPlayers ?? 0;

      const section = new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `**Node:** Main-Node\n` +
            `**Connected:** ${node.connected ? "<a:online:1422434363634876426>" : "<a:offline:1422434366298263674>"}\n` +
            `**Node Uptime:** ${uptime}\n` +
            `**Node CPU Usage:** ${cpu}\n` +
            `**Node RAM Usage:** ${mem}\n` +
            `**Total Players:** ${nodePlayers}\n` +
            `**Playing Music:** ${playingPlayers}`
          )
        )
        .setThumbnailAccessory(
          new ThumbnailBuilder().setURL(config.assets?.defaultThumbnail || "https://via.placeholder.com/150")
        );

      container.addSectionComponents(section);
      container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
    }

    // --- Bot Host Stats ---
    const up = Math.floor(client.uptime / 1000);
    const botUptime = `${Math.floor(up / 3600)}h ${Math.floor((up % 3600) / 60)}m ${up % 60}s`;
    const usedMem = ((os.totalmem() - os.freemem()) / 1024 / 1024).toFixed(2);
    const totalMem = (os.totalmem() / 1024 / 1024).toFixed(2);
    const load = (os.loadavg()[0] || 0).toFixed(2);
    const cpuModel = os.cpus()?.[0]?.model ?? "Unknown";
    const cpuCores = os.cpus()?.length ?? 0;

    const systemSection = new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**Bot Uptime:** ${botUptime}\n` +
          `**Host CPU:** ${cpuModel} (${cpuCores} cores)\n` +
          `**Host Load (1 m):** ${load}\n` +
          `**Host RAM:** ${usedMem} MB / ${totalMem} MB`
        )
      )
      .setThumbnailAccessory(
        new ThumbnailBuilder().setURL(config.assets?.defaultThumbnail || "https://via.placeholder.com/150")
      );
    container.addSectionComponents(systemSection);

    // --- Support Button ---
    const supportEmoji = emoji.get?.("support") || emoji.get?.("info");
    const button = new ButtonBuilder()
      .setLabel("Support Server")
      .setStyle(ButtonStyle.Link)
      .setURL("https://discord.gg/rx9N62DTgW");
    
    if (supportEmoji) {
      button.setEmoji(supportEmoji);
    }
    
    const row = new ActionRowBuilder().addComponents(button);
    container.addActionRowComponents(row);

    return container;
  }

  _createErrorContainer(msg) {
    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`${emoji.get?.("cross") ?? "❌"} **Error**`)
    );
    container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));

    const section = new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(msg)
      )
      .setThumbnailAccessory(
        new ThumbnailBuilder().setURL(config.assets?.defaultThumbnail || "https://via.placeholder.com/150")
      );
    container.addSectionComponents(section);

    return container;
  }

  _formatMS_HHMMSS(ms) {
    const seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return hours > 0
      ? `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
      : `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }
}

export default new NodeStatsCommand();
