import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
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
import { 
  escrowTransactions, 
  creatorEarnings, 
  creatorWithdrawals, 
  campaigns, 
  submissions, 
  wallets,
  profiles,
  campaignAgreements,
  walletReservations,
  agreementEscrow,
  agreementEarnings,
  negotiationMessages,
  disputeCases,
  ratings,
  creatorBankDetails,
  bankChangeRequests,
  platformSettings,
  conversations,
  messages
} from "../db/schema.js";
import { eq, and, sql, desc } from "drizzle-orm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Configure Socket.IO with CORS
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

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

// Ensure chat uploads directory exists
const CHAT_UPLOADS_DIR = path.join(__dirname, "../../uploads/chat");
await fs.mkdir(CHAT_UPLOADS_DIR, { recursive: true }).catch(() => {});

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

// Configure multer for chat attachments (images, videos, documents)
const uploadChatFile = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, CHAT_UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
      const uniqueName = `chat-${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    }
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size for chat attachments
  },
  fileFilter: (req, file, cb) => {
    // Accept images, videos, and common document formats
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime',
      'application/pdf',
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("نوع الملف غير مدعوم. الرجاء إرسال صور، فيديوهات، أو مستندات"), false);
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

    // Parse JSON fields with fallback for legacy data
    const parseJsonField = (field, fallback = []) => {
      if (!field) return fallback;
      try {
        return JSON.parse(field);
      } catch (e) {
        // If parsing fails, treat as single value and wrap in array
        return [field];
      }
    };

    const campaignDetails = {
      id: campaign.id,
      brand_id: campaign.brand_id,
      title: campaign.title,
      description: campaign.description,
      category: campaign.category,
      content_types: parseJsonField(campaign.content_type, []),
      language: campaign.language,
      budget: parseFloat(campaign.budget || 0),
      price_per_ugc: parseFloat(campaign.price_per_ugc || 0),
      platforms: parseJsonField(campaign.platforms, []),
      start_date: campaign.start_date,
      end_date: campaign.deadline,
      product_name: campaign.product_name,
      product_link: campaign.product_link,
      delivery_method: campaign.delivery_method,
      media: parseJsonField(campaign.media_files, []),
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

// =====================================================
// 🤝 AGREEMENT ENDPOINTS - NEW AGREEMENT-BASED SYSTEM
// =====================================================

// POST /api/agreements/create - Créer une invitation avec réservation virtuelle
app.post("/api/agreements/create", authMiddleware, async (req, res) => {
  try {
    const brandId = req.user.id;
    const { 
      campaign_id, 
      creator_id, 
      price_offered,
      deadline,
      custom_terms 
    } = req.body;

    // Validate required fields
    if (!campaign_id || !creator_id || !price_offered) {
      return res.status(400).json({
        success: false,
        message: "جميع الحقول مطلوبة (حملة، منشئ محتوى، سعر)"
      });
    }

    // Validate price
    const priceFloat = parseFloat(price_offered);
    if (isNaN(priceFloat) || priceFloat <= 0) {
      return res.status(400).json({
        success: false,
        message: "السعر المعروض يجب أن يكون أكبر من صفر"
      });
    }

    // Check campaign exists and belongs to brand
    const [campaign] = await db.select()
      .from(campaigns)
      .where(eq(campaigns.id, campaign_id));

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "الحملة غير موجودة"
      });
    }

    if (campaign.brand_id !== brandId) {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك بإنشاء اتفاقيات لهذه الحملة"
      });
    }

    // Check if agreement already exists
    const existingAgreement = await db.select()
      .from(campaignAgreements)
      .where(
        and(
          eq(campaignAgreements.campaign_id, campaign_id),
          eq(campaignAgreements.creator_id, creator_id)
        )
      );

    if (existingAgreement.length > 0) {
      return res.status(409).json({
        success: false,
        message: "يوجد بالفعل اتفاق مع هذا المنشئ لهذه الحملة"
      });
    }

    // Get brand wallet
    const [wallet] = await db.select()
      .from(wallets)
      .where(eq(wallets.user_id, brandId));

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "المحفظة غير موجودة"
      });
    }

    // Calculate available balance (total - reserved)
    const activeReservations = await db.select()
      .from(walletReservations)
      .where(
        and(
          eq(walletReservations.brand_id, brandId),
          eq(walletReservations.status, 'active')
        )
      );

    const totalReserved = activeReservations.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const availableBalance = parseFloat(wallet.balance) - totalReserved;

    if (availableBalance < priceFloat) {
      return res.status(400).json({
        success: false,
        message: `رصيد غير كافي. المتوفر: ${availableBalance.toFixed(2)} د.م، المطلوب: ${priceFloat.toFixed(2)} د.م`,
        available_balance: availableBalance,
        required_amount: priceFloat
      });
    }

    // Create agreement (status: invited)
    const [newAgreement] = await db.insert(campaignAgreements)
      .values({
        campaign_id: parseInt(campaign_id),
        brand_id: brandId,
        creator_id: creator_id,
        price_offered: priceFloat.toFixed(2),
        final_price: priceFloat.toFixed(2), // Initially same as offered
        deadline: deadline ? new Date(deadline) : null,
        custom_terms: custom_terms || null,
        invitation_type: 'brand_invite',
        status: 'invited',
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning();

    // Create virtual reservation (expires in 48h)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    await db.insert(walletReservations)
      .values({
        user_id: brandId,
        agreement_id: newAgreement.id,
        amount: priceFloat.toFixed(2),
        status: 'active',
        expires_at: expiresAt,
        created_at: new Date()
      });

    console.log(`✅ Agreement invitation created: Brand ${brandId} → Creator ${creator_id}, Price: ${priceFloat} MAD`);

    return res.status(201).json({
      success: true,
      message: `تم إرسال دعوة الاتفاق بنجاح! تنتهي صلاحية الحجز في ${expiresAt.toLocaleString('ar-MA')}`,
      agreement: {
        id: newAgreement.id,
        campaign_id: newAgreement.campaign_id,
        creator_id: newAgreement.creator_id,
        price_offered: parseFloat(newAgreement.price_offered),
        status: newAgreement.status,
        deadline: newAgreement.deadline,
        expires_at: expiresAt
      }
    });
  } catch (error) {
    console.error("❌ Error creating agreement:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في إنشاء الاتفاق",
      error: error.message
    });
  }
});

// PATCH /api/agreements/:id/accept - Creator accepte l'invitation
app.patch("/api/agreements/:id/accept", authMiddleware, async (req, res) => {
  try {
    const creatorId = req.user.id;
    const agreementId = parseInt(req.params.id);

    // Get agreement
    const [agreement] = await db.select()
      .from(campaignAgreements)
      .where(eq(campaignAgreements.id, agreementId));

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: "الاتفاق غير موجود"
      });
    }

    // Verify creator
    if (agreement.creator_id !== creatorId) {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك بقبول هذا الاتفاق"
      });
    }

    // Check status
    if (agreement.status !== 'invited') {
      return res.status(400).json({
        success: false,
        message: "لا يمكن قبول الاتفاق. الحالة الحالية: " + agreement.status
      });
    }

    // Get reservation
    const [reservation] = await db.select()
      .from(walletReservations)
      .where(
        and(
          eq(walletReservations.agreement_id, agreementId),
          eq(walletReservations.status, 'active')
        )
      );

    if (!reservation) {
      return res.status(400).json({
        success: false,
        message: "الحجز غير موجود أو منتهي الصلاحية"
      });
    }

    // Check if reservation expired
    if (new Date(reservation.expires_at) < new Date()) {
      // Auto-expire the reservation
      await db.update(walletReservations)
        .set({ 
          status: 'expired',
          updated_at: new Date()
        })
        .where(eq(walletReservations.id, reservation.id));

      return res.status(400).json({
        success: false,
        message: "انتهت صلاحية هذه الدعوة"
      });
    }

    // ATOMIC TRANSACTION: Convert reservation → escrow + debit wallet
    const escrowAmount = parseFloat(agreement.final_price);

    await db.transaction(async (tx) => {
      // 1. Update agreement status
      await tx.update(campaignAgreements)
        .set({ 
          status: 'negotiating',
          updated_at: new Date()
        })
        .where(eq(campaignAgreements.id, agreementId));

      // 2. Convert reservation to escrow
      await tx.update(walletReservations)
        .set({ 
          status: 'converted',
          updated_at: new Date()
        })
        .where(eq(walletReservations.id, reservation.id));

      // 3. Debit brand wallet (escrow funds locked)
      await tx.update(wallets)
        .set({ 
          balance: sql`balance - ${escrowAmount}`,
          updated_at: new Date()
        })
        .where(eq(wallets.user_id, agreement.brand_id));

      // 4. Create escrow entry
      await tx.insert(agreementEscrow)
        .values({
          agreement_id: agreementId,
          brand_id: agreement.brand_id,
          creator_id: agreement.creator_id,
          amount: agreement.final_price,
          status: 'active',
          created_at: new Date(),
          updated_at: new Date()
        });

      // 5. Create conversation for real-time negotiation
      await tx.insert(conversations)
        .values({
          agreement_id: agreementId,
          brand_id: agreement.brand_id,
          creator_id: agreement.creator_id,
          campaign_id: agreement.campaign_id,
          last_message: "تم قبول الدعوة! يمكنكم الآن بدء المحادثة 💬",
          last_message_at: new Date(),
          brand_unread_count: 0,
          creator_unread_count: 0,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        });
    });

    console.log(`✅ Agreement accepted: Agreement #${agreementId}, Escrow created for ${agreement.final_price} MAD, Wallet debited`);

    return res.status(200).json({
      success: true,
      message: "تم قبول الاتفاق بنجاح! الآن يمكنك البدء في التفاوض 🎉",
      agreement: {
        id: agreement.id,
        status: 'negotiating',
        final_price: parseFloat(agreement.final_price)
      }
    });
  } catch (error) {
    console.error("❌ Error accepting agreement:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في قبول الاتفاق",
      error: error.message
    });
  }
});

