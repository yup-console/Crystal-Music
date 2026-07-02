import { Command } from "#structures/classes/Command";
import { EmbedBuilder } from "discord.js";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Database setup
const dbPath = path.resolve("src/database/data/afk.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);

// Create table if not exists
db.prepare(`
  CREATE TABLE IF NOT EXISTS afk (
    userId TEXT PRIMARY KEY,
    reason TEXT,
    since INTEGER
  )
`).run();

class AfkCommand extends Command {
  constructor() {
    super({
      name: "afk",
      description: "Set your AFK status with an optional reason",
      usage: "afk [reason]",
      aliases: ["busy"],
      category: "info",
      examples: ["afk", "afk eating dinner"],
      cooldown: 5,
      enabledSlash: true,
      slashData: {
        name: "afk",
        description: "Set your AFK status with an optional reason",
        options: [
          {
            name: "reason",
            description: "Reason for going AFK",
            type: 3, // STRING
            required: false,
          },
        ],
      },
    });
  }

  // Prefix command
  async execute({ message, args }) {
    const reason = args.join(" ") || "No reason provided.";

    db.prepare(`
      INSERT OR REPLACE INTO afk (userId, reason, since)
      VALUES (?, ?, ?)
    `).run(message.author.id, reason, Date.now());

    const embed = new EmbedBuilder()
      .setTitle("<:afk:1422941295034372196> | AFK Activated")
      .setDescription(
        `<:dot:1420349732810919988> You are now **AFK**.\n\n**<:dot:1420349732810919988> Reason:** ${reason}\nSend any message to remove your AFK status.`
      )
      .setFooter({ text: "AFK Mode Enabled" })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }

  // Slash command
  async slashExecute({ interaction }) {
    const reason = interaction.options.getString("reason") || "No reason provided.";

    db.prepare(`
      INSERT OR REPLACE INTO afk (userId, reason, since)
      VALUES (?, ?, ?)
    `).run(interaction.user.id, reason, Date.now());

    const embed = new EmbedBuilder()
      .setTitle("<:afk:1422941295034372196> | AFK Activated")
      .setDescription(
        `<:dot:1420349732810919988> You are now **AFK**.\n\n**<:dot:1420349732810919988> Reason:** ${reason}\nSend any message to remove your AFK status.`
      )
      .setFooter({ text: "AFK Mode Enabled" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
}

export default new AfkCommand();
