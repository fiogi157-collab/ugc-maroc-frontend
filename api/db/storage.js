import { db } from './client.js';
import { profiles, creators, brands, wallets } from './schema.js';
import { eq } from 'drizzle-orm';

/**
 * UGC Maroc - Database Storage Functions
 * Uses Replit PostgreSQL via Drizzle ORM
 */

// ===== USER PROFILE OPERATIONS =====

/**
 * Create a complete user profile (profile + wallet + creator/brand)
 * @param {object} userData - User data from Supabase Auth
 * @param {object} metadata - Additional metadata (specialization, company info, etc.)
 * @returns {Promise<object>} Created profile
 */
export async function createCompleteProfile(userData, metadata = {}) {
  const { userId, email, fullName, role } = userData;
  
  try {
    // 1. Create profile
    const [profile] = await db.insert(profiles).values({
      id: userId,
      email: email,
      full_name: fullName,
      role: role,
      avatar_url: metadata.profilePictureUrl || metadata.avatar_url || null,
      phone: metadata.phone || null,
      bio: metadata.bio || null
    }).returning();

    // 2. Create wallet
    await db.insert(wallets).values({
      user_id: userId,
      balance: '0.00',
      pending_balance: '0.00',
      currency: 'MAD'
    });

    // 3. Create role-specific profile
    if (role === 'creator') {
      await db.insert(creators).values({
        user_id: userId,
        specialization: metadata.specialization || null,
        instagram_handle: metadata.instagram || metadata.instagramHandle || null,
        tiktok_handle: metadata.tiktok || metadata.tiktokHandle || null,
        youtube_handle: metadata.youtube || metadata.youtubeHandle || null,
        followers_count: metadata.followersCount || 0,
        portfolio_url: metadata.portfolioUrl || null,
        is_verified: false,
        rating: '0.00',
        completed_campaigns: 0
      });
    } else if (role === 'brand') {
      await db.insert(brands).values({
        user_id: userId,
        company_name: metadata.companyName || metadata.company_name || fullName,
        industry: metadata.industry || null,
        website: metadata.website || null,
        logo_url: metadata.logo_url || metadata.logoUrl || null,
        description: metadata.description || metadata.bio || null,
        is_verified: false,
        total_campaigns: 0
      });
    }

    return { success: true, profile };
  } catch (error) {
    console.error('Storage error:', error);
    throw error;
  }
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId) {
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, userId));
  return profile;
}

/**
 * Get user profile by email
 */
export async function getUserProfileByEmail(email) {
  const [profile] = await db.select().from(profiles).where(eq(profiles.email, email));
  return profile;
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId, updates) {
  const [updatedProfile] = await db
    .update(profiles)
    .set({
      ...updates,
      updated_at: new Date()
    })
    .where(eq(profiles.id, userId))
    .returning();
  
  return updatedProfile;
}

// ===== CREATOR OPERATIONS =====

/**
 * Get creator profile by user_id
 */
export async function getCreatorProfile(userId) {
  const [creator] = await db.select().from(creators).where(eq(creators.user_id, userId));
  return creator;
}

// ===== BRAND OPERATIONS =====

/**
 * Get brand profile by user_id
 */
export async function getBrandProfile(userId) {
  const [brand] = await db.select().from(brands).where(eq(brands.user_id, userId));
  return brand;
}

// ===== WALLET OPERATIONS =====

/**
 * Get wallet by user_id
 */
export async function getWallet(userId) {
  const [wallet] = await db.select().from(wallets).where(eq(wallets.user_id, userId));
  return wallet;
}