// POST /api/agreements/apply - Creator applies to campaign (NO reservation until brand accepts)
app.post("/api/agreements/apply", authMiddleware, async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { 
      campaign_id, 
      proposed_price, 
      application_message, 
      portfolio_links, 
      delivery_days, 
      additional_notes 
    } = req.body;

    // SECURITY: Load role from profiles table (server-side source of truth)
    const [userProfile] = await db.select()
      .from(profiles)
      .where(eq(profiles.id, creatorId));

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: "الملف الشخصي غير موجود"
      });
    }

    // Verify user is a creator
    if (userProfile.role !== 'creator') {
      return res.status(403).json({
        success: false,
        message: "هذه الميزة متاحة فقط للمبدعين"
      });
    }

    // Validate required fields
    if (!campaign_id || !proposed_price || !application_message || !delivery_days) {
      return res.status(400).json({
        success: false,
        message: "جميع الحقول مطلوبة: معرف الحملة، السعر المقترح، رسالة التقديم، ومدة التسليم"
      });
    }

    // Validate price
    const priceFloat = parseFloat(proposed_price);
    if (isNaN(priceFloat) || priceFloat <= 0) {
      return res.status(400).json({
        success: false,
        message: "السعر المقترح يجب أن يكون أكبر من صفر"
      });
    }

    // Validate delivery days
    const deliveryDaysInt = parseInt(delivery_days);
    if (isNaN(deliveryDaysInt) || deliveryDaysInt <= 0) {
      return res.status(400).json({
        success: false,
        message: "مدة التسليم يجب أن تكون أكبر من صفر"
      });
    }

    // Validate portfolio links (if provided)
    let portfolioLinksJson = null;
    if (portfolio_links) {
      try {
        const portfolioArray = Array.isArray(portfolio_links) ? portfolio_links : JSON.parse(portfolio_links);
        if (!Array.isArray(portfolioArray)) {
          throw new Error("Portfolio links must be an array");
        }
        portfolioLinksJson = JSON.stringify(portfolioArray);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: "روابط الأعمال السابقة يجب أن تكون في شكل قائمة صحيحة"
        });
      }
    }

    // Check campaign exists and is active
    const [campaign] = await db.select()
      .from(campaigns)
      .where(eq(campaigns.id, campaign_id));

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "الحملة غير موجودة"
      });
    }

    if (campaign.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: "الحملة غير نشطة حالياً"
      });
    }

    // Check if creator already has an application/agreement for this campaign
    const existingAgreement = await db.select()
      .from(campaignAgreements)
      .where(
        and(
          eq(campaignAgreements.campaign_id, campaign_id),
          eq(campaignAgreements.creator_id, creatorId)
        )
      );

    if (existingAgreement.length > 0) {
      return res.status(409).json({
        success: false,
        message: "لديك بالفعل طلب أو اتفاق لهذه الحملة"
      });
    }

    // Price validation: Check if price is reasonable compared to campaign budget
    let priceWarning = null;
    const campaignBudget = parseFloat(campaign.price_per_ugc || campaign.budget_per_video || 0);
    
    if (campaignBudget > 0) {
      const priceRatio = priceFloat / campaignBudget;
      
      if (priceRatio > 3) {
        priceWarning = "red"; // Very high price
      } else if (priceRatio > 2) {
        priceWarning = "yellow"; // High price
      } else {
        priceWarning = "green"; // Reasonable price
      }
    }

    // Create application agreement (status: 'pending' = awaiting brand approval)
    const [newApplication] = await db.insert(campaignAgreements)
      .values({
        campaign_id: parseInt(campaign_id),
        brand_id: campaign.brand_id,
        creator_id: creatorId,
        price_offered: priceFloat.toFixed(2),
        final_price: priceFloat.toFixed(2), // Initially same as proposed
        invitation_type: 'creator_application', // Key: this is a creator application, not brand invite
        status: 'pending', // Awaiting brand approval
        application_message: application_message,
        portfolio_links: portfolioLinksJson,
        delivery_days: deliveryDaysInt,
        additional_notes: additional_notes || null,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning();

    console.log(`📝 Creator application submitted: Creator ${creatorId} → Campaign ${campaign_id}, Proposed: ${priceFloat} MAD (Warning: ${priceWarning})`);

    return res.status(201).json({
      success: true,
      message: "تم تقديم طلبك بنجاح! في انتظار موافقة العلامة التجارية ✨",
      application: {
        id: newApplication.id,
        campaign_id: newApplication.campaign_id,
        campaign_title: campaign.title,
        proposed_price: parseFloat(newApplication.price_offered),
        status: newApplication.status,
        created_at: newApplication.created_at,
        price_warning: priceWarning // Send warning level to frontend for UI feedback
      }
    });
  } catch (error) {
    console.error("❌ Error submitting creator application:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في تقديم الطلب",
      error: error.message
    });
  }
});

// PATCH /api/agreements/:id/approve - Brand approves creator application
app.patch("/api/agreements/:id/approve", authMiddleware, async (req, res) => {
  try {
    const brandId = req.user.id;
    const agreementId = parseInt(req.params.id);

    // SECURITY: Load role from profiles table (server-side source of truth)
    const [userProfile] = await db.select()
      .from(profiles)
      .where(eq(profiles.id, brandId));

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: "الملف الشخصي غير موجود"
      });
    }

    // Verify user is a brand
    if (userProfile.role !== 'brand') {
      return res.status(403).json({
        success: false,
        message: "هذه الميزة متاحة فقط للعلامات التجارية"
      });
    }

    // Get agreement
    const [agreement] = await db.select()
      .from(campaignAgreements)
      .where(eq(campaignAgreements.id, agreementId));

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: "الطلب غير موجود"
      });
    }

    // Verify brand
    if (agreement.brand_id !== brandId) {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك بالموافقة على هذا الطلب"
      });
    }

    // Check invitation type
    if (agreement.invitation_type !== 'creator_application') {
      return res.status(400).json({
        success: false,
        message: "هذا ليس طلب من منشئ محتوى"
      });
    }

    // Check status
    if (agreement.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: "لا يمكن الموافقة على الطلب. الحالة الحالية: " + agreement.status
      });
    }

    // Get brand wallet
    const [wallet] = await db.select()
      .from(wallets)
      .where(eq(wallets.user_id, brandId));

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "المحفظة غير موجودة"
      });
    }

    // Calculate available balance (total - reserved)
    const activeReservations = await db.select()
      .from(walletReservations)
      .where(
        and(
          eq(walletReservations.user_id, brandId),
          eq(walletReservations.status, 'active')
        )
      );

    const totalReserved = activeReservations.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const availableBalance = parseFloat(wallet.balance) - totalReserved;
    const agreementPrice = parseFloat(agreement.final_price);

    if (availableBalance < agreementPrice) {
      return res.status(400).json({
        success: false,
        message: `رصيد غير كافي. المتوفر: ${availableBalance.toFixed(2)} د.م، المطلوب: ${agreementPrice.toFixed(2)} د.م`,
        available_balance: availableBalance,
        required_amount: agreementPrice
      });
    }

    // ATOMIC TRANSACTION: Create reservation + escrow + debit wallet
    await db.transaction(async (tx) => {
      // 1. Update agreement status to negotiating
      await tx.update(campaignAgreements)
        .set({ 
          status: 'negotiating',
          updated_at: new Date()
        })
        .where(eq(campaignAgreements.id, agreementId));

      // 2. Create reservation (already converted immediately)
      const [reservation] = await tx.insert(walletReservations)
        .values({
          user_id: brandId,
          agreement_id: agreementId,
          amount: agreement.final_price,
          status: 'converted', // Immediately converted
          created_at: new Date(),
          expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48h (for tracking)
        })
        .returning();

      // 3. Debit brand wallet (escrow funds locked)
      await tx.update(wallets)
        .set({ 
          balance: sql`balance - ${agreementPrice}`,
          updated_at: new Date()
        })
        .where(eq(wallets.user_id, brandId));

      // 4. Create escrow entry
      await tx.insert(agreementEscrow)
        .values({
          agreement_id: agreementId,
          brand_id: agreement.brand_id,
          creator_id: agreement.creator_id,
          amount: agreement.final_price,
          status: 'active',
          created_at: new Date(),
          updated_at: new Date()
        });

      // 5. Create conversation for real-time negotiation
      await tx.insert(conversations)
        .values({
          agreement_id: agreementId,
          brand_id: agreement.brand_id,
          creator_id: agreement.creator_id,
          campaign_id: agreement.campaign_id,
          last_message: "تم قبول الطلب! يمكنكم الآن بدء المحادثة 💬",
          last_message_at: new Date(),
          brand_unread_count: 0,
          creator_unread_count: 0,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        });
    });

    console.log(`✅ Creator application approved: Agreement #${agreementId}, Escrow created for ${agreementPrice} MAD`);

    return res.status(200).json({
      success: true,
      message: "تم قبول الطلب بنجاح! يمكنكم الآن البدء في التفاوض 🎉",
      agreement: {
        id: agreement.id,
        status: 'negotiating',
        final_price: agreementPrice
      }
    });
  } catch (error) {
    console.error("❌ Error approving creator application:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في الموافقة على الطلب",
      error: error.message
    });
  }
});

