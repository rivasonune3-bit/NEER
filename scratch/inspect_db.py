import sqlite3
import json

conn = sqlite3.connect('data/neer.db')
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
tables = [row['name'] for row in cursor.fetchall()]
print("=== TABLES IN data/neer.db ===")
print(tables)

print("\n=== TABLE DETAILS ===")
for t in tables:
    cursor.execute(f'SELECT COUNT(*) as cnt FROM "{t}"')
    cnt = cursor.fetchone()['cnt']
    cursor.execute(f'PRAGMA table_info("{t}")')
    cols = [f"{col['name']} ({col['type']})" for col in cursor.fetchall()]
    print(f"\nTABLE: {t} | ROWS: {cnt}")
    print("  Columns:", ", ".join(cols))
    if cnt > 0:
        cursor.execute(f'SELECT * FROM "{t}" LIMIT 3')
        samples = [dict(row) for row in cursor.fetchall()]
        print("  Sample rows:")
        for s in samples:
            # truncate long values for readability
            trimmed = {k: (v if not isinstance(v, str) or len(v) < 60 else v[:57] + '...') for k, v in s.items()}
            print("   ", json.dumps(trimmed, default=str))

conn.close()
