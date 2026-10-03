let competicaoSelecionada=null;let partidaEditandoId=null;let modalidadesSorteio=[];let confrontosSorteados=[];

function mostrarPagina(pagina){
 const paginas=["dashboard","competicoes","modalidades","escolas","equipes","partidas"];
 paginas.forEach(n=>{const e=document.getElementById(`pagina-${n}`);if(e)e.style.display=n===pagina?"block":"none";});
 const titulos={dashboard:"Dashboard",competicoes:"Competições",modalidades:"Modalidades",escolas:"Escolas",equipes:"Equipes",partidas:"Partidas"};
 const subtitulos={dashboard:"Gerenciamento das competições JEMG",competicoes:"Gerencie as edições do JEMG",modalidades:"Modalidades da competição selecionada",escolas:"Escolas participantes da competição selecionada",equipes:"Equipes inscritas na competição selecionada",partidas:"Cadastre, acompanhe e registre os resultados das partidas"};
 const t=document.getElementById("tituloPagina"),s=document.getElementById("subtituloPagina");if(t)t.textContent=titulos[pagina];if(s)s.textContent=subtitulos[pagina];
 if(pagina==="modalidades")carregarModalidades();if(pagina==="escolas")carregarEscolas();if(pagina==="equipes")carregarEquipes();if(pagina==="partidas"){carregarModalidadesPartidas();carregarPartidas();carregarFiltrosSorteio();}
}

const abrir=(id)=>{const e=document.getElementById(id);if(e)e.style.display="flex";};
const fechar=(id)=>{const e=document.getElementById(id);if(e)e.style.display="none";};
function abrirModalCompeticao(){abrir("modalCompeticao")}function fecharModalCompeticao(){fechar("modalCompeticao")}
function abrirModalModalidade(){if(!competicaoSelecionada)return alert("Selecione uma competição primeiro.");if(!document.getElementById("quadrasModalidade")){const formato=document.getElementById("formatoModalidade");if(formato){const label=document.createElement("label");label.textContent="Quantidade de quadras/locais";label.style.display="block";label.style.marginTop="8px";const input=document.createElement("input");input.id="quadrasModalidade";input.type="number";input.min="1";input.step="1";input.value="1";input.placeholder="Ex.: 2";formato.insertAdjacentElement("afterend",label);label.insertAdjacentElement("afterend",input);}}abrir("modalModalidade")}
function fecharModalModalidade(){fechar("modalModalidade")}
function abrirModalEscola(){if(!competicaoSelecionada)return alert("Selecione uma competição primeiro.");abrir("modalEscola")}
function fecharModalEscola(){fechar("modalEscola")}
function abrirModalEquipe(){if(!competicaoSelecionada)return alert("Selecione uma competição primeiro.");carregarOpcoesEquipe();abrir("modalEquipe")}
function fecharModalEquipe(){fechar("modalEquipe")}
function fecharModalPartida(){fechar("modalPartida");partidaEditandoId=null}

async function jsonFetch(url,options={}){const r=await fetch(url,options);let d={};try{d=await r.json()}catch{}return{ok:r.ok,data:d}}

async function carregarCompeticoes(){
 const r=await jsonFetch("/api/competicoes"),lista=r.data||[];const dash=document.getElementById("listaCompeticoes"),pag=document.getElementById("listaCompeticoesPagina"),sel=document.getElementById("competicaoAtual");if(!dash||!pag||!sel)return;
 dash.innerHTML="";pag.innerHTML="";sel.innerHTML='<option value="">Selecionar competição</option>';
 lista.forEach(c=>{const linha=`<td>${c.nome}</td><td>${c.ano}</td><td>${c.status}<br><button type="button" onclick="excluirCompeticao(${c.id});event.stopPropagation();" style="margin-top:4px;background:#dc3545;color:white;border:none;padding:4px 7px;border-radius:6px;cursor:pointer;font-size:12px">🗑️ Excluir</button></td>`;const a=document.createElement("tr"),b=document.createElement("tr");a.innerHTML=linha;b.innerHTML=linha;dash.appendChild(a);pag.appendChild(b);const o=document.createElement("option");o.value=c.id;o.textContent=`${c.nome} ${c.ano}`;sel.appendChild(o);});
 const total=document.getElementById("totalCompeticoes");if(total)total.textContent=lista.length;if(competicaoSelecionada)sel.value=competicaoSelecionada;
}
function selecionarCompeticao(){const v=document.getElementById("competicaoAtual")?.value;if(!v){competicaoSelecionada=null}else competicaoSelecionada=Number(v);carregarModalidades();carregarEscolas();carregarEquipes();}
async function criarCompeticao(){const nome=document.getElementById("nomeCompeticao")?.value.trim(),ano=Number(document.getElementById("anoCompeticao")?.value);if(!nome||!ano)return alert("Preencha o nome e o ano.");const r=await jsonFetch("/api/competicoes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({nome,ano})});if(!r.ok||r.data.sucesso===false)return alert(r.data.erro||"Erro ao criar competição.");competicaoSelecionada=r.data.id;document.getElementById("nomeCompeticao").value="";fecharModalCompeticao();await carregarCompeticoes();document.getElementById("competicaoAtual").value=competicaoSelecionada;carregarModalidades();carregarEscolas();carregarEquipes();}

async function criarModalidade(){
 const nome=document.getElementById("nomeModalidade")?.value.trim(),modulo=document.getElementById("moduloModalidade")?.value||"Módulo 1",genero=document.getElementById("generoModalidade")?.value||"Masculino",formato=document.getElementById("formatoModalidade")?.value||"Grupos + Mata-mata",qEl=document.getElementById("quadrasModalidade"),quadras=Math.max(1,Number(qEl?.value||1));
 if(!nome)return alert("Digite o nome da modalidade.");if(!Number.isInteger(quadras)||quadras<1)return alert("Informe uma quantidade de quadras maior que zero.");
 const r=await jsonFetch("/api/modalidades",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({competicao_id:competicaoSelecionada,nome,modulo,genero,formato,quadras})});if(!r.ok||r.data.sucesso===false)return alert(r.data.erro||"Erro ao criar modalidade.");document.getElementById("nomeModalidade").value="";if(qEl)qEl.value="1";fecharModalModalidade();await carregarModalidades();
}
async function carregarModalidades(){const t=document.getElementById("listaModalidades");if(!t)return;const trHead=t.closest("table")?.querySelector("thead tr");if(trHead&&trHead.children.length===4)trHead.insertAdjacentHTML("beforeend","<th>Quadras</th>");if(!competicaoSelecionada){t.innerHTML='<tr><td colspan="5">Selecione uma competição para visualizar as modalidades.</td></tr>';return}const r=await jsonFetch(`/api/modalidades?competicao_id=${competicaoSelecionada}`),lista=r.data||[];t.innerHTML=lista.length?lista.map(m=>{const q=Math.max(1,Number(m.quadras||1));return `<tr><td>${m.nome}</td><td>${m.modulo}</td><td>${m.genero}</td><td>${m.formato}</td><td>${q} ${q===1?"quadra":"quadras"}<br><button type="button" onclick="excluirModalidade(${m.id});event.stopPropagation();" style="margin-top:4px;background:#dc3545;color:white;border:none;padding:4px 7px;border-radius:6px;cursor:pointer;font-size:12px">🗑️ Excluir</button></td></tr>`}).join(""):'<tr><td colspan="5">Nenhuma modalidade cadastrada.</td></tr>';const total=document.getElementById("totalModalidades");if(total)total.textContent=lista.length;}

async function criarEscola(){const nome=document.getElementById("nomeEscola")?.value.trim(),cidade=document.getElementById("cidadeEscola")?.value.trim();if(!nome)return alert("Digite o nome da escola.");if(!cidade)return alert("Digite o município.");const r=await jsonFetch("/api/escolas",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({competicao_id:competicaoSelecionada,nome,cidade})});if(!r.ok||r.data.sucesso===false)return alert(r.data.erro||"Erro ao cadastrar escola.");document.getElementById("nomeEscola").value="";document.getElementById("cidadeEscola").value="";fecharModalEscola();await carregarEscolas();}
async function carregarEscolas(){const t=document.getElementById("listaEscolas");if(!t)return;if(!competicaoSelecionada){t.innerHTML='<tr><td colspan="3">Selecione uma competição para visualizar as escolas.</td></tr>';return}const r=await jsonFetch(`/api/escolas?competicao_id=${competicaoSelecionada}`),lista=r.data||[];t.innerHTML=lista.length?lista.map(e=>`<tr><td>${e.nome}</td><td>${e.cidade||"-"}</td><td>${e.status}<br><button type="button" onclick="excluirEscola(${e.id});event.stopPropagation();" style="margin-top:4px;background:#dc3545;color:white;border:none;padding:4px 7px;border-radius:6px;cursor:pointer;font-size:12px">🗑️ Excluir</button></td></tr>`).join(""):'<tr><td colspan="3">Nenhuma escola cadastrada.</td></tr>';const total=document.getElementById("totalEscolas");if(total)total.textContent=lista.length;}

