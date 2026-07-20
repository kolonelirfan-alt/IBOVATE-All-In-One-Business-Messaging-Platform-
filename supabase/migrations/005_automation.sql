-- Migration 005: Bot & Automation Rules

CREATE TABLE IF NOT EXISTS automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  trigger_type text NOT NULL, -- 'exact_match' | 'contains' | 'first_message' | 'outside_hours'
  trigger_value text,
  action_type text NOT NULL, -- 'send_message' | 'assign_agent' | 'add_tag' | 'resolve'
  action_value text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Automation Rules isolation" ON automation_rules FOR ALL 
USING (workspace_id = (SELECT workspace_id FROM users WHERE users.id = auth.uid()));

CREATE POLICY "Service role can manage automation_rules" ON automation_rules
USING (true) WITH CHECK (true);
