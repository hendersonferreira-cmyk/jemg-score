from fastapi import FastAPI

from fastapi.responses import FileResponse

from fastapi.staticfiles import StaticFiles

from pydantic import BaseModel



from app.database import init_database, get_connection



app = FastAPI(title="JEMG Score")



init_database()



app.mount("/static", StaticFiles(directory="frontend"), name="static")





# =========================================================

# MODELOS

# =========================================================



class Competicao(BaseModel):

    nome: str

    ano: int





class Modalidade(BaseModel):

    competicao_id: int

    nome: str

    modulo: str

    genero: str

    formato: str

    quadras: int = 1





class Escola(BaseModel):

    competicao_id: int

    nome: str

    cidade: str





class Equipe(BaseModel):
    competicao_id: int
    modalidade_id: int
    escola_id: int
    nome: str


class Partida(BaseModel):
    modalidade_id: int
    equipe_a_id: int
    equipe_b_id: int
    data: str | None = None
    horario: str | None = None
    local: str | None = None
    fase: str | None = None
    grupo: str | None = None
    placar_a: int | None = None
    placar_b: int | None = None
    parciais: str | None = None
    status: str = "Agendada"

# =========================================================

# PÁGINA

# =========================================================



@app.get("/")

def home():

    return FileResponse("frontend/index.html")





@app.get("/api/status")

def status():

    return {

        "sistema": "JEMG Score",

        "status": "online",

        "modo": "offline/local"

    }





# =========================================================

# COMPETIÇÕES

# =========================================================



@app.get("/api/competicoes")

def listar_competicoes():

    connection = get_connection()



    try:

        rows = connection.execute("""

            SELECT

                id,

                nome,

                ano,

                status

            FROM competicoes

            ORDER BY ano DESC, nome

        """).fetchall()



        return [dict(row) for row in rows]



    finally:

        connection.close()





@app.post("/api/competicoes")

def criar_competicao(competicao: Competicao):

    connection = get_connection()



    try:

        nome = competicao.nome.strip()



        if not nome:

            return {

                "sucesso": False,

                "erro": "Informe o nome da competição."

            }



        cursor = connection.execute("""

            INSERT INTO competicoes

                (nome, ano, status)

            VALUES

                (?, ?, 'Ativa')

        """, (

            nome,

            competicao.ano

        ))



        connection.commit()



        return {

            "sucesso": True,

            "id": cursor.lastrowid,

            "nome": nome

        }



    except Exception as erro:

        connection.rollback()



        return {

            "sucesso": False,

            "erro": str(erro)

        }



    finally:

        connection.close()





@app.delete("/api/competicoes/{competicao_id}")

def excluir_competicao(competicao_id: int):

    connection = get_connection()



    try:

        competicao = connection.execute("""

            SELECT *

            FROM competicoes

            WHERE id = ?

        """, (competicao_id,)).fetchone()



        if not competicao:

            return {

                "sucesso": False,

                "erro": "Competição não encontrada."

            }



        nome_competicao = competicao["nome"]



        # -------------------------------------------------

        # Descobre modalidades da competição

        # -------------------------------------------------



        modalidades = connection.execute("""

            SELECT id

            FROM modalidades

            WHERE competicao_id = ?

        """, (competicao_id,)).fetchall()



        modalidade_ids = [

            row["id"]

            for row in modalidades

        ]



        # -------------------------------------------------

        # Descobre equipes da competição

        # -------------------------------------------------



        equipes = connection.execute("""

            SELECT id

            FROM equipes

            WHERE competicao_id = ?

        """, (competicao_id,)).fetchall()



        equipe_ids = [

            row["id"]

            for row in equipes

        ]



        # -------------------------------------------------

        # Apaga partidas

        # -------------------------------------------------



        if modalidade_ids:

            placeholders = ",".join(

                ["?"] * len(modalidade_ids)

            )



            connection.execute(

                f"""

                DELETE FROM partidas

                WHERE modalidade_id IN ({placeholders})

                """,

                modalidade_ids

            )



        if equipe_ids:

            placeholders = ",".join(

                ["?"] * len(equipe_ids)

            )



            connection.execute(

                f"""

                DELETE FROM partidas

                WHERE equipe_a_id IN ({placeholders})

                   OR equipe_b_id IN ({placeholders})

                """,

                equipe_ids + equipe_ids

            )



        # -------------------------------------------------

        # Apaga equipes

        # -------------------------------------------------



        colunas_equipes = connection.execute(

            "PRAGMA table_info(equipes)"

        ).fetchall()



        nomes_colunas = [

            coluna["name"]

            for coluna in colunas_equipes

        ]



        if "competicao_id" in nomes_colunas:

            connection.execute("""

                DELETE FROM equipes

                WHERE competicao_id = ?

            """, (competicao_id,))



        # Compatibilidade com banco antigo

        if "competicao" in nomes_colunas:

            connection.execute("""

                DELETE FROM equipes

                WHERE competicao = ?

            """, (nome_competicao,))



        # -------------------------------------------------

        # Apaga escolas

        # -------------------------------------------------



        connection.execute("""

            DELETE FROM escolas

            WHERE competicao_id = ?

        """, (competicao_id,))



        # -------------------------------------------------

        # Apaga modalidades

        # -------------------------------------------------



        connection.execute("""

            DELETE FROM modalidades

            WHERE competicao_id = ?

        """, (competicao_id,))



        # -------------------------------------------------

        # Apaga competição

        # -------------------------------------------------



        connection.execute("""

            DELETE FROM competicoes

            WHERE id = ?

        """, (competicao_id,))



        connection.commit()



        return {

            "sucesso": True,

            "mensagem": "Competição excluída com sucesso."

        }



    except Exception as erro:

        connection.rollback()



        return {

            "sucesso": False,

            "erro": str(erro)

        }



    finally:

        connection.close()





