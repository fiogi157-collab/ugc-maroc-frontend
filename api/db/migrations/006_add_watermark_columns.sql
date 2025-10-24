-- =====================================================
-- UGC MAROC - WATERMARK PREVIEW SYSTEM
-- Ajoute les colonnes nécessaires pour le système de watermark preview
-- =====================================================

-- Ajouter colonnes watermark à la table submissions
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS watermarked_url TEXT,
ADD COLUMN IF NOT EXISTS original_url TEXT,
ADD COLUMN IF NOT EXISTS watermark_removed BOOLEAN DEFAULT false;

-- Commentaires pour documentation
COMMENT ON COLUMN submissions.watermarked_url IS 'URL de la vidéo avec watermark preview (visible avant paiement)';
COMMENT ON COLUMN submissions.original_url IS 'URL de la vidéo sans watermark preview (accessible après paiement)';
COMMENT ON COLUMN submissions.watermark_removed IS 'Flag indiquant si le watermark preview a été supprimé après validation';

-- Migrer les données existantes
-- Pour les submissions existantes, considérer qu'elles sont déjà "validées" (pas de watermark preview)
UPDATE submissions
SET 
  watermarked_url = video_url,
  original_url = video_url,
  watermark_removed = CASE 
    WHEN status = 'approved' THEN true 
    ELSE false 
  END
WHERE watermarked_url IS NULL;

-- Créer index pour performance
CREATE INDEX IF NOT EXISTS idx_submissions_watermark_removed ON submissions(watermark_removed);
CREATE INDEX IF NOT EXISTS idx_submissions_status_watermark ON submissions(status, watermark_removed);

-- Vérification
SELECT 
  '✅ Watermark columns added successfully!' as status,
  COUNT(*) as total_submissions,
  COUNT(CASE WHEN watermark_removed = true THEN 1 END) as approved_without_watermark,
  COUNT(CASE WHEN watermark_removed = false THEN 1 END) as pending_with_watermark
FROM submissions;