// GET /api/agreements - Liste les agreements (filtrable par role, status, campaign)
app.get("/api/agreements", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, campaign_id, role } = req.query;

    // Determine if user is brand or creator
    const isBrand = role === 'brand' || req.query.as_brand === 'true';
    
    let query = db.select({
      id: campaignAgreements.id,
      campaign_id: campaignAgreements.campaign_id,
      brand_id: campaignAgreements.brand_id,
      creator_id: campaignAgreements.creator_id,
      price_offered: campaignAgreements.price_offered,
      final_price: campaignAgreements.final_price,
      status: campaignAgreements.status,
      deadline: campaignAgreements.deadline,
      custom_terms: campaignAgreements.custom_terms,
      created_at: campaignAgreements.created_at,
      updated_at: campaignAgreements.updated_at,
      campaign_title: campaigns.title,
      campaign_description: campaigns.description
    })
      .from(campaignAgreements)
      .leftJoin(campaigns, eq(campaignAgreements.campaign_id, campaigns.id));

    // Filter by user role
    if (isBrand) {
      query = query.where(eq(campaignAgreements.brand_id, userId));
    } else {
      query = query.where(eq(campaignAgreements.creator_id, userId));
    }

    // Optional filters
    if (status) {
      query = query.where(
        and(
          isBrand ? eq(campaignAgreements.brand_id, userId) : eq(campaignAgreements.creator_id, userId),
          eq(campaignAgreements.status, status)
        )
      );
    }

    if (campaign_id) {
      query = query.where(
        and(
          isBrand ? eq(campaignAgreements.brand_id, userId) : eq(campaignAgreements.creator_id, userId),
          eq(campaignAgreements.campaign_id, parseInt(campaign_id))
        )
      );
    }

    const agreements = await query.orderBy(desc(campaignAgreements.created_at));

    return res.status(200).json({
      success: true,
      agreements: agreements.map(a => ({
        ...a,
        price_offered: parseFloat(a.price_offered),
        final_price: parseFloat(a.final_price)
      })),
      count: agreements.length
    });
  } catch (error) {
    console.error("❌ Error fetching agreements:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في جلب الاتفاقات",
      error: error.message
    });
  }
});

// =====================================================
// 💬 NEGOTIATION ENDPOINTS - HTTP REST API
// =====================================================

// GET /api/agreements/:id/messages - Récupère l'historique des messages
app.get("/api/agreements/:id/messages", authMiddleware, async (req, res) => {
  try {
    const agreementId = parseInt(req.params.id);
    const userId = req.user.id;

    // Verify user is part of agreement
    const [agreement] = await db.select()
      .from(campaignAgreements)
      .where(eq(campaignAgreements.id, agreementId));

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: "الاتفاق غير موجود"
      });
    }

    if (agreement.brand_id !== userId && agreement.creator_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك بالوصول إلى هذه المحادثة"
      });
    }

    // Get all messages
    const messages = await db.select()
      .from(negotiationMessages)
      .where(eq(negotiationMessages.agreement_id, agreementId))
      .orderBy(negotiationMessages.created_at);

    // Mark messages as read for current user
    await db.update(negotiationMessages)
      .set({ is_read: true })
      .where(
        and(
          eq(negotiationMessages.agreement_id, agreementId),
          sql`${negotiationMessages.sender_id} != ${userId}`
        )
      );

    return res.status(200).json({
      success: true,
      messages: messages,
      count: messages.length
    });
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في جلب الرسائل",
      error: error.message
    });
  }
});

// PATCH /api/agreements/:id/counter-offer - Faire une contre-proposition
app.patch("/api/agreements/:id/counter-offer", authMiddleware, async (req, res) => {
  try {
    const agreementId = parseInt(req.params.id);
    const userId = req.user.id;
    const { new_price, new_deadline, new_terms } = req.body;

    // Validate new_price
    if (!new_price || parseFloat(new_price) <= 0) {
      return res.status(400).json({
        success: false,
        message: "السعر الجديد يجب أن يكون أكبر من صفر"
      });
    }

    // Get agreement
    const [agreement] = await db.select()
      .from(campaignAgreements)
      .where(eq(campaignAgreements.id, agreementId));

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: "الاتفاق غير موجود"
      });
    }

    // Verify user is part of agreement
    if (agreement.brand_id !== userId && agreement.creator_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك بتعديل هذا الاتفاق"
      });
    }

    // Check status
    if (agreement.status !== 'negotiating') {
      return res.status(400).json({
        success: false,
        message: "لا يمكن التفاوض. الحالة الحالية: " + agreement.status
      });
    }

    // Update agreement with new terms
    const updateData = {
      final_price: parseFloat(new_price).toFixed(2),
      updated_at: new Date()
    };

    if (new_deadline) {
      updateData.deadline = new Date(new_deadline);
    }

    if (new_terms) {
      updateData.custom_terms = new_terms;
    }

    await db.update(campaignAgreements)
      .set(updateData)
      .where(eq(campaignAgreements.id, agreementId));

    // Create notification message
    const notificationText = `عرض جديد: ${parseFloat(new_price).toFixed(2)} د.م`;
    await db.insert(negotiationMessages)
      .values({
        agreement_id: agreementId,
        sender_id: userId,
        message_text: notificationText,
        is_read: false,
        created_at: new Date()
      });

    console.log(`💰 Counter offer made on agreement #${agreementId}: ${new_price} MAD`);

    return res.status(200).json({
      success: true,
      message: "تم إرسال العرض الجديد بنجاح!",
      agreement: {
        id: agreementId,
        final_price: parseFloat(new_price),
        deadline: updateData.deadline || agreement.deadline,
        custom_terms: updateData.custom_terms || agreement.custom_terms
      }
    });
  } catch (error) {
    console.error("❌ Error making counter offer:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في إرسال العرض الجديد",
      error: error.message
    });
  }
});

// PATCH /api/agreements/:id/finalize - Finaliser l'agreement
app.patch("/api/agreements/:id/finalize", authMiddleware, async (req, res) => {
  try {
    const agreementId = parseInt(req.params.id);
    const userId = req.user.id;

    // Get agreement
    const [agreement] = await db.select()
      .from(campaignAgreements)
      .where(eq(campaignAgreements.id, agreementId));

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: "الاتفاق غير موجود"
      });
    }

    // Verify user is part of agreement
    if (agreement.brand_id !== userId && agreement.creator_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك بإتمام هذا الاتفاق"
      });
    }

    // Check status
    if (agreement.status !== 'negotiating') {
      return res.status(400).json({
        success: false,
        message: "لا يمكن إتمام الاتفاق. الحالة الحالية: " + agreement.status
      });
    }

    // Update agreement to 'active' (finalized)
    await db.update(campaignAgreements)
      .set({ 
        status: 'active',
        updated_at: new Date()
      })
      .where(eq(campaignAgreements.id, agreementId));

    // Update escrow amount if price changed during negotiation
    await db.update(agreementEscrow)
      .set({ 
        amount: agreement.final_price,
        updated_at: new Date()
      })
      .where(eq(agreementEscrow.agreement_id, agreementId));

    console.log(`✅ Agreement #${agreementId} finalized at ${agreement.final_price} MAD`);

    return res.status(200).json({
      success: true,
      message: "تم إتمام الاتفاق بنجاح! يمكنك الآن البدء في إنشاء المحتوى 🎉",
      agreement: {
        id: agreementId,
        status: 'active',
        final_price: parseFloat(agreement.final_price)
      }
    });
  } catch (error) {
    console.error("❌ Error finalizing agreement:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في إتمام الاتفاق",
      error: error.message
    });
  }
});

// =====================================================
// 📹 SUBMISSION ENDPOINTS - AGREEMENT-BASED SYSTEM
// =====================================================

// POST /api/agreements/:id/submit - Creator soumet vidéo (uses existing upload-video then links to agreement)
app.post("/api/agreements/:id/submit", authMiddleware, uploadVideo.single("video"), async (req, res) => {
  let tempInputPath = null;
  let tempOutputPath = null;

  try {
    const agreementId = parseInt(req.params.id);
    const creatorId = req.user.id;

    // Validate video file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "لم يتم رفع ملف الفيديو"
      });
    }

    // Get agreement
    const [agreement] = await db.select()
      .from(campaignAgreements)
      .where(eq(campaignAgreements.id, agreementId));

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: "الاتفاق غير موجود"
      });
    }

    // Verify creator
    if (agreement.creator_id !== creatorId) {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك بالتقديم لهذا الاتفاق"
      });
    }

    // Check status
    if (agreement.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: "لا يمكن التقديم. الحالة الحالية: " + agreement.status
      });
    }

    tempInputPath = req.file.path;
    const fileSize = req.file.size;

    // Get campaign name for watermark
    const [campaign] = await db.select()
      .from(campaigns)
      .where(eq(campaigns.id, agreement.campaign_id));
    const campaignName = campaign?.title || "UGC Maroc";

    // Apply watermark
    console.log("🎨 Applying watermark...");
    tempOutputPath = await watermarkService.addWatermark(
      tempInputPath,
      "UGC Maroc",
      campaignName
    );

    // Generate unique key for R2
    const videoId = uuidv4();
    const fileExtension = path.extname(req.file.originalname);
    const r2Key = `submissions/agreement-${agreementId}/${videoId}${fileExtension}`;

    // Upload to R2
    console.log(`☁️ Uploading to R2: ${r2Key}`);
    const uploadResult = await r2Service.uploadFileToR2(
      tempOutputPath,
      r2Key,
      "video/mp4"
    );

    // Create submission
    const [submission] = await db.insert(submissions)
      .values({
        campaign_id: agreement.campaign_id,
        creator_id: creatorId,
        agreement_id: agreementId,
        video_url: uploadResult.publicUrl,
        r2_key: r2Key,
        file_size: fileSize,
        status: 'pending',
        submitted_at: new Date()
      })
      .returning();

    // Update agreement status
    await db.update(campaignAgreements)
      .set({ 
        status: 'pending_review',
        updated_at: new Date()
      })
      .where(eq(campaignAgreements.id, agreementId));

    console.log(`✅ Submission created for agreement #${agreementId}`);

    return res.status(201).json({
      success: true,
      message: "تم رفع المحتوى بنجاح! في انتظار المراجعة ✨",
      submission: {
        id: submission.id,
        video_url: submission.video_url,
        status: submission.status
      }
    });
  } catch (error) {
    console.error("❌ Error submitting video:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في رفع المحتوى",
      error: error.message
    });
  } finally {
    // Cleanup temp files
    if (tempInputPath) await fs.unlink(tempInputPath).catch(() => {});
    if (tempOutputPath) await fs.unlink(tempOutputPath).catch(() => {});
  }
});

