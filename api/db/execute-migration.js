import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function executeMigration() {
  console.log('🚀 Exécution de la migration UGC Maroc...\n');

  try {
    // Lire le fichier SQL
    const sqlPath = join(__dirname, 'migrations', '001_payment_system.sql');
    const sqlContent = readFileSync(sqlPath, 'utf8');

    console.log('📄 Fichier SQL chargé avec succès');
    console.log('📊 Taille du script:', Math.round(sqlContent.length / 1024), 'KB\n');

    // Exécuter la migration
    console.log('⚡ Exécution de la migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });

    if (error) {
      console.error('❌ Erreur lors de l\'exécution:', error);
      return;
    }

    console.log('✅ Migration exécutée avec succès!');
    console.log('📊 Résultat:', data);

    // Vérifier que les tables ont été créées
    console.log('\n🔍 Vérification des tables créées...');
    
    const tablesToCheck = [
      'orders', 'payments', 'creator_balances', 'payout_requests', 'webhook_events',
      'campaign_agreements', 'conversations', 'messages', 'platform_settings'
    ];

    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ ${tableName} - Erreur: ${error.message}`);
        } else {
          console.log(`✅ ${tableName} - Table créée et accessible`);
        }
      } catch (err) {
        console.log(`⚠️  ${tableName} - Erreur: ${err.message}`);
      }
    }

    console.log('\n🎉 Migration UGC Maroc terminée avec succès!');
    console.log('💳 Système de paiement Stripe prêt à l\'utilisation');

  } catch (error) {
    console.error('❌ Erreur fatale:', error);
  }
}

executeMigration();

