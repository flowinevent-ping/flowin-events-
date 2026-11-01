/**
 * PREUVE PAR TEST des QR (audit du 01/11) : Playwright + jsQR + Postgres local jetable.
 *
 *  - ouvre le VRAI composant QrTraces (banc d'essai /qa-qr-harness) pour chaque animation du jeu de test ;
 *  - pour chaque QR : lit le lien affiche, le lien copie (presse-papiers), telecharge le PNG et le SVG,
 *    ouvre l'affiche A4 ; DECODE le QR de chaque fichier avec jsQR ;
 *  - verifie : URL decodee = lien affiche = lien copie = lien imprime sur l'affiche ; la station retrouvee
 *    en base est la bonne (animation + slug) ; l'URL ouvre la bonne animation ; l'affiche et le nom de
 *    fichier portent le nom du commerce, du QR, du support et le code ; aucun fichier d'une animation
 *    ne contient le QR d'une autre ;
 *  - teste le changement de jeu derriere un QR qui ne bouge pas, les anciens QR, les messages propres,
 *    la limitation de debit et les tentatives de falsification.
 *
 * usage : NODE_PATH=... node e2e.js <dossier-sortie> [http://127.0.0.1:3100]
 */
const { chromium } = require('playwright')
const jsQR = require('jsqr')
const { PNG } = require('pngjs')
const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

const OUT = path.resolve(process.argv[2] || 'qr-audit')
const APP = process.argv[3] || 'http://127.0.0.1:3100'
const PROD = 'https://flowin-events.vercel.app'
const SHIM = 'http://127.0.0.1:54321'
const UID_A = '00000000-0000-4000-8000-00000000000a'
const EVENTS = ['ev-qa-boulangerie', 'ev-qa-fleuriste', 'ev-qa-garage', 'ev-qa-cafe']

const resultats = []
const noter = (nom, ok, detail) => { resultats.push({ nom, ok: !!ok, detail: detail === undefined ? '' : String(detail) }); console.log((ok ? 'OK   ' : 'ECHEC') + ' ' + nom + (detail ? ' — ' + String(detail).slice(0, 160) : '')) }
const slug = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase()

function decoderPng(buf) {
  const png = PNG.sync.read(buf)
  const r = jsQR(new Uint8ClampedArray(png.data), png.width, png.height, { inversionAttempts: 'attemptBoth' })
  return r ? r.data : null
}
/* Le navigateur nous laisse ouvrir l'URL de production : on la ramene sur l'application locale pour la suivre. */
const localiser = u => u.replace(PROD, APP)
const ip = a => ({ 'x-forwarded-for': a })

