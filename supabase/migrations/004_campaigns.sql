-- Migration 004: Campaigns & Broadcast System

CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  template_id uuid REFERENCES templates(id),
  status text DEFAULT 'draft', -- draft | scheduled | processing | completed | failed
  recipient_count int DEFAULT 0,
  sent_count int DEFAULT 0,
  failed_count int DEFAULT 0,
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Protect table with RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaigns isolation" ON campaigns FOR ALL 
USING (workspace_id = (SELECT workspace_id FROM users WHERE users.id = auth.uid()));

-- Also create policy for Service Role to bypass
CREATE POLICY "Service role can manage campaigns" ON campaigns
USING (true) WITH CHECK (true);
