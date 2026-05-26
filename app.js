// ============================================================
//  CONFIG
// ============================================================
const SUPABASE_URL      = 'https://lheprzwjxnckwovdivfb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_nDvHBgKJ0taX7cMGWo4_6A_1j_H5xmi';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
//  ESTADO
// ============================================================
const S = {
  mes: new Date().getMonth(),
  ano: new Date().getFullYear(),
  txs: [],
  grafCat: null,
  grafMes: null,
  txSel: null,
  orc: {},
  user: null,
  tipoAtual: 'despesa',
};

// ============================================================
//  DADOS ESTÁTICOS
// ============================================================
const CAT_DESP = {
  alimentacao: { n:'Alimentação', i:'🍔' },
  transporte:  { n:'Transporte',  i:'🚗' },
  compras:     { n:'Compras',     i:'🛍️' },
  saude:       { n:'Saúde',       i:'💊' },
  moradia:     { n:'Moradia',     i:'🏠' },
  lazer:       { n:'Lazer',       i:'🎮' },
  educacao:    { n:'Educação',    i:'📚' },
  outros:      { n:'Outros',      i:'📦' },
};
const CAT_REC = {
  salario:     { n:'Salário',     i:'💼' },
  freelance:   { n:'Freelance',   i:'💻' },
  investimento:{ n:'Investimento',i:'📈' },
  aluguel:     { n:'Aluguel',     i:'🏘️' },
  bonus:       { n:'Bônus',       i:'🎁' },
  reembolso:   { n:'Reembolso',   i:'↩️' },
  presente:    { n:'Presente',    i:'🎀' },
  outros_rec:  { n:'Outros',      i:'💰' },
};
const CATS = { ...CAT_DESP, ...CAT_REC };
const MEIOS = { pix:'PIX', debito:'Débito', credito:'Crédito', dinheiro:'Dinheiro', transferencia:'Transferência', deposito:'Depósito' };
const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const CORES = ['#7c6ff7','#1ec99a','#f0566e','#f0a030','#38bdf8','#a78bfa','#fb923c','#4ade80'];

// ============================================================
//  UTILS
// ============================================================
const R$  = v => v.toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
const dtF = s => { const [y,m,d]=s.split('-'); return `${d}/${m}/${y}`; };
const mlb = (m,a) => `${MESES[m]} ${a}`;

function filtMes(lst, m, a) {
  return lst.filter(t => {
    const d = new Date(t.data+'T00:00:00');
    return d.getMonth()===m && d.getFullYear()===a;
  });
}

// ============================================================
//  TEMA
// ============================================================
function initTema() { aplicarTema(localStorage.getItem('tema')||'dark'); }
function aplicarTema(t) {
  document.documentElement.setAttribute('data-tema', t==='light'?'light':'');
  const b = document.getElementById('btn-tema');
  if (b) b.textContent = t==='light' ? '🌙' : '☀';
  localStorage.setItem('tema', t);
}
function toggleTema() { aplicarTema(localStorage.getItem('tema')==='dark'?'light':'dark'); }

// ============================================================
//  AUTH
// ============================================================
async function initAuth() {
  const { data:{ session } } = await db.auth.getSession();
  if (session?.user) { S.user = session.user; mostrarApp(); }
  else mostrarLogin();

  db.auth.onAuthStateChange((_, session) => {
    if (session?.user) { S.user = session.user; mostrarApp(); }
    else { S.user = null; mostrarLogin(); }
  });
}

function mostrarLogin() {
  document.getElementById('tela-login').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
}

