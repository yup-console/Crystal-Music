import { Command } from "#structures/classes/Command";
import { EmbedBuilder } from "discord.js";

class BannerCommand extends Command {
	constructor() {
		super({
			name: "banner",
			description: "Shows your or the mentioned user's banner",
			usage: "banner [@user]",
			aliases: ["bnr"],
			category: "info",
			examples: ["banner", "banner @username"],
			cooldown: 10,
			enabledSlash: true,
			slashData: {
				name: "banner",
				description: "Shows your or the selected user's banner",
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

		// Need full user object to fetch banner
		const user = await client.users.fetch(target.id, { force: true });

		if (!user.banner) {
			return message.reply({
				content: `${target.username} does not have a banner.`,
			});
		}

		const bannerURL = user.bannerURL({ size: 4096 });

		const embed = new EmbedBuilder()
			.setTitle(`${target.username}'s Banner`)
			.setImage(bannerURL); // default embed color, no emojis

		await message.reply({ embeds: [embed] });
	}

	// Slash command
	async slashExecute({ client, interaction }) {
		const target = interaction.options.getUser("user") || interaction.user;

		const user = await client.users.fetch(target.id, { force: true });

		if (!user.banner) {
			return interaction.reply({
				content: `${target.username} does not have a banner.`,
				ephemeral: true,
			});
		}

		const bannerURL = user.bannerURL({ size: 4096 });

		const embed = new EmbedBuilder()
			.setTitle(`${target.username}'s Banner`)
			.setImage(bannerURL); // default embed color

		await interaction.reply({ embeds: [embed] });
	}
}

export default new BannerCommand();