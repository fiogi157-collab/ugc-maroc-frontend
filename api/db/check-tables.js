import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkExistingTables() {
  console.log('🔍 Vérification des tables existantes dans Supabase...\n');

  const tablesToCheck = [
    'profiles',
    'creators',
    'brands',
    'wallets',
    'campaigns',
    'campaign_agreements',
    'wallet_reservations',
    'negotiation_messages',
    'dispute_cases',
    'ratings',
    'submissions',
    'transactions',
    'escrow_transactions',
    'agreement_escrow',
    'creator_earnings',
    'agreement_earnings',
    'creator_withdrawals',
    'creator_bank_details',
    'bank_change_requests',
    'platform_settings',
    'conversations',
    'messages',
    // NEW STRIPE TABLES
    'orders',
    'payments',
    'creator_balances',
    'payout_requests',
    'webhook_events'
  ];

  const existingTables = [];
  const missingTables = [];

  for (const tableName of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          missingTables.push(tableName);
          console.log(`❌ ${tableName} - N'EXISTE PAS`);
        } else {
          console.log(`⚠️  ${tableName} - Erreur: ${error.message}`);
        }
      } else {
        existingTables.push(tableName);
        console.log(`✅ ${tableName} - EXISTE`);
      }
    } catch (err) {
      console.log(`⚠️  ${tableName} - Erreur: ${err.message}`);
    }
  }

  console.log(`\n📊 RÉSUMÉ:`);
  console.log(`✅ Tables existantes: ${existingTables.length}`);
  console.log(`❌ Tables manquantes: ${missingTables.length}`);

  if (missingTables.length > 0) {
    console.log(`\n🔧 Tables à créer:`);
    missingTables.forEach(table => console.log(`   - ${table}`));
  }

  return { existingTables, missingTables };
}

checkExistingTables();


