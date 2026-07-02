import { Command } from "#structures/classes/Command";
import {
	ContainerBuilder,
	MessageFlags,
	SectionBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	TextDisplayBuilder,
	ThumbnailBuilder,
	EmbedBuilder,
	ChannelType,
} from "discord.js";
import { config } from "#config/config";
import emoji from "#config/emoji";
import { logger } from "#utils/logger";

class ReportCommand extends Command {
	constructor() {
		super({
			name: "report",
			description: "Report bugs or issues with the bot to the developers.",
			usage: "report <issue description>",
			aliases: ["bug", "issue"],
			category: "info",
			examples: ["report Music stops playing randomly", "bug Commands not responding in voice channel"],
			cooldown: 30,
			enabledSlash: true,
			slashData: {
				name: "report",
				description: "Report bugs or issues with the bot to the developers.",
				options: [
					{
						name: "issue",
						type: 3,
						description: "Describe the bug or issue you're experiencing",
						required: true,
					},
				],
			},
		});

		// Replace with your reports channel ID
		this.reportsChannelId = '1420423338014015528';
	}

	async execute({ client, message, args }) {
		try {
			if (!args.length) {
				return await message.reply({
					components: [this._createUsageContainer()],
					flags: MessageFlags.IsComponentsV2,
				});
			}

			const issueDescription = args.join(' ');
			const success = await this._sendReport(client, message.author, issueDescription, message.guild);

			if (success) {
				const reply = await message.reply({
					components: [this._createSuccessContainer()],
					flags: MessageFlags.IsComponentsV2,
				});
				
				// Delete the success message after 5 seconds
				setTimeout(async () => {
					try {
						await reply.delete().catch(() => {});
					} catch (error) {
						// Ignore deletion errors (message already deleted, no permissions, etc.)
					}
				}, 5000);
			} else {
				await message.reply({
					components: [this._createErrorContainer("Failed to send report. Please try again later.")],
					flags: MessageFlags.IsComponentsV2,
				});
			}
		} catch (error) {
			logger.error("ReportCommand", `Error in prefix command: ${error.message}`, error);
			await message.reply({
				components: [this._createErrorContainer("An error occurred while sending report.")],
				flags: MessageFlags.IsComponentsV2,
			}).catch(() => {});
		}
	}

	async slashExecute({ client, interaction }) {
		try {
			const issueDescription = interaction.options.getString('issue');
			const success = await this._sendReport(client, interaction.user, issueDescription, interaction.guild);

			if (success) {
				await interaction.reply({
					components: [this._createSuccessContainer()],
					flags: MessageFlags.IsComponentsV2,
					ephemeral: true,
				});
				// Note: Ephemeral messages automatically disappear after 5 seconds by default
				// No need to manually delete them
			} else {
				await interaction.reply({
					components: [this._createErrorContainer("Failed to send report. Please try again later.")],
					flags: MessageFlags.IsComponentsV2,
					ephemeral: true,
				});
			}
		} catch (error) {
			logger.error("ReportCommand", `Error in slash command: ${error.message}`, error);
			const errorPayload = {
				components: [this._createErrorContainer("An error occurred while sending report.")],
				ephemeral: true,
			};
			if (interaction.replied || interaction.deferred) {
				await interaction.editReply(errorPayload).catch(() => {});
			} else {
				await interaction.reply(errorPayload).catch(() => {});
			}
		}
	}

	async _sendReport(client, user, issue, guild) {
		try {
			// Get the reports channel
			const reportsChannel = await client.channels.fetch(this.reportsChannelId).catch(() => null);
			
			if (!reportsChannel || reportsChannel.type !== ChannelType.GuildText) {
				logger.error("ReportCommand", `Reports channel not found or invalid: ${this.reportsChannelId}`);
				return false;
			}

			// Create embed for report with all details in description
			const reportEmbed = new EmbedBuilder()
				.setTitle('Bug Report Received')
				.setDescription(
					`**Issue:** ${issue}\n\n` +
					`**User:** ${user.tag} (${user.id})\n` +
					`**Server:** ${guild ? `${guild.name} (${guild.id})` : 'Direct Message'}\n` +
					`**Date:** <t:${Math.floor(Date.now() / 1000)}:F>`
				)
				.setThumbnail(user.displayAvatarURL({ size: 256 }))
				.setFooter({ text: 'Crystal Music Bug Reports' });

			// Send the embed to reports channel
			await reportsChannel.send({ embeds: [reportEmbed] });
			return true;

		} catch (error) {
			logger.error("ReportCommand", `Error sending report: ${error.message}`, error);
			return false;
		}
	}

	_createSuccessContainer() {
		const container = new ContainerBuilder();

		container.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(`${emoji.get('check')} **Report Sent**`)
		);

		container.addSeparatorComponents(
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
		);

		const content = `**Thank you for reporting!**\n\n` +
			`Your bug report has been sent to our developers.\n` +
			`We'll investigate and fix the issue soon.\n\n` +
			`*This message will automatically delete in 5 seconds.*`;

		const section = new SectionBuilder()
			.addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
			.setThumbnailAccessory(new ThumbnailBuilder().setURL(config.assets?.defaultThumbnail || config.assets?.defaultTrackArtwork));

		container.addSectionComponents(section);

		container.addSeparatorComponents(
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
		);

		return container;
	}

	_createUsageContainer() {
		const container = new ContainerBuilder();

		container.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(`${emoji.get('info')} **Report Usage**`)
		);

		container.addSeparatorComponents(
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
		);

		const content = `**How to report bugs:**\n\n` +
			`**Usage:** \`report <issue>\`\n` +
			`**Example:** \`report Music stops playing\`\n\n` +
			`*Help us fix bugs with detailed reports!*`;

		const section = new SectionBuilder()
			.addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
			.setThumbnailAccessory(new ThumbnailBuilder().setURL(config.assets?.defaultThumbnail || config.assets?.defaultTrackArtwork));

		container.addSectionComponents(section);

		container.addSeparatorComponents(
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
		);

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
}

export default new ReportCommand();