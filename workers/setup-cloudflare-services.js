#!/usr/bin/env node

// ===========================================================
// 🚀 UGC Maroc - Setup Cloudflare Services
// ===========================================================

const https = require('https');

console.log('🚀 Setup Cloudflare Services pour UGC Maroc...\n');

// Configuration
const config = {
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID || 'YOUR_ACCOUNT_ID',
  apiToken: process.env.CLOUDFLARE_API_TOKEN || 'YOUR_API_TOKEN',
  domain: 'ugcmaroc.ma',
  services: {
    stream: true,
    images: true,
    turnstile: true,
    emailRouting: true,
    webAnalytics: true
  }
};

// Helper pour les requêtes API Cloudflare
async function cloudflareRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.cloudflare.com',
      port: 443,
      path: `/client/v4/accounts/${config.accountId}${endpoint}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (result.success) {
            resolve(result.result);
          } else {
            reject(new Error(result.errors?.[0]?.message || 'API Error'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// 1. Setup Cloudflare Stream
async function setupStream() {
  console.log('🎥 Setting up Cloudflare Stream...');
  
  try {
    // Vérifier si Stream est déjà activé
    const streamInfo = await cloudflareRequest('/stream');
    console.log('✅ Stream already configured');
    return streamInfo;
  } catch (error) {
    console.log('⚠️ Stream not configured yet - will be configured when first video is uploaded');
    return null;
  }
}

// 2. Setup Cloudflare Images
async function setupImages() {
  console.log('🖼️ Setting up Cloudflare Images...');
  
  try {
    // Vérifier si Images est déjà activé
    const imagesInfo = await cloudflareRequest('/images/v1');
    console.log('✅ Images already configured');
    return imagesInfo;
  } catch (error) {
    console.log('⚠️ Images not configured yet - will be configured when first image is uploaded');
    return null;
  }
}

// 3. Setup Turnstile
async function setupTurnstile() {
  console.log('🛡️ Setting up Turnstile...');
  
  try {
    // Créer un site Turnstile
    const turnstileSite = await cloudflareRequest('/turnstile/sites', 'POST', {
      name: 'UGC Maroc',
      domains: [config.domain, `*.${config.domain}`]
    });
    
    console.log('✅ Turnstile site created:', turnstileSite.id);
    console.log('📋 Site Key:', turnstileSite.site_key);
    console.log('🔑 Secret Key:', turnstileSite.secret_key);
    
    return turnstileSite;
  } catch (error) {
    console.error('❌ Failed to setup Turnstile:', error.message);
    return null;
  }
}

// 4. Setup Email Routing
async function setupEmailRouting() {
  console.log('📧 Setting up Email Routing...');
  
  try {
    // Vérifier si Email Routing est déjà configuré
    const emailRouting = await cloudflareRequest('/email/routing/rules');
    console.log('✅ Email Routing already configured');
    return emailRouting;
  } catch (error) {
    console.log('⚠️ Email Routing not configured yet - configure manually in dashboard');
    return null;
  }
}

// 5. Setup Web Analytics
async function setupWebAnalytics() {
  console.log('📊 Setting up Web Analytics...');
  
  try {
    // Activer Web Analytics
    const analytics = await cloudflareRequest('/analytics/web/analytics', 'POST', {
      enabled: true,
      domains: [config.domain]
    });
    
    console.log('✅ Web Analytics enabled');
    return analytics;
  } catch (error) {
    console.log('⚠️ Web Analytics setup failed:', error.message);
    return null;
  }
}

// 6. Setup Email Routes pour UGC Maroc
async function setupEmailRoutes() {
  console.log('📧 Setting up Email Routes for UGC Maroc...');
  
  const routes = [
    {
      pattern: 'support@ugcmaroc.ma',
      destinations: [{ type: 'worker', value: 'ugc-maroc-api' }]
    },
    {
      pattern: 'sales@ugcmaroc.ma', 
      destinations: [{ type: 'worker', value: 'ugc-maroc-api' }]
    },
    {
      pattern: 'contact@ugcmaroc.ma',
      destinations: [{ type: 'worker', value: 'ugc-maroc-api' }]
    },
    {
      pattern: 'info@ugcmaroc.ma',
      destinations: [{ type: 'worker', value: 'ugc-maroc-api' }]
    },
    {
      pattern: '*@ugcmaroc.ma',
      destinations: [{ type: 'worker', value: 'ugc-maroc-api' }]
    }
  ];

  const createdRoutes = [];
  
  for (const route of routes) {
    try {
      const createdRoute = await cloudflareRequest('/email/routing/rules', 'POST', route);
      createdRoutes.push(createdRoute);
      console.log(`✅ Created route: ${route.pattern}`);
    } catch (error) {
      console.log(`⚠️ Failed to create route ${route.pattern}:`, error.message);
    }
  }
  
  return createdRoutes;
}

// 7. Setup Images Variants pour UGC Maroc
async function setupImageVariants() {
  console.log('🖼️ Setting up Image Variants for UGC Maroc...');
  
  const variants = [
    // Avatar creators
    { id: 'avatar-sm', fit: 'cover', width: 64, height: 64, quality: 80, format: 'webp' },
    { id: 'avatar-md', fit: 'cover', width: 128, height: 128, quality: 85, format: 'webp' },
    { id: 'avatar-lg', fit: 'cover', width: 256, height: 256, quality: 90, format: 'webp' },
    
    // Logos brands
    { id: 'logo-sm', fit: 'contain', width: 100, height: 50, quality: 80, format: 'webp' },
    { id: 'logo-md', fit: 'contain', width: 200, height: 100, quality: 85, format: 'webp' },
    { id: 'logo-lg', fit: 'contain', width: 400, height: 200, quality: 90, format: 'webp' },
    
    // Thumbnails vidéos
    { id: 'thumb-sm', fit: 'cover', width: 320, height: 180, quality: 80, format: 'webp' },
    { id: 'thumb-md', fit: 'cover', width: 640, height: 360, quality: 85, format: 'webp' },
    { id: 'thumb-lg', fit: 'cover', width: 1280, height: 720, quality: 90, format: 'webp' },
    
    // Portfolio creators
    { id: 'portfolio-sm', fit: 'cover', width: 300, height: 300, quality: 80, format: 'webp' },
    { id: 'portfolio-md', fit: 'cover', width: 600, height: 600, quality: 85, format: 'webp' },
    { id: 'portfolio-lg', fit: 'cover', width: 1200, height: 1200, quality: 90, format: 'webp' }
  ];

  const createdVariants = [];
  
  for (const variant of variants) {
    try {
      const createdVariant = await cloudflareRequest('/images/v1/variants', 'POST', variant);
      createdVariants.push(createdVariant);
      console.log(`✅ Created variant: ${variant.id}`);
    } catch (error) {
      console.log(`⚠️ Failed to create variant ${variant.id}:`, error.message);
    }
  }
  
  return createdVariants;
}

// Fonction principale
async function main() {
  console.log('🔧 Configuration Cloudflare Services...\n');
  
  const results = {
    stream: null,
    images: null,
    turnstile: null,
    emailRouting: null,
    webAnalytics: null,
    emailRoutes: [],
    imageVariants: []
  };

  // Vérifier les credentials
  if (config.accountId === 'YOUR_ACCOUNT_ID' || config.apiToken === 'YOUR_API_TOKEN') {
    console.log('❌ Please set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN environment variables');
    console.log('   Or update the config in this script');
    return;
  }

  try {
    // Setup services
    if (config.services.stream) {
      results.stream = await setupStream();
    }
    
    if (config.services.images) {
      results.images = await setupImages();
    }
    
    if (config.services.turnstile) {
      results.turnstile = await setupTurnstile();
    }
    
    if (config.services.emailRouting) {
      results.emailRouting = await setupEmailRouting();
      results.emailRoutes = await setupEmailRoutes();
    }
    
    if (config.services.webAnalytics) {
      results.webAnalytics = await setupWebAnalytics();
    }
    
    // Setup variants après Images
    if (results.images) {
      results.imageVariants = await setupImageVariants();
    }

    // Rapport final
    console.log('\n📊 RAPPORT DE SETUP:');
    console.log('='.repeat(50));
    console.log('🎥 Stream:', results.stream ? '✅' : '⚠️');
    console.log('🖼️ Images:', results.images ? '✅' : '⚠️');
    console.log('🛡️ Turnstile:', results.turnstile ? '✅' : '❌');
    console.log('📧 Email Routing:', results.emailRouting ? '✅' : '⚠️');
    console.log('📊 Web Analytics:', results.webAnalytics ? '✅' : '❌');
    console.log('📧 Email Routes:', results.emailRoutes.length);
    console.log('🖼️ Image Variants:', results.imageVariants.length);

    if (results.turnstile) {
      console.log('\n🔑 TURNSTILE CREDENTIALS:');
      console.log('Site Key:', results.turnstile.site_key);
      console.log('Secret Key:', results.turnstile.secret_key);
      console.log('\n💡 Add these to your Workers secrets:');
      console.log('wrangler secret put TURNSTILE_SITE_KEY');
      console.log('wrangler secret put TURNSTILE_SECRET_KEY');
    }

    console.log('\n🎉 Setup terminé !');
    console.log('\n💡 PROCHAINES ÉTAPES:');
    console.log('1. Configurez les secrets Workers');
    console.log('2. Déployez le Workers avec: wrangler deploy');
    console.log('3. Testez les services avec: /test-workers.html');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = { main, setupStream, setupImages, setupTurnstile, setupEmailRouting, setupWebAnalytics };