# =========================================================

# MODALIDADES

# =========================================================



@app.get("/api/modalidades")

def listar_modalidades(competicao_id: int):

    connection = get_connection()



    try:

        rows = connection.execute("""

            SELECT

                id,

                competicao_id,

                nome,

                modulo,

                genero,

                formato,
                quadras
            FROM modalidades

            WHERE competicao_id = ?

            ORDER BY nome

        """, (competicao_id,)).fetchall()



        return [dict(row) for row in rows]



    finally:

        connection.close()





@app.post("/api/modalidades")

def criar_modalidade(modalidade: Modalidade):

    connection = get_connection()



    try:

        nome = modalidade.nome.strip()



        if not nome:

            return {

                "sucesso": False,

                "erro": "Informe o nome da modalidade."

            }



        competicao = connection.execute("""

            SELECT id

            FROM competicoes

            WHERE id = ?

        """, (modalidade.competicao_id,)).fetchone()



        if not competicao:

            return {

                "sucesso": False,

                "erro": "Competição não encontrada."

            }

        if int(modalidade.quadras) < 1:

            return {

                "sucesso": False,

                "erro": "Quantidade de quadras inválida."

            }



        cursor = connection.execute("""

            INSERT INTO modalidades

                (

                    competicao_id,

                    nome,

                    modulo,

                    genero,

                    formato,
                    quadras
                )

            VALUES

                (?, ?, ?, ?, ?, ?)

        """, (

            modalidade.competicao_id,

            nome,

            modalidade.modulo,

            modalidade.genero,

            modalidade.formato,
            max(1, int(modalidade.quadras))
        ))



        connection.commit()



        return {

            "sucesso": True,

            "id": cursor.lastrowid

        }



    except Exception as erro:

        connection.rollback()



        return {

            "sucesso": False,

            "erro": str(erro)

        }



    finally:

        connection.close()





@app.delete("/api/modalidades/{modalidade_id}")

