import express from 'express';
import { db } from '../db/index.js';
import { contracts, negotiations, gigs, profiles, orders } from '../db/schema.js';
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

// ===== CRÉER UN CONTRAT =====
router.post('/', authenticateUser, async (req, res) => {
  try {
    const {
      gig_id,
      negotiation_id,
      title,
      description,
      deliverables,
      delivery_deadline,
      revisions_included = 1,
      agreed_price,
      usage_rights = 'non-exclusive',
      usage_duration = '6 months'
    } = req.body;

    // Validation
    if (!gig_id || !title || !description || !delivery_deadline || !agreed_price) {
      return res.status(400).json({ 
        error: 'Gig ID, titre, description, délai et prix sont requis' 
      });
    }

    // Vérifier que le gig existe
    const [gig] = await db
      .select()
      .from(gigs)
      .where(and(eq(gigs.id, gig_id), eq(gigs.is_active, true)));

    if (!gig) {
      return res.status(404).json({ error: 'Gig non trouvé ou inactif' });
    }

    // Si c'est basé sur une négociation, vérifier qu'elle est acceptée
    if (negotiation_id) {
      const [negotiation] = await db
        .select()
        .from(negotiations)
        .where(and(eq(negotiations.id, negotiation_id), eq(negotiations.status, 'accepted')));

      if (!negotiation) {
        return res.status(400).json({ error: 'Négociation non trouvée ou non acceptée' });
      }
    }

    // Calculer les frais
    const stripeFee = agreed_price * 0.05; // 5%
    const platformFee = agreed_price * 0.15; // 15%
    const creatorAmount = agreed_price - platformFee;
    const totalToPay = agreed_price + stripeFee;

    // Créer le contrat
    const [newContract] = await db.insert(contracts).values({
      gig_id,
      negotiation_id: negotiation_id || null,
      brand_id: req.user.id,
      creator_id: gig.creator_id,
      title,
      description,
      deliverables,
      delivery_deadline: new Date(delivery_deadline),
      revisions_included: parseInt(revisions_included),
      agreed_price: parseFloat(agreed_price),
      stripe_fee: stripeFee,
      platform_fee: platformFee,
      creator_amount: creatorAmount,
      total_to_pay: totalToPay,
      usage_rights,
      usage_duration,
      status: 'draft'
    }).returning();

    res.status(201).json({
      success: true,
      message: 'Contrat créé avec succès',
      contract: newContract
    });

  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(500).json({ error: 'Erreur lors de la création du contrat' });
  }
});

// ===== MES CONTRATS (BRAND) =====
router.get('/brand/my-contracts', authenticateUser, async (req, res) => {
  try {
    const contracts = await db
      .select({
        id: contracts.id,
        title: contracts.title,
        description: contracts.description,
        agreed_price: contracts.agreed_price,
        total_to_pay: contracts.total_to_pay,
        delivery_deadline: contracts.delivery_deadline,
        status: contracts.status,
        brand_accepted: contracts.brand_accepted,
        creator_accepted: contracts.creator_accepted,
        created_at: contracts.created_at,
        creator_name: profiles.full_name,
        creator_avatar: profiles.avatar_url,
        gig_title: gigs.title
      })
      .from(contracts)
      .leftJoin(profiles, eq(contracts.creator_id, profiles.id))
      .leftJoin(gigs, eq(contracts.gig_id, gigs.id))
      .where(eq(contracts.brand_id, req.user.id))
      .orderBy(desc(contracts.created_at));

    res.json({
      success: true,
      contracts
    });

  } catch (error) {
    console.error('Error fetching brand contracts:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des contrats' });
  }
});

// ===== MES CONTRATS (CRÉATEUR) =====
router.get('/creator/my-contracts', authenticateUser, async (req, res) => {
  try {
    const contracts = await db
      .select({
        id: contracts.id,
        title: contracts.title,
        description: contracts.description,
        agreed_price: contracts.agreed_price,
        creator_amount: contracts.creator_amount,
        delivery_deadline: contracts.delivery_deadline,
        status: contracts.status,
        brand_accepted: contracts.brand_accepted,
        creator_accepted: contracts.creator_accepted,
        created_at: contracts.created_at,
        brand_name: profiles.full_name,
        brand_avatar: profiles.avatar_url,
        gig_title: gigs.title
      })
      .from(contracts)
      .leftJoin(profiles, eq(contracts.brand_id, profiles.id))
      .leftJoin(gigs, eq(contracts.gig_id, gigs.id))
      .where(eq(contracts.creator_id, req.user.id))
      .orderBy(desc(contracts.created_at));

    res.json({
      success: true,
      contracts
    });

  } catch (error) {
    console.error('Error fetching creator contracts:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des contrats' });
  }
});