async function carregarOpcoesEquipe(){const escola=document.getElementById("escolaEquipe"),mod=document.getElementById("modalidadeEquipe");if(!escola||!mod)return;escola.innerHTML='<option value="">Selecionar escola</option>';mod.innerHTML='<option value="">Selecionar modalidade</option>';if(!competicaoSelecionada)return;const [re,rm]=await Promise.all([jsonFetch(`/api/escolas?competicao_id=${competicaoSelecionada}`),jsonFetch(`/api/modalidades?competicao_id=${competicaoSelecionada}`)]);(re.data||[]).forEach(e=>{const o=document.createElement("option");o.value=e.id;o.textContent=`${e.nome} — ${e.cidade||""}`;escola.appendChild(o)});(rm.data||[]).forEach(m=>{const o=document.createElement("option");o.value=m.id;o.textContent=`${m.nome} — ${m.modulo} — ${m.genero}`;mod.appendChild(o)});}
async function criarEquipe(){const escolaId=Number(document.getElementById("escolaEquipe")?.value),modalidadeId=Number(document.getElementById("modalidadeEquipe")?.value),nome=document.getElementById("nomeEquipe")?.value.trim();if(!escolaId)return alert("Selecione uma escola.");if(!modalidadeId)return alert("Selecione uma modalidade.");if(!nome)return alert("Digite o nome da equipe.");const r=await jsonFetch("/api/equipes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({competicao_id:competicaoSelecionada,escola_id:escolaId,modalidade_id:modalidadeId,nome})});if(!r.ok||r.data.sucesso===false)return alert(r.data.erro||"Erro ao criar equipe.");document.getElementById("nomeEquipe").value="";fecharModalEquipe();await carregarEquipes();}
async function carregarEquipes(){const t=document.getElementById("listaEquipes");if(!t)return;if(!competicaoSelecionada){t.innerHTML='<tr><td colspan="5">Selecione uma competição para visualizar as equipes.</td></tr>';return}const r=await jsonFetch(`/api/equipes?competicao_id=${competicaoSelecionada}`);if(!r.ok){t.innerHTML='<tr><td colspan="5">Erro ao carregar equipes.</td></tr>';return}const lista=r.data||[];t.innerHTML=lista.length?lista.map(e=>`<tr><td>${e.nome}</td><td>${e.escola||"-"}</td><td>${e.modalidade||"-"}</td><td>${e.modulo||"-"}</td><td>${e.genero||"-"}<br><button type="button" onclick="excluirEquipe(${e.id});event.stopPropagation();" style="margin-top:4px;background:#dc3545;color:white;border:none;padding:4px 7px;border-radius:6px;cursor:pointer;font-size:12px">🗑️ Excluir</button></td></tr>`).join(""):'<tr><td colspan="5">Nenhuma equipe cadastrada.</td></tr>';const total=document.getElementById("totalEquipes");if(total)total.textContent=lista.length;}

async function carregarFiltrosSorteio(){const s=document.getElementById("sorteioModalidade");if(!s||!competicaoSelecionada)return;const r=await jsonFetch(`/api/modalidades?competicao_id=${competicaoSelecionada}`);if(!r.ok)return;modalidadesSorteio=r.data||[];const atual=s.value;s.innerHTML='<option value="">Selecionar modalidade</option>';[...new Set(modalidadesSorteio.map(m=>m.nome))].forEach(n=>{const o=document.createElement("option");o.value=n;o.textContent=n;s.appendChild(o)});if([...s.options].some(o=>o.value===atual))s.value=atual;atualizarFiltrosSorteio();}
function atualizarFiltrosSorteio(){const s=document.getElementById("sorteioModalidade"),m=document.getElementById("sorteioModulo"),g=document.getElementById("sorteioGenero");if(!s||!m||!g)return;const lista=s.value?modalidadesSorteio.filter(x=>x.nome===s.value):modalidadesSorteio,ma=m.value,ga=g.value;m.innerHTML='<option value="">Todos os módulos</option>';[...new Set(lista.map(x=>x.modulo).filter(Boolean))].forEach(v=>{const o=document.createElement("option");o.value=v;o.textContent=v;m.appendChild(o)});if([...m.options].some(o=>o.value===ma))m.value=ma;const lg=lista.filter(x=>!m.value||x.modulo===m.value);g.innerHTML='<option value="">Todos</option>';[...new Set(lg.map(x=>x.genero).filter(Boolean))].forEach(v=>{const o=document.createElement("option");o.value=v;o.textContent=v;g.appendChild(o)});if([...g.options].some(o=>o.value===ga))g.value=ga;}
function embaralharEquipes(e){const a=[...e];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a;}
async function sortearConfrontos(){const nome=document.getElementById("sorteioModalidade")?.value,modulo=document.getElementById("sorteioModulo")?.value,genero=document.getElementById("sorteioGenero")?.value,box=document.getElementById("resultadoSorteio");if(!competicaoSelecionada)return alert("Selecione uma competição primeiro.");if(!nome||!modulo||!genero)return alert("Selecione modalidade, módulo e sexo.");const modalidade=modalidadesSorteio.find(m=>m.nome===nome&&m.modulo===modulo&&m.genero===genero);if(!modalidade)return alert("Não foi encontrada essa combinação.");const r=await jsonFetch(`/api/equipes?competicao_id=${competicaoSelecionada}`);if(!r.ok)return alert("Não foi possível carregar as equipes.");const equipes=(r.data||[]).filter(e=>Number(e.modalidade_id)===Number(modalidade.id)||(e.modalidade===nome&&e.modulo===modulo&&e.genero===genero));if(equipes.length<2){confrontosSorteados=[];if(box)box.innerHTML=`<div style="padding:15px;border-radius:8px;background:#f8f8f8">É necessário ter pelo menos 2 equipes em <strong>${nome} — ${modulo} — ${genero}</strong>.</div>`;return}const sorteadas=embaralharEquipes(equipes);confrontosSorteados=[];for(let i=0;i+1<sorteadas.length;i+=2)confrontosSorteados.push({modalidade_id:Number(modalidade.id),equipe_a_id:sorteadas[i].id,equipe_b_id:sorteadas[i+1].id,equipe_a:sorteadas[i].nome,equipe_b:sorteadas[i+1].nome});const sobra=sorteadas.length%2?sorteadas[sorteadas.length-1]:null;if(box)box.innerHTML=`<div style="margin-bottom:15px"><strong>${nome} — ${modulo} — ${genero}</strong><br>${equipes.length} equipes encontradas.</div><div style="display:grid;gap:10px">${confrontosSorteados.map((c,i)=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border:1px solid #ddd;border-radius:8px;background:#fff"><strong>Jogo ${i+1}</strong><span>${c.equipe_a} <strong>×</strong> ${c.equipe_b}</span></div>`).join("")}</div>${sobra?`<div style="margin-top:12px;padding:10px;border-radius:8px;background:#f8f8f8">⚠️ ${sobra.nome} ficou sem confronto nesta rodada.</div>`:""}<div style="margin-top:18px;display:flex;gap:10px;flex-wrap:wrap"><button class="btn" type="button" onclick="salvarConfrontosSorteados()">✅ Criar partidas com este sorteio</button><button class="btn secondary" type="button" onclick="sortearConfrontos()">🔄 Sortear novamente</button></div>`;}
async function salvarConfrontosSorteados(){if(!confrontosSorteados.length)return;const fase=prompt("Fase da rodada:","Fase de Grupos");if(fase===null)return;let criadas=0,erros=[];for(const c of confrontosSorteados){const r=await jsonFetch("/api/partidas",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({modalidade_id:c.modalidade_id,equipe_a_id:c.equipe_a_id,equipe_b_id:c.equipe_b_id,data:null,horario:null,local:null,fase:fase||"Fase de Grupos",grupo:null,placar_a:null,placar_b:null,status:"Agendada"})});if(r.ok&&r.data.sucesso!==false)criadas++;else erros.push(r.data.erro||`Erro no jogo ${c.equipe_a} × ${c.equipe_b}`)}let msg=`${criadas} partida(s) criada(s) a partir do sorteio.`;if(erros.length)msg+=`\n\n${erros.join("\n")}`;alert(msg);await carregarPartidas();}


function modalidadeUsaSets(nome){
    const n=(nome||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    return n.includes("voleibol") || n.includes("volei de praia") || n.includes("volei");
}
function obterModalidadeSelecionada(){
    const id=Number(document.getElementById("modalidadePartida")?.value);
    const sel=document.getElementById("modalidadePartida");
    const nome=sel?.selectedOptions?.[0]?.dataset?.nome || sel?.selectedOptions?.[0]?.textContent?.split(" — ")[0] || "";
    return {id,nome};
}
function criarCamposSets(parciais=""){
    const box=document.getElementById("parciaisPartida"); if(!box)return;
    const valores=(parciais||"").split(";").map(x=>x.trim()).filter(Boolean);
    let html='<label style="font-weight:600;">Placar por set</label><div style="display:grid;gap:8px;margin-top:6px;">';
    for(let i=1;i<=4;i++){
        const partes=(valores[i-1]||"").split("-");
        const a=partes[0]??"",b=partes[1]??"";
        html+=`<div style="display:grid;grid-template-columns:42px 1fr 1fr;gap:5px;align-items:center;font-size:12px;"><span>Set ${i}</span><input id="set${i}A" type="number" min="0" placeholder="A" value="${a}"><input id="set${i}B" type="number" min="0" placeholder="B" value="${b}"></div>`;
    }
    html+='</div><small style="display:block;margin-top:6px;opacity:.75;">Preencha somente os sets disputados.</small>';
    box.innerHTML=html; box.style.display="block";
}
function atualizarPlacarPorModalidade(parciais=""){
    const usaSets=modalidadeUsaSets(obterModalidadeSelecionada().nome);
    const la=document.getElementById("rotuloPlacarA"),lb=document.getElementById("rotuloPlacarB"),pa=document.getElementById("placarAPartida"),pb=document.getElementById("placarBPartida"),box=document.getElementById("parciaisPartida");
    if(!la||!lb||!pa||!pb||!box)return;
    if(usaSets){la.textContent="Sets A";lb.textContent="Sets B";pa.readOnly=true;pb.readOnly=true;criarCamposSets(parciais);atualizarSetsCalculados();}
    else{la.textContent="Placar A";lb.textContent="Placar B";pa.readOnly=false;pb.readOnly=false;box.style.display="none";box.innerHTML="";}
}
function coletarParciaisSets(){
    const sets=[];
    for(let i=1;i<=4;i++){
        const a=document.getElementById(`set${i}A`)?.value??"",b=document.getElementById(`set${i}B`)?.value??"";
        if(a===""&&b==="")continue;
        if(a===""||b==="")return {erro:`Preencha os dois placares do Set ${i}.`};
        const na=Number(a),nb=Number(b);
        if(!Number.isInteger(na)||!Number.isInteger(nb)||na<0||nb<0)return {erro:`Placar inválido no Set ${i}.`};
        if(na===nb)return {erro:`O Set ${i} não pode terminar empatado.`};
        sets.push(`${na}-${nb}`);
    }
    return {sets,valor:sets.join(";")};
}
function atualizarSetsCalculados(){
    const r=coletarParciaisSets(),pa=document.getElementById("placarAPartida"),pb=document.getElementById("placarBPartida");
    if(r.erro){if(pa)pa.value="";if(pb)pb.value="";return;}
    let a=0,b=0;r.sets.forEach(s=>{const[x,y]=s.split("-").map(Number);if(x>y)a++;else b++;});
    if(pa)pa.value=r.sets.length?a:"";if(pb)pb.value=r.sets.length?b:"";
}
function vincularEventosSets(){for(let i=1;i<=4;i++){const a=document.getElementById(`set${i}A`),b=document.getElementById(`set${i}B`);if(a)a.oninput=atualizarSetsCalculados;if(b)b.oninput=atualizarSetsCalculados;}}

function abrirModalPartida(id=null){if(!competicaoSelecionada)return alert("Selecione uma competição primeiro.");partidaEditandoId=id;const modal=document.getElementById("modalPartida"),conteudo=modal?.querySelector(".modal-content");if(conteudo){conteudo.style.width="520px";conteudo.style.maxWidth="calc(100vw - 30px)";conteudo.style.maxHeight="85vh";conteudo.style.overflowY="auto";conteudo.style.padding="18px";conteudo.style.boxSizing="border-box";}document.getElementById("tituloModalPartida").textContent=id?"Editar partida":"Nova partida";limparFormularioPartida();abrir("modalPartida");carregarModalidadesPartidas().then(async()=>{if(!id)return;const r=await jsonFetch("/api/partidas");if(!r.ok)return;const p=(r.data||[]).find(x=>Number(x.id)===Number(id));if(!p)return;document.getElementById("modalidadePartida").value=p.modalidade_id;await carregarEquipesPartida();atualizarPlacarPorModalidade(p.parciais||"");document.getElementById("equipeAPartida").value=p.equipe_a_id??"";document.getElementById("equipeBPartida").value=p.equipe_b_id??"";document.getElementById("dataPartida").value=p.data??"";document.getElementById("horarioPartida").value=p.horario??"";document.getElementById("localPartida").value=p.local??"";document.getElementById("fasePartida").value=p.fase||"Fase de Grupos";document.getElementById("grupoPartida").value=p.grupo??"";document.getElementById("placarAPartida").value=p.placar_a??"";document.getElementById("placarBPartida").value=p.placar_b??"";vincularEventosSets();document.getElementById("statusPartida").value=p.status||"Agendada";});}
function limparFormularioPartida(){["modalidadePartida","equipeAPartida","equipeBPartida","dataPartida","horarioPartida","localPartida","grupoPartida"].forEach(id=>{const e=document.getElementById(id);if(e)e.value=""});const pa=document.getElementById("placarAPartida"),pb=document.getElementById("placarBPartida"),st=document.getElementById("statusPartida"),fase=document.getElementById("fasePartida");if(pa)pa.value="";if(pb)pb.value="";const box=document.getElementById("parciaisPartida");if(box){box.style.display="none";box.innerHTML="";}if(st)st.value="Agendada";if(fase)fase.value="Fase de Grupos";}
async function carregarModalidadesPartidas(){const sel=document.getElementById("modalidadePartida"),filtro=document.getElementById("filtroModalidadePartidas");if(!sel||!competicaoSelecionada)return;const r=await jsonFetch(`/api/modalidades?competicao_id=${competicaoSelecionada}`);if(!r.ok)return;const valor=filtro?filtro.value:"";sel.innerHTML='<option value="">Selecionar modalidade</option>';if(filtro)filtro.innerHTML='<option value="">Todas as modalidades</option>';(r.data||[]).forEach(m=>{const o=document.createElement("option");o.value=m.id;o.textContent=`${m.nome} — ${m.modulo} — ${m.genero}`;sel.appendChild(o);if(filtro){const f=document.createElement("option");f.value=m.id;f.textContent=o.textContent;filtro.appendChild(f)}});if(filtro)filtro.value=valor;}
async function carregarEquipesPartida(){const modalidadeId=Number(document.getElementById("modalidadePartida")?.value),a=document.getElementById("equipeAPartida"),b=document.getElementById("equipeBPartida");if(!a||!b)return;a.innerHTML='<option value="">Selecionar equipe</option>';b.innerHTML='<option value="">Selecionar equipe</option>';if(!modalidadeId||!competicaoSelecionada)return;const r=await jsonFetch(`/api/equipes?competicao_id=${competicaoSelecionada}`);if(!r.ok)return;(r.data||[]).filter(e=>Number(e.modalidade_id)===modalidadeId).forEach(e=>[a,b].forEach(s=>{const o=document.createElement("option");o.value=e.id;o.textContent=`${e.nome} — ${e.escola||""}`;s.appendChild(o)}));}
function formatarDataPartida(data){if(!data)return"—";const p=data.split("-");return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:data;}
async function salvarPartida(){
 const modalidadeId=Number(document.getElementById("modalidadePartida")?.value),a=Number(document.getElementById("equipeAPartida")?.value),b=Number(document.getElementById("equipeBPartida")?.value),data=document.getElementById("dataPartida")?.value||null,horario=document.getElementById("horarioPartida")?.value||null;
 if(!modalidadeId)return alert("Selecione uma modalidade.");if(!a||!b)return alert("Selecione as duas equipes.");if(a===b)return alert("A equipe A e a equipe B precisam ser diferentes.");
 const usaSets=modalidadeUsaSets(obterModalidadeSelecionada().nome);let parciais=null,placarA=null,placarB=null;
 if(usaSets){const r=coletarParciaisSets();if(r.erro)return alert(r.erro);if(r.sets.length){parciais=r.valor;let sa=0,sb=0;r.sets.forEach(s=>{const[x,y]=s.split("-").map(Number);if(x>y)sa++;else sb++;});placarA=sa;placarB=sb;}}
 else{const pa=document.getElementById("placarAPartida")?.value??"",pb=document.getElementById("placarBPartida")?.value??"";placarA=pa===""?null:Number(pa);placarB=pb===""?null:Number(pb);}
 if(data&&horario){try{const rp=await jsonFetch("/api/partidas");if(rp.ok){const partidas=rp.data||[],conflitoEquipe=partidas.find(p=>Number(p.id)!==Number(partidaEditandoId)&&p.data===data&&p.horario===horario&&(Number(p.equipe_a_id)===a||Number(p.equipe_b_id)===a||Number(p.equipe_a_id)===b||Number(p.equipe_b_id)===b));if(conflitoEquipe){const ids=[Number(conflitoEquipe.equipe_a_id),Number(conflitoEquipe.equipe_b_id)],eq=ids.includes(a)?a:b,sel=eq===a?document.getElementById("equipeAPartida"):document.getElementById("equipeBPartida"),nome=sel?.selectedOptions?.[0]?.textContent||"Equipe";alert(`⚠️ Conflito de horário!\n\n${nome} já possui uma partida em ${formatarDataPartida(data)} às ${horario}.`);return}const rm=await jsonFetch(`/api/modalidades?competicao_id=${competicaoSelecionada}`);if(rm.ok){const mod=(rm.data||[]).find(x=>Number(x.id)===modalidadeId),cap=Math.max(1,Number(mod?.quadras||1)),q=partidas.filter(p=>Number(p.id)!==Number(partidaEditandoId)&&p.data===data&&p.horario===horario&&Number(p.modalidade_id)===modalidadeId).length;if(q>=cap){alert(`⚠️ Não há quadra disponível!\n\nA modalidade ${mod?.nome||"selecionada"} possui ${cap} ${cap===1?"quadra disponível":"quadras disponíveis"} nesse horário.`);return}}}}catch(e){console.error(e);return alert("Não foi possível verificar os conflitos de horário.")}}
 const dados={modalidade_id:modalidadeId,equipe_a_id:a,equipe_b_id:b,data,horario,local:document.getElementById("localPartida")?.value.trim()||null,fase:document.getElementById("fasePartida")?.value||null,grupo:document.getElementById("grupoPartida")?.value.trim()||null,placar_a:placarA,placar_b:placarB,parciais,status:document.getElementById("statusPartida")?.value||"Agendada"};
 const r=await jsonFetch(partidaEditandoId?`/api/partidas/${partidaEditandoId}`:"/api/partidas",{method:partidaEditandoId?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(dados)});if(!r.ok||r.data.sucesso===false)return alert(r.data.erro||"Erro ao salvar partida.");fecharModalPartida();await carregarPartidas();
}
async function carregarPartidas(){const t=document.getElementById("listaPartidas");if(!t)return;if(!competicaoSelecionada){t.innerHTML='<tr><td colspan="10">Selecione uma competição para visualizar as partidas.</td></tr>';return}const f=document.getElementById("filtroModalidadePartidas"),mid=f?f.value:"",r=await jsonFetch(mid?`/api/partidas?modalidade_id=${mid}`:"/api/partidas");if(!r.ok){t.innerHTML='<tr><td colspan="10">Erro ao carregar partidas.</td></tr>';return}let lista=r.data||[];if(!mid){const rm=await jsonFetch(`/api/modalidades?competicao_id=${competicaoSelecionada}`);if(rm.ok){const ids=new Set((rm.data||[]).map(m=>Number(m.id)));lista=lista.filter(p=>ids.has(Number(p.modalidade_id)));}}t.innerHTML=lista.length?lista.map(p=>{const placar=p.placar_a==null||p.placar_b==null?"—":`${p.placar_a} × ${p.placar_b}`,detalhes=p.parciais?`<small style="display:block;opacity:.75;margin-top:3px">${p.parciais.split(";").map(s=>s.replace("-", " × ")).join(" | ")}</small>`:"";return `<tr><td>${formatarDataPartida(p.data)}</td><td>${p.horario||"—"}</td><td>${p.modalidade||"—"}</td><td><strong>${p.equipe_a||"A definir"}</strong> × <strong>${p.equipe_b||"B definir"}</strong></td><td>${p.fase||"—"}</td><td>${p.grupo||"—"}</td><td>${p.local||"—"}</td><td><strong>${placar}</strong>${detalhes}</td><td>${p.status||"Agendada"}</td><td><button type="button" onclick="abrirModalPartida(${p.id})" style="padding:4px 7px;font-size:12px">✏️</button> <button type="button" onclick="excluirPartida(${p.id});event.stopPropagation()" style="background:#dc3545;color:white;border:none;padding:4px 7px;border-radius:6px;cursor:pointer;font-size:12px">🗑️</button></td></tr>`}).join(""):'<tr><td colspan="10">Nenhuma partida cadastrada.</td></tr>';}

async function executarExclusao(url,mensagem){if(!confirm(mensagem))return false;const r=await jsonFetch(url,{method:"DELETE"});if(!r.ok||r.data.sucesso===false){alert(r.data.erro||"Não foi possível excluir.");return false}alert(r.data.mensagem||"Registro excluído com sucesso.");return true;}
async function excluirCompeticao(id){if(!await executarExclusao(`/api/competicoes/${id}`,"ATENÇÃO!\n\nExcluir esta competição também apagará:\n\n• Modalidades\n• Escolas\n• Equipes\n• Partidas\n\nEssa ação não poderá ser desfeita.\n\nDeseja continuar?"))return;if(Number(competicaoSelecionada)===Number(id)){competicaoSelecionada=null;const s=document.getElementById("competicaoAtual");if(s)s.value=""}await carregarCompeticoes();await carregarModalidades();await carregarEscolas();await carregarEquipes();}
async function excluirModalidade(id){if(!await executarExclusao(`/api/modalidades/${id}`,"Excluir esta modalidade?\n\nAs equipes e partidas vinculadas a ela também serão apagadas."))return;await carregarModalidades();await carregarEquipes();await carregarPartidas();}
async function excluirEscola(id){if(!await executarExclusao(`/api/escolas/${id}`,"Excluir esta escola?\n\nAs equipes e partidas vinculadas a ela também serão apagadas."))return;await carregarEscolas();await carregarEquipes();await carregarPartidas();}
async function excluirEquipe(id){if(!await executarExclusao(`/api/equipes/${id}`,"Excluir esta equipe?\n\nAs partidas vinculadas a ela também serão apagadas."))return;await carregarEquipes();await carregarPartidas();}
async function excluirPartida(id){if(!await executarExclusao(`/api/partidas/${id}`,"Excluir esta partida?"))return;await carregarPartidas();}

carregarCompeticoes();

/* =========================================================
   CHAVEAMENTO — JEMG SCORE
   Modalidade + módulo + gênero, somente cidades
========================================================= */

let chaveamentoState = null;

const CHAVEAMENTO_STORAGE_PREFIX = "jemg_score_chaveamento_";

function chaveamentoStorageKey(modalidadeId){
    return `${CHAVEAMENTO_STORAGE_PREFIX}${competicaoSelecionada}_${modalidadeId}`;
}

function chaveamentoRoundName(size){
    return {
        2: "Final",
        4: "Semifinal",
        8: "Quartas de final",
        16: "Oitavas de final",
        32: "16-avos de final"
    }[size] || "Fase inicial";
}

function chaveamentoRoundNames(size){
    const names=[];
    let current=size;
    while(current>=2){
        names.push(chaveamentoRoundName(current));
        current/=2;
    }
    return names;
}

function embaralharChaveamento(lista){
    const a=[...lista];
    for(let i=a.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [a[i],a[j]]=[a[j],a[i]];
    }
    return a;
}

function proximaPotenciaDeDois(n){
    let p=2;
    while(p<n)p*=2;
    return p;
}

function limparTextoChaveamento(texto){
    return String(texto??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
}

function criarEstruturaChaveamento(equipes){
    const quantidade=equipes.length;
    const slots=proximaPotenciaDeDois(quantidade);
    const ordem=embaralharChaveamento(equipes);
    const byes=slots-quantidade;
    const primeiro=[];

    // Distribui os byes de forma simples e equilibrada: uma equipe sem adversário
    // em cada uma das primeiras posições disponíveis.
    let indice=0;
    for(let i=0;i<slots/2;i++){
        const precisaBye=i<byes;
        const a=ordem[indice++]||null;
        const b=precisaBye?null:(ordem[indice++]||null);
        primeiro.push({a,b,winnerId:b?null:a?.id??null,locked:!!(a&&!b)});
    }

    // Se a distribuição acima não consumiu todas as equipes, reconstrói de modo seguro.
    const usados=primeiro.flatMap(m=>[m.a?.id,m.b?.id]).filter(v=>v!=null);
    if(usados.length!==quantidade){
        primeiro.length=0;
        const fila=[...ordem];
        const pares=[];
        for(let i=0;i<fila.length;i+=2){
            pares.push({a:fila[i]||null,b:fila[i+1]||null,winnerId:null,locked:false});
        }
        let faltam=slots-quantidade;
        while(pares.length<slots/2)pares.push({a:null,b:null,winnerId:null,locked:false});
        // transforma os últimos pares em bye se ainda necessário
        for(let i=pares.length-1; i>=0 && faltam>0; i--){
            if(pares[i].a && pares[i].b){
                pares[i].b=null;
                pares[i].winnerId=pares[i].a.id;
                pares[i].locked=true;
                faltam--;
            }
        }
        primeiro.push(...pares.slice(0,slots/2));
    }

    // Garante que todo bye avance automaticamente.
    primeiro.forEach(m=>{
        if(m.a && !m.b){m.winnerId=m.a.id;m.locked=true;}
        else if(!m.a && m.b){m.winnerId=m.b.id;m.locked=true;}
    });

    const rounds=[primeiro];
    let quantidadeJogos=primeiro.length;
    while(quantidadeJogos>1){
        const prox=[];
        for(let i=0;i<quantidadeJogos/2;i++)prox.push({a:null,b:null,winnerId:null,locked:false});
        rounds.push(prox);
        quantidadeJogos/=2;
    }

    return {
        version:1,
        competitionId:Number(competicaoSelecionada),
        modalityId:null,
        teamSignature:equipes.map(e=>Number(e.id)).sort((a,b)=>a-b).join(","),
        teams:equipes.map(e=>({id:Number(e.id),city:e.city})),
        rounds
    };
}

function chaveamentoPropagar(roundIndex,matchIndex,state){
    if(roundIndex>=state.rounds.length-1)return;
    const match=state.rounds[roundIndex][matchIndex];
    const next=state.rounds[roundIndex+1][Math.floor(matchIndex/2)];
    const lado=matchIndex%2===0?"a":"b";

    if(!match.winnerId){
        if(lado==="a")next.a=null;
        else next.b=null;
    }else{
        const equipe=state.teams.find(t=>Number(t.id)===Number(match.winnerId));
        if(lado==="a")next.a=equipe?{...equipe}:null;
        else next.b=equipe?{...equipe}:null;
    }

    // Se a próxima partida tiver um único lado preenchido, ela avança automaticamente.
    if(next.a && !next.b){
        next.winnerId=next.a.id;
        next.locked=true;
    }else if(!next.a && next.b){
        next.winnerId=next.b.id;
        next.locked=true;
    }else if(next.a && next.b){
        // Partida pronta para escolha manual do vencedor.
        next.winnerId=null;
        next.locked=false;
    }else{
        next.winnerId=null;
        next.locked=false;
    }

    chaveamentoPropagar(roundIndex+1,Math.floor(matchIndex/2),state);
}

function chaveamentoRecalcular(state){
    // Reconstroi as rodadas seguintes sem apagar vencedores já escolhidos.
    for(let r=1;r<state.rounds.length;r++){
        state.rounds[r].forEach(m=>{m.a=null;m.b=null;m.locked=false;});
    }

    for(let r=0;r<state.rounds.length;r++){
        state.rounds[r].forEach(m=>{
            if(m.a && !m.b){
                m.winnerId=m.a.id;
                m.locked=true;
            }else if(!m.a && m.b){
                m.winnerId=m.b.id;
                m.locked=true;
            }else if(m.a && m.b){
                const valido=Number(m.winnerId)===Number(m.a.id)||Number(m.winnerId)===Number(m.b.id);
                if(!valido){m.winnerId=null;m.locked=false;}
            }else{
                m.winnerId=null;
                m.locked=false;
            }
        });

        if(r<state.rounds.length-1){
            for(let i=0;i<state.rounds[r].length;i++){
                const match=state.rounds[r][i];
                const next=state.rounds[r+1][Math.floor(i/2)];
                const equipe=match.winnerId?state.teams.find(t=>Number(t.id)===Number(match.winnerId)):null;
                if(i%2===0)next.a=equipe?{...equipe}:null;
                else next.b=equipe?{...equipe}:null;
            }
        }
    }
}

function salvarChaveamento(state){
    if(!state?.modalityId)return;
    localStorage.setItem(chaveamentoStorageKey(state.modalityId),JSON.stringify(state));
}

function carregarChaveamentoSalvo(modalidadeId){
    try{
        const bruto=localStorage.getItem(chaveamentoStorageKey(modalidadeId));
        return bruto?JSON.parse(bruto):null;
    }catch(e){
        return null;
    }
}

async function obterDadosChaveamento(modalidadeId){
    const [re,rs]=await Promise.all([
        jsonFetch(`/api/equipes?competicao_id=${competicaoSelecionada}`),
        jsonFetch(`/api/escolas?competicao_id=${competicaoSelecionada}`)
    ]);
    if(!re.ok||!rs.ok)throw new Error("Não foi possível carregar equipes e cidades.");

    const escolas=rs.data||[];
    const cidades=new Map(escolas.map(e=>[Number(e.id),e.cidade||"Cidade não cadastrada"]));

    const equipes=(re.data||[])
        .filter(e=>Number(e.modalidade_id)===Number(modalidadeId))
        .map(e=>({id:Number(e.id),city:cidades.get(Number(e.escola_id))||"Cidade não cadastrada"}));

    return equipes;
}

function selecionarVencedorChaveamento(roundIndex,matchIndex,teamId){
    if(!chaveamentoState)return;
    const match=chaveamentoState.rounds[roundIndex][matchIndex];
    if(!match?.a||!match?.b)return;
    if(match.locked&&match.winnerId)return;

    match.winnerId=Number(teamId);
    match.locked=true;
    chaveamentoRecalcular(chaveamentoState);
    salvarChaveamento(chaveamentoState);
    renderizarChaveamento();
}

function resetarChaveamentoAtual(){
    if(!chaveamentoState)return;
    const quantidade=chaveamentoState.teams.length;
    if(!confirm(`Refazer o chaveamento com as ${quantidade} equipes cadastradas?`))return;
    const base=criarEstruturaChaveamento(chaveamentoState.teams);
    base.modalityId=chaveamentoState.modalityId;
    chaveamentoState=base;
    chaveamentoRecalcular(chaveamentoState);
    salvarChaveamento(chaveamentoState);
    renderizarChaveamento();
}

function nomeExibicaoModalidade(m){
    return `${m.nome} — ${m.modulo} — ${m.genero}`;
}

function criarPaginaChaveamento(){
    if(document.getElementById("pagina-chaveamento"))return;
    const main=document.querySelector("main.main")||document.querySelector("main");
    if(!main)return;

    const sec=document.createElement("section");
    sec.id="pagina-chaveamento";
    sec.className="pagina";
    sec.style.display="none";
    sec.innerHTML=`
        <div class="panel">
            <div class="panel-header" style="gap:15px;align-items:flex-end;flex-wrap:wrap;">
                <div>
                    <h2>Chaveamento</h2>
                    <p>Monte a chave por modalidade, módulo e gênero.</p>
                </div>
                <div style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap;">
                    <div style="min-width:260px;">
                        <label>Modalidade</label>
                        <select id="seletorChaveamento"></select>
                    </div>
                    <button class="btn" type="button" onclick="montarChaveamentoSelecionado()">Montar chaveamento</button>
                    <button class="btn secondary" type="button" onclick="resetarChaveamentoAtual()">🔄 Novo sorteio</button>
                </div>
            </div>
            <div id="resumoChaveamento" style="margin-bottom:15px;"></div>
            <div id="areaChaveamento"></div>
        </div>`;
    main.appendChild(sec);

    const btn=[...document.querySelectorAll(".menu-button")].find(b=>b.textContent.includes("Chaveamento"));
    if(btn){
        btn.onclick=()=>mostrarPagina("chaveamento");
    }

    const seletor=document.getElementById("seletorChaveamento");
    if(seletor)seletor.onchange=()=>carregarChaveamentoDaSelecao();
}

async function carregarModalidadesChaveamento(){
    criarPaginaChaveamento();
    const seletor=document.getElementById("seletorChaveamento");
    if(!seletor||!competicaoSelecionada)return;
    const r=await jsonFetch(`/api/modalidades?competicao_id=${competicaoSelecionada}`);
    if(!r.ok)return;
    const valor=seletor.value;
    seletor.innerHTML='<option value="">Selecionar modalidade</option>';
    (r.data||[]).forEach(m=>{
        const o=document.createElement("option");
        o.value=m.id;
        o.textContent=nomeExibicaoModalidade(m);
        seletor.appendChild(o);
    });
    if([...seletor.options].some(o=>o.value===valor))seletor.value=valor;
}

async function montarChaveamentoSelecionado(){
    const seletor=document.getElementById("seletorChaveamento");
    const modalidadeId=Number(seletor?.value);
    if(!competicaoSelecionada)return alert("Selecione uma competição primeiro.");
    if(!modalidadeId)return alert("Selecione uma modalidade.");

    try{
        const equipes=await obterDadosChaveamento(modalidadeId);
        if(equipes.length<2){
            chaveamentoState=null;
            document.getElementById("areaChaveamento").innerHTML='<div style="padding:20px;border-radius:10px;background:#f8fafc;border:1px solid #e5e7eb">É necessário ter pelo menos 2 equipes cadastradas nessa modalidade.</div>';
            atualizarResumoChaveamento(null,equipes.length);
            return;
        }

        const assinatura=equipes.map(e=>e.id).sort((a,b)=>a-b).join(",");
        const salvo=carregarChaveamentoSalvo(modalidadeId);
        if(salvo && salvo.teamSignature===assinatura && Array.isArray(salvo.rounds)){
            chaveamentoState=salvo;
        }else{
            chaveamentoState=criarEstruturaChaveamento(equipes);
            chaveamentoState.modalityId=modalidadeId;
            chaveamentoRecalcular(chaveamentoState);
            salvarChaveamento(chaveamentoState);
        }
        renderizarChaveamento();
    }catch(e){
        alert(e.message||"Erro ao montar chaveamento.");
    }
}

async function carregarChaveamentoDaSelecao(){
    const seletor=document.getElementById("seletorChaveamento");
    const id=Number(seletor?.value);
    if(!id){
        chaveamentoState=null;
        atualizarResumoChaveamento(null,0);
        const area=document.getElementById("areaChaveamento");
        if(area)area.innerHTML='<div style="padding:20px;color:#6b7280">Selecione uma modalidade para visualizar o chaveamento.</div>';
        return;
    }
    await montarChaveamentoSelecionado();
}

function atualizarResumoChaveamento(state,quantidade){
    const box=document.getElementById("resumoChaveamento");
    if(!box)return;
    if(!state){box.innerHTML=quantidade?`<strong>${quantidade}</strong> equipe(s) cadastrada(s).`:"";return;}
    const slots=state.rounds[0]?.length*2||quantidade;
    const inicio=chaveamentoRoundName(slots);
    const byes=Math.max(0,slots-quantidade);
    let campeao="";
    const ultima=state.rounds[state.rounds.length-1]?.[0];
    if(ultima?.winnerId){campeao=state.teams.find(t=>Number(t.id)===Number(ultima.winnerId))?.city||"";}
    box.innerHTML=`<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;"><span style="padding:6px 10px;border-radius:999px;background:#f1f5f9"><strong>${quantidade}</strong> equipes</span><span style="padding:6px 10px;border-radius:999px;background:#f1f5f9">Início: <strong>${inicio}</strong></span>${byes?`<span style="padding:6px 10px;border-radius:999px;background:#f1f5f9"><strong>${byes}</strong> bye(s)</span>`:""}${campeao?`<span style="padding:6px 10px;border-radius:999px;background:#dcfce7">🏆 <strong>${limparTextoChaveamento(campeao)}</strong></span>`:""}</div>`;
}