// PATCH /api/submissions/:id/approve - Brand approves (ATOMIC: release escrow + create earnings)
app.patch("/api/submissions/:id/approve", authMiddleware, async (req, res) => {
  try {
    const submissionId = parseInt(req.params.id);
    const brandId = req.user.id;

    // Get submission
    const [submission] = await db.select()
      .from(submissions)
      .where(eq(submissions.id, submissionId));

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "المحتوى غير موجود"
      });
    }

    if (!submission.agreement_id) {
      return res.status(400).json({
        success: false,
        message: "هذا المحتوى غير مرتبط باتفاق"
      });
    }

    // Get agreement
    const [agreement] = await db.select()
      .from(campaignAgreements)
      .where(eq(campaignAgreements.id, submission.agreement_id));

    // Verify brand
    if (agreement.brand_id !== brandId) {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك بالموافقة على هذا المحتوى"
      });
    }

    // Check status
    if (submission.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: "لا يمكن الموافقة. الحالة الحالية: " + submission.status
      });
    }

    // Get creator's active bank details (for payment traceability)
    const [activeBankDetail] = await db.select()
      .from(creatorBankDetails)
      .where(
        and(
          eq(creatorBankDetails.creator_id, submission.creator_id),
          eq(creatorBankDetails.status, 'active')
        )
      );

    if (!activeBankDetail) {
      return res.status(400).json({
        success: false,
        message: "المنشئ ليس لديه معلومات بنكية نشطة. لا يمكن تحويل الأرباح"
      });
    }

    // ATOMIC TRANSACTION: Release escrow + create earnings
    const finalPrice = parseFloat(agreement.final_price);
    const platformFee = finalPrice * 0.15; // 15% commission
    const netAmount = finalPrice - platformFee;

    await db.transaction(async (tx) => {
      // 1. Update submission
      await tx.update(submissions)
        .set({ 
          status: 'approved',
          reviewed_at: new Date()
        })
        .where(eq(submissions.id, submissionId));

      // 2. Release escrow
      await tx.update(agreementEscrow)
        .set({ 
          status: 'released',
          released_at: new Date(),
          updated_at: new Date()
        })
        .where(eq(agreementEscrow.agreement_id, submission.agreement_id));

      // 3. Create earnings for creator (WITH BANK DETAIL LINK)
      await tx.insert(agreementEarnings)
        .values({
          creator_id: submission.creator_id,
          agreement_id: submission.agreement_id,
          submission_id: submissionId,
          bank_detail_id: activeBankDetail.id, // 🏦 Immutable link to RIB used for payment
          gross_amount: finalPrice.toFixed(2),
          platform_fee: platformFee.toFixed(2),
          net_amount: netAmount.toFixed(2),
          status: 'available',
          earned_at: new Date()
        });

      // 4. Update agreement status
      await tx.update(campaignAgreements)
        .set({ 
          status: 'completed',
          updated_at: new Date()
        })
        .where(eq(campaignAgreements.id, submission.agreement_id));
    });

    console.log(`✅ Submission #${submissionId} approved. Creator earned ${netAmount.toFixed(2)} MAD`);

    return res.status(200).json({
      success: true,
      message: "تم الموافقة على المحتوى! تم تحويل الأرباح للمنشئ 🎉",
      earnings: {
        gross_amount: finalPrice,
        platform_fee: platformFee,
        net_amount: netAmount
      }
    });
  } catch (error) {
    console.error("❌ Error approving submission:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في الموافقة على المحتوى",
      error: error.message
    });
  }
});

// PATCH /api/submissions/:id/request-revision - Brand requests revision
app.patch("/api/submissions/:id/request-revision", authMiddleware, async (req, res) => {
  try {
    const submissionId = parseInt(req.params.id);
    const brandId = req.user.id;
    const { feedback } = req.body;

    if (!feedback) {
      return res.status(400).json({
        success: false,
        message: "الملاحظات مطلوبة"
      });
    }

    // Get submission & verify
    const [submission] = await db.select()
      .from(submissions)
      .where(eq(submissions.id, submissionId));

    if (!submission || !submission.agreement_id) {
      return res.status(404).json({
        success: false,
        message: "المحتوى غير موجود"
      });
    }

    const [agreement] = await db.select()
      .from(campaignAgreements)
      .where(eq(campaignAgreements.id, submission.agreement_id));

    if (agreement.brand_id !== brandId) {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك"
      });
    }

    // Update submission
    await db.update(submissions)
      .set({ 
        status: 'revision_requested',
        feedback: feedback,
        reviewed_at: new Date()
      })
      .where(eq(submissions.id, submissionId));

    // Update agreement status back to active
    await db.update(campaignAgreements)
      .set({ 
        status: 'active',
        updated_at: new Date()
      })
      .where(eq(campaignAgreements.id, submission.agreement_id));

    console.log(`🔄 Revision requested for submission #${submissionId}`);

    return res.status(200).json({
      success: true,
      message: "تم طلب التعديل بنجاح"
    });
  } catch (error) {
    console.error("❌ Error requesting revision:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في طلب التعديل",
      error: error.message
    });
  }
});

// PATCH /api/submissions/:id/reject - Brand rejects (opens dispute if creator disagrees)
app.patch("/api/submissions/:id/reject", authMiddleware, async (req, res) => {
  try {
    const submissionId = parseInt(req.params.id);
    const brandId = req.user.id;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "سبب الرفض مطلوب"
      });
    }

    // Get submission & verify
    const [submission] = await db.select()
      .from(submissions)
      .where(eq(submissions.id, submissionId));

    if (!submission || !submission.agreement_id) {
      return res.status(404).json({
        success: false,
        message: "المحتوى غير موجود"
      });
    }

    const [agreement] = await db.select()
      .from(campaignAgreements)
      .where(eq(campaignAgreements.id, submission.agreement_id));

    if (agreement.brand_id !== brandId) {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك"
      });
    }

    // Update submission
    await db.update(submissions)
      .set({ 
        status: 'rejected',
        feedback: reason,
        reviewed_at: new Date()
      })
      .where(eq(submissions.id, submissionId));

    // Update agreement status
    await db.update(campaignAgreements)
      .set({ 
        status: 'rejected',
        updated_at: new Date()
      })
      .where(eq(campaignAgreements.id, submission.agreement_id));

    console.log(`❌ Submission #${submissionId} rejected`);

    return res.status(200).json({
      success: true,
      message: "تم رفض المحتوى. يمكن للمنشئ فتح نزاع إذا لم يوافق"
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

// =====================================================
// ⚖️ DISPUTE ENDPOINTS
// =====================================================

// POST /api/disputes/create - Open a dispute
app.post("/api/disputes/create", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { agreement_id, reason, evidence } = req.body;

    if (!agreement_id || !reason) {
      return res.status(400).json({
        success: false,
        message: "معرف الاتفاق والسبب مطلوبان"
      });
    }

    // Get agreement
    const [agreement] = await db.select()
      .from(campaignAgreements)
      .where(eq(campaignAgreements.id, parseInt(agreement_id)));

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: "الاتفاق غير موجود"
      });
    }

    // Verify user is part of agreement
    if (agreement.brand_id !== userId && agreement.creator_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك بفتح نزاع لهذا الاتفاق"
      });
    }

    // Create dispute
    const [dispute] = await db.insert(disputeCases)
      .values({
        agreement_id: parseInt(agreement_id),
        opened_by: userId,
        reason: reason,
        evidence: evidence || null,
        status: 'open',
        created_at: new Date()
      })
      .returning();

    // Update agreement status
    await db.update(campaignAgreements)
      .set({ 
        status: 'disputed',
        updated_at: new Date()
      })
      .where(eq(campaignAgreements.id, parseInt(agreement_id)));

    console.log(`⚖️ Dispute opened: #${dispute.id} for agreement #${agreement_id}`);

    return res.status(201).json({
      success: true,
      message: "تم فتح النزاع بنجاح. سيتم مراجعته من قبل الإدارة",
      dispute: {
        id: dispute.id,
        status: dispute.status
      }
    });
  } catch (error) {
    console.error("❌ Error creating dispute:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في فتح النزاع",
      error: error.message
    });
  }
});

// GET /api/disputes - List disputes (admin only)
app.get("/api/disputes", authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    
    // Admin role check (MVP: check user_id, production: add role field to profiles)
    const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || '').split(',').filter(id => id);
    if (!ADMIN_USER_IDS.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك بالوصول (إداريون فقط)"
      });
    }

    let query = db.select({
      id: disputeCases.id,
      agreement_id: disputeCases.agreement_id,
      opened_by: disputeCases.opened_by,
      reason: disputeCases.reason,
      evidence: disputeCases.evidence,
      status: disputeCases.status,
      resolution: disputeCases.resolution,
      resolved_by: disputeCases.resolved_by,
      resolved_at: disputeCases.resolved_at,
      created_at: disputeCases.created_at
    })
      .from(disputeCases);

    if (status && ['open', 'resolved'].includes(status)) {
      query = query.where(eq(disputeCases.status, status));
    }

    const disputes = await query.orderBy(desc(disputeCases.created_at));

    return res.status(200).json({
      success: true,
      disputes: disputes,
      count: disputes.length
    });
  } catch (error) {
    console.error("❌ Error fetching disputes:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في جلب النزاعات",
      error: error.message
    });
  }
});