function mostrarApp() {
  document.getElementById('tela-login').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');

  const meta = S.user?.user_metadata;
  const img  = document.getElementById('avatar-img');
  img.src = meta?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(meta?.full_name||'U')}&background=7c6ff7&color=fff`;

  // Saudação
  const h = new Date().getHours();
  const sd = h<12 ? 'Bom dia' : h<18 ? 'Boa tarde' : 'Boa noite';
  const n = meta?.given_name || meta?.full_name?.split(' ')[0] || '';
  document.getElementById('dash-saudacao').textContent = `${sd}${n ? ', '+n : ''} 👋`;

  carregarOrc();
  renderDash();
}

async function loginGoogle() {
  const b = document.getElementById('btn-google-login');
  b.disabled = true; b.textContent = 'Redirecionando...';
  const { error } = await db.auth.signInWithOAuth({
    provider: 'google', options: { redirectTo: window.location.href }
  });
  if (error) {
    const e = document.getElementById('login-erro');
    e.textContent = 'Erro ao conectar. Tente novamente.';
    e.classList.remove('hidden');
    b.disabled = false; b.textContent = 'Entrar com Google';
  }
}

async function fazerLogout() {
  await db.auth.signOut();
  S.txs = []; invalidCache();
  toggleAvatarDD(true);
}

function toggleAvatarDD(close=false) {
  const dd = document.getElementById('avatar-dd');
  if (close) dd.classList.add('hidden');
  else dd.classList.toggle('hidden');
}
document.addEventListener('click', e => {
  const w = document.getElementById('avatar-wrap');
  if (w && !w.contains(e.target)) document.getElementById('avatar-dd')?.classList.add('hidden');
});

// ============================================================
//  NAVEGAÇÃO
// ============================================================
function mudarTela(id) {
  document.querySelectorAll('.tela').forEach(t => { t.classList.remove('active'); t.classList.add('hidden'); });
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const tela = document.getElementById(id);
  tela.classList.remove('hidden'); tela.classList.add('active');

  const mapa = { 'tela-dashboard':'nav-dashboard', 'tela-lancamento':'nav-lancamento', 'tela-historico':'nav-historico' };
  if (mapa[id]) document.getElementById(mapa[id]).classList.add('active');

  if (id==='tela-dashboard')  renderDash();
  if (id==='tela-historico')  renderHist();
  if (id==='tela-lancamento' && !document.getElementById('editando-id').value) resetForm();
}

// ============================================================
//  CACHE (localStorage)
// ============================================================
const CK = 'fin_tx', CT = 'fin_ts', TTL = 5*60*1000;

function salvarCache(l) {
  try { localStorage.setItem(CK, JSON.stringify(l)); localStorage.setItem(CT, Date.now()); } catch(e){}
}
function lerCache() {
  try {
    const ts = +localStorage.getItem(CT)||0, raw = localStorage.getItem(CK);
    if (!raw || Date.now()-ts>TTL) return null;
    return JSON.parse(raw);
  } catch(e){ return null; }
}
function invalidCache() { localStorage.removeItem(CK); localStorage.removeItem(CT); }

async function carregarTxs(force=false) {
  if (!force) { const c=lerCache(); if(c){ S.txs=c; return c; } }
  const { data, error } = await db.from('transacoes').select('*').order('data',{ascending:false});
  if (error) { console.error(error); return S.txs; }
  S.txs = data||[]; salvarCache(S.txs); return S.txs;
}

// Pull-to-refresh
let ptY=0, ptBusy=false;
document.addEventListener('touchstart', e => { ptY=e.touches[0].clientY; }, {passive:true});
document.addEventListener('touchend', async e => {
  if (e.changedTouches[0].clientY-ptY > 85 && window.scrollY===0 && !ptBusy) {
    ptBusy=true; mostrarToast('Atualizando…','inf');
    invalidCache(); S.txs=[];
    const a = document.querySelector('.tela.active')?.id;
    if (a==='tela-dashboard') await renderDash();
    if (a==='tela-historico') await renderHist();
    ptBusy=false;
  }
},{passive:true});

// ============================================================
//  ORÇAMENTOS
// ============================================================
function carregarOrc() {
  try { S.orc = JSON.parse(localStorage.getItem('orc')||'{}'); } catch(e){ S.orc={}; }
}
function salvarOrcamentos() {
  const novo={};
  document.querySelectorAll('.orc-campo-input').forEach(i => {
    const v=parseFloat(i.value); if(v>0) novo[i.dataset.cat]=v;
  });
  S.orc=novo; localStorage.setItem('orc',JSON.stringify(novo));
  fecharModalOrc();
  mostrarToast('Orçamentos salvos ✓','ok');
  renderOrc(filtMes(S.txs, S.mes, S.ano));
}
function abrirModalOrc() {
  document.getElementById('orc-campos').innerHTML = Object.entries(CATS)
    .filter(([k]) => k in CAT_DESP)
    .map(([k,c]) => `
      <div class="orc-campo-row">
        <span class="orc-campo-lbl">${c.i} ${c.n}</span>
        <input type="number" class="orc-campo-input" data-cat="${k}"
               inputmode="decimal" placeholder="0,00" value="${S.orc[k]||''}">
      </div>`).join('');
  document.getElementById('modal-orc-overlay').classList.remove('hidden');
}
function fecharModalOrc() { document.getElementById('modal-orc-overlay').classList.add('hidden'); }

// ============================================================
//  DASHBOARD
// ============================================================
async function renderDash() {
  const lst  = await carregarTxs();
  const doMes = filtMes(lst, S.mes, S.ano);
  const rec  = doMes.filter(t=>t.tipo==='receita').reduce((s,t)=>s+t.valor,0);
  const desp = doMes.filter(t=>t.tipo==='despesa').reduce((s,t)=>s+t.valor,0);
  const saldo= rec-desp;

  document.getElementById('dash-saldo').textContent = R$(saldo);
  document.getElementById('dash-rec').textContent   = R$(rec);
  document.getElementById('dash-desp').textContent  = R$(desp);
  document.getElementById('label-mes').textContent  = mlb(S.mes, S.ano);

  const badge = document.getElementById('dash-saldo-badge');
  badge.textContent = (saldo>=0?'+':'')+R$(saldo);
  badge.className   = 'kpi-badge '+(saldo>=0?'positive':'negative');

  renderFatura(doMes);
  renderGrafCat(doMes);
  renderOrc(doMes);
  renderGrafMes(lst);
  renderListaTx('lista-dash', doMes.slice(0,5));
}

// ---- Fatura crédito ----
function renderFatura(lst) {
  const cred = lst.filter(t=>t.tipo==='despesa' && t.meio_pagamento==='credito');
  const sec  = document.getElementById('fatura-section');
  if (!cred.length) { sec.classList.add('hidden'); return; }
  sec.classList.remove('hidden');
  const tot = cred.reduce((s,t)=>s+t.valor,0);
  document.getElementById('fatura-total').textContent = R$(tot);
  const por={};
  cred.forEach(t=>{ por[t.descricao]=(por[t.descricao]||0)+t.valor; });
  document.getElementById('fatura-lista').innerHTML =
    Object.entries(por).sort((a,b)=>b[1]-a[1]).slice(0,5)
    .map(([n,v])=>`<li class="fatura-item"><span class="fatura-nome">${n}</span><span class="fatura-val">${R$(v)}</span></li>`)
    .join('');
}

// ---- Gráfico categorias ----
function renderGrafCat(lst) {
  const desp = lst.filter(t=>t.tipo==='despesa');
  const por  = {};
  desp.forEach(t=>{ por[t.categoria]=(por[t.categoria]||0)+t.valor; });
  const labels=Object.keys(por), vals=Object.values(por), tot=vals.reduce((s,v)=>s+v,0);

  const empty = document.getElementById('chart-cat-empty');
  const cv    = document.getElementById('chart-cat');
  if (!labels.length) { empty.classList.remove('hidden'); cv.style.display='none'; document.getElementById('legenda-cat').innerHTML=''; return; }
  empty.classList.add('hidden'); cv.style.display='block';

  if (S.grafCat) S.grafCat.destroy();
  S.grafCat = new Chart(cv.getContext('2d'), {
    type: 'doughnut',
    data: { labels, datasets:[{ data:vals, backgroundColor:CORES.slice(0,labels.length), borderWidth:0, hoverOffset:8 }] },
    options: {
      cutout:'66%', responsive:true, maintainAspectRatio:false,
      plugins: { legend:{display:false}, tooltip:{ callbacks:{ label:c=>` ${R$(c.raw)} (${((c.raw/tot)*100).toFixed(0)}%)` } } }
    }
  });

  document.getElementById('legenda-cat').innerHTML = labels.map((cat,i)=>{
    const info = CATS[cat]||{n:cat,i:'📦'};
    return `<li class="legenda-item">
      <div class="legenda-l">
        <div class="legenda-dot" style="background:${CORES[i]};color:${CORES[i]}"></div>
        <span class="legenda-nome">${info.i} ${info.n}</span>
      </div>
      <div class="legenda-r">
        <div class="legenda-val">${R$(vals[i])}</div>
        <div class="legenda-pct">${((vals[i]/tot)*100).toFixed(0)}%</div>
      </div>
    </li>`;
  }).join('');
}

// ---- Orçamentos ----
function renderOrc(doMes) {
  const el = document.getElementById('orc-lista');
  const cats = Object.keys(S.orc);
  if (!cats.length) { el.innerHTML='<div class="orc-empty">Nenhum orçamento. Toque em "Editar".</div>'; return; }

  const gastos={};
  doMes.filter(t=>t.tipo==='despesa').forEach(t=>{ gastos[t.categoria]=(gastos[t.categoria]||0)+t.valor; });

  el.innerHTML = cats.map(cat=>{
    const info=CATS[cat]||{n:cat,i:'📦'};
    const lim=S.orc[cat], gasto=gastos[cat]||0;
    const pct=Math.min((gasto/lim)*100,100);
    const cls=pct>=100?'over':pct>=75?'warn':'';
    return `<div class="orc-item">
      <div class="orc-head">
        <span class="orc-nome">${info.i} ${info.n}</span>
        <span class="orc-vals">${R$(gasto)} / ${R$(lim)}</span>
      </div>
      <div class="orc-track"><div class="orc-fill ${cls}" style="width:${pct}%"></div></div>
    </div>`;
  }).join('');
}

// ---- Gráfico mensal ----
function renderGrafMes(lst) {
  const hoje=new Date();
  const meses=Array.from({length:6},(_,i)=>{ const d=new Date(hoje.getFullYear(),hoje.getMonth()-(5-i),1); return {m:d.getMonth(),a:d.getFullYear()}; });
  const rec =meses.map(x=>filtMes(lst,x.m,x.a).filter(t=>t.tipo==='receita').reduce((s,t)=>s+t.valor,0));
  const des =meses.map(x=>filtMes(lst,x.m,x.a).filter(t=>t.tipo==='despesa').reduce((s,t)=>s+t.valor,0));

  if (S.grafMes) S.grafMes.destroy();
  S.grafMes = new Chart(document.getElementById('chart-mensal').getContext('2d'),{
    type:'bar',
    data:{
      labels:meses.map(x=>MESES[x.m]),
      datasets:[
        { label:'Receitas', data:rec, backgroundColor:'rgba(30,201,154,.75)', borderRadius:6, borderSkipped:false },
        { label:'Despesas', data:des, backgroundColor:'rgba(240,86,110,.75)', borderRadius:6, borderSkipped:false },
      ]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{labels:{color:'#7e89ac',font:{size:11},boxWidth:10,boxHeight:10}}, tooltip:{callbacks:{label:c=>` ${R$(c.raw)}`}} },
      scales:{
        x:{ ticks:{color:'#404868',font:{size:11}}, grid:{display:false} },
        y:{ ticks:{color:'#404868',font:{size:10},callback:v=>'R$'+(v>=1000?(v/1000).toFixed(0)+'k':v)}, grid:{color:'rgba(255,255,255,0.03)'} }
      }
    }
  });
}

// ---- Lista TX ----
function renderListaTx(elId, lst) {
  const ul = document.getElementById(elId);
  if (!lst.length) { ul.innerHTML='<li class="tx-empty"><span>Nenhuma transação neste período.</span></li>'; return; }
  ul.innerHTML = lst.map(t=>{
    const info=CATS[t.categoria]||{n:t.categoria,i:'📦'};
    const sinal=t.tipo==='receita'?'+':'-';
    const parc=t.total_parcelas>1?` · ${t.parcela_atual}/${t.total_parcelas}`:'';
    const rec=t.recorrente?'<span class="badge-rec">↻</span>':'';
    return `<li onclick="abrirModal('${t.id}')">
      <div class="tx-ico">${info.i}</div>
      <div class="tx-info">
        <div class="tx-desc">${t.descricao}</div>
        <div class="tx-meta">${dtF(t.data)} · ${info.n}${parc}${rec}</div>
      </div>
      <div class="tx-val ${t.tipo}">${sinal}${R$(t.valor)}</div>
    </li>`;
  }).join('');
}

// ============================================================
//  HISTÓRICO
// ============================================================
function preencherFMes() {
  const s=document.getElementById('f-mes');
  s.innerHTML='<option value="">Todos os meses</option>';
  const h=new Date();
  for(let i=0;i<24;i++){
    const d=new Date(h.getFullYear(),h.getMonth()-i,1);
    const v=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    s.innerHTML+=`<option value="${v}">${mlb(d.getMonth(),d.getFullYear())}</option>`;
  }
}

async function renderHist() {
  const lst = await carregarTxs();
  aplicarFiltros(lst);
}

function aplicarFiltros(lst) {
  const mes   = document.getElementById('f-mes').value;
  const cat   = document.getElementById('f-cat').value;
  const tipo  = document.getElementById('f-tipo').value;
  const busca = document.getElementById('f-busca').value.toLowerCase().trim();

  let f=lst;
  if(mes){ const [a,m]=mes.split('-').map(Number); f=f.filter(t=>{ const d=new Date(t.data+'T00:00:00'); return d.getFullYear()===a&&d.getMonth()===m-1; }); }
  if(cat)   f=f.filter(t=>t.categoria===cat);
  if(tipo)  f=f.filter(t=>t.tipo===tipo);
  if(busca) f=f.filter(t=>t.descricao?.toLowerCase().includes(busca)||t.local_ou_pessoa?.toLowerCase().includes(busca));

  document.getElementById('f-count').textContent=`${f.length} transaç${f.length!==1?'ões':'ão'} encontrada${f.length!==1?'s':''}`;
  renderListaTx('lista-hist', f);
}

// ============================================================
//  EXPORT CSV
// ============================================================
function exportarCSV() {
  if (!S.txs.length) { mostrarToast('Sem dados para exportar.','err'); return; }
  const h=['Data','Tipo','Descrição','Local/Fonte','Valor','Categoria','Meio','Parcela','Total Parcelas','Recorrente'];
  const rows=S.txs.map(t=>[
    dtF(t.data), t.tipo, `"${t.descricao}"`, `"${t.local_ou_pessoa||t.fonte||''}"`,
    t.valor.toFixed(2).replace('.',','),
    CATS[t.categoria]?.n||t.categoria,
    MEIOS[t.meio_pagamento]||t.meio_pagamento,
    t.parcela_atual||1, t.total_parcelas||1, t.recorrente?'Sim':'Não'
  ]);
  const csv=[h,...rows].map(r=>r.join(';')).join('\n');
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'}));
  a.download=`financas_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  mostrarToast('CSV exportado ✓','ok');
}

