# 🤖 Guide d'intégration de l'IA - UGC Maroc

## Vue d'ensemble

Ce guide explique comment utiliser les 5 fonctionnalités d'IA dans vos pages UGC Maroc.

---

## 🚀 Démarrage rapide

### 1. Charger le module dans votre page HTML

```html
<!-- À la fin de votre page, après config.js -->
<script src="/js/ai-assistant.js"></script>
```

### 2. Utiliser les fonctions IA

Le module `AIAssistant` est disponible globalement via `window.AIAssistant`.

---

## 📋 Les 5 fonctionnalités disponibles

### 1. ✨ Générateur de scripts vidéo

**Fonction :** `AIAssistant.generateScript(briefData, resultElementId)`

**Exemple :**
```javascript
const briefData = {
  brandName: "نور الصحراء",
  productName: "مجموعة العناية بالبشرة",
  targetAudience: "نساء 25-40",
  duration: "30-60 ثانية",
  keyPoints: "طبيعي 100%, صنع في المغرب"
};

await AIAssistant.generateScript(briefData, 'result-container');
```

---

### 2. 💡 Suggestions de contenu créatif

**Fonction :** `AIAssistant.suggestContent(campaignData, resultElementId)`

**Exemple :**
```javascript
const campaignData = {
  brandName: "كافيه المحمدية",
  productName: "قهوة عضوية",
  objective: "زيادة الوعي بالعلامة التجارية",
  audience: "شباب 18-35"
};

await AIAssistant.suggestContent(campaignData, 'result-container');
```

---

### 3. 📊 Analyse et prédiction de performance

**Fonction :** `AIAssistant.predictPerformance(videoData, resultElementId)`

**Exemple :**
```javascript
const videoData = {
  title: "تجربتي مع منتجات نور الصحراء",
  duration: 45,
  quality: "ممتازة",
  hasCTA: true
};

await AIAssistant.predictPerformance(videoData, 'result-container');
```

---

### 4. 📝 Générateur de brief de campagne

**Fonction :** `AIAssistant.generateBrief(campaignInfo, resultElementId)`

**Exemple :**
```javascript
const campaignInfo = {
  campaignName: "إطلاق المجموعة الصيفية",
  brandName: "نور الصحراء",
  productName: "كريمات الحماية من الشمس",
  goal: "50 فيديو UGC في 30 يوم",
  budget: "30000 درهم",
  targetAudience: "نساء 20-45 سنة"
};

await AIAssistant.generateBrief(campaignInfo, 'result-container');
```

---

### 5. 🎯 Recommandation de créateurs

**Fonction :** `AIAssistant.matchCreators(campaignData, creatorsPool, resultElementId)`

**Exemple :**
```javascript
const campaignData = {
  productName: "منتجات تجميل طبيعية",
  category: "جمال وموضة",
  targetAudience: "نساء شابات",
  budget: "متوسطة"
};

const creatorsPool = [
  { 
    name: 'فاطمة الزهراء', 
    specialization: 'جمال وموضة', 
    rating: 4.8, 
    videoCount: 45 
  },
  { 
    name: 'سارة بنعلي', 
    specialization: 'أكل وطبخ', 
    rating: 4.9, 
    videoCount: 67 
  }
];

await AIAssistant.matchCreators(campaignData, creatorsPool, 'result-container');
```

---

## 🎨 Exemple d'intégration dans une page

```html
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <title>إنشاء حملة - UGC Maroc</title>
</head>
<body>
  <!-- Votre contenu de page -->
  
  <div class="campaign-form">
    <h2>إنشاء حملة جديدة</h2>
    
    <!-- Bouton pour générer un brief avec l'IA -->
    <button onclick="generateCampaignBrief()" 
            class="bg-purple-600 text-white px-6 py-3 rounded-lg">
      🤖 توليد البريف بالذكاء الاصطناعي
    </button>
    
    <!-- Conteneur pour le résultat -->
    <div id="ai-brief-result"></div>
  </div>

  <!-- Scripts -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="/js/config.js"></script>
  <script src="/js/ai-assistant.js"></script>
  
  <script>
    async function generateCampaignBrief() {
      // Récupérer les données du formulaire
      const campaignInfo = {
        campaignName: document.getElementById('campaign-name').value,
        brandName: document.getElementById('brand-name').value,
        productName: document.getElementById('product-name').value,
        goal: document.getElementById('goal').value,
        budget: document.getElementById('budget').value,
        targetAudience: document.getElementById('audience').value
      };
      
      // Appeler l'IA
      await AIAssistant.generateBrief(campaignInfo, 'ai-brief-result');
    }
  </script>
</body>
</html>
```

---

## 🔧 Personnalisation de l'affichage

Toutes les fonctions affichent automatiquement les résultats dans l'élément HTML spécifié. Vous pouvez personnaliser l'affichage en modifiant le fichier `/js/ai-assistant.js` dans les fonctions :

- `displayScript()`
- `displaySuggestions()`
- `displayPrediction()`
- `displayBrief()`
- `displayMatches()`

---

## 🧪 Page de test

Visitez `/test-ai.html` pour tester toutes les fonctionnalités IA et voir des exemples complets.

---

## 📌 Notes importantes

1. **Clé API** : Assurez-vous que `DEEPSEEK_API_KEY` est configurée dans les secrets Replit
2. **Langue** : Toutes les réponses sont en arabe/darija marocain
3. **Loading** : Le module gère automatiquement l'état de chargement avec un spinner
4. **Erreurs** : Les erreurs sont affichées en arabe avec des messages clairs
5. **Copier** : Les résultats incluent un bouton "نسخ" pour copier dans le presse-papiers

---

## 🆘 Support

Pour toute question sur l'intégration de l'IA, consultez :
- Le code source : `/js/ai-assistant.js`
- La page de test : `/test-ai.html`
- Les endpoints backend : `/api/src/index.js` (lignes 73-220)
