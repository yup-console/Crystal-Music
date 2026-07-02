import { Command } from "#structures/classes/Command";
import { readFile } from "fs/promises";

class LogsCommand extends Command {
    constructor() {
        super({
            name: "logs",
            description: "Shows recent console logs",
            aliases: ["log", "console"],
            category: "developer",
            ownerOnly: true,
            usage: "logs [number]",
        });
    }

    async execute({ client, message, args }) {
        const count = parseInt(args[0]) || 50;
        const numLines = Math.min(Math.max(1, count), 500);

        try {
            const logFile = "./logs/bot.log";
            const logContent = await readFile(logFile, "utf-8");
            const lines = logContent.split("\n").filter(line => line.trim());
            const recentLogs = lines.slice(-numLines);
            
            if (recentLogs.length === 0) {
                return message.reply("```\n(no logs available)\n```");
            }
            
            const logsText = recentLogs.join("\n");
            const truncated = logsText.length > 1900 ? logsText.slice(0, 1900) + "\n... (truncated)" : logsText;
            
            await message.reply(`**Last ${recentLogs.length} log lines:**\n\`\`\`\n${truncated}\n\`\`\``);
        } catch (error) {
            await message.reply(`**Error reading logs:**\n\`\`\`\n${error.message}\n\`\`\``);
        }
    }
}

export default new LogsCommand();