// ============================================================
//  MODAL DETALHE
// ============================================================
function abrirModal(id) {
  const t=S.txs.find(x=>String(x.id)===String(id));
  if (!t) return;
  S.txSel=t;

  const info=CATS[t.categoria]||{n:t.categoria,i:'📦'};
  const sinal=t.tipo==='receita'?'+':'-';

  document.getElementById('modal-titulo').textContent=`${info.i} ${t.descricao}`;
  document.getElementById('modal-body').innerHTML=`
    <div class="modal-row"><span>Valor</span><span style="color:${t.tipo==='receita'?'var(--grn)':'var(--red)'}">${sinal}${R$(t.valor)}</span></div>
    <div class="modal-row"><span>Data</span><span>${dtF(t.data)}</span></div>
    <div class="modal-row"><span>Tipo</span><span style="text-transform:capitalize">${t.tipo}</span></div>
    <div class="modal-row"><span>Categoria</span><span>${info.n}</span></div>
    <div class="modal-row"><span>Meio</span><span>${MEIOS[t.meio_pagamento]||t.meio_pagamento}</span></div>
    ${t.local_ou_pessoa ? `<div class="modal-row"><span>Local/Pessoa</span><span>${t.local_ou_pessoa}</span></div>` : ''}
    ${t.total_parcelas>1 ? `<div class="modal-row"><span>Parcela</span><span>${t.parcela_atual}/${t.total_parcelas}</span></div>` : ''}
    ${t.recorrente ? `<div class="modal-row"><span>Recorrência</span><span style="color:var(--acc)">↻ Mensal</span></div>` : ''}
  `;

  document.getElementById('mbtn-excluir').onclick=()=>excluir(t.id);
  document.getElementById('mbtn-editar').onclick =()=>abrirEdicao(t);
  document.getElementById('modal-overlay').classList.remove('hidden');
}
function fecharModal() { document.getElementById('modal-overlay').classList.add('hidden'); }