function renderizarChaveamento(){
    const area=document.getElementById("areaChaveamento");
    if(!area||!chaveamentoState)return;
    const rounds=chaveamentoState.rounds;
    const nomes=chaveamentoRoundNames(rounds[0].length*2);

    atualizarResumoChaveamento(chaveamentoState,chaveamentoState.teams.length);

    const css=`
      <style>
        .jemg-bracket-wrap{overflow:auto;padding:8px 4px 20px}
        .jemg-bracket{display:flex;gap:22px;min-width:max-content;align-items:stretch}
        .jemg-round{width:220px;display:flex;flex-direction:column;justify-content:space-around;gap:12px;padding:8px 0}
        .jemg-round-title{text-align:center;font-weight:800;font-size:14px;margin-bottom:6px;text-transform:uppercase;letter-spacing:.02em}
        .jemg-match{position:relative;background:#fff;border:1px solid #dbe2ea;border-radius:10px;box-shadow:0 2px 7px rgba(0,0,0,.05);overflow:hidden}
        .jemg-team{display:flex;align-items:center;justify-content:space-between;min-height:38px;padding:8px 10px;cursor:default;background:#fff}
        .jemg-team+.jemg-team{border-top:1px solid #e5e7eb}
        .jemg-team.clickable{cursor:pointer}
        .jemg-team.clickable:hover{background:#f0fdf4}
        .jemg-team.winner{font-weight:800;background:#ecfdf5}
        .jemg-team.empty{color:#9ca3af;font-style:italic}
        .jemg-team.bye{color:#94a3b8;background:#f8fafc}
        .jemg-team-name{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .jemg-arrow{position:absolute;right:-22px;top:50%;width:22px;height:1px;background:#cbd5e1}
        .jemg-round:not(:last-child) .jemg-match:after{content:"";position:absolute;right:-22px;top:50%;width:22px;height:1px;background:#cbd5e1}
        .jemg-round:first-child .jemg-match{min-height:78px}
        @media(max-width:900px){.jemg-round{width:190px}.jemg-bracket{gap:16px}}
      </style>`;

    let html=css+'<div class="jemg-bracket-wrap"><div class="jemg-bracket">';

    rounds.forEach((matches,r)=>{
        html+=`<div class="jemg-round"><div class="jemg-round-title">${limparTextoChaveamento(nomes[r]||"")}</div>`;
        matches.forEach((m,i)=>{
            const a=m.a,b=m.b;
            const aWinner=a&&Number(m.winnerId)===Number(a.id);
            const bWinner=b&&Number(m.winnerId)===Number(b.id);
            const podeEscolher=!!(a&&b&&!m.locked);
            html+=`<div class="jemg-match">`;
            if(a){
                html+=`<div class="jemg-team ${aWinner?"winner":""} ${podeEscolher?"clickable":""}" ${podeEscolher?`onclick="selecionarVencedorChaveamento(${r},${i},${a.id})"`:""}><span class="jemg-team-name">${limparTextoChaveamento(a.city)}</span>${aWinner?"🏆":""}</div>`;
            }else{
                html+=`<div class="jemg-team empty">A definir</div>`;
            }
            if(b){
                html+=`<div class="jemg-team ${bWinner?"winner":""} ${podeEscolher?"clickable":""}" ${podeEscolher?`onclick="selecionarVencedorChaveamento(${r},${i},${b.id})"`:""}><span class="jemg-team-name">${limparTextoChaveamento(b.city)}</span>${bWinner?"🏆":""}</div>`;
            }else if(a){
                html+=`<div class="jemg-team bye">BYE</div>`;
            }else{
                html+=`<div class="jemg-team empty">A definir</div>`;
            }
            html+=`</div>`;
        });
        html+='</div>';
    });
    html+='</div></div>';
    html+=`<div style="margin-top:8px;color:#64748b;font-size:13px;">Clique em uma das cidades do confronto para definir o vencedor. Não há disputa de 3º lugar.</div>`;
    area.innerHTML=html;
}

