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
import { db } from "../db/client.js";
import { escrowTransactions, creatorEarnings, creatorWithdrawals, campaigns, submissions, wallets } from "../db/schema.js";
import { eq, and, sql, desc } from "drizzle-orm";

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

// Update campaign (full update) - protected route
app.patch("/api/campaigns/:id", authMiddleware, async (req, res) => {
  try {
    const campaignId = parseInt(req.params.id);
    
    if (!campaignId || isNaN(campaignId)) {
      return res.status(400).json({
        success: false,
        message: "رقم الحملة غير صحيح"
      });
    }

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

    // Update campaign
    await db.update(campaigns)
      .set({
        title: title.trim(),
        description: description.trim(),
        category: category || campaign.category,
        content_type: contentTypes ? JSON.stringify(contentTypes) : campaign.content_type,
        language: language || campaign.language,
        budget: budget ? parseFloat(budget) : null,
        price_per_ugc: parseFloat(pricePerUgc),
        platforms: platforms ? JSON.stringify(platforms) : campaign.platforms,
        start_date: startDate ? new Date(startDate) : null,
        deadline: endDate ? new Date(endDate) : null,
        product_name: productName || null,
        product_link: productLink || null,
        delivery_method: deliveryMethod || campaign.delivery_method,
        media_files: mediaFiles && mediaFiles.length > 0 ? JSON.stringify(mediaFiles) : campaign.media_files,
        additional_notes: additionalNotes || null,
        updated_at: new Date()
      })
      .where(eq(campaigns.id, campaignId));

    console.log(`✅ Campaign ${campaignId} updated successfully`);

    return res.status(200).json({
      success: true,
      message: "تم تحديث الحملة بنجاح! ✨",
      campaignId
    });

  } catch (error) {
    console.error("❌ Error updating campaign:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في تحديث الحملة",
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

// ========================================
// ESCROW & WITHDRAWAL ENDPOINTS
// ========================================

// POST /api/escrow/deposit - Block funds when campaign created
app.post("/api/escrow/deposit", authMiddleware, async (req, res) => {
  try {
    const { campaign_id, amount } = req.body;
    const brand_id = req.user.id;

    if (!campaign_id || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: "معرف الحملة والمبلغ مطلوبان" 
      });
    }

    // Check if escrow already exists for this campaign
    const existingEscrow = await db.select().from(escrowTransactions).where(eq(escrowTransactions.campaign_id, campaign_id));
    
    if (existingEscrow.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: "الأموال محجوزة بالفعل لهذه الحملة" 
      });
    }

    // Create escrow transaction
    const [escrow] = await db.insert(escrowTransactions).values({
      campaign_id: parseInt(campaign_id),
      brand_id: brand_id,
      amount: amount.toString(),
      remaining_amount: amount.toString(),
      status: 'pending_funds'
    }).returning();

    return res.status(200).json({
      success: true,
      message: "تم حجز الأموال بنجاح 🔒",
      escrow: escrow
    });
  } catch (error) {
    console.error("❌ Error depositing escrow:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في حجز الأموال",
      error: error.message
    });
  }
});

// POST /api/escrow/release - Release funds when brand validates UGC
app.post("/api/escrow/release", authMiddleware, async (req, res) => {
  try {
    const { campaign_id, creator_id, submission_id } = req.body;
    const brand_id = req.user.id;

    if (!campaign_id || !creator_id || !submission_id) {
      return res.status(400).json({ 
        success: false, 
        message: "معرف الحملة والمبدع والمحتوى مطلوبة" 
      });
    }

    // Get escrow transaction
    const [escrow] = await db.select().from(escrowTransactions)
      .where(and(
        eq(escrowTransactions.campaign_id, parseInt(campaign_id)),
        eq(escrowTransactions.brand_id, brand_id)
      ));

    if (!escrow) {
      return res.status(404).json({ 
        success: false, 
        message: "لم يتم العثور على الأموال المحجوزة" 
      });
    }

    if (escrow.status === 'released') {
      return res.status(400).json({ 
        success: false, 
        message: "تم تحرير الأموال بالفعل" 
      });
    }

    // Calculate fees: 15% platform fee
    const grossAmount = parseFloat(escrow.amount);
    const platformFee = grossAmount * 0.15;
    const netAmount = grossAmount - platformFee;

    // Update escrow status
    await db.update(escrowTransactions)
      .set({ 
        status: 'released', 
        creator_id: creator_id,
        released_at: new Date(),
        updated_at: new Date()
      })
      .where(eq(escrowTransactions.id, escrow.id));

    // Create creator earning record
    const [earning] = await db.insert(creatorEarnings).values({
      creator_id: creator_id,
      campaign_id: parseInt(campaign_id),
      submission_id: parseInt(submission_id),
      gross_amount: grossAmount.toFixed(2),
      platform_fee: platformFee.toFixed(2),
      net_amount: netAmount.toFixed(2),
      status: 'available'
    }).returning();

    return res.status(200).json({
      success: true,
      message: "تم تحرير الأموال للمبدع بنجاح 💰",
      earning: earning
    });
  } catch (error) {
    console.error("❌ Error releasing escrow:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في تحرير الأموال",
      error: error.message
    });
  }
});

