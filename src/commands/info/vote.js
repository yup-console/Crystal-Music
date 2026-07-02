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
import fetch from "node-fetch";

// Only used for badge logic if needed in webhook elsewhere
const userVotes = new Map(); // key: userId, value: total votes

class VoteCommand extends Command {
    constructor() {
        super({
            name: "vote",
            description: "Vote for the bot on top.gg and get rewards!",
            usage: "vote",
            aliases: ["votelink", "topgg", "vote4rewards"],
            category: "info",
            examples: ["vote", "votelink"],
            cooldown: 10,
            enabledSlash: true,
            slashData: {
                name: "vote",
                description: "Vote for the bot on top.gg and get rewards!",
            },
        });
    }

    async execute({ client, message }) {
        try {
            const hasVoted = await this._fetchUserVoteStatus(message.author.id);
            await message.reply({
                components: [this._createVoteContainer(hasVoted)],
                flags: MessageFlags.IsComponentsV2,
            });
        } catch (error) {
            console.error(`[VoteCommand] Error: ${error}`);
            await message.reply({
                components: [this._createErrorContainer("An error occurred while loading vote links.")],
                flags: MessageFlags.IsComponentsV2,
            }).catch(() => {});
        }
    }

    async slashExecute({ client, interaction }) {
        try {
            const hasVoted = await this._fetchUserVoteStatus(interaction.user.id);
            await interaction.reply({
                components: [this._createVoteContainer(hasVoted)],
                flags: MessageFlags.IsComponentsV2,
            });
        } catch (error) {
            console.error(`[VoteCommand] Error: ${error}`);
            const errorPayload = {
                components: [this._createErrorContainer("An error occurred while loading vote links.")],
                ephemeral: true,
            };
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply(errorPayload).catch(() => {});
            } else {
                await interaction.reply(errorPayload).catch(() => {});
            }
        }
    }

    async _fetchUserVoteStatus(userId) {
        try {
            const botId = "1419347731545329744";
            const res = await fetch(`https://top.gg/api/bots/${botId}/check?userId=${userId}`, {
                headers: { Authorization: process.env.TOPGG_TOKEN || config.topggToken }
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            return data.voted === 1;
        } catch (err) {
            console.error("Failed to fetch user vote info:", err);
            return false;
        }
    }

    _createVoteContainer(hasVoted) {
        const container = new ContainerBuilder();

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`${emoji.get("add")} **Vote for Crystal**`)
        );

        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
        );

        const supporterBadgeStatus = "<:n_check:1420266315565760563> Unlocked!";

        const content =
            `**Support Crystal by voting!**\n\n` +
            `**${emoji.get("check")} Rewards:**\n` +
            `• Priority Support\n` +
            `• Supporter Badge after **50+ votes**\n\n` +
            `**<:StarDust_Star:1423367832883822653> Your Vote:**\n` +
            `• Recent Vote Status: ${hasVoted ? "<:n_check:1420266315565760563> You voted in the last 12h" : "<:cross:1420266600895873105> You haven't voted in the last 12h"}\n\n` +
            `**<:arsenic_info:1419607614269952060>  Benefits:**\n` +
            `• Help the bot grow\n` +
            `• Unlock cool perks\n` +
            `• Support development\n\n` +
            `*Vote every 12 hours to stay active!*`;

        const section = new SectionBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
            .setThumbnailAccessory(new ThumbnailBuilder().setURL(
                config.assets?.defaultThumbnail || config.assets?.defaultTrackArtwork || "https://via.placeholder.com/256"
            ));

        container.addSectionComponents(section);

        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
        );

        const voteUrl = `https://top.gg/bot/1419347731545329744/vote`;

        const buttonRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel("Vote on top.gg")
                .setStyle(ButtonStyle.Link)
                .setURL(voteUrl)
                .setEmoji(emoji.get("vote") || "🗳️")
        );

        container.addActionRowComponents(buttonRow);

        return container;
    }

    _createErrorContainer(message) {
        const container = new ContainerBuilder();
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`${emoji.get("cross") || "❌"} **Error**`)
        );
        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
        );
        const section = new SectionBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(message))
            .setThumbnailAccessory(new ThumbnailBuilder().setURL(
                config.assets?.defaultThumbnail || config.assets?.defaultTrackArtwork || "https://via.placeholder.com/256"
            ));

        container.addSectionComponents(section);
        return container;
    }
}

export default new VoteCommand();
