import {
	ContainerBuilder,
	TextDisplayBuilder,
	SeparatorBuilder,
	SectionBuilder,
	ThumbnailBuilder,
	MessageFlags,
	SeparatorSpacingSize,
} from "discord.js";
import { config } from "#config/config";
import { Command } from "#structures/classes/Command";
import emoji from "#config/emoji";

class ServerLeaveCommand extends Command {
	constructor() {
		super({
			name: "serverleave",
			description: "Leaves a specified server",
			aliases: ["leaveguild", "guildleave", "gleave", "gleft"],
			category: "developer",
			ownerOnly: true,
			usage: "<serverId>",
		});
	}

	async execute({ client, message, args }) {
		const title = "Server Leave";
		
		if (!args[0]) {
			return await message.reply({
				content: "Please provide a server ID to leave.",
				flags: MessageFlags.Ephemeral,
			});
		}

		const serverId = args[0];
		const guild = client.guilds.cache.get(serverId);

		const container = new ContainerBuilder();

		if (!guild) {
			container.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					`### ${emoji.get("cross")} ${title}`
				),
			);

			container.addSeparatorComponents(
				new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
			);

			container.addSectionComponents(
				new SectionBuilder()
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent("**Server Not Found**"),
						new TextDisplayBuilder().setContent(`I'm not in a server with ID: \`${serverId}\``),
					)
					.setThumbnailAccessory(
						new ThumbnailBuilder().setURL(config.assets.defaultThumbnail),
					),
			);

			return await message.reply({
				components: [container],
				flags: MessageFlags.IsComponentsV2,
			});
		}

		try {
			await guild.leave();
			
			container.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					`### ${emoji.get("check")} ${title}`
				),
			);

			container.addSeparatorComponents(
				new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
			);

			container.addSectionComponents(
				new SectionBuilder()
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent("**Successfully Left Server**"),
						new TextDisplayBuilder().setContent(`**Server:** ${guild.name}\n**ID:** ${guild.id}\n**Members:** ${guild.memberCount.toLocaleString()}`),
					)
					.setThumbnailAccessory(
						new ThumbnailBuilder().setURL(guild.iconURL() || config.assets.defaultThumbnail),
					),
			);

		} catch (error) {
			container.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					`### ${emoji.get("cross")} ${title}`
				),
			);

			container.addSeparatorComponents(
				new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
			);

			container.addSectionComponents(
				new SectionBuilder()
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent("**Error Leaving Server**"),
						new TextDisplayBuilder().setContent(`Failed to leave server: ${guild.name}`),
					)
					.setThumbnailAccessory(
						new ThumbnailBuilder().setURL(config.assets.defaultThumbnail),
					),
			);

			container.addSeparatorComponents(
				new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
			);

			container.addSectionComponents(
				new SectionBuilder()
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent("**Error Details**"),
						new TextDisplayBuilder().setContent(
							`\`\`\`\n${error.message.substring(0, 1000)}\n\`\`\``,
						),
					)
					.setThumbnailAccessory(
						new ThumbnailBuilder().setURL(config.assets.defaultThumbnail),
					),
			);
		}

		await message.reply({
			components: [container],
			flags: MessageFlags.IsComponentsV2,
		});
	}
}

export default new ServerLeaveCommand();