import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { Resend } from "resend";
import multer from "multer";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import deepseekService from "../services/deepseek.js";
import r2Service from "../services/r2.js";
import watermarkService from "../services/watermark.js";
import { createCompleteProfile } from "../db/storage.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS configuration
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Ensure temp directory exists for uploads
const TEMP_DIR = path.join(__dirname, "../temp");
await fs.mkdir(TEMP_DIR, { recursive: true }).catch(() => {});

// Configure multer for video uploads (store on disk to avoid memory exhaustion)
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, TEMP_DIR);
    },
    filename: (req, file, cb) => {
      const uniqueName = `upload-${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    }
  }),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept video files only
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("فقط ملفات الفيديو مسموح بها"), false);
    }
  },
});

// API Routes
app.get("/api", (req, res) => {
  res.json({ success: true, message: "🚀 API UGC Maroc is running successfully!" });
});

app.get("/api/ping", (req, res) => {
  res.status(200).json({
    success: true,
    message: "✅ API connectée avec succès !",
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/send-email", async (req, res) => {
  try {
    const { to, subject, message } = req.body;
    if (!to || !subject || !message) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ success: false, message: 'Email service not configured' });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const data = await resend.emails.send({
      from: 'UGC Maroc <noreply@ugc-maroc.com>',
      to,
      subject,
      html: `<p>${message}</p>`
    });

    return res.status(200).json({ success: true, id: data.id });
  } catch (error) {
    console.error('Resend error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Environment config endpoint for frontend
app.get("/api/config", (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ""
  });
});

// =====================================================
// 👤 USER PROFILE CREATION - Replit PostgreSQL
// =====================================================

app.post("/api/create-profile", async (req, res) => {
  try {
    const { userId, email, fullName, phone, role, metadata } = req.body;

    // Validation
    if (!userId || !email || !fullName || !role) {
      return res.status(400).json({
        success: false,
        message: "البيانات المطلوبة: userId, email, fullName, role"
      });
    }

    if (!['creator', 'brand', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "الدور غير صالح (creator, brand, admin فقط)"
      });
    }

    // Create complete profile in Replit PostgreSQL
    const result = await createCompleteProfile({
      userId,
      email,
      fullName,
      role
    }, metadata || {});

    return res.status(201).json({
      success: true,
      message: "تم إنشاء الملف الشخصي بنجاح! ✨",
      profile: result.profile
    });

  } catch (error) {
    console.error("❌ Error creating profile:", error);
    
    // Check for specific errors
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        success: false,
        message: "هذا البريد الإلكتروني مستخدم بالفعل"
      });
    }

    return res.status(500).json({
      success: false,
      message: "خطأ في إنشاء الملف الشخصي",
      error: error.message
    });
  }
});

// =====================================================
// 🎬 VIDEO UPLOAD ENDPOINT - R2 + Watermark
// =====================================================

app.post("/api/upload-video", upload.single("video"), async (req, res) => {
  let tempInputPath = null;
  let tempOutputPath = null;

  try {
    console.log("📹 Starting video upload process...");

    // Validate video file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "لم يتم رفع ملف الفيديو"
      });
    }

    // Get campaign info from request
    const { campaignId, campaignName = "UGC Maroc" } = req.body;

    // Generate unique file names
    const videoId = uuidv4();
    const originalExtension = path.extname(req.file.originalname);
    const fileName = `${videoId}${originalExtension}`;

    // Multer already saved to disk, use that path
    tempInputPath = req.file.path;
    tempOutputPath = path.join(path.dirname(tempInputPath), `output-${fileName}`);

    // Apply watermark using FFmpeg (sanitize campaign name to prevent injection)
    console.log("🎨 Applying watermark...");
    const sanitizedCampaignName = (campaignName || "UGC Maroc").replace(/['"\\]/g, '');
    const watermarkResult = await watermarkService.applyWatermark(
      tempInputPath,
      tempOutputPath,
      {
        campaignName: sanitizedCampaignName,
        position: "bottom-right"
      }
    );

    if (!watermarkResult.success) {
      throw new Error("فشل في تطبيق العلامة المائية");
    }

    // Upload to Cloudflare R2 (stream from disk, no memory load)
    const r2Key = campaignId 
      ? `videos/campaign-${campaignId}/${fileName}`
      : `videos/${fileName}`;

    console.log(`☁️ Uploading to R2: ${r2Key}`);
    const uploadResult = await r2Service.uploadFileToR2(
      tempOutputPath,
      r2Key,
      req.file.mimetype
    );

    // Cleanup temp files (both input and output)
    console.log("🧹 Cleaning up temporary files...");
    await fs.unlink(tempInputPath).catch((err) => console.warn("Cleanup warning:", err.message));
    await fs.unlink(tempOutputPath).catch((err) => console.warn("Cleanup warning:", err.message));

    console.log("✅ Video upload completed successfully!");

    // Return success response
    return res.status(200).json({
      success: true,
      message: "تم رفع الفيديو بنجاح! ✨",
      data: {
        videoId: videoId,
        fileName: fileName,
        publicUrl: uploadResult.publicUrl,
        r2Key: uploadResult.key,
        size: uploadResult.size,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype
      }
    });

  } catch (error) {
    console.error("❌ Error uploading video:", error);

    // Cleanup temp files on error
    if (tempInputPath) {
      await fs.unlink(tempInputPath).catch(() => {});
    }
    if (tempOutputPath) {
      await fs.unlink(tempOutputPath).catch(() => {});
    }

    return res.status(500).json({
      success: false,
      message: "خطأ في رفع الفيديو. حاول مرة أخرى.",
      error: error.message
    });
  }
});

// =====================================================
// 🤖 AI ENDPOINTS - DeepSeek Integration
// =====================================================

// 1. مولد السكريبت - Generate UGC Script
app.post("/api/ai/generate-script", async (req, res) => {
  try {
    const { briefData } = req.body;
    
    if (!briefData) {
      return res.status(400).json({ 
        success: false, 
        message: "بيانات البريف مطلوبة" 
      });
    }

    const script = await deepseekService.generateScript(briefData);
    
    return res.status(200).json({
      success: true,
      script: script,
      message: "تم توليد السكريبت بنجاح ✨"
    });
  } catch (error) {
    console.error("❌ Error generating script:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في توليد السكريبت. حاول مرة أخرى.",
      error: error.message
    });
  }
});

// 2. اقتراحات المحتوى - Content Suggestions
app.post("/api/ai/suggest-content", async (req, res) => {
  try {
    const { campaignData } = req.body;
    
    if (!campaignData) {
      return res.status(400).json({ 
        success: false, 
        message: "بيانات الحملة مطلوبة" 
      });
    }

    const suggestions = await deepseekService.suggestContent(campaignData);
    
    return res.status(200).json({
      success: true,
      suggestions: suggestions,
      message: "تم توليد الاقتراحات بنجاح 💡"
    });
  } catch (error) {
    console.error("❌ Error generating suggestions:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في توليد الاقتراحات. حاول مرة أخرى.",
      error: error.message
    });
  }
});

// 3. تحليل الأداء - Predict Performance
app.post("/api/ai/predict-performance", async (req, res) => {
  try {
    const { videoData } = req.body;
    
    if (!videoData) {
      return res.status(400).json({ 
        success: false, 
        message: "بيانات الفيديو مطلوبة" 
      });
    }

    const prediction = await deepseekService.predictPerformance(videoData);
    
    return res.status(200).json({
      success: true,
      prediction: prediction,
      message: "تم تحليل الأداء بنجاح 📊"
    });
  } catch (error) {
    console.error("❌ Error predicting performance:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في تحليل الأداء. حاول مرة أخرى.",
      error: error.message
    });
  }
});

// 4. مولد البريف - Generate Campaign Brief
app.post("/api/ai/generate-brief", async (req, res) => {
  try {
    const { campaignInfo } = req.body;
    
    if (!campaignInfo) {
      return res.status(400).json({ 
        success: false, 
        message: "معلومات الحملة مطلوبة" 
      });
    }

    const brief = await deepseekService.generateBrief(campaignInfo);
    
    return res.status(200).json({
      success: true,
      brief: brief,
      message: "تم توليد البريف بنجاح 📝"
    });
  } catch (error) {
    console.error("❌ Error generating brief:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في توليد البريف. حاول مرة أخرى.",
      error: error.message
    });
  }
});

// 5. توصيات المبدعين - Match Creators
app.post("/api/ai/match-creators", async (req, res) => {
  try {
    const { campaignData, creatorsPool } = req.body;
    
    if (!campaignData || !creatorsPool) {
      return res.status(400).json({ 
        success: false, 
        message: "بيانات الحملة والمبدعين مطلوبة" 
      });
    }

    const matches = await deepseekService.matchCreators(campaignData, creatorsPool);
    
    return res.status(200).json({
      success: true,
      matches: matches,
      message: "تم إيجاد المبدعين المناسبين 🎯"
    });
  } catch (error) {
    console.error("❌ Error matching creators:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في إيجاد المبدعين. حاول مرة أخرى.",
      error: error.message
    });
  }
});

// Serve static files with proper cache control
app.use(express.static(path.join(__dirname, "../../"), {
  setHeaders: (res, filePath) => {
    // No cache for HTML files to ensure updates are visible
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

// SPA fallback - serve index.html for all non-API routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../index.html"));
});

// Start server on port 5000 for Replit
const PORT = 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
  console.log(`📡 API endpoints available at /api/*`);
  console.log(`🎬 Video upload endpoint: POST /api/upload-video`);
});
