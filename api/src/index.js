import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { Resend } from "resend";
import deepseekService from "../services/deepseek.js";
// import authRoutes from "../routes/auth.js"; // DISABLED - Auth handled client-side via Supabase

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

// =====================================================
// 🔐 AUTHENTICATION
// =====================================================
// Auth handled client-side via Supabase Auth (js/auth.js)
// Backend routes disabled due to session leakage security issue
// app.use("/api/auth", authRoutes);

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
});
