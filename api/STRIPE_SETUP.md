# Configuration Stripe pour UGC Maroc

## Variables d'environnement requises

Ajoutez ces variables à votre fichier `.env` dans le dossier `api/` :

```bash
# Stripe Configuration (TEST MODE)
STRIPE_SECRET_KEY=sk_test_51QEXAMPLE_REPLACE_WITH_YOUR_STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_51QEXAMPLE_REPLACE_WITH_YOUR_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef_REPLACE_WITH_YOUR_WEBHOOK_SECRET

# Platform Configuration
PLATFORM_FEE_PERCENTAGE=15
STRIPE_FEE_PERCENTAGE=5
MIN_WITHDRAWAL_AMOUNT=200
BANK_WITHDRAWAL_FEE=17
```

## Étapes de configuration Stripe

### 1. Créer un compte Stripe
- Aller sur [stripe.com](https://stripe.com)
- Créer un compte développeur
- Activer le mode test

### 2. Récupérer les clés API
- Dashboard Stripe → Developers → API keys
- Copier la **Secret key** (sk_test_...)
- Copier la **Publishable key** (pk_test_...)

### 3. Configurer les webhooks
- Dashboard Stripe → Developers → Webhooks
- Ajouter un endpoint : `https://votre-domaine.com/api/payments/stripe/webhook`
- Sélectionner les événements :
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `payment_intent.canceled`
- Copier le **Signing secret** (whsec_...)

### 4. Tester en mode développement
- Utiliser les cartes de test Stripe
- Carte valide : `4242 4242 4242 4242`
- Date d'expiration : n'importe quelle date future
- CVC : n'importe quel code à 3 chiffres

## Configuration des frais

- **Frais Stripe** : 5% (configurable via `STRIPE_FEE_PERCENTAGE`)
- **Frais plateforme** : 15% (configurable via `PLATFORM_FEE_PERCENTAGE`)
- **Frais bancaires retrait** : 17 MAD (configurable via `BANK_WITHDRAWAL_FEE`)
- **Montant minimum retrait** : 200 MAD (configurable via `MIN_WITHDRAWAL_AMOUNT`)

## Exemple de flux de paiement

1. **Brand** finalise négociation → Crée commande
2. **Brand** paie via Stripe (montant + 5% frais Stripe)
3. **Webhook** confirme paiement → Met à jour statut
4. **Admin** valide contenu → Libère fonds vers créateur
5. **Créateur** reçoit 85% du montant (15% frais plateforme)
6. **Créateur** peut retirer (minimum 200 MAD, frais 17 MAD)

## Sécurité

- ✅ Signature webhook vérifiée
- ✅ Idempotence des événements
- ✅ Pas de stockage de cartes
- ✅ Logs complets des transactions
- ✅ Validation des montants