def excluir_modalidade(modalidade_id: int):

    connection = get_connection()



    try:

        modalidade = connection.execute("""

            SELECT *

            FROM modalidades

            WHERE id = ?

        """, (modalidade_id,)).fetchone()



        if not modalidade:

            return {

                "sucesso": False,

                "erro": "Modalidade não encontrada."

            }



        nome_modalidade = modalidade["nome"]



        # Busca equipes dessa modalidade

        colunas = connection.execute(

            "PRAGMA table_info(equipes)"

        ).fetchall()



        nomes_colunas = [

            coluna["name"]

            for coluna in colunas

        ]



        equipe_ids = []



        if "modalidade_id" in nomes_colunas:

            equipes = connection.execute("""

                SELECT id

                FROM equipes

                WHERE modalidade_id = ?

            """, (modalidade_id,)).fetchall()



            equipe_ids = [

                equipe["id"]

                for equipe in equipes

            ]



        # Apaga partidas da modalidade

        connection.execute("""

            DELETE FROM partidas

            WHERE modalidade_id = ?

        """, (modalidade_id,))



        # Apaga partidas das equipes

        if equipe_ids:

            placeholders = ",".join(

                ["?"] * len(equipe_ids)

            )



            connection.execute(

                f"""

                DELETE FROM partidas

                WHERE equipe_a_id IN ({placeholders})

                   OR equipe_b_id IN ({placeholders})

                """,

                equipe_ids + equipe_ids

            )



        # Apaga equipes pelo novo campo

        if "modalidade_id" in nomes_colunas:

            connection.execute("""

                DELETE FROM equipes

                WHERE modalidade_id = ?

            """, (modalidade_id,))



        # Compatibilidade com banco antigo

        if "modalidade" in nomes_colunas:

            connection.execute("""

                DELETE FROM equipes

                WHERE modalidade = ?

            """, (nome_modalidade,))



        # Apaga modalidade

        connection.execute("""

            DELETE FROM modalidades

            WHERE id = ?

        """, (modalidade_id,))



        connection.commit()



        return {

            "sucesso": True,

            "mensagem": "Modalidade excluída com sucesso."

        }



    except Exception as erro:

        connection.rollback()



        return {

            "sucesso": False,

            "erro": str(erro)

        }



    finally:

        connection.close()





# =========================================================

# ESCOLAS

# =========================================================



@app.get("/api/escolas")

def listar_escolas(competicao_id: int):

    connection = get_connection()



    try:

        rows = connection.execute("""

            SELECT

                id,

                competicao_id,

                nome,

                cidade,

                status

            FROM escolas

            WHERE competicao_id = ?

            ORDER BY nome

        """, (competicao_id,)).fetchall()



        return [dict(row) for row in rows]



    finally:

        connection.close()





@app.post("/api/escolas")

def criar_escola(escola: Escola):

    connection = get_connection()



    try:

        nome = escola.nome.strip()

        cidade = escola.cidade.strip()



        if not nome:

            return {

                "sucesso": False,

                "erro": "Informe o nome da escola."

            }



        cursor = connection.execute("""

            INSERT INTO escolas

                (

                    competicao_id,

                    nome,

                    cidade,

                    status

                )

            VALUES

                (?, ?, ?, 'Ativa')

        """, (

            escola.competicao_id,

            nome,

            cidade

        ))



        connection.commit()



        return {

            "sucesso": True,

            "id": cursor.lastrowid

        }



    except Exception as erro:

        connection.rollback()



        return {

            "sucesso": False,

            "erro": str(erro)

        }



    finally:

        connection.close()





@app.delete("/api/escolas/{escola_id}")

def excluir_escola(escola_id: int):

    connection = get_connection()



    try:

        escola = connection.execute("""

            SELECT *

            FROM escolas

            WHERE id = ?

        """, (escola_id,)).fetchone()



        if not escola:

            return {

                "sucesso": False,

                "erro": "Escola não encontrada."

            }



        nome_escola = escola["nome"]



        colunas = connection.execute(

            "PRAGMA table_info(equipes)"

        ).fetchall()



        nomes_colunas = [

            coluna["name"]

            for coluna in colunas

        ]



        equipe_ids = []



        if "escola_id" in nomes_colunas:

            equipes = connection.execute("""

                SELECT id

                FROM equipes

                WHERE escola_id = ?

            """, (escola_id,)).fetchall()



            equipe_ids = [

                equipe["id"]

                for equipe in equipes

            ]



        # Apaga partidas dessas equipes

        if equipe_ids:

            placeholders = ",".join(

                ["?"] * len(equipe_ids)

            )



            connection.execute(

                f"""

                DELETE FROM partidas

                WHERE equipe_a_id IN ({placeholders})

                   OR equipe_b_id IN ({placeholders})

                """,

                equipe_ids + equipe_ids

            )



        # Apaga equipes pelo novo campo

        if "escola_id" in nomes_colunas:

            connection.execute("""

                DELETE FROM equipes

                WHERE escola_id = ?

            """, (escola_id,))



        # Compatibilidade com banco antigo

        if "escola" in nomes_colunas:

            connection.execute("""

                DELETE FROM equipes

                WHERE escola = ?

            """, (nome_escola,))



        # Apaga escola

        connection.execute("""

            DELETE FROM escolas

            WHERE id = ?

        """, (escola_id,))



        connection.commit()



        return {

            "sucesso": True,

            "mensagem": "Escola excluída com sucesso."

        }



    except Exception as erro:

        connection.rollback()



        return {

            "sucesso": False,

            "erro": str(erro)

        }



    finally:

        connection.close()