// PATCH /api/disputes/:id/resolve - Resolve dispute (admin only, ATOMIC)
app.patch("/api/disputes/:id/resolve", authMiddleware, async (req, res) => {
  try {
    const disputeId = parseInt(req.params.id);
    const adminId = req.user.id;
    const { resolution, award_to } = req.body; // award_to: 'creator', 'brand', or 'split'

    // Admin role check (MVP: check user_id, production: add role field to profiles)
    const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || '').split(',').filter(id => id);
    if (!ADMIN_USER_IDS.includes(adminId)) {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك بحل النزاعات (إداريون فقط)"
      });
    }

    if (!resolution || !award_to || !['creator', 'brand', 'split'].includes(award_to)) {
      return res.status(400).json({
        success: false,
        message: "القرار وجهة التحويل مطلوبة (creator/brand/split)"
      });
    }

    // Get dispute
    const [dispute] = await db.select()
      .from(disputeCases)
      .where(eq(disputeCases.id, disputeId));

    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: "النزاع غير موجود"
      });
    }

    if (dispute.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: "النزاع تم حله بالفعل"
      });
    }

    // Get agreement & escrow
    const [agreement] = await db.select()
      .from(campaignAgreements)
      .where(eq(campaignAgreements.id, dispute.agreement_id));

    const [escrow] = await db.select()
      .from(agreementEscrow)
      .where(eq(agreementEscrow.agreement_id, dispute.agreement_id));

    if (!escrow || escrow.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: "لا يوجد رصيد محجوز لهذا الاتفاق"
      });
    }

    // Get creator's active bank details (for payment traceability)
    const [activeBankDetail] = await db.select()
      .from(creatorBankDetails)
      .where(
        and(
          eq(creatorBankDetails.creator_id, agreement.creator_id),
          eq(creatorBankDetails.status, 'active')
        )
      );

    if (!activeBankDetail && (award_to === 'creator' || award_to === 'split')) {
      return res.status(400).json({
        success: false,
        message: "المنشئ ليس لديه معلومات بنكية نشطة. لا يمكن تحويل الأرباح"
      });
    }

    const totalAmount = parseFloat(escrow.amount);
    const platformFee = totalAmount * 0.15;

    // ATOMIC TRANSACTION: Release escrow based on admin decision
    await db.transaction(async (tx) => {
      if (award_to === 'creator') {
        // Full amount to creator (minus platform fee)
        const netAmount = totalAmount - platformFee;
        
        await tx.insert(agreementEarnings)
          .values({
            creator_id: agreement.creator_id,
            agreement_id: agreement.id,
            submission_id: null, // No submission in dispute
            bank_detail_id: activeBankDetail.id, // 🏦 Immutable link to RIB
            gross_amount: totalAmount.toFixed(2),
            platform_fee: platformFee.toFixed(2),
            net_amount: netAmount.toFixed(2),
            status: 'available',
            earned_at: new Date()
          });

      } else if (award_to === 'brand') {
        // Refund to brand wallet (no platform fee)
        await tx.update(wallets)
          .set({ 
            balance: sql`balance + ${totalAmount}`,
            updated_at: new Date()
          })
          .where(eq(wallets.user_id, agreement.brand_id));

      } else if (award_to === 'split') {
        // 50/50 split
        const creatorShare = (totalAmount * 0.5) - (platformFee * 0.5);
        const brandShare = totalAmount * 0.5;

        await tx.insert(agreementEarnings)
          .values({
            creator_id: agreement.creator_id,
            agreement_id: agreement.id,
            submission_id: null,
            bank_detail_id: activeBankDetail.id, // 🏦 Immutable link to RIB
            gross_amount: (totalAmount * 0.5).toFixed(2),
            platform_fee: (platformFee * 0.5).toFixed(2),
            net_amount: creatorShare.toFixed(2),
            status: 'available',
            earned_at: new Date()
          });

        await tx.update(wallets)
          .set({ 
            balance: sql`balance + ${brandShare}`,
            updated_at: new Date()
          })
          .where(eq(wallets.user_id, agreement.brand_id));
      }

      // Release escrow
      await tx.update(agreementEscrow)
        .set({ 
          status: 'released',
          released_at: new Date(),
          updated_at: new Date()
        })
        .where(eq(agreementEscrow.agreement_id, dispute.agreement_id));

      // Update dispute
      await tx.update(disputeCases)
        .set({ 
          status: 'resolved',
          resolution: resolution,
          resolved_by: adminId,
          resolved_at: new Date()
        })
        .where(eq(disputeCases.id, disputeId));

      // Update agreement
      await tx.update(campaignAgreements)
        .set({ 
          status: 'dispute_resolved',
          updated_at: new Date()
        })
        .where(eq(campaignAgreements.id, dispute.agreement_id));
    });

    console.log(`⚖️ Dispute #${disputeId} resolved: ${award_to}`);

    return res.status(200).json({
      success: true,
      message: `تم حل النزاع بنجاح (التحويل: ${award_to})`,
      dispute: {
        id: disputeId,
        resolution: award_to,
        status: 'resolved'
      }
    });
  } catch (error) {
    console.error("❌ Error resolving dispute:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في حل النزاع",
      error: error.message
    });
  }
});

// =====================================================
// ⭐ RATING ENDPOINTS
// =====================================================

// POST /api/agreements/:id/rate - Rate after completion
app.post("/api/agreements/:id/rate", authMiddleware, async (req, res) => {
  try {
    const agreementId = parseInt(req.params.id);
    const userId = req.user.id;
    const { score, comment } = req.body;

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({
        success: false,
        message: "التقييم يجب أن يكون بين 1 و 5 نجوم"
      });
    }

    // Get agreement
    const [agreement] = await db.select()
      .from(campaignAgreements)
      .where(eq(campaignAgreements.id, agreementId));

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: "الاتفاق غير موجود"
      });
    }

    // Verify user is part of agreement
    if (agreement.brand_id !== userId && agreement.creator_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك بتقييم هذا الاتفاق"
      });
    }

    // Check if agreement is completed
    if (!['completed', 'dispute_resolved'].includes(agreement.status)) {
      return res.status(400).json({
        success: false,
        message: "يمكن التقييم فقط بعد إتمام الاتفاق"
      });
    }

    // Determine who is being rated
    const toUser = userId === agreement.brand_id ? agreement.creator_id : agreement.brand_id;

    // Check if already rated
    const existingRating = await db.select()
      .from(ratings)
      .where(
        and(
          eq(ratings.agreement_id, agreementId),
          eq(ratings.from_user, userId)
        )
      );

    if (existingRating.length > 0) {
      return res.status(409).json({
        success: false,
        message: "لقد قمت بالتقييم بالفعل"
      });
    }

    // Create rating
    const [rating] = await db.insert(ratings)
      .values({
        agreement_id: agreementId,
        from_user: userId,
        to_user: toUser,
        score: parseInt(score),
        comment: comment || null,
        created_at: new Date()
      })
      .returning();

    console.log(`⭐ Rating created: ${score} stars for user ${toUser}`);

    return res.status(201).json({
      success: true,
      message: "تم إرسال التقييم بنجاح!",
      rating: {
        id: rating.id,
        score: rating.score
      }
    });
  } catch (error) {
    console.error("❌ Error creating rating:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في إرسال التقييم",
      error: error.message
    });
  }
});

// GET /api/users/:id/ratings - Get user's ratings & reputation
app.get("/api/users/:id/ratings", async (req, res) => {
  try {
    const userId = req.params.id;

    // Get all ratings received by user
    const userRatings = await db.select()
      .from(ratings)
      .where(eq(ratings.to_user, userId))
      .orderBy(desc(ratings.created_at));

    if (userRatings.length === 0) {
      return res.status(200).json({
        success: true,
        ratings: [],
        reputation: {
          average_score: 0,
          total_ratings: 0,
          score_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        }
      });
    }

    // Calculate statistics
    const totalScore = userRatings.reduce((sum, r) => sum + r.score, 0);
    const averageScore = totalScore / userRatings.length;
    
    const scoreDistribution = userRatings.reduce((dist, r) => {
      dist[r.score] = (dist[r.score] || 0) + 1;
      return dist;
    }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

    return res.status(200).json({
      success: true,
      ratings: userRatings,
      reputation: {
        average_score: averageScore.toFixed(2),
        total_ratings: userRatings.length,
        score_distribution: scoreDistribution
      }
    });
  } catch (error) {
    console.error("❌ Error fetching ratings:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في جلب التقييمات",
      error: error.message
    });
  }
});

// =====================================================
// 💰 WALLET ENDPOINTS - NEW AGREEMENT-BASED SYSTEM
// =====================================================

// GET /api/wallet/balance-detailed - Récupère balance avec réservations
app.get("/api/wallet/balance-detailed", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch wallet
    const [wallet] = await db.select()
      .from(wallets)
      .where(eq(wallets.user_id, userId));

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "المحفظة غير موجودة"
      });
    }

    // Fetch active reservations
    const activeReservations = await db.select({
      id: walletReservations.id,
      amount: walletReservations.amount,
      campaign_id: walletReservations.campaign_id,
      creator_id: walletReservations.creator_id,
      expires_at: walletReservations.expires_at,
      created_at: walletReservations.created_at
    })
      .from(walletReservations)
      .where(
        and(
          eq(walletReservations.brand_id, userId),
          eq(walletReservations.status, 'active')
        )
      )
      .orderBy(desc(walletReservations.created_at));

    // Calculate totals
    const totalReserved = activeReservations.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const totalBalance = parseFloat(wallet.balance || 0);
    const pendingBalance = parseFloat(wallet.pending_balance || 0);
    const availableBalance = totalBalance - totalReserved;

    return res.status(200).json({
      success: true,
      wallet: {
        user_id: wallet.user_id,
        total_balance: totalBalance,
        pending_balance: pendingBalance, // En attente validation admin
        reserved_balance: totalReserved, // Bloqué pour invitations
        available_balance: Math.max(0, availableBalance), // Disponible pour nouvelles invitations
        currency: wallet.currency || 'MAD'
      },
      active_reservations: activeReservations.map(r => ({
        ...r,
        amount: parseFloat(r.amount)
      })),
      summary: {
        total_reservations: activeReservations.length,
        oldest_reservation: activeReservations.length > 0 
          ? activeReservations[activeReservations.length - 1].created_at 
          : null
      }
    });
  } catch (error) {
    console.error("❌ Error fetching wallet balance:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في جلب معلومات المحفظة",
      error: error.message
    });
  }
});