// Reescreve a navegação para incluir a nova tela sem alterar o restante do sistema.
const mostrarPaginaOriginal=window.mostrarPagina;
window.mostrarPagina=function(pagina){
    const paginas=["dashboard","competicoes","modalidades","escolas","equipes","partidas","chaveamento"];
    paginas.forEach(n=>{
        const e=document.getElementById(`pagina-${n}`);
        if(e)e.style.display=n===pagina?"block":"none";
    });
    const titulos={dashboard:"Dashboard",competicoes:"Competições",modalidades:"Modalidades",escolas:"Escolas",equipes:"Equipes",partidas:"Partidas",chaveamento:"Chaveamento"};
    const subtitulos={dashboard:"Gerenciamento das competições JEMG",competicoes:"Gerencie as edições do JEMG",modalidades:"Modalidades da competição selecionada",escolas:"Escolas participantes da competição selecionada",equipes:"Equipes inscritas na competição selecionada",partidas:"Cadastre, acompanhe e registre os resultados das partidas",chaveamento:"Chaveamento por modalidade, módulo e gênero"};
    const t=document.getElementById("tituloPagina"),s=document.getElementById("subtituloPagina");
    if(t)t.textContent=titulos[pagina]||pagina;
    if(s)s.textContent=subtitulos[pagina]||"";
    document.querySelectorAll(".menu-button").forEach(button=>button.classList.remove("active"));
    const btn=[...document.querySelectorAll(".menu-button")].find(b=>b.textContent.includes(pagina==="chaveamento"?"Chaveamento":titulos[pagina]||""));
    if(btn)btn.classList.add("active");
    if(pagina==="modalidades")carregarModalidades();
    if(pagina==="escolas")carregarEscolas();
    if(pagina==="equipes")carregarEquipes();
    if(pagina==="partidas"){carregarModalidadesPartidas();carregarPartidas();carregarFiltrosSorteio();}
    if(pagina==="chaveamento"){carregarModalidadesChaveamento().then(()=>carregarChaveamentoDaSelecao());}
};

