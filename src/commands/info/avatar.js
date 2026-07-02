import { Command } from "#structures/classes/Command";
import { EmbedBuilder } from "discord.js";

class AvatarCommand extends Command {
	constructor() {
		super({
			name: "avatar",
			description: "Shows your or the mentioned user's avatar",
			usage: "avatar [@user]",
			aliases: ["pfp", "av"],
			category: "info",
			examples: ["avatar", "avatar @username"],
			cooldown: 10,
			enabledSlash: true,
			slashData: {
				name: "avatar",
				description: "Shows your or the selected user's avatar",
				options: [
					{
						name: "user",
						description: "Select a user",
						type: 6, // USER
						required: false,
					},
				],
			},
		});
	}

	// Prefix command
	async execute({ client, message, args }) {
		const target =
			message.mentions.users.first() ||
			(await client.users.fetch(args[0]).catch(() => null)) ||
			message.author;

		const avatarURL = target.displayAvatarURL({
			size: 4096,
			extension: "png",
		});

		const embed = new EmbedBuilder()
			.setTitle(`${target.username}'s Avatar`)
			.setImage(avatarURL); // no color set → default color

		await message.reply({ embeds: [embed] });
	}

	// Slash command
	async slashExecute({ client, interaction }) {
		const target = interaction.options.getUser("user") || interaction.user;

		const avatarURL = target.displayAvatarURL({
			size: 4096,
			extension: "png",
		});

		const embed = new EmbedBuilder()
			.setTitle(`${target.username}'s Avatar`)
			.setImage(avatarURL); // default color, no emojis

		await interaction.reply({ embeds: [embed] });
	}
}

export default new AvatarCommand();
