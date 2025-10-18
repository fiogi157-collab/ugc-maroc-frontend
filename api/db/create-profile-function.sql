-- ============================================
-- FONCTION RPC: create_complete_profile
-- ============================================
-- Cette fonction contourne le problème de cache PostgREST
-- en utilisant SECURITY DEFINER pour s'exécuter avec des privilèges élevés
-- ============================================

CREATE OR REPLACE FUNCTION create_complete_profile(
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT,
  p_role TEXT,
  p_username TEXT DEFAULT NULL,
  p_specialization TEXT DEFAULT NULL,
  p_bio TEXT DEFAULT NULL,
  p_profile_picture_url TEXT DEFAULT NULL,
  p_cin TEXT DEFAULT NULL,
  p_birth_date TEXT DEFAULT NULL,
  p_ville TEXT DEFAULT NULL,
  p_languages TEXT[] DEFAULT NULL,
  p_interests TEXT[] DEFAULT NULL,
  p_bank_name TEXT DEFAULT NULL,
  p_rib TEXT DEFAULT NULL,
  p_company_name TEXT DEFAULT NULL,
  p_company_description TEXT DEFAULT NULL,
  p_website TEXT DEFAULT NULL,
  p_industry TEXT DEFAULT NULL,
  p_company_size TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
  v_wallet_id UUID;
BEGIN
  -- 1. Créer le profil dans la table profiles
  INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
  VALUES (p_user_id, p_email, p_full_name, p_role, NOW(), NOW());

  -- 2. Créer le wallet
  INSERT INTO wallets (user_id, balance, created_at, updated_at)
  VALUES (p_user_id, 0, NOW(), NOW())
  RETURNING id INTO v_wallet_id;

  -- 3. Créer le profil spécifique selon le rôle
  IF p_role = 'creator' THEN
    INSERT INTO creators (
      user_id,
      username,
      specialization,
      bio,
      profile_picture_url,
      cin,
      birth_date,
      ville,
      languages,
      interests,
      bank_name,
      rib,
      created_at,
      updated_at
    ) VALUES (
      p_user_id,
      p_username,
      p_specialization,
      COALESCE(p_bio, ''),
      p_profile_picture_url,
      p_cin,
      p_birth_date,
      p_ville,
      p_languages,
      p_interests,
      p_bank_name,
      p_rib,
      NOW(),
      NOW()
    );
  ELSIF p_role = 'brand' THEN
    INSERT INTO brands (
      user_id,
      company_name,
      company_description,
      profile_picture_url,
      website,
      industry,
      company_size,
      created_at,
      updated_at
    ) VALUES (
      p_user_id,
      p_company_name,
      COALESCE(p_company_description, ''),
      p_profile_picture_url,
      p_website,
      p_industry,
      p_company_size,
      NOW(),
      NOW()
    );
  END IF;

  -- Retourner succès
  v_result := json_build_object(
    'success', true,
    'user_id', p_user_id,
    'wallet_id', v_wallet_id,
    'role', p_role
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, retourner le message d'erreur
    v_result := json_build_object(
      'success', false,
      'error', SQLERRM
    );
    RETURN v_result;
END;
$$;

-- Accorder les permissions d'exécution à tous les utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION create_complete_profile TO authenticated;
GRANT EXECUTE ON FUNCTION create_complete_profile TO anon;
