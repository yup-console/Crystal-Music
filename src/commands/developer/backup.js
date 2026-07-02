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
import fs from "fs/promises";
import path from "path";
import archiver from "archiver";
import { createWriteStream } from "fs";

class BackupCommand extends Command {
	constructor() {
		super({
			name: "backup",
			description: "Creates a backup of the bot code and sends it as a tar.gz file",
			aliases: ["backupcode", "savebackup"],
			category: "developer",
			ownerOnly: true,
		});
	}

	async execute({ client, message }) {
		console.log("Backup command executed by:", message.author.tag);

		const title = "Code Backup";

		// Initial message
		const initialContainer = new ContainerBuilder();
		initialContainer.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(`### ${emoji.get("loading")} ${title}`)
		);
		initialContainer.addSeparatorComponents(
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
		);
		initialContainer.addSectionComponents(
			new SectionBuilder()
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent("**Starting Backup Process...**"),
					new TextDisplayBuilder().setContent("Preparing to backup all files...")
				)
				.setThumbnailAccessory(
					new ThumbnailBuilder().setURL(config.assets.defaultThumbnail)
				)
		);

		console.log("Sending initial message...");
		const processingMessage = await message.reply({
			components: [initialContainer],
			flags: MessageFlags.IsComponentsV2,
		});
		console.log("Initial message sent");

		try {
			// Create backup directory
			const backupDir = path.join(process.cwd(), "backups");
			await fs.mkdir(backupDir, { recursive: true });
			console.log("Backup directory created:", backupDir);

			// Generate filename
			const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
			const backupFileName = `backup-${timestamp}.tar.gz`;
			const backupPath = path.join(backupDir, backupFileName);
			console.log("Backup path:", backupPath);

			// Update message - Creating backup
			const creatingContainer = new ContainerBuilder();
			creatingContainer.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(`### ${emoji.get("loading")} ${title}`)
			);
			creatingContainer.addSeparatorComponents(
				new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
			);
			creatingContainer.addSectionComponents(
				new SectionBuilder()
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent("**Creating Backup...**"),
						new TextDisplayBuilder().setContent("Backing up all project files...")
					)
					.setThumbnailAccessory(
						new ThumbnailBuilder().setURL(config.assets.defaultThumbnail)
					)
			);

			await processingMessage.edit({
				components: [creatingContainer],
				flags: MessageFlags.IsComponentsV2,
			});

			// Create tar.gz archive
			const output = createWriteStream(backupPath);
			const archive = archiver("tar", {
				gzip: true,
				gzipOptions: { level: 9 },
			});

			// Setup archive events
			let totalFiles = 0;
			archive.on("entry", (entry) => {
				if (entry.name && !entry.name.endsWith("/")) {
					totalFiles++;
					console.log("Adding file:", entry.name);
				}
			});

			archive.on("progress", (progress) => {
				console.log(
					`Progress: ${progress.entries.processed} files, ${Math.round(
						progress.fs.processedBytes / 1024
					)}KB`
				);
			});

			archive.on("warning", (err) => {
				console.warn("Archive warning:", err);
			});

			archive.on("error", (err) => {
				console.error("Archive error:", err);
				throw err;
			});

			const archiveFinished = new Promise((resolve, reject) => {
				output.on("close", () => {
					console.log("Archive finished, total bytes:", archive.pointer());
					resolve(archive.pointer());
				});
				output.on("error", reject);
			});

			archive.pipe(output);

			// Recursive function to add all files except excluded dirs
			const addAllFiles = async (dirPath, archivePath = "") => {
				const items = await fs.readdir(dirPath);
				for (const item of items) {
					const fullPath = path.join(dirPath, item);
					const relativePath = path.join(archivePath, item);
					const stat = await fs.stat(fullPath);

					// Skip ignored folders
					if (
						item === "node_modules" ||
						item === "backups" ||
						item === ".npm"
					) {
						console.log("Skipping:", fullPath);
						continue;
					}

					if (stat.isDirectory()) {
						await addAllFiles(fullPath, relativePath);
					} else if (stat.isFile()) {
						archive.file(fullPath, { name: relativePath });
					}
				}
			};

			console.log("Starting to backup all files...");
			const rootDir = process.cwd();
			await addAllFiles(rootDir, "");

			console.log("Finalizing archive...");
			await archive.finalize();
			const finalSize = await archiveFinished;
			console.log(
				`Backup completed with ${totalFiles} files, ${finalSize} bytes`
			);

			// Update message - Sending backup
			const sendingContainer = new ContainerBuilder();
			sendingContainer.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(`### ${emoji.get("loading")} ${title}`)
			);
			sendingContainer.addSeparatorComponents(
				new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
			);
			sendingContainer.addSectionComponents(
				new SectionBuilder()
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent("**Sending Backup...**"),
						new TextDisplayBuilder().setContent(
							`Preparing to send ${totalFiles} files (${this.formatBytes(
								finalSize
							)})...`
						)
					)
					.setThumbnailAccessory(
						new ThumbnailBuilder().setURL(config.assets.defaultThumbnail)
					)
			);

			await processingMessage.edit({
				components: [sendingContainer],
				flags: MessageFlags.IsComponentsV2,
			});

			console.log("Sending DM to user...");
			await message.author.send({
				content: `🔐 **Bot Code Backup**\nCreated at: <t:${Math.floor(
					Date.now() / 1000
				)}:F>\n📦 **Files:** ${totalFiles}\n💾 **Size:** ${this.formatBytes(
					finalSize
				)}`,
				files: [
					{
						attachment: backupPath,
						name: backupFileName,
						description: "Complete bot code backup (tar.gz)",
					},
				],
			});
			console.log("DM sent successfully");

			// Final success message
			const successContainer = new ContainerBuilder();
			successContainer.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					`### ${emoji.get("check")} ${title} - Complete`
				)
			);
			successContainer.addSeparatorComponents(
				new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
			);
			successContainer.addSectionComponents(
				new SectionBuilder()
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent("**Backup Complete!**"),
						new TextDisplayBuilder().setContent(
							`✅ Backup sent to your DMs!\n📦 Files: ${totalFiles}\n💾 Size: ${this.formatBytes(
								finalSize
							)}`
						)
					)
					.setThumbnailAccessory(
						new ThumbnailBuilder().setURL(config.assets.defaultThumbnail)
					)
			);
			successContainer.addSeparatorComponents(
				new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
			);
			successContainer.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					`Backup created at: <t:${Math.floor(Date.now() / 1000)}:R>`
				)
			);

			await processingMessage.edit({
				components: [successContainer],
				flags: MessageFlags.IsComponentsV2,
			});

			console.log("Backup process completed successfully");

			// Cleanup after 30s
			setTimeout(async () => {
				try {
					await fs.unlink(backupPath);
					console.log("Temporary backup file cleaned up");
				} catch (cleanupError) {
					console.warn(
						"Could not clean up backup file:",
						cleanupError.message
					);
				}
			}, 30000);
		} catch (error) {
			console.error("Backup command error:", error);

			const errorContainer = new ContainerBuilder();
			errorContainer.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					`### ${emoji.get("cross")} ${title} - Failed`
				)
			);
			errorContainer.addSeparatorComponents(
				new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
			);
			errorContainer.addSectionComponents(
				new SectionBuilder()
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent("**Backup Failed**"),
						new TextDisplayBuilder().setContent(
							"An error occurred while creating the backup."
						)
					)
					.setThumbnailAccessory(
						new ThumbnailBuilder().setURL(config.assets.defaultThumbnail)
					)
			);
			errorContainer.addSeparatorComponents(
				new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
			);
			errorContainer.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(`Error: ${error.message}`)
			);

			await processingMessage.edit({
				components: [errorContainer],
				flags: MessageFlags.IsComponentsV2,
			});
		}
	}

	formatBytes(bytes) {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return (
			parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
		);
	}
}

export default new BackupCommand();