async function excluir(id) {
  if (!confirm('Excluir esta transação?')) return;
  const { error } = await db.from('transacoes').delete().eq('id',id);
  if (error) { mostrarToast('Erro ao excluir.','err'); return; }
  mostrarToast('Excluída.','ok'); fecharModal();
  invalidCache();
  S.txs=S.txs.filter(t=>String(t.id)!==String(id));
  salvarCache(S.txs);
  const a=document.querySelector('.tela.active')?.id;
  if(a==='tela-dashboard') renderDash();
  if(a==='tela-historico') renderHist();
}

function abrirEdicao(t) {
  fecharModal();
  document.getElementById('editando-id').value = t.id;
  document.getElementById('form-titulo').textContent = 'Editar Transação';
  document.getElementById('btn-txt').textContent = 'Salvar Alterações';

  setTipo(t.tipo);
  document.getElementById('campo-data').value   = t.data;
  document.getElementById('campo-desc').value   = t.descricao;
  document.getElementById('campo-valor').value  = t.valor;
  document.getElementById('campo-recorrente').checked = !!t.recorrente;

  if (t.tipo==='despesa') {
    document.getElementById('campo-local').value = t.local_ou_pessoa||'';
    document.getElementById('meio-desp').value   = t.meio_pagamento;
    selecionarCat('cat-grid-desp','cat-desp', t.categoria);
  } else {
    document.getElementById('campo-fonte').value = t.local_ou_pessoa||'';
    document.getElementById('meio-rec').value    = t.meio_pagamento;
    selecionarCat('cat-grid-rec','cat-rec', t.categoria);
  }

  totalParcelas=1; atualizarStepper();
  mudarTela('tela-lancamento');
}

