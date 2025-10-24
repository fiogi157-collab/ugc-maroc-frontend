import express from 'express';
import { db } from '../db/index.js';
import { negotiations, gigs, profiles } from '../db/schema.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
import { eq, and, desc, asc, or } from 'drizzle-orm';

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

// ===== CRÉER UNE NÉGOCIATION =====
router.post('/', authenticateUser, async (req, res) => {
  try {
    const {
      gig_id,
      proposed_price,
      proposed_details,
      brand_message
    } = req.body;

    // Validation
    if (!gig_id || !proposed_price) {
      return res.status(400).json({ 
        error: 'ID du gig et prix proposé sont requis' 
      });
    }

    if (proposed_price < 50 || proposed_price > 10000) {
      return res.status(400).json({ 
        error: 'Le prix doit être entre 50 et 10,000 MAD' 
      });
    }

    // Vérifier que le gig existe et est actif
    const [gig] = await db
      .select()
      .from(gigs)
      .where(and(eq(gigs.id, gig_id), eq(gigs.is_active, true)));

    if (!gig) {
      return res.status(404).json({ error: 'Gig non trouvé ou inactif' });
    }

    // Vérifier que le brand ne négocie pas avec lui-même
    if (gig.creator_id === req.user.id) {
      return res.status(400).json({ 
        error: 'Vous ne pouvez pas négocier avec vous-même' 
      });
    }

    // Vérifier qu'il n'y a pas déjà une négociation en cours
    const [existingNegotiation] = await db
      .select()
      .from(negotiations)
      .where(
        and(
          eq(negotiations.gig_id, gig_id),
          eq(negotiations.brand_id, req.user.id),
          eq(negotiations.status, 'pending')
        )
      );

    if (existingNegotiation) {
      return res.status(400).json({ 
        error: 'Une négociation est déjà en cours pour ce gig' 
      });
    }

    // Créer la négociation
    const [newNegotiation] = await db.insert(negotiations).values({
      gig_id,
      brand_id: req.user.id,
      creator_id: gig.creator_id,
      proposed_price: parseFloat(proposed_price),
      proposed_details,
      brand_message,
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours
    }).returning();

    res.status(201).json({
      success: true,
      message: 'Négociation créée avec succès',
      negotiation: newNegotiation
    });

  } catch (error) {
    console.error('Error creating negotiation:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la négociation' });
  }
});

// ===== MES NÉGOCIATIONS (BRAND) =====
router.get('/brand/my-negotiations', authenticateUser, async (req, res) => {
  try {
    const negotiations = await db
      .select({
        id: negotiations.id,
        gig_id: negotiations.gig_id,
        proposed_price: negotiations.proposed_price,
        proposed_details: negotiations.proposed_details,
        brand_message: negotiations.brand_message,
        creator_response: negotiations.creator_response,
        status: negotiations.status,
        expires_at: negotiations.expires_at,
        created_at: negotiations.created_at,
        gig_title: gigs.title,
        creator_name: profiles.full_name,
        creator_avatar: profiles.avatar_url
      })
      .from(negotiations)
      .leftJoin(gigs, eq(negotiations.gig_id, gigs.id))
      .leftJoin(profiles, eq(negotiations.creator_id, profiles.id))
      .where(eq(negotiations.brand_id, req.user.id))
      .orderBy(desc(negotiations.created_at));

    res.json({
      success: true,
      negotiations
    });

  } catch (error) {
    console.error('Error fetching brand negotiations:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des négociations' });
  }
});

// ===== MES NÉGOCIATIONS (CRÉATEUR) =====
router.get('/creator/my-negotiations', authenticateUser, async (req, res) => {
  try {
    const negotiations = await db
      .select({
        id: negotiations.id,
        gig_id: negotiations.gig_id,
        proposed_price: negotiations.proposed_price,
        proposed_details: negotiations.proposed_details,
        brand_message: negotiations.brand_message,
        creator_response: negotiations.creator_response,
        status: negotiations.status,
        expires_at: negotiations.expires_at,
        created_at: negotiations.created_at,
        gig_title: gigs.title,
        brand_name: profiles.full_name,
        brand_avatar: profiles.avatar_url
      })
      .from(negotiations)
      .leftJoin(gigs, eq(negotiations.gig_id, gigs.id))
      .leftJoin(profiles, eq(negotiations.brand_id, profiles.id))
      .where(eq(negotiations.creator_id, req.user.id))
      .orderBy(desc(negotiations.created_at));

    res.json({
      success: true,
      negotiations
    });

  } catch (error) {
    console.error('Error fetching creator negotiations:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des négociations' });
  }
});

// ===== DÉTAILS D'UNE NÉGOCIATION =====
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const [negotiation] = await db
      .select({
        id: negotiations.id,
        gig_id: negotiations.gig_id,
        brand_id: negotiations.brand_id,
        creator_id: negotiations.creator_id,
        proposed_price: negotiations.proposed_price,
        proposed_details: negotiations.proposed_details,
        brand_message: negotiations.brand_message,
        creator_response: negotiations.creator_response,
        status: negotiations.status,
        expires_at: negotiations.expires_at,
        created_at: negotiations.created_at,
        gig_title: gigs.title,
        gig_description: gigs.description,
        gig_base_price: gigs.base_price,
        brand_name: profiles.full_name,
        brand_avatar: profiles.avatar_url
      })
      .from(negotiations)
      .leftJoin(gigs, eq(negotiations.gig_id, gigs.id))
      .leftJoin(profiles, eq(negotiations.brand_id, profiles.id))
      .where(eq(negotiations.id, id));

    if (!negotiation) {
      return res.status(404).json({ error: 'Négociation non trouvée' });
    }

    // Vérifier que l'utilisateur a le droit de voir cette négociation
    if (negotiation.brand_id !== req.user.id && negotiation.creator_id !== req.user.id) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    res.json({
      success: true,
      negotiation
    });

  } catch (error) {
    console.error('Error fetching negotiation details:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la négociation' });
  }
});