# =========================================================

# EQUIPES

# =========================================================



@app.get("/api/equipes")
def listar_equipes(competicao_id: int):
    connection = get_connection()
    try:
        equipes = connection.execute("""
            SELECT
                equipes.id,
                equipes.nome,
                equipes.competicao_id,
                equipes.escola_id,
                equipes.modalidade_id,
                escolas.nome AS escola,
                modalidades.nome AS modalidade,
                modalidades.modulo AS modulo,
                modalidades.genero AS genero
            FROM equipes
            LEFT JOIN escolas
                ON equipes.escola_id = escolas.id
            LEFT JOIN modalidades
                ON equipes.modalidade_id = modalidades.id
            WHERE equipes.competicao_id = ?
            ORDER BY escolas.nome, equipes.nome
        """, (competicao_id,)).fetchall()

        return [dict(equipe) for equipe in equipes]
    finally:
        connection.close()


@app.post("/api/equipes")

def criar_equipe(equipe: Equipe):

    connection = get_connection()



    try:

        nome = equipe.nome.strip()



        if not nome:

            return {

                "sucesso": False,

                "erro": "Informe o nome da equipe."

            }



        # Confere competição

        competicao = connection.execute("""

            SELECT *

            FROM competicoes

            WHERE id = ?

        """, (equipe.competicao_id,)).fetchone()



        if not competicao:

            return {

                "sucesso": False,

                "erro": "Competição não encontrada."

            }



        # Confere escola

        escola = connection.execute("""

            SELECT *

            FROM escolas

            WHERE id = ?

              AND competicao_id = ?

        """, (

            equipe.escola_id,

            equipe.competicao_id

        )).fetchone()



        if not escola:

            return {

                "sucesso": False,

                "erro": "Escola não encontrada."

            }



        # Confere modalidade

        modalidade = connection.execute("""

            SELECT *

            FROM modalidades

            WHERE id = ?

              AND competicao_id = ?

        """, (

            equipe.modalidade_id,

            equipe.competicao_id

        )).fetchone()



        if not modalidade:

            return {

                "sucesso": False,

                "erro": "Modalidade não encontrada."

            }



        # Descobre colunas atuais da tabela

        colunas = connection.execute(

            "PRAGMA table_info(equipes)"

        ).fetchall()



        nomes_colunas = [

            coluna["name"]

            for coluna in colunas

        ]



        campos = []

        valores = []



        # Banco novo

        if "competicao_id" in nomes_colunas:

            campos.append("competicao_id")

            valores.append(equipe.competicao_id)



        if "modalidade_id" in nomes_colunas:

            campos.append("modalidade_id")

            valores.append(equipe.modalidade_id)



        if "escola_id" in nomes_colunas:

            campos.append("escola_id")

            valores.append(equipe.escola_id)



        if "nome" in nomes_colunas:

            campos.append("nome")

            valores.append(nome)



        # Banco antigo

        if "escola" in nomes_colunas:

            campos.append("escola")

            valores.append(escola["nome"])



        if "modalidade" in nomes_colunas:

            campos.append("modalidade")

            valores.append(modalidade["nome"])



        if "competicao" in nomes_colunas:

            campos.append("competicao")

            valores.append(competicao["nome"])



        placeholders = ",".join(

            ["?"] * len(valores)

        )



        sql = f"""

            INSERT INTO equipes

                ({",".join(campos)})

            VALUES

                ({placeholders})

        """



        cursor = connection.execute(

            sql,

            valores

        )



        connection.commit()



        return {

            "sucesso": True,

            "id": cursor.lastrowid

        }



    except Exception as erro:

        connection.rollback()



        return {

            "sucesso": False,

            "erro": str(erro)

        }



    finally:

        connection.close()





@app.delete("/api/equipes/{equipe_id}")

def excluir_equipe(equipe_id: int):

    connection = get_connection()



    try:

        equipe = connection.execute("""

            SELECT *

            FROM equipes

            WHERE id = ?

        """, (equipe_id,)).fetchone()



        if not equipe:

            return {

                "sucesso": False,

                "erro": "Equipe não encontrada."

            }



        # Apaga partidas

        connection.execute("""

            DELETE FROM partidas

            WHERE equipe_a_id = ?

               OR equipe_b_id = ?

        """, (

            equipe_id,

            equipe_id

        ))



        # Apaga equipe

        connection.execute("""

            DELETE FROM equipes

            WHERE id = ?

        """, (equipe_id,))



        connection.commit()



        return {

            "sucesso": True,

            "mensagem": "Equipe excluída com sucesso."

        }



    except Exception as erro:

        connection.rollback()



        return {

            "sucesso": False,

            "erro": str(erro)

        }



    finally:

        connection.close()