// ===== DÉTAILS D'UN CONTRAT =====
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const [contract] = await db
      .select({
        id: contracts.id,
        gig_id: contracts.gig_id,
        negotiation_id: contracts.negotiation_id,
        brand_id: contracts.brand_id,
        creator_id: contracts.creator_id,
        title: contracts.title,
        description: contracts.description,
        deliverables: contracts.deliverables,
        delivery_deadline: contracts.delivery_deadline,
        revisions_included: contracts.revisions_included,
        agreed_price: contracts.agreed_price,
        stripe_fee: contracts.stripe_fee,
        platform_fee: contracts.platform_fee,
        creator_amount: contracts.creator_amount,
        total_to_pay: contracts.total_to_pay,
        usage_rights: contracts.usage_rights,
        usage_duration: contracts.usage_duration,
        brand_accepted: contracts.brand_accepted,
        creator_accepted: contracts.creator_accepted,
        brand_signature: contracts.brand_signature,
        creator_signature: contracts.creator_signature,
        brand_signed_at: contracts.brand_signed_at,
        creator_signed_at: contracts.creator_signed_at,
        status: contracts.status,
        contract_pdf_url: contracts.contract_pdf_url,
        created_at: contracts.created_at,
        brand_name: profiles.full_name,
        brand_avatar: profiles.avatar_url,
        creator_name: profiles.full_name,
        creator_avatar: profiles.avatar_url
      })
      .from(contracts)
      .leftJoin(profiles, eq(contracts.brand_id, profiles.id))
      .leftJoin(profiles, eq(contracts.creator_id, profiles.id))
      .where(eq(contracts.id, id));

    if (!contract) {
      return res.status(404).json({ error: 'Contrat non trouvé' });
    }

    // Vérifier que l'utilisateur a le droit de voir ce contrat
    if (contract.brand_id !== req.user.id && contract.creator_id !== req.user.id) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    res.json({
      success: true,
      contract
    });

  } catch (error) {
    console.error('Error fetching contract details:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du contrat' });
  }
});

// ===== SIGNER UN CONTRAT (BRAND) =====
router.patch('/:id/sign/brand', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { signature } = req.body;

    if (!signature) {
      return res.status(400).json({ error: 'Signature requise' });
    }

    // Vérifier que le contrat existe et appartient au brand
    const [contract] = await db
      .select()
      .from(contracts)
      .where(and(eq(contracts.id, id), eq(contracts.brand_id, req.user.id)));

    if (!contract) {
      return res.status(404).json({ error: 'Contrat non trouvé ou non autorisé' });
    }

    if (contract.brand_accepted) {
      return res.status(400).json({ error: 'Contrat déjà signé par le brand' });
    }

    // Signer le contrat
    const [updatedContract] = await db
      .update(contracts)
      .set({
        brand_accepted: true,
        brand_signature: signature,
        brand_signed_at: new Date(),
        status: contract.creator_accepted ? 'active' : 'pending',
        updated_at: new Date()
      })
      .where(eq(contracts.id, id))
      .returning();

    res.json({
      success: true,
      message: 'Contrat signé par le brand',
      contract: updatedContract
    });

  } catch (error) {
    console.error('Error signing contract as brand:', error);
    res.status(500).json({ error: 'Erreur lors de la signature du contrat' });
  }
});

