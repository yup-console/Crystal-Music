import { EmbedBuilder, Events } from "discord.js";
import Database from "better-sqlite3";
import path from "path";

const dbPath = path.resolve("src/database/data/afk.db");
const db = new Database(dbPath);

// Ensure table exists
db.prepare(`
  CREATE TABLE IF NOT EXISTS afk (
    userId TEXT PRIMARY KEY,
    reason TEXT,
    since INTEGER
  )
`).run();

export default {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return;

    // --- 1. Handle returning AFK users ---
    const afkData = db.prepare("SELECT * FROM afk WHERE userId = ?").get(message.author.id);
    if (afkData) {
      const afkDurationStr = `<t:${Math.floor(afkData.since / 1000)}:R>`; // e.g., "20 minutes ago"

      db.prepare("DELETE FROM afk WHERE userId = ?").run(message.author.id);

      const embed = new EmbedBuilder()
        .setTitle(`<a:wlcm:1422941728490524684> Welcome back, ${message.member?.displayName || message.author.username}!`)
        .setDescription(
          `I have removed your AFK status.\n\n` +
          `<:dot:1420349732810919988> You were AFK for: **${afkDurationStr}**\n` +
          `<:dot:1420349732810919988> With reason: **${afkData.reason || "No reason provided."}**`
        )
        .setTimestamp();

      await message.reply({ embeds: [embed] }).catch(() => {});
    }

    // --- 2. Notify if mentioned users are AFK ---
    for (const user of message.mentions.users.values()) {
      const mentionedAfk = db.prepare("SELECT * FROM afk WHERE userId = ?").get(user.id);
      if (mentionedAfk) {
        // Try to get displayName from guild member
        const member = await message.guild?.members.fetch(user.id).catch(() => null);
        const displayName = member?.displayName || user.username;
        const since = `<t:${Math.floor(mentionedAfk.since / 1000)}:R>`;

        const embed = new EmbedBuilder()
          .setTitle(`<:afk:1422941295034372196> | ${displayName} is currently AFK`)
          .setDescription(
            `<:dot:1420349732810919988> They have been AFK since: **${since}**\n` +
            `<:dot:1420349732810919988> Reason: **${mentionedAfk.reason || "No reason provided."}**`
          )
          .setTimestamp();

        await message.reply({ embeds: [embed] }).catch(() => {});
        break; // notify only once even if multiple AFK users mentioned
      }
    }
  },
};
