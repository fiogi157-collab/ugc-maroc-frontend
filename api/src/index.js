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
import { authMiddleware, ownershipMiddleware } from "../middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS configuration
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Request logging middleware for debugging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Ensure temp directory exists for uploads
const TEMP_DIR = path.join(__dirname, "../temp");
await fs.mkdir(TEMP_DIR, { recursive: true }).catch(() => {});

// Configure multer for video uploads (UGC submissions - videos only)
const uploadVideo = multer({
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

// Configure multer for campaign media (images AND videos)
const uploadMedia = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, TEMP_DIR);
    },
    filename: (req, file, cb) => {
      const uniqueName = `media-${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    }
  }),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size for campaign media
  },
  fileFilter: (req, file, cb) => {
    // Accept images and videos
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("فقط الصور والفيديوهات مسموح بها"), false);
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
  // Construct API URL from Replit domain or use the request host
  const replitDomain = process.env.REPLIT_DEV_DOMAIN;
  const apiUrl = replitDomain 
    ? `https://${replitDomain}` 
    : `${req.protocol}://${req.get('host')}`;
  
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
    apiUrl: apiUrl
  });
});

// =====================================================
// 👤 USER PROFILE ENDPOINTS - Replit PostgreSQL
// =====================================================

// Create complete profile (profile + wallet + creator/brand)
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

// Get user profile by ID
app.get("/api/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "معرف المستخدم مطلوب"
      });
    }

    // Import storage functions
    const { getUserProfile } = await import("../db/storage.js");
    const profile = await getUserProfile(userId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "الملف الشخصي غير موجود"
      });
    }

    return res.status(200).json({
      success: true,
      profile: profile
    });

  } catch (error) {
    console.error("❌ Error fetching profile:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في تحميل الملف الشخصي",
      error: error.message
    });
  }
});

// Get complete dashboard data for creator
app.get("/api/creator/dashboard-data/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "معرف المستخدم مطلوب"
      });
    }

    const db = await import("../db/client.js").then(m => m.db);
    const { profiles, wallets, creators, submissions, campaigns } = await import("../db/schema.js");
    const { eq, and, inArray } = await import("drizzle-orm");

    // Fetch profile
    const profileData = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
    const profile = profileData[0] || null;

    // Fetch wallet
    const walletData = await db.select().from(wallets).where(eq(wallets.user_id, userId)).limit(1);
    const wallet = walletData[0] || { balance: 0, pending_balance: 0 };

    // Fetch creator data
    const creatorData = await db.select().from(creators).where(eq(creators.user_id, userId)).limit(1);
    const creator = creatorData[0] || null;

    // Fetch submissions statistics
    const allSubmissions = await db.select().from(submissions).where(eq(submissions.creator_id, userId));
    
    const accepted = allSubmissions.filter(s => s.status === 'approved').length;
    const rejected = allSubmissions.filter(s => s.status === 'rejected').length;
    const total = allSubmissions.length;
    const acceptanceRate = total > 0 ? Math.round((accepted / total) * 100) : 0;

    // Fetch active campaigns (submissions in progress/pending)
    const activeSubmissions = await db.select({
      id: submissions.id,
      status: submissions.status,
      submittedAt: submissions.submitted_at,
      campaignId: submissions.campaign_id
    })
    .from(submissions)
    .where(
      and(
        eq(submissions.creator_id, userId),
        inArray(submissions.status, ['pending', 'in_progress'])
      )
    )
    .limit(5);

    // Fetch campaign details for active submissions
    const campaignIds = activeSubmissions.map(s => s.campaignId).filter(Boolean);
    let activeCampaigns = [];
    
    if (campaignIds.length > 0) {
      const campaignDetails = await db.select({
        id: campaigns.id,
        title: campaigns.title,
        deadline: campaigns.deadline
      })
      .from(campaigns)
      .where(inArray(campaigns.id, campaignIds));

      activeCampaigns = activeSubmissions.map(sub => {
        const campaign = campaignDetails.find(c => c.id === sub.campaignId);
        return {
          id: sub.id,
          status: sub.status,
          campaign: campaign || null
        };
      });
    }

    // Fetch available opportunities (active campaigns)
    const opportunities = await db.select({
      id: campaigns.id,
      title: campaigns.title,
      budget: campaigns.budget,
      contentType: campaigns.content_type
    })
    .from(campaigns)
    .where(eq(campaigns.status, 'active'))
    .limit(3);

    return res.status(200).json({
      success: true,
      data: {
        profile: profile ? {
          fullName: profile.full_name,
          avatarUrl: profile.avatar_url
        } : null,
        wallet: {
          balance: parseFloat(wallet.balance || 0),
          pendingAmount: parseFloat(wallet.pending_balance || 0),
          completed: parseFloat(wallet.balance || 0) - parseFloat(wallet.pending_balance || 0)
        },
        statistics: {
          accepted,
          rejected,
          total,
          acceptanceRate
        },
        activeCampaigns,
        opportunities
      }
    });

  } catch (error) {
    console.error("❌ Error fetching creator dashboard data:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في تحميل بيانات لوحة التحكم",
      error: error.message
    });
  }
});

