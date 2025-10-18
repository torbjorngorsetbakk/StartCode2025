from pathlib import Path
from flask import Flask, jsonify, render_template, send_from_directory
import json
import random
import sqlite3
from contextlib import closing
from collections import Counter, defaultdict
from datetime import datetime, timedelta
import math
from collections import Counter, defaultdict

# --- legg til øverst i app.py ---
import math
from collections import Counter, defaultdict

BASE = Path(__file__).parent
app = Flask(__name__, static_folder="static", template_folder="templates")

# --- last produkter
PRODUCTS_PATH = BASE / "produkter.json"
with open(PRODUCTS_PATH, "r", encoding="utf-8") as f:
    products_data = json.load(f)
# products_data kan være liste eller dict med key 'products'
if isinstance(products_data, dict) and "products" in products_data:
    products = products_data["products"]
else:
    products = products_data

RECIPES_PATH = BASE / "recipes.json"
with open(RECIPES_PATH, "r", encoding="utf-8") as f:
    RECIPES = json.load(f)
product_by_id = {int(p["productId"]): p for p in products}

# Map productId -> tags (flere tags per produkt)
product_tags = {int(p["productId"]): [t.lower() for t in p.get("tags", [])] for p in products}
# Omvendt: tag -> hvilke productIds som kan oppfylle den
tag_to_products = defaultdict(list)
for pid, tags in product_tags.items():
    for t in tags:
        tag_to_products[t].append(pid)

def estimate_pantry_for_customer(customer_id: str, decay_per_day=0.02):
    """
    Enkel pantry-estimering basert på tidligere kjøp + tidsforfall.
    Returnerer dict[tag] -> 'kvantitetspoeng'
    """
    hist = customer_history(customer_id)  # bruker eksisterende funksjon hos deg
    if not hist:
        return {}

    now = datetime.utcnow()
    pantry = Counter()
    for h in hist:
        ts = datetime.fromisoformat(h["ts"])
        days = max(0, (now - ts).days)
        decay = (1.0 - decay_per_day) ** days  # enkel eksponentiell nedvekting
        for pid in h["product_ids"]:
            for t in product_tags.get(pid, []):
                # antatt 1 enhet per kjøpt vare; skaler gjerne per pakningsstørrelse senere
                pantry[t] += 1.0 * decay

    # liten “svinn”-klipp: dropp nesten null
    for k in list(pantry.keys()):
        if pantry[k] < 0.2:
            del pantry[k]
    return dict(pantry)

def user_preference_score(customer_id: str):
    """Bygg enkel preferansescore per tag fra historikk (all time, mild decay)."""
    hist = customer_history(customer_id)
    prefs = Counter()
    now = datetime.utcnow()
    for h in hist:
        ts = datetime.fromisoformat(h["ts"])
        days = max(1, (now - ts).days)
        w = 1.0 / (1 + 0.01 * days)  # svakere jo eldre
        for pid in h["product_ids"]:
            for t in product_tags.get(pid, []):
                prefs[t] += w
    # normaliser til [0,1]
    if prefs:
        m = max(prefs.values())
        for k in prefs: prefs[k] /= max(1e-9, m)
    return dict(prefs)

def score_recipe_for_customer(recipe: dict, customer_id: str):
    pantry = estimate_pantry_for_customer(customer_id)
    prefs  = user_preference_score(customer_id)

    # pantry-overlapp og mangler
    total_need = 0.0
    covered    = 0.0
    missing_tags = []
    for ing in recipe["ingredients"]:
        tag = ing["tag"].lower()
        need = 1.0  # 1 enhet pr. ingrediens (enkelt). Kan kobles til qty senere.
        total_need += need
        have = pantry.get(tag, 0.0)
        covered += min(have, need)
        if have < need:
            missing_tags.append(tag)

    overlap = 0.0 if total_need == 0 else covered / total_need
    missing_fraction = 0.0 if total_need == 0 else (len(missing_tags) / len(recipe["ingredients"]))

    # brukerpreferanser: gjennomsnitt av tag-preferanser for ingredienser
    pref_score = 0.0
    if recipe["ingredients"]:
        pref_score = sum(prefs.get(ing["tag"].lower(), 0.0) for ing in recipe["ingredients"]) / len(recipe["ingredients"])

    # global popularitet (fallback via produktkjøp)
    global_tag_pop = Counter()
    for pid, tags in product_tags.items():
        for t in tags: global_tag_pop[t] += 1
    glob = sum(global_tag_pop.get(ing["tag"].lower(), 0) for ing in recipe["ingredients"])
    glob = glob / max(1, len(recipe["ingredients"]))

    score = 2.0 * overlap + 1.0 * pref_score + 0.2 * (glob / (max(global_tag_pop.values() or [1])) ) - 0.5 * missing_fraction
    return score, overlap, missing_tags