function inicializarChaveamento(){
    criarPaginaChaveamento();
}

inicializarChaveamento();

/* ========================================
   TELA CHEIA DO CHAVEAMENTO
======================================== */
(function configurarTelaCheiaChaveamento(){

    function aplicarTelaCheia(){

        const pagina = document.getElementById("pagina-chaveamento");

        if(!pagina) return;

        if(!document.getElementById("btnTelaCheiaChaveamento")){

            const header = pagina.querySelector(".panel-header");

            if(header){

                const areaBotoes =
                    header.querySelector("div[style*='display:flex']") ||
                    header.lastElementChild;

                const btn = document.createElement("button");

                btn.id = "btnTelaCheiaChaveamento";
                btn.type = "button";
                btn.className = "btn secondary";
                btn.textContent = "⛶ Tela cheia";
                btn.style.marginLeft = "8px";

                btn.onclick = alternarTelaCheiaChaveamento;

                if(
                    areaBotoes &&
                    areaBotoes !== header.firstElementChild
                ){
                    areaBotoes.appendChild(btn);
                }
                else{
                    header.appendChild(btn);
                }
            }
        }

        if(!document.getElementById("estiloTelaCheiaChaveamento")){

            const style = document.createElement("style");

            style.id = "estiloTelaCheiaChaveamento";

            style.textContent = `

                #pagina-chaveamento.jemg-tela-cheia{

                    position: fixed !important;

                    inset: 0 !important;

                    z-index: 99999 !important;

                    width: 100vw !important;

                    height: 100vh !important;

                    max-width: none !important;

                    max-height: none !important;

                    margin: 0 !important;

                    padding: 20px !important;

                    background: #f5f7fa !important;

                    overflow: auto !important;

                    box-sizing: border-box !important;
                }

                #pagina-chaveamento.jemg-tela-cheia
                .jemg-bracket-panel{

                    min-height: calc(100vh - 40px);

                    box-sizing: border-box;

                    overflow: hidden;
                }

                #pagina-chaveamento.jemg-tela-cheia
                #areaChaveamento{

                    min-height: calc(100vh - 170px);
                }

                #pagina-chaveamento.jemg-tela-cheia
                .jemg-bracket-wrap{

                    max-height: calc(100vh - 220px);

                    overflow: auto;

                    padding-bottom: 25px;
                }

                body.jemg-chaveamento-fullscreen{

                    overflow: hidden !important;
                }

                @media(max-width:900px){

                    #pagina-chaveamento.jemg-tela-cheia{

                        padding: 10px !important;
                    }
                }
            `;

            document.head.appendChild(style);
        }
    }


    async function alternarTelaCheiaChaveamento(){

        const pagina =
            document.getElementById("pagina-chaveamento");

        if(!pagina) return;

        try{

            if(document.fullscreenElement){

                await document.exitFullscreen();

                return;
            }

            await pagina.requestFullscreen();

        }
        catch(erro){

            pagina.classList.toggle("jemg-tela-cheia");

            document.body.classList.toggle(
                "jemg-chaveamento-fullscreen"
            );

            atualizarBotaoTelaCheia();
        }
    }


    function atualizarBotaoTelaCheia(){

        const pagina =
            document.getElementById("pagina-chaveamento");

        const btn =
            document.getElementById(
                "btnTelaCheiaChaveamento"
            );

        if(!pagina || !btn) return;

        const ativo =
            !!document.fullscreenElement ||
            pagina.classList.contains(
                "jemg-tela-cheia"
            );

        btn.textContent =
            ativo
                ? "✕ Sair da tela cheia"
                : "⛶ Tela cheia";
    }


    document.addEventListener(
        "fullscreenchange",
        ()=>{

            const pagina =
                document.getElementById(
                    "pagina-chaveamento"
                );

            const ativo =
                !!document.fullscreenElement;

            if(pagina){

                pagina.classList.toggle(
                    "jemg-tela-cheia",
                    ativo
                );
            }

            document.body.classList.toggle(
                "jemg-chaveamento-fullscreen",
                ativo
            );

            atualizarBotaoTelaCheia();
        }
    );


    document.addEventListener(
        "DOMContentLoaded",
        ()=>{

            setTimeout(
                aplicarTelaCheia,
                50
            );
        }
    );


    setTimeout(
        aplicarTelaCheia,
        100
    );


    const observer =
        new MutationObserver(
            ()=>aplicarTelaCheia()
        );

    observer.observe(
        document.body,
        {
            childList: true,
            subtree: true
        }
    );

})();