// POST /api/escrow/dispute - Report a dispute
app.post("/api/escrow/dispute", authMiddleware, async (req, res) => {
  try {
    const { campaign_id, reason } = req.body;
    const user_id = req.user.id;

    if (!campaign_id || !reason) {
      return res.status(400).json({ 
        success: false, 
        message: "معرف الحملة وسبب النزاع مطلوبان" 
      });
    }

    // Update escrow status to disputed
    const [escrow] = await db.update(escrowTransactions)
      .set({ 
        status: 'disputed',
        dispute_reason: reason,
        updated_at: new Date()
      })
      .where(eq(escrowTransactions.campaign_id, parseInt(campaign_id)))
      .returning();

    if (!escrow) {
      return res.status(404).json({ 
        success: false, 
        message: "لم يتم العثور على الأموال المحجوزة" 
      });
    }

    return res.status(200).json({
      success: true,
      message: "تم تسجيل النزاع بنجاح ⚠️",
      escrow: escrow
    });
  } catch (error) {
    console.error("❌ Error reporting dispute:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في تسجيل النزاع",
      error: error.message
    });
  }
});

// GET /api/creator/balance - Get available balance for creator
app.get("/api/creator/balance", authMiddleware, async (req, res) => {
  try {
    const creator_id = req.user.id;

    // Sum all available earnings (not withdrawn yet)
    const result = await db.select({
      total: sql`COALESCE(SUM(${creatorEarnings.net_amount}), 0)`
    })
    .from(creatorEarnings)
    .where(and(
      eq(creatorEarnings.creator_id, creator_id),
      eq(creatorEarnings.status, 'available')
    ));

    const availableBalance = parseFloat(result[0]?.total || 0);

    // Sum all pending withdrawals
    const pendingResult = await db.select({
      total: sql`COALESCE(SUM(${creatorWithdrawals.amount}), 0)`
    })
    .from(creatorWithdrawals)
    .where(and(
      eq(creatorWithdrawals.creator_id, creator_id),
      sql`${creatorWithdrawals.status} IN ('pending', 'approved', 'processing')`
    ));

    const pendingBalance = parseFloat(pendingResult[0]?.total || 0);

    // Calculate total earned
    const totalResult = await db.select({
      total: sql`COALESCE(SUM(${creatorEarnings.net_amount}), 0)`
    })
    .from(creatorEarnings)
    .where(eq(creatorEarnings.creator_id, creator_id));

    const totalEarned = parseFloat(totalResult[0]?.total || 0);

    return res.status(200).json({
      success: true,
      balance: {
        available: availableBalance.toFixed(2),
        pending: pendingBalance.toFixed(2),
        total_earned: totalEarned.toFixed(2),
        currency: 'MAD'
      }
    });
  } catch (error) {
    console.error("❌ Error getting creator balance:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في جلب الرصيد",
      error: error.message
    });
  }
});

// GET /api/creator/earnings - Get earnings history
app.get("/api/creator/earnings", authMiddleware, async (req, res) => {
  try {
    const creator_id = req.user.id;

    const earnings = await db.select({
      id: creatorEarnings.id,
      campaign_id: creatorEarnings.campaign_id,
      campaign_title: campaigns.title,
      gross_amount: creatorEarnings.gross_amount,
      platform_fee: creatorEarnings.platform_fee,
      net_amount: creatorEarnings.net_amount,
      status: creatorEarnings.status,
      earned_at: creatorEarnings.earned_at
    })
    .from(creatorEarnings)
    .leftJoin(campaigns, eq(creatorEarnings.campaign_id, campaigns.id))
    .where(eq(creatorEarnings.creator_id, creator_id))
    .orderBy(desc(creatorEarnings.earned_at));

    return res.status(200).json({
      success: true,
      earnings: earnings
    });
  } catch (error) {
    console.error("❌ Error getting earnings:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في جلب الأرباح",
      error: error.message
    });
  }
});

