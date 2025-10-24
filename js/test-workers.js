// ===========================================================
// 🧪 UGC Maroc - Test Workers API Connection
// ===========================================================

// Fonction pour tester la connexion à l'API Workers
async function testWorkersConnection() {
  console.log('🧪 Test de connexion Workers API...');
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Test health check...');
    const healthResponse = await fetch(`${API_BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Test 2: Root endpoint
    console.log('2️⃣ Test root endpoint...');
    const rootResponse = await fetch(`${API_BASE_URL}/`);
    const rootData = await rootResponse.json();
    console.log('✅ Root endpoint:', rootData);
    
    // Test 3: Analytics (sans auth)
    console.log('3️⃣ Test analytics...');
    const analyticsResponse = await fetch(`${API_BASE_URL}/api/analytics/stats`);
    const analyticsData = await analyticsResponse.json();
    console.log('✅ Analytics:', analyticsData);
    
    // Test 4: Feature flags
    console.log('4️⃣ Test feature flags...');
    const featuresResponse = await fetch(`${API_BASE_URL}/api/features`);
    const featuresData = await featuresResponse.json();
    console.log('✅ Feature flags:', featuresData);
    
    console.log('🎉 Tous les tests sont passés ! Workers API fonctionne correctement.');
    return { success: true, message: 'Workers API opérationnel' };
    
  } catch (error) {
    console.error('❌ Erreur test Workers API:', error);
    return { success: false, error: error.message };
  }
}

// Fonction pour tester l'authentification
async function testAuthentication() {
  console.log('🔐 Test authentification...');
  
  try {
    // Test inscription
    console.log('1️⃣ Test inscription...');
    const signupResult = await signupUser(
      'test-workers@example.com',
      'password123',
      'creator',
      'Test Workers User',
      '+212600000001'
    );
    
    if (!signupResult.success) {
      console.log('ℹ️ Utilisateur existe déjà ou erreur:', signupResult.error);
    } else {
      console.log('✅ Inscription réussie:', signupResult.user);
    }
    
    // Test connexion
    console.log('2️⃣ Test connexion...');
    const loginResult = await loginUser('test-workers@example.com', 'password123');
    
    if (!loginResult.success) {
      console.error('❌ Erreur connexion:', loginResult.error);
      return { success: false, error: loginResult.error };
    }
    
    console.log('✅ Connexion réussie:', loginResult.user);
    
    // Test récupération profil
    console.log('3️⃣ Test récupération profil...');
    const profile = await getUserProfile();
    console.log('✅ Profil récupéré:', profile);
    
    // Test déconnexion
    console.log('4️⃣ Test déconnexion...');
    await logoutUser();
    console.log('✅ Déconnexion réussie');
    
    console.log('🎉 Tests d\'authentification réussis !');
    return { success: true, message: 'Authentification fonctionnelle' };
    
  } catch (error) {
    console.error('❌ Erreur test authentification:', error);
    return { success: false, error: error.message };
  }
}

// Fonction pour tester les routes avec cache
async function testCachedRoutes() {
  console.log('📊 Test routes avec cache...');
  
  try {
    // Test campaigns cached
    console.log('1️⃣ Test campaigns cached...');
    const campaignsResult = await getAvailableCampaigns();
    console.log('✅ Campaigns cached:', campaignsResult);
    
    // Test gigs cached
    console.log('2️⃣ Test gigs cached...');
    const gigsResult = await getCreatorGigs();
    console.log('✅ Gigs cached:', gigsResult);
    
    // Test top creators
    console.log('3️⃣ Test top creators...');
    const creatorsResult = await getTopCreators();
    console.log('✅ Top creators:', creatorsResult);
    
    // Test search
    console.log('4️⃣ Test search...');
    const searchResult = await globalSearch('test', 'all');
    console.log('✅ Search:', searchResult);
    
    console.log('🎉 Tests des routes avec cache réussis !');
    return { success: true, message: 'Routes avec cache fonctionnelles' };
    
  } catch (error) {
    console.error('❌ Erreur test routes cache:', error);
    return { success: false, error: error.message };
  }
}

// Fonction pour tester les paiements
async function testPayments() {
  console.log('💳 Test paiements...');
  
  try {
    // Test création payment intent
    console.log('1️⃣ Test création payment intent...');
    const paymentResult = await createPaymentIntent(100, 'MAD', { test: true });
    console.log('✅ Payment intent créé:', paymentResult);
    
    console.log('🎉 Tests paiements réussis !');
    return { success: true, message: 'Paiements fonctionnels' };
    
  } catch (error) {
    console.error('❌ Erreur test paiements:', error);
    return { success: false, error: error.message };
  }
}

// Fonction principale de test
async function runAllTests() {
  console.log('🚀 Démarrage des tests Workers API...');
  console.log('📍 API Base URL:', API_BASE_URL);
  
  const results = {
    connection: null,
    authentication: null,
    cachedRoutes: null,
    payments: null
  };
  
  // Test 1: Connexion
  results.connection = await testWorkersConnection();
  
  // Test 2: Authentification
  results.authentication = await testAuthentication();
  
  // Test 3: Routes avec cache
  results.cachedRoutes = await testCachedRoutes();
  
  // Test 4: Paiements
  results.payments = await testPayments();
  
  // Résumé
  console.log('📊 Résumé des tests:');
  console.log('Connection:', results.connection.success ? '✅' : '❌');
  console.log('Authentication:', results.authentication.success ? '✅' : '❌');
  console.log('Cached Routes:', results.cachedRoutes.success ? '✅' : '❌');
  console.log('Payments:', results.payments.success ? '✅' : '❌');
  
  const allPassed = Object.values(results).every(result => result.success);
  
  if (allPassed) {
    console.log('🎉 Tous les tests sont passés ! Workers API est opérationnel.');
  } else {
    console.log('⚠️ Certains tests ont échoué. Vérifiez les erreurs ci-dessus.');
  }
  
  return results;
}

// Exporter les fonctions pour utilisation globale
window.testWorkersConnection = testWorkersConnection;
window.testAuthentication = testAuthentication;
window.testCachedRoutes = testCachedRoutes;
window.testPayments = testPayments;
window.runAllTests = runAllTests;

// Auto-run tests si on est sur une page de test
if (window.location.pathname.includes('test') || window.location.search.includes('test=true')) {
  console.log('🧪 Auto-démarrage des tests...');
  runAllTests();
}
