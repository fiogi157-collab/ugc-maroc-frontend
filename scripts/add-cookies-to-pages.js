#!/usr/bin/env node

/**
 * Script pour ajouter automatiquement les scripts de cookies à toutes les pages HTML
 * UGC Maroc - Intégration globale du système de cookies
 */

const fs = require('fs');
const path = require('path');

// Configuration
const COOKIE_SCRIPTS = [
  '  <!-- Cookie System Integration -->',
  '  <script src="/js/cookie-manager.js"></script>',
  '  <script src="/js/cookie-banner.js"></script>',
  '  <script src="/js/cookie-integration.js"></script>'
];

const COOKIE_SCRIPTS_STRING = COOKIE_SCRIPTS.join('\n');

// Dossiers à traiter
const DIRECTORIES = [
  'brand',
  'creator', 
  'admin',
  'auth'
];

// Fonction pour ajouter les scripts cookies à un fichier HTML
function addCookieScriptsToFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Vérifier si les scripts cookies sont déjà présents
    if (content.includes('cookie-manager.js')) {
      console.log(`✅ Scripts cookies déjà présents: ${filePath}`);
      return false;
    }
    
    // Trouver la balise </body> et ajouter les scripts avant
    const bodyCloseIndex = content.lastIndexOf('</body>');
    if (bodyCloseIndex === -1) {
      console.log(`⚠️ Balise </body> non trouvée: ${filePath}`);
      return false;
    }
    
    // Insérer les scripts avant </body>
    const beforeBodyClose = content.substring(0, bodyCloseIndex);
    const afterBodyClose = content.substring(bodyCloseIndex);
    
    const newContent = beforeBodyClose + '\n' + COOKIE_SCRIPTS_STRING + '\n' + afterBodyClose;
    
    // Écrire le fichier modifié
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✅ Scripts cookies ajoutés: ${filePath}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Erreur traitement ${filePath}:`, error.message);
    return false;
  }
}

// Fonction pour traiter un répertoire
function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`⚠️ Répertoire non trouvé: ${dirPath}`);
    return;
  }
  
  console.log(`📁 Traitement du répertoire: ${dirPath}`);
  
  const files = fs.readdirSync(dirPath);
  let processedCount = 0;
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Traiter les sous-répertoires récursivement
      processDirectory(filePath);
    } else if (file.endsWith('.html')) {
      // Traiter les fichiers HTML
      if (addCookieScriptsToFile(filePath)) {
        processedCount++;
      }
    }
  });
  
  console.log(`📊 ${processedCount} fichiers traités dans ${dirPath}`);
}

// Fonction principale
function main() {
  console.log('🍪 Ajout des scripts cookies à toutes les pages HTML');
  console.log('=' .repeat(50));
  
  let totalProcessed = 0;
  
  // Traiter le fichier index.html
  const indexPath = 'index.html';
  if (fs.existsSync(indexPath)) {
    console.log(`📄 Traitement de ${indexPath}`);
    if (addCookieScriptsToFile(indexPath)) {
      totalProcessed++;
    }
  }
  
  // Traiter tous les répertoires
  DIRECTORIES.forEach(dir => {
    if (fs.existsSync(dir)) {
      processDirectory(dir);
    } else {
      console.log(`⚠️ Répertoire non trouvé: ${dir}`);
    }
  });
  
  console.log('=' .repeat(50));
  console.log(`🎉 Traitement terminé! ${totalProcessed} fichiers modifiés au total`);
  console.log('✅ Toutes les pages HTML ont maintenant le système de cookies intégré');
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = {
  addCookieScriptsToFile,
  processDirectory,
  main
};
