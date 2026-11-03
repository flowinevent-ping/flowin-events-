/**
 * Captures et controles de CHAQUE ecran de l'espace pro (390 et 1440 px) sur la base locale jetable.
 * Controles : page chargee (pas de 404 / page d'erreur Next), pas de debordement horizontal a 390 px,
 * erreurs console et reponses 4xx/5xx listees, texte « event / evenement » absent, liens internes testes.
 * usage : NODE_PATH=<pg+playwright> node pro-ecrans.js <dossier-sortie> <url-app> <url-shim>
 */
const { chromium } = require('playwright')
const fs = require('fs')
const OUT = process.argv[2], BASE = process.argv[3] || 'http://127.0.0.1:3100', SHIM = process.argv[4] || 'http://127.0.0.1:54321'
fs.mkdirSync(OUT, { recursive: true })
const PRO = 'pro-demo'
const q = `?pro=${PRO}`
const SESSION = (uid, email) => {
  const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url')
  const exp = Math.floor(Date.now() / 1000) + 86400
  const jwt = b64({ alg: 'HS256', typ: 'JWT' }) + '.' + b64({ sub: uid, email, role: 'authenticated', exp, aud: 'authenticated' }) + '.sig'
  return { access_token: jwt, refresh_token: 'r', expires_in: 86400, expires_at: exp, token_type: 'bearer', user: { id: uid, email, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() } }
}
const ECRANS = [
  ['01-accueil-animations', `/pro${q}`],
  ['02-fiche-animation-jeu', `/pro/operation${q}&op=ev:ev-demo-auto&onglet=jeu`],
  ['03-fiche-animation-lots', `/pro/operation${q}&op=ev:ev-demo-auto&onglet=lots`],
  ['04-fiche-animation-diffusion-qr', `/pro/operation${q}&op=ev:ev-demo-auto&onglet=diffusion`],
  ['05-fiche-animation-gagnants', `/pro/operation${q}&op=ev:ev-demo-auto&onglet=gagnants`],
  ['06-fiche-animation-trafic', `/pro/operation${q}&op=ev:ev-demo-auto&onglet=trafic`],
  ['07-fiche-animation-contacts', `/pro/operation${q}&op=ev:ev-demo-auto&onglet=crm`],
  ['08-fiche-animation-bons', `/pro/operation${q}&op=ev:ev-demo-auto&onglet=bons`],
  ['09-super-event-participants', `/pro/operation${q}&op=se:se-demo-2026&onglet=crm`],
  ['10-super-events-liste', `/pro/super${q}`],
  ['11-super-event-bilan', `/pro/super${q}&se=se-demo-2026`],
  ['12-nouvelle-animation', `/pro/nouvelle${q}`],
  ['13-scanner-billet', `/pro/scanner${q}`],
  ['14-contacts-stats', `/pro/donnees${q}`],
  ['15-contacts-gagnants', `/pro/donnees${q}&onglet=gagnants`],
  ['16-contacts-trafic', `/pro/donnees${q}&onglet=trafic`],
  ['17-profil', `/pro/compte${q}`],
  ['18-entreprise', `/pro/entreprise${q}`],
  ['19-banques-quiz', `/pro/banques${q}`],
  ['20-banque-fiche', `/pro/banques/bq-demo-1${q}`],
  ['21-commandes-factures', `/pro/commandes${q}`],
  ['22-historique', `/pro/historique${q}`],
  ['23-lots', `/pro/lots${q}`],
  ['24-parcours-joueur', `/pro/parcours${q}`],
  ['25-contrat', `/pro/contrat${q}`],
  ['26-premiere-fois', `/pro/premiere-fois`],
  ['27-connexion', `/pro/connexion`],
  ['28-inscription', `/pro/inscription`],
  ['29-rejoindre', `/pro/rejoindre${q}`],
  ['30-compte-en-attente', `/pro/commandes?pro=pro-nouveau`, 'nouveau'],
  ['31-acces-bloque-accueil', `/pro?pro=pro-nouveau`, 'nouveau'],
  ['32-droit-coupe', `/pro/banques?pro=pro-b`, 'b'],
]
const SESSIONS = { nouveau: ['00000000-0000-4000-8000-0000000000c1', 'nouveau@test.invalid'], b: ['00000000-0000-4000-8000-0000000000b1', 'garage@test.invalid'] }
;(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME_BIN })
  const rapport = []
  for (const [w, h, tag] of [[390, 844, 'm390'], [1440, 900, 'd1440']]) {
    for (const [nom, chemin, qui] of ECRANS.filter(e => !process.env.ONLY || new RegExp(process.env.ONLY).test(e[0]))) {
      const [uid, mail] = SESSIONS[qui || ''] || ['00000000-0000-4000-8000-0000000000a1', 'boulangerie@test.invalid']
      await fetch(SHIM + '/__as?sub=' + uid, { method: 'POST' }) // le mini-PostgREST prend l'identite du pro connecte
      const ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
      await ctx.addInitScript(s => { try { localStorage.setItem('sb-127-auth-token', JSON.stringify(s)) } catch (e) {} }, SESSION(uid, mail))
      const p = await ctx.newPage()
      const erreurs = [], reseau = []
      p.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|ERR_NAME|ERR_INTERNET|fonts\.g/.test(m.text())) erreurs.push(m.text().slice(0, 160)) })
      p.on('pageerror', e => erreurs.push('JS: ' + String(e.message).slice(0, 160)))
      p.on('response', r => { if (r.status() >= 400 && !/favicon|_next\/static|\.map$/.test(r.url())) reseau.push(r.status() + ' ' + r.url().replace(BASE, '').replace(SHIM, 'shim').slice(0, 110)) })
      let statut = 0
      try { const r = await p.goto(BASE + chemin, { waitUntil: 'networkidle', timeout: 90000 }); statut = r ? r.status() : 0 } catch (e) { erreurs.push('NAV: ' + e.message.slice(0, 120)) }
      await p.waitForTimeout(600)
      const info = await p.evaluate(() => ({
        deborde: document.documentElement.scrollWidth > window.innerWidth + 2,
        texte: document.body.innerText || '',
        liens: Array.from(document.querySelectorAll('a[href]')).map(a => a.getAttribute('href')).filter(h => h && h.startsWith('/')).slice(0, 80),
        boutonsMorts: Array.from(document.querySelectorAll('button')).filter(b => !b.disabled && !b.onclick && !b.getAttribute('type') && !b.closest('form') && false).length,
      }))
      const pbm = []
      if (statut >= 400) pbm.push('HTTP ' + statut)
      if (/Application error|This page could not be found|Unhandled Runtime Error/i.test(info.texte)) pbm.push('page d\'erreur')
      if (tag === 'm390' && info.deborde) pbm.push('debordement horizontal')
      const mots = info.texte.replace(/\S*flowin-events\S*/gi, '').replace(/super[ -]?events?/gi, '').match(/\b(events?|évènements?|événements?)\b/gi)
      if (mots) {
        const ctxt = []; const re2 = /.{0,40}\b(events?|évènements?|événements?)\b.{0,30}/gi; const sans = info.texte.replace(/\S*flowin-events\S*/gi, '').replace(/super[ -]?events?/gi, '')
        let mm; while ((mm = re2.exec(sans)) && ctxt.length < 2) ctxt.push(mm[0].replace(/\s+/g, ' '))
        pbm.push('vocabulaire : ' + ctxt.join(' // '))
      }
      if (/\b(PGRST|Could not find|schema cache|duplicate key|violates|permission denied|syntax error)\b/i.test(info.texte)) pbm.push('message technique visible')
      await p.screenshot({ path: `${OUT}/${nom}-${tag}.png`, fullPage: true })
      rapport.push({ nom, tag, statut, pbm, erreurs: erreurs.slice(0, 4), reseau: reseau.slice(0, 5), liens: info.liens })
      console.log(`${pbm.length || erreurs.length ? 'A VOIR' : 'ok    '} ${tag} ${nom}${pbm.length ? '  -> ' + pbm.join(' | ') : ''}${erreurs.length ? '  [console: ' + erreurs[0] + ']' : ''}${reseau.length ? '  [reseau: ' + reseau[0] + ']' : ''}`)
      await ctx.close()
    }
  }
  // liens internes : chaque cible distincte est testee (hors liens avec ?pro= differents)
  const cibles = Array.from(new Set(rapport.flatMap(r => r.liens))).filter(h => !/^\/(dashboard|nds|parcours|jouer|q\/|landing)/.test(h))
  const ctx = await br.newContext()
  const morts = []
  for (const h of cibles) { try { const r = await ctx.request.get(BASE + h, { timeout: 60000, maxRedirects: 5 }); if (r.status() >= 400) morts.push(r.status() + ' ' + h) } catch (e) { morts.push('ERR ' + h) } }
  fs.writeFileSync(OUT + '/rapport.json', JSON.stringify({ rapport, morts }, null, 1))
  console.log('LIENS INTERNES TESTES:', cibles.length, ' MORTS:', morts.length); morts.forEach(m => console.log('  ' + m))
  await br.close()
})()
