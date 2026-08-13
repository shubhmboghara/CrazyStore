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