// ===== ACCEPTER UNE NÉGOCIATION =====
router.patch('/:id/accept', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { creator_response } = req.body;

    // Vérifier que la négociation existe et appartient au créateur
    const [negotiation] = await db
      .select()
      .from(negotiations)
      .where(and(eq(negotiations.id, id), eq(negotiations.creator_id, req.user.id)));

    if (!negotiation) {
      return res.status(404).json({ error: 'Négociation non trouvée ou non autorisée' });
    }

    if (negotiation.status !== 'pending') {
      return res.status(400).json({ error: 'Cette négociation n\'est plus en attente' });
    }

    // Accepter la négociation
    const [updatedNegotiation] = await db
      .update(negotiations)
      .set({
        status: 'accepted',
        creator_response,
        updated_at: new Date()
      })
      .where(eq(negotiations.id, id))
      .returning();

    res.json({
      success: true,
      message: 'Négociation acceptée',
      negotiation: updatedNegotiation
    });

  } catch (error) {
    console.error('Error accepting negotiation:', error);
    res.status(500).json({ error: 'Erreur lors de l\'acceptation de la négociation' });
  }
});

// ===== REFUSER UNE NÉGOCIATION =====
router.patch('/:id/reject', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { creator_response } = req.body;

    // Vérifier que la négociation existe et appartient au créateur
    const [negotiation] = await db
      .select()
      .from(negotiations)
      .where(and(eq(negotiations.id, id), eq(negotiations.creator_id, req.user.id)));

    if (!negotiation) {
      return res.status(404).json({ error: 'Négociation non trouvée ou non autorisée' });
    }

    if (negotiation.status !== 'pending') {
      return res.status(400).json({ error: 'Cette négociation n\'est plus en attente' });
    }

    // Refuser la négociation
    const [updatedNegotiation] = await db
      .update(negotiations)
      .set({
        status: 'rejected',
        creator_response,
        updated_at: new Date()
      })
      .where(eq(negotiations.id, id))
      .returning();

    res.json({
      success: true,
      message: 'Négociation refusée',
      negotiation: updatedNegotiation
    });

  } catch (error) {
    console.error('Error rejecting negotiation:', error);
    res.status(500).json({ error: 'Erreur lors du refus de la négociation' });
  }
});

// ===== CONTRE-PROPOSER =====
router.patch('/:id/counter', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { counter_price, counter_details } = req.body;

    if (!counter_price) {
      return res.status(400).json({ error: 'Prix de contre-proposition requis' });
    }

    // Vérifier que la négociation existe et appartient au créateur
    const [negotiation] = await db
      .select()
      .from(negotiations)
      .where(and(eq(negotiations.id, id), eq(negotiations.creator_id, req.user.id)));

    if (!negotiation) {
      return res.status(404).json({ error: 'Négociation non trouvée ou non autorisée' });
    }

    if (negotiation.status !== 'pending') {
      return res.status(400).json({ error: 'Cette négociation n\'est plus en attente' });
    }

    // Mettre à jour avec la contre-proposition
    const [updatedNegotiation] = await db
      .update(negotiations)
      .set({
        proposed_price: parseFloat(counter_price),
        proposed_details: counter_details,
        updated_at: new Date()
      })
      .where(eq(negotiations.id, id))
      .returning();

    res.json({
      success: true,
      message: 'Contre-proposition envoyée',
      negotiation: updatedNegotiation
    });

  } catch (error) {
    console.error('Error counter-proposing:', error);
    res.status(500).json({ error: 'Erreur lors de la contre-proposition' });
  }
});

// ===== ANNULER UNE NÉGOCIATION =====
router.patch('/:id/cancel', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que la négociation existe et appartient au brand
    const [negotiation] = await db
      .select()
      .from(negotiations)
      .where(and(eq(negotiations.id, id), eq(negotiations.brand_id, req.user.id)));

    if (!negotiation) {
      return res.status(404).json({ error: 'Négociation non trouvée ou non autorisée' });
    }

    if (negotiation.status !== 'pending') {
      return res.status(400).json({ error: 'Cette négociation n\'est plus en attente' });
    }

    // Annuler la négociation
    const [updatedNegotiation] = await db
      .update(negotiations)
      .set({
        status: 'rejected',
        updated_at: new Date()
      })
      .where(eq(negotiations.id, id))
      .returning();

    res.json({
      success: true,
      message: 'Négociation annulée',
      negotiation: updatedNegotiation
    });

  } catch (error) {
    console.error('Error canceling negotiation:', error);
    res.status(500).json({ error: 'Erreur lors de l\'annulation de la négociation' });
  }
});

export default router;