// Get all available campaigns
app.get("/api/campaigns/available", async (req, res) => {
  try {
    const db = await import("../db/client.js").then(m => m.db);
    const { campaigns, brands, profiles } = await import("../db/schema.js");
    const { eq } = await import("drizzle-orm");

    // Fetch all active campaigns with brand info
    const allCampaigns = await db.select({
      id: campaigns.id,
      title: campaigns.title,
      description: campaigns.description,
      budget: campaigns.budget,
      deadline: campaigns.deadline,
      status: campaigns.status,
      content_type: campaigns.content_type,
      video_duration: campaigns.video_duration,
      category: campaigns.category,
      difficulty: campaigns.difficulty,
      created_at: campaigns.created_at,
      brand_id: campaigns.brand_id
    })
    .from(campaigns)
    .where(eq(campaigns.status, 'active'))
    .orderBy(campaigns.created_at);

    // Get unique brand IDs
    const brandIds = [...new Set(allCampaigns.map(c => c.brand_id).filter(Boolean))];
    
    // Fetch brand details
    let brandDetails = {};
    if (brandIds.length > 0) {
      const { inArray } = await import("drizzle-orm");
      const brandsData = await db.select({
        user_id: brands.user_id,
        company_name: brands.company_name
      })
      .from(brands)
      .where(inArray(brands.user_id, brandIds));
      
      brandDetails = brandsData.reduce((acc, brand) => {
        acc[brand.user_id] = brand.company_name;
        return acc;
      }, {});
    }

    // Format campaigns with brand names
    const formattedCampaigns = allCampaigns.map(campaign => ({
      id: campaign.id,
      title: campaign.title,
      description: campaign.description,
      budget: parseFloat(campaign.budget || 0),
      deadline: campaign.deadline,
      status: campaign.status,
      content_type: campaign.content_type,
      video_duration: campaign.video_duration,
      category: campaign.category || 'other',
      difficulty: campaign.difficulty || 'intermediate',
      created_at: campaign.created_at,
      brand_id: campaign.brand_id,
      brand_name: brandDetails[campaign.brand_id] || 'علامة تجارية',
      image_url: null // Can be added later
    }));

    return res.status(200).json({
      success: true,
      campaigns: formattedCampaigns,
      count: formattedCampaigns.length
    });

  } catch (error) {
    console.error("❌ Error fetching available campaigns:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في تحميل الحملات المتاحة",
      error: error.message
    });
  }
});

