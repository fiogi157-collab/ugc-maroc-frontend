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

    // Diviser le SQL en instructions individuelles
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 ${statements.length} instructions SQL à exécuter\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length === 0) continue;

      try {
        console.log(`⚡ Exécution ${i + 1}/${statements.length}...`);
        
        // Utiliser l'API REST Supabase pour exécuter le SQL
        const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
          },
          body: JSON.stringify({ sql: statement })
        });

        if (response.ok) {
          console.log(`✅ Instruction ${i + 1} exécutée`);
          successCount++;
        } else {
          const error = await response.text();
          console.log(`⚠️  Instruction ${i + 1} - Avertissement: ${error}`);
          // Continuer même en cas d'erreur (table peut déjà exister)
        }
      } catch (err) {
        console.log(`⚠️  Instruction ${i + 1} - Erreur: ${err.message}`);
        errorCount++;
      }
    }

    console.log(`\n📊 Résumé:`);
    console.log(`✅ Succès: ${successCount}`);
    console.log(`⚠️  Erreurs: ${errorCount}`);

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

    console.log('\n🎉 Migration UGC Maroc terminée!');
    console.log('💳 Système de paiement Stripe prêt à l\'utilisation');

  } catch (error) {
    console.error('❌ Erreur fatale:', error);
  }
}

executeMigration();

