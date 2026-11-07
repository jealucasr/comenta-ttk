import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const STORAGE = "comenta-ttk-v1";
const initial = { tags: ["moda", "beleza"], comments: ["Adorei o conteúdo! ✨", "Que vídeo legal! ❤️"], videos: [] };
const today = () => new Date().toLocaleDateString("en-CA");
function read() { try { const x = JSON.parse(localStorage.getItem(STORAGE)); return x && Array.isArray(x.tags) && Array.isArray(x.comments) && Array.isArray(x.videos) ? x : initial; } catch { return initial; } }
function normalizeUrl(raw) {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "https:" || !["www.tiktok.com","tiktok.com","m.tiktok.com","vm.tiktok.com","vt.tiktok.com"].includes(u.hostname.toLowerCase())) return null;
    if (!/^\/@[^/]+\/video\/\d+\/?$/.test(u.pathname) && !["vm.tiktok.com","vt.tiktok.com"].includes(u.hostname.toLowerCase())) return null;
    u.search = ""; u.hash = ""; return u.href.replace(/\/$/, "");
  } catch { return null; }
}
const BOOKMARKLET = `javascript:(()=>{const u=new URL(location.href);if(!["tiktok.com","www.tiktok.com"].includes(u.hostname)||!u.pathname.includes("/video/")){alert("Abra um vídeo individual do TikTok primeiro.");return;}window.open("http://localhost:5173/?addVideo="+encodeURIComponent(u.href),"_blank");})();`;
function App() {
  const [db, setDb] = useState(read);
  const [page, setPage] = useState("Painel");
  const [tag, setTag] = useState("");
  const [comment, setComment] = useState("");
  const [url, setUrl] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [bulkUrls, setBulkUrls] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [filterText, setFilterText] = useState("");
  const [chosen, setChosen] = useState({});
  const [onlyUntagged, setOnlyUntagged] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const incoming = params.get("addVideo");
    if (!incoming) return;
    window.history.replaceState(null, "", window.location.pathname + window.location.hash);
    const clean = normalizeUrl(incoming);
    setPage("Fila de vídeos");
    if (!clean) { setMessage("O link recebido não é um vídeo válido do TikTok."); return; }
    setDb(current => {
      if (current.videos.some(v => v.url === clean)) return current;
      return {...current, videos:[{id:crypto.randomUUID(),url:clean,tag:"",done:false,date:null,usedComment:null},...current.videos]};
    });
    setMessage("Link recebido! Confira a fila; vídeos repetidos não são adicionados.");
  }, []);
  async function copyBookmarklet() {
    try { await navigator.clipboard.writeText(BOOKMARKLET); notify("Atalho copiado! Crie um favorito no navegador e cole o código no campo URL."); }
    catch { notify("Não foi possível copiar o atalho. Verifique as permissões do navegador."); }
  }

  useEffect(() => { localStorage.setItem(STORAGE, JSON.stringify(db)); }, [db]);
  const pending = db.videos.filter(v => !v.done);
  const done = db.videos.filter(v => v.done);
  const filteredPending = pending.filter(v => (!filterTag || v.tag === filterTag) && (!onlyUntagged || !v.tag) && (!filterText || v.url.toLowerCase().includes(filterText.toLowerCase())));
  const count = done.filter(v => v.date === today()).length;
  function notify(s) { setMessage(s); }
  function addTag(e) {
    e.preventDefault(); const t = tag.trim().replace(/^#+/,"").toLowerCase().replace(/[^\p{L}\p{N}_.]/gu,"");
    if (!t || db.tags.includes(t)) return notify("Hashtag vazia ou repetida.");
    setDb(d => ({...d,tags:[...d.tags,t]})); setTag(""); notify("");
  }
  function addComment(e) {
    e.preventDefault(); const t = comment.trim();
    if (!t || db.comments.includes(t)) return notify("Comentário vazio ou repetido.");
    setDb(d => ({...d,comments:[...d.comments,t]})); setComment(""); notify("");
  }
  function addVideo(e) {
    e.preventDefault(); const clean = normalizeUrl(url);
    if (!clean) return notify("Insira um link HTTPS válido de vídeo do TikTok.");
    if (db.videos.some(v => v.url === clean)) return notify("Esse vídeo já está na fila ou no histórico.");
    setDb(d => ({...d,videos:[{id:crypto.randomUUID(),url:clean,tag:selectedTag,done:false,date:null,usedComment:null},...d.videos]})); setUrl(""); notify("Vídeo adicionado.");
  }
  function addBulk(e) {
    e.preventDefault();
    const parts = bulkUrls.split(/[\\s,;]+/).map(x => x.trim()).filter(Boolean);
    const existing = new Set(db.videos.map(v => v.url));
    const incoming = [];
    let invalid = 0, duplicates = 0;
    for (const part of parts) {
      const clean = normalizeUrl(part);
      if (!clean) { invalid++; continue; }
      if (existing.has(clean)) { duplicates++; continue; }
      existing.add(clean);
      incoming.push({id:crypto.randomUUID(),url:clean,tag:selectedTag,done:false,date:null,usedComment:null});
    }
    if (incoming.length) setDb(d => ({...d,videos:[...incoming,...d.videos]}));
    setBulkUrls("");
    notify(`${incoming.length} adicionados · ${duplicates} duplicados · ${invalid} inválidos.`);
  }
  function updateVideoTag(id, tag) { setDb(d => ({...d,videos:d.videos.map(v => v.id === id ? {...v,tag} : v)})); }
  function remove(id) { setDb(d => ({...d,videos:d.videos.filter(v=>v.id!==id)})); }
  function mark(v) {
    const c = chosen[v.id] ?? db.comments[0];
    if (!c) return notify("Cadastre um comentário primeiro.");
    setDb(d=>({...d,videos:d.videos.map(x=>x.id===v.id?{...x,done:true,date:today(),usedComment:c}:x)})); notify("Publicação registrada após sua confirmação.");
  }
  async function copy(v) {
    const c = chosen[v.id] ?? db.comments[0];
    if (!c) return notify("Cadastre um comentário primeiro.");
    try { await navigator.clipboard.writeText(c); notify("Comentário copiado. Publique manualmente no TikTok."); }
    catch { notify("Não foi possível copiar. Selecione o texto manualmente."); }
  }
  const row = v => <article className="video" key={v.id}><div className="videohead"><span className="tag">{v.tag ? "#"+v.tag : "Sem hashtag"}</span><span className={v.done?"status ok":"status"}>{v.done?"Confirmado":"Pendente"}</span></div><label className="video-tag-picker"><span className="muted">Hashtag:</span><select aria-label="Hashtag deste vídeo" value={v.tag || ""} onChange={e=>updateVideoTag(v.id,e.target.value)}><option value="">Sem hashtag</option>{db.tags.map(t=><option key={t} value={t}>#{t}</option>)}</select></label><a className="url" href={v.url} target="_blank" rel="noopener noreferrer">{v.url}</a>{!v.done ? <><select aria-label="Escolher comentário" value={chosen[v.id] ?? db.comments[0] ?? ""} onChange={e=>setChosen(s=>({...s,[v.id]:e.target.value}))}><option value="" disabled>Selecione um comentário</option>{db.comments.map(c=><option key={c} value={c}>{c}</option>)}</select><div className="actions"><a className="button secondary" href={v.url} target="_blank" rel="noopener noreferrer">↗ Abrir vídeo</a><button className="secondary" onClick={()=>copy(v)}>Copiar comentário</button><button onClick={()=>mark(v)}>✓ Já publiquei</button></div></> : <div className="actions"><span className="muted">Registrado em {v.date} · {v.usedComment}</span><button className="secondary" onClick={()=>setDb(d=>({...d,videos:d.videos.map(x=>x.id===v.id?{...x,done:false,date:null,usedComment:null}:x)}))}>Reabrir</button></div>}<button className="delete" onClick={()=>remove(v.id)}>Excluir vídeo</button></article>;
  return <div className="layout"><aside><div className="brand"><span className="logo">TT</span><div>comenta<span className="pink">.ttk</span><small>COMMENT MANAGER</small></div></div><nav>{["Painel","Fila de vídeos","Hashtags","Comentários"].map(p=><button className={page===p?"active":""} key={p} onClick={()=>{setPage(p);notify("");}}>{({Painel:"▦","Fila de vídeos":"▤",Hashtags:"#",Comentários:"☏"})[p]} &nbsp; {p}</button>)}</nav><p className="asidefoot">Publicação manual · Dados neste navegador</p></aside><main><header><div><span className="eyebrow">SEU ESPAÇO DE TRABALHO</span><h1>{page}</h1></div><span className="muted">{new Date().toLocaleDateString("pt-BR")}</span></header>{message && <div className="notice" role="status">{message} <button className="secondary" onClick={()=>notify("")}>×</button></div>}
  {page==="Painel" && <><div className="stats"><div className="card stat"><span className="eyebrow">CONCLUÍDOS HOJE</span><strong>{count}<small> / 50</small></strong><div className="progress"><span style={{width:Math.min(100,count*2)+"%"}}/></div><p>{Math.min(100,count*2)}% da meta diária</p></div><div className="card stat"><span className="eyebrow">NA FILA</span><strong>{pending.length}</strong><p>Vídeos pendentes</p></div><div className="card stat"><span className="eyebrow">COMENTÁRIOS</span><strong>{db.comments.length}</strong><p>Mensagens cadastradas</p></div><div className="card stat"><span className="eyebrow">HASHTAGS</span><strong>{db.tags.length}</strong><p>Assuntos acompanhados</p></div></div><section className="card"><div className="sectiontitle"><div><h2>Próximos vídeos</h2><p>Abra o vídeo, revise e publique o comentário no TikTok.</p></div><button className="secondary" onClick={()=>setPage("Fila de vídeos")}>Ver fila</button></div>{pending.length ? pending.slice(0,3).map(row) : <div className="empty">Sua fila está vazia. Adicione vídeos para começar.</div>}</section></>}
  {page==="Fila de vídeos" && <><section className="card"><h2>Adicionar direto do TikTok</h2><p>Crie um favorito no navegador com o atalho abaixo. Ao visitar um vídeo individual do TikTok, clique no favorito para enviar o link para esta fila. O aplicativo deve estar rodando em http://localhost:5173.</p><div className="actions" style={{marginTop:16}}><button className="secondary" onClick={copyBookmarklet}>Copiar código do favorito</button></div><p style={{marginTop:12}}>No Chrome ou Opera: pressione Ctrl+D, edite o favorito e substitua o endereço (URL) pelo código copiado. Use o favorito na página de um vídeo.</p></section><section className="card"><h2>Adicionar vídeo</h2><p>Cole o link de um vídeo encontrado na pesquisa do TikTok.</p><form className="form" onSubmit={addVideo}><input type="url" placeholder="https://www.tiktok.com/@perfil/video/123..." value={url} onChange={e=>setUrl(e.target.value)} required/><select value={selectedTag} onChange={e=>setSelectedTag(e.target.value)}><option value="">Sem hashtag</option>{db.tags.map(t=><option key={t} value={t}>#{t}</option>)}</select><button>+ Adicionar</button></form><div className="bulk"><h3>Adicionar vários vídeos</h3><p>Cole vários links do TikTok, um por linha. A hashtag selecionada acima será aplicada aos novos vídeos.</p><form onSubmit={addBulk}><textarea rows="5" placeholder={"https://www.tiktok.com/@perfil/video/123...\\nhttps://www.tiktok.com/@perfil/video/456..."} value={bulkUrls} onChange={e=>setBulkUrls(e.target.value)}/><button>Importar links válidos</button></form></div></section><section className="card"><h2>Pendentes ({pending.length})</h2><div className="filters"><select aria-label="Filtrar por hashtag" value={filterTag} onChange={e=>setFilterTag(e.target.value)}><option value="">Todas as hashtags</option>{db.tags.map(t=><option key={t} value={t}>#{t}</option>)}</select><input aria-label="Filtrar por URL" placeholder="Buscar pelo link ou perfil..." value={filterText} onChange={e=>setFilterText(e.target.value)}/><label className="filter-check"><input type="checkbox" checked={onlyUntagged} onChange={e=>setOnlyUntagged(e.target.checked)}/> Sem hashtag</label></div>{filteredPending.length?filteredPending.map(row):<div className="empty">Nenhum vídeo corresponde aos filtros.</div>}</section><section className="card"><h2>Histórico ({done.length})</h2>{done.length?done.map(row):<div className="empty">Nenhuma publicação registrada.</div>}</section></>}
  {page==="Hashtags" && <section className="card"><h2>Hashtags monitoradas</h2><p>Abra a página oficial da hashtag para encontrar vídeos e adicionar os links à fila.</p><form className="form" onSubmit={addTag}><input placeholder="Ex.: maquiagem" value={tag} onChange={e=>setTag(e.target.value)}/><button>+ Adicionar</button></form>{db.tags.map(t=><div className="item" key={t}><b>#{t}</b><div className="actions"><a className="button secondary" target="_blank" rel="noopener noreferrer" href={"https://www.tiktok.com/tag/"+encodeURIComponent(t)}>↗ Explorar TikTok</a><button className="secondary" onClick={()=>setDb(d=>({...d,tags:d.tags.filter(x=>x!==t)}))}>Excluir</button></div></div>)}</section>}
  {page==="Comentários" && <section className="card"><h2>Biblioteca de comentários</h2><p>Cadastre mensagens relevantes para os vídeos que você escolher.</p><form className="commentform" onSubmit={addComment}><textarea rows="3" maxLength="500" placeholder="Digite um comentário..." value={comment} onChange={e=>setComment(e.target.value)}/><div className="actions"><span className="muted">{comment.length}/500 caracteres</span><button>+ Salvar comentário</button></div></form>{db.comments.map(c=><div className="item" key={c}><span>{c}</span><button className="secondary" onClick={()=>setDb(d=>({...d,comments:d.comments.filter(x=>x!==c)}))}>Excluir</button></div>)}</section>}
  <footer>Comenta TTK · Sem publicação automática · Armazenamento local</footer></main></div>;
}
createRoot(document.getElementById("root")).render(<App />);