// Get campaigns by brand ID
app.get("/api/campaigns/brand/:brandId", async (req, res) => {
  try {
    const { brandId } = req.params;
    const db = await import("../db/client.js").then(m => m.db);
    const { campaigns } = await import("../db/schema.js");
    const { eq } = await import("drizzle-orm");

    const brandCampaigns = await db.select()
      .from(campaigns)
      .where(eq(campaigns.brand_id, brandId))
      .orderBy(campaigns.created_at);

    const formattedCampaigns = brandCampaigns.map(campaign => ({
      id: campaign.id,
      title: campaign.title,
      description: campaign.description,
      budget: parseFloat(campaign.budget || 0),
      deadline: campaign.deadline,
      status: campaign.status,
      content_type: campaign.content_type,
      video_duration: campaign.video_duration,
      category: campaign.category || 'other',
      difficulty: campaign.difficulty || 'intermediate',
      created_at: campaign.created_at,
      updated_at: campaign.updated_at,
      brand_id: campaign.brand_id
    }));

    return res.status(200).json({
      success: true,
      campaigns: formattedCampaigns,
      count: formattedCampaigns.length
    });

  } catch (error) {
    console.error("❌ Error fetching brand campaigns:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في تحميل حملات العلامة التجارية",
      error: error.message
    });
  }
});

// Get wallet by user ID
app.get("/api/wallet/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const db = await import("../db/client.js").then(m => m.db);
    const { wallets } = await import("../db/schema.js");
    const { eq } = await import("drizzle-orm");

    const walletData = await db.select()
      .from(wallets)
      .where(eq(wallets.user_id, userId))
      .limit(1);

    if (walletData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المحفظة غير موجودة"
      });
    }

    const wallet = walletData[0];

    return res.status(200).json({
      success: true,
      wallet: {
        user_id: wallet.user_id,
        balance: parseFloat(wallet.balance || 0),
        pending_balance: parseFloat(wallet.pending_balance || 0),
        currency: wallet.currency || 'MAD',
        created_at: wallet.created_at,
        updated_at: wallet.updated_at
      }
    });

  } catch (error) {
    console.error("❌ Error fetching wallet:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في تحميل المحفظة",
      error: error.message
    });
  }
});

// Create a new campaign (protected route)
app.post("/api/campaigns", authMiddleware, async (req, res) => {
  try {
    const { 
      title, description, category, contentTypes, language,
      budget, pricePerUgc, platforms, startDate, endDate,
      productName, productLink, deliveryMethod, mediaFiles, additionalNotes
    } = req.body;

    // Validation
    if (!title || !description || !pricePerUgc) {
      return res.status(400).json({
        success: false,
        message: "المعلومات الأساسية مطلوبة"
      });
    }

    // Get brand_id from authenticated user
    const brand_id = req.user.id;

    const db = await import("../db/client.js").then(m => m.db);
    const { campaigns } = await import("../db/schema.js");
    
    // Insert new campaign
    const newCampaign = await db.insert(campaigns).values({
      brand_id,
      title: title.trim(),
      description: description.trim(),
      category: category || 'other',
      content_type: contentTypes ? JSON.stringify(contentTypes) : JSON.stringify(['video']),
      language: language || 'arabic',
      budget: budget ? parseFloat(budget) : null,
      price_per_ugc: parseFloat(pricePerUgc),
      platforms: platforms ? JSON.stringify(platforms) : JSON.stringify(['instagram']),
      start_date: startDate ? new Date(startDate) : null,
      deadline: endDate ? new Date(endDate) : null,
      product_name: productName || null,
      product_link: productLink || null,
      delivery_method: deliveryMethod || 'no_product',
      media_files: mediaFiles && mediaFiles.length > 0 ? JSON.stringify(mediaFiles) : null,
      additional_notes: additionalNotes || null,
      status: 'active',
      difficulty: 'intermediate',
      created_at: new Date(),
      updated_at: new Date()
    }).returning();

    console.log("✅ Campaign created:", newCampaign[0]?.id);

    return res.status(201).json({
      success: true,
      message: "تم إنشاء الحملة بنجاح! ✨",
      campaign: newCampaign[0]
    });

  } catch (error) {
    console.error("❌ Error creating campaign:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في إنشاء الحملة",
      error: error.message
    });
  }
});

