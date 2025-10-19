import { pgTable, serial, varchar, text, timestamp, integer, boolean, decimal } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * UGC Maroc - Complete Database Schema
 * NEW SYSTEM: Agreement-based payments with virtual reservations
 */

// ===== PROFILES TABLE =====
// Main user profiles (linked to Supabase auth.users via UUID)
export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey(), // Supabase auth.users.id (UUID) - unique identifier
  email: varchar("email").notNull().unique(),
  full_name: varchar("full_name").notNull(),
  role: varchar("role").notNull(), // 'creator' | 'brand' | 'admin'
  avatar_url: text("avatar_url"),
  phone: varchar("phone"),
  bio: text("bio"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// ===== CREATORS TABLE =====
// Extended info for content creators
export const creators = pgTable("creators", {
  id: serial("id").primaryKey(),
  user_id: varchar("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  specialization: varchar("specialization"), // 'fashion', 'tech', 'food', etc.
  portfolio_url: text("portfolio_url"),
  instagram_handle: varchar("instagram_handle"),
  tiktok_handle: varchar("tiktok_handle"),
  youtube_handle: varchar("youtube_handle"),
  followers_count: integer("followers_count").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  completed_campaigns: integer("completed_campaigns").default(0),
  is_verified: boolean("is_verified").default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// ===== BRANDS TABLE =====
// Extended info for brands/companies
export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  user_id: varchar("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  company_name: varchar("company_name").notNull(),
  industry: varchar("industry"),
  website: text("website"),
  logo_url: text("logo_url"),
  description: text("description"),
  total_campaigns: integer("total_campaigns").default(0),
  is_verified: boolean("is_verified").default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// ===== WALLETS TABLE =====
// Financial wallets for creators and brands
// Note: balance = total, pending_balance = reserved for invitations
export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  user_id: varchar("user_id").notNull().unique().references(() => profiles.id, { onDelete: "cascade" }),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0.00").notNull(),
  pending_balance: decimal("pending_balance", { precision: 10, scale: 2 }).default("0.00").notNull(), // Reserved for invitations
  currency: varchar("currency").default("MAD").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// ===== CAMPAIGNS TABLE =====
// Marketing campaigns created by brands
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  brand_id: varchar("brand_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  budget: decimal("budget", { precision: 10, scale: 2 }), // Optional - deprecated in favor of agreements
  price_per_ugc: decimal("price_per_ugc", { precision: 10, scale: 2 }), // Price per UGC content
  content_type: text("content_type"), // JSON array: ['video', 'image', 'story', 'reel']
  video_duration: integer("video_duration"), // in seconds
  start_date: timestamp("start_date"), // Optional campaign start
  deadline: timestamp("deadline"), // Optional campaign end
  status: varchar("status").default("active").notNull(), // 'draft', 'active', 'completed', 'cancelled'
  category: varchar("category").default("other"), // 'beauty', 'fashion', 'tech', 'food', 'travel', 'other'
  difficulty: varchar("difficulty").default("intermediate"), // 'beginner', 'intermediate', 'expert'
  requirements: text("requirements"),
  target_audience: text("target_audience"),
  language: varchar("language"), // 'arabic', 'french', 'darija', 'english'
  platforms: text("platforms"), // JSON array: ['instagram', 'tiktok', 'youtube', 'facebook']
  product_name: varchar("product_name"), // Name of product/service
  product_link: text("product_link"), // Link to product/website
  delivery_method: varchar("delivery_method"), // 'free_delivery', 'pickup', 'no_product'
  media_files: text("media_files"), // JSON array of R2 URLs for product images/videos
  additional_notes: text("additional_notes"), // Optional notes/requirements from brand
  max_creators: integer("max_creators").default(10),
  current_creators: integer("current_creators").default(0),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// ===== CAMPAIGN AGREEMENTS TABLE =====
// Individual agreements between brand and creator (NEW CORE SYSTEM)
export const campaignAgreements = pgTable("campaign_agreements", {
  id: serial("id").primaryKey(),
  campaign_id: integer("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  brand_id: varchar("brand_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  creator_id: varchar("creator_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  price_offered: decimal("price_offered", { precision: 10, scale: 2 }), // Initially offered price
  final_price: decimal("final_price", { precision: 10, scale: 2 }), // Final negotiated price
  deadline: timestamp("deadline"), // Delivery deadline (optional)
  status: varchar("status").default("pending").notNull(), // 'pending', 'invited', 'negotiating', 'active', 'completed', 'rejected', 'expired', 'disputed', 'dispute_resolved'
  invitation_type: varchar("invitation_type").notNull(), // 'brand_invite' | 'creator_application'
  custom_terms: text("custom_terms"), // Message/terms from creator or brand
  custom_clauses: text("custom_clauses"), // Custom contract conditions
  template_clauses: text("template_clauses"), // JSON array of selected template clauses
  // Detailed application fields for creator applications
  application_message: text("application_message"), // Motivation message from creator
  portfolio_links: text("portfolio_links"), // JSON array of portfolio URLs
  delivery_days: integer("delivery_days"), // Proposed delivery time in days
  additional_notes: text("additional_notes"), // Additional notes from creator
  portfolio_files: text("portfolio_files"), // JSON array of uploaded portfolio file URLs
  submission_id: integer("submission_id").references(() => submissions.id, { onDelete: "set null" }),
  revision_count: integer("revision_count").default(0),
  max_revisions: integer("max_revisions").default(2),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  finalized_at: timestamp("finalized_at"),
  expires_at: timestamp("expires_at"), // For pending invitations (48h)
});

// ===== WALLET RESERVATIONS TABLE =====
// Virtual reservations when brand sends invitation (NEW)
export const walletReservations = pgTable("wallet_reservations", {
  id: serial("id").primaryKey(),
  user_id: varchar("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  agreement_id: integer("agreement_id").notNull().unique().references(() => campaignAgreements.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status").default("active").notNull(), // 'active', 'converted_to_escrow', 'cancelled', 'expired'
  created_at: timestamp("created_at").defaultNow().notNull(),
  expires_at: timestamp("expires_at").notNull(), // 48h from creation
  cancelled_at: timestamp("cancelled_at"),
});

// ===== NEGOTIATION MESSAGES TABLE =====
// Real-time chat between brand and creator (NEW)
export const negotiationMessages = pgTable("negotiation_messages", {
  id: serial("id").primaryKey(),
  agreement_id: integer("agreement_id").notNull().references(() => campaignAgreements.id, { onDelete: "cascade" }),
  sender_id: varchar("sender_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  message_type: varchar("message_type").default("text").notNull(), // 'text', 'price_offer', 'deadline_change', 'clause_modification'
  metadata: text("metadata"), // JSON for structured offers (price, deadline, etc.)
  is_read: boolean("is_read").default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// ===== DISPUTE CASES TABLE =====
// Disputes opened by either party (NEW)
export const disputeCases = pgTable("dispute_cases", {
  id: serial("id").primaryKey(),
  agreement_id: integer("agreement_id").notNull().unique().references(() => campaignAgreements.id, { onDelete: "cascade" }),
  opened_by: varchar("opened_by").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  proofs: text("proofs"), // JSON array of evidence URLs
  status: varchar("status").default("open").notNull(), // 'open', 'under_review', 'resolved'
  admin_decision: varchar("admin_decision"), // 'favor_creator', 'favor_brand', 'split_50_50'
  admin_notes: text("admin_notes"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  resolved_at: timestamp("resolved_at"),
});

// ===== RATINGS TABLE =====
// Mutual ratings after agreement completion (NEW)
export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  agreement_id: integer("agreement_id").notNull().references(() => campaignAgreements.id, { onDelete: "cascade" }),
  from_user: varchar("from_user").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  to_user: varchar("to_user").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  score: integer("score").notNull(), // 1-5 stars
  comment: text("comment"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// ===== SUBMISSIONS TABLE =====
// Creator submissions (now linked to agreements)
export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  campaign_id: integer("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  creator_id: varchar("creator_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  agreement_id: integer("agreement_id").references(() => campaignAgreements.id, { onDelete: "set null" }), // NEW: Link to agreement
  video_url: text("video_url").notNull(), // Cloudflare R2 URL
  r2_key: text("r2_key").notNull(), // R2 storage key
  file_size: integer("file_size"), // bytes
  status: varchar("status").default("pending").notNull(), // 'pending', 'approved', 'rejected', 'revision_requested'
  feedback: text("feedback"),
  submitted_at: timestamp("submitted_at").defaultNow().notNull(),
  reviewed_at: timestamp("reviewed_at"),
});

// ===== TRANSACTIONS TABLE =====
// Financial transactions history
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  user_id: varchar("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: varchar("type").notNull(), // 'deposit', 'withdrawal', 'payment', 'refund', 'earning', 'reservation', 'escrow'
  status: varchar("status").default("pending").notNull(), // 'pending', 'completed', 'failed', 'cancelled'
  description: text("description"),
  related_campaign_id: integer("related_campaign_id").references(() => campaigns.id),
  related_agreement_id: integer("related_agreement_id").references(() => campaignAgreements.id), // NEW
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// ===== ESCROW TRANSACTIONS TABLE (OLD SYSTEM - DEPRECATED) =====
// Escrow funds blocked per campaign (released when UGC validated)
export const escrowTransactions = pgTable("escrow_transactions", {
  id: serial("id").primaryKey(),
  campaign_id: integer("campaign_id").notNull().unique().references(() => campaigns.id, { onDelete: "cascade" }),
  brand_id: varchar("brand_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  creator_id: varchar("creator_id").references(() => profiles.id, { onDelete: "set null" }), // Set when creator assigned
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  remaining_amount: decimal("remaining_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status").default("pending_funds").notNull(), // 'pending_funds', 'under_review', 'released', 'disputed', 'refunded'
  released_at: timestamp("released_at"),
  dispute_reason: text("dispute_reason"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// ===== AGREEMENT ESCROW TABLE (NEW SYSTEM) =====
// Escrow funds blocked per agreement
export const agreementEscrow = pgTable("agreement_escrow", {
  id: serial("id").primaryKey(),
  agreement_id: integer("agreement_id").notNull().unique().references(() => campaignAgreements.id, { onDelete: "cascade" }),
  brand_id: varchar("brand_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  creator_id: varchar("creator_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status").default("active").notNull(), // 'active', 'released', 'disputed', 'refunded'
  released_at: timestamp("released_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// ===== CREATOR EARNINGS TABLE (OLD SYSTEM - DEPRECATED) =====
// Track earnings per UGC submission (after validation)
export const creatorEarnings = pgTable("creator_earnings", {
  id: serial("id").primaryKey(),
  creator_id: varchar("creator_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  campaign_id: integer("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  submission_id: integer("submission_id").notNull().unique().references(() => submissions.id, { onDelete: "cascade" }),
  gross_amount: decimal("gross_amount", { precision: 10, scale: 2 }).notNull(), // Original payment
  platform_fee: decimal("platform_fee", { precision: 10, scale: 2 }).notNull(), // 15% commission
  net_amount: decimal("net_amount", { precision: 10, scale: 2 }).notNull(), // After commission
  status: varchar("status").default("pending").notNull(), // 'pending', 'available', 'withdrawn'
  earned_at: timestamp("earned_at").defaultNow().notNull(),
});

// ===== AGREEMENT EARNINGS TABLE (NEW SYSTEM) =====
// Track earnings per agreement (after validation)
export const agreementEarnings = pgTable("agreement_earnings", {
  id: serial("id").primaryKey(),
  creator_id: varchar("creator_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  agreement_id: integer("agreement_id").notNull().unique().references(() => campaignAgreements.id, { onDelete: "cascade" }),
  submission_id: integer("submission_id").references(() => submissions.id, { onDelete: "cascade" }), // Nullable for dispute resolutions
  bank_detail_id: integer("bank_detail_id").notNull().references(() => creatorBankDetails.id, { onDelete: "restrict" }), // RIB used for this payment (immutable link)
  gross_amount: decimal("gross_amount", { precision: 10, scale: 2 }).notNull(), // Original payment
  platform_fee: decimal("platform_fee", { precision: 10, scale: 2 }).notNull(), // 15% commission
  net_amount: decimal("net_amount", { precision: 10, scale: 2 }).notNull(), // After commission
  status: varchar("status").default("pending").notNull(), // 'pending', 'available', 'withdrawn'
  earned_at: timestamp("earned_at").defaultNow().notNull(),
});

// ===== CREATOR WITHDRAWALS TABLE =====
// Withdrawal requests from creators (manual bank transfer)
export const creatorWithdrawals = pgTable("creator_withdrawals", {
  id: serial("id").primaryKey(),
  creator_id: varchar("creator_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Requested amount
  platform_fee: decimal("platform_fee", { precision: 10, scale: 2 }).notNull(), // 15% on total earnings
  bank_fee: decimal("bank_fee", { precision: 10, scale: 2 }).default("17.00").notNull(), // Fixed 17 MAD
  net_amount: decimal("net_amount", { precision: 10, scale: 2 }).notNull(), // Final amount to transfer
  status: varchar("status").default("pending").notNull(), // 'pending', 'approved', 'processing', 'completed', 'rejected', 'cancelled'
  bank_name: varchar("bank_name"),
  rib: varchar("rib"), // Moroccan bank account (RIB)
  account_holder: varchar("account_holder"),
  rejection_reason: text("rejection_reason"),
  admin_notes: text("admin_notes"),
  requested_at: timestamp("requested_at").defaultNow().notNull(),
  approved_at: timestamp("approved_at"),
  completed_at: timestamp("completed_at"),
});

// ===== CREATOR BANK DETAILS TABLE (NEW) =====
// Secure RIB storage with versioning - IMMUTABLE after creation
export const creatorBankDetails = pgTable("creator_bank_details", {
  id: serial("id").primaryKey(),
  creator_id: varchar("creator_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  iban: varchar("iban").notNull(), // Moroccan IBAN (MA + 24 digits)
  account_holder: varchar("account_holder").notNull(), // Must match creator's legal name
  bank_name: varchar("bank_name").notNull(), // Bank name
  bank_code: varchar("bank_code"), // Optional bank identifier
  status: varchar("status").default("active").notNull(), // 'active' | 'archived' (only one active per creator)
  is_verified: boolean("is_verified").default(false), // Admin verified
  change_reason: text("change_reason"), // Reason for change (null for first RIB)
  replaced_by: integer("replaced_by").references(() => creatorBankDetails.id, { onDelete: "set null" }), // Link to new RIB if replaced
  created_at: timestamp("created_at").defaultNow().notNull(), // When RIB was added
  archived_at: timestamp("archived_at"), // When RIB was replaced
});

// ===== BANK CHANGE REQUESTS TABLE (NEW) =====
// Tickets for requesting RIB change (admin approval required)
export const bankChangeRequests = pgTable("bank_change_requests", {
  id: serial("id").primaryKey(),
  creator_id: varchar("creator_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  current_bank_detail_id: integer("current_bank_detail_id").notNull().references(() => creatorBankDetails.id, { onDelete: "cascade" }),
  new_iban: varchar("new_iban").notNull(), // Requested new IBAN
  new_account_holder: varchar("new_account_holder").notNull(),
  new_bank_name: varchar("new_bank_name").notNull(),
  reason: text("reason").notNull(), // Creator's explanation for change
  supporting_documents: text("supporting_documents"), // JSON array of R2 URLs (CIN, bank statement, etc.)
  status: varchar("status").default("pending").notNull(), // 'pending' | 'approved' | 'rejected'
  admin_notes: text("admin_notes"), // Admin comments on decision
  reviewed_by: varchar("reviewed_by").references(() => profiles.id, { onDelete: "set null" }), // Admin who reviewed
  created_at: timestamp("created_at").defaultNow().notNull(),
  reviewed_at: timestamp("reviewed_at"),
});

// ===== PLATFORM SETTINGS TABLE (NEW) =====
// Platform-wide settings (singleton table - only 1 row)
// Contains UGC Maroc bank details for brand deposits
export const platformSettings = pgTable("platform_settings", {
  id: serial("id").primaryKey(),
  bank_name: varchar("bank_name").notNull(), // e.g., "Attijariwafa Bank"
  account_holder: varchar("account_holder").notNull(), // e.g., "UGC MAROC SARL"
  rib: varchar("rib").notNull(), // Moroccan RIB (24 digits)
  swift: varchar("swift"), // Optional SWIFT/BIC code
  iban: varchar("iban"), // Optional IBAN format
  bank_address: text("bank_address"), // Bank branch address
  special_instructions: text("special_instructions"), // Additional notes for wire transfers
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  updated_by: varchar("updated_by").references(() => profiles.id, { onDelete: "set null" }), // Admin who last updated
});

// ===== CONVERSATIONS TABLE (NEW) =====
// Real-time chat conversations for agreement negotiation
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  agreement_id: integer("agreement_id").notNull().unique().references(() => campaignAgreements.id, { onDelete: "cascade" }), // One conversation per agreement
  brand_id: varchar("brand_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  creator_id: varchar("creator_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  campaign_id: integer("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  last_message: text("last_message"), // Preview of most recent message
  last_message_at: timestamp("last_message_at"), // Timestamp of last message
  brand_unread_count: integer("brand_unread_count").default(0).notNull(), // Unread messages for brand
  creator_unread_count: integer("creator_unread_count").default(0).notNull(), // Unread messages for creator
  is_active: boolean("is_active").default(true).notNull(), // Can be closed when agreement finalized
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// ===== MESSAGES TABLE (NEW) =====
// Individual chat messages within conversations
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversation_id: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  sender_id: varchar("sender_id").notNull().references(() => profiles.id, { onDelete: "cascade" }), // brand_id or creator_id
  message: text("message").notNull(), // Message content
  message_type: varchar("message_type").default("text").notNull(), // 'text' | 'system' | 'offer' | 'file'
  metadata: text("metadata"), // JSON for offers, file URLs, etc.
  is_read: boolean("is_read").default(false).notNull(), // Mark as read when viewed
  created_at: timestamp("created_at").defaultNow().notNull(),
});