// POST /api/creator/withdrawal - Request withdrawal
app.post("/api/creator/withdrawal", authMiddleware, async (req, res) => {
  try {
    const creator_id = req.user.id;
    const { amount, bank_name, rib, account_holder } = req.body;

    if (!amount || !bank_name || !rib || !account_holder) {
      return res.status(400).json({ 
        success: false, 
        message: "جميع بيانات البنك مطلوبة" 
      });
    }

    const requestedAmount = parseFloat(amount);

    // Check minimum withdrawal (200 MAD)
    if (requestedAmount < 200) {
      return res.status(400).json({ 
        success: false, 
        message: "الحد الأدنى للسحب هو 200 درهم" 
      });
    }

    // Get available balance
    const result = await db.select({
      total: sql`COALESCE(SUM(${creatorEarnings.net_amount}), 0)`
    })
    .from(creatorEarnings)
    .where(and(
      eq(creatorEarnings.creator_id, creator_id),
      eq(creatorEarnings.status, 'available')
    ));

    const availableBalance = parseFloat(result[0]?.total || 0);

    // Check if sufficient balance
    if (requestedAmount > availableBalance) {
      return res.status(400).json({ 
        success: false, 
        message: `رصيدك المتاح هو ${availableBalance.toFixed(2)} درهم فقط` 
      });
    }

    // Calculate fees
    const platformFee = requestedAmount * 0.15; // 15% commission
    const bankFee = 17.00; // Fixed 17 MAD
    const netAmount = requestedAmount - platformFee - bankFee;

    if (netAmount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "المبلغ المطلوب صغير جداً بعد خصم الرسوم" 
      });
    }

    // Create withdrawal request
    const [withdrawal] = await db.insert(creatorWithdrawals).values({
      creator_id: creator_id,
      amount: requestedAmount.toFixed(2),
      platform_fee: platformFee.toFixed(2),
      bank_fee: bankFee.toFixed(2),
      net_amount: netAmount.toFixed(2),
      bank_name: bank_name,
      rib: rib,
      account_holder: account_holder,
      status: 'pending'
    }).returning();

    return res.status(200).json({
      success: true,
      message: "تم إرسال طلب السحب بنجاح ⏳",
      withdrawal: withdrawal
    });
  } catch (error) {
    console.error("❌ Error creating withdrawal:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في إنشاء طلب السحب",
      error: error.message
    });
  }
});

// GET /api/creator/withdrawals - Get creator's withdrawal history
app.get("/api/creator/withdrawals", authMiddleware, async (req, res) => {
  try {
    const creator_id = req.user.id;

    const withdrawals = await db.select({
      id: creatorWithdrawals.id,
      amount: creatorWithdrawals.amount,
      platform_fee: creatorWithdrawals.platform_fee,
      bank_fee: creatorWithdrawals.bank_fee,
      net_amount: creatorWithdrawals.net_amount,
      bank_name: creatorWithdrawals.bank_name,
      rib: creatorWithdrawals.rib,
      account_holder: creatorWithdrawals.account_holder,
      status: creatorWithdrawals.status,
      rejection_reason: creatorWithdrawals.rejection_reason,
      requested_at: creatorWithdrawals.requested_at,
      approved_at: creatorWithdrawals.approved_at,
      completed_at: creatorWithdrawals.completed_at
    })
    .from(creatorWithdrawals)
    .where(eq(creatorWithdrawals.creator_id, creator_id))
    .orderBy(desc(creatorWithdrawals.requested_at));

    return res.status(200).json({
      success: true,
      withdrawals: withdrawals
    });
  } catch (error) {
    console.error("❌ Error getting creator withdrawals:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في جلب طلبات السحب",
      error: error.message
    });
  }
});

