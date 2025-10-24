import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTableStructure() {
  console.log('🔍 Vérification de la structure des tables existantes...\n');

  const tablesToCheck = ['profiles', 'campaigns', 'submissions'];

  for (const tableName of tablesToCheck) {
    try {
      console.log(`\n📋 Structure de la table ${tableName}:`);
      
      // Récupérer les informations de la table
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ Erreur: ${error.message}`);
        continue;
      }

      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log(`✅ Colonnes: ${columns.join(', ')}`);
        
        // Vérifier les types spécifiques
        for (const [key, value] of Object.entries(data[0])) {
          const type = typeof value;
          console.log(`   - ${key}: ${type}${value === null ? ' (NULL)' : ''}`);
        }
      } else {
        console.log(`⚠️  Table vide - pas de données pour analyser la structure`);
      }

    } catch (err) {
      console.log(`❌ Erreur pour ${tableName}: ${err.message}`);
    }
  }

  // Vérifier spécifiquement les types d'ID
  console.log('\n🔍 Vérification des types d\'ID...');
  
  try {
    const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
    if (profiles && profiles.length > 0) {
      console.log(`✅ profiles.id type: ${typeof profiles[0].id}`);
    }
  } catch (err) {
    console.log(`❌ Erreur profiles: ${err.message}`);
  }

  try {
    const { data: campaigns } = await supabase.from('campaigns').select('id').limit(1);
    if (campaigns && campaigns.length > 0) {
      console.log(`✅ campaigns.id type: ${typeof campaigns[0].id}`);
    }
  } catch (err) {
    console.log(`❌ Erreur campaigns: ${err.message}`);
  }

  try {
    const { data: submissions } = await supabase.from('submissions').select('id').limit(1);
    if (submissions && submissions.length > 0) {
      console.log(`✅ submissions.id type: ${typeof submissions[0].id}`);
    }
  } catch (err) {
    console.log(`❌ Erreur submissions: ${err.message}`);
  }
}

checkTableStructure();

