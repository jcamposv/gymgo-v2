-- ============================================================================
-- Migration: Storage Buckets para GymGo
-- Descripcion: Crea buckets para ejercicios y branding de organizaciones
-- ============================================================================

-- Bucket para ejercicios (GIFs, videos, thumbnails)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exercises',
  'exercises',
  true,
  52428800, -- 50MB max (para videos)
  ARRAY['image/gif', 'image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
) ON CONFLICT (id) DO NOTHING;

-- Bucket para branding de organizaciones (logos, banners)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'organizations',
  'organizations',
  true,
  5242880, -- 5MB max
  ARRAY['image/gif', 'image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- Bucket para avatares de miembros/usuarios
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Politicas de Storage - Exercises
-- ============================================================================

-- Lectura publica de ejercicios
CREATE POLICY "exercises_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'exercises');

-- Subida: usuarios autenticados de la organizacion o admins para globales
CREATE POLICY "exercises_authenticated_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exercises' AND
  (
    -- Ejercicios de organizacion: path = {org_id}/...
    (storage.foldername(name))[1] = (SELECT get_user_organization_id()::text)
    OR
    -- Ejercicios globales: solo owners/admins (path = global/...)
    ((storage.foldername(name))[1] = 'global' AND is_admin_or_owner())
  )
);

-- Actualizacion: mismas reglas que insert
CREATE POLICY "exercises_authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'exercises' AND
  (
    (storage.foldername(name))[1] = (SELECT get_user_organization_id()::text)
    OR
    ((storage.foldername(name))[1] = 'global' AND is_admin_or_owner())
  )
);

-- Eliminacion: mismas reglas
CREATE POLICY "exercises_authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'exercises' AND
  (
    (storage.foldername(name))[1] = (SELECT get_user_organization_id()::text)
    OR
    ((storage.foldername(name))[1] = 'global' AND is_admin_or_owner())
  )
);

-- ============================================================================
-- Politicas de Storage - Organizations
-- ============================================================================

-- Lectura publica de logos/branding
CREATE POLICY "organizations_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'organizations');

-- Subida: solo miembros de la organizacion
CREATE POLICY "organizations_authenticated_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'organizations' AND
  (storage.foldername(name))[1] = (SELECT get_user_organization_id()::text)
);

-- Actualizacion
CREATE POLICY "organizations_authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'organizations' AND
  (storage.foldername(name))[1] = (SELECT get_user_organization_id()::text)
);

-- Eliminacion
CREATE POLICY "organizations_authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'organizations' AND
  (storage.foldername(name))[1] = (SELECT get_user_organization_id()::text)
);

-- ============================================================================
-- Politicas de Storage - Avatars
-- ============================================================================

-- Lectura publica de avatares
CREATE POLICY "avatars_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Subida: usuarios autenticados para su organizacion
CREATE POLICY "avatars_authenticated_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = (SELECT get_user_organization_id()::text)
);

-- Actualizacion
CREATE POLICY "avatars_authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = (SELECT get_user_organization_id()::text)
);

-- Eliminacion
CREATE POLICY "avatars_authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = (SELECT get_user_organization_id()::text)
);