// ============================================================
//  FORMULÁRIO — TIPO
// ============================================================
function setTipo(tipo) {
  S.tipoAtual = tipo;
  document.getElementById('campo-tipo').value = tipo;

  const bD=document.getElementById('btn-tipo-desp');
  const bR=document.getElementById('btn-tipo-rec');
  bD.classList.toggle('active', tipo==='despesa');
  bR.classList.toggle('active', tipo==='receita');

  document.getElementById('bloco-despesa').classList.toggle('hidden', tipo!=='despesa');
  document.getElementById('bloco-receita').classList.toggle('hidden', tipo!=='receita');

  // Label descrição
  document.getElementById('lbl-desc').textContent = tipo==='despesa' ? 'O que foi?' : 'Descrição';
  // Cor do valor
  const vw = document.getElementById('valor-wrap');
  vw.style.borderColor = tipo==='despesa' ? 'rgba(240,86,110,.35)' : 'rgba(30,201,154,.35)';

  // Resetar categorias se mudando tipo
  if (tipo==='despesa') selecionarCat('cat-grid-desp','cat-desp','alimentacao');
  else                  selecionarCat('cat-grid-rec','cat-rec','salario');
}

function selecionarCat(gridId, hiddenId, val) {
  document.querySelectorAll(`#${gridId} .cat-btn`).forEach(b=>{
    b.classList.toggle('active', b.dataset.v===val);
  });
  document.getElementById(hiddenId).value=val;
}

