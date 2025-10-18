import sqlite3, json, random
from pathlib import Path
from datetime import datetime, timedelta

BASE = Path(__file__).parent
DB_PATH = BASE / "store.db"
PRODUCTS_PATH = BASE / "produkter.json"

# --- last produkter ---
with open(PRODUCTS_PATH, "r", encoding="utf-8") as f:
    products = json.load(f)

if isinstance(products, dict) and "products" in products:
    products = products["products"]

product_ids = [int(p["productId"]) for p in products]
print(f"Laster {len(product_ids)} produkter ...")

# --- lag database ---
con = sqlite3.connect(DB_PATH)
cur = con.cursor()

cur.executescript("""
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS purchases;
DROP TABLE IF EXISTS purchase_items;

CREATE TABLE customers (
    customer_id TEXT PRIMARY KEY,
    name TEXT
);

CREATE TABLE purchases (
    purchase_id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id TEXT,
    ts TEXT
);

CREATE TABLE purchase_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_id INTEGER,
    product_id INTEGER
);
""")

# --- generer kunder og kjøp ---
NUM_CUSTOMERS = 5       # du kan endre dette
NUM_PURCHASES = 200     # totalt antall kjøp som genereres

customers = [
    {"customer_id": f"c{i+1}", "name": f"Kunde {i+1}"}
    for i in range(NUM_CUSTOMERS)
]

cur.executemany("INSERT INTO customers VALUES (:customer_id, :name)", customers)

now = datetime.utcnow()
for _ in range(NUM_PURCHASES):
    c = random.choice(customers)
    ts = now - timedelta(days=random.randint(0, 120))
    cur.execute("INSERT INTO purchases (customer_id, ts) VALUES (?, ?)", (c["customer_id"], ts.isoformat()))
    purchase_id = cur.lastrowid

    # 1–6 produkter per kjøp
    for pid in random.sample(product_ids, k=random.randint(1, 6)):
        cur.execute("INSERT INTO purchase_items (purchase_id, product_id) VALUES (?, ?)", (purchase_id, pid))

con.commit()
con.close()

print(f"✅ Opprettet {DB_PATH} med {NUM_CUSTOMERS} kunder og {NUM_PURCHASES} kjøp.")
