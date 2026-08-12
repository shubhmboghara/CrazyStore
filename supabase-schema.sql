-- Run this in your Supabase SQL Editor to create the required tables

CREATE TABLE IF NOT EXISTS apps (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  tagline text,
  category text,
  version text,
  "updatedAt" text,
  size text,
  "minAndroid" text,
  "iconBg" text,
  "iconSymbol" text,
  badge text,
  "techStack" jsonb,
  "downloadUrl" text,
  "shortDescription" text,
  "fullDescription" jsonb,
  features jsonb,
  screenshots jsonb,
  "initialRating" numeric,
  "initialReviewCount" integer,
  "isCustom" boolean DEFAULT true,
  "logoUrl" text,
  "bannerUrl" text,
  "createdAt" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "appSlug" text NOT NULL,
  rating numeric NOT NULL,
  name text,
  "reviewText" text,
  ip text,
  "createdAt" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: Since this is an admin panel for viewing/editing apps, 
-- you may want to enable RLS or keep them open based on your preferences.