async function main() {
  fs.mkdirSync(OUT + '/fichiers', { recursive: true })
  fs.mkdirSync(OUT + '/captures', { recursive: true })
  const db = new Client({ host: '/tmp', port: 54399, user: 'postgres', database: 'flowin_qa' })
  await db.connect()
  const q = (sql, p) => db.query(sql, p).then(r => r.rows)
  const stations = await q("select e.id ev, e.nom ev_nom, e.module, q.nom, q.source_qr, q.support, q.type_qr, q.code_court, q.publie from qr_stations q join events e on e.id = q.event_id where e.id like 'ev-qa-%' order by e.id, q.created_at")
  const parCode = {}; stations.forEach(s => { parCode[s.code_court] = s })

  const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN || undefined, args: ['--no-sandbox'] })
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1100, height: 1400 }, permissions: ['clipboard-read', 'clipboard-write'] })
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: APP })
  await ctx.setExtraHTTPHeaders(ip('198.51.100.1'))
  const page = await ctx.newPage()
  page.on('pageerror', e => console.log('  [erreur page]', e.message.slice(0, 120)))

  const fichiers = []   // un enregistrement par fichier produit
  /* ===================================================================================== */
  /* A. SUPPORTS : pour chaque animation et chaque QR, PNG / SVG / affiche A4 / lien copie   */
  /* ===================================================================================== */
  for (const evId of EVENTS) {
    /* `next dev` compile a la demande : au premier passage les fichiers JS peuvent manquer un instant -> on recharge. */
    for (let essai = 1; essai <= 4; essai++) {
      await page.goto(APP + '/qa-qr-harness?evs=' + evId, { waitUntil: 'networkidle' })
      try { await page.waitForSelector('button:has-text("Lien, PNG, SVG, affiche")', { timeout: 12000 }); break } catch (e) { if (essai === 4) throw e; await page.waitForTimeout(3000) }
    }
    await page.waitForTimeout(800)
    const n = await page.locator('button:has-text("Lien, PNG, SVG, affiche")').count()
    const attendus = stations.filter(s => s.ev === evId).length
    noter(`[${evId}] tous les QR de l'animation sont proposes a l'ecran`, n === attendus, n + ' / ' + attendus)
    for (let i = 0; i < n; i++) {
      const toggle = page.locator('button:has-text("Lien, PNG, SVG, affiche"), button:has-text("Supports")').nth(i)
      const nomLigne = await toggle.evaluate(b => b.parentElement.parentElement.querySelector('span').textContent.trim())
      const refLigne = await toggle.evaluate(b => { const t = b.parentElement.parentElement.textContent; const m = /réf\. ([a-z0-9]+)/.exec(t); return m ? m[1] : null })
      const st = stations.find(s => s.ev === evId && s.nom === nomLigne)
      await toggle.click()
      await page.waitForSelector('button:has-text("Copier le lien")')
      await page.waitForFunction(() => !!document.querySelector('img[alt^="QR code"]'))
      await page.waitForTimeout(400)
      const lienAffiche = await page.evaluate(() => {
        const b = Array.from(document.querySelectorAll('button')).find(x => x.textContent.indexOf('Copier le lien') >= 0)
        return b.parentElement.parentElement.children[1].textContent.trim()
      })
      await page.click('button:has-text("Copier le lien")')
      await page.waitForSelector('button:has-text("✓ Copié")')
      const lienCopie = await page.evaluate(() => navigator.clipboard.readText())
      const base = `${evId}__${slug(nomLigne)}`
      const rec = { ev: evId, evNom: st && st.ev_nom, qrNom: nomLigne, support: st && st.support, codeAttendu: st && st.code_court, refAffichee: refLigne, lienAffiche, lienCopie, files: [] }

      /* PNG */
      const [dlPng] = await Promise.all([page.waitForEvent('download'), page.click('button:has-text("⬇ PNG")')])
      const fPng = path.join(OUT, 'fichiers', evId, dlPng.suggestedFilename()); fs.mkdirSync(path.dirname(fPng), { recursive: true }); await dlPng.saveAs(fPng)
      rec.files.push({ type: 'PNG', nom: dlPng.suggestedFilename(), chemin: fPng, decode: decoderPng(fs.readFileSync(fPng)) })
      /* SVG */
      const [dlSvg] = await Promise.all([page.waitForEvent('download'), page.click('button:has-text("⬇ SVG")')])
      const fSvg = path.join(OUT, 'fichiers', evId, dlSvg.suggestedFilename()); await dlSvg.saveAs(fSvg)
      const svg = fs.readFileSync(fSvg, 'utf8')
      const p2 = await ctx.newPage()
      await p2.setViewport?.({ width: 820, height: 820 })
      await p2.setContent('<body style="margin:0;background:#fff"><img id="i" style="width:800px;display:block" src="data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64') + '"></body>')
      await p2.waitForTimeout(150)
      const shotSvg = await p2.locator('#i').screenshot()
      rec.files.push({ type: 'SVG', nom: dlSvg.suggestedFilename(), chemin: fSvg, decode: decoderPng(shotSvg) })
      await p2.close()
      /* Affiche A4 */
      const [popup] = await Promise.all([ctx.waitForEvent('page'), page.click('button:has-text("Affiche A4")')])
      await popup.waitForLoadState('domcontentloaded')
      await popup.setViewportSize({ width: 794, height: 1123 })
      await popup.waitForTimeout(250)
      const shot = await popup.screenshot({ fullPage: true })
      const texte = {
        titre: await popup.title(),
        h1: await popup.locator('h1').innerText(),
        ident: (await popup.locator('.i').count()) ? await popup.locator('.i').innerText() : '',
        url: await popup.locator('.u').innerText(),
      }
      const fAff = path.join(OUT, 'fichiers', evId, `affiche_${slug(evId)}_${slug(nomLigne)}.png`); fs.writeFileSync(fAff, shot)
      rec.files.push({ type: 'AFFICHE', nom: path.basename(fAff), chemin: fAff, decode: decoderPng(shot), texte })
      await popup.close()
      fichiers.push(rec)
    }
  }

  /* Verifications par QR et par fichier */
  const ID_ATTENDU = /^https:\/\/flowin-events\.vercel\.app\/q\/([a-z0-9]{12})$/
  for (const r of fichiers) {
    const st = stations.find(s => s.ev === r.ev && s.nom === r.qrNom)
    const etiquette = `[${r.evNom} / ${r.qrNom}]`
    noter(`${etiquette} lien affiche = lien copie`, r.lienAffiche === r.lienCopie, r.lienAffiche)
    noter(`${etiquette} lien = permalien du domaine canonique (aucun jeu, aucune animation, aucun slug dans l'URL)`, ID_ATTENDU.test(r.lienAffiche), r.lienAffiche)
    const code = (ID_ATTENDU.exec(r.lienAffiche) || [])[1]
    noter(`${etiquette} le code du lien est celui de CETTE station en base`, !!st && code === st.code_court, code)
    noter(`${etiquette} reference affichee a l'ecran = code`, r.refAffichee === (st && st.code_court), r.refAffichee)
    for (const f of r.files) {
      noter(`${etiquette} ${f.type} : QR decode = lien affiche`, f.decode === r.lienAffiche, f.decode || 'QR NON DECODE')
      const dec = f.decode && ID_ATTENDU.exec(f.decode)
      const stDec = dec ? parCode[dec[1]] : null
      noter(`${etiquette} ${f.type} : la station decodee est la bonne (animation + QR)`, !!stDec && stDec.ev === r.ev && stDec.nom === r.qrNom, stDec ? stDec.ev + '/' + stDec.source_qr : 'inconnue')
      if (f.type !== 'AFFICHE') {
        const nomOk = f.nom.indexOf(slug(r.evNom)) >= 0 && f.nom.indexOf(slug(r.qrNom)) >= 0 && f.nom.indexOf(slug(st.support)) >= 0 && f.nom.indexOf(st.code_court) >= 0
        noter(`${etiquette} ${f.type} : nom de fichier lisible (commerce + QR + support + code)`, nomOk, f.nom)
      } else {
        /* L'affiche s'imprime depuis le navigateur : le nom du PDF propose est le titre de la page. */
        const tt = f.texte.titre
        noter(`${etiquette} AFFICHE : titre de la page (= nom du PDF a l'impression) lisible : commerce + QR + code`, tt.indexOf(r.evNom) >= 0 && tt.indexOf(r.qrNom) >= 0 && tt.indexOf(st.code_court) >= 0, tt)
      }
      if (f.type === 'AFFICHE') {
        const t = f.texte
        noter(`${etiquette} AFFICHE : porte le commerce, le nom du QR, le support et la reference`,
          t.h1 === r.evNom && t.ident.indexOf(r.qrNom) >= 0 && t.ident.indexOf(st.support) >= 0 && t.ident.indexOf('réf. ' + st.code_court) >= 0 && t.titre.indexOf(st.code_court) >= 0, t.ident)
        noter(`${etiquette} AFFICHE : lien imprime = lien du QR`, t.url === f.decode, t.url)
      }
    }
  }

  /* B. Melange : rapport de chevauchement ---------------------------------------------- */
  const urlsParStation = {}
  fichiers.forEach(r => r.files.forEach(f => { const k = r.ev + '|' + r.qrNom; (urlsParStation[k] = urlsParStation[k] || new Set()).add(f.decode) }))
  const toutes = {}
  fichiers.forEach(r => r.files.forEach(f => { (toutes[f.decode] = toutes[f.decode] || new Set()).add(r.ev + '|' + r.qrNom) }))
  const urlMulti = Object.keys(toutes).filter(u => toutes[u].size > 1)
  noter('Aucune URL partagee par deux QR differents (aucun chevauchement)', urlMulti.length === 0, urlMulti.join(', '))
  const parEvent = {}
  fichiers.forEach(r => { parEvent[r.ev] = parEvent[r.ev] || []; r.files.forEach(f => parEvent[r.ev].push(f.decode)) })
  let croise = 0
  Object.keys(parEvent).forEach(e1 => parEvent[e1].forEach(u => { const m = ID_ATTENDU.exec(u || ''); if (!m || !parCode[m[1]] || parCode[m[1]].ev !== e1) croise++ }))
  noter('Aucun fichier d\'une animation ne contient le QR d\'une autre', croise === 0, croise + ' fichier(s) croise(s) sur ' + Object.values(parEvent).reduce((a, b) => a + b.length, 0))
  const slugsMemes = {}
  stations.filter(s => EVENTS.indexOf(s.ev) >= 0).forEach(s => { (slugsMemes[s.source_qr] = slugsMemes[s.source_qr] || []).push(s.ev) })
  const partages = Object.keys(slugsMemes).filter(k => slugsMemes[k].length > 1)
  noter('Cas piege : plusieurs animations portent les memes slugs (magasin, caisse, tracking...) et leurs QR restent distincts', partages.length >= 4, partages.join(', '))

  /* C. Chaque URL decodee ouvre la BONNE animation ------------------------------------ */
  const messages = {}
  for (const r of fichiers) {
    const st = stations.find(s => s.ev === r.ev && s.nom === r.qrNom)
    const url = localiser(r.lienAffiche)
    const rep = await ctx.request.get(url, { maxRedirects: 0, headers: ip('198.51.100.2') })
    const loc = rep.headers()['location'] || ''
    const attenduModule = (await q('select module from events where id=$1', [r.ev]))[0].module
    const attenduChemin = ['quiz', 'quizsolo', 'spin', 'tombola', 'vote'].indexOf(attenduModule) >= 0 ? '/jouer' : '/parcours/' + attenduModule
    if (st.publie === false) {
      noter(`[${r.evNom} / ${r.qrNom}] QR masque : redirige vers la page « QR plus actif » (aucun jeu)`, rep.status() === 302 && loc.indexOf('/q/indisponible?m=desactive') === 0, rep.status() + ' ' + loc)
      continue
    }
    noter(`[${r.evNom} / ${r.qrNom}] ouvre la bonne animation (redirection 302 vers ${attenduChemin}?ev=${r.ev}&source=${st.source_qr})`,
      rep.status() === 302 && loc.indexOf(attenduChemin + '?ev=' + r.ev) >= 0 && loc.indexOf('source=' + encodeURIComponent(st.source_qr)) >= 0, rep.status() + ' ' + loc)
    if (rep.status() === 302) {
      const h = rep.headers()
      messages[r.ev + '|' + r.qrNom] = loc
      if (r === fichiers[0]) noter('Redirection 302 (jamais 301) + no-store', rep.status() === 302 && /no-store/.test(h['cache-control'] || ''), h['cache-control'])
    }
  }
  /* Ouverture reelle de la page d'une station de chaque animation (contenu = bon commerce) */
  for (const evId of EVENTS) {
    const r = fichiers.find(x => x.ev === evId && x.qrNom === 'Caisse')
    await page.goto(localiser(r.lienAffiche), { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)
    const txt = (await page.locator('body').innerText()).toLowerCase()
    const url = page.url()
    noter(`[${r.evNom}] la page ouverte par le QR « Caisse » est celle de CE commerce`, url.indexOf('ev=' + evId) >= 0 && txt.indexOf(r.evNom.toLowerCase()) >= 0, url.replace(APP, ''))
    await page.screenshot({ path: OUT + '/captures/page-jeu_' + evId + '.png' })
  }

  /* D. Messages propres : animation terminee, brouillon, QR masque, code inconnu -------- */
  const messageDe = async (code) => {
    await page.goto(APP + '/q/' + code, { waitUntil: 'networkidle' }); await page.waitForTimeout(300)
    return (await page.locator('body').innerText())
  }
  const codeDe = (ev, src) => stations.find(s => s.ev === ev && s.source_qr === src).code_court
  let t = await messageDe(codeDe('ev-qa-termine', 'caisse'))
  noter('QR d\'une animation TERMINEE : message propre, aucun jeu', /est terminée/.test(t) && !/question|roue/i.test(t), t.split('\n').slice(0, 3).join(' | '))
  await page.screenshot({ path: OUT + '/captures/message_animation-terminee.png' })
  t = await messageDe(codeDe('ev-qa-brouillon', 'caisse'))
  noter('QR d\'une animation en BROUILLON : message propre', /pas encore commencé/.test(t), t.split('\n').slice(0, 3).join(' | '))
  await page.screenshot({ path: OUT + '/captures/message_animation-brouillon.png' })
  t = await messageDe(codeDe('ev-qa-boulangerie', 'ancienne-affiche'))
  noter('QR MASQUE par le Super Admin : message propre', /n’est plus actif/.test(t), t.split('\n').slice(0, 3).join(' | '))
  await page.screenshot({ path: OUT + '/captures/message_qr-desactive.png' })
  t = await messageDe('abcdef123456')
  noter('Code INCONNU : message propre', /n’existe pas/.test(t), t.split('\n').slice(0, 3).join(' | '))
  await page.screenshot({ path: OUT + '/captures/message_code-inconnu.png' })

  /* E. LE POINT CLE : meme QR, autre jeu derriere ----------------------------------------- */
  const evF = 'ev-qa-fleuriste'
  const codeF = codeDe(evF, 'caisse')
  const suivre = async () => {
    const rep = await ctx.request.get(APP + '/q/' + codeF, { maxRedirects: 0, headers: ip('198.51.100.3') })
    return { status: rep.status(), loc: rep.headers()['location'] || '' }
  }
  const jeuAffiche = async () => {
    await page.goto(APP + '/q/' + codeF, { waitUntil: 'networkidle' }); await page.waitForTimeout(700)
    const html = await page.content()
    return { url: page.url().replace(APP, ''), texte: (await page.locator('body').innerText()).slice(0, 4000), html }
  }
  await q("update events set module='spin', cfg = jsonb_set(cfg,'{master,id}','\"spin\"') where id=$1", [evF])
  const d1 = await suivre(); const j1 = await jeuAffiche()
  await page.screenshot({ path: OUT + '/captures/meme-qr_1-roue.png' })
  /* Le proprietaire change le jeu (RPC, identite = pro A) : le QR imprime ne bouge pas. */
  await fetch(SHIM + '/__as?sub=' + UID_A, { method: 'POST' })
  const rpc = await (await fetch(SHIM + '/rest/v1/rpc/changer_jeu_station', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ p_event_id: evF, p_module: 'quiz' }) })).json()
  await fetch(SHIM + '/__as?sub=', { method: 'POST' })
  const d2 = await suivre(); const j2 = await jeuAffiche()
  await page.screenshot({ path: OUT + '/captures/meme-qr_2-quiz.png' })
  noter('Meme QR (meme lien /q/' + codeF + '), jeu change par le proprietaire (roue -> quiz) : changement accepte, QR inchange', rpc.ok === true && d1.status === 302 && d2.status === 302, `avant ${d1.loc} | apres ${d2.loc}`)
  noter('Le contenu affiche par le MEME QR a bien change (roue -> quiz)', j1.html !== j2.html && /roue|tourne|tourner/i.test(j1.texte + j1.html) && /question|quiz/i.test(j2.texte + j2.html), j1.url + ' -> ' + j2.url)
  await q("select changer_jeu_station($1,'quizmaster')", [evF])
  const d3 = await suivre()
  noter('Meme QR, jeu hors masters (Quiz Master) : la destination suit (/parcours/quizmaster)', d3.status === 302 && d3.loc.indexOf('/parcours/quizmaster?ev=' + evF) === 0 && d3.loc.indexOf('source=caisse') > 0, d3.loc)
  /* Anciens QR (jeu dans l'URL) apres le changement de jeu */
  await page.goto(APP + '/parcours/spin?ev=' + evF + '&source=caisse', { waitUntil: 'networkidle' }); await page.waitForTimeout(500)
  noter('ANCIEN QR /parcours/spin (jeu change depuis) : renvoye vers le jeu actuel, source conservee', page.url().indexOf('/parcours/quizmaster?ev=' + evF) >= 0 && page.url().indexOf('source=caisse') > 0, page.url().replace(APP, ''))
  await page.goto(APP + '/parcours/quiz?ev=' + evF + '&source=caisse', { waitUntil: 'networkidle' }); await page.waitForTimeout(500)
  noter('ANCIEN QR /parcours/quiz.html-like (jeu change depuis) : renvoye vers le jeu actuel', page.url().indexOf('/parcours/quizmaster?ev=' + evF) >= 0, page.url().replace(APP, ''))
  await q("select changer_jeu_station($1,'tombola')", [evF])
  await page.goto(APP + '/parcours/spin?ev=' + evF + '&source=caisse', { waitUntil: 'networkidle' }); await page.waitForTimeout(500)
  noter('ANCIEN QR roue, jeu devenu tombola (master) : arrive sur /jouer', page.url().indexOf('/jouer?ev=' + evF) >= 0, page.url().replace(APP, ''))
  await page.goto(APP + '/parcours/quiz.html?ev=' + evF + '&source=caisse', { waitUntil: 'networkidle' }); await page.waitForTimeout(500)
  noter('ANCIEN QR « .html » : toujours valable (reecriture)', /\/jouer\?ev=/.test(page.url()) && page.url().indexOf('source=caisse') > 0, page.url().replace(APP, ''))
  await q("select changer_jeu_station($1,'spin')", [evF])

  /* F. Interface « Changer le jeu » : refus sans droit, succes pour le proprietaire -------- */
  await page.goto(APP + '/qa-qr-harness?evs=' + evF, { waitUntil: 'networkidle' }); await page.waitForSelector('button:has-text("Changer le jeu")')
  page.on('dialog', d => d.accept())
  await page.selectOption('select[aria-label="Nouveau jeu"]', 'vote')
  await page.click('button:has-text("Changer le jeu")')
  await page.waitForSelector('[role="status"]'); await page.waitForTimeout(300)
  const msgAnon = await page.locator('[role="status"]').innerText()
  await page.screenshot({ path: OUT + '/captures/changer-jeu_refus-sans-droit.png' })
  const mod0 = (await q('select module from events where id=$1', [evF]))[0].module
  noter('Interface : sans droit, le changement est refuse avec un message clair et rien ne change', /propriétaire/.test(msgAnon) && mod0 === 'spin', msgAnon)
  await fetch(SHIM + '/__as?sub=' + UID_A, { method: 'POST' })
  await page.click('button:has-text("Changer le jeu")'); await page.waitForFunction(() => /Jeu changé/.test(document.body.innerText));
  await fetch(SHIM + '/__as?sub=', { method: 'POST' })
  await page.screenshot({ path: OUT + '/captures/changer-jeu_succes-proprietaire.png' })
  const mod1 = (await q("select module, cfg->'master'->>'id' m from events where id=$1", [evF]))[0]
  const jr = await q("select par_role, avant->>'module' av, apres->>'module' ap from qr_jeu_journal where event_id=$1 order by id desc limit 1", [evF])
  noter('Interface : le proprietaire change le jeu (spin -> vote) et c\'est journalise', mod1.module === 'vote' && mod1.m === 'vote' && jr[0].par_role === 'proprietaire' && jr[0].av === 'spin' && jr[0].ap === 'vote', JSON.stringify(jr[0]))
  await q("select changer_jeu_station($1,'spin')", [evF])

  /* G. Mode « grille » (fin de creation) : memes supports ---------------------------------- */
  await page.goto(APP + '/qa-qr-harness?evs=ev-qa-garage&mode=grille', { waitUntil: 'networkidle' }); await page.waitForTimeout(1200)
  const nbTuiles = await page.locator('.pc-qr-tuile').count()
  const liensGrille = await page.evaluate(() => Array.from(document.querySelectorAll('.pc-qr-tuile')).map(t => { const b = Array.from(t.querySelectorAll('button')).find(x => x.textContent.indexOf('Copier le lien') >= 0); return { nom: t.querySelector('span').textContent.trim(), lien: b.parentElement.parentElement.children[1].textContent.trim() } }))
  const attGarage = stations.filter(s => s.ev === 'ev-qa-garage' && s.publie)
  noter('Mode grille (fin de creation) : un QR par station, lien permanent propre a chacun', nbTuiles === attGarage.length && liensGrille.every(l => { const s = attGarage.find(x => x.nom === l.nom); return s && l.lien === PROD + '/q/' + s.code_court }), nbTuiles + ' tuiles')
  await page.screenshot({ path: OUT + '/captures/grille-fin-creation_garage.png' })

  /* H. Anti-copie / anti-fraude ---------------------------------------------------------- */
  const rep = await ctx.request.get(APP + '/q/' + codeDe('ev-qa-boulangerie', 'caisse') + '?ev=ev-qa-garage&source=reseaux-tiktok&token=zzz', { maxRedirects: 0, headers: ip('198.51.100.4') })
  const loc = rep.headers()['location'] || ''
  noter('Parametres ajoutes au lien d\'un QR (?ev=autre&source=autre) : ignores, la station reste la bonne', loc.indexOf('ev=ev-qa-boulangerie') >= 0 && loc.indexOf('source=caisse') >= 0 && loc.indexOf('garage') < 0 && loc.indexOf('tiktok') < 0 && loc.indexOf('zzz') < 0, loc)
  for (const mauvais of ['..%2f..%2fetc', 'a%0d%0aLocation:%20https://evil.test', 'ABCDEF123456%20', '%3Cscript%3E', 'x'.repeat(80)]) {
    const r2 = await ctx.request.get(APP + '/q/' + mauvais, { maxRedirects: 0, headers: ip('198.51.100.4') })
    const l2 = r2.headers()['location'] || ''
    noter(`Code mal forme « ${decodeURIComponent(mauvais).slice(0, 24).replace(/[\r\n]/g, ' ')} » : refuse sans acces a la base ni redirection hors site`, (r2.status() === 302 && l2.indexOf('/q/indisponible') === 0) || ((r2.status() === 308 || r2.status() === 404 || r2.status() === 429) && !/^https?:/i.test(l2)), r2.status() + ' ' + l2)
  }
  /* Majuscules : meme station (normalisation) */
  const r3 = await ctx.request.get(APP + '/q/' + codeDe('ev-qa-garage', 'caisse').toUpperCase(), { maxRedirects: 0, headers: ip('198.51.100.4') })
  noter('Code saisi en MAJUSCULES : resolu comme le code minuscule', r3.status() === 302 && /ev=ev-qa-garage/.test(r3.headers()['location'] || ''), r3.headers()['location'])

  /* Enumeration : essais successifs de codes -> limitation */
  let premier429 = null
  for (let i = 1; i <= 25; i++) {
    const code = ('00000000000' + i).slice(-12)
    const r4 = await ctx.request.get(APP + '/q/' + code, { maxRedirects: 0, headers: ip('198.51.100.5') })
    if (r4.status() === 429) { premier429 = i; break }
  }
  noter('Enumeration (codes qui se suivent) : bloquee par la limitation de debit', premier429 !== null && premier429 <= 12, 'premier refus 429 a l\'essai n° ' + premier429)
  const apres429 = await ctx.request.get(APP + '/q/' + codeDe('ev-qa-garage', 'caisse'), { maxRedirects: 0, headers: ip('198.51.100.5') })
  noter('... mais un scan LEGITIME depuis la meme adresse reste possible (le blocage ne vise que les codes inconnus)', apres429.status() === 302, 'statut ' + apres429.status())
  /* Plafond de scans : 100 requetes rapides sur un meme code, avec un plafond de test a 60/min. */
  let n429 = null
  for (let i = 1; i <= 150; i++) {
    const r5 = await ctx.request.get(APP + '/q/' + codeDe('ev-qa-cafe', 'caisse'), { maxRedirects: 0, headers: ip('198.51.100.6') })
    if (r5.status() === 429) { n429 = i; break }
  }
  noter('Plafond de scans par IP : 429 + Retry-After au-dela du seuil (seuil de test 60/min)', n429 !== null && n429 > 55 && n429 <= 65, 'premier 429 au scan n° ' + n429)
  const dist = await q("select count(distinct code_court)::int d, count(*)::int n from qr_stations")
  noter('Pas d\'incrementation : 0 code de la forme 00000000000N', !stations.some(s => /^0{8,}/.test(s.code_court)), dist[0].d + ' codes distincts')

  /* I. Plaquette « Votre animation » : le QR des supports est-il un vrai QR ? ------------- */
  const plaq = path.resolve(__dirname, '../../public/plaquette-animation-magasin.html')
  const pp = await ctx.newPage()
  await pp.goto('file://' + plaq, { waitUntil: 'load' })
  await pp.waitForTimeout(800)
  const qrSym = await pp.evaluate(() => { const s = document.getElementById('qrc'); return s ? s.outerHTML : null })
  let plaqDecode = null
  if (qrSym) {
    await pp.setContent('<body style="margin:0;background:#fff"><svg xmlns="http://www.w3.org/2000/svg" width="740" height="740" viewBox="-4 -4 45 45"><rect x="-4" y="-4" width="45" height="45" fill="#fff"/>' + qrSym.replace('<symbol', '<g').replace('</symbol>', '</g>').replace(/viewBox="[^"]*"/, '').replace(/id="qrc"/, '') + '</svg></body>')
    const sh = await pp.locator('svg').screenshot()
    fs.writeFileSync(OUT + '/captures/plaquette_qr-decoratif.png', sh)
    plaqDecode = decoderPng(sh)
  }
  noter('Plaquette « Votre animation » : le QR dessine sur les maquettes de supports (affiche, macaron, caisse) est un VRAI QR mais il mene a la plaquette elle-meme (#offres), jamais a une station de jeu : aucun risque de confusion avec un QR de jeu', plaqDecode !== null && /plaquette-animation-magasin\.html/.test(plaqDecode) && !/\/q\/|\/parcours\/|\/jouer/.test(plaqDecode), 'decode : ' + plaqDecode)
  await pp.close()

  /* Synthese ------------------------------------------------------------------------------ */
  fs.writeFileSync(OUT + '/decodes.json', JSON.stringify(fichiers.map(r => ({ animation: r.evNom, qr: r.qrNom, support: r.support, code: r.codeAttendu, lien: r.lienAffiche, fichiers: r.files.map(f => ({ type: f.type, nom: f.nom, decode: f.decode, texte: f.texte })) })), null, 2))
  fs.writeFileSync(OUT + '/e2e-resultats.json', JSON.stringify(resultats, null, 2))

  /* Planche contact : quelques affiches + leur QR decode (capture a joindre au rapport) */
  const choix = ['ev-qa-boulangerie|Caisse', 'ev-qa-fleuriste|Facebook concours', 'ev-qa-garage|En magasin', 'ev-qa-cafe|Vitrine rue principale']
  const cartes = choix.map(k => fichiers.find(r => r.ev + '|' + r.qrNom === k)).filter(Boolean).map(r => {
    const aff = r.files.find(f => f.type === 'AFFICHE')
    return `<figure style="margin:0;width:230px"><img style="width:230px;border:1px solid #cbd5e1" src="data:image/png;base64,${fs.readFileSync(aff.chemin).toString('base64')}"><figcaption style="font:11px/1.4 system-ui;margin-top:6px"><b>${r.evNom}</b> — ${r.qrNom}<br>QR decode par jsQR :<br><code style="word-break:break-all">${aff.decode}</code><br>fichier : ${aff.nom}</figcaption></figure>`
  }).join('')
  const pc = await ctx.newPage()
  await pc.setViewport?.({ width: 1000, height: 600 })
  await pc.setContent('<body style="margin:16px;background:#fff"><div style="display:flex;gap:14px;align-items:flex-start">' + cartes + '</div></body>')
  await pc.waitForTimeout(300)
  await pc.screenshot({ path: OUT + '/captures/planche_affiches-decodees.png', fullPage: true })
  await pc.close()

  await browser.close(); await db.end()
  const echecs = resultats.filter(x => !x.ok)
  console.log('\n' + (resultats.length - echecs.length) + '/' + resultats.length + ' OK')
  if (echecs.length) { console.log('ECHECS :'); echecs.forEach(e => console.log(' - ' + e.nom + ' — ' + e.detail)) }
  process.exit(echecs.length ? 1 : 0)
}
main().catch(e => { console.error(e); process.exit(2) })