// Get campaign details by ID (protected route)
app.get("/api/campaigns/:id", authMiddleware, async (req, res) => {
  try {
    const campaignId = parseInt(req.params.id);
    
    if (!campaignId || isNaN(campaignId)) {
      return res.status(400).json({
        success: false,
        message: "رقم الحملة غير صحيح"
      });
    }

    const db = await import("../db/client.js").then(m => m.db);
    const { campaigns } = await import("../db/schema.js");
    const { eq } = await import("drizzle-orm");
    
    // Get campaign
    const campaignData = await db.select().from(campaigns).where(eq(campaigns.id, campaignId));
    
    if (!campaignData || campaignData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "الحملة غير موجودة"
      });
    }

    const campaign = campaignData[0];

    // Check ownership - only brand owner can view full details
    if (campaign.brand_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "ليس لديك صلاحية لعرض هذه الحملة"
      });
    }

    // Parse JSON fields
    const campaignDetails = {
      id: campaign.id,
      brand_id: campaign.brand_id,
      title: campaign.title,
      description: campaign.description,
      category: campaign.category,
      content_types: campaign.content_type ? JSON.parse(campaign.content_type) : [],
      language: campaign.language,
      budget: parseFloat(campaign.budget || 0),
      price_per_ugc: parseFloat(campaign.price_per_ugc || 0),
      platforms: campaign.platforms ? JSON.parse(campaign.platforms) : [],
      start_date: campaign.start_date,
      end_date: campaign.deadline,
      product_name: campaign.product_name,
      product_link: campaign.product_link,
      delivery_method: campaign.delivery_method,
      media: campaign.media_files ? JSON.parse(campaign.media_files) : [],
      additional_notes: campaign.additional_notes,
      status: campaign.status,
      difficulty: campaign.difficulty,
      views: campaign.views || 0,
      applicants: campaign.applicants || 0,
      submissions: campaign.submissions || 0,
      created_at: campaign.created_at,
      updated_at: campaign.updated_at
    };

    console.log(`✅ Campaign ${campaignId} details retrieved`);

    return res.status(200).json(campaignDetails);

  } catch (error) {
    console.error("❌ Error fetching campaign:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في تحميل تفاصيل الحملة",
      error: error.message
    });
  }
});

// Update campaign status (pause/resume/close)
app.patch("/api/campaigns/:id/status", authMiddleware, async (req, res) => {
  try {
    const campaignId = parseInt(req.params.id);
    const { status } = req.body;
    
    if (!campaignId || isNaN(campaignId)) {
      return res.status(400).json({
        success: false,
        message: "رقم الحملة غير صحيح"
      });
    }

    // Valid status transitions
    const validStatuses = ['active', 'paused', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "حالة غير صالحة"
      });
    }

    const db = await import("../db/client.js").then(m => m.db);
    const { campaigns } = await import("../db/schema.js");
    const { eq } = await import("drizzle-orm");
    
    // Get campaign and check ownership
    const campaignData = await db.select().from(campaigns).where(eq(campaigns.id, campaignId));
    
    if (!campaignData || campaignData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "الحملة غير موجودة"
      });
    }

    const campaign = campaignData[0];
    
    if (campaign.brand_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "ليس لديك صلاحية لتعديل هذه الحملة"
      });
    }

    // Validate status transitions
    if (campaign.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: "لا يمكن تغيير حالة حملة مغلقة"
      });
    }

    if (campaign.status === 'draft' && status !== 'active') {
      return res.status(400).json({
        success: false,
        message: "يجب تفعيل الحملة أولاً"
      });
    }

    // Update status
    await db.update(campaigns)
      .set({ 
        status: status,
        updated_at: new Date()
      })
      .where(eq(campaigns.id, campaignId));

    const statusMessages = {
      'active': 'تم تفعيل الحملة بنجاح',
      'paused': 'تم إيقاف الحملة مؤقتاً',
      'closed': 'تم إغلاق الحملة'
    };

    console.log(`✅ Campaign ${campaignId} status changed to: ${status}`);

    return res.status(200).json({
      success: true,
      message: statusMessages[status]
    });

  } catch (error) {
    console.error("❌ Error updating campaign status:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في تحديث حالة الحملة",
      error: error.message
    });
  }
});

