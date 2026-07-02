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

class TermsOfServiceCommand extends Command {
	constructor() {
		super({
			name: "tos",
			description: "View the bot's Terms of Service and usage guidelines.",
			usage: "tos",
			aliases: ["terms", "termsofservice", "rules"],
			category: "info",
			examples: ["tos", "terms"],
			cooldown: 5,
			enabledSlash: true,
			slashData: {
				name: "tos",
				description: "View the bot's Terms of Service and usage guidelines.",
			},
		});
	}

	async execute({ message }) {
		try {
			await message.reply({
				components: [this._createTermsContainer()],
				flags: MessageFlags.IsComponentsV2,
			});
		} catch (error) {
			logger.error("TermsOfServiceCommand", `Error in prefix command: ${error.message}`, error);
			await message.reply({
				components: [this._createErrorContainer("An error occurred while loading Terms of Service.")],
				flags: MessageFlags.IsComponentsV2,
			}).catch(() => {});
		}
	}

	async slashExecute({ interaction }) {
		try {
			await interaction.reply({
				components: [this._createTermsContainer()],
				flags: MessageFlags.IsComponentsV2,
			});
		} catch (error) {
			logger.error("TermsOfServiceCommand", `Error in slash command: ${error.message}`, error);
			const errorPayload = {
				components: [this._createErrorContainer("An error occurred while loading Terms of Service.")],
				ephemeral: true,
			};
			if (interaction.replied || interaction.deferred) {
				await interaction.editReply(errorPayload).catch(() => {});
			} else {
				await interaction.reply(errorPayload).catch(() => {});
			}
		}
	}

	_createTermsContainer() {
		const container = new ContainerBuilder();

		container.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(`${emoji.get('info')} **Music Bot Terms of Service**`)
		);

		container.addSeparatorComponents(
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
		);

		const content = `**By using Crystal Music Bot, you agree to these terms:**\n\n` +
			`**${emoji.get('check')} Proper Usage**\n` +
			`• Use for personal listening and community enjoyment\n` +
			`• Respect volume limits and server guidelines\n` +
			`• Follow Discord's Terms of Service at all times\n\n` +
			`**${emoji.get('cross')} Copyright & Content**\n` +
			`• Only play legally available music content\n` +
			`• No copyrighted material you don't have rights to\n` +
			`• Report copyright issues immediately\n\n` +
			`**${emoji.get('folder')} Fair Use**\n` +
			`• Respect command cooldowns and rate limits\n` +
			`• No spamming commands or queue manipulation\n` +
			`• Premium features may have additional terms\n\n` +
			`**${emoji.get('volume')} Audio Quality**\n` +
			`• Audio streaming provided "as-is"\n` +
			`• Quality may vary based on server load\n` +
			`• No guarantees of specific bitrates or uptime\n\n` +
			`**${emoji.get('shield')} Privacy**\n` +
			`• We store only necessary data for functionality\n` +
			`• Playlists and preferences are saved securely\n` +
			`• No audio recordings or personal data sharing\n\n` +
			`*Using Crystal Music Bot constitutes acceptance of these terms*`;

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

export default new TermsOfServiceCommand();