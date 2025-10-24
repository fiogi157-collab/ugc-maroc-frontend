#!/usr/bin/env node

// ===========================================================
// 🔄 UGC Maroc - Script de mise à jour automatique HTML
// ===========================================================

const fs = require('fs');
const path = require('path');

console.log('🚀 Démarrage de la mise à jour automatique des scripts HTML...\n');

// Configuration
const config = {
  // Dossiers à scanner
  scanDirs: [
    'auth',
    'brand', 
    'admin',
    'creator'
  ],
  
  // Patterns de remplacement
  replacements: [
    {
      // Supprimer Supabase CDN
      pattern: /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2"><\/script>\s*/g,
      replacement: ''
    },
    {
      // Remplacer auth.js par auth-workers.js
      pattern: /<script src="[^"]*\/js\/auth\.js"><\/script>/g,
      replacement: '<script src="/js/auth-workers.js"></script>'
    },
    {
      // Remplacer api.js par api-workers.js
      pattern: /<script src="[^"]*\/js\/api\.js"><\/script>/g,
      replacement: '<script src="/js/api-workers.js"></script>'
    },
    {
      // Ajouter les scripts Workers si pas présents
      pattern: /<script src="[^"]*\/js\/config\.js"><\/script>/g,
      replacement: `<script src="/js/config.js"></script>
        <script src="/js/utils.js"></script>
        <script src="/js/auth-workers.js"></script>
        <script src="/js/api-workers.js"></script>`
    }
  ],
  
  // Fichiers à ignorer
  ignoreFiles: [
    'test-workers.html',
    'index.html',
    'cookie-settings.html'
  ]
};

// Statistiques
const stats = {
  totalFiles: 0,
  modifiedFiles: 0,
  errors: 0,
  changes: []
};

// Fonction pour scanner un répertoire
function scanDirectory(dirPath) {
  const files = [];
  
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Récursion dans les sous-dossiers
        files.push(...scanDirectory(fullPath));
      } else if (item.endsWith('.html') && !config.ignoreFiles.includes(item)) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`❌ Erreur lecture dossier ${dirPath}:`, error.message);
    stats.errors++;
  }
  
  return files;
}

// Fonction pour traiter un fichier HTML
function processHtmlFile(filePath) {
  try {
    console.log(`📄 Traitement: ${filePath}`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    const fileChanges = [];
    
    // Appliquer tous les remplacements
    for (const replacement of config.replacements) {
      const beforeContent = content;
      content = content.replace(replacement.pattern, replacement.replacement);
      
      if (content !== beforeContent) {
        modified = true;
        fileChanges.push({
          pattern: replacement.pattern.toString(),
          description: getReplacementDescription(replacement)
        });
      }
    }
    
    // Sauvegarder si modifié
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      stats.modifiedFiles++;
      stats.changes.push({
        file: filePath,
        changes: fileChanges
      });
      console.log(`✅ Modifié: ${fileChanges.length} changement(s)`);
    } else {
      console.log(`ℹ️ Aucun changement nécessaire`);
    }
    
    stats.totalFiles++;
    
  } catch (error) {
    console.error(`❌ Erreur traitement ${filePath}:`, error.message);
    stats.errors++;
  }
}

// Fonction pour obtenir la description d'un remplacement
function getReplacementDescription(replacement) {
  if (replacement.pattern.toString().includes('supabase')) {
    return 'Suppression script Supabase CDN';
  } else if (replacement.pattern.toString().includes('auth.js')) {
    return 'Remplacement auth.js → auth-workers.js';
  } else if (replacement.pattern.toString().includes('api.js')) {
    return 'Remplacement api.js → api-workers.js';
  } else if (replacement.pattern.toString().includes('config.js')) {
    return 'Ajout scripts Workers complets';
  }
  return 'Remplacement personnalisé';
}

// Fonction pour générer le rapport
function generateReport() {
  console.log('\n📊 RAPPORT DE MISE À JOUR');
  console.log('='.repeat(50));
  console.log(`📁 Fichiers traités: ${stats.totalFiles}`);
  console.log(`✅ Fichiers modifiés: ${stats.modifiedFiles}`);
  console.log(`❌ Erreurs: ${stats.errors}`);
  
  if (stats.changes.length > 0) {
    console.log('\n📋 DÉTAIL DES MODIFICATIONS:');
    console.log('-'.repeat(50));
    
    for (const change of stats.changes) {
      console.log(`\n📄 ${change.file}:`);
      for (const fileChange of change.changes) {
        console.log(`  • ${fileChange.description}`);
      }
    }
  }
  
  console.log('\n🎉 Mise à jour terminée !');
  
  if (stats.modifiedFiles > 0) {
    console.log('\n💡 PROCHAINES ÉTAPES:');
    console.log('1. Vérifier les modifications avec: git diff');
    console.log('2. Tester quelques pages pour validation');
    console.log('3. Commit les changements: git add . && git commit');
    console.log('4. Push: git push origin migration-cloudflare');
  }
}

// Fonction principale
function main() {
  console.log('🔍 Recherche des fichiers HTML...\n');
  
  // Scanner tous les dossiers
  let allFiles = [];
  for (const dir of config.scanDirs) {
    const dirPath = path.join(__dirname, dir);
    if (fs.existsSync(dirPath)) {
      console.log(`📂 Scan du dossier: ${dir}/`);
      const files = scanDirectory(dirPath);
      allFiles.push(...files);
      console.log(`   Trouvé ${files.length} fichier(s) HTML\n`);
    } else {
      console.log(`⚠️ Dossier non trouvé: ${dir}/\n`);
    }
  }
  
  if (allFiles.length === 0) {
    console.log('❌ Aucun fichier HTML trouvé à traiter');
    return;
  }
  
  console.log(`📊 Total: ${allFiles.length} fichier(s) HTML à traiter\n`);
  
  // Traiter chaque fichier
  for (const file of allFiles) {
    processHtmlFile(file);
  }
  
  // Générer le rapport
  generateReport();
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = { processHtmlFile, scanDirectory, config };
