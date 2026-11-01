/**
 * Mini « PostgREST » de TEST : repond aux requetes supabase-js (GET/HEAD/POST/PATCH/DELETE sur
 * /rest/v1/<table>, POST /rest/v1/rpc/<fonction>) en les traduisant en SQL sur la base locale
 * jetable flowin_qa. Sous-ensemble suffisant pour l'application (filtres eq, neq, in, is, gt(e),
 * lt(e), like ; order ; limit ; select simple ; single). Aucune base distante.
 *
 * Identite : par defaut role `anon` (comme l'application en prod). Le controleur de test peut
 * simuler une session connectee : POST /__as?sub=<uuid> (role authenticated) ou /__as?sub= (anon).
 * usage : NODE_PATH=<pg> node shim-rest.js [port=54321]
 */
const http = require('http')
const { Pool, types } = require('pg')
// Comme PostgREST : une date reste « AAAA-MM-JJ » (pas un objet Date), les numeriques et bigint sont des nombres JSON.
types.setTypeParser(1082, v => v); types.setTypeParser(1700, parseFloat); types.setTypeParser(20, Number)
const pool = new Pool({ host: '/tmp', port: 54399, user: 'postgres', database: process.env.PGDB || 'flowin_qa', max: 8 })
let identite = { role: 'anon', sub: '' }

const IDENT = /^[a-z_][a-z0-9_]*$/i
const id = x => { if (!IDENT.test(x)) throw new Error('identifiant refuse : ' + x); return '"' + x + '"' }

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,HEAD,OPTIONS')
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range')
}

function filtres(params, vals) {
  const w = []
  params.forEach((v, k) => {
    if (['select', 'order', 'limit', 'offset', 'on_conflict', 'columns'].indexOf(k) >= 0) return
    if (k === 'or') { // or=(col.eq.val,col2.eq.val2)
      const parts = v.replace(/^\(|\)$/g, '').split(',').map(x => /^([a-z0-9_]+)\.(eq|neq|is)\.(.*)$/i.exec(x)).filter(Boolean)
      if (parts.length) w.push('(' + parts.map(m2 => { vals.push(m2[3]); return id(m2[1]) + '::text ' + (m2[2] === 'neq' ? '<>' : '=') + ' $' + vals.length }).join(' or ') + ')')
      return
    }
    const m = /^(not\.)?(eq|neq|gt|gte|lt|lte|like|ilike|is|in|cs)\.(.*)$/.exec(v)
    if (!m) return
    const neg = !!m[1], op = m[2], val = m[3]
    let cond
    if (op === 'cs') { vals.push(val); cond = id(k) + ' @> $' + vals.length + '::text[]' }
    else if (op === 'is') cond = id(k) + (neg ? ' is not ' : ' is ') + (val === 'null' ? 'null' : val === 'true' ? 'true' : 'false')
    else if (op === 'in') {
      const items = val.replace(/^\(|\)$/g, '').split(',').map(x => x.replace(/^"|"$/g, ''))
      vals.push(items); cond = id(k) + '::text ' + (neg ? '<> ' : '= ') + (neg ? 'all' : 'any') + '($' + vals.length + '::text[])'
    } else {
      const sym = { eq: '=', neq: '<>', gt: '>', gte: '>=', lt: '<', lte: '<=', like: 'like', ilike: 'ilike' }[op]
      vals.push(op === 'like' || op === 'ilike' ? val.replace(/\*/g, '%') : val)
      cond = id(k) + '::text ' + sym + ' $' + vals.length
      if (['gt', 'gte', 'lt', 'lte'].indexOf(op) >= 0) cond = id(k) + ' ' + sym + ' $' + vals.length
      if (neg) cond = 'not (' + cond + ')'
    }
    w.push(cond)
  })
  return w.length ? ' where ' + w.join(' and ') : ''
}

async function exec(sql, vals) {
  const c = await pool.connect()
  try {
    await c.query('begin')
    await c.query('set local role ' + identite.role)
    await c.query("select set_config('request.jwt.claim.sub', $1, true)", [identite.sub])
    const r = await c.query(sql, vals)
    await c.query('commit')
    return r
  } catch (e) { await c.query('rollback').catch(() => {}); throw e } finally { c.release() }
}


