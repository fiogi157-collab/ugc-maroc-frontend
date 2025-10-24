#!/bin/bash

# ===========================================================
# 🔐 UGC Maroc - Configuration des Secrets Workers
# ===========================================================

echo "🔐 Configuration des secrets Workers pour UGC Maroc..."
echo ""

# Vérifier si wrangler est installé
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler n'est pas installé. Installez-le avec: npm install -g wrangler"
    exit 1
fi

# Vérifier si l'utilisateur est connecté
echo "🔍 Vérification de la connexion Cloudflare..."
if ! wrangler whoami &> /dev/null; then
    echo "❌ Vous n'êtes pas connecté à Cloudflare."
    echo "   Connectez-vous avec: wrangler login"
    exit 1
fi

echo "✅ Connecté à Cloudflare"
echo ""

# Fonction pour configurer un secret
configure_secret() {
    local secret_name=$1
    local description=$2
    local is_optional=${3:-false}
    
    echo "🔑 Configuration de $secret_name"
    echo "   $description"
    
    if [ "$is_optional" = "true" ]; then
        echo "   (Optionnel - appuyez sur Entrée pour ignorer)"
    fi
    
    echo -n "   Valeur: "
    read -s secret_value
    echo ""
    
    if [ -n "$secret_value" ]; then
        echo "$secret_value" | wrangler secret put "$secret_name"
        if [ $? -eq 0 ]; then
            echo "✅ $secret_name configuré"
        else
            echo "❌ Erreur lors de la configuration de $secret_name"
        fi
    elif [ "$is_optional" = "true" ]; then
        echo "⏭️ $secret_name ignoré (optionnel)"
    else
        echo "❌ $secret_name est requis"
        return 1
    fi
    
    echo ""
}

# Secrets obligatoires
echo "📋 CONFIGURATION DES SECRETS OBLIGATOIRES:"
echo ""

configure_secret "JWT_SECRET" "Secret pour signer les JWT (générez une clé forte)" false
configure_secret "STRIPE_SECRET_KEY" "Clé secrète Stripe (sk_live_... ou sk_test_...)" false
configure_secret "STRIPE_WEBHOOK_SECRET" "Secret webhook Stripe (whsec_...)" false
configure_secret "RESEND_API_KEY" "Clé API Resend pour emails" false

# Secrets Cloudflare
echo "📋 CONFIGURATION DES SECRETS CLOUDFLARE:"
echo ""

configure_secret "CLOUDFLARE_ACCOUNT_ID" "ID du compte Cloudflare (trouvé dans dashboard)" false
configure_secret "CLOUDFLARE_API_TOKEN" "Token API Cloudflare (permissions: Zone:Read, Account:Read, Stream:Edit, Images:Edit, Turnstile:Edit)" false

# Secrets Turnstile
echo "📋 CONFIGURATION TURNSTILE:"
echo ""

configure_secret "TURNSTILE_SITE_KEY" "Clé publique Turnstile (0x4AAA...)" false
configure_secret "TURNSTILE_SECRET_KEY" "Clé secrète Turnstile (0x4AAA...)" false

# Secrets optionnels
echo "📋 CONFIGURATION DES SECRETS OPTIONNELS:"
echo ""

configure_secret "OPENROUTER_API_KEY" "Clé API OpenRouter pour AI (optionnel)" true

echo "🎉 Configuration des secrets terminée !"
echo ""
echo "💡 PROCHAINES ÉTAPES:"
echo "1. Vérifiez les secrets avec: wrangler secret list"
echo "2. Déployez le Workers avec: wrangler deploy"
echo "3. Testez les services avec: /test-workers.html"
echo ""
echo "🔗 LIENS UTILES:"
echo "- Dashboard Cloudflare: https://dash.cloudflare.com"
echo "- Compte ID: https://dash.cloudflare.com/profile/api-tokens"
echo "- API Token: https://dash.cloudflare.com/profile/api-tokens"
echo "- Turnstile: https://dash.cloudflare.com/turnstile"
echo "- Stream: https://dash.cloudflare.com/stream"
echo "- Images: https://dash.cloudflare.com/images"