// GET /api/wallet/reservations - Liste toutes les réservations (active + expired)
app.get("/api/wallet/reservations", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query; // Filter by status: 'active', 'converted', 'expired', 'cancelled'

    let query = db.select({
      id: walletReservations.id,
      amount: walletReservations.amount,
      campaign_id: walletReservations.campaign_id,
      creator_id: walletReservations.creator_id,
      status: walletReservations.status,
      expires_at: walletReservations.expires_at,
      created_at: walletReservations.created_at,
      updated_at: walletReservations.updated_at,
      campaign_title: campaigns.title
    })
      .from(walletReservations)
      .leftJoin(campaigns, eq(walletReservations.campaign_id, campaigns.id))
      .where(eq(walletReservations.brand_id, userId));

    // Optional status filter
    if (status && ['active', 'converted', 'expired', 'cancelled'].includes(status)) {
      query = query.where(
        and(
          eq(walletReservations.brand_id, userId),
          eq(walletReservations.status, status)
        )
      );
    }

    const reservations = await query.orderBy(desc(walletReservations.created_at));

    return res.status(200).json({
      success: true,
      reservations: reservations.map(r => ({
        ...r,
        amount: parseFloat(r.amount),
        is_expired: r.status === 'active' && new Date(r.expires_at) < new Date()
      })),
      count: reservations.length
    });
  } catch (error) {
    console.error("❌ Error fetching reservations:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في جلب الحجوزات",
      error: error.message
    });
  }
});

// =====================================================
// 🏦 BANK DETAILS ENDPOINTS - SECURE RIB MANAGEMENT
// =====================================================

// POST /api/creator/bank-details/initial - Add initial RIB (signup only, IMMUTABLE after)
app.post("/api/creator/bank-details/initial", authMiddleware, async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { iban, account_holder, bank_name, bank_code } = req.body;

    // Validate required fields
    if (!iban || !account_holder || !bank_name) {
      return res.status(400).json({
        success: false,
        message: "IBAN، اسم صاحب الحساب، واسم البنك مطلوبة"
      });
    }

    // Check if creator already has bank details
    const existingBankDetails = await db.select()
      .from(creatorBankDetails)
      .where(eq(creatorBankDetails.creator_id, creatorId));

    if (existingBankDetails.length > 0) {
      return res.status(409).json({
        success: false,
        message: "لديك بالفعل معلومات بنكية. لتغييرها، يرجى تقديم طلب تغيير"
      });
    }

    // Validate IBAN format (Moroccan: MA + 24 digits)
    const ibanRegex = /^MA\d{24}$/;
    if (!ibanRegex.test(iban.replace(/\s/g, ''))) {
      return res.status(400).json({
        success: false,
        message: "صيغة IBAN غير صحيحة (MA + 24 رقماً)"
      });
    }

    // Create initial bank details
    const [newBankDetail] = await db.insert(creatorBankDetails)
      .values({
        creator_id: creatorId,
        iban: iban.replace(/\s/g, ''), // Remove spaces
        account_holder: account_holder,
        bank_name: bank_name,
        bank_code: bank_code || null,
        status: 'active',
        is_verified: false,
        change_reason: null, // First RIB, no reason
        created_at: new Date()
      })
      .returning();

    console.log(`🏦 Initial RIB added for creator ${creatorId}`);

    return res.status(201).json({
      success: true,
      message: "تم إضافة معلوماتك البنكية بنجاح ✅",
      bank_detail: {
        id: newBankDetail.id,
        iban: newBankDetail.iban,
        account_holder: newBankDetail.account_holder,
        bank_name: newBankDetail.bank_name,
        status: newBankDetail.status,
        is_verified: newBankDetail.is_verified,
        created_at: newBankDetail.created_at
      }
    });
  } catch (error) {
    console.error("❌ Error adding bank details:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في إضافة المعلومات البنكية",
      error: error.message
    });
  }
});

// POST /api/creator/bank-details/change-request - Request RIB change (ticket system)
app.post("/api/creator/bank-details/change-request", authMiddleware, async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { new_iban, new_account_holder, new_bank_name, reason, supporting_documents } = req.body;

    // Validate required fields
    if (!new_iban || !new_account_holder || !new_bank_name || !reason) {
      return res.status(400).json({
        success: false,
        message: "جميع الحقول مطلوبة (IBAN الجديد، اسم صاحب الحساب، البنك، والسبب)"
      });
    }

    // Get current active bank details
    const [currentBankDetail] = await db.select()
      .from(creatorBankDetails)
      .where(
        and(
          eq(creatorBankDetails.creator_id, creatorId),
          eq(creatorBankDetails.status, 'active')
        )
      );

    if (!currentBankDetail) {
      return res.status(404).json({
        success: false,
        message: "لا توجد معلومات بنكية حالية"
      });
    }

    // Check if there's already a pending request
    const pendingRequest = await db.select()
      .from(bankChangeRequests)
      .where(
        and(
          eq(bankChangeRequests.creator_id, creatorId),
          eq(bankChangeRequests.status, 'pending')
        )
      );

    if (pendingRequest.length > 0) {
      return res.status(409).json({
        success: false,
        message: "لديك بالفعل طلب تغيير قيد المراجعة"
      });
    }

    // Validate new IBAN format
    const ibanRegex = /^MA\d{24}$/;
    if (!ibanRegex.test(new_iban.replace(/\s/g, ''))) {
      return res.status(400).json({
        success: false,
        message: "صيغة IBAN الجديد غير صحيحة (MA + 24 رقماً)"
      });
    }

    // Create change request
    const [changeRequest] = await db.insert(bankChangeRequests)
      .values({
        creator_id: creatorId,
        current_bank_detail_id: currentBankDetail.id,
        new_iban: new_iban.replace(/\s/g, ''),
        new_account_holder: new_account_holder,
        new_bank_name: new_bank_name,
        reason: reason,
        supporting_documents: supporting_documents ? JSON.stringify(supporting_documents) : null,
        status: 'pending',
        created_at: new Date()
      })
      .returning();

    console.log(`📋 Bank change request created: Request #${changeRequest.id} by creator ${creatorId}`);

    return res.status(201).json({
      success: true,
      message: "تم تقديم طلب التغيير بنجاح. سيتم مراجعته من قبل الإدارة",
      request: {
        id: changeRequest.id,
        status: changeRequest.status,
        created_at: changeRequest.created_at
      }
    });
  } catch (error) {
    console.error("❌ Error creating bank change request:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في تقديم طلب التغيير",
      error: error.message
    });
  }
});

// GET /api/creator/bank-details/history - Get all RIB history (active + archived)
app.get("/api/creator/bank-details/history", authMiddleware, async (req, res) => {
  try {
    const creatorId = req.user.id;

    // Get all bank details for creator
    const bankHistory = await db.select()
      .from(creatorBankDetails)
      .where(eq(creatorBankDetails.creator_id, creatorId))
      .orderBy(desc(creatorBankDetails.created_at));

    return res.status(200).json({
      success: true,
      bank_details: bankHistory.map(bd => ({
        id: bd.id,
        iban: bd.iban,
        account_holder: bd.account_holder,
        bank_name: bd.bank_name,
        status: bd.status,
        is_verified: bd.is_verified,
        change_reason: bd.change_reason,
        created_at: bd.created_at,
        archived_at: bd.archived_at
      })),
      count: bankHistory.length
    });
  } catch (error) {
    console.error("❌ Error fetching bank history:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في جلب السجل البنكي",
      error: error.message
    });
  }
});

// GET /api/admin/bank-change-requests - Get all change requests (admin only)
app.get("/api/admin/bank-change-requests", authMiddleware, async (req, res) => {
  try {
    const adminId = req.user.id;

    // Admin role check
    const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || '').split(',').filter(id => id);
    if (!ADMIN_USER_IDS.includes(adminId)) {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك بالوصول (إداريون فقط)"
      });
    }

    const { status } = req.query; // Filter: 'pending', 'approved', 'rejected'

    let query = db.select({
      request: bankChangeRequests,
      creator_profile: profiles,
      current_bank: creatorBankDetails
    })
      .from(bankChangeRequests)
      .leftJoin(profiles, eq(bankChangeRequests.creator_id, profiles.id))
      .leftJoin(creatorBankDetails, eq(bankChangeRequests.current_bank_detail_id, creatorBankDetails.id));

    // Optional status filter
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query = query.where(eq(bankChangeRequests.status, status));
    }

    const requests = await query.orderBy(desc(bankChangeRequests.created_at));

    return res.status(200).json({
      success: true,
      requests: requests.map(r => ({
        id: r.request.id,
        creator_id: r.request.creator_id,
        creator_name: r.creator_profile?.full_name,
        creator_email: r.creator_profile?.email,
        current_iban: r.current_bank?.iban,
        new_iban: r.request.new_iban,
        new_account_holder: r.request.new_account_holder,
        new_bank_name: r.request.new_bank_name,
        reason: r.request.reason,
        supporting_documents: r.request.supporting_documents ? JSON.parse(r.request.supporting_documents) : [],
        status: r.request.status,
        admin_notes: r.request.admin_notes,
        created_at: r.request.created_at,
        reviewed_at: r.request.reviewed_at
      })),
      count: requests.length
    });
  } catch (error) {
    console.error("❌ Error fetching bank change requests:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في جلب طلبات التغيير",
      error: error.message
    });
  }
});