/* AUTO-REPARATION DE TEST (HEAL=1) : le DDL de plusieurs tables de production n'est pas dans sql/. Quand l'application lit
   une colonne ou une table qui n'existe pas dans la base locale, on la cree (type deduit du nom) et on rejoue la requete.
   Chaque ajout est journalise dans heal.sql pour devenir un supplement de test rejouable (db/12-colonnes-lues-par-le-code.sql). */
const HEAL = process.env.HEAL === '1'
const adminPool = new Pool({ host: '/tmp', port: 54399, user: 'postgres', database: process.env.PGDB || 'flowin_qa', max: 2 })
const typeDe = c => /(_at|_le|_du|^date_|_date$|^created|^updated|^first_seen|^last_seen)/.test(c) ? 'timestamptz'
  : /^(lots|cfg|stats|pro_visib|offre_cfg|social|theme|cfg_jeu|questions|bonus_answers|donnees|details|liens)$/.test(c) ? 'jsonb'
  : /^(quantite|montant|valeur|nb_|participants|gagnants|score|tickets|points|score_|ordre|duree|rang)/.test(c) ? 'numeric'
  : /^(actif|visible|retire|utilise|facture_emise|optin|publie|est_|a_|is_|logo_|forex|kit_|fiche_|bandeau|gain_ticket)/.test(c) ? 'boolean' : 'text'
async function soigner(e, table) {
  let m
  if (e.code === '42703' && (m = /column "([a-z0-9_]+)"(?: of relation "([a-z0-9_]+)")? does not exist/i.exec(e.message))) {
    const t = m[2] || table, ty = typeDe(m[1])
    await adminPool.query('alter table public.' + id(t) + ' add column if not exists ' + id(m[1]) + ' ' + ty)
    require('fs').appendFileSync(__dirname + '/heal.sql', 'alter table public.' + t + ' add column if not exists ' + m[1] + ' ' + ty + ';\n'); return true
  }
  if (e.code === '42P01' && (m = /relation "(?:public\.)?([a-z0-9_]+)" does not exist/i.exec(e.message))) {
    await adminPool.query('create table if not exists public.' + id(m[1]) + ' (id text primary key)')
    await adminPool.query('alter table public.' + id(m[1]) + ' enable row level security')
    await adminPool.query('create policy test_permissif on public.' + id(m[1]) + ' for all to anon, authenticated using (true) with check (true)')
    await adminPool.query('grant all on public.' + id(m[1]) + ' to anon, authenticated, service_role')
    require('fs').appendFileSync(__dirname + '/heal.sql', 'create table if not exists public.' + m[1] + ' (id text primary key); alter table public.' + m[1] + ' enable row level security; create policy test_permissif on public.' + m[1] + ' for all to anon, authenticated using (true) with check (true);\n'); return true
  }
  return false
}
async function execSoigne(sql, vals, table) {
  for (let i = 0; i < 25; i++) {
    try { return await exec(sql, vals) } catch (e) { if (!HEAL || !(await soigner(e, table).catch(() => false))) throw e }
  }
  return exec(sql, vals)
}

