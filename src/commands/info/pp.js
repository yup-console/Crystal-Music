import { Command } from "#structures/classes/Command";
import {
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

class PrivacyPolicyCommand extends Command {
	constructor() {
		super({
			name: "privacy-policy",
			description: "View the bot's Privacy Policy and data handling practices.",
			usage: "pp",
			aliases: ["privacy", "privacypolicy", "data", "pp"],
			category: "info",
			examples: ["pp", "privacy"],
			cooldown: 5,
			enabledSlash: true,
			slashData: {
				name: "pp",
				description: "View the bot's Privacy Policy and data handling practices.",
			},
		});
	}

	async execute({ message }) {
		try {
			await message.reply({
				components: [this._createPrivacyContainer()],
				flags: MessageFlags.IsComponentsV2,
			});
		} catch (error) {
			logger.error("PrivacyPolicyCommand", `Error in prefix command: ${error.message}`, error);
			await message.reply({
				components: [this._createErrorContainer("An error occurred while loading Privacy Policy.")],
				flags: MessageFlags.IsComponentsV2,
			}).catch(() => {});
		}
	}

	async slashExecute({ interaction }) {
		try {
			await interaction.reply({
				components: [this._createPrivacyContainer()],
				flags: MessageFlags.IsComponentsV2,
			});
		} catch (error) {
			logger.error("PrivacyPolicyCommand", `Error in slash command: ${error.message}`, error);
			const errorPayload = {
				components: [this._createErrorContainer("An error occurred while loading Privacy Policy.")],
				ephemeral: true,
			};
			if (interaction.replied || interaction.deferred) {
				await interaction.editReply(errorPayload).catch(() => {});
			} else {
				await interaction.reply(errorPayload).catch(() => {});
			}
		}
	}

	_createPrivacyContainer() {
		const container = new ContainerBuilder();

		container.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(`${emoji.get('info')} **Music Bot Privacy Policy**`)
		);

		container.addSeparatorComponents(
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
		);

		const content = `**Crystal Music Bot respects your privacy**\n\n` +
			`**${emoji.get('folder')} Data Collected**\n` +
			`• User ID, server ID for functionality\n` +
			`• Playlists, queue history, preferences\n` +
			`• Premium status and subscription data\n\n` +
			`**${emoji.get('check')} Data Usage**\n` +
			`• Music playback and bot operations\n` +
			`• Personalizing your music experience\n` +
			`• Anti-abuse and service improvements\n\n` +
			`**${emoji.get('shield')} Data Protection**\n` +
			`• Encrypted secure storage\n` +
			`• No audio recording or monitoring\n` +
			`• Regular security updates\n\n` +
			`**${emoji.get('cross')} Data Sharing**\n` +
			`• No selling of personal data\n` +
			`• Music metadata from public APIs\n` +
			`• Legal compliance only when required\n\n` +
			`**${emoji.get('reset')} Your Control**\n` +
			`• Request data deletion anytime\n` +
			`• Opt-out by stopping bot usage\n` +
			`• Contact support for questions\n\n` +
			`*Your privacy matters - we only collect what's necessary*`;

		const thumbnailUrl = config.assets?.defaultThumbnail || config.assets?.defaultTrackArtwork;

		const section = new SectionBuilder()
			.addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
			.setThumbnailAccessory(new ThumbnailBuilder().setURL(thumbnailUrl));

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

		const thumbnailUrl = config.assets?.defaultThumbnail || config.assets?.defaultTrackArtwork;

		const section = new SectionBuilder()
			.addTextDisplayComponents(new TextDisplayBuilder().setContent(message))
			.setThumbnailAccessory(new ThumbnailBuilder().setURL(thumbnailUrl));

		container.addSectionComponents(section);

		container.addSeparatorComponents(
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
		);

		return container;
	}
}

export default new PrivacyPolicyCommand();