// PATCH /api/admin/bank-change-requests/:id/approve - Approve change request (admin only, ATOMIC)
app.patch("/api/admin/bank-change-requests/:id/approve", authMiddleware, async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const adminId = req.user.id;
    const { admin_notes } = req.body;

    // Admin role check
    const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || '').split(',').filter(id => id);
    if (!ADMIN_USER_IDS.includes(adminId)) {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك بالموافقة (إداريون فقط)"
      });
    }

    // Get request
    const [request] = await db.select()
      .from(bankChangeRequests)
      .where(eq(bankChangeRequests.id, requestId));

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "الطلب غير موجود"
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: "الطلب تمت مراجعته بالفعل"
      });
    }

    // ATOMIC TRANSACTION: Archive old RIB + Activate new RIB + Update request
    await db.transaction(async (tx) => {
      // 1. Archive old bank details
      await tx.update(creatorBankDetails)
        .set({
          status: 'archived',
          archived_at: new Date()
        })
        .where(eq(creatorBankDetails.id, request.current_bank_detail_id));

      // 2. Create new active bank details
      const [newBankDetail] = await tx.insert(creatorBankDetails)
        .values({
          creator_id: request.creator_id,
          iban: request.new_iban,
          account_holder: request.new_account_holder,
          bank_name: request.new_bank_name,
          status: 'active',
          is_verified: true, // Admin approved
          change_reason: request.reason,
          created_at: new Date()
        })
        .returning();

      // 3. Link old RIB to new one
      await tx.update(creatorBankDetails)
        .set({ replaced_by: newBankDetail.id })
        .where(eq(creatorBankDetails.id, request.current_bank_detail_id));

      // 4. Update request status
      await tx.update(bankChangeRequests)
        .set({
          status: 'approved',
          admin_notes: admin_notes || 'تمت الموافقة',
          reviewed_by: adminId,
          reviewed_at: new Date()
        })
        .where(eq(bankChangeRequests.id, requestId));
    });

    console.log(`✅ Bank change request approved: Request #${requestId} by admin ${adminId}`);

    return res.status(200).json({
      success: true,
      message: "تمت الموافقة على طلب التغيير بنجاح"
    });
  } catch (error) {
    console.error("❌ Error approving bank change request:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في الموافقة على الطلب",
      error: error.message
    });
  }
});

// PATCH /api/admin/bank-change-requests/:id/reject - Reject change request (admin only)
app.patch("/api/admin/bank-change-requests/:id/reject", authMiddleware, async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const adminId = req.user.id;
    const { admin_notes } = req.body;

    // Admin role check
    const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || '').split(',').filter(id => id);
    if (!ADMIN_USER_IDS.includes(adminId)) {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك بالرفض (إداريون فقط)"
      });
    }

    if (!admin_notes) {
      return res.status(400).json({
        success: false,
        message: "يرجى توفير سبب الرفض"
      });
    }

    // Get request
    const [request] = await db.select()
      .from(bankChangeRequests)
      .where(eq(bankChangeRequests.id, requestId));

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "الطلب غير موجود"
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: "الطلب تمت مراجعته بالفعل"
      });
    }

    // Update request status
    await db.update(bankChangeRequests)
      .set({
        status: 'rejected',
        admin_notes: admin_notes,
        reviewed_by: adminId,
        reviewed_at: new Date()
      })
      .where(eq(bankChangeRequests.id, requestId));

    console.log(`❌ Bank change request rejected: Request #${requestId} by admin ${adminId}`);

    return res.status(200).json({
      success: true,
      message: "تم رفض طلب التغيير"
    });
  } catch (error) {
    console.error("❌ Error rejecting bank change request:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في رفض الطلب",
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

// =====================================================
// ========================================
// PLATFORM SETTINGS ENDPOINTS
// ========================================

/**
 * GET /api/platform/bank-info
 * Get UGC Maroc bank details for deposits (PUBLIC)
 */
app.get("/api/platform/bank-info", async (req, res) => {
  try {
    // Get platform settings (should only be 1 row)
    const [settings] = await db.select().from(platformSettings).limit(1);

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "معلومات البنك غير متوفرة حالياً"
      });
    }

    res.json({
      success: true,
      data: {
        bank_name: settings.bank_name,
        account_holder: settings.account_holder,
        rib: settings.rib,
        swift: settings.swift,
        iban: settings.iban,
        bank_address: settings.bank_address,
        special_instructions: settings.special_instructions,
        updated_at: settings.updated_at
      }
    });
  } catch (error) {
    console.error("❌ Error fetching bank info:", error);
    res.status(500).json({
      success: false,
      message: "خطأ في جلب معلومات البنك"
    });
  }
});

/**
 * PUT /api/platform/bank-info
 * Update UGC Maroc bank details (ADMIN ONLY)
 */
app.put("/api/platform/bank-info", authMiddleware, async (req, res) => {
  try {
    const adminId = req.user.id;
    const { bank_name, account_holder, rib, swift, iban, bank_address, special_instructions } = req.body;

    // Admin role check
    const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || '').split(',').filter(id => id);
    if (!ADMIN_USER_IDS.includes(adminId)) {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك بتعديل إعدادات المنصة (إداريون فقط)"
      });
    }

    // Validate required fields
    if (!bank_name || !account_holder || !rib) {
      return res.status(400).json({
        success: false,
        message: "يجب إدخال اسم البنك، صاحب الحساب، والRIB"
      });
    }

    // Check if settings exist
    const [existingSettings] = await db.select().from(platformSettings).limit(1);

    let updatedSettings;
    if (existingSettings) {
      // Update existing settings
      [updatedSettings] = await db.update(platformSettings)
        .set({
          bank_name,
          account_holder,
          rib,
          swift,
          iban,
          bank_address,
          special_instructions,
          updated_at: new Date(),
          updated_by: adminId
        })
        .where(eq(platformSettings.id, existingSettings.id))
        .returning();
    } else {
      // Insert new settings (first time)
      [updatedSettings] = await db.insert(platformSettings)
        .values({
          bank_name,
          account_holder,
          rib,
          swift,
          iban,
          bank_address,
          special_instructions,
          updated_by: adminId
        })
        .returning();
    }

    console.log(`✅ Platform bank info updated by admin ${adminId}`);

    res.json({
      success: true,
      message: "تم تحديث معلومات البنك بنجاح",
      data: updatedSettings
    });
  } catch (error) {
    console.error("❌ Error updating bank info:", error);
    res.status(500).json({
      success: false,
      message: "خطأ في تحديث معلومات البنك"
    });
  }
});

// ========================================
// 💬 MESSAGING & CONVERSATIONS ENDPOINTS
// ========================================

// GET /api/conversations/:user_id - Get all conversations for a user
app.get("/api/conversations/:user_id", authMiddleware, async (req, res) => {
  try {
    const { user_id } = req.params;

    // SECURITY: Verify requester is accessing their own conversations
    if (req.user.id !== user_id) {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك بالوصول إلى محادثات مستخدم آخر"
      });
    }

    // Get all conversations where user is brand or creator
    const userConversations = await db
      .select({
        id: conversations.id,
        agreement_id: conversations.agreement_id,
        brand_id: conversations.brand_id,
        creator_id: conversations.creator_id,
        campaign_id: conversations.campaign_id,
        last_message: conversations.last_message,
        last_message_at: conversations.last_message_at,
        brand_unread_count: conversations.brand_unread_count,
        creator_unread_count: conversations.creator_unread_count,
        is_active: conversations.is_active,
        created_at: conversations.created_at,
        campaign_title: campaigns.title,
        brand_name: sql`brand_profile.full_name`,
        creator_name: sql`creator_profile.full_name`,
      })
      .from(conversations)
      .leftJoin(campaigns, eq(conversations.campaign_id, campaigns.id))
      .leftJoin(profiles.as('brand_profile'), eq(conversations.brand_id, sql`brand_profile.id`))
      .leftJoin(profiles.as('creator_profile'), eq(conversations.creator_id, sql`creator_profile.id`))
      .where(
        sql`${conversations.brand_id} = ${user_id} OR ${conversations.creator_id} = ${user_id}`
      )
      .orderBy(desc(conversations.last_message_at));

    res.json({
      success: true,
      conversations: userConversations
    });
  } catch (error) {
    console.error("❌ Error fetching conversations:", error);
    res.status(500).json({
      success: false,
      message: "خطأ في جلب المحادثات"
    });
  }
});

// GET /api/conversations/:conversation_id/messages - Get all messages in a conversation
app.get("/api/conversations/:conversation_id/messages", authMiddleware, async (req, res) => {
  try {
    const { conversation_id } = req.params;

    // SECURITY: Verify user is participant of this conversation
    const [messagesConversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, parseInt(conversation_id)));

    if (!messagesConversation) {
      return res.status(404).json({
        success: false,
        message: "المحادثة غير موجودة"
      });
    }

    if (messagesConversation.brand_id !== req.user.id && messagesConversation.creator_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك بالوصول إلى هذه المحادثة"
      });
    }

    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversation_id, parseInt(conversation_id)))
      .orderBy(messages.created_at);

    res.json({
      success: true,
      messages: conversationMessages
    });
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    res.status(500).json({
      success: false,
      message: "خطأ في جلب الرسائل"
    });
  }
});

// POST /api/conversations/:conversation_id/messages - Send a message
app.post("/api/conversations/:conversation_id/messages", authMiddleware, async (req, res) => {
  try {
    const { conversation_id } = req.params;
    const { sender_id, message: messageText, message_type = "text", metadata } = req.body;

    // SECURITY: Verify sender_id matches authenticated user
    if (sender_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك بإرسال رسائل بهوية مستخدم آخر"
      });
    }

    // SECURITY: Verify user is participant of this conversation
    const [targetConversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, parseInt(conversation_id)));

    if (!targetConversation) {
      return res.status(404).json({
        success: false,
        message: "المحادثة غير موجودة"
      });
    }

    if (targetConversation.brand_id !== req.user.id && targetConversation.creator_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك بإرسال رسائل في هذه المحادثة"
      });
    }

    // Insert the message
    const [newMessage] = await db.insert(messages)
      .values({
        conversation_id: parseInt(conversation_id),
        sender_id,
        message: messageText,
        message_type,
        metadata: metadata ? JSON.stringify(metadata) : null,
        is_read: false,
        created_at: new Date()
      })
      .returning();

    // Update conversation last_message and timestamp
    await db.update(conversations)
      .set({
        last_message: messageText,
        last_message_at: new Date(),
        updated_at: new Date()
      })
      .where(eq(conversations.id, parseInt(conversation_id)));

    // Increment unread count for the other party
    if (sender_id === targetConversation.brand_id) {
      // Brand sent message, increment creator unread
      await db.update(conversations)
        .set({
          creator_unread_count: sql`${conversations.creator_unread_count} + 1`
        })
        .where(eq(conversations.id, parseInt(conversation_id)));
    } else {
      // Creator sent message, increment brand unread
      await db.update(conversations)
        .set({
          brand_unread_count: sql`${conversations.brand_unread_count} + 1`
        })
        .where(eq(conversations.id, parseInt(conversation_id)));
    }

    res.json({
      success: true,
      message: newMessage
    });
  } catch (error) {
    console.error("❌ Error sending message:", error);
    res.status(500).json({
      success: false,
      message: "خطأ في إرسال الرسالة"
    });
  }
});

