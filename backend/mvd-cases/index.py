"""CRUD для уголовных дел МВД"""
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
                SELECT id, number, date, category, article, suspect, suspect_dob,
                       suspect_address, suspect_photo, investigator, status, description, materials
                FROM {SCHEMA}.cases ORDER BY created_at DESC
            """)
            rows = cur.fetchall()
            cols = ["id","number","date","category","article","suspect","suspectDob",
                    "suspectAddress","suspectPhoto","investigator","status","description","materials"]
            return cors([dict(zip(cols, r)) for r in rows])

        elif method == "POST":
            d = body
            cur.execute(f"""
                INSERT INTO {SCHEMA}.cases
                (id, number, date, category, article, suspect, suspect_dob, suspect_address,
                 suspect_photo, investigator, status, description, materials)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, (d["id"], d["number"], d["date"], d.get("category",""),
                  d.get("article",""), d["suspect"], d.get("suspectDob",""),
                  d.get("suspectAddress",""), d.get("suspectPhoto",""),
                  d["investigator"], d["status"], d["description"], d.get("materials","")))
            conn.commit()
            return cors({"ok": True})

        elif method == "PUT":
            d = body
            cur.execute(f"""
                UPDATE {SCHEMA}.cases SET
                number=%s, date=%s, category=%s, article=%s, suspect=%s,
                suspect_dob=%s, suspect_address=%s, suspect_photo=%s,
                investigator=%s, status=%s, description=%s, materials=%s
                WHERE id=%s
            """, (d["number"], d["date"], d.get("category",""), d.get("article",""),
                  d["suspect"], d.get("suspectDob",""), d.get("suspectAddress",""),
                  d.get("suspectPhoto",""), d["investigator"], d["status"],
                  d["description"], d.get("materials",""), d["id"]))
            conn.commit()
            return cors({"ok": True})

        elif method == "DELETE":
            case_id = params.get("id")
            cur.execute(f"DELETE FROM {SCHEMA}.cases WHERE id=%s", (case_id,))
            conn.commit()
            return cors({"ok": True})

    finally:
        cur.close()
        conn.close()

    return cors({"error": "Unknown method"}, 400)
