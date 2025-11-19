// Interface minimale sans framework — hash routing
(function(){
  const $ = (sel, root=document) => root.querySelector(sel)
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel))

  const state = {
    route: location.hash || '#/',
    emails: { items: [], limit: 20, offset: 0, filters: { status:'', from:'', to:'', q:'' } },
    status: null,
    logs: [],
    config: {},
    autoRefreshLogs: false
  }

  // Utils
  async function fetchJSON(url, opts={}){
    const res = await fetch(url, opts)
    if(!res.ok){
      const txt = await res.text().catch(()=>res.statusText)
      throw new Error(`HTTP ${res.status}: ${txt}`)
    }
    return res.json()
  }
  function formatDate(dstr){
    if(!dstr) return ''
    const d = new Date(dstr)
    if(Number.isNaN(d.getTime())) return String(dstr)
    return d.toLocaleString()
  }
  function statusBadge(s){
    const cls = ['status', s].join(' ')
    const map = { received:'Reçu', sending:'Envoi…', sent:'Envoyé', failed:'Échec' }
    return `<span class="${cls}">${map[s]||s}</span>`
  }

  // Topbar status + actions
  async function updateTopStatus(){
    const el = document.getElementById('top-status')
    if(!el) return
    try{
      const st = await fetchJSON('/api/status')
      state.status = st
      const running = !!st.smtp?.running
      el.textContent = running ? `SMTP ${st.smtp?.port||''}` : 'SMTP off'
      el.classList.toggle('success-text', running)
      el.classList.toggle('error-text', !running)
      el.setAttribute('title', `SMTP ${running?'en ligne':'arrêté'} • port ${st.smtp?.port} • v${st.version}`)
    }catch(e){
      el.textContent = 'Erreur'
      el.classList.add('error-text')
      el.setAttribute('title', 'Statut indisponible')
    }
  }

  async function restartSmtp(){
    const btn = document.getElementById('btn-restart-smtp')
    if(btn){ btn.disabled = true }
    try{
      await fetchJSON('/api/smtp/restart', { method:'POST' })
      await updateTopStatus()
    }catch(e){
      alert('Echec redémarrage SMTP: ' + (e.message||e))
    }finally{ if(btn){ btn.disabled = false } }
  }

  // Modal
  function openModal(html){
    const modal = $('#modal')
    $('#modal-body').innerHTML = html
    modal.classList.remove('hidden')
    modal.setAttribute('aria-hidden','false')
  }
  function closeModal(){
    const modal = $('#modal')
    modal.classList.add('hidden')
    modal.setAttribute('aria-hidden','true')
  }
  document.addEventListener('click',(e)=>{
    if(e.target && (e.target.id==='modal-close' || e.target.classList.contains('modal'))){
      closeModal()
    }
  })

  // Views
  async function viewDashboard(){
    const app = $('#app')
    app.innerHTML = `<div class="grid cols-3">
      <div class="card"><h3>Statut</h3><div id="kpi-status" class="kpi">…</div><div class="small muted" id="kpi-status-detail"></div></div>
      <div class="card"><h3>Total emails</h3><div id="kpi-total" class="kpi">…</div><div class="small muted">Compté en base</div></div>
      <div class="card"><h3>Actions</h3>
        <div class="row"><a class="btn" href="#/emails">Voir les emails</a><a class="btn secondary" href="#/logs">Voir les logs</a></div>
      </div>
    </div>
    <div class="card mt-8"><h3>Derniers emails</h3><div id="latest">Chargement…</div></div>`

    try{
      const st = await fetchJSON('/api/status')
      state.status = st
      $('#kpi-status').textContent = st.smtp?.running? '🟢 En ligne' : '🔴 Arrêté'
      $('#kpi-status-detail').textContent = `SMTP port ${st.smtp?.port} • Version ${st.version}`
      $('#kpi-total').textContent = (st.totals?.emails ?? 0)
    }catch(e){
      $('#kpi-status').innerHTML = `<span class="error-text">Erreur statut</span>`
      console.error(e)
    }

    try{
      const list = await fetchJSON('/api/emails?limit=10')
      const items = list.items||[]
      if(!items.length){ $('#latest').innerHTML = '<span class="muted">Aucun email</span>'; return }
      const rows = items.map(it=>{
        const to = safeJoin(JSON.parse(it.to_addresses||'[]'))
        return `<div class="row space-between mb-8">
          <div>
            <div><strong>${it.subject||'(sans sujet)'}</strong></div>
            <div class="small muted">${formatDate(it.received_at)} • de ${it.from_address||''} → ${to||''}</div>
          </div>
          <div>${statusBadge(it.status)}</div>
        </div>`
      }).join('')
      $('#latest').innerHTML = rows + `<div class="mt-8"><a class="btn" href="#/emails">Voir tous les emails</a></div>`
    }catch(e){
      $('#latest').innerHTML = `<span class="error-text">Erreur de chargement</span>`
    }
  }

  function safeJoin(arr){
    return (arr||[]).filter(Boolean).join(', ')
  }

  async function viewEmails(){
    const app = $('#app')
    const f = state.emails.filters
    app.innerHTML = `<div class="card">
      <h3>Emails reçus</h3>
      <div class="toolbar">
        <input id="f-q" placeholder="Rechercher sujet, texte…" value="${escapeHtml(f.q)}" />
        <input id="f-from" placeholder="Expéditeur" value="${escapeHtml(f.from)}" />
        <input id="f-to" placeholder="Destinataire" value="${escapeHtml(f.to)}" />
        <select id="f-status">
          <option value="">Tous statuts</option>
          <option value="received">Reçu</option>
          <option value="sending">En cours</option>
          <option value="sent">Envoyé</option>
          <option value="failed">Échec</option>
        </select>
        <button class="btn" id="btn-search">Filtrer</button>
      </div>
      <div id="tbl-wrap">Chargement…</div>
      <div class="row mt-8">
        <button class="btn secondary" id="prev">◀ Précédent</button>
        <span class="muted small" id="pager-info"></span>
        <button class="btn secondary right" id="next">Suivant ▶</button>
      </div>
    </div>`
    $('#f-status').value = f.status

    async function load(){
      const q = new URLSearchParams()
      q.set('limit', String(state.emails.limit))
      q.set('offset', String(state.emails.offset))
      for(const k of ['status','from','to','q']){ if(state.emails.filters[k]) q.set(k, state.emails.filters[k]) }
      const data = await fetchJSON('/api/emails?'+q.toString())
      state.emails.items = data.items||[]
      state.emails.filters = data.filters || state.emails.filters
      renderTable()
    }

    function renderTable(){
      const items = state.emails.items
      if(!items.length){ $('#tbl-wrap').innerHTML = '<div class="muted">Aucun résultat</div>'; return }
      const rows = items.map(it=>{
        const to = safeJoin(JSON.parse(it.to_addresses||'[]'))
        return `<tr data-id="${it.id}" class="tr-email">
          <td class="small">${formatDate(it.received_at)}</td>
          <td>${escapeHtml(it.from_address||'')}</td>
          <td>${escapeHtml(to||'')}</td>
          <td>${escapeHtml(it.subject||'(sans sujet)')}</td>
          <td>${statusBadge(it.status)}</td>
          <td class="small">${it.size_bytes? (Number(it.size_bytes)/1024).toFixed(1)+' Ko' : ''}</td>
        </tr>`
      }).join('')
      $('#tbl-wrap').innerHTML = `<table><thead><tr>
        <th>Date/Heure</th><th>De</th><th>À</th><th>Sujet</th><th>Statut</th><th>Taille</th></tr></thead>
        <tbody>${rows}</tbody></table>`
      const count = items.length
      const start = state.emails.offset + (count?1:0)
      const end = state.emails.offset + count
      $('#pager-info').textContent = count? `${start}–${end}` : `0`
      // Click to open detail
      $$('#tbl-wrap .tr-email').forEach(tr=>tr.addEventListener('click',()=>openEmailDetail(tr.getAttribute('data-id'))))
    }

    $('#btn-search').addEventListener('click',()=>{
      state.emails.offset = 0
      state.emails.filters = {
        q: $('#f-q').value.trim(),
        from: $('#f-from').value.trim(),
        to: $('#f-to').value.trim(),
        status: $('#f-status').value
      }
      load().catch(err=>console.error(err))
    })
    $('#prev').addEventListener('click',()=>{ state.emails.offset = Math.max(0, state.emails.offset - state.emails.limit); load() })
    $('#next').addEventListener('click',()=>{ state.emails.offset += state.emails.limit; load() })

    load().catch(err=>{ $('#tbl-wrap').innerHTML = `<span class="error-text">${escapeHtml(err.message||String(err))}</span>` })
  }

  async function openEmailDetail(id){
    try{
      const email = await fetchJSON(`/api/emails/${id}`)
      const to = safeJoin(JSON.parse(email.to_addresses||'[]'))
      const cc = safeJoin(JSON.parse(email.cc_addresses||'[]'))
      const attachments = JSON.parse(email.attachments||'[]')
      const err = email.last_error ? `<div class="error-text small mt-8">Erreur: ${escapeHtml(email.last_error)}</div>` : ''
      openModal(`
        <h3>Email #${email.id}</h3>
        <div class="small muted">${formatDate(email.received_at)}</div>
        <div class="mt-8">
          <div><strong>De:</strong> ${escapeHtml(email.from_address||'')}</div>
          <div><strong>À:</strong> ${escapeHtml(to||'')}</div>
          ${cc?`<div><strong>CC:</strong> ${escapeHtml(cc)}</div>`:''}
          <div class="mt-8"><strong>Sujet:</strong> ${escapeHtml(email.subject||'(sans sujet)')}</div>
          <div class="mt-8">${statusBadge(email.status)}</div>
          ${err}
          <div class="mt-8"><button class="btn" id="btn-send">Envoyer / Retenter</button></div>
        </div>
        <div class="mt-8">
          <h4>Contenu</h4>
          ${email.body_text?`<pre style="white-space:pre-wrap">${escapeHtml(email.body_text)}</pre>`:''}
          ${email.body_html?`<div class="card" style="background:#0a0f1a"><iframe sandbox srcdoc="${escapeHtml(email.body_html)}" style="width:100%;height:240px;border:none;background:white"></iframe></div>`:''}
        </div>
        <div class="mt-8">
          <h4>Pièces jointes</h4>
          ${(attachments||[]).length? attachments.map(a=>`<span class="pill">${escapeHtml(a.filename||'PJ')} · ${a.size||0} o</span>`).join(''): '<span class="muted">Aucune</span>'}
        </div>
      `)
      $('#btn-send').addEventListener('click', async()=>{
        const btn = $('#btn-send'); btn.disabled = true; btn.textContent = 'Envoi…'
        try{
          const r = await fetchJSON(`/api/emails/${email.id}/send`, { method:'POST' })
          btn.textContent = 'Envoyé'
          btn.classList.add('success-text')
        }catch(e){
          btn.disabled = false; btn.textContent = 'Envoyer / Retenter'
          alert('Echec: '+ (e.message||e))
        }
      })
    }catch(e){
      openModal(`<span class="error-text">Erreur: ${escapeHtml(e.message||String(e))}</span>`)
    }
  }

  async function viewConfig(){
    const app = $('#app')
    app.innerHTML = `<div class="card"><h3>Configuration</h3>
      <div id="cfg-msg" class="small"></div>
      <div class="grid cols-3">
        <div>
          <label>SMTP_PORT</label>
          <input id="cfg-SMTP_PORT"/>
        </div>
        <div>
          <label>WEB_PORT</label>
          <input id="cfg-WEB_PORT"/>
        </div>
        <div>
          <label>O365_USER_EMAIL</label>
          <input id="cfg-O365_USER_EMAIL"/>
        </div>
        <div>
          <label>AZURE_TENANT_ID</label>
          <input id="cfg-AZURE_TENANT_ID"/>
        </div>
        <div>
          <label>AZURE_CLIENT_ID</label>
          <input id="cfg-AZURE_CLIENT_ID"/>
        </div>
        <div>
          <label>AZURE_CLIENT_SECRET</label>
          <input id="cfg-AZURE_CLIENT_SECRET"/>
        </div>
      </div>
      <div class="row mt-8">
        <button class="btn" id="btn-save">Enregistrer</button>
        <button class="btn secondary" id="btn-test">Tester Azure</button>
      </div>
    </div>`

    try{
      const data = await fetchJSON('/api/config')
      state.config = data.config || {}
      for(const k of ['SMTP_PORT','WEB_PORT','AZURE_TENANT_ID','AZURE_CLIENT_ID','AZURE_CLIENT_SECRET','O365_USER_EMAIL']){
        const el = $(`#cfg-${k}`); if(el) el.value = state.config[k] || ''
      }
    }catch(e){
      $('#cfg-msg').innerHTML = `<span class="error-text">Erreur: ${escapeHtml(e.message||String(e))}</span>`
    }

    $('#btn-save').addEventListener('click', async()=>{
      const body = {}
      for(const k of ['SMTP_PORT','WEB_PORT','AZURE_TENANT_ID','AZURE_CLIENT_ID','AZURE_CLIENT_SECRET','O365_USER_EMAIL']){
        body[k] = $(`#cfg-${k}`).value
      }
      try{
        const res = await fetchJSON('/api/config', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) })
        $('#cfg-msg').innerHTML = `<span class="success-text">Configuration enregistrée</span>`
      }catch(e){
        $('#cfg-msg').innerHTML = `<span class="error-text">${escapeHtml(e.message||String(e))}</span>`
      }
    })

    $('#btn-test').addEventListener('click', async()=>{
      const btn = $('#btn-test'); btn.disabled = true; btn.textContent='Test…'
      try{
        const r = await fetchJSON('/api/config/test', { method:'POST' })
        $('#cfg-msg').innerHTML = `<span class="success-text">Token OK – expire ${escapeHtml(r.expiresOn||'')}</span>`
      }catch(e){
        $('#cfg-msg').innerHTML = `<span class="error-text">Echec test: ${escapeHtml(e.message||String(e))}</span>`
      } finally { btn.disabled = false; btn.textContent='Tester Azure' }
    })
  }

  async function viewLogs(){
    const app = $('#app')
    app.innerHTML = `<div class="card"><h3>Logs Système</h3>
      <div class="toolbar"><select id="lvl"><option value="">Tous</option><option>info</option><option>warn</option><option>error</option></select>
      <label class="row"><input type="checkbox" id="auto"/> <span class="small">Auto-refresh (5s)</span></label>
      <button class="btn" id="refresh">Actualiser</button></div>
      <div id="logs">Chargement…</div></div>`

    async function load(){
      try{
        const data = await fetchJSON('/api/logs/system')
        state.logs = data.items||[]
        render()
      }catch(e){ $('#logs').innerHTML = `<span class="error-text">${escapeHtml(e.message||String(e))}</span>` }
    }
    function render(){
      const lvl = $('#lvl').value
      const items = (state.logs||[]).filter(x=>!lvl||x.level===lvl)
      if(!items.length){ $('#logs').innerHTML = '<span class="muted">Aucun log</span>'; return }
      $('#logs').innerHTML = items.map(x=>`<div class="row space-between mb-8">
        <div class="small muted">${formatDate(x.created_at)}</div>
        <div class="pill">${escapeHtml(x.component)}</div>
        <div class="pill">${escapeHtml(x.level)}</div>
        <div class="right">${escapeHtml(x.message)}</div>
      </div>`).join('')
    }
    $('#refresh').addEventListener('click', load)
    $('#lvl').addEventListener('change', render)
    $('#auto').addEventListener('change', (e)=>{ state.autoRefreshLogs = e.target.checked })
    setInterval(()=>{ if(state.autoRefreshLogs) load() }, 5000)
    load()
  }

  // Router
  function router(){
    const h = location.hash || '#/'
    state.route = h
    if(h==="#/"||h==="#") return viewDashboard()
    if(h.startsWith('#/emails')) return viewEmails()
    if(h.startsWith('#/config')) return viewConfig()
    if(h.startsWith('#/logs')) return viewLogs()
    // fallback
    return viewDashboard()
  }
  window.addEventListener('hashchange', router)
  document.addEventListener('DOMContentLoaded', ()=>{
    router()
    updateTopStatus()
    setInterval(updateTopStatus, 10000)
    const btn = document.getElementById('btn-restart-smtp')
    if(btn) btn.addEventListener('click', restartSmtp)
  })

  // helpers
  function escapeHtml(s){
    return String(s||'').replace(/[&<>"]/g, (c)=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))
  }
})();