def make_shopping_list(missing_tags):
    """
    Lag handleliste ved å mappe tags -> forslag til konkrete productId (første match).
    Du kan gjøre smartere valg senere (pris, merke, brukerpreferanse).
    """
    items = []
    for tag in missing_tags:
        candidates = tag_to_products.get(tag, [])
        if candidates:
            items.append({"productId": candidates[0], "tag": tag})
        else:
            items.append({"productId": None, "tag": tag})  # ikke funnet – vis tag som “fri tekst”
    return items

@app.route("/api/mealplan")
def api_mealplan():
    """
    Eksempel: /api/mealplan?customer_id=c1&intent=kyllingrett
    Returnerer beste oppskrift + handleliste som bruker opp rester.
    """
    from flask import request, jsonify
    cid = request.args.get("customer_id")
    intent = (request.args.get("intent") or "").lower().strip()
    if not cid or not intent:
        return jsonify({"error": "customer_id og intent er påkrevd"}), 400

    # filtrer oppskrifter på intent
    candidates = [r for r in RECIPES if intent in [x.lower() for x in r.get("intents", [])]]
    if not candidates:
        return jsonify({"error": f"Ingen oppskrifter for intent '{intent}'"}), 404

    # score alle, velg beste
    scored = []
    for r in candidates:
        s, overlap, missing = score_recipe_for_customer(r, cid)
        scored.append((s, overlap, r, missing))
    scored.sort(key=lambda x: x[0], reverse=True)
    best_score, overlap, recipe, missing = scored[0]

    shopping_list = make_shopping_list(missing)
    return jsonify({
        "intent": intent,
        "customer_id": cid,
        "recipe": {"id": recipe["id"], "name": recipe["name"]},
        "score": round(best_score, 3),
        "pantry_overlap": round(overlap, 3),
        "missing_ingredients": missing,
        "shopping_list": shopping_list
    })






# for enkel validering og presentasjon
product_by_id = {p["productId"]: p for p in products}
all_product_ids = list(product_by_id.keys())

# --- generer falske kunder og kjøp
FIRST_NAMES = ["Ola","Kari"]
LAST_NAMES  = ["Hansen","Berg"]

def make_customer_name(i):
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)} #{i}"

NUM_CUSTOMERS = 2
NUM_PURCHASES = 500

customers = [{"customer_id": f"c{i+1}", "name": make_customer_name(i+1)} for i in range(NUM_CUSTOMERS)]

# purchases = list av dict: {id, customer_id, product_ids, ts}
purchases = []

def random_ts_within_days(days=365):
    now = datetime.utcnow()
    delta = timedelta(days=random.randint(0, days), seconds=random.randint(0, 86400))
    return (now - delta).isoformat()

for i in range(NUM_PURCHASES):
    cid = random.choice(customers)["customer_id"]
    # hver purchase har 1-6 produkter
    prods = [random.choice(all_product_ids) for _ in range(random.randint(1, 6))]
    purchases.append({
        "purchase_id": f"p{i+1}",
        "customer_id": cid,
        "product_ids": prods,
        "ts": random_ts_within_days(180)  # siste 180 dager
    })

# --- hjelpefunksjoner for stats
from collections import Counter, defaultdict

def top_products_overall(n=10):
    c = Counter()
    for p in purchases:
        c.update(p["product_ids"])
    return c.most_common(n)

def customer_history(customer_id):
    hist = [p for p in purchases if p["customer_id"] == customer_id]
    hist_sorted = sorted(hist, key=lambda x: x["ts"], reverse=True)
    return hist_sorted

def customer_top_products(customer_id, n=5):
    c = Counter()
    for p in customer_history(customer_id):
        c.update(p["product_ids"])
    return c.most_common(n)

# --- API endpoints
@app.route("/api/customers")
def api_customers():
    return jsonify(customers)

@app.route("/api/purchases")
def api_purchases():
    # returner alle purchases (kan pagineres senere)
    return jsonify(purchases)

@app.route("/api/customer/<customer_id>/history")
def api_customer_history(customer_id):
    return jsonify(customer_history(customer_id))

@app.route("/api/customer/<customer_id>/top")
def api_customer_top(customer_id):
    return jsonify(customer_top_products(customer_id))

@app.route("/api/top-products")
def api_top_products():
    return jsonify(top_products_overall(100))

# frontend
@app.route("/")
def index():
    return render_template("index.html")

# serve static (Flask gjør dette automatisk fra /static, men denne ruten er ok)
@app.route("/static/<path:p>")
def static_files(p):
    return send_from_directory(BASE / "static", p)


