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
import { PlayerManager } from "#managers/PlayerManager";

class LyricsCommand extends Command {
	constructor() {
		super({
			name: "lyrics",
			description: "Get lyrics for the currently playing song from Genius",
			usage: "lyrics",
			aliases: ["ly", "lyric"],
			category: "music",
			examples: ["lyrics"],
			cooldown: 30,
			voiceRequired: false,
			sameVoiceRequired: false,
			enabledSlash: true,
			slashData: {
				name: ["music", "lyrics"],
				description: "Get lyrics for the currently playing song from Genius",
				options: [],
			},
		});
	}

	async execute({ client, message }) {
		try {
			const player = client.music.getPlayer(message.guild.id);

			if (!player || !player.queue.current) {
				return message.reply({
					components: [
						this._createErrorContainer("No song is currently playing."),
					],
					flags: MessageFlags.IsComponentsV2,
				});
			}

			const loadingMsg = await message.reply({
				components: [this._createLoadingContainer()],
				flags: MessageFlags.IsComponentsV2,
			});

			const track = player.queue.current;
			const lyricsResult = await this._fetchGeniusLyrics(track);

			if (!lyricsResult || !lyricsResult.text) {
				return loadingMsg.edit({
					components: [
						this._createErrorContainer(`No lyrics found for "${track.info.title}" by ${track.info.author}`),
					],
					flags: MessageFlags.IsComponentsV2,
				});
			}

			await this._displayStaticLyrics(
				loadingMsg,
				lyricsResult,
				track,
				message.guild.id,
				message.author.id,
				false
			);
		} catch (error) {
			logger.error(
				"LyricsCommand",
				`Error in prefix command: ${error.message}`,
				error,
			);
			const errorContainer = this._createErrorContainer(
				"An error occurred while fetching lyrics from Genius.",
			);
			if (message) {
				await message
					.reply({
						components: [errorContainer],
						flags: MessageFlags.IsComponentsV2,
					})
					.catch(() => {});
			}
		}
	}

	async slashExecute({ client, interaction }) {
		try {
			const player = client.music.getPlayer(interaction.guild.id);

			if (!player || !player.current) {
				return interaction.reply({
					components: [
						this._createErrorContainer("No song is currently playing."),
					],
					flags: MessageFlags.IsComponentsV2,
					ephemeral: true,
				});
			}

			await interaction.reply({
				components: [this._createLoadingContainer()],
				flags: MessageFlags.IsComponentsV2,
			});

			const track = player.current;
			const lyricsResult = await this._fetchGeniusLyrics(track);

			if (!lyricsResult || !lyricsResult.text) {
				return interaction.editReply({
					components: [
						this._createErrorContainer(`No lyrics found for "${track.info.title}" by ${track.info.author}`),
					],
					flags: MessageFlags.IsComponentsV2,
				});
			}

			await this._displayStaticLyrics(
				interaction,
				lyricsResult,
				track,
				interaction.guild.id,
				interaction.user.id,
				true
			);
		} catch (error) {
			logger.error(
				"LyricsCommand",
				`Error in slash command: ${error.message}`,
				error,
			);
			const errorPayload = {
				components: [
					this._createErrorContainer(
						"An error occurred while fetching lyrics from Genius.",
					),
				],
				flags: MessageFlags.IsComponentsV2,
				ephemeral: true,
			};
			try {
				if (interaction.replied || interaction.deferred) {
					await interaction.editReply(errorPayload);
				} else {
					await interaction.reply(errorPayload);
				}
			} catch (e) {}
		}
	}

	async _fetchGeniusLyrics(track) {
		try {
			const artist = this._cleanString(track.info.author);
			const title = this._cleanString(track.info.title);

			// Clean the title for better search results
			const cleanTitle = this._prepareSearchQuery(title);
			const cleanArtist = this._prepareSearchQuery(artist);

			logger.info("LyricsCommand", `Searching Genius for: ${cleanTitle} by ${cleanArtist}`);

			// Step 1: Search for the song on Genius
			const searchUrl = await this._searchGenius(cleanArtist, cleanTitle);
			
			if (!searchUrl) {
				logger.warn("LyricsCommand", "No results found on Genius");
				return null;
			}

			// Step 2: Fetch lyrics from the song page
			const lyrics = await this._fetchLyricsFromGeniusPage(searchUrl);
			
			if (lyrics) {
				return {
					text: lyrics,
					sourceName: "Genius",
					provider: "Genius.com",
					url: searchUrl
				};
			}

		} catch (error) {
			logger.error("LyricsCommand", `Error fetching from Genius: ${error.message}`, error);
			throw error;
		}

		return null;
	}