// Duplicate campaign
app.post("/api/campaigns/:id/duplicate", authMiddleware, async (req, res) => {
  try {
    const campaignId = parseInt(req.params.id);
    
    if (!campaignId || isNaN(campaignId)) {
      return res.status(400).json({
        success: false,
        message: "رقم الحملة غير صحيح"
      });
    }

    const db = await import("../db/client.js").then(m => m.db);
    const { campaigns } = await import("../db/schema.js");
    const { eq } = await import("drizzle-orm");
    
    // Get original campaign
    const campaignData = await db.select().from(campaigns).where(eq(campaigns.id, campaignId));
    
    if (!campaignData || campaignData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "الحملة غير موجودة"
      });
    }

    const originalCampaign = campaignData[0];
    
    if (originalCampaign.brand_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "ليس لديك صلاحية لتكرار هذه الحملة"
      });
    }

    // Create duplicate (without media files - user can re-upload)
    const newCampaign = await db.insert(campaigns).values({
      brand_id: originalCampaign.brand_id,
      title: `${originalCampaign.title} (نسخة)`,
      description: originalCampaign.description,
      category: originalCampaign.category,
      content_type: originalCampaign.content_type,
      language: originalCampaign.language,
      budget: originalCampaign.budget,
      price_per_ugc: originalCampaign.price_per_ugc,
      platforms: originalCampaign.platforms,
      start_date: null,
      deadline: null,
      product_name: originalCampaign.product_name,
      product_link: originalCampaign.product_link,
      delivery_method: originalCampaign.delivery_method,
      media_files: null, // Don't copy media files
      additional_notes: originalCampaign.additional_notes,
      status: 'draft', // New campaign starts as draft
      difficulty: originalCampaign.difficulty,
      created_at: new Date(),
      updated_at: new Date()
    }).returning();

    console.log(`✅ Campaign ${campaignId} duplicated as ${newCampaign[0].id}`);

    return res.status(201).json({
      success: true,
      message: "تم تكرار الحملة بنجاح",
      campaign: newCampaign[0]
    });

  } catch (error) {
    console.error("❌ Error duplicating campaign:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في تكرار الحملة",
      error: error.message
    });
  }
});

// Delete campaign
app.delete("/api/campaigns/:id", authMiddleware, async (req, res) => {
  try {
    const campaignId = parseInt(req.params.id);
    
    if (!campaignId || isNaN(campaignId)) {
      return res.status(400).json({
        success: false,
        message: "رقم الحملة غير صحيح"
      });
    }

    const db = await import("../db/client.js").then(m => m.db);
    const { campaigns } = await import("../db/schema.js");
    const { eq } = await import("drizzle-orm");
    
    // Get campaign and check ownership
    const campaignData = await db.select().from(campaigns).where(eq(campaigns.id, campaignId));
    
    if (!campaignData || campaignData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "الحملة غير موجودة"
      });
    }

    const campaign = campaignData[0];
    
    if (campaign.brand_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "ليس لديك صلاحية لحذف هذه الحملة"
      });
    }

    // Only allow deleting draft campaigns or campaigns without submissions
    if (campaign.status !== 'draft' && campaign.submissions > 0) {
      return res.status(400).json({
        success: false,
        message: "لا يمكن حذف حملة نشطة أو تحتوي على محتوى مقدم"
      });
    }

    // Delete campaign
    await db.delete(campaigns).where(eq(campaigns.id, campaignId));

    console.log(`✅ Campaign ${campaignId} deleted`);

    return res.status(200).json({
      success: true,
      message: "تم حذف الحملة بنجاح"
    });

  } catch (error) {
    console.error("❌ Error deleting campaign:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في حذف الحملة",
      error: error.message
    });
  }
});

// Upload media files for campaign (images/videos)
app.post("/api/campaigns/upload-media", authMiddleware, uploadMedia.array('media', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "لم يتم تحميل أي ملفات"
      });
    }

    const { uploadToR2 } = await import("../services/r2.js");
    const uploadedUrls = [];

    for (const file of req.files) {
      const uniqueKey = `campaigns/media/${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`;
      const publicUrl = await uploadToR2(file.path, uniqueKey, file.mimetype);
      uploadedUrls.push(publicUrl);
      
      await fs.unlink(file.path).catch(() => {});
    }

    console.log(`✅ Uploaded ${uploadedUrls.length} media files to R2`);

    return res.status(200).json({
      success: true,
      urls: uploadedUrls
    });

  } catch (error) {
    console.error("❌ Error uploading media:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في تحميل الملفات"
    });
  }
});

