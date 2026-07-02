import { Command } from "#structures/classes/Command";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ContainerBuilder,
	MessageFlags,
	SectionBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	TextDisplayBuilder,
	ThumbnailBuilder,
} from "discord.js";
import { config } from "#config/config";
import emoji from "#config/emoji";
import { logger } from "#utils/logger";

class BotInfoCommand extends Command {
	constructor() {
		super({
			name: "botinfo",
			description: "Shows detailed information about the bot.",
			usage: "botinfo",
			aliases: ["bot", "info", "about", "stats", "bi"],
			category: "info",
			examples: ["botinfo", "bot"],
			cooldown: 5,
			enabledSlash: true,
			slashData: {
				name: "botinfo",
				description: "Get detailed information about the bot.",
			},
		});
	}

	async execute({ client, message }) {
		try {
			const messageInstance = await message.reply({
				components: [await this._createBotInfoContainer(client)],
				flags: MessageFlags.IsComponentsV2,
			});

			this._setupCollector(messageInstance, message.author.id, client);
		} catch (error) {
			logger.error("BotInfoCommand", `Error in prefix command: ${error.message}`, error);
			await message.reply({
				components: [this._createErrorContainer("An error occurred while loading bot information.")],
				flags: MessageFlags.IsComponentsV2,
			}).catch(() => {});
		}
	}

	async slashExecute({ client, interaction }) {
		try {
			const messageInstance = await interaction.reply({
				components: [await this._createBotInfoContainer(client)],
				flags: MessageFlags.IsComponentsV2,
				fetchReply: true,
			});

			this._setupCollector(messageInstance, interaction.user.id, client);
		} catch (error) {
			logger.error("BotInfoCommand", `Error in slash command: ${error.message}`, error);
			const errorPayload = {
				components: [this._createErrorContainer("An error occurred while loading bot information.")],
				ephemeral: true,
			};
			if (interaction.replied || interaction.deferred) {
				await interaction.editReply(errorPayload).catch(() => {});
			} else {
				await interaction.reply(errorPayload).catch(() => {});
			}
		}
	}

	async _createBotInfoContainer(client) {
		const container = new ContainerBuilder();

		container.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(`${emoji.get('info')} **Crystal Music Bot**`)
		);

		container.addSeparatorComponents(
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
		);

		const uptime = this._formatUptime(client.uptime);
		const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
		
		// Calculate total users across all guilds
		const totalUsers = client.guilds.cache.reduce((total, guild) => total + guild.memberCount, 0);

		const content = `**High-quality music bot with advanced features**\n\n` +
			`**${emoji.get('check')} Stats**\n` +
			`• Servers: ${client.guilds.cache.size.toLocaleString()}\n` +
			`• Users: ${totalUsers.toLocaleString()}\n` +
			`• Uptime: ${uptime}\n` +
			`• Memory: ${memoryUsage} MB\n\n` +
			`**${emoji.get('volume')} Features**\n` +
			`• High-quality audio streaming\n` +
			`• Playlists and queue management\n` +
			`• Advanced music controls\n` +
			`• Premium audio enhancements\n\n` +
			`*Built with Discord.js for optimal performance*`;

		const section = new SectionBuilder()
			.addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
			.setThumbnailAccessory(new ThumbnailBuilder().setURL(config.assets?.defaultThumbnail || config.assets?.defaultTrackArtwork));

		container.addSectionComponents(section);

		container.addSeparatorComponents(
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
		);