// GET /api/admin/withdrawals - List all withdrawal requests (admin only)
app.get("/api/admin/withdrawals", authMiddleware, async (req, res) => {
  try {
    const user_role = req.user.user_metadata?.role;

    if (user_role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: "غير مصرح لك بالوصول" 
      });
    }

    const { status, limit = 50 } = req.query;

    let query = db.select({
      id: creatorWithdrawals.id,
      creator_id: creatorWithdrawals.creator_id,
      creator_email: sql`profiles.email`,
      creator_name: sql`profiles.full_name`,
      amount: creatorWithdrawals.amount,
      platform_fee: creatorWithdrawals.platform_fee,
      bank_fee: creatorWithdrawals.bank_fee,
      net_amount: creatorWithdrawals.net_amount,
      bank_name: creatorWithdrawals.bank_name,
      rib: creatorWithdrawals.rib,
      account_holder: creatorWithdrawals.account_holder,
      status: creatorWithdrawals.status,
      rejection_reason: creatorWithdrawals.rejection_reason,
      admin_notes: creatorWithdrawals.admin_notes,
      requested_at: creatorWithdrawals.requested_at,
      approved_at: creatorWithdrawals.approved_at,
      completed_at: creatorWithdrawals.completed_at
    })
    .from(creatorWithdrawals)
    .leftJoin(sql`profiles`, sql`profiles.id = ${creatorWithdrawals.creator_id}`)
    .orderBy(desc(creatorWithdrawals.requested_at))
    .limit(parseInt(limit));

    if (status) {
      query = query.where(eq(creatorWithdrawals.status, status));
    }

    const withdrawals = await query;

    return res.status(200).json({
      success: true,
      withdrawals: withdrawals
    });
  } catch (error) {
    console.error("❌ Error getting withdrawals:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في جلب طلبات السحب",
      error: error.message
    });
  }
});

// PATCH /api/admin/withdrawals/:id/approve - Approve withdrawal
app.patch("/api/admin/withdrawals/:id/approve", authMiddleware, async (req, res) => {
  try {
    const user_role = req.user.user_metadata?.role;

    if (user_role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: "غير مصرح لك بالوصول" 
      });
    }

    const { id } = req.params;
    const { admin_notes } = req.body;

    const [withdrawal] = await db.update(creatorWithdrawals)
      .set({ 
        status: 'approved',
        approved_at: new Date(),
        admin_notes: admin_notes || null
      })
      .where(eq(creatorWithdrawals.id, parseInt(id)))
      .returning();

    if (!withdrawal) {
      return res.status(404).json({ 
        success: false, 
        message: "طلب السحب غير موجود" 
      });
    }

    return res.status(200).json({
      success: true,
      message: "تم الموافقة على طلب السحب ✅",
      withdrawal: withdrawal
    });
  } catch (error) {
    console.error("❌ Error approving withdrawal:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في الموافقة على الطلب",
      error: error.message
    });
  }
});

// PATCH /api/admin/withdrawals/:id/reject - Reject withdrawal
app.patch("/api/admin/withdrawals/:id/reject", authMiddleware, async (req, res) => {
  try {
    const user_role = req.user.user_metadata?.role;

    if (user_role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: "غير مصرح لك بالوصول" 
      });
    }

    const { id } = req.params;
    const { rejection_reason, admin_notes } = req.body;

    if (!rejection_reason) {
      return res.status(400).json({ 
        success: false, 
        message: "سبب الرفض مطلوب" 
      });
    }

    const [withdrawal] = await db.update(creatorWithdrawals)
      .set({ 
        status: 'rejected',
        rejection_reason: rejection_reason,
        admin_notes: admin_notes || null
      })
      .where(eq(creatorWithdrawals.id, parseInt(id)))
      .returning();

    if (!withdrawal) {
      return res.status(404).json({ 
        success: false, 
        message: "طلب السحب غير موجود" 
      });
    }

    return res.status(200).json({
      success: true,
      message: "تم رفض طلب السحب ❌",
      withdrawal: withdrawal
    });
  } catch (error) {
    console.error("❌ Error rejecting withdrawal:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في رفض الطلب",
      error: error.message
    });
  }
});

