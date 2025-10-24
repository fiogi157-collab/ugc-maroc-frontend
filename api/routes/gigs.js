import express from 'express';
import { db } from '../db/index.js';
import { gigs, gigOptions, profiles } from '../db/schema.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
import { eq, and, desc, asc, like, or, sql } from 'drizzle-orm';

const router = express.Router();

// ===== MIDDLEWARE AUTH =====
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token d\'authentification requis' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Token invalide' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Erreur d\'authentification' });
  }
};

// ===== CRÉER UN GIG =====
router.post('/', authenticateUser, async (req, res) => {
  try {
    const {
      title,
      description,
      base_price,
      delivery_days,
      category,
      languages = [],
      platforms = [],
      content_types = [],
      portfolio_urls = [],
      options = []
    } = req.body;

    // Validation
    if (!title || !description || !base_price || !delivery_days || !category) {
      return res.status(400).json({ 
        error: 'Titre, description, prix, délai et catégorie sont requis' 
      });
    }

    if (base_price < 50 || base_price > 10000) {
      return res.status(400).json({ 
        error: 'Le prix doit être entre 50 et 10,000 MAD' 
      });
    }

    if (delivery_days < 1 || delivery_days > 30) {
      return res.status(400).json({ 
        error: 'Le délai doit être entre 1 et 30 jours' 
      });
    }

    // Créer le gig
    const [newGig] = await db.insert(gigs).values({
      creator_id: req.user.id,
      title,
      description,
      base_price: parseFloat(base_price),
      delivery_days: parseInt(delivery_days),
      category,
      languages,
      platforms,
      content_types,
      portfolio_urls,
      is_active: true
    }).returning();

    // Créer les options si fournies
    if (options && options.length > 0) {
      const gigOptionsData = options.map(option => ({
        gig_id: newGig.id,
        name: option.name,
        price: parseFloat(option.price),
        description: option.description
      }));

      await db.insert(gigOptions).values(gigOptionsData);
    }

    // Récupérer le gig complet avec options
    const gigWithOptions = await db
      .select()
      .from(gigs)
      .leftJoin(gigOptions, eq(gigs.id, gigOptions.gig_id))
      .where(eq(gigs.id, newGig.id));

    res.status(201).json({
      success: true,
      message: 'Gig créé avec succès',
      gig: newGig
    });

  } catch (error) {
    console.error('Error creating gig:', error);
    res.status(500).json({ error: 'Erreur lors de la création du gig' });
  }
});

// ===== LISTER TOUS LES GIGS (MARKETPLACE) =====
router.get('/', async (req, res) => {
  try {
    const {
      category,
      min_price,
      max_price,
      delivery_days,
      language,
      platform,
      content_type,
      sort = 'rating',
      page = 1,
      limit = 20
    } = req.query;

    let query = db
      .select({
        id: gigs.id,
        title: gigs.title,
        description: gigs.description,
        base_price: gigs.base_price,
        delivery_days: gigs.delivery_days,
        category: gigs.category,
        languages: gigs.languages,
        platforms: gigs.platforms,
        content_types: gigs.content_types,
        portfolio_urls: gigs.portfolio_urls,
        views: gigs.views,
        orders_count: gigs.orders_count,
        rating: gigs.rating,
        created_at: gigs.created_at,
        creator_name: profiles.full_name,
        creator_avatar: profiles.avatar_url
      })
      .from(gigs)
      .leftJoin(profiles, eq(gigs.creator_id, profiles.id))
      .where(eq(gigs.is_active, true));

    // Filtres
    if (category) {
      query = query.where(and(eq(gigs.is_active, true), eq(gigs.category, category)));
    }

    if (min_price) {
      query = query.where(and(eq(gigs.is_active, true), sql`${gigs.base_price} >= ${parseFloat(min_price)}`));
    }

    if (max_price) {
      query = query.where(and(eq(gigs.is_active, true), sql`${gigs.base_price} <= ${parseFloat(max_price)}`));
    }

    if (delivery_days) {
      query = query.where(and(eq(gigs.is_active, true), sql`${gigs.delivery_days} <= ${parseInt(delivery_days)}`));
    }

    // Tri
    switch (sort) {
      case 'price_low':
        query = query.orderBy(asc(gigs.base_price));
        break;
      case 'price_high':
        query = query.orderBy(desc(gigs.base_price));
        break;
      case 'newest':
        query = query.orderBy(desc(gigs.created_at));
        break;
      case 'popular':
        query = query.orderBy(desc(gigs.views));
        break;
      case 'rating':
      default:
        query = query.orderBy(desc(gigs.rating));
        break;
    }

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.limit(parseInt(limit)).offset(offset);

    const results = await query;

    // Compter le total pour la pagination
    const totalQuery = await db
      .select({ count: sql`count(*)` })
      .from(gigs)
      .where(eq(gigs.is_active, true));

    const total = totalQuery[0]?.count || 0;

    res.json({
      success: true,
      gigs: results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching gigs:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des gigs' });
  }
});

// ===== DÉTAILS D'UN GIG =====
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer le gig avec les infos du créateur
    const [gig] = await db
      .select({
        id: gigs.id,
        title: gigs.title,
        description: gigs.description,
        base_price: gigs.base_price,
        delivery_days: gigs.delivery_days,
        category: gigs.category,
        languages: gigs.languages,
        platforms: gigs.platforms,
        content_types: gigs.content_types,
        portfolio_urls: gigs.portfolio_urls,
        views: gigs.views,
        orders_count: gigs.orders_count,
        rating: gigs.rating,
        created_at: gigs.created_at,
        creator_id: gigs.creator_id,
        creator_name: profiles.full_name,
        creator_avatar: profiles.avatar_url,
        creator_bio: profiles.bio
      })
      .from(gigs)
      .leftJoin(profiles, eq(gigs.creator_id, profiles.id))
      .where(and(eq(gigs.id, id), eq(gigs.is_active, true)));

    if (!gig) {
      return res.status(404).json({ error: 'Gig non trouvé' });
    }

    // Récupérer les options du gig
    const options = await db
      .select()
      .from(gigOptions)
      .where(eq(gigOptions.gig_id, id));

    // Incrémenter les vues
    await db
      .update(gigs)
      .set({ views: sql`${gigs.views} + 1` })
      .where(eq(gigs.id, id));

    res.json({
      success: true,
      gig: {
        ...gig,
        options
      }
    });

  } catch (error) {
    console.error('Error fetching gig details:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du gig' });
  }
});