		const buttonRow = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId('botinfo_team')
				.setLabel('Developer')
				.setStyle(ButtonStyle.Secondary)
				.setEmoji(emoji.get("folder")),
			new ButtonBuilder()
				.setLabel('Support')
				.setStyle(ButtonStyle.Link)
				.setURL('https://discord.gg/your-support-server')
		);

		container.addActionRowComponents(buttonRow);

		return container;
	}

	_createTeamInfoContainer() {
		const container = new ContainerBuilder();

		container.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(`${emoji.get('folder')} **Developer**`)
		);

		container.addSeparatorComponents(
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
		);

		const content = `**Crystal Music Bot Development**\n\n` +
			`**${emoji.get('dot')} Lead Developer:** [@! Console..](https://discord.com/users/901487880067776524) || [@Wizard](https://discord.com/users/1307302913240203274)  \n` +
			`**${emoji.get('dot')} Specialization:** Music Bots\n` +
			`**${emoji.get('dot')} Status:** Active Development\n\n` +
			`*Focused on delivering the best music experience*`;

		const section = new SectionBuilder()
			.addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
			.setThumbnailAccessory(new ThumbnailBuilder().setURL(config.assets?.defaultThumbnail || config.assets?.defaultTrackArtwork));

		container.addSectionComponents(section);

		container.addSeparatorComponents(
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
		);

		const buttonRow = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId('botinfo_back')
				.setLabel('Back to Info')
				.setStyle(ButtonStyle.Secondary)
				.setEmoji(emoji.get("info"))
		);

		container.addActionRowComponents(buttonRow);

		return container;
	}

	_createErrorContainer(message) {
		const container = new ContainerBuilder();

		container.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(`${emoji.get('cross')} **Error**`)
		);

		container.addSeparatorComponents(
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
		);

		const section = new SectionBuilder()
			.addTextDisplayComponents(new TextDisplayBuilder().setContent(message))
			.setThumbnailAccessory(new ThumbnailBuilder().setURL(config.assets?.defaultThumbnail || config.assets?.defaultTrackArtwork));

		container.addSectionComponents(section);

		container.addSeparatorComponents(
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
		);

		return container;
	}

	_formatUptime(ms) {
		const seconds = Math.floor((ms / 1000) % 60);
		const minutes = Math.floor((ms / (1000 * 60)) % 60);
		const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
		const days = Math.floor(ms / (1000 * 60 * 60 * 24));

		if (days > 0) return `${days}d ${hours}h ${minutes}m`;
		if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
		if (minutes > 0) return `${minutes}m ${seconds}s`;
		return `${seconds}s`;
	}

	_setupCollector(message, userId, client) {
		const collector = message.createMessageComponentCollector({
			filter: (i) => i.user.id === userId,
			time: 300_000
		});

		collector.on('collect', async (interaction) => {
			try {
				if (interaction.customId === 'botinfo_team') {
					await interaction.update({
						components: [this._createTeamInfoContainer()],
						flags: MessageFlags.IsComponentsV2,
					});
				} else if (interaction.customId === 'botinfo_back') {
					await interaction.update({
						components: [await this._createBotInfoContainer(client)],
						flags: MessageFlags.IsComponentsV2,
					});
				}
			} catch (error) {
				logger.error("BotInfoCommand", `Error in collector: ${error.message}`, error);
			}
		});

		collector.on('end', async () => {
			try {
				const fetchedMessage = await message.fetch().catch(() => null);
				if (fetchedMessage?.components.length > 0) {
					await fetchedMessage.edit({
						components: [this._createExpiredContainer()]
					});
				}
			} catch (error) {
				if (error.code !== 10008) {
					logger.error("BotInfoCommand", `Error updating expired components: ${error.message}`, error);
				}
			}
		});
	}

	_createExpiredContainer() {
		const container = new ContainerBuilder();

		container.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(`${emoji.get('info')} **Session Expired**`)
		);

		container.addSeparatorComponents(
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
		);

		const content = `**This interaction has expired**\n\n` +
			`Use \`/botinfo\` to view current bot information`;

		const section = new SectionBuilder()
			.addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
			.setThumbnailAccessory(new ThumbnailBuilder().setURL(config.assets?.defaultThumbnail || config.assets?.defaultTrackArtwork));

		container.addSectionComponents(section);

		container.addSeparatorComponents(
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
		);

		return container;
	}
}

export default new BotInfoCommand();