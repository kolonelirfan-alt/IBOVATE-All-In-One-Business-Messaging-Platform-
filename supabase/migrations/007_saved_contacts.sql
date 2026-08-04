-- Migration 007: Add is_saved column to contacts table
alter table if exists contacts add column if not exists is_saved boolean default false;
