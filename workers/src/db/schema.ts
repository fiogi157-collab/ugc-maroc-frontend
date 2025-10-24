import { sqliteTable, text, integer, real, blob } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

/**
 * UGC Maroc - SQLite Schema for Cloudflare D1
 * Adapted from PostgreSQL schema
 */

// ===== PROFILES TABLE =====
export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(), // UUID string
  email: text('email').notNull().unique(),
  full_name: text('full_name').notNull(),
  role: text('role').notNull(), // 'creator' | 'brand' | 'admin'
  avatar_url: text('avatar_url'),
  phone: text('phone'),
  bio: text('bio'),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
})

// ===== CREATORS TABLE =====
export const creators = sqliteTable('creators', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: text('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  specialization: text('specialization'), // 'fashion', 'tech', 'food', etc.
  portfolio_url: text('portfolio_url'),
  instagram_handle: text('instagram_handle'),
  tiktok_handle: text('tiktok_handle'),
  youtube_handle: text('youtube_handle'),
  followers_count: integer('followers_count').default(0),
  rating: real('rating').default(0.0),
  completed_campaigns: integer('completed_campaigns').default(0),
  is_verified: integer('is_verified', { mode: 'boolean' }).default(false),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
})

// ===== BRANDS TABLE =====
export const brands = sqliteTable('brands', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: text('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  company_name: text('company_name').notNull(),
  industry: text('industry'),
  website: text('website'),
  logo_url: text('logo_url'),
  description: text('description'),
  total_campaigns: integer('total_campaigns').default(0),
  is_verified: integer('is_verified', { mode: 'boolean' }).default(false),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
})

// ===== WALLETS TABLE =====
export const wallets = sqliteTable('wallets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: text('user_id').notNull().unique().references(() => profiles.id, { onDelete: 'cascade' }),
  balance: real('balance').default(0.0).notNull(),
  pending_balance: real('pending_balance').default(0.0).notNull(),
  currency: text('currency').default('MAD').notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
})

// ===== CAMPAIGNS TABLE =====
export const campaigns = sqliteTable('campaigns', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  brand_id: text('brand_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  budget: real('budget'),
  price_per_ugc: real('price_per_ugc'),
  content_type: text('content_type'), // JSON string
  video_duration: integer('video_duration'),
  start_date: integer('start_date', { mode: 'timestamp' }),
  deadline: integer('deadline', { mode: 'timestamp' }),
  status: text('status').default('active').notNull(),
  category: text('category').default('other'),
  difficulty: text('difficulty').default('intermediate'),
  requirements: text('requirements'),
  target_audience: text('target_audience'),
  language: text('language'),
  platforms: text('platforms'), // JSON string
  product_name: text('product_name'),
  product_link: text('product_link'),
  delivery_method: text('delivery_method'),
  media_files: text('media_files'), // JSON string
  additional_notes: text('additional_notes'),
  max_creators: integer('max_creators').default(10),
  current_creators: integer('current_creators').default(0),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
})

// ===== CAMPAIGN AGREEMENTS TABLE =====
export const campaignAgreements = sqliteTable('campaign_agreements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  campaign_id: integer('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  brand_id: text('brand_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  creator_id: text('creator_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  price_offered: real('price_offered'),
  final_price: real('final_price'),
  deadline: integer('deadline', { mode: 'timestamp' }),
  status: text('status').default('pending').notNull(),
  invitation_type: text('invitation_type').notNull(),
  custom_terms: text('custom_terms'),
  custom_clauses: text('custom_clauses'),
  template_clauses: text('template_clauses'), // JSON string
  application_message: text('application_message'),
  portfolio_links: text('portfolio_links'), // JSON string
  delivery_days: integer('delivery_days'),
  additional_notes: text('additional_notes'),
  portfolio_files: text('portfolio_files'), // JSON string
  payment_status: text('payment_status').default('PENDING').notNull(),
  revision_count: integer('revision_count').default(0),
  max_revisions: integer('max_revisions').default(2),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  finalized_at: integer('finalized_at', { mode: 'timestamp' }),
  expires_at: integer('expires_at', { mode: 'timestamp' }),
})

// ===== SUBMISSIONS TABLE =====
export const submissions = sqliteTable('submissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  campaign_id: integer('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  creator_id: text('creator_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  agreement_id: integer('agreement_id').references(() => campaignAgreements.id, { onDelete: 'set null' }),
  video_url: text('video_url').notNull(),
  r2_key: text('r2_key').notNull(),
  file_size: integer('file_size'),
  status: text('status').default('pending').notNull(),
  feedback: text('feedback'),
  submitted_at: integer('submitted_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  reviewed_at: integer('reviewed_at', { mode: 'timestamp' }),
})

// ===== ORDERS TABLE =====
export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  agreement_id: integer('agreement_id').notNull().references(() => campaignAgreements.id, { onDelete: 'cascade' }),
  brand_id: text('brand_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  creator_id: text('creator_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull(),
  currency: text('currency').default('MAD').notNull(),
  status: text('status').default('pending').notNull(),
  stripe_payment_intent_id: text('stripe_payment_intent_id'),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
})

// ===== PAYMENTS TABLE =====
export const payments = sqliteTable('payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  order_id: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  stripe_payment_intent_id: text('stripe_payment_intent_id').notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').notNull(),
  status: text('status').notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
})

// ===== CONVERSATIONS TABLE =====
export const conversations = sqliteTable('conversations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  agreement_id: integer('agreement_id').notNull().references(() => campaignAgreements.id, { onDelete: 'cascade' }),
  brand_id: text('brand_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  creator_id: text('creator_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  last_message_at: integer('last_message_at', { mode: 'timestamp' }),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
})

// ===== MESSAGES TABLE =====
export const messages = sqliteTable('messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  conversation_id: integer('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  sender_id: text('sender_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  message_type: text('message_type').default('text').notNull(),
  is_read: integer('is_read', { mode: 'boolean' }).default(false),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
})

// ===== GIGS TABLE =====
export const gigs = sqliteTable('gigs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  creator_id: text('creator_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  price: real('price').notNull(),
  category: text('category').notNull(),
  tags: text('tags'), // JSON string
  portfolio_urls: text('portfolio_urls'), // JSON string
  is_active: integer('is_active', { mode: 'boolean' }).default(true),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
})

// ===== NEGOTIATIONS TABLE =====
export const negotiations = sqliteTable('negotiations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  gig_id: integer('gig_id').notNull().references(() => gigs.id, { onDelete: 'cascade' }),
  brand_id: text('brand_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  creator_id: text('creator_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  status: text('status').default('pending').notNull(),
  proposed_price: real('proposed_price'),
  proposed_deadline: integer('proposed_deadline', { mode: 'timestamp' }),
  message: text('message'),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
})

// ===== CONTRACTS TABLE =====
export const contracts = sqliteTable('contracts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  negotiation_id: integer('negotiation_id').notNull().references(() => negotiations.id, { onDelete: 'cascade' }),
  brand_id: text('brand_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  creator_id: text('creator_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  terms: text('terms').notNull(), // JSON string
  status: text('status').default('draft').notNull(),
  signed_at: integer('signed_at', { mode: 'timestamp' }),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
})

// Export all tables for Drizzle
export const schema = {
  profiles,
  creators,
  brands,
  wallets,
  campaigns,
  campaignAgreements,
  submissions,
  orders,
  payments,
  conversations,
  messages,
  gigs,
  negotiations,
  contracts,
}
