import sqlite3
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent

DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

DB_PATH = DATA_DIR / "jemg_score.db"


def get_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def coluna_existe(cursor, tabela, coluna):
    colunas = cursor.execute(
        f"PRAGMA table_info({tabela})"
    ).fetchall()

    return any(
        coluna_atual["name"] == coluna
        for coluna_atual in colunas
    )


def adicionar_coluna(cursor, tabela, coluna, definicao):
    if not coluna_existe(cursor, tabela, coluna):
        cursor.execute(
            f"ALTER TABLE {tabela} ADD COLUMN {coluna} {definicao}"
        )


def init_database():

    connection = get_connection()
    cursor = connection.cursor()

    # =====================================================
    # COMPETIÇÕES
    # =====================================================

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS competicoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            ano INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'Ativa'
        )
    """)

    adicionar_coluna(
        cursor,
        "competicoes",
        "status",
        "TEXT NOT NULL DEFAULT 'Ativa'"
    )

    # =====================================================
    # MODALIDADES
    # =====================================================

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS modalidades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            competicao_id INTEGER NOT NULL,
            nome TEXT NOT NULL,
            modulo TEXT NOT NULL DEFAULT 'Módulo 1',
            genero TEXT NOT NULL DEFAULT 'Masculino',
            formato TEXT NOT NULL DEFAULT 'Grupos + Mata-mata',
            quadras INTEGER NOT NULL DEFAULT 1,

            FOREIGN KEY (competicao_id)
                REFERENCES competicoes(id)
        )
    """)

    adicionar_coluna(
        cursor,
        "modalidades",
        "modulo",
        "TEXT NOT NULL DEFAULT 'Módulo 1'"
    )

    adicionar_coluna(
        cursor,
        "modalidades",
        "genero",
        "TEXT NOT NULL DEFAULT 'Masculino'"
    )

    adicionar_coluna(
        cursor,
        "modalidades",
        "formato",
        "TEXT NOT NULL DEFAULT 'Grupos + Mata-mata'"
    )
    adicionar_coluna(
        cursor,
        "modalidades",
        "quadras",
        "INTEGER NOT NULL DEFAULT 1"
    )

    # =====================================================
    # ESCOLAS
    # =====================================================

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS escolas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            competicao_id INTEGER NOT NULL,
            nome TEXT NOT NULL,
            cidade TEXT,
            status TEXT NOT NULL DEFAULT 'Ativa',

            FOREIGN KEY (competicao_id)
                REFERENCES competicoes(id)
        )
    """)

    adicionar_coluna(
        cursor,
        "escolas",
        "cidade",
        "TEXT"
    )

    adicionar_coluna(
        cursor,
        "escolas",
        "status",
        "TEXT NOT NULL DEFAULT 'Ativa'"
    )

    # =====================================================
    # EQUIPES
    # =====================================================

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS equipes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            competicao_id INTEGER NOT NULL,
            modalidade_id INTEGER NOT NULL,
            escola_id INTEGER,
            nome TEXT NOT NULL,

            FOREIGN KEY (competicao_id)
                REFERENCES competicoes(id),

            FOREIGN KEY (modalidade_id)
                REFERENCES modalidades(id),

            FOREIGN KEY (escola_id)
                REFERENCES escolas(id)
        )
    """)

    # CORREÇÃO DE BANCO ANTIGO

    adicionar_coluna(
        cursor,
        "equipes",
        "competicao_id",
        "INTEGER"
    )

    adicionar_coluna(
        cursor,
        "equipes",
        "modalidade_id",
        "INTEGER"
    )

    adicionar_coluna(
        cursor,
        "equipes",
        "escola_id",
        "INTEGER"
    )

    adicionar_coluna(
        cursor,
        "equipes",
        "nome",
        "TEXT DEFAULT 'Equipe'"
    )

    # =====================================================
    # PARTIDAS
    # =====================================================

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS partidas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            modalidade_id INTEGER NOT NULL,
            equipe_a_id INTEGER,
            equipe_b_id INTEGER,
            data TEXT,
            horario TEXT,
            local TEXT,
            fase TEXT,
            grupo TEXT,
            placar_a INTEGER,
            placar_b INTEGER,
            parciais TEXT,
            status TEXT DEFAULT 'Agendada',

            FOREIGN KEY (modalidade_id)
                REFERENCES modalidades(id),

            FOREIGN KEY (equipe_a_id)
                REFERENCES equipes(id),

            FOREIGN KEY (equipe_b_id)
                REFERENCES equipes(id)
        )
    """)

    adicionar_coluna(
        cursor,
        "partidas",
        "data",
        "TEXT"
    )

    adicionar_coluna(
        cursor,
        "partidas",
        "horario",
        "TEXT"
    )

    adicionar_coluna(
        cursor,
        "partidas",
        "local",
        "TEXT"
    )

    adicionar_coluna(
        cursor,
        "partidas",
        "fase",
        "TEXT"
    )

    adicionar_coluna(
        cursor,
        "partidas",
        "grupo",
        "TEXT"
    )

    adicionar_coluna(
        cursor,
        "partidas",
        "placar_a",
        "INTEGER"
    )

    adicionar_coluna(
        cursor,
        "partidas",
        "placar_b",
        "INTEGER"
    )

    adicionar_coluna(
        cursor,
        "partidas",
        "status",
        "TEXT DEFAULT 'Agendada'"
    )

    # =====================================================
    # FINALIZAÇÃO
    # =====================================================

    adicionar_coluna(
        cursor,
        "partidas",
        "parciais",
        "TEXT"
    )

    connection.commit()
    connection.close()