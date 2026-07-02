import { Command } from "#structures/classes/Command";
import { PlayerManager } from "#managers/PlayerManager";
import emoji from "#config/emoji";

class JoinCommand extends Command {
  constructor() {
    super({
      name: "join",
      description: "Join your voice channel",
      usage: "join",
      aliases: ["connect", "summon"],
      category: "music",
      examples: ["join", "connect", "summon"],
      cooldown: 3,
      voiceRequired: true,
      sameVoiceRequired: false,
      enabledSlash: true,
      slashData: {
        name: ["music", "join"],
        description: "Join your voice channel",
      },
    });
  }

  async execute({ client, message, args }) {
    try {
      const voiceChannel = message.member?.voice?.channel;
      
      if (!voiceChannel) {
        return message.reply(`${emoji.get("cross")} You must be in a voice channel for me to join.`);
      }

      const permissions = voiceChannel.permissionsFor(message.guild.members.me);
      if (!permissions.has(["Connect", "Speak"])) {
        return message.reply(`${emoji.get("cross")} I need permission to join and speak in your voice channel.`);
      }

      // Check if bot is already in the same voice channel
      const botVoiceChannel = message.guild.members.me?.voice?.channel;
      if (botVoiceChannel && botVoiceChannel.id === voiceChannel.id) {
        return message.reply(`${emoji.get("check")} I'm already in your voice channel!`);
      }

      // Check if bot is in a different voice channel
      if (botVoiceChannel && botVoiceChannel.id !== voiceChannel.id) {
        return message.reply(`${emoji.get("cross")} I'm already playing in **${botVoiceChannel.name}**. Use \`disconnect\` command first if you want me to switch channels.`);
      }

      // Create loading message
      const loadingMessage = await message.reply(`${emoji.get("loading")} Joining your voice channel...`);

      try {
        // Create or get player
        const player =
          client.music.getPlayer(message.guild.id) ||
          (await client.music.createPlayer({
            guildId: message.guild.id,
            textChannelId: message.channel.id,
            voiceChannelId: voiceChannel.id,
          }));

        const pm = new PlayerManager(player);

        // Connect to voice channel
        if (!pm.isConnected) {
          await pm.connect();
        }

        // Update message with success
        await loadingMessage.edit(`${emoji.get("check")} Successfully joined **${voiceChannel.name}**! ${emoji.get("music")} I'm ready to play music. Use \`play\` command to start.`);

        client.logger?.debug(
          "JoinCommand",
          `Joined voice channel: ${voiceChannel.name} (${voiceChannel.id}) in guild: ${message.guild.name}`
        );

      } catch (error) {
        await loadingMessage.edit(`${emoji.get("cross")} Failed to join voice channel: ${error.message}`);
        
        client.logger?.error(
          "JoinCommand",
          `Error joining voice channel: ${error.message}`,
          error
        );
      }

    } catch (error) {
      client.logger?.error(
        "JoinCommand",
        `Error in prefix command: ${error.message}`,
        error,
      );
      
      await message.reply(`${emoji.get("cross")} An error occurred while trying to join the voice channel.`).catch(() => {});
    }
  }

  async slashExecute({ client, interaction }) {
    try {
      await interaction.deferReply();

      const voiceChannel = interaction.member?.voice?.channel;
      
      if (!voiceChannel) {
        return interaction.editReply(`${emoji.get("cross")} You must be in a voice channel for me to join.`);
      }

      const permissions = voiceChannel.permissionsFor(interaction.guild.members.me);
      if (!permissions.has(["Connect", "Speak"])) {
        return interaction.editReply(`${emoji.get("cross")} I need permission to join and speak in your voice channel.`);
      }

      // Check if bot is already in the same voice channel
      const botVoiceChannel = interaction.guild.members.me?.voice?.channel;
      if (botVoiceChannel && botVoiceChannel.id === voiceChannel.id) {
        return interaction.editReply(`${emoji.get("check")} I'm already in your voice channel!`);
      }

      // Check if bot is in a different voice channel
      if (botVoiceChannel && botVoiceChannel.id !== voiceChannel.id) {
        return interaction.editReply(`${emoji.get("cross")} I'm already playing in **${botVoiceChannel.name}**. Use \`/disconnect\` command first if you want me to switch channels.`);
      }

      try {
        // Create or get player
        const player =
          client.music.getPlayer(interaction.guild.id) ||
          (await client.music.createPlayer({
            guildId: interaction.guild.id,
            textChannelId: interaction.channel.id,
            voiceChannelId: voiceChannel.id,
          }));

        const pm = new PlayerManager(player);

        // Connect to voice channel
        if (!pm.isConnected) {
          await pm.connect();
        }

        // Update message with success
        await interaction.editReply(`${emoji.get("check")} Successfully joined **${voiceChannel.name}**! ${emoji.get("music")} I'm ready to play music. Use \`/play\` command to start.`);

        client.logger?.debug(
          "JoinCommand",
          `Joined voice channel via slash command: ${voiceChannel.name} (${voiceChannel.id}) in guild: ${interaction.guild.name}`
        );

      } catch (error) {
        await interaction.editReply(`${emoji.get("cross")} Failed to join voice channel: ${error.message}`);
        
        client.logger?.error(
          "JoinCommand",
          `Error joining voice channel via slash command: ${error.message}`,
          error
        );
      }

    } catch (error) {
      client.logger?.error(
        "JoinCommand",
        `Error in slash command: ${error.message}`,
        error,
      );
      
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.editReply(`${emoji.get("cross")} An error occurred while trying to join the voice channel.`);
        } else {
          await interaction.reply({
            content: `${emoji.get("cross")} An error occurred while trying to join the voice channel.`,
            ephemeral: true,
          });
        }
      } catch (e) {}
    }
  }
}

export default new JoinCommand();