// ===== SIGNER UN CONTRAT (CRÉATEUR) =====
router.patch('/:id/sign/creator', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { signature } = req.body;

    if (!signature) {
      return res.status(400).json({ error: 'Signature requise' });
    }

    // Vérifier que le contrat existe et appartient au créateur
    const [contract] = await db
      .select()
      .from(contracts)
      .where(and(eq(contracts.id, id), eq(contracts.creator_id, req.user.id)));

    if (!contract) {
      return res.status(404).json({ error: 'Contrat non trouvé ou non autorisé' });
    }

    if (contract.creator_accepted) {
      return res.status(400).json({ error: 'Contrat déjà signé par le créateur' });
    }

    // Signer le contrat
    const [updatedContract] = await db
      .update(contracts)
      .set({
        creator_accepted: true,
        creator_signature: signature,
        creator_signed_at: new Date(),
        status: contract.brand_accepted ? 'active' : 'pending',
        updated_at: new Date()
      })
      .where(eq(contracts.id, id))
      .returning();

    res.json({
      success: true,
      message: 'Contrat signé par le créateur',
      contract: updatedContract
    });

  } catch (error) {
    console.error('Error signing contract as creator:', error);
    res.status(500).json({ error: 'Erreur lors de la signature du contrat' });
  }
});

// ===== GÉNÉRER PDF DU CONTRAT =====
router.post('/:id/generate-pdf', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que le contrat existe et est signé par les deux parties
    const [contract] = await db
      .select()
      .from(contracts)
      .where(and(eq(contracts.id, id), eq(contracts.status, 'active')));

    if (!contract) {
      return res.status(404).json({ error: 'Contrat non trouvé ou non actif' });
    }

    // Vérifier que l'utilisateur a le droit de générer le PDF
    if (contract.brand_id !== req.user.id && contract.creator_id !== req.user.id) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    // TODO: Implémenter la génération PDF avec pdfkit
    // Pour l'instant, retourner une URL fictive
    const pdfUrl = `https://ugc-maroc.com/contracts/${id}.pdf`;

    // Mettre à jour le contrat avec l'URL du PDF
    await db
      .update(contracts)
      .set({ contract_pdf_url: pdfUrl })
      .where(eq(contracts.id, id));

    res.json({
      success: true,
      message: 'PDF généré avec succès',
      pdf_url: pdfUrl
    });

  } catch (error) {
    console.error('Error generating contract PDF:', error);
    res.status(500).json({ error: 'Erreur lors de la génération du PDF' });
  }
});

// ===== CRÉER COMMANDE DEPUIS CONTRAT =====
router.post('/:id/create-order', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que le contrat existe et est actif
    const [contract] = await db
      .select()
      .from(contracts)
      .where(and(eq(contracts.id, id), eq(contracts.status, 'active')));

    if (!contract) {
      return res.status(404).json({ error: 'Contrat non trouvé ou non actif' });
    }

    // Vérifier que l'utilisateur est le brand
    if (contract.brand_id !== req.user.id) {
      return res.status(403).json({ error: 'Seul le brand peut créer la commande' });
    }

    // Créer la commande
    const [newOrder] = await db.insert(orders).values({
      brand_id: contract.brand_id,
      creator_id: contract.creator_id,
      contract_id: contract.id,
      gig_id: contract.gig_id,
      source_type: 'marketplace',
      total_amount: contract.agreed_price,
      status: 'pending_payment',
      payment_method: 'stripe'
    }).returning();

    res.status(201).json({
      success: true,
      message: 'Commande créée avec succès',
      order: newOrder
    });

  } catch (error) {
    console.error('Error creating order from contract:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la commande' });
  }
});

// ===== ANNULER UN CONTRAT =====
router.patch('/:id/cancel', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Vérifier que le contrat existe
    const [contract] = await db
      .select()
      .from(contracts)
      .where(eq(contracts.id, id));

    if (!contract) {
      return res.status(404).json({ error: 'Contrat non trouvé' });
    }

    // Vérifier que l'utilisateur a le droit d'annuler
    if (contract.brand_id !== req.user.id && contract.creator_id !== req.user.id) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    // Annuler le contrat
    const [updatedContract] = await db
      .update(contracts)
      .set({
        status: 'cancelled',
        updated_at: new Date()
      })
      .where(eq(contracts.id, id))
      .returning();

    res.json({
      success: true,
      message: 'Contrat annulé',
      contract: updatedContract
    });

  } catch (error) {
    console.error('Error canceling contract:', error);
    res.status(500).json({ error: 'Erreur lors de l\'annulation du contrat' });
  }
});

export default router;
