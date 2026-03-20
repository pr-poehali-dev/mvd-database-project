"""CRUD для личного состава МВД"""
import json, os, psycopg2

SCHEMA = "t_p96026353_mvd_database_project"

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def cors(body, status=200):
    return {
        "statusCode": status,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Content-Type": "application/json",
        },
        "body": json.dumps(body, ensure_ascii=False),
    }

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return cors("")

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    body = json.loads(event["body"]) if event.get("body") else {}

    conn = get_conn()
    cur = conn.cursor()

    try:
        if method == "GET":
            cur.execute(f"""
                SELECT id, name, rank, position, department, phone, since
                FROM {SCHEMA}.staff ORDER BY created_at DESC
            """)
            rows = cur.fetchall()
            cols = ["id","name","rank","position","department","phone","since"]
            return cors([dict(zip(cols, r)) for r in rows])

        elif method == "POST":
            d = body
            cur.execute(f"""
                INSERT INTO {SCHEMA}.staff (id, name, rank, position, department, phone, since)
                VALUES (%s,%s,%s,%s,%s,%s,%s)
            """, (d["id"], d["name"], d["rank"], d["position"],
                  d.get("department",""), d.get("phone",""), d["since"]))
            conn.commit()
            return cors({"ok": True})

        elif method == "PUT":
            d = body
            cur.execute(f"""
                UPDATE {SCHEMA}.staff SET
                name=%s, rank=%s, position=%s, department=%s, phone=%s, since=%s
                WHERE id=%s
            """, (d["name"], d["rank"], d["position"], d.get("department",""),
                  d.get("phone",""), d["since"], d["id"]))
            conn.commit()
            return cors({"ok": True})

        elif method == "DELETE":
            cur.execute(f"DELETE FROM {SCHEMA}.staff WHERE id=%s", (params.get("id"),))
            conn.commit()
            return cors({"ok": True})

    finally:
        cur.close()
        conn.close()

    return cors({"error": "Unknown method"}, 400)