DB_PATH = BASE / "store.db"

def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with closing(db()) as conn, conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS customers(
            customer_id TEXT PRIMARY KEY,
            name TEXT
        );
        CREATE TABLE IF NOT EXISTS products(
            product_id INTEGER PRIMARY KEY,
            name TEXT
        );
        CREATE TABLE IF NOT EXISTS purchases(
            purchase_id TEXT PRIMARY KEY,
            customer_id TEXT,
            ts TEXT
        );
        CREATE TABLE IF NOT EXISTS purchase_items(
            purchase_id TEXT,
            product_id INTEGER
        );
        """)
init_db()

# seed: legg inn genererte kunder/kjøp i db ved oppstart
def seed_if_empty():
    with closing(db()) as conn, conn:
        cur = conn.execute("SELECT COUNT(*) AS c FROM customers")
        if cur.fetchone()["c"] > 0:
            return
        # kunder
        for c in customers:
            conn.execute("INSERT INTO customers(customer_id,name) VALUES(?,?)",(c["customer_id"], c["name"]))
        # produkter (bare id og en enkel name hvis mangler)
        for pid, p in product_by_id.items():
            conn.execute("INSERT OR IGNORE INTO products(product_id,name) VALUES(?,?)",(pid, p.get("name", f"Produkt {pid}")))
        # purchases + items
        for p in purchases:
            conn.execute("INSERT INTO purchases(purchase_id,customer_id,ts) VALUES(?,?,?)",(p["purchase_id"], p["customer_id"], p["ts"]))
            for pid in p["product_ids"]:
                conn.execute("INSERT INTO purchase_items(purchase_id,product_id) VALUES(?,?)",(p["purchase_id"], pid))
seed_if_empty()

def get_customer_history(customer_id: str):
    with closing(db()) as conn:
        rows = conn.execute("""
        SELECT p.purchase_id, p.ts, group_concat(pi.product_id) AS items
        FROM purchases p
        JOIN purchase_items pi ON pi.purchase_id = p.purchase_id
        WHERE p.customer_id = ?
        GROUP BY p.purchase_id
        ORDER BY p.ts DESC
        """, (customer_id,)).fetchall()
    result = []
    for r in rows:
        items = [int(x) for x in r["items"].split(",")]
        result.append({"purchase_id": r["purchase_id"], "ts": r["ts"], "product_ids": items})
    return result

# enkel co-occurrence med tidsvekt
def recommend_for_customer(customer_id: str, basket: list[int], top_k: int = 10, horizon_days: int = 180):
    hist = get_customer_history(customer_id)
    cutoff = datetime.utcnow() - timedelta(days=horizon_days)
    # bygg co-occur matrise
    co = Counter()
    last_seen = {}  # siste gang kunden kjøpte hvert produkt
    for h in hist:
        ts = datetime.fromisoformat(h["ts"])
        if ts < cutoff: 
            continue
        items = set(h["product_ids"])
        for pid in items:
            last_seen[pid] = max(last_seen.get(pid, datetime.min), ts)
        # for hver vare i handlekurv, øk score for andre som kom samtidig
        for a in items:
            for b in items:
                if a == b: continue
                co[(a,b)] += 1

    # lag en kundepreferanse (hva kunden liker)
    prefs = Counter()
    for (a,b), c in co.items():
        prefs[b] += c

    # basekandidater: ting som samkjøpes med det som ligger i basket
    cand = Counter()
    basket_set = set(basket)
    for (a,b), c in co.items():
        if a in basket_set and b not in basket_set:
            cand[b] += c

    # tidvekt: nyere varer får litt boost
    now = datetime.utcnow()
    for pid, when in last_seen.items():
        age_days = max(1, (now - when).days)
        boost = 1.0 / (1 + 0.02*age_days)  # svak nedvekting over tid
        prefs[pid] *= boost
        cand[pid] *= boost

    # kombiner kandidater (co ↑ + kundepref ↑)
    score = Counter()
    for pid, s in cand.items():
        score[pid] = s + 0.5 * prefs[pid]

    # ekskluder det som allerede er i basket
    for pid in list(score):
        if pid in basket_set:
            del score[pid]

    # returner topp K som [pid, score]
    return [[pid, round(sc,2)] for pid, sc in score.most_common(top_k)]

@app.route("/api/recommendations")
def api_reco():
    from flask import request
    customer_id = request.args.get("customer_id")
    basket_arg = request.args.get("basket","")
    basket = [int(x) for x in basket_arg.split(",") if x.strip().isdigit()]
    recos = recommend_for_customer(customer_id, basket, top_k=10)
    return jsonify(recos)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