http.createServer(async (req, res) => {
  cors(res)
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end() }
  const u = new URL(req.url, 'http://x')
  if (u.pathname === '/__as') {
    const sub = u.searchParams.get('sub') || ''
    identite = sub ? { role: 'authenticated', sub } : { role: 'anon', sub: '' }
    res.writeHead(200); return res.end(JSON.stringify(identite))
  }
  const m = /^\/rest\/v1\/(rpc\/)?([a-z0-9_]+)$/i.exec(u.pathname)
  if (!m) { res.writeHead(404); return res.end('{}') }
  let body = ''
  for await (const ch of req) body += ch
  const json = body ? JSON.parse(body) : null
  const wantObject = /vnd\.pgrst\.object/.test(req.headers.accept || '')
  const prefer = req.headers.prefer || ''
  try {
    let rows, status = 200, range = null
    if (m[1]) {
      const args = json || {}, ks = Object.keys(args)
      const r = await execSoigne('select * from public.' + id(m[2]) + '(' + ks.map((k, i) => id(k) + ' => $' + (i + 1)).join(',') + ')', ks.map(k => args[k]), m[2])
      rows = r.rows
      if (r.fields.length === 1 && r.fields[0].name === m[2]) { const v = rows.length ? rows[0][m[2]] : null; res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(v === undefined ? null : v)) }
    } else if (req.method === 'GET' || req.method === 'HEAD') {
      const vals = []
      const where = filtres(u.searchParams, vals)
      let cols = '*'
      const sel = u.searchParams.get('select')
      if (sel && sel !== '*' && !/[()]/.test(sel)) cols = sel.split(',').map(x => id(x.trim())).join(',')
      let sql = 'select ' + cols + ' from public.' + id(m[2]) + where
      const ord = u.searchParams.getAll('order')
      if (ord.length) sql += ' order by ' + ord.join(',').split(',').map(o => { const p = o.split('.'); return id(p[0]) + (p[1] === 'desc' ? ' desc' : ' asc') + (p.indexOf('nullsfirst') >= 0 ? ' nulls first' : p.indexOf('nullslast') >= 0 ? ' nulls last' : '') }).join(',')
      if (u.searchParams.get('limit')) sql += ' limit ' + Number(u.searchParams.get('limit'))
      const r = await execSoigne(sql, vals, m[2])
      rows = r.rows; range = '0-' + Math.max(0, rows.length - 1) + '/' + rows.length
    } else if (req.method === 'POST') {
      const list = Array.isArray(json) ? json : [json]
      const ks = Array.from(new Set(list.flatMap(o => Object.keys(o))))
      const vals = []
      const tuples = list.map(o => '(' + ks.map(k => { vals.push(o[k] !== null && typeof o[k] === 'object' ? JSON.stringify(o[k]) : (o[k] === undefined ? null : o[k])); return '$' + vals.length }).join(',') + ')')
      let sql = 'insert into public.' + id(m[2]) + ' (' + ks.map(id).join(',') + ') values ' + tuples.join(',')
      if (u.searchParams.get('on_conflict')) sql += ' on conflict (' + u.searchParams.get('on_conflict').split(',').map(id).join(',') + ') ' + (/ignore-duplicates/.test(prefer) ? 'do nothing' : 'do update set ' + ks.map(k => id(k) + '=excluded.' + id(k)).join(','))
      sql += ' returning *'
      const r = await execSoigne(sql, vals, m[2]); rows = r.rows; status = 201
    } else if (req.method === 'PATCH') {
      const vals = []
      const ks = Object.keys(json)
      const sets = ks.map(k => { vals.push(json[k] !== null && typeof json[k] === 'object' ? JSON.stringify(json[k]) : json[k]); return id(k) + ' = $' + vals.length }).join(',')
      const where = filtres(u.searchParams, vals)
      const r = await execSoigne('update public.' + id(m[2]) + ' set ' + sets + where + ' returning *', vals, m[2]); rows = r.rows
    } else if (req.method === 'DELETE') {
      const vals = []
      const where = filtres(u.searchParams, vals)
      const r = await execSoigne('delete from public.' + id(m[2]) + where + ' returning *', vals, m[2]); rows = r.rows
    }
    const h = { 'Content-Type': 'application/json' }
    if (range) h['Content-Range'] = range
    if (req.method === 'HEAD') { res.writeHead(200, h); return res.end() }
    if (wantObject) {
      if (rows.length !== 1) { res.writeHead(406, h); return res.end(JSON.stringify({ code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned', details: 'The result contains ' + rows.length + ' rows', hint: null })) }
      res.writeHead(status, h); return res.end(JSON.stringify(rows[0]))
    }
    if (/return=minimal/.test(prefer) && req.method !== 'GET') { res.writeHead(204, h); return res.end() }
    res.writeHead(status, h); res.end(JSON.stringify(rows))
  } catch (e) {
    res.writeHead(e.code && /^2[23]|^42/.test(e.code) ? 400 : 500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ code: e.code || 'XX000', message: e.message, details: null, hint: null }))
  }
}).listen(Number(process.argv[2] || 54321), '127.0.0.1', () => console.log('shim REST sur', process.argv[2] || 54321))
