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

class FeedbackCommand extends Command {
	constructor() {
		super({
			name: "feedback",
			description: "Send feedback about the bot to the developers.",
			usage: "feedback <your feedback>",
			aliases: ["fb"],
			category: "info",
			examples: ["feedback Great bot, love the music quality!", "fb The commands are very responsive"],
			cooldown: 30,
			enabledSlash: true,
			slashData: {
				name: "feedback",
				description: "Send feedback about the bot to the developers.",
				options: [
					{
						name: "message",
						type: 3,
						description: "Your feedback message",
						required: true,
					},
				],
			},
		});

		// Replace with your feedback channel ID
		this.feedbackChannelId = '1420423367432998953';
	}

	async execute({ client, message, args }) {
		try {
			if (!args.length) {
				return await message.reply({
					components: [this._createUsageContainer()],
					flags: MessageFlags.IsComponentsV2,
				});
			}

			const feedbackMessage = args.join(' ');
			const success = await this._sendFeedback(client, message.author, feedbackMessage, message.guild);

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
					components: [this._createErrorContainer("Failed to send feedback. Please try again later.")],
					flags: MessageFlags.IsComponentsV2,
				});
			}
		} catch (error) {
			logger.error("FeedbackCommand", `Error in prefix command: ${error.message}`, error);
			await message.reply({
				components: [this._createErrorContainer("An error occurred while sending feedback.")],
				flags: MessageFlags.IsComponentsV2,
			}).catch(() => {});
		}
	}

	async slashExecute({ client, interaction }) {
		try {
			const feedbackMessage = interaction.options.getString('message');
			const success = await this._sendFeedback(client, interaction.user, feedbackMessage, interaction.guild);

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
					components: [this._createErrorContainer("Failed to send feedback. Please try again later.")],
					flags: MessageFlags.IsComponentsV2,
					ephemeral: true,
				});
			}
		} catch (error) {
			logger.error("FeedbackCommand", `Error in slash command: ${error.message}`, error);
			const errorPayload = {
				components: [this._createErrorContainer("An error occurred while sending feedback.")],
				ephemeral: true,
			};
			if (interaction.replied || interaction.deferred) {
				await interaction.editReply(errorPayload).catch(() => {});
			} else {
				await interaction.reply(errorPayload).catch(() => {});
			}
		}
	}

	async _sendFeedback(client, user, message, guild) {
		try {
			// Get the feedback channel
			const feedbackChannel = await client.channels.fetch(this.feedbackChannelId).catch(() => null);
			
			if (!feedbackChannel || feedbackChannel.type !== ChannelType.GuildText) {
				logger.error("FeedbackCommand", `Feedback channel not found or invalid: ${this.feedbackChannelId}`);
				return false;
			}

			// Create embed for feedback with all details in description
			const feedbackEmbed = new EmbedBuilder()
				.setTitle('New Feedback Received')
				.setDescription(
					`**Feedback:** ${message}\n\n` +
					`**User:** ${user.tag} (${user.id})\n` +
					`**Server:** ${guild ? `${guild.name} (${guild.id})` : 'Direct Message'}\n` +
					`**Date:** <t:${Math.floor(Date.now() / 1000)}:F>`
				)
				.setThumbnail(user.displayAvatarURL({ size: 256 }))
				.setFooter({ text: 'Crystal Music Feedback System' });

			// Send the embed to feedback channel
			await feedbackChannel.send({ embeds: [feedbackEmbed] });
			return true;

		} catch (error) {
			logger.error("FeedbackCommand", `Error sending feedback: ${error.message}`, error);
			return false;
		}
	}

	_createSuccessContainer() {
		const container = new ContainerBuilder();

		container.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(`${emoji.get('check')} **Feedback Sent**`)
		);

		container.addSeparatorComponents(
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
		);

		const content = `**Thank you for your feedback!**\n\n` +
			`Your feedback has been sent to our development team. We appreciate you helping improve Crystal!\n\n` +
			`**${emoji.get('info')} What happens next:**\n` +
			`• Team reviews your feedback\n` +
			`• Considered for future updates\n` +
			`• Important issues get priority\n\n` +
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
			new TextDisplayBuilder().setContent(`${emoji.get('info')} **Feedback Usage**`)
		);

		container.addSeparatorComponents(
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
		);

		const content = `**How to send feedback:**\n\n` +
			`**Usage:** \`feedback <your message>\`\n\n` +
			`**Examples:**\n` +
			`• \`feedback Great music quality!\`\n\n` +
			`**What to include:**\n` +
			`• Your experience with the bot\n` +
			`• Features you love or want to include\n` +
			`*Your feedback helps improve Crystal for everyone!*`;

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

export default new FeedbackCommand();