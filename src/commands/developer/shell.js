import { Command } from "#structures/classes/Command";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

class ShellCommand extends Command {
    constructor() {
        super({
            name: "shell",
            description: "Executes a shell command",
            aliases: ["sh", "exec", "bash"],
            category: "developer",
            ownerOnly: true,
            usage: "shell <command>",
        });
    }

    async execute({ client, message, args }) {
        const command = args.join(" ");
        
        if (!command) {
            return message.reply("❌ Please provide a command to execute.");
        }

        try {
            const { stdout, stderr } = await execAsync(command, { timeout: 30000 });
            
            let output = "";
            if (stdout) output += `**stdout:**\n\`\`\`\n${stdout}\n\`\`\`\n`;
            if (stderr) output += `**stderr:**\n\`\`\`\n${stderr}\n\`\`\``;
            
            if (!output) output = "```\n(no output)\n```";
            
            const truncated = output.length > 1900 ? output.slice(0, 1900) + "\n... (truncated)" : output;
            
            await message.reply(`**Command:**\n\`\`\`bash\n${command}\n\`\`\`\n${truncated}`);
        } catch (error) {
            let errorOutput = `**Command:**\n\`\`\`bash\n${command}\n\`\`\`\n**Error:**\n\`\`\`\n${error.message}\n\`\`\``;
            
            if (error.stdout) errorOutput += `\n**stdout:**\n\`\`\`\n${error.stdout}\n\`\`\``;
            if (error.stderr) errorOutput += `\n**stderr:**\n\`\`\`\n${error.stderr}\n\`\`\``;
            
            const truncated = errorOutput.length > 1900 ? errorOutput.slice(0, 1900) + "\n... (truncated)" : errorOutput;
            await message.reply(truncated);
        }
    }
}

export default new ShellCommand();
