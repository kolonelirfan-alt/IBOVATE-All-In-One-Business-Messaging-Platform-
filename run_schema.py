import urllib.parse
import subprocess
import sys

# URL encode the password which contains a '#' character
password = urllib.parse.quote_plus("#Profit1milyar")
conn_str = f"postgresql://postgres:{password}@db.qsaxilxpdbzkvptyjtld.supabase.co:5432/postgres"

# Read the SQL file
sql_file = "supabase/migrations/001_initial_schema.sql"
with open(sql_file, "r") as f:
    sql_script = f.read()

try:
    import psycopg2
except ImportError:
    print("Installing psycopg2-binary...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "psycopg2-binary"])
    import psycopg2

print("Connecting to the database...")
try:
    conn = psycopg2.connect(conn_str)
    conn.autocommit = True
    cur = conn.cursor()
    print("Executing schema...")
    cur.execute(sql_script)
    print("Schema applied successfully!")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error applying schema: {e}")
