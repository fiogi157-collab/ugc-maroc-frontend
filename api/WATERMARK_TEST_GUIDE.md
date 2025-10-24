# 🧪 Guide de Test - Système Watermark Preview

## 📋 **Vue d'ensemble du système**

Le système de watermark preview protège les vidéos créateurs avec une double protection :
1. **Watermark branding** (permanent) : Logo UGC Maroc + nom campagne
2. **Watermark preview** (temporaire) : "UGC MAROC - PREVIEW" diagonal

## 🔧 **Étapes de test**

### **1. Migration de la base de données**

```sql
-- Exécuter dans Supabase SQL Editor
-- Fichier: api/db/migrations/006_add_watermark_columns.sql
```

**Vérification :**
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'submissions' 
AND column_name IN ('watermarked_url', 'original_url', 'watermark_removed');
```

### **2. Test du service watermark**

```bash
# Tester la fonction addPreviewWatermark
curl -X POST http://localhost:5000/api/upload-video \
  -F "video=@test-video.mp4" \
  -F "campaignId=1" \
  -F "campaignName=Test Campaign"
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "تم رفع الفيديو بنجاح مع الحماية المزدوجة! ✨",
  "data": {
    "watermarkedUrl": "https://r2.../preview.mp4",
    "originalUrl": "https://r2.../branded.mp4",
    "watermarkStatus": "preview_active"
  }
}
```

### **3. Test de l'API d'approbation**

```bash
# Approuver une soumission (après paiement)
curl -X POST http://localhost:5000/api/submissions/1/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"brandId": "brand_user_id"}'
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "تمت الموافقة على التقديم وإزالة العلامة المائية بنجاح! 🎉",
  "data": {
    "submissionId": 1,
    "status": "approved",
    "watermarkRemoved": true,
    "originalUrl": "https://r2.../branded.mp4"
  }
}
```

### **4. Test du contrôle d'accès vidéo**

```bash
# Créateur accède à sa vidéo
curl -H "Authorization: Bearer CREATOR_TOKEN" \
  http://localhost:5000/api/submissions/1/video

# Brand accède avant paiement (preview)
curl -H "Authorization: Bearer BRAND_TOKEN" \
  http://localhost:5000/api/submissions/1/video

# Brand accède après paiement (original)
curl -H "Authorization: Bearer BRAND_TOKEN" \
  http://localhost:5000/api/submissions/1/video
```

**Résultats attendus :**

**Créateur :**
```json
{
  "success": true,
  "data": {
    "videoUrl": "https://r2.../preview.mp4",
    "accessLevel": "creator",
    "watermarkStatus": "active",
    "isPreview": true
  }
}
```

**Brand (avant paiement) :**
```json
{
  "success": true,
  "data": {
    "videoUrl": "https://r2.../preview.mp4",
    "accessLevel": "brand_preview",
    "watermarkStatus": "active",
    "isPreview": true
  }
}
```

**Brand (après paiement) :**
```json
{
  "success": true,
  "data": {
    "videoUrl": "https://r2.../branded.mp4",
    "accessLevel": "brand_approved",
    "watermarkStatus": "removed",
    "isPreview": false,
    "canDownloadOriginal": true
  }
}
```

## 🎬 **Test du flux complet**

### **Scénario 1 : Upload créateur**

1. **Créateur upload une vidéo**
   - URL : `http://localhost:5000/creator/creator-upload-watermark.html`
   - Résultat : 2 versions créées (branded + preview)
   - Base de données : `watermarked_url` et `original_url` enregistrés

2. **Vérification dans Supabase**
   ```sql
   SELECT id, watermarked_url, original_url, watermark_removed, status 
   FROM submissions 
   ORDER BY created_at DESC LIMIT 1;
   ```

### **Scénario 2 : Review brand (avant paiement)**

1. **Brand accède au dashboard**
   - URL : `http://localhost:5000/brand/brand-submissions-watermark.html`
   - Voit vidéo avec watermark preview
   - Bouton "موافقة" désactivé (paiement requis)

2. **Test API d'accès**
   ```bash
   curl -H "Authorization: Bearer BRAND_TOKEN" \
     http://localhost:5000/api/submissions/1/video
   ```

### **Scénario 3 : Paiement et approbation**

1. **Simuler paiement confirmé**
   ```sql
   UPDATE orders SET status = 'PAID' WHERE campaign_id = 1 AND creator_id = 'creator_id';
   ```

2. **Brand approuve la soumission**
   ```bash
   curl -X POST http://localhost:5000/api/submissions/1/approve \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer BRAND_TOKEN" \
     -d '{"brandId": "brand_user_id"}'
   ```

3. **Vérification accès original**
   ```bash
   curl -H "Authorization: Bearer BRAND_TOKEN" \
     http://localhost:5000/api/submissions/1/video
   ```

## 🔍 **Points de vérification**

### **Base de données**
- [ ] Colonnes `watermarked_url`, `original_url`, `watermark_removed` ajoutées
- [ ] Index créés pour performance
- [ ] Données existantes migrées correctement

### **Service watermark**
- [ ] Fonction `addPreviewWatermark()` fonctionne
- [ ] Double watermarking (branding + preview) appliqué
- [ ] 2 versions uploadées sur R2

### **API endpoints**
- [ ] `POST /api/upload-video` retourne les 2 URLs
- [ ] `POST /api/submissions/:id/approve` vérifie paiement
- [ ] `GET /api/submissions/:id/video` contrôle accès selon rôle

### **Frontend**
- [ ] Brand dashboard affiche watermark preview
- [ ] Creator dashboard explique le système
- [ ] Boutons d'approbation conditionnels
- [ ] Téléchargement original après approbation

### **Sécurité**
- [ ] Middleware contrôle accès par rôle
- [ ] Vérification propriété campagne
- [ ] Vérification statut paiement
- [ ] Pas d'accès non autorisé

## 🚨 **Cas d'erreur à tester**

1. **Upload sans campagne sélectionnée**
2. **Approbation sans paiement confirmé**
3. **Accès vidéo par utilisateur non autorisé**
4. **Approbation par non-propriétaire de campagne**
5. **Double approbation (déjà approuvé)**

## 📊 **Métriques de succès**

- ✅ **Upload** : 2 versions créées (branded + preview)
- ✅ **Sécurité** : Accès contrôlé par rôle et statut
- ✅ **Workflow** : Watermark supprimé après paiement + approbation
- ✅ **UX** : Interface claire pour brand et creator
- ✅ **Performance** : Upload < 30s pour vidéo 100MB

## 🎯 **Résultat final attendu**

**Créateur :**
- Upload → Watermark preview appliqué
- Voit toujours sa version preview
- Confirmé quand brand approuve

**Brand :**
- Voit preview avec watermark
- Peut approuver seulement après paiement
- Accès original après approbation

**Système :**
- Protection 100% avant paiement
- Workflow automatisé
- Sécurité renforcée
- UX optimale
