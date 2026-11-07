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
function App() {
  const [db, setDb] = useState(read);
  const [page, setPage] = useState("Painel");
  const [tag, setTag] = useState("");
  const [comment, setComment] = useState("");
  const [url, setUrl] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [chosen, setChosen] = useState({});
  const [message, setMessage] = useState("");
  useEffect(() => { localStorage.setItem(STORAGE, JSON.stringify(db)); }, [db]);
  const pending = db.videos.filter(v => !v.done);
  const done = db.videos.filter(v => v.done);
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
  const row = v => <article className="video" key={v.id}><div className="videohead"><span className="tag">{v.tag ? "#"+v.tag : "Sem hashtag"}</span><span className={v.done?"status ok":"status"}>{v.done?"Confirmado":"Pendente"}</span></div><a className="url" href={v.url} target="_blank" rel="noopener noreferrer">{v.url}</a>{!v.done ? <><select aria-label="Escolher comentário" value={chosen[v.id] ?? db.comments[0] ?? ""} onChange={e=>setChosen(s=>({...s,[v.id]:e.target.value}))}><option value="" disabled>Selecione um comentário</option>{db.comments.map(c=><option key={c} value={c}>{c}</option>)}</select><div className="actions"><a className="button secondary" href={v.url} target="_blank" rel="noopener noreferrer">↗ Abrir vídeo</a><button className="secondary" onClick={()=>copy(v)}>Copiar comentário</button><button onClick={()=>mark(v)}>✓ Já publiquei</button></div></> : <div className="actions"><span className="muted">Registrado em {v.date} · {v.usedComment}</span><button className="secondary" onClick={()=>setDb(d=>({...d,videos:d.videos.map(x=>x.id===v.id?{...x,done:false,date:null,usedComment:null}:x)}))}>Reabrir</button></div>}<button className="delete" onClick={()=>remove(v.id)}>Excluir vídeo</button></article>;
  return <div className="layout"><aside><div className="brand"><span className="logo">TT</span><div>comenta<span className="pink">.ttk</span><small>COMMENT MANAGER</small></div></div><nav>{["Painel","Fila de vídeos","Hashtags","Comentários"].map(p=><button className={page===p?"active":""} key={p} onClick={()=>{setPage(p);notify("");}}>{({Painel:"▦","Fila de vídeos":"▤",Hashtags:"#",Comentários:"☏"})[p]} &nbsp; {p}</button>)}</nav><p className="asidefoot">Publicação manual · Dados neste navegador</p></aside><main><header><div><span className="eyebrow">SEU ESPAÇO DE TRABALHO</span><h1>{page}</h1></div><span className="muted">{new Date().toLocaleDateString("pt-BR")}</span></header>{message && <div className="notice" role="status">{message} <button className="secondary" onClick={()=>notify("")}>×</button></div>}
  {page==="Painel" && <><div className="stats"><div className="card stat"><span className="eyebrow">CONCLUÍDOS HOJE</span><strong>{count}<small> / 50</small></strong><div className="progress"><span style={{width:Math.min(100,count*2)+"%"}}/></div><p>{Math.min(100,count*2)}% da meta diária</p></div><div className="card stat"><span className="eyebrow">NA FILA</span><strong>{pending.length}</strong><p>Vídeos pendentes</p></div><div className="card stat"><span className="eyebrow">COMENTÁRIOS</span><strong>{db.comments.length}</strong><p>Mensagens cadastradas</p></div><div className="card stat"><span className="eyebrow">HASHTAGS</span><strong>{db.tags.length}</strong><p>Assuntos acompanhados</p></div></div><section className="card"><div className="sectiontitle"><div><h2>Próximos vídeos</h2><p>Abra o vídeo, revise e publique o comentário no TikTok.</p></div><button className="secondary" onClick={()=>setPage("Fila de vídeos")}>Ver fila</button></div>{pending.length ? pending.slice(0,3).map(row) : <div className="empty">Sua fila está vazia. Adicione vídeos para começar.</div>}</section></>}
  {page==="Fila de vídeos" && <><section className="card"><h2>Adicionar vídeo</h2><p>Cole o link de um vídeo encontrado na pesquisa do TikTok.</p><form className="form" onSubmit={addVideo}><input type="url" placeholder="https://www.tiktok.com/@perfil/video/123..." value={url} onChange={e=>setUrl(e.target.value)} required/><select value={selectedTag} onChange={e=>setSelectedTag(e.target.value)}><option value="">Sem hashtag</option>{db.tags.map(t=><option key={t} value={t}>#{t}</option>)}</select><button>+ Adicionar</button></form></section><section className="card"><h2>Pendentes ({pending.length})</h2>{pending.length?pending.map(row):<div className="empty">Nenhum vídeo pendente.</div>}</section><section className="card"><h2>Histórico ({done.length})</h2>{done.length?done.map(row):<div className="empty">Nenhuma publicação registrada.</div>}</section></>}
  {page==="Hashtags" && <section className="card"><h2>Hashtags monitoradas</h2><p>Abra a página oficial da hashtag para encontrar vídeos e adicionar os links à fila.</p><form className="form" onSubmit={addTag}><input placeholder="Ex.: maquiagem" value={tag} onChange={e=>setTag(e.target.value)}/><button>+ Adicionar</button></form>{db.tags.map(t=><div className="item" key={t}><b>#{t}</b><div className="actions"><a className="button secondary" target="_blank" rel="noopener noreferrer" href={"https://www.tiktok.com/tag/"+encodeURIComponent(t)}>↗ Explorar TikTok</a><button className="secondary" onClick={()=>setDb(d=>({...d,tags:d.tags.filter(x=>x!==t)}))}>Excluir</button></div></div>)}</section>}
  {page==="Comentários" && <section className="card"><h2>Biblioteca de comentários</h2><p>Cadastre mensagens relevantes para os vídeos que você escolher.</p><form className="commentform" onSubmit={addComment}><textarea rows="3" maxLength="500" placeholder="Digite um comentário..." value={comment} onChange={e=>setComment(e.target.value)}/><div className="actions"><span className="muted">{comment.length}/500 caracteres</span><button>+ Salvar comentário</button></div></form>{db.comments.map(c=><div className="item" key={c}><span>{c}</span><button className="secondary" onClick={()=>setDb(d=>({...d,comments:d.comments.filter(x=>x!==c)}))}>Excluir</button></div>)}</section>}
  <footer>Comenta TTK · Sem publicação automática · Armazenamento local</footer></main></div>;
}
createRoot(document.getElementById("root")).render(<App />);
