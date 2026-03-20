
CREATE TABLE t_p96026353_mvd_database_project.cases (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL,
  date TEXT NOT NULL,
  category TEXT DEFAULT '',
  article TEXT DEFAULT '',
  suspect TEXT NOT NULL,
  suspect_dob TEXT DEFAULT '',
  suspect_address TEXT DEFAULT '',
  suspect_photo TEXT DEFAULT '',
  investigator TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Активное',
  description TEXT NOT NULL,
  materials TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE t_p96026353_mvd_database_project.orders (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL,
  date TEXT NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Внутренний',
  signed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE t_p96026353_mvd_database_project.staff (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rank TEXT NOT NULL,
  position TEXT NOT NULL,
  department TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  since TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