// Generate campaign description using AI (auto-detect language)
app.post("/api/ai/generate-description", authMiddleware, async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "عنوان الحملة مطلوب لتوليد الوصف"
      });
    }

    const deepseek = await import("../services/deepseek.js").then(m => m.default);

    // Smart prompt that auto-detects language and responds in the same language
    const systemPrompt = `You are a professional marketing copywriter specialized in UGC campaigns. Generate a compelling campaign description in the EXACT SAME LANGUAGE as the title provided. Keep it professional, engaging (2-3 sentences), focused on benefits, with a clear call-to-action for creators.`;

    const userMessage = `Campaign title: "${title.trim()}". Generate a marketing description in the same language as this title to attract content creators.`;

    const description = await deepseek.callDeepSeek(systemPrompt, userMessage, 0.7);

    console.log("✅ AI Description generated for:", title.substring(0, 30));

    return res.status(200).json({
      success: true,
      description: description.trim(),
      title: title.trim()
    });

  } catch (error) {
    console.error("❌ Error generating description:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في توليد الوصف. حاول مرة أخرى.",
      error: error.message
    });
  }
});

// Add funds to wallet with receipt upload (protected route)
app.post("/api/wallet/add-funds", authMiddleware, uploadMedia.single('receipt'), ownershipMiddleware('user_id'), async (req, res) => {
  try {
    const { user_id, amount } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "معرف المستخدم مطلوب"
      });
    }

    if (!amount || parseFloat(amount) < 50) {
      return res.status(400).json({
        success: false,
        message: "المبلغ يجب أن يكون 50 د.م على الأقل"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "إثبات الدفع مطلوب"
      });
    }

    const db = await import("../db/client.js").then(m => m.db);
    const { wallets, transactions } = await import("../db/schema.js");
    const { eq, sql } = await import("drizzle-orm");

    // Upload receipt to R2
    const receiptId = uuidv4();
    const fileExtension = path.extname(req.file.originalname);
    const receiptKey = `receipts/${user_id}/${receiptId}${fileExtension}`;

    console.log(`☁️ Uploading receipt to R2: ${receiptKey}`);
    const uploadResult = await r2Service.uploadFileToR2(
      req.file.path,
      receiptKey,
      req.file.mimetype
    );

    // Cleanup temp file
    await fs.unlink(req.file.path).catch((err) => console.warn("Cleanup warning:", err.message));

    // Update wallet pending_balance
    const updatedWallet = await db.update(wallets)
      .set({ 
        pending_balance: sql`pending_balance + ${parseFloat(amount)}`,
        updated_at: new Date()
      })
      .where(eq(wallets.user_id, user_id))
      .returning();

    if (updatedWallet.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المحفظة غير موجودة"
      });
    }

    // Create transaction record
    await db.insert(transactions).values({
      user_id: user_id,
      amount: parseFloat(amount),
      type: 'deposit',
      status: 'pending',
      description: `طلب إضافة رصيد - في انتظار المراجعة (إثبات: ${receiptId})`,
      created_at: new Date()
    });

    console.log("✅ Fund request created:", user_id, "+", amount, "MAD (pending)");

    return res.status(200).json({
      success: true,
      message: `تم إرسال طلب إضافة ${amount} د.م بنجاح! سيتم مراجعته خلال 24-48 ساعة ✨`,
      wallet: {
        user_id: updatedWallet[0].user_id,
        balance: parseFloat(updatedWallet[0].balance),
        pending_balance: parseFloat(updatedWallet[0].pending_balance || 0),
        currency: updatedWallet[0].currency || 'MAD'
      },
      receipt_url: uploadResult.publicUrl
    });

  } catch (error) {
    console.error("❌ Error adding funds:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في إرسال الطلب",
      error: error.message
    });
  }
});

// =====================================================
// 🎬 VIDEO UPLOAD ENDPOINT - R2 + Watermark
// =====================================================

app.post("/api/upload-video", uploadVideo.single("video"), async (req, res) => {
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
