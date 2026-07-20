-- Migration 002: CRM and Ticketing Overhaul

-- 1. Upgrade Conversations Table to act as Ticketing System
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES users(id),
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium', -- 'low', 'medium', 'high'
ADD COLUMN IF NOT EXISTS category text;

-- 2. Tags Table for Contacts and Conversations
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#cccccc',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tags isolation" ON tags FOR ALL USING (workspace_id = (SELECT workspace_id FROM users WHERE users.id = auth.uid()));

-- 3. Contact Tags Mapping
CREATE TABLE IF NOT EXISTS contact_tags (
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (contact_id, tag_id)
);
ALTER TABLE contact_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Contact Tags isolation" ON contact_tags FOR ALL USING (
  contact_id IN (SELECT id FROM contacts WHERE workspace_id = (SELECT workspace_id FROM users WHERE users.id = auth.uid()))
);

-- 4. Deals Table (Sales Pipeline)
CREATE TABLE IF NOT EXISTS deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES users(id),
  title text NOT NULL,
  value numeric DEFAULT 0,
  stage text DEFAULT 'prospect', -- 'prospect', 'negotiation', 'won', 'lost'
  expected_close_date date,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deals isolation" ON deals FOR ALL USING (workspace_id = (SELECT workspace_id FROM users WHERE users.id = auth.uid()));

-- 5. Notes Table (Internal comments for CRM)
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  entity_type text NOT NULL, -- 'contact', 'deal', 'conversation'
  entity_id uuid NOT NULL,
  author_id uuid REFERENCES users(id),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Notes isolation" ON notes FOR ALL USING (workspace_id = (SELECT workspace_id FROM users WHERE users.id = auth.uid()));
