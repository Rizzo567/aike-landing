-- Migration: create_plane_canvases
-- Creates the table that stores Plane canvas data per authenticated user.
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).

CREATE TABLE plane_canvases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  canvas_data jsonb,
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE plane_canvases ENABLE ROW LEVEL SECURITY;

-- Policy: each authenticated user can only read/write their own rows
CREATE POLICY "Users can manage own canvases" ON plane_canvases
  FOR ALL USING (auth.uid() = user_id);
