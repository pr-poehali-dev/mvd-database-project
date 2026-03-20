"""CRUD для приказов МВД"""
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
                SELECT id, number, date, title, author, type, signed
                FROM {SCHEMA}.orders ORDER BY created_at DESC
            """)
            rows = cur.fetchall()
            cols = ["id","number","date","title","author","type","signed"]
            return cors([dict(zip(cols, r)) for r in rows])

        elif method == "POST":
            d = body
            cur.execute(f"""
                INSERT INTO {SCHEMA}.orders (id, number, date, title, author, type, signed)
                VALUES (%s,%s,%s,%s,%s,%s,%s)
            """, (d["id"], d["number"], d["date"], d["title"], d["author"], d["type"], d["signed"]))
            conn.commit()
            return cors({"ok": True})

        elif method == "PUT":
            d = body
            cur.execute(f"""
                UPDATE {SCHEMA}.orders SET
                number=%s, date=%s, title=%s, author=%s, type=%s, signed=%s
                WHERE id=%s
            """, (d["number"], d["date"], d["title"], d["author"], d["type"], d["signed"], d["id"]))
            conn.commit()
            return cors({"ok": True})

        elif method == "DELETE":
            cur.execute(f"DELETE FROM {SCHEMA}.orders WHERE id=%s", (params.get("id"),))
            conn.commit()
            return cors({"ok": True})

    finally:
        cur.close()
        conn.close()

    return cors({"error": "Unknown method"}, 400)
