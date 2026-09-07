-- =========================================================================
-- Supabase Migration: 'upsert_product' Function & SKU Unique Index Fix
-- =========================================================================

-- 1. Ensure 'sku', 'image_url', and 'images' columns exist in 'public.products'
--    This resolves "ERROR: 42703: column 'sku' does not exist" when table pre-existed.
DO $$ 
BEGIN
    -- Add sku column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'sku'
    ) THEN
        ALTER TABLE public.products ADD COLUMN sku text;
    END IF;

    -- Add image_url column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'image_url'
    ) THEN
        ALTER TABLE public.products ADD COLUMN image_url text;
    END IF;

    -- Add images JSONB column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'images'
    ) THEN
        ALTER TABLE public.products ADD COLUMN images jsonb DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- 2. Backfill missing SKU values for existing products to prevent unique index failure
UPDATE public.products 
SET sku = COALESCE(NULLIF(TRIM(sku), ''), NULLIF(TRIM(id), ''), 'SKU_' || id) 
WHERE sku IS NULL OR TRIM(sku) = '';

-- 3. Create Unique Index on SKU column for fast & conflict-free upserts
CREATE UNIQUE INDEX IF NOT EXISTS products_sku_unique_idx ON public.products (sku);

-- 4. Create or replace 'upsert_product' RPC function
--    Accepts product parameters, uses 'sku' to determine INSERT vs UPDATE, and returns result object.
CREATE OR REPLACE FUNCTION public.upsert_product(
  p_id text,
  p_sku text,
  p_name text,
  p_category text DEFAULT 'عام',
  p_price numeric DEFAULT 0,
  p_cost numeric DEFAULT 0,
  p_stock integer DEFAULT 0,
  p_image_url text DEFAULT '',
  p_description text DEFAULT '',
  p_status text DEFAULT 'active',
  p_images jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_op text;
  v_sku text;
  v_id text;
  v_primary_img text;
  v_result jsonb;
BEGIN
  -- Clean up inputs
  v_sku := COALESCE(NULLIF(TRIM(p_sku), ''), TRIM(p_id), 'SKU_' || floor(extract(epoch from now())));
  v_id  := COALESCE(NULLIF(TRIM(p_id), ''), 'PRD_' || v_sku);
  v_primary_img := COALESCE(NULLIF(TRIM(p_image_url), ''), 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80');

  -- Determine operation type
  IF EXISTS (SELECT 1 FROM public.products WHERE sku = v_sku) THEN
    v_op := 'UPDATE';
  ELSE
    v_op := 'INSERT';
  END IF;

  -- Perform UPSERT on conflict (sku)
  INSERT INTO public.products (
    id,
    sku,
    name,
    category,
    price,
    cost,
    stock,
    image_url,
    description,
    status,
    images,
    updated_at
  )
  VALUES (
    v_id,
    v_sku,
    p_name,
    p_category,
    p_price,
    p_cost,
    p_stock,
    v_primary_img,
    p_description,
    p_status,
    COALESCE(p_images, '[]'::jsonb),
    NOW()
  )
  ON CONFLICT (sku) 
  DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    cost = EXCLUDED.cost,
    stock = EXCLUDED.stock,
    image_url = EXCLUDED.image_url,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    images = EXCLUDED.images,
    updated_at = NOW();

  v_result := jsonb_build_object(
    'success', true,
    'operation', v_op,
    'sku', v_sku,
    'id', v_id,
    'name', p_name,
    'price', p_price,
    'stock', p_stock,
    'image_url', v_primary_img
  );

  RETURN v_result;
END;
$$;

-- 5. Alias function for backward compatibility with 'upsert_product_by_sku'
CREATE OR REPLACE FUNCTION public.upsert_product_by_sku(
  p_id text,
  p_sku text,
  p_name text,
  p_category text DEFAULT 'عام',
  p_price numeric DEFAULT 0,
  p_cost numeric DEFAULT 0,
  p_stock integer DEFAULT 0,
  p_image_url text DEFAULT '',
  p_description text DEFAULT '',
  p_status text DEFAULT 'active',
  p_images jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN public.upsert_product(
    p_id, p_sku, p_name, p_category, p_price, p_cost, p_stock, p_image_url, p_description, p_status, p_images
  );
END;
$$;
