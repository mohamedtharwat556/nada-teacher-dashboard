-- Create a single table to store the JSON data blocks
CREATE TABLE store (
  id text PRIMARY KEY,
  value jsonb NOT NULL
);

-- Note: Ensure Row Level Security (RLS) is disabled for this table if you want the Node.js server to read/write freely, 
-- or leave RLS on but allow the service role / anon key to access it.
-- For a quick start:
ALTER TABLE store ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for all users" ON store FOR ALL USING (true) WITH CHECK (true);
