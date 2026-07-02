import { Command } from "#structures/classes/Command";
import { inspect } from "util";

class EvalCommand extends Command {
    constructor() {
        super({
            name: "eval",
            description: "Evaluates JavaScript code",
            aliases: ["ev", "e"],
            category: "developer",
            ownerOnly: true,
            usage: "eval <code>",
        });
    }

    async execute({ client, message, args }) {
        const code = args.join(" ");
        
        if (!code) {
            return message.reply("❌ Please provide code to evaluate.");
        }

        try {
            let result = eval(code);
            
            if (result instanceof Promise) {
                result = await result;
            }
            
            const output = inspect(result, { depth: 2 });
            const truncated = output.length > 1900 ? output.slice(0, 1900) + "\n... (truncated)" : output;
            
            await message.reply(`**Input:**\n\`\`\`js\n${code}\n\`\`\`\n**Output:**\n\`\`\`js\n${truncated}\n\`\`\``);
        } catch (error) {
            const errorMsg = error.stack || error.message;
            const truncated = errorMsg.length > 1900 ? errorMsg.slice(0, 1900) + "\n... (truncated)" : errorMsg;
            await message.reply(`**Input:**\n\`\`\`js\n${code}\n\`\`\`\n**Error:**\n\`\`\`js\n${truncated}\n\`\`\``);
        }
    }
}

export default new EvalCommand();
