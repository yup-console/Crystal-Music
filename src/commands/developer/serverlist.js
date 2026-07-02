import {
	EmbedBuilder,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
} from "discord.js";
import { config } from "#config/config";
import { Command } from "#structures/classes/Command";
import emoji from "#config/emoji";

class ServerListCommand extends Command {
	constructor() {
		super({
			name: "serverlist",
			description: "Lists all servers the bot is in",
			aliases: ["servers", "guildlist", "glist"],
			category: "developer",
			ownerOnly: true,
		});
	}

	async execute({ client, message }) {
		const title = "Server List";
		const guilds = client.guilds.cache;
		const serversPerPage = 10;
		let currentPage = 0;
		
		// Sort guilds by member count and convert to array
		const sortedGuilds = Array.from(guilds.sort((a, b) => b.memberCount - a.memberCount).values());
		const totalPages = Math.ceil(sortedGuilds.length / serversPerPage);

		// Function to generate the embed for a specific page
		const generateEmbed = (page) => {
			const embed = new EmbedBuilder()
				.setTitle(`${emoji.get("server")} ${title}`)
				.setColor(0x5865F2)
				.setThumbnail(config.assets.defaultThumbnail);

			const startIndex = page * serversPerPage;
			const pageServers = sortedGuilds.slice(startIndex, startIndex + serversPerPage);

			// Add server count summary
			embed.addFields({
				name: "📊 Summary",
				value: `**Total Servers:** ${guilds.size}\n**Total Members:** ${guilds.reduce((acc, guild) => acc + guild.memberCount, 0).toLocaleString()}`,
				inline: false
			});

			if (sortedGuilds.length === 0) {
				embed.addFields({
					name: "No Servers",
					value: "The bot is not in any servers.",
					inline: false
				});
			} else {
				// Add page info
				embed.setFooter({ text: `Page ${page + 1} of ${totalPages}` });

				// Display servers for current page
				pageServers.forEach((guild, index) => {
					const globalIndex = startIndex + index;
					
					embed.addFields({
						name: `${globalIndex + 1}. ${guild.name}`,
						value: `**ID:** ${guild.id}\n**Members:** ${guild.memberCount.toLocaleString()}`,
						inline: true
					});
				});
			}

			return embed;
		};

		// Function to generate pagination buttons
		const generateButtons = (page) => {
			const row = new ActionRowBuilder();
			
			// Previous button
			const previousButton = new ButtonBuilder()
				.setCustomId("serverlist_previous")
				.setLabel("Previous")
				.setStyle(ButtonStyle.Secondary)
				.setEmoji("⬅️")
				.setDisabled(page === 0);

			// Next button
			const nextButton = new ButtonBuilder()
				.setCustomId("serverlist_next")
				.setLabel("Next")
				.setStyle(ButtonStyle.Secondary)
				.setEmoji("➡️")
				.setDisabled(page === totalPages - 1 || totalPages === 0);

			// Page info button (disabled)
			const pageInfoButton = new ButtonBuilder()
				.setCustomId("serverlist_page")
				.setLabel(`${page + 1}/${totalPages}`)
				.setStyle(ButtonStyle.Primary)
				.setDisabled(true);

			// Refresh button
			const refreshButton = new ButtonBuilder()
				.setCustomId("serverlist_refresh")
				.setLabel("Refresh")
				.setStyle(ButtonStyle.Success)
				.setEmoji("🔄");

			row.addComponents(previousButton, pageInfoButton, nextButton, refreshButton);
			return row;
		};

		// Send initial message
		const response = await message.reply({
			embeds: [generateEmbed(currentPage)],
			components: [generateButtons(currentPage)],
		});

		// Set up collector for button interactions
		const filter = (interaction) => 
			interaction.user.id === message.author.id && 
			interaction.message.id === response.id;
		
		const collector = response.createMessageComponentCollector({
			filter,
			time: 300000, // 5 minutes
		});

		collector.on("collect", async (interaction) => {
			try {
				await interaction.deferUpdate();
				
				let refreshData = false;
				let newTotalPages = totalPages;
				
				switch (interaction.customId) {
					case "serverlist_previous":
						if (currentPage > 0) currentPage--;
						break;
					case "serverlist_next":
						if (currentPage < totalPages - 1) currentPage++;
						break;
					case "serverlist_refresh":
						refreshData = true;
						break;
				}

				// Refresh guild data if refresh button was clicked
				if (refreshData) {
					await client.guilds.fetch();
					const refreshedGuilds = client.guilds.cache;
					sortedGuilds.length = 0; // Clear array
					sortedGuilds.push(...Array.from(refreshedGuilds.sort((a, b) => b.memberCount - a.memberCount).values()));
					newTotalPages = Math.ceil(sortedGuilds.length / serversPerPage);
					currentPage = 0; // Reset to first page on refresh
				}

				// Update message with new page
				await interaction.editReply({
					embeds: [generateEmbed(currentPage)],
					components: [generateButtons(currentPage)],
				});
			} catch (error) {
				console.error("Error handling pagination:", error);
			}
		});

		collector.on("end", async () => {
			try {
				// Disable all buttons when collector ends
				const disabledRow = new ActionRowBuilder();
				
				const previousButton = new ButtonBuilder()
					.setCustomId("serverlist_previous")
					.setLabel("Previous")
					.setStyle(ButtonStyle.Secondary)
					.setEmoji("⬅️")
					.setDisabled(true);

				const nextButton = new ButtonBuilder()
					.setCustomId("serverlist_next")
					.setLabel("Next")
					.setStyle(ButtonStyle.Secondary)
					.setEmoji("➡️")
					.setDisabled(true);

				const pageInfoButton = new ButtonBuilder()
					.setCustomId("serverlist_page")
					.setLabel(`${currentPage + 1}/${totalPages}`)
					.setStyle(ButtonStyle.Primary)
					.setDisabled(true);

				const refreshButton = new ButtonBuilder()
					.setCustomId("serverlist_refresh")
					.setLabel("Refresh")
					.setStyle(ButtonStyle.Success)
					.setEmoji("🔄")
					.setDisabled(true);

				disabledRow.addComponents(previousButton, pageInfoButton, nextButton, refreshButton);

				await response.edit({
					embeds: [generateEmbed(currentPage)],
					components: [disabledRow],
				});
			} catch (error) {
				// Message might be deleted, ignore error
				console.log("Could not disable buttons - message may have been deleted");
			}
		});
	}
}

export default new ServerListCommand();