// Listeners categorias despesa
document.querySelectorAll('#cat-grid-desp .cat-btn').forEach(b=>{
  b.addEventListener('click', ()=>selecionarCat('cat-grid-desp','cat-desp',b.dataset.v));
});
// Listeners categorias receita
document.querySelectorAll('#cat-grid-rec .cat-btn').forEach(b=>{
  b.addEventListener('click', ()=>selecionarCat('cat-grid-rec','cat-rec',b.dataset.v));
});

// ============================================================
//  FORMULÁRIO — STEPPER PARCELAS
// ============================================================
let totalParcelas=1;
document.getElementById('parc-plus').addEventListener('click',()=>{ if(totalParcelas<24){totalParcelas++;atualizarStepper();} });
document.getElementById('parc-minus').addEventListener('click',()=>{ if(totalParcelas>1){totalParcelas--;atualizarStepper();} });
document.getElementById('campo-recorrente').addEventListener('change', function(){
  const g=document.getElementById('grupo-parcelas');
  g.style.opacity=this.checked?.4:1;
  g.style.pointerEvents=this.checked?'none':'';
  if(this.checked){totalParcelas=1;atualizarStepper();}
});
document.getElementById('campo-valor').addEventListener('input', atualizarStepper);

function atualizarStepper() {
  document.getElementById('parc-display').textContent=`${totalParcelas}x`;
  document.getElementById('total-parcelas').value=totalParcelas;
  const v=parseFloat(document.getElementById('campo-valor').value);
  document.getElementById('parc-unit').textContent = totalParcelas>1&&v>0 ? `= ${R$(v/totalParcelas)} cada` : '';
}