# =========================================================
# PARTIDAS
# =========================================================

@app.get("/api/partidas")
def listar_partidas(modalidade_id: int | None = None):
    connection = get_connection()
    try:
        if modalidade_id is not None:
            partidas = connection.execute("""
                SELECT partidas.*,
                       equipe_a.nome AS equipe_a,
                       equipe_b.nome AS equipe_b,
                       modalidades.nome AS modalidade
                FROM partidas
                LEFT JOIN equipes equipe_a ON partidas.equipe_a_id = equipe_a.id
                LEFT JOIN equipes equipe_b ON partidas.equipe_b_id = equipe_b.id
                LEFT JOIN modalidades ON partidas.modalidade_id = modalidades.id
                WHERE partidas.modalidade_id = ?
                ORDER BY partidas.data, partidas.horario, partidas.id
            """, (modalidade_id,)).fetchall()
        else:
            partidas = connection.execute("""
                SELECT partidas.*,
                       equipe_a.nome AS equipe_a,
                       equipe_b.nome AS equipe_b,
                       modalidades.nome AS modalidade
                FROM partidas
                LEFT JOIN equipes equipe_a ON partidas.equipe_a_id = equipe_a.id
                LEFT JOIN equipes equipe_b ON partidas.equipe_b_id = equipe_b.id
                LEFT JOIN modalidades ON partidas.modalidade_id = modalidades.id
                ORDER BY partidas.data, partidas.horario, partidas.id
            """).fetchall()
        return [dict(partida) for partida in partidas]
    finally:
        connection.close()


def verificar_conflitos_partida(connection, partida, partida_id_excluir=None):
    if not partida.data or not partida.horario:
        return None
    modalidade = connection.execute(
        "SELECT nome, quadras FROM modalidades WHERE id = ?",
        (partida.modalidade_id,)
    ).fetchone()
    if not modalidade:
        return "Modalidade não encontrada."
    limite = max(1, int(modalidade["quadras"] or 1))
    params = [partida.data, partida.horario]
    query = "SELECT id, modalidade_id, equipe_a_id, equipe_b_id FROM partidas WHERE data = ? AND horario = ?"
    if partida_id_excluir is not None:
        query += " AND id != ?"
        params.append(partida_id_excluir)
    existentes = connection.execute(query, params).fetchall()
    for jogo in existentes:
        if partida.equipe_a_id in (jogo["equipe_a_id"], jogo["equipe_b_id"]) or partida.equipe_b_id in (jogo["equipe_a_id"], jogo["equipe_b_id"]):
            return "Uma das equipes selecionadas já possui uma partida nesse mesmo dia e horário."
    ocupadas = sum(1 for jogo in existentes if jogo["modalidade_id"] == partida.modalidade_id)
    if ocupadas >= limite:
        return f"Não há quadra disponível para {modalidade['nome']} em {partida.data} às {partida.horario}. Quantidade cadastrada: {limite}."
    return None


