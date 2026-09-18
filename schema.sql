PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS questions (
 id INTEGER PRIMARY KEY,
 source_key TEXT NOT NULL UNIQUE,
 banca TEXT NOT NULL,
 concurso TEXT NOT NULL,
 cargo TEXT NOT NULL,
 ano INTEGER NOT NULL,
 data_prova TEXT NOT NULL DEFAULT '',
 prova TEXT NOT NULL,
 numero TEXT NOT NULL,
 pagina TEXT,
 macro TEXT NOT NULL,
 micro TEXT NOT NULL,
 tipo TEXT NOT NULL DEFAULT 'AE' CHECK(tipo IN ('AE','CE')),
 enunciado TEXT NOT NULL,
 alternativa_a TEXT NOT NULL DEFAULT '',
 alternativa_b TEXT NOT NULL DEFAULT '',
 alternativa_c TEXT NOT NULL DEFAULT '',
 alternativa_d TEXT NOT NULL DEFAULT '',
 alternativa_e TEXT NOT NULL DEFAULT '',
 gabarito TEXT NOT NULL CHECK(gabarito IN ('A','B','C','D','E','ANULADA')),
 status TEXT NOT NULL CHECK(status IN ('VALIDA','ANULADA')),
 explicacao TEXT NOT NULL DEFAULT '',
 fonte TEXT NOT NULL,
 imagem TEXT NOT NULL DEFAULT '',
 arquivo_pdf TEXT NOT NULL DEFAULT '',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_questions_filters ON questions(macro,micro,ano,banca);
CREATE TABLE IF NOT EXISTS study_sessions (
 id INTEGER PRIMARY KEY,
 name TEXT NOT NULL DEFAULT '',
 kind TEXT NOT NULL DEFAULT 'estudo',
 started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 finished_at TEXT
);
CREATE TABLE IF NOT EXISTS session_questions (
 session_id INTEGER NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
 question_id INTEGER NOT NULL REFERENCES questions(id),
 position INTEGER NOT NULL,
 PRIMARY KEY(session_id,question_id),
 UNIQUE(session_id,position)
);
CREATE TABLE IF NOT EXISTS attempts (
 id INTEGER PRIMARY KEY,
 session_id INTEGER NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
 question_id INTEGER NOT NULL REFERENCES questions(id),
 answer TEXT NOT NULL CHECK(answer IN ('A','B','C','D','E')),
 correct INTEGER NOT NULL CHECK(correct IN (0,1)),
 seconds INTEGER NOT NULL CHECK(seconds BETWEEN 0 AND 86400),
 doubt INTEGER NOT NULL DEFAULT 0 CHECK(doubt IN (0,1)),
 answered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(session_id,question_id)
);
CREATE INDEX IF NOT EXISTS idx_attempts_question ON attempts(question_id,answered_at);
CREATE TABLE IF NOT EXISTS review_flags (
 question_id INTEGER PRIMARY KEY REFERENCES questions(id) ON DELETE CASCADE,
 marked INTEGER NOT NULL DEFAULT 0 CHECK(marked IN (0,1))
);
CREATE TABLE IF NOT EXISTS flashcards (
 id INTEGER PRIMARY KEY,
 question_id INTEGER REFERENCES questions(id) ON DELETE SET NULL,
 front TEXT NOT NULL,
 back TEXT NOT NULL,
 due_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 interval_days INTEGER NOT NULL DEFAULT 0,
 repetitions INTEGER NOT NULL DEFAULT 0,
 reviewed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_flashcards_due ON flashcards(due_at);
CREATE TABLE IF NOT EXISTS simulated_answers (
 session_id INTEGER NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
 question_id INTEGER NOT NULL REFERENCES questions(id),
 answer TEXT NOT NULL CHECK(answer IN ('A','B','C','D','E')),
 seconds INTEGER NOT NULL CHECK(seconds BETWEEN 0 AND 86400),
 doubt INTEGER NOT NULL DEFAULT 0 CHECK(doubt IN (0,1)),
 answered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(session_id,question_id)
);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