// ============================================================
//  FORMULÁRIO — VALIDAÇÃO & SUBMIT
// ============================================================
function validarForm() {
  let ok=true;
  const setE=(wId,eId,show)=>{ document.getElementById(wId).classList.toggle('err',show); document.getElementById(eId).classList.toggle('hidden',!show); if(show) ok=false; };
  const v=parseFloat(document.getElementById('campo-valor').value);
  setE('valor-wrap','erro-valor', !v||v<=0);
  setE('campo-data','erro-data', !document.getElementById('campo-data').value);
  setE('campo-desc','erro-desc', !document.getElementById('campo-desc').value.trim());
  return ok;
}

document.getElementById('form-transacao').addEventListener('submit', async function(e){
  e.preventDefault();
  if (!validarForm()) return;

  const btn=document.getElementById('btn-submit');
  btn.disabled=true;
  document.getElementById('btn-txt').classList.add('hidden');
  document.getElementById('btn-spin').classList.remove('hidden');

  const editId   = document.getElementById('editando-id').value;
  const tipo     = S.tipoAtual;
  const data     = document.getElementById('campo-data').value;
  const desc     = document.getElementById('campo-desc').value.trim();
  const valor    = parseFloat(document.getElementById('campo-valor').value);
  const rec      = document.getElementById('campo-recorrente').checked;

  let localOuPessoa='', meio='', categoria='', nParc=1;

  if (tipo==='despesa') {
    localOuPessoa = document.getElementById('campo-local').value.trim();
    meio          = document.getElementById('meio-desp').value;
    categoria     = document.getElementById('cat-desp').value;
    nParc         = parseInt(document.getElementById('total-parcelas').value)||1;
  } else {
    localOuPessoa = document.getElementById('campo-fonte').value.trim();
    meio          = document.getElementById('meio-rec').value;
    categoria     = document.getElementById('cat-rec').value;
    nParc         = 1; // receita nunca tem parcelas
  }

  let error;

  if (editId) {
    // EDIÇÃO
    ({ error } = await db.from('transacoes').update({
      tipo, data, descricao:desc, local_ou_pessoa:localOuPessoa,
      valor, meio_pagamento:meio, categoria, recorrente:rec,
    }).eq('id',editId));
  } else {
    // INSERÇÃO
    const vParc    = parseFloat((valor/nParc).toFixed(2));
    const grupoId  = nParc>1 ? crypto.randomUUID() : null;
    const lista    = Array.from({length:nParc},(_,i)=>{
      const dp=new Date(data+'T00:00:00'); dp.setMonth(dp.getMonth()+i);
      return { tipo, descricao:desc, local_ou_pessoa:localOuPessoa,
               valor:vParc, data:dp.toISOString().split('T')[0],
               meio_pagamento:meio, categoria, recorrente:rec,
               parcela_atual:i+1, total_parcelas:nParc, compra_grupo_id:grupoId };
    });
    ({ error } = await db.from('transacoes').insert(lista));
  }

  btn.disabled=false;
  document.getElementById('btn-txt').classList.remove('hidden');
  document.getElementById('btn-spin').classList.add('hidden');

  if (error) {
    mostrarToast(`Erro: ${error.message}`,'err');
  } else {
    const msg = editId ? 'Alterações salvas ✓'
      : (nParc>1 ? `${nParc} parcelas salvas ✓` : 'Transação salva ✓');
    mostrarToast(msg,'ok');
    invalidCache(); S.txs=[];
    resetForm();
    setTimeout(()=>mudarTela('tela-dashboard'), 700);
  }
});