// PUT /api/conversations/:conversation_id/mark-read - Mark messages as read
app.put("/api/conversations/:conversation_id/mark-read", authMiddleware, async (req, res) => {
  try {
    const { conversation_id } = req.params;
    const { user_id } = req.body;

    // SECURITY: Verify user_id matches authenticated user
    if (user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك بتحديث رسائل مستخدم آخر"
      });
    }

    // SECURITY: Verify user is participant of this conversation
    const [markReadConversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, parseInt(conversation_id)));

    if (!markReadConversation) {
      return res.status(404).json({
        success: false,
        message: "المحادثة غير موجودة"
      });
    }

    if (markReadConversation.brand_id !== req.user.id && markReadConversation.creator_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك بالوصول إلى هذه المحادثة"
      });
    }

    // Mark all messages as read for this user
    await db.update(messages)
      .set({ is_read: true })
      .where(
        and(
          eq(messages.conversation_id, parseInt(conversation_id)),
          sql`${messages.sender_id} != ${user_id}`
        )
      );

    // Reset unread count for this user
    if (user_id === markReadConversation.brand_id) {
      await db.update(conversations)
        .set({ brand_unread_count: 0 })
        .where(eq(conversations.id, parseInt(conversation_id)));
    } else {
      await db.update(conversations)
        .set({ creator_unread_count: 0 })
        .where(eq(conversations.id, parseInt(conversation_id)));
    }

    res.json({
      success: true,
      message: "تم تحديث الرسائل كمقروءة"
    });
  } catch (error) {
    console.error("❌ Error marking messages as read:", error);
    res.status(500).json({
      success: false,
      message: "خطأ في تحديث الرسائل"
    });
  }
});

// POST /api/conversations/:conversation_id/upload - Upload file attachment to conversation
app.post("/api/conversations/:conversation_id/upload", authMiddleware, uploadChatFile.single('file'), async (req, res) => {
  try {
    const { conversation_id } = req.params;
    const { sender_id, message_text } = req.body;

    // SECURITY: Verify sender_id matches authenticated user
    if (sender_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك بإرسال ملفات بهوية مستخدم آخر"
      });
    }

    // SECURITY: Verify user is participant of this conversation
    const [uploadConversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, parseInt(conversation_id)));

    if (!uploadConversation) {
      return res.status(404).json({
        success: false,
        message: "المحادثة غير موجودة"
      });
    }

    if (uploadConversation.brand_id !== req.user.id && uploadConversation.creator_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك بإرسال ملفات في هذه المحادثة"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "لم يتم إرفاق ملف"
      });
    }

    // Enforce type-specific file size limits
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024; // 20MB
    const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

    if (req.file.mimetype.startsWith('image/') && req.file.size > MAX_IMAGE_SIZE) {
      // Delete uploaded file
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({
        success: false,
        message: "حجم الصورة كبير جداً. الحد الأقصى 10 ميغابايت"
      });
    }

    if (req.file.mimetype.startsWith('video/') && req.file.size > MAX_VIDEO_SIZE) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({
        success: false,
        message: "حجم الفيديو كبير جداً. الحد الأقصى 50 ميغابايت"
      });
    }

    if (!req.file.mimetype.startsWith('image/') && !req.file.mimetype.startsWith('video/') && req.file.size > MAX_DOCUMENT_SIZE) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({
        success: false,
        message: "حجم المستند كبير جداً. الحد الأقصى 20 ميغابايت"
      });
    }

    // Determine message type based on file mimetype
    let messageType = 'file';
    if (req.file.mimetype.startsWith('image/')) {
      messageType = 'image';
    } else if (req.file.mimetype.startsWith('video/')) {
      messageType = 'video';
    }

    // Build file URL (publicly accessible)
    const fileUrl = `/uploads/chat/${req.file.filename}`;

    // Create metadata object
    const metadata = {
      filename: req.file.originalname,
      fileUrl: fileUrl,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    };

    // Insert the message with file attachment
    const [newMessage] = await db.insert(messages)
      .values({
        conversation_id: parseInt(conversation_id),
        sender_id,
        message: message_text || `📎 ${req.file.originalname}`,
        message_type: messageType,
        metadata: JSON.stringify(metadata),
        is_read: false,
        created_at: new Date()
      })
      .returning();

    // Update conversation last_message and timestamp
    const lastMessageText = message_text || `📎 ${req.file.originalname}`;
    await db.update(conversations)
      .set({
        last_message: lastMessageText,
        last_message_at: new Date(),
        updated_at: new Date()
      })
      .where(eq(conversations.id, parseInt(conversation_id)));

    // Increment unread count for the other party
    if (sender_id === uploadConversation.brand_id) {
      await db.update(conversations)
        .set({
          creator_unread_count: sql`${conversations.creator_unread_count} + 1`
        })
        .where(eq(conversations.id, parseInt(conversation_id)));
    } else {
      await db.update(conversations)
        .set({
          brand_unread_count: sql`${conversations.brand_unread_count} + 1`
        })
        .where(eq(conversations.id, parseInt(conversation_id)));
    }

    // Broadcast via Socket.IO
    const roomName = `conversation_${conversation_id}`;
    io.to(roomName).emit("new_message", {
      id: newMessage.id,
      conversation_id: newMessage.conversation_id,
      sender_id: newMessage.sender_id,
      message: newMessage.message,
      message_type: newMessage.message_type,
      metadata: metadata,
      is_read: newMessage.is_read,
      created_at: newMessage.created_at
    });

    console.log(`📎 File uploaded in conversation ${conversation_id}: ${req.file.originalname}`);

    res.json({
      success: true,
      message: newMessage,
      fileUrl: fileUrl
    });
  } catch (error) {
    console.error("❌ Error uploading file:", error);
    res.status(500).json({
      success: false,
      message: "خطأ في رفع الملف"
    });
  }
});

// ========================================
// 💬 SOCKET.IO - REAL-TIME NEGOTIATION
// ========================================

io.on("connection", (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Join negotiation room for specific agreement
  socket.on("join_negotiation", async ({ agreement_id, user_id }) => {
    const roomName = `agreement_${agreement_id}`;
    socket.join(roomName);
    console.log(`👥 User ${user_id} joined negotiation room: ${roomName}`);
    
    // Notify room
    socket.to(roomName).emit("user_joined", { user_id, timestamp: new Date() });
  });

  // Leave negotiation room
  socket.on("leave_negotiation", ({ agreement_id, user_id }) => {
    const roomName = `agreement_${agreement_id}`;
    socket.leave(roomName);
    console.log(`👋 User ${user_id} left negotiation room: ${roomName}`);
  });

  // Send negotiation message
  socket.on("send_message", async ({ conversation_id, sender_id, message_text }) => {
    try {
      const roomName = `conversation_${conversation_id}`;
      
      // Get conversation details
      const [socketConversation] = await db.select()
        .from(conversations)
        .where(eq(conversations.id, parseInt(conversation_id)));

      if (!socketConversation) {
        socket.emit("message_error", { error: "المحادثة غير موجودة" });
        return;
      }

      // Save message to database
      const [newMessage] = await db.insert(messages)
        .values({
          conversation_id: parseInt(conversation_id),
          sender_id: sender_id,
          message: message_text,
          message_type: 'text',
          is_read: false,
          created_at: new Date()
        })
        .returning();

      // Update conversation last_message and increment unread count
      await db.update(conversations)
        .set({
          last_message: message_text,
          last_message_at: new Date(),
          updated_at: new Date()
        })
        .where(eq(conversations.id, parseInt(conversation_id)));

      // Increment unread count for recipient
      if (sender_id === socketConversation.brand_id) {
        await db.update(conversations)
          .set({ creator_unread_count: sql`${conversations.creator_unread_count} + 1` })
          .where(eq(conversations.id, parseInt(conversation_id)));
      } else {
        await db.update(conversations)
          .set({ brand_unread_count: sql`${conversations.brand_unread_count} + 1` })
          .where(eq(conversations.id, parseInt(conversation_id)));
      }

      // Broadcast to room (including sender for confirmation)
      io.to(roomName).emit("new_message", {
        id: newMessage.id,
        conversation_id: newMessage.conversation_id,
        sender_id: newMessage.sender_id,
        message: newMessage.message,
        message_type: newMessage.message_type,
        is_read: newMessage.is_read,
        created_at: newMessage.created_at
      });

      console.log(`💬 Message sent in room ${roomName} by ${sender_id}`);
    } catch (error) {
      console.error("❌ Error sending message:", error);
      socket.emit("message_error", { error: error.message });
    }
  });

  // Counter offer notification
  socket.on("counter_offer", ({ agreement_id, sender_id, new_price }) => {
    const roomName = `agreement_${agreement_id}`;
    socket.to(roomName).emit("counter_offer_received", {
      agreement_id,
      sender_id,
      new_price,
      timestamp: new Date()
    });
    console.log(`💰 Counter offer in room ${roomName}: ${new_price} MAD`);
  });

  // Typing indicator
  socket.on("typing", ({ agreement_id, user_id, is_typing }) => {
    const roomName = `agreement_${agreement_id}`;
    socket.to(roomName).emit("user_typing", {
      user_id,
      is_typing,
      timestamp: new Date()
    });
  });

  socket.on("disconnect", () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
  });
});

// Start server on port 5000 for Replit
const PORT = 5000;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
  console.log(`📡 API endpoints available at /api/*`);
  console.log(`🎬 Video upload endpoint: POST /api/upload-video`);
  console.log(`💬 Socket.IO negotiation enabled`);
});