// PATCH /api/admin/withdrawals/:id/complete - Mark as completed (paid)
app.patch("/api/admin/withdrawals/:id/complete", authMiddleware, async (req, res) => {
  try {
    const user_role = req.user.user_metadata?.role;

    if (user_role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: "غير مصرح لك بالوصول" 
      });
    }

    const { id } = req.params;
    const { admin_notes } = req.body;

    // Get withdrawal details
    const [withdrawal] = await db.select().from(creatorWithdrawals)
      .where(eq(creatorWithdrawals.id, parseInt(id)));

    if (!withdrawal) {
      return res.status(404).json({ 
        success: false, 
        message: "طلب السحب غير موجود" 
      });
    }

    // Update withdrawal status
    const [updatedWithdrawal] = await db.update(creatorWithdrawals)
      .set({ 
        status: 'completed',
        completed_at: new Date(),
        admin_notes: admin_notes || null
      })
      .where(eq(creatorWithdrawals.id, parseInt(id)))
      .returning();

    // Mark earnings as withdrawn
    await db.update(creatorEarnings)
      .set({ status: 'withdrawn' })
      .where(and(
        eq(creatorEarnings.creator_id, withdrawal.creator_id),
        eq(creatorEarnings.status, 'available')
      ));

    return res.status(200).json({
      success: true,
      message: "تم تأكيد إتمام التحويل البنكي 💸",
      withdrawal: updatedWithdrawal
    });
  } catch (error) {
    console.error("❌ Error completing withdrawal:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في تأكيد الدفع",
      error: error.message
    });
  }
});

// ========================================
// SUBMISSIONS ENDPOINTS (with Escrow integration)
// ========================================

// GET /api/campaigns/:id/submissions - Get all submissions for a campaign
app.get("/api/campaigns/:id/submissions", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const campaignId = parseInt(id);

    // Get submissions with creator details
    const submissionsData = await db.select({
      id: submissions.id,
      campaign_id: submissions.campaign_id,
      creator_id: submissions.creator_id,
      creator_name: sql`profiles.full_name`,
      creator_email: sql`profiles.email`,
      video_url: submissions.video_url,
      r2_key: submissions.r2_key,
      file_size: submissions.file_size,
      status: submissions.status,
      feedback: submissions.feedback,
      submitted_at: submissions.submitted_at,
      reviewed_at: submissions.reviewed_at
    })
    .from(submissions)
    .leftJoin(sql`profiles`, sql`profiles.id = ${submissions.creator_id}`)
    .where(eq(submissions.campaign_id, campaignId))
    .orderBy(desc(submissions.submitted_at));

    return res.status(200).json({
      success: true,
      submissions: submissionsData
    });
  } catch (error) {
    console.error("❌ Error getting submissions:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في جلب المحتويات",
      error: error.message
    });
  }
});

