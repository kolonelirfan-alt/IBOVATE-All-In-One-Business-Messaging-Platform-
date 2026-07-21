-- Migration to add Meta API credentials to channels table
alter table channels add column if not exists access_token text;
alter table channels add column if not exists meta_phone_id text;
