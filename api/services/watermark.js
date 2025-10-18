import ffmpeg from "fluent-ffmpeg";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to watermark logo
const WATERMARK_LOGO = path.join(__dirname, "../assets/watermark-logo.png");

/**
 * Apply watermark to video using FFmpeg
 * @param {string} inputPath - Path to input video file
 * @param {string} outputPath - Path to save watermarked video
 * @param {Object} options - Watermark options
 * @param {string} options.campaignName - Campaign name to overlay on video
 * @param {string} options.position - Position of watermark (default: "bottom-right")
 * @returns {Promise<{success: boolean, outputPath: string}>}
 */
export async function applyWatermark(inputPath, outputPath, options = {}) {
  const {
    campaignName = "UGC Maroc",
    position = "bottom-right",
  } = options;

  return new Promise(async (resolve, reject) => {
    try {
      // Verify watermark logo exists
      try {
        await fs.access(WATERMARK_LOGO);
      } catch {
        console.warn("⚠️ Watermark logo not found, creating text-only watermark");
      }

      // Calculate watermark position
      let overlayPosition;
      switch (position) {
        case "top-left":
          overlayPosition = "10:10";
          break;
        case "top-right":
          overlayPosition = "W-w-10:10";
          break;
        case "bottom-left":
          overlayPosition = "10:H-h-10";
          break;
        case "bottom-right":
        default:
          overlayPosition = "W-w-10:H-h-10";
          break;
      }

      // Build FFmpeg command
      const command = ffmpeg(inputPath);

      // Check if logo exists
      const logoExists = await fs.access(WATERMARK_LOGO).then(() => true).catch(() => false);

      if (logoExists) {
        // Apply logo watermark with 60% opacity
        command.input(WATERMARK_LOGO)
          .complexFilter([
            // Resize logo to 15% of video width
            "[1:v]scale=iw*0.15:-1,format=rgba,colorchannelmixer=aa=0.6[logo]",
            // Overlay logo on video
            `[0:v][logo]overlay=${overlayPosition}[v1]`,
            // Add campaign name text on top-left
            `[v1]drawtext=text='${campaignName}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=24:fontcolor=white@0.7:x=10:y=10:shadowcolor=black@0.5:shadowx=2:shadowy=2[out]`
          ], "out");
      } else {
        // Text-only watermark
        command.complexFilter([
          // Add "UGC Maroc" text at bottom-right
          `[0:v]drawtext=text='UGC Maroc':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=32:fontcolor=white@0.7:x=W-tw-10:y=H-th-10:shadowcolor=black@0.5:shadowx=2:shadowy=2[v1]`,
          // Add campaign name at top-left
          `[v1]drawtext=text='${campaignName}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=24:fontcolor=white@0.7:x=10:y=10:shadowcolor=black@0.5:shadowx=2:shadowy=2[out]`
        ], "out");
      }

      // Output configuration
      command
        .outputOptions([
          "-c:v libx264",     // H.264 codec
          "-preset fast",     // Fast encoding
          "-crf 23",          // Quality (lower = better)
          "-c:a copy",        // Copy audio without re-encoding
        ])
        .output(outputPath)
        .on("start", (commandLine) => {
          console.log(`🎬 FFmpeg started: ${commandLine}`);
        })
        .on("progress", (progress) => {
          if (progress.percent) {
            console.log(`⏳ Processing: ${Math.round(progress.percent)}%`);
          }
        })
        .on("end", () => {
          console.log(`✅ Watermark applied successfully: ${outputPath}`);
          resolve({
            success: true,
            outputPath,
          });
        })
        .on("error", (err, stdout, stderr) => {
          console.error("❌ FFmpeg error:", err.message);
          console.error("stderr:", stderr);
          reject(new Error(`Watermarking failed: ${err.message}`));
        })
        .run();

    } catch (error) {
      console.error("❌ Error in applyWatermark:", error);
      reject(error);
    }
  });
}

export default {
  applyWatermark,
};