	async _searchGenius(artist, title) {
		try {
			const searchQuery = `${artist} ${title}`.replace(/\s+/g, '+');
			const searchUrl = `https://genius.com/api/search/multi?per_page=5&q=${encodeURIComponent(searchQuery)}`;
			
			const response = await fetch(searchUrl, {
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
					'Accept': 'application/json, text/plain, */*',
				},
				timeout: 10000
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			const data = await response.json();
			
			// Look for song results in the response
			if (data.response && data.response.sections) {
				for (const section of data.response.sections) {
					if (section.type === 'song' && section.hits) {
						for (const hit of section.hits) {
							if (hit.result && hit.result.url) {
								// Basic relevance check
								const resultTitle = this._cleanString(hit.result.title).toLowerCase();
								const resultArtist = this._cleanString(hit.result.artist_names).toLowerCase();
								const searchTitle = title.toLowerCase();
								const searchArtist = artist.toLowerCase();
								
								if (resultTitle.includes(searchTitle) || searchTitle.includes(resultTitle)) {
									return hit.result.url;
								}
							}
						}
					}
				}
			}

			// Fallback: Try direct HTML search
			return await this._searchGeniusHtml(artist, title);

		} catch (error) {
			logger.error("LyricsCommand", `Genius search failed: ${error.message}`);
			// Fallback to HTML search
			return await this._searchGeniusHtml(artist, title);
		}
	}

	async _searchGeniusHtml(artist, title) {
		try {
			const searchQuery = `${artist} ${title}`.replace(/\s+/g, '+');
			const searchUrl = `https://genius.com/search?q=${encodeURIComponent(searchQuery)}`;
			
			const response = await fetch(searchUrl, {
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
				},
				timeout: 10000
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			const html = await response.text();
			
			// Extract song URLs from search results
			const songPattern = /<a href="(https:\/\/genius\.com\/[^"]*-lyrics)"[^>]*>/gi;
			const matches = [];
			let match;
			
			while ((match = songPattern.exec(html)) !== null) {
				matches.push(match[1]);
			}
			
			return matches.length > 0 ? matches[0] : null;

		} catch (error) {
			logger.error("LyricsCommand", `HTML search failed: ${error.message}`);
			return null;
		}
	}

	async _fetchLyricsFromGeniusPage(pageUrl) {
		try {
			const response = await fetch(pageUrl, {
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
				},
				timeout: 15000
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			const html = await response.text();
			return this._extractLyricsFromGenius(html);

		} catch (error) {
			logger.error("LyricsCommand", `Page fetch failed: ${error.message}`);
			throw error;
		}
	}

	_extractLyricsFromGenius(html) {
		// Method 1: Extract from JavaScript data
		const scriptPattern = /window\.__PRELOADED_STATE__\s*=\s*JSON\.parse\('([^']*)'\)/;
		const scriptMatch = html.match(scriptPattern);
		
		if (scriptMatch) {
			try {
				const jsonStr = scriptMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
				const data = JSON.parse(jsonStr);
				
				// Navigate through the JSON structure to find lyrics
				const findLyrics = (obj) => {
					for (const key in obj) {
						if (typeof obj[key] === 'string' && obj[key].includes('[Verse') || obj[key].includes('[Chorus')) {
							return obj[key];
						}
						if (typeof obj[key] === 'object' && obj[key] !== null) {
							const result = findLyrics(obj[key]);
							if (result) return result;
						}
					}
					return null;
				};
				
				const lyrics = findLyrics(data);
				if (lyrics) {
					return this._cleanGeniusLyrics(lyrics);
				}
			} catch (e) {
				logger.warn("LyricsCommand", "Failed to parse JSON data");
			}
		}

		// Method 2: Extract from div with lyrics data
		const divPattern = /<div[^>]*data-lyrics-container[^>]*>([\s\S]*?)<\/div>/gi;
		const divMatches = html.match(divPattern);
		
		if (divMatches) {
			let lyrics = '';
			for (const match of divMatches) {
				lyrics += this._cleanHtml(match) + '\n\n';
			}
			if (lyrics.trim().length > 50) {
				return lyrics.trim();
			}
		}

		// Method 3: Extract from specific lyrics container
		const containerPatterns = [
			/<div[^>]*class="[^"]*lyrics[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
			/<lyrics-content[^>]*>([\s\S]*?)<\/lyrics-content>/i,
			/<div[^>]*data-id="lyrics-root"[^>]*>([\s\S]*?)<\/div>/i
		];
		
		for (const pattern of containerPatterns) {
			const match = html.match(pattern);
			if (match) {
				const lyrics = this._cleanHtml(match[1]);
				if (lyrics.length > 50) {
					return lyrics;
				}
			}
		}

		return null;
	}

