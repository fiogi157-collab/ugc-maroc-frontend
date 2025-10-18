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
  budget: decimal("budget", { precision: 10, scale: 2 }).notNull(),
  content_type: varchar("content_type").notNull(), // 'video', 'image', 'story', etc.
  video_duration: integer("video_duration"), // in seconds
  deadline: timestamp("deadline").notNull(),
  status: varchar("status").default("active").notNull(), // 'draft', 'active', 'completed', 'cancelled'
  category: varchar("category").default("other"), // 'beauty', 'fashion', 'tech', 'food', 'travel', 'other'
  difficulty: varchar("difficulty").default("intermediate"), // 'beginner', 'intermediate', 'expert'
  requirements: text("requirements"),
  target_audience: text("target_audience"),
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