@app.post("/api/partidas")
def criar_partida(partida: Partida):
    connection = get_connection()
    try:
        if partida.equipe_a_id == partida.equipe_b_id:
            return {"sucesso": False, "erro": "Uma equipe não pode jogar contra ela mesma."}

        modalidade = connection.execute(
            "SELECT * FROM modalidades WHERE id = ?",
            (partida.modalidade_id,)
        ).fetchone()
        if not modalidade:
            return {"sucesso": False, "erro": "Modalidade não encontrada."}

        conflito = verificar_conflitos_partida(connection, partida)
        if conflito:
            return {"sucesso": False, "erro": conflito}

        equipes = connection.execute("""
            SELECT id FROM equipes
            WHERE id IN (?, ?) AND modalidade_id = ?
        """, (
            partida.equipe_a_id,
            partida.equipe_b_id,
            partida.modalidade_id
        )).fetchall()

        if len(equipes) != 2:
            return {
                "sucesso": False,
                "erro": "As duas equipes precisam pertencer à modalidade selecionada."
            }

        cursor = connection.execute("""
            INSERT INTO partidas (
                modalidade_id, equipe_a_id, equipe_b_id,
                data, horario, local, fase, grupo,
                placar_a, placar_b, parciais, status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            partida.modalidade_id,
            partida.equipe_a_id,
            partida.equipe_b_id,
            partida.data,
            partida.horario,
            partida.local,
            partida.fase,
            partida.grupo,
            partida.placar_a,
            partida.placar_b,
            partida.parciais,
            partida.status
        ))

        connection.commit()
        return {
            "sucesso": True,
            "id": cursor.lastrowid,
            "mensagem": "Partida criada com sucesso."
        }
    except Exception as erro:
        connection.rollback()
        return {"sucesso": False, "erro": str(erro)}
    finally:
        connection.close()


@app.put("/api/partidas/{partida_id}")
def atualizar_partida(partida_id: int, partida: Partida):
    connection = get_connection()
    try:
        existente = connection.execute(
            "SELECT id FROM partidas WHERE id = ?",
            (partida_id,)
        ).fetchone()

        if not existente:
            return {"sucesso": False, "erro": "Partida não encontrada."}

        if partida.equipe_a_id == partida.equipe_b_id:
            return {"sucesso": False, "erro": "Uma equipe não pode jogar contra ela mesma."}

        conflito = verificar_conflitos_partida(connection, partida, partida_id_excluir=partida_id)
        if conflito:
            return {"sucesso": False, "erro": conflito}

        equipes = connection.execute("""
            SELECT id FROM equipes
            WHERE id IN (?, ?) AND modalidade_id = ?
        """, (
            partida.equipe_a_id,
            partida.equipe_b_id,
            partida.modalidade_id
        )).fetchall()

        if len(equipes) != 2:
            return {
                "sucesso": False,
                "erro": "As duas equipes precisam pertencer à modalidade selecionada."
            }

        connection.execute("""
            UPDATE partidas
            SET modalidade_id = ?,
                equipe_a_id = ?,
                equipe_b_id = ?,
                data = ?,
                horario = ?,
                local = ?,
                fase = ?,
                grupo = ?,
                placar_a = ?,
                placar_b = ?,
                parciais = ?,
                status = ?
            WHERE id = ?
        """, (
            partida.modalidade_id,
            partida.equipe_a_id,
            partida.equipe_b_id,
            partida.data,
            partida.horario,
            partida.local,
            partida.fase,
            partida.grupo,
            partida.placar_a,
            partida.placar_b,
            partida.parciais,
            partida.status,
            partida_id
        ))

        connection.commit()
        return {"sucesso": True, "mensagem": "Partida atualizada com sucesso."}
    except Exception as erro:
        connection.rollback()
        return {"sucesso": False, "erro": str(erro)}
    finally:
        connection.close()


@app.patch("/api/partidas/{partida_id}/placar")
def atualizar_placar(partida_id: int, placar_a: int, placar_b: int):
    connection = get_connection()
    try:
        partida = connection.execute(
            "SELECT id FROM partidas WHERE id = ?",
            (partida_id,)
        ).fetchone()

        if not partida:
            return {"sucesso": False, "erro": "Partida não encontrada."}

        if placar_a < 0 or placar_b < 0:
            return {"sucesso": False, "erro": "O placar não pode ser negativo."}

        connection.execute("""
            UPDATE partidas
            SET placar_a = ?,
                placar_b = ?,
                status = 'Finalizada'
            WHERE id = ?
        """, (placar_a, placar_b, partida_id))

        connection.commit()
        return {
            "sucesso": True,
            "mensagem": "Placar registrado e partida finalizada."
        }
    except Exception as erro:
        connection.rollback()
        return {"sucesso": False, "erro": str(erro)}
    finally:
        connection.close()


@app.delete("/api/partidas/{partida_id}")
def excluir_partida(partida_id: int):
    connection = get_connection()
    try:
        partida = connection.execute(
            "SELECT id FROM partidas WHERE id = ?",
            (partida_id,)
        ).fetchone()

        if not partida:
            return {"sucesso": False, "erro": "Partida não encontrada."}

        connection.execute(
            "DELETE FROM partidas WHERE id = ?",
            (partida_id,)
        )
        connection.commit()

        return {
            "sucesso": True,
            "mensagem": "Partida excluída com sucesso."
        }
    except Exception as erro:
        connection.rollback()
        return {"sucesso": False, "erro": str(erro)}
    finally:
        connection.close()