	_cleanGeniusLyrics(lyrics) {
		return lyrics
			.replace(/\\n/g, '\n')
			.replace(/\\"/g, '"')
			.replace(/\[([^\]]+)\]/g, '[$1]\n') // Add newline after section headers
			.replace(/\n\s*\n/g, '\n\n')
			.trim();
	}

	_cleanHtml(html) {
		return html
			.replace(/<br\s*\/?>/gi, '\n')
			.replace(/<[^>]*>/g, '')
			.replace(/&nbsp;/g, ' ')
			.replace(/&amp;/g, '&')
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/\n\s*\n/g, '\n\n')
			.trim();
	}

	_prepareSearchQuery(text) {
		return text
			.replace(/\([^)]*\)/g, '') // Remove parentheses content
			.replace(/\[[^\]]*\]/g, '') // Remove bracket content
			.replace(/\b(official|video|audio|lyrics?|mv|hd|4k|remix|version|ft\.?|feat\.?)\b/gi, '')
			.replace(/[^\w\s]/g, '')
			.replace(/\s+/g, ' ')
			.trim();
	}

	_cleanString(str) {
		return str
			.replace(/[^\w\s]/g, '')
			.replace(/\s+/g, ' ')
			.trim();
	}

	async _displayStaticLyrics(
		messageOrInteraction,
		lyricsResult,
		track,
		guildId,
		userId,
		isInteraction = false,
	) {
		const lyrics = lyricsResult.text;
		const chunks = this._chunkLyrics(lyrics);

		if (chunks.length === 1) {
			const container = this._createStaticLyricsContainer(
				track,
				lyricsResult,
				0,
				chunks,
			);
			if (isInteraction) {
				return messageOrInteraction.editReply({ components: [container] });
			} else {
				return messageOrInteraction.edit({ components: [container] });
			}
		}

		let currentPage = 0;
		const totalPages = chunks.length;

		const getButtons = (page) => {
			return new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId(`lyrics_prev_${guildId}_${userId}`)
					.setLabel(`${emoji.get("left")} Previous`)
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(page === 0),
				new ButtonBuilder()
					.setCustomId(`lyrics_next_${guildId}_${userId}`)
					.setLabel(`Next ${emoji.get("right")}`)
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(page === totalPages - 1),
			);
		};

		const initialContainer = this._createStaticLyricsContainer(
			track,
			lyricsResult,
			currentPage,
			chunks,
		);
		initialContainer.addSeparatorComponents(
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
		);
		initialContainer.addActionRowComponents(getButtons(currentPage));

		const response = isInteraction
			? await messageOrInteraction.editReply({ components: [initialContainer] })
			: await messageOrInteraction.edit({ components: [initialContainer] });

		const filter = (i) =>
			i.customId.startsWith("lyrics_") &&
			i.customId.includes(`_${guildId}_${userId}`) &&
			i.user.id === userId;

		const collector = response.createMessageComponentCollector({
			filter,
			time: 300000,
		});

		collector.on("collect", async (interaction) => {
			if (interaction.customId.includes("prev")) {
				currentPage = Math.max(0, currentPage - 1);
			} else if (interaction.customId.includes("next")) {
				currentPage = Math.min(totalPages - 1, currentPage + 1);
			}

			const newContainer = this._createStaticLyricsContainer(
				track,
				lyricsResult,
				currentPage,
				chunks,
			);
			newContainer.addSeparatorComponents(
				new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
			);
			newContainer.addActionRowComponents(getButtons(currentPage));

			await interaction.update({ components: [newContainer] });
		});

		collector.on("end", async () => {
			try {
				const finalContainer = this._createStaticLyricsContainer(
					track,
					lyricsResult,
					currentPage,
					chunks,
				);
				await response.edit({ components: [finalContainer] });
			} catch (error) {}
		});
	}

	_chunkLyrics(lyrics, maxLength = 1800) {
		if (!lyrics || lyrics.trim().length === 0) {
			return ["No lyrics available"];
		}
		
		const chunks = [];
		const lines = lyrics.split("\n");
		let currentChunk = "";

		for (const line of lines) {
			if ((currentChunk + line + "\n").length > maxLength) {
				if (currentChunk.trim()) {
					chunks.push(currentChunk.trim());
				}
				currentChunk = line + "\n";
			} else {
				currentChunk += line + "\n";
			}
		}

		if (currentChunk.trim()) {
			chunks.push(currentChunk.trim());
		}

		return chunks.length > 0 ? chunks : ["No lyrics available"];
	}

	_createLoadingContainer() {
		const container = new ContainerBuilder();

		container.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(
				`${emoji.get("loading")} **Fetching Lyrics from Genius**`,
			),
		);

		container.addSeparatorComponents(
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
		);

		const section = new SectionBuilder()
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					"Searching for lyrics on Genius...",
				),
			)
			.setThumbnailAccessory(
				new ThumbnailBuilder().setURL(
					config.assets?.searchIcon || config.assets?.defaultTrackArtwork,
				),
			);

		container.addSectionComponents(section);

		return container;
	}

	_createErrorContainer(message) {
		const container = new ContainerBuilder();

		container.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(
				`${emoji.get("cross")} **Lyrics Error**`,
			),
		);

		container.addSeparatorComponents(
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
		);

		const section = new SectionBuilder()
			.addTextDisplayComponents(new TextDisplayBuilder().setContent(message))
			.setThumbnailAccessory(
				new ThumbnailBuilder().setURL(
					config.assets?.errorIcon || config.assets?.defaultTrackArtwork,
				),
			);

		container.addSectionComponents(section);

		return container;
	}

	_createStaticLyricsContainer(track, lyricsResult, currentPage, chunks) {
		const container = new ContainerBuilder();
		const totalPages = chunks.length;

		const title =
			totalPages > 1
				? `${emoji.get("music")} **Lyrics from Genius** (Page ${currentPage + 1}/${totalPages})`
				: `${emoji.get("music")} **Lyrics from Genius**`;

		container.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(title),
		);

		container.addSeparatorComponents(
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
		);

		const trackSection = new SectionBuilder()
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(`**${track.info.title}**`),
				new TextDisplayBuilder().setContent(
					`by ${track.info.author || "Unknown"} | ${this._formatDuration(track.info.duration)}`,
				),
			)
			.setThumbnailAccessory(
				new ThumbnailBuilder().setURL(
					track.info.artworkUrl || config.assets?.defaultTrackArtwork,
				),
			);

		container.addSectionComponents(trackSection);

		container.addSeparatorComponents(
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
		);

		const lyricsSection = new SectionBuilder()
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(chunks[currentPage]),
			)
			.setThumbnailAccessory(
				new ThumbnailBuilder().setURL(
					config.assets?.lyricsIcon || config.assets?.defaultTrackArtwork,
				),
			);

		container.addSectionComponents(lyricsSection);

		container.addSeparatorComponents(
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
		);

		const sourceSection = new SectionBuilder()
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					`Source: ${lyricsResult.sourceName} | Provider: ${lyricsResult.provider}`,
				),
			)
			.setButtonAccessory(
				new ButtonBuilder()
					.setURL(lyricsResult.url || "https://genius.com")
					.setLabel("View on Genius")
					.setStyle(ButtonStyle.Link),
			);

		container.addSectionComponents(sourceSection);

		return container;
	}

	_formatDuration(ms) {
		if (!ms || ms < 0) return "Live";
		const seconds = Math.floor((ms / 1000) % 60)
			.toString()
			.padStart(2, "0");
		const minutes = Math.floor((ms / (1000 * 60)) % 60)
			.toString()
			.padStart(2, "0");
		const hours = Math.floor(ms / (1000 * 60 * 60));
		if (hours > 0) return `${hours}:${minutes}:${seconds}`;
		return `${minutes}:${seconds}`;
	}
}

export default new LyricsCommand();