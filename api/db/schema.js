import { pgTable, serial, varchar, text, timestamp, integer, boolean, decimal } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * UGC Maroc - Complete Database Schema
 * Tables: profiles, creators, brands, wallets, campaigns, submissions, transactions
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
export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  user_id: varchar("user_id").notNull().unique().references(() => profiles.id, { onDelete: "cascade" }),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0.00").notNull(),
  pending_balance: decimal("pending_balance", { precision: 10, scale: 2 }).default("0.00").notNull(),
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
  budget: decimal("budget", { precision: 10, scale: 2 }), // Optional total budget
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

// ===== SUBMISSIONS TABLE =====
// Creator submissions for campaigns
export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  campaign_id: integer("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  creator_id: varchar("creator_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
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
  type: varchar("type").notNull(), // 'deposit', 'withdrawal', 'payment', 'refund', 'earning'
  status: varchar("status").default("pending").notNull(), // 'pending', 'completed', 'failed', 'cancelled'
  description: text("description"),
  related_campaign_id: integer("related_campaign_id").references(() => campaigns.id),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// ===== ESCROW TRANSACTIONS TABLE =====
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

// ===== CREATOR EARNINGS TABLE =====
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
