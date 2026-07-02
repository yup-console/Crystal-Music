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

class ProfileCommand extends Command {
	constructor() {
		super({
			name: "profile",
			description: "View your user profile with badges and statistics.",
			usage: "profile [user]",
			aliases: ["pr"],
			category: "info",
			examples: ["profile", "profile @user", "pr"],
			cooldown: 10,
			enabledSlash: true,
			slashData: {
				name: "profile",
				description: "View your user profile with badges and statistics.",
				options: [
					{
						name: "user",
						type: 6,
						description: "The user to view profile of (optional)",
						required: false,
					},
				],
			},
		});

		// Your support server ID - replace with actual server ID
		this.supportServerId = '1362377178469109780';
	}

	async execute({ client, message, args }) {
		try {
			let targetUser = message.author;
			
			if (args.length > 0) {
				const mention = args[0].replace(/[<@!>]/g, '');
				targetUser = await client.users.fetch(mention).catch(() => message.author);
			}

			// Check if user is in support server
			const supportServer = await client.guilds.fetch(this.supportServerId).catch(() => null);
			const supportServerMember = supportServer ? await supportServer.members.fetch(targetUser.id).catch(() => null) : null;
			
			await message.reply({
				components: [this._createProfileContainer(targetUser, message.guild?.members.cache.get(targetUser.id), supportServerMember, client)],
				flags: MessageFlags.IsComponentsV2,
			});
		} catch (error) {
			logger.error("ProfileCommand", `Error in prefix command: ${error.message}`, error);
			await message.reply({
				components: [this._createErrorContainer("An error occurred while loading profile.")],
				flags: MessageFlags.IsComponentsV2,
			}).catch(() => {});
		}
	}

	async slashExecute({ client, interaction }) {
		try {
			const targetUser = interaction.options.getUser('user') || interaction.user;
			
			// Check if user is in support server
			const supportServer = await client.guilds.fetch(this.supportServerId).catch(() => null);
			const supportServerMember = supportServer ? await supportServer.members.fetch(targetUser.id).catch(() => null) : null;
			
			await interaction.reply({
				components: [this._createProfileContainer(targetUser, interaction.guild?.members.cache.get(targetUser.id), supportServerMember, client)],
				flags: MessageFlags.IsComponentsV2,
			});
		} catch (error) {
			logger.error("ProfileCommand", `Error in slash command: ${error.message}`, error);
			const errorPayload = {
				components: [this._createErrorContainer("An error occurred while loading profile.")],
				ephemeral: true,
			};
			if (interaction.replied || interaction.deferred) {
				await interaction.editReply(errorPayload).catch(() => {});
			} else {
				await interaction.reply(errorPayload).catch(() => {});
			}
		}
	}

