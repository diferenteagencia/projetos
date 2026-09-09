(() => {
  const data = window.PROJECT_DATA;
  const brands = [...new Set(data.projects.map((p) => p.brand).filter(Boolean))];
  const state = { year: data.years.at(-1) || 'Todos', month: 'Todos', brand: 'Todos', type: 'Todos', priority: 'Todos', stage: 'Todos', classification: 'score', view: 'management' };
  const $ = (s) => document.querySelector(s);
  const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  const number = new Intl.NumberFormat('pt-BR');
  const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const brandColors = { OLYMPIKUS: '#1463ff', MIZUNO: '#173487', 'UNDER ARMOUR': '#434a54' };
  const statusColors = { 'NÃO INICIADO': '#8c8c8c', 'EM ANDAMENTO': '#d49a00', CONCLUÍDO: '#548235', ATRASADO: '#cf4d4d', CONGELADO: '#4f89bd', 'STAND BY': '#5f8fb6', DECLINADO: '#b44242', FINALIZADO: '#548235', 'SEM STATUS': '#a0aec0' };
  const priorityColors = { Urgente: '#c53030', Alta: '#dd6b20', Média: '#d69e2e', Baixa: '#548235', 'Sem informação': '#718096' };
  const text = (v) => v == null ? '' : String(v);
  const esc = (v) => text(v).replace(/[&<>'"]/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c]));
  const sum = (rows, f) => rows.reduce((t, p) => t + (Number(p[f]) || 0), 0);
  const unique = (rows, f) => new Set(rows.map((p) => p[f]).filter(Boolean)).size;
  const countBy = (rows, f, fallback = 'Sem informação') => rows.reduce((a, p) => { const k = p[f] || fallback; a[k] = (a[k] || 0) + 1; return a; }, {});
  const entries = (counts, n = 8) => Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0,n);
  const color = (brand) => brandColors[brand] || '#7c8aa5';
  const y = (p) => p.requestDate.slice(0,4);
  const m = (p) => p.requestDate ? String(Number(p.requestDate.slice(5,7))) : '';
  const formatDate = (iso) => iso ? new Intl.DateTimeFormat('pt-BR').format(new Date(`${iso}T12:00:00`)) : 'Sem data';
  const projectName = (project) => `${project.network || project.storeName || 'Loja não informada'} — ${project.description || project.projectType || 'Tipo não informado'}`;

  function filtered({ ignoreBrand = false } = {}) {
    return data.projects.filter((p) =>
      (state.year === 'Todos' || y(p) === state.year) &&
      (state.month === 'Todos' || m(p) === state.month) &&
      (ignoreBrand || state.brand === 'Todos' || p.brand === state.brand) &&
      (state.type === 'Todos' || p.projectType === state.type) &&
      (state.priority === 'Todos' || p.priority === state.priority) &&
      (state.stage === 'Todos' || p.stage === state.stage)
    );
  }
  function kpi(label, value) { return `<article class="kpi"><span class="kpi-label">${label}</span><strong class="kpi-value">${value}</strong></article>`; }
  function fillSelect(id, values, allLabel) { $(id).innerHTML = [`<option value="Todos">${allLabel}</option>`, ...values.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`)].join(''); }
  function setFilters() {
    fillSelect('#yearFilter', data.years.slice().reverse(), 'Todos os anos');
    fillSelect('#monthFilter', months.map((name, i) => `${i+1}|${name}`), 'Todos os meses');
    $('#monthFilter').innerHTML = '<option value="Todos">Todos os meses</option>' + months.map((name,i) => `<option value="${i+1}">${name}</option>`).join('');
    fillSelect('#brandFilter', brands, 'Todas as marcas');
    fillSelect('#typeFilter', [...new Set(data.projects.map((p) => p.projectType).filter(Boolean))], 'Todos os tipos');
    fillSelect('#priorityFilter', [...new Set(data.projects.map((p) => p.priority).filter(Boolean))], 'Todas as prioridades');
    fillSelect('#stageFilter', [...new Set(data.projects.map((p) => p.stage).filter(Boolean))], 'Todas as etapas');
    [['#yearFilter','year'],['#monthFilter','month'],['#brandFilter','brand'],['#typeFilter','type'],['#priorityFilter','priority'],['#stageFilter','stage']].forEach(([id,key]) => {
      $(id).value = state[key]; $(id).addEventListener('change', (e) => { state[key] = e.target.value; render(); });
    });
  }
  function renderBars(id, rows, tint, empty) {
    const el = $(id); if (!rows.length) { el.innerHTML = `<div class="empty-state">${empty || 'Não há dados para este recorte.'}</div>`; return; }
    const max = Math.max(...rows.map(([,v])=>v),1);
    el.innerHTML = rows.map(([label,value]) => `<div class="bar-row"><span class="bar-label" title="${esc(label)}">${esc(label)}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.max(3,value/max*100)}%;background:${tint(label)}">${value>1?value:''}</div></div><span class="bar-value">${value}</span></div>`).join('');
  }
  function renderOverview() {
    const all = filtered({ ignoreBrand: true }); const rows = filtered();
    const context = [state.year === 'Todos' ? 'Todos os anos' : state.year, state.month === 'Todos' ? 'todos os meses' : months[Number(state.month)-1], state.brand === 'Todos' ? 'todas as marcas' : state.brand].join(' · ');
    $('#filterContext').textContent = context;
    $('#overviewKpis').innerHTML = [kpi('Projetos',number.format(rows.length)),kpi('Portas',number.format(sum(rows,'doors'))),kpi('Redes',number.format(unique(rows,'network'))),kpi('Investimento',currency.format(sum(rows,'investment')))].join('');
    const pieRows = brands.map((brand) => ({ brand, investment: sum(all.filter((p)=>p.brand===brand),'investment') })); const total=sum(pieRows,'investment'); let start=0;
    const segments=pieRows.map((r)=>{ const share=total?r.investment/total*100:0; const out=`${color(r.brand)} ${start}% ${start+share}%`; start+=share; return out; });
    $('#investmentPie').style.background=segments.length?`conic-gradient(${segments.join(',')})`:'#d9e2ec'; $('#pieTotal').textContent=currency.format(total);
    $('#pieLegend').innerHTML=pieRows.map((r)=>{const share=total?r.investment/total*100:0;return `<div class="legend-item"><span class="swatch" style="background:${color(r.brand)}"></span><div><strong>${esc(r.brand)}</strong><small>${share.toFixed(1)}% · ${currency.format(r.investment)}</small></div></div>`;}).join('');
  }
  function renderBrands() {
    const all=filtered({ignoreBrand:true}); $('#brandCards').innerHTML=brands.map((brand)=>{const r=all.filter((p)=>p.brand===brand);return `<button type="button" class="brand-card ${state.brand===brand?'is-selected':''}" style="--brand-color:${color(brand)}" data-brand="${esc(brand)}"><span class="brand-card-title"><span><i class="swatch" style="background:${color(brand)}"></i> ${esc(brand)}</span><span>Ver detalhe</span></span><span class="brand-card-metrics"><span>Projetos<strong>${number.format(r.length)}</strong></span><span>Portas<strong>${number.format(sum(r,'doors'))}</strong></span><span>Investimento<strong>${currency.format(sum(r,'investment'))}</strong></span></span></button>`;}).join('');
    document.querySelectorAll('[data-brand]').forEach((b)=>b.addEventListener('click',()=>{state.brand=b.dataset.brand; $('#brandFilter').value=state.brand; render();}));
  }
  function renderManagement() {
    const rows=filtered(); renderBars('#priorityChart',entries(countBy(rows,'priority')), (x)=>priorityColors[x]||'#718096');
    const attention=rows.filter((p)=>['EM ANDAMENTO','STAND BY','CONGELADO','ATRASADO'].includes(p.status)); $('#attentionCount').textContent=number.format(attention.length);
    $('#attentionList').innerHTML=attention.sort((a,b)=>a.requestDate.localeCompare(b.requestDate)).slice(0,6).map((p)=>`<div class="attention-item"><button type="button" class="project-trigger" data-project-id="${p.id}"><strong title="${esc(projectName(p))}">${esc(projectName(p))}</strong><span>${esc(p.brand)} · ${esc(p.stage)} · ${p.blocker ? `Bloqueador: ${esc(p.blocker)}` : formatDate(p.requestDate)}</span></button><span class="status-badge" style="background:${statusColors[p.status]||'#718096'}">${esc(p.status)}</span></div>`).join('') || '<div class="empty-state">Não há projetos em atenção neste recorte.</div>';
    const monthly=months.map((name,i)=>[name.slice(0,3), rows.filter((p)=>m(p)===String(i+1)).length]).filter(([,v])=>v); renderBars('#monthlyChart',monthly,()=> '#0c8cab');
  }
  function renderChannel(rows) { const channels=[...new Set(rows.map(p=>p.channel||'Sem canal'))]; const items=channels.map((channel)=>({channel,values:brands.map((brand)=>({brand,value:rows.filter((p)=>(p.channel||'Sem canal')===channel&&p.brand===brand).length}))})).sort((a,b)=>b.values.reduce((s,x)=>s+x.value,0)-a.values.reduce((s,x)=>s+x.value,0)); const max=Math.max(1,...items.map(r=>r.values.reduce((s,x)=>s+x.value,0))); $('#brandLegend').innerHTML=brands.map(b=>`<span><i class="swatch" style="background:${color(b)}"></i>${esc(b)}</span>`).join(''); $('#channelChart').innerHTML=items.map((r)=>{const total=r.values.reduce((s,x)=>s+x.value,0);return `<div class="stack-row"><span class="stack-label" title="${esc(r.channel)}">${esc(r.channel)}</span><div class="stack-track">${r.values.filter(x=>x.value).map(x=>`<span class="stack-segment" style="width:${x.value/max*100}%;background:${color(x.brand)}">${x.value>1?x.value:''}</span>`).join('')}</div><span class="stack-total">${total}</span></div>`;}).join('')||'<div class="empty-state">Não há dados para este recorte.</div>'; }
  function renderCharts() { const rows=filtered(); renderChannel(rows); renderBars('#projectTypeChart',entries(countBy(rows,'projectType')),()=> '#1463ff'); renderBars('#descriptionChart',entries(countBy(rows,'description'),8),()=> '#0c8cab'); const f=state.classification; $('#classificationTitle').textContent=f==='score'?'Projetos por Score Trade':'Projetos por Cluster'; renderBars('#classificationChart',entries(countBy(rows.filter(p=>p[f]),f)),()=> '#6d54c8',f==='cluster'?'Ainda não há classificações de cluster preenchidas neste recorte.':undefined); renderBars('#statusChart',entries(countBy(rows,'status','SEM STATUS')),(s)=>statusColors[s]||'#718096'); }
  function renderTimeline() { const rows=filtered().filter((p)=>['EM ANDAMENTO','STAND BY','CONGELADO','ATRASADO'].includes(p.status)).sort((a,b)=>a.requestDate.localeCompare(b.requestDate)); $('#timelineKpis').innerHTML=[['Ativos',rows.length],['Em andamento',rows.filter(p=>p.status==='EM ANDAMENTO').length],['Stand by',rows.filter(p=>p.status==='STAND BY').length]].map(([l,v])=>`<div class="timeline-kpi"><span>${l}</span><strong>${v}</strong></div>`).join(''); $('#timelineRows').innerHTML=rows.map((p)=>{const c=statusColors[p.status]||'#718096'; return `<div class="timeline-row"><div class="timeline-project"><button type="button" class="project-trigger" data-project-id="${p.id}"><strong title="${esc(projectName(p))}">${esc(projectName(p))}</strong><span>${formatDate(p.requestDate)}</span></button></div><div class="timeline-meta">${esc(p.brand)}<br>${esc(p.priority||'Sem prioridade')}</div><div class="timeline-stage">${esc(p.stage)}</div><span class="status-badge" style="background:${c}">${esc(p.status)}</span><div class="timeline-blocker ${p.blocker ? 'has-blocker' : ''}">${esc(p.blocker || 'Sem bloqueador informado')}</div><div class="timeline-journey" style="--journey-color:${c}"><span class="journey-date">Solicitação<br>${formatDate(p.requestDate)}</span><span class="journey-line"></span><span class="journey-date">Etapa atual<br>${formatDate(p.stageStart||p.requestDate)}</span></div></div>`;}).join('')||'<div class="empty-state">Não há projetos ativos com os filtros atuais.</div>'; }
  function showProjectDetail(id) { const p=data.projects.find((project)=>String(project.id)===String(id)); if(!p) return; $('#dialogProjectName').textContent=projectName(p); const statusColor=statusColors[p.status]||'#718096'; $('#dialogBody').innerHTML=[['Marca',esc(p.brand)],['Rede / loja',esc(p.network||p.storeName||'Não informado')],['Descrição / tipo',esc(p.description||p.projectType||'Não informado')],['Tipo operacional',esc(p.projectType||'Não informado')],['Prioridade',esc(p.priority||'Não informada')],['Canal',esc(p.channel||'Não informado')],['Data da solicitação',esc(formatDate(p.requestDate))],['Etapa atual',esc(p.stage||'Não definida')],['Data da etapa',esc(formatDate(p.stageStart))],['Status atual',`<span class="status-badge" style="background:${statusColor}">${esc(p.status||'SEM STATUS')}</span>`],['Bloqueador da etapa',esc(p.blocker||'Sem bloqueador informado')],['Portas',number.format(p.doors)],['Investimento',currency.format(p.investment)]].map(([label,value])=>`<div class="detail-item ${label==='Bloqueador da etapa'||label==='Descrição / tipo'?'wide':''}"><span>${label}</span><strong>${value}</strong></div>`).join(''); $('#projectDialog').showModal(); }
  function bindProjectTriggers(){document.querySelectorAll('[data-project-id]').forEach((button)=>button.addEventListener('click',()=>showProjectDetail(button.dataset.projectId)));}
  function render(){renderOverview();renderBrands();renderManagement();renderCharts();renderTimeline();bindProjectTriggers();}
  $('#dataSummary').textContent=`${number.format(data.projectCount)} projetos carregados da Base Geral · atualização: ${new Intl.DateTimeFormat('pt-BR').format(new Date(data.generatedAt))}`;
  setFilters(); $('#closeDialog').addEventListener('click',()=>$('#projectDialog').close()); document.querySelectorAll('[data-classification]').forEach((b)=>b.addEventListener('click',()=>{state.classification=b.dataset.classification;document.querySelectorAll('[data-classification]').forEach(x=>x.classList.toggle('is-active',x===b));renderCharts();})); document.querySelectorAll('[data-view]').forEach((b)=>b.addEventListener('click',()=>{state.view=b.dataset.view;$('#managementView').classList.toggle('is-hidden',state.view!=='management');$('#timelineView').classList.toggle('is-hidden',state.view!=='timeline');document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('is-active',x===b));})); render();
})();