// ===== MES GIGS (CRÉATEUR) =====
router.get('/creator/my-gigs', authenticateUser, async (req, res) => {
  try {
    const gigs = await db
      .select()
      .from(gigs)
      .where(eq(gigs.creator_id, req.user.id))
      .orderBy(desc(gigs.created_at));

    res.json({
      success: true,
      gigs
    });

  } catch (error) {
    console.error('Error fetching creator gigs:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de vos gigs' });
  }
});

// ===== MODIFIER UN GIG =====
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Vérifier que le gig appartient au créateur
    const [existingGig] = await db
      .select()
      .from(gigs)
      .where(and(eq(gigs.id, id), eq(gigs.creator_id, req.user.id)));

    if (!existingGig) {
      return res.status(404).json({ error: 'Gig non trouvé ou non autorisé' });
    }

    // Mise à jour
    const [updatedGig] = await db
      .update(gigs)
      .set({
        ...updateData,
        updated_at: new Date()
      })
      .where(eq(gigs.id, id))
      .returning();

    res.json({
      success: true,
      message: 'Gig mis à jour avec succès',
      gig: updatedGig
    });

  } catch (error) {
    console.error('Error updating gig:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du gig' });
  }
});

// ===== SUPPRIMER UN GIG =====
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que le gig appartient au créateur
    const [existingGig] = await db
      .select()
      .from(gigs)
      .where(and(eq(gigs.id, id), eq(gigs.creator_id, req.user.id)));

    if (!existingGig) {
      return res.status(404).json({ error: 'Gig non trouvé ou non autorisé' });
    }

    // Désactiver au lieu de supprimer
    await db
      .update(gigs)
      .set({ is_active: false })
      .where(eq(gigs.id, id));

    res.json({
      success: true,
      message: 'Gig supprimé avec succès'
    });

  } catch (error) {
    console.error('Error deleting gig:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du gig' });
  }
});

// ===== RECHERCHER DES GIGS =====
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const searchResults = await db
      .select({
        id: gigs.id,
        title: gigs.title,
        description: gigs.description,
        base_price: gigs.base_price,
        delivery_days: gigs.delivery_days,
        category: gigs.category,
        rating: gigs.rating,
        creator_name: profiles.full_name
      })
      .from(gigs)
      .leftJoin(profiles, eq(gigs.creator_id, profiles.id))
      .where(
        and(
          eq(gigs.is_active, true),
          or(
            like(gigs.title, `%${query}%`),
            like(gigs.description, `%${query}%`),
            like(gigs.category, `%${query}%`)
          )
        )
      )
      .orderBy(desc(gigs.rating))
      .limit(parseInt(limit))
      .offset((parseInt(page) - 1) * parseInt(limit));

    res.json({
      success: true,
      results: searchResults,
      query
    });

  } catch (error) {
    console.error('Error searching gigs:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche' });
  }
});

export default router;