function resetForm() {
  document.getElementById('form-transacao').reset();
  document.getElementById('editando-id').value='';
  document.getElementById('form-titulo').textContent='Nova Transação';
  document.getElementById('btn-txt').textContent='Salvar';
  totalParcelas=1; atualizarStepper();
  document.getElementById('campo-data').value=new Date().toISOString().split('T')[0];
  setTipo('despesa');
  document.querySelectorAll('.campo-erro').forEach(e=>e.classList.add('hidden'));
  document.querySelectorAll('.err').forEach(e=>e.classList.remove('err'));
  document.getElementById('grupo-parcelas').style.opacity='';
  document.getElementById('grupo-parcelas').style.pointerEvents='';
  document.getElementById('valor-wrap').style.borderColor='';
}

// ============================================================
//  MÊS NAV
// ============================================================
document.getElementById('btn-mes-prev').addEventListener('click',()=>{
  S.mes--; if(S.mes<0){S.mes=11;S.ano--;} renderDash();
});
document.getElementById('btn-mes-next').addEventListener('click',()=>{
  S.mes++; if(S.mes>11){S.mes=0;S.ano++;} renderDash();
});

// ============================================================
//  FILTROS HISTÓRICO
// ============================================================
['f-mes','f-cat','f-tipo'].forEach(id=>{
  document.getElementById(id).addEventListener('change',()=>aplicarFiltros(S.txs));
});
document.getElementById('f-busca').addEventListener('input',()=>aplicarFiltros(S.txs));

// ============================================================
//  TOAST
// ============================================================
function mostrarToast(msg, tipo='ok') {
  const t=document.getElementById('toast');
  t.textContent=msg; t.className=`toast ${tipo}`;
  t.classList.remove('hidden');
  clearTimeout(t._t);
  t._t=setTimeout(()=>t.classList.add('hidden'), 3200);
}

// ============================================================
//  INIT
// ============================================================
document.addEventListener('DOMContentLoaded',()=>{
  initTema();
  preencherFMes();
  document.getElementById('campo-data').value = new Date().toISOString().split('T')[0];
  document.getElementById('btn-tema').addEventListener('click', toggleTema);
  document.getElementById('btn-google-login').addEventListener('click', loginGoogle);
  document.getElementById('avatar-wrap').addEventListener('click', ()=>toggleAvatarDD());
  document.getElementById('btn-mes-prev');
 //initAuth();  //← login desativado por enquanto
mostrarApp();
});