// PATCH /api/submissions/:id/approve - Approve submission (with Escrow release)
app.patch("/api/submissions/:id/approve", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;
    const brand_id = req.user.id;
    const submissionId = parseInt(id);

    // Get submission details
    const [submission] = await db.select().from(submissions)
      .where(eq(submissions.id, submissionId));

    if (!submission) {
      return res.status(404).json({ 
        success: false, 
        message: "المحتوى غير موجود" 
      });
    }

    // Prevent double approval
    if (submission.status === 'approved') {
      return res.status(400).json({ 
        success: false, 
        message: "تم قبول هذا المحتوى بالفعل" 
      });
    }

    // Get campaign to verify ownership
    const [campaign] = await db.select().from(campaigns)
      .where(eq(campaigns.id, submission.campaign_id));

    if (!campaign || campaign.brand_id !== brand_id) {
      return res.status(403).json({ 
        success: false, 
        message: "غير مصرح لك بالوصول" 
      });
    }

    // Check if earning already exists for this submission
    const existingEarning = await db.select().from(creatorEarnings)
      .where(eq(creatorEarnings.submission_id, submissionId));
    
    if (existingEarning.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: "تم إنشاء دفعة لهذا المحتوى بالفعل" 
      });
    }

    // Update submission status
    await db.update(submissions)
      .set({ 
        status: 'approved',
        feedback: feedback || null,
        reviewed_at: new Date()
      })
      .where(eq(submissions.id, submissionId));

    // Release Escrow funds to creator (price_per_ugc only, not entire budget)
    // Use price_per_ugc from campaign
    const pricePerUgc = parseFloat(campaign.price_per_ugc);

    try {
      // ATOMIC TRANSACTION: Lock escrow, check budget, decrement, create earning
      await db.transaction(async (tx) => {
        // Lock escrow row for update (prevents concurrent approvals)
        const [escrow] = await tx.select().from(escrowTransactions)
          .where(and(
            eq(escrowTransactions.campaign_id, submission.campaign_id),
            eq(escrowTransactions.brand_id, brand_id)
          ))
          .for('update');

        if (!escrow) {
          throw new Error('NO_ESCROW_FOUND');
        }

        if (escrow.status !== 'pending_funds' && escrow.status !== 'under_review') {
          throw new Error('INVALID_ESCROW_STATUS');
        }

        const remainingAmount = parseFloat(escrow.remaining_amount);

        // Check if enough funds remain
        if (remainingAmount < pricePerUgc) {
          throw new Error(`INSUFFICIENT_BUDGET:${remainingAmount}:${pricePerUgc}`);
        }

        const platformFee = pricePerUgc * 0.15;
        const netAmount = pricePerUgc - platformFee;
        const newRemainingAmount = remainingAmount - pricePerUgc;

        // Assert: never allow negative balance
        if (newRemainingAmount < 0) {
          throw new Error('NEGATIVE_BALANCE_DETECTED');
        }

        // Update escrow status to under_review and decrement remaining_amount
        await tx.update(escrowTransactions)
          .set({ 
            status: 'under_review',
            creator_id: submission.creator_id,
            remaining_amount: newRemainingAmount.toFixed(2),
            updated_at: new Date()
          })
          .where(eq(escrowTransactions.id, escrow.id));

        // Create creator earning record
        await tx.insert(creatorEarnings).values({
          creator_id: submission.creator_id,
          campaign_id: submission.campaign_id,
          submission_id: submissionId,
          gross_amount: pricePerUgc.toFixed(2),
          platform_fee: platformFee.toFixed(2),
          net_amount: netAmount.toFixed(2),
          status: 'available'
        });

        console.log(`✅ Escrow released: ${netAmount.toFixed(2)} MAD to creator ${submission.creator_id} | Remaining budget: ${newRemainingAmount.toFixed(2)} MAD`);
      });
    } catch (escrowError) {
      console.error("⚠️ Error releasing escrow:", escrowError);
      
      // Rollback submission approval on escrow failure
      await db.update(submissions)
        .set({ 
          status: 'pending',
          reviewed_at: null
        })
        .where(eq(submissions.id, submissionId));
      
      // Handle specific error cases
      if (escrowError.message === 'NO_ESCROW_FOUND') {
        return res.status(200).json({
          success: true,
          message: "تم قبول المحتوى بنجاح (تحذير: لا توجد أموال محجوزة) ⚠️"
        });
      }
      
      if (escrowError.message === 'INVALID_ESCROW_STATUS') {
        return res.status(400).json({
          success: false,
          message: "حالة الضمان غير صالحة للتحرير"
        });
      }
      
      if (escrowError.message.startsWith('INSUFFICIENT_BUDGET:')) {
        const [_, remaining, required] = escrowError.message.split(':');
        return res.status(400).json({
          success: false,
          message: `ميزانية الحملة غير كافية. المتبقي: ${remaining} MAD، المطلوب: ${required} MAD`
        });
      }
      
      if (escrowError.message === 'NEGATIVE_BALANCE_DETECTED') {
        return res.status(409).json({
          success: false,
          message: "خطأ: رصيد الضمان سلبي. يرجى الاتصال بالدعم."
        });
      }
      
      return res.status(500).json({
        success: false,
        message: "خطأ في تحرير الأموال. تم التراجع عن القبول."
      });
    }

    return res.status(200).json({
      success: true,
      message: "تم قبول المحتوى بنجاح ✅"
    });
  } catch (error) {
    console.error("❌ Error approving submission:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في قبول المحتوى",
      error: error.message
    });
  }
});

// PATCH /api/submissions/:id/reject - Reject submission
app.patch("/api/submissions/:id/reject", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const brand_id = req.user.id;
    const submissionId = parseInt(id);

    if (!reason) {
      return res.status(400).json({ 
        success: false, 
        message: "سبب الرفض مطلوب" 
      });
    }

    // Get submission details
    const [submission] = await db.select().from(submissions)
      .where(eq(submissions.id, submissionId));

    if (!submission) {
      return res.status(404).json({ 
        success: false, 
        message: "المحتوى غير موجود" 
      });
    }

    // Get campaign to verify ownership
    const [campaign] = await db.select().from(campaigns)
      .where(eq(campaigns.id, submission.campaign_id));

    if (!campaign || campaign.brand_id !== brand_id) {
      return res.status(403).json({ 
        success: false, 
        message: "غير مصرح لك بالوصول" 
      });
    }

    // Update submission status
    await db.update(submissions)
      .set({ 
        status: 'rejected',
        feedback: reason,
        reviewed_at: new Date()
      })
      .where(eq(submissions.id, submissionId));

    return res.status(200).json({
      success: true,
      message: "تم رفض المحتوى ❌"
    });
  } catch (error) {
    console.error("❌ Error rejecting submission:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في رفض المحتوى",
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