	_createProfileContainer(user, currentGuildMember, supportServerMember, client) {
		try {
			const container = new ContainerBuilder();

			container.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(`${emoji.get('info')} **User Profile**`)
			);

			container.addSeparatorComponents(
				new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
			);

			const badges = this._getUserBadges(user, currentGuildMember, supportServerMember, client);
			const stats = this._getUserStats(user, currentGuildMember);

			let content = `<:user:1420408300670812211> **| ${user.displayName}** (${user.username})\n\n` +
				`**<:NexusStats:1420408577998196848> | Statistics:**\n` +
				`• Account Created: <t:${Math.floor(user.createdTimestamp / 1000)}:R>\n` +
				`${currentGuildMember ? `• Joined Server: <t:${Math.floor(currentGuildMember.joinedTimestamp / 1000)}:R>\n` : ''}` +
				`• User ID: ${user.id}\n\n` +
				`**<:lista:1420417539137339423> | Badges:**\n`;

			// Add badges or message about support server
			if (badges.length > 0) {
				content += badges.join('\n') + '\n\n';
			} else {
				content += `None\n*Join Our Support Server To Get Cool Badges!*\n\n`;
			}

			content += `*${this._getRandomProfileQuote()}*`;

			const section = new SectionBuilder()
				.addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
				.setThumbnailAccessory(new ThumbnailBuilder().setURL(user.displayAvatarURL({ size: 256 })));

			container.addSectionComponents(section);

			container.addSeparatorComponents(
				new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
			);

			return container;
		} catch (error) {
			logger.error("ProfileCommand", `Error creating profile container: ${error.message}`, error);
			return this._createErrorContainer("Failed to create profile display.");
		}
	}

	_getUserBadges(user, currentGuildMember, supportServerMember, client) {
		try {
			const badges = [];

			// Developer badge based on user ID
			if (user.id === '1307302913240203274' || user.id === '901487880067776524') {
				badges.push('<:deve:1420421607628734496> | Developer');
			}

			// Check badges from support server if user is member
			if (supportServerMember) {
				const supportServerRoleIds = supportServerMember.roles.cache.map(role => role.id);
				
				// Replace these with your actual support server role IDs
				if (this._hasRole(supportServerRoleIds, ['1420450064907763722'])) {
					badges.push('<:owner:1420421671713505342> | Owner');
				}
				if (this._hasRole(supportServerRoleIds, ['1420450064022769744'])) {
					badges.push('<a:manager:1402895249096835132> | Manager');
				}
				if (this._hasRole(supportServerRoleIds, ['1420450065717268502'])) {
					badges.push('<:admin:1420466661198135356> | Admin');
				}
				if (this._hasRole(supportServerRoleIds, ['1420449329075716256'])) {
					badges.push('<:Moderation:1420421807273410801> | Mod');
				}
				if (this._hasRole(supportServerRoleIds, ['1420449327792390144'])) {
					badges.push('<:helper:1420422331079196752> | Staff');
				}
				if (this._hasRole(supportServerRoleIds, ['1420448804104179733'])) {
					badges.push('<:bug_hunter:1420466273489256669> | Bug Hunter');
				}
				if (this._hasRole(supportServerRoleIds, ['1420450063465058426'])) {
					badges.push('<:vip:1420464662914400328> | V.I.P');
				}
                if (this._hasRole(supportServerRoleIds, ['SUPPORT_BUG_HUNTER_ROLE_ID'])) {
					badges.push('<:boosters:1420422121045233844> | Booster');
                }
                if (this._hasRole(supportServerRoleIds, ['1420448804846436553'])) {
					badges.push('<:OwnerSpecial:1420465892290203719> | Special');
				}
                if (this._hasRole(supportServerRoleIds, ['1420448806427689012'])) {
                    badges.push('<:supporter:1420465633178685623> | Supporter');
                }
                if (this._hasRole(supportServerRoleIds, ['1420460812002267277'])) {
					badges.push('<a:premium:1402902858579316830> | Premium User');
                }
                if (this._hasRole(supportServerRoleIds, ['1420448803583950880'])) {
                    badges.push('<a:User:1420465163705913515> | Crystal Users');
                }

				// Add support server member badge if they have no other special roles
				if (badges.length === (user.id === '1307302913240203274' || user.id === '901487880067776524' ? 1 : 0)) {
					badges.push('<a:User:1420465163705913515> | Crystal Users');
				}
			}

			// Check badges from current guild if available
			if (currentGuildMember) {
				const currentGuildRoleIds = currentGuildMember.roles.cache.map(role => role.id);
				
				// Replace these with your actual current server role IDs
				if (this._hasRole(currentGuildRoleIds, ['CURRENT_OWNER_ROLE_ID'])) {
					badges.push('• Server Owner');
				}
				if (this._hasRole(currentGuildRoleIds, ['CURRENT_ADMIN_ROLE_ID'])) {
					badges.push('• Server Admin');
				}
				if (this._hasRole(currentGuildRoleIds, ['CURRENT_MOD_ROLE_ID'])) {
					badges.push('• Server Mod');
				}
			}

			// Discord badges
			if (user.flags) {
				if (user.flags.has('Staff')) badges.push('• Discord Staff');
				if (user.flags.has('Partner')) badges.push('• Partner');
				if (user.flags.has('BugHunterLevel1')) badges.push('• Discord Bug Hunter');
				if (user.flags.has('BugHunterLevel2')) badges.push('• Discord Bug Hunter Elite');
				if (user.flags.has('PremiumEarlySupporter')) badges.push('• Early Supporter');
			}

			// Bot-specific badge
			if (client && client.user && user.id === client.user.id) {
				badges.push('• Bot');
			}

			return badges;
		} catch (error) {
			logger.error("ProfileCommand", `Error getting user badges: ${error.message}`, error);
			return [];
		}
	}

	_hasRole(userRoleIds, requiredRoleIds) {
		return requiredRoleIds.some(roleId => userRoleIds.includes(roleId));
	}

	_getUserStats(user, member) {
		try {
			const stats = {
				accountAge: this._getAccountAge(user.createdTimestamp),
				serverAge: member ? this._getServerAge(member.joinedTimestamp) : null
			};

			return stats;
		} catch (error) {
			logger.error("ProfileCommand", `Error getting user stats: ${error.message}`, error);
			return {
				accountAge: 'Unknown',
				serverAge: 'Unknown'
			};
		}
	}

	_getAccountAge(createdTimestamp) {
		const now = Date.now();
		const diff = now - createdTimestamp;
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		return `${days} days`;
	}

	_getServerAge(joinedTimestamp) {
		const now = Date.now();
		const diff = now - joinedTimestamp;
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		return `${days} days`;
	}

	_getRandomProfileQuote() {
		try {
			const quotes = [
				"Music lover and crystal clear vibes!",
				"Spreading good music everywhere!",
				"Professional music enthusiast!",
				"Making servers sound better!",
				"Crystal clear audio experience!",
				"Here for the good tunes!",
				"Music is my language!",
				"Keeping the beats going!",
				"Sound quality matters!",
				"All about that bass!"
			];
			return quotes[Math.floor(Math.random() * quotes.length)];
		} catch (error) {
			logger.error("ProfileCommand", `Error getting random quote: ${error.message}`, error);
			return "Music enthusiast!";
		}
	}

	_createErrorContainer(message) {
		try {
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
		} catch (error) {
			logger.error("ProfileCommand", `Error creating error container: ${error.message}`, error);
			
			const fallbackContainer = new ContainerBuilder();
			fallbackContainer.addTextDisplayComponents(
				new TextDisplayBuilder().setContent("❌ **Error**\nFailed to load profile information.")
			);
			return fallbackContainer;
		}
	}
}

export default new ProfileCommand();