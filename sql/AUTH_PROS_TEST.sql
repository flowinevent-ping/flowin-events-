-- ============================================================
-- FLOWIN · COMPTES AUTH PRO TEST · 13/05/2026
-- 5 comptes pro pour tester pro_mobile_v4.html
-- 
-- Mot de passe commun : flowin-test-2026
-- À supprimer après audit (DELETE FROM auth.users WHERE email LIKE '%@test-flowin.fr')
-- ============================================================

-- Activer pgcrypto pour hash mot de passe
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Fonction helper pour créer un user Auth + profile en une fois
CREATE OR REPLACE FUNCTION create_pro_test_user(
  p_email TEXT,
  p_password TEXT,
  p_pro_id TEXT,
  p_nom TEXT
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID := gen_random_uuid();
BEGIN
  -- INSERT dans auth.users avec hash bcrypt natif Supabase
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, 
    encrypted_password, email_confirmed_at, 
    created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('nom', p_nom),
    '','','',''
  ) ON CONFLICT (id) DO NOTHING;

  -- INSERT dans public.profiles
  INSERT INTO public.profiles (id, role, pro_id, email, nom)
  VALUES (v_user_id, 'pro', p_pro_id, p_email, p_nom)
  ON CONFLICT (id) DO NOTHING;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- Créer les 5 comptes PRO test
SELECT create_pro_test_user('animation@cannes-test.fr','flowin-test-2026','pro-test-cannes','Service Animation Cannes TEST');
SELECT create_pro_test_user('animation@antibes-test.fr','flowin-test-2026','pro-test-antibes','Service Animation Antibes TEST');
SELECT create_pro_test_user('animation@grasse-test.fr','flowin-test-2026','pro-test-grasse','Service Animation Grasse TEST');
SELECT create_pro_test_user('animation@nice-test.fr','flowin-test-2026','pro-test-nice','Service Animation Nice TEST');
SELECT create_pro_test_user('animation@mougins-test.fr','flowin-test-2026','pro-test-mougins','Service Animation Mougins TEST');

-- Compte SA test (Romain admin)
-- Décommenter si besoin :
-- SELECT create_pro_test_user('admin@flowin-test.fr','flowin-test-2026',NULL,'SA TEST');
-- Puis UPDATE public.profiles SET role='sa' WHERE email='admin@flowin-test.fr';

-- Cleanup fonction (sécurité)
DROP FUNCTION IF EXISTS create_pro_test_user(TEXT,TEXT,TEXT,TEXT);

-- Vérification
SELECT 
  p.email,
  p.role,
  p.pro_id,
  p.nom,
  (SELECT nom FROM public.pros WHERE id = p.pro_id) AS pro_nom
FROM public.profiles p
WHERE p.email LIKE '%@%-test.fr'
ORDER BY p.email;

-- Pour supprimer ces comptes test plus tard :
-- DELETE FROM public.profiles WHERE email LIKE '%@%-test.fr';
-- DELETE FROM auth.users WHERE email LIKE '%@%-test.fr';
