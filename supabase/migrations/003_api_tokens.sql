-- API Tokens table for workspace API access
CREATE TABLE IF NOT EXISTS api_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  token text NOT NULL UNIQUE,
  type text NOT NULL DEFAULT 'omnichannel', -- 'omnichannel' | 'chatbot'
  last_used_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE api_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage api_tokens" ON api_tokens
  USING (true) WITH CHECK (true);
