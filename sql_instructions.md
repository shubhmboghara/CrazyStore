-- Run this in your Supabase SQL Editor
create table apps (
  id bigint primary key generated always as identity,
  slug text unique not null,
  name text not null,
  tagline text,
  category text,
  version text,
  "updatedAt" text,
  size text,
  "minAndroid" text,
  "iconBg" text,
  "iconSymbol" text,
  badge text,
  "logoUrl" text,
  "bannerUrl" text,
  "githubUrl" text,
  "techStack" jsonb,
  "downloadUrl" text,
  "shortDescription" text,
  "fullDescription" jsonb,
  features jsonb,
  "createdAt" text,
  "initialRating" numeric,
  "initialReviewCount" integer,
  screenshots jsonb
);

create table reviews (
  id bigint primary key generated always as identity,
  "appSlug" text not null,
  rating numeric not null,
  name text,
  "reviewText" text not null,
  "createdAt" text,
  ip text
);

alter table apps disable row level security;
alter table reviews disable row level security;

-- Run this to create analytics table for REAL visitor telemetry
create table if not exists analytics_events (
  id uuid default gen_random_uuid() primary key,
  visitor_id text,
  session_id text,
  event_type text not null,
  path text,
  app_slug text,
  app_name text,
  details text,
  duration_seconds integer default 0,
  is_task_completed boolean default false,
  device text,
  os text,
  browser text,
  country text,
  country_code text,
  city text,
  flag text,
  ip text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table analytics_events disable row level security;
create index if not exists idx_analytics_events_created_at on analytics_events(created_at desc);
create index if not exists idx_analytics_events_app_slug on analytics_events(app_slug);
