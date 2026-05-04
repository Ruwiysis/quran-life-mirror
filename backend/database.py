import sqlite3

DB_PATH = "./journal.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    db = get_db()
    db.execute("""
        CREATE TABLE IF NOT EXISTS journal (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            situation     TEXT NOT NULL,
            verse_key     TEXT NOT NULL,
            arabic_text   TEXT NOT NULL,
            translation   TEXT NOT NULL,
            reflection    TEXT NOT NULL,
            personal_note TEXT DEFAULT '',
            mood          TEXT DEFAULT 'reflective',
            created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    # Add columns if upgrading from old db
    try:
        db.execute("ALTER TABLE journal ADD COLUMN personal_note TEXT DEFAULT ''")
    except: pass
    try:
        db.execute("ALTER TABLE journal ADD COLUMN mood TEXT DEFAULT 'reflective'")
    except: pass
    db.execute("""
        CREATE TABLE IF NOT EXISTS bookmarks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            verse_key TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(verse_key)
        )
    """)
    db.commit()
    db.close()

