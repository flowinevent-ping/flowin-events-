/**
 * Playwright (390 et 1440 px, base locale) : parcours « rejoindre un super event » (visiteur sans compte, puis avec compte),
 * grille de tarifs a cocher (500 / 1 400 / 3 590 EUR HT, aucun « 49 € »), secteur « Autre » + precision, apercu Fetes du haut et moyen pays,
 * carte Nice + Vence (pro valide), « Mot de passe oublie » deja teste ailleurs.
 * usage : node pro-rejoindre.js <dossier-sortie> [url-app] [url-shim]
 */
const { chromium } = require('playwright')
const { Pool } = require('pg')
const OUT = process.argv[2], BASE = process.argv[3] || 'http://127.0.0.1:3100', SHIM = process.argv[4] || 'http://127.0.0.1:54321'
const pool = new Pool({ host: '/tmp', port: 54399, user: 'postgres', database: 'flowin_chain' })
let ko = 0; const v = (n, ok, d) => { console.log((ok ? 'OK ' : 'KO ') + n + (d ? ' [' + String(d).slice(0, 110) + ']' : '')); if (!ok) ko++ }
const SESSION = (uid, email) => { const b = o => Buffer.from(JSON.stringify(o)).toString('base64url'); const exp = Math.floor(Date.now() / 1000) + 86400
  return { access_token: b({ alg: 'HS256', typ: 'JWT' }) + '.' + b({ sub: uid, email, role: 'authenticated', exp, aud: 'authenticated' }) + '.sig', refresh_token: 'r', expires_in: 86400, expires_at: exp, token_type: 'bearer', user: { id: uid, email, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() } } }
const UID = '00000000-0000-4000-8000-0000000000a1', MAIL = 'boulangerie@test.invalid'
const FENETRES = [[390, 844, 'm390'], [1440, 900, 'd1440']]

async function etapeSuivante(p) { await p.getByRole('button', { name: /Suivant/ }).click(); await p.waitForTimeout(400) }
async function debord(p, tag, nom) { if (tag === 'm390') v(nom + ' : pas de debordement a 390 px', !(await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2))) }

;(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME_BIN })
  for (const [w, h, tag] of FENETRES) {
    // ---------- 1. VISITEUR SANS COMPTE ----------
    await fetch(SHIM + '/__as?sub=', { method: 'POST' })
    let ctx = await br.newContext({ viewport: { width: w, height: h } })
    let p = await ctx.newPage()
    await p.goto(BASE + '/rejoindre', { waitUntil: 'networkidle', timeout: 90000 })
    v(tag + ' visiteur : parcours ouvert sans connexion', await p.getByText('Quel super event ?').count() > 0)
    v(tag + ' visiteur : message « vous parcourez sans compte »', await p.locator('[data-visiteur-info]').count() === 1)
    v(tag + ' visiteur : pas de carte (interface reservee SA / pro valide)', await p.locator('.leaflet-container').count() === 0)
    v(tag + ' visiteur : Nice Jazz Festival liste, dates « [à compléter] »', (await p.locator('body').innerText()).includes('Nice Jazz Festival') && (await p.locator('body').innerText()).includes('[dates à compléter]'))
    await debord(p, tag, 'visiteur etape 1')
    await p.screenshot({ path: `${OUT}/60-visiteur-super-event-${tag}.png`, fullPage: true })
    await p.getByText('Nice Jazz Festival').first().click()
    await p.getByPlaceholder(/./).first().count()
    const champs = p.locator('input[type=text], input:not([type])')
    await p.locator('label:has-text("Nom du commerce") input').fill('Cave de test')
    await p.locator('select').first().selectOption('Autre')
    v(tag + ' secteur « Autre » : champ « Précisez votre activité » apparaît', await p.locator('[data-precision-autre]').count() === 1)
    v(tag + ' secteur « Autre » sans précision : étape bloquée avec message', await p.getByRole('button', { name: /Suivant/ }).isDisabled() && (await p.locator('body').innerText()).includes('Précisez votre activité'))
    await p.locator('#rej-categorie-autre').fill('Cave à bières artisanales')
    await p.locator('label:has-text("Adresse") input').fill('1 rue de test')
    await p.locator('label:has-text("Ville") input').fill('Nice')
    await p.screenshot({ path: `${OUT}/61-secteur-autre-${tag}.png`, fullPage: true })
    await etapeSuivante(p) // -> jeu
    await etapeSuivante(p) // -> lots ? (jeu -> lots)
    // lots : saisir un lot pour passer
    const lotNom = p.getByPlaceholder('Ex. Une baguette tradition offerte').first()
    if (await lotNom.count()) await lotNom.fill('Un bon de 20 euros').catch(() => {})
    await etapeSuivante(p)
    // on doit etre a l'etape finale (diffusion & QR + recap)
    const txt = await p.locator('body').innerText()
    v(tag + ' récap : grille de tarifs présente (Visibilité 500 / Animation 1 400 / Sponsor 3 590 € HT)', /500\s*€ HT/.test(txt) && /1\s400\s*€ HT/.test(txt) && /3\s590\s*€ HT/.test(txt), (txt.match(/\d[\d\s]*€ HT/g) || []).join('|'))
    v(tag + ' récap : aucun « 49 € » ni « Frais de participation »', !/49\s*€|Frais de participation/.test(txt))
    v(tag + ' récap : « Lot mis en jeu » 90 / 159 / 259 €', /90 € en bon d’achat/.test(txt) && /159 € en bon d’achat/.test(txt) && /259 € en bon d’achat/.test(txt))
    v(tag + ' récap : mention « Tarif à confirmer par Flowin »', txt.includes('Tarif à confirmer par Flowin'))
    v(tag + ' récap : 4e option « Je souhaite simplement être visible » + « Tarif à définir avec Flowin »', await p.locator('[data-pack=visible]').count() === 1 && txt.includes('Je souhaite simplement être visible') && txt.includes('Tarif à définir avec Flowin'))
    v(tag + ' récap : aucun « 1 490 »', !/1\s?490/.test(txt))
    await p.locator('[data-pack=animation] input[type=checkbox]').check()
    v(tag + ' pack Animation coché', await p.locator('[data-pack=animation] input').isChecked())
    v(tag + ' sans compte : formulaire de coordonnées + bouton Envoyer désactivé', await p.locator('[data-coordonnees]').count() === 1 && await p.getByRole('button', { name: /Envoyer ma demande/ }).isDisabled())
    v(tag + ' coordonnées : nom de la structure et ville préremplis depuis la saisie', (await p.locator('[data-co=nom]').inputValue()) === 'Cave de test' && (await p.locator('[data-co=ville]').inputValue()) === 'Nice')
    v(tag + ' coordonnées : secteur « Autre » + précision repris', (await p.locator('[data-co=secteur]').inputValue()) === 'Autre' && (await p.locator('#co-secteur-autre').inputValue()) === 'Cave à bières artisanales')
    await debord(p, tag, 'visiteur recap')
    await p.screenshot({ path: `${OUT}/62-visiteur-grille-tarifs-compte-${tag}.png`, fullPage: true })
    await p.locator('[data-pack=animation]').scrollIntoViewIfNeeded()
    await p.locator('[data-grille-tarifs]').screenshot({ path: `${OUT}/63-grille-tarifs-${tag}.png` })
    await p.locator('[data-co=contact]').fill('Camille Durand')
    await p.locator('[data-co=email]').fill('cave.test@test.invalid')
    await p.locator('[data-co=tel]').fill('0600000000')
    await p.locator('[data-co=mdp]').fill('court')
    v(tag + ' coordonnées : mot de passe trop court → bouton désactivé', await p.getByRole('button', { name: /Envoyer ma demande/ }).isDisabled())
    await p.locator('[data-co=mdp]').fill('motdepasse1'); await p.locator('[data-co=mdp2]').fill('motdepasse1')
    v(tag + ' coordonnées complètes → bouton Envoyer actif', await p.getByRole('button', { name: /Envoyer ma demande/ }).isEnabled())
    const UID2 = tag === 'm390' ? '00000000-0000-4000-8000-0000000000c2' : '00000000-0000-4000-8000-0000000000d2'
    await pool.query("insert into auth.users(id) values ($1) on conflict do nothing", [UID2]).catch(() => {})
    await pool.query("delete from public.demandes_rattachement_super_event where nom_commerce = 'Cave de test'")
    await pool.query("delete from public.pros where email = 'cave.test@test.invalid'")
    let nbSignup = 0
    await p.route('**/auth/v1/signup**', r => { nbSignup++; return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SESSION(UID2, 'cave.test@test.invalid')) }) })
    p.on('request', rq => { if (/54321/.test(rq.url())) console.log('REQ', rq.method(), rq.url().replace(/^.*54321/, '').slice(0, 90)) }); p.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text().slice(0, 150)) })
    await p.getByRole('button', { name: /Envoyer ma demande à Flowin/ }).click()
    await p.waitForSelector('text=Demande envoyée', { timeout: 25000 }).catch(async () => { console.log('DEBUG', (await p.locator('body').innerText()).replace(/\s+/g, ' ').slice(-400)) })
    v(tag + ' inscription en ligne : un signUp, compte créé', nbSignup === 1 && await p.locator('[data-compte-cree]').count() === 1)
    const rp = await pool.query("select id, statut, secteur, tags, contact, tel from public.pros where email = 'cave.test@test.invalid'")
    const pr = rp.rows[0] || {}
    v(tag + ' pro créé : en_attente, secteur Autre, précision en tag, contact/tél', pr.statut === 'en_attente' && pr.secteur === 'Autre' && (pr.tags || []).indexOf('secteur-autre:Cave à bières artisanales') >= 0 && pr.contact === 'Camille Durand' && pr.tel === '0600000000', JSON.stringify(pr).slice(0, 100))
    const rd = await pool.query("select pro_id, offre from public.demandes_rattachement_super_event where nom_commerce = 'Cave de test' order by id desc limit 1")
    v(tag + ' demande créée rattachée au nouveau pro, pack Animation', rd.rows[0] && rd.rows[0].pro_id === pr.id && /Animation/.test(rd.rows[0].offre || ''), JSON.stringify(rd.rows[0] || {}).slice(0, 90))
    await p.screenshot({ path: `${OUT}/69-inscription-en-ligne-envoyee-${tag}.png`, fullPage: true })
    // lien « Me connecter » conserve le retour
    await p.goto(BASE + '/rejoindre', { waitUntil: 'networkidle' }).catch(() => {})
    await ctx.close()

    // ---------- 2. AVEC COMPTE : retour, restauration, envoi ----------
    await fetch(SHIM + '/__as?sub=' + UID, { method: 'POST' })
    await pool.query("delete from public.demandes_rattachement_super_event where pro_id = 'pro-demo'")
    ctx = await br.newContext({ viewport: { width: w, height: h } })
    await ctx.addInitScript(([s, brouillon]) => { try { localStorage.setItem('sb-127-auth-token', JSON.stringify(s)); if (!sessionStorage.getItem('qa-i')) { sessionStorage.setItem('qa-i', '1'); localStorage.setItem('flowin.rejoindre.brouillon.v1', brouillon) } } catch (e) {} },
      [SESSION(UID, MAIL), JSON.stringify({ seId: 'se-nice-jazz-festival-demo', persona: 'commerce', nomCommerce: 'Cave de test', categorie: 'Autre', categorieAutre: 'Cave à bières artisanales', adresse: '1 rue de test', cp: '06000', ville: 'Nice', dateD: '', dateF: '', lots: [{ id: 'l1', nom: 'Un bon de 20 euros', quantite: 5, valeur: 20, type: 'tirage', conditions: '' }], offre: 'Un mot pour Flowin', packChoisi: 'animation', diffPhysique: true, diffDigital: true })])
    p = await ctx.newPage()
    await p.goto(BASE + '/rejoindre?se=se-nice-jazz-festival-demo&reprise=1', { waitUntil: 'networkidle', timeout: 90000 })
    await p.waitForSelector('[role=status]', { timeout: 20000 })
    v(tag + ' avec compte : saisie restaurée, étape d’envoi, compte reconnu', (await p.locator('body').innerText()).includes('Connecté : Boulangerie du Port') && await p.locator('[data-compte-requis]').count() === 0)
    v(tag + ' avec compte : pack Animation resté coché', await p.locator('[data-pack=animation] input').isChecked())
    await p.screenshot({ path: `${OUT}/64-avec-compte-envoi-${tag}.png`, fullPage: true })
    await p.getByRole('button', { name: /Envoyer ma demande à Flowin/ }).click()
    await p.waitForSelector('text=Demande envoyée', { timeout: 20000 })
    const r = await pool.query("select pro_id, super_event_id, categorie, offre, statut from public.demandes_rattachement_super_event where pro_id = 'pro-demo' order by id desc limit 1")
    const row = r.rows[0] || {}
    v(tag + ' demande enregistrée : statut en_attente, pro_id du compte', row.statut === 'en_attente' && row.pro_id === 'pro-demo' && row.super_event_id === 'se-nice-jazz-festival-demo', JSON.stringify(row).slice(0, 90))
    v(tag + ' demande : catégorie « Autre : précision »', row.categorie === 'Autre : Cave à bières artisanales', row.categorie)
    v(tag + ' demande : pack souhaité + « Tarif à confirmer par Flowin » dans l’offre', /Pack souhaité : Animation — 1 400 € HT/.test((row.offre || '').replace(/ | /g, ' ')) && /Tarif à confirmer par Flowin/.test(row.offre || ''), (row.offre || '').slice(0, 80))
    await p.screenshot({ path: `${OUT}/65-demande-envoyee-${tag}.png`, fullPage: true })
    await ctx.close()

    // ---------- 3. PRO VALIDE : carte Nice + Vence ----------
    ctx = await br.newContext({ viewport: { width: w, height: h } })
    await ctx.addInitScript(s => { try { localStorage.setItem('sb-127-auth-token', JSON.stringify(s)) } catch (e) {} }, SESSION(UID, MAIL))
    p = await ctx.newPage()
    await p.goto(BASE + '/pro/nouvelle?pro=pro-demo&type=rejoindre', { waitUntil: 'networkidle', timeout: 90000 })
    await p.waitForTimeout(1500)
    v(tag + ' pro validé : carte affichée', await p.locator('.leaflet-container').count() > 0)
    const marqueurs = await p.locator('.leaflet-marker-icon, .leaflet-interactive').count()
    v(tag + ' pro validé : marqueurs Nice + Vence sur la carte', marqueurs >= 2, marqueurs)
    await debord(p, tag, 'pro valide carte')
    await p.screenshot({ path: `${OUT}/66-carte-nice-vence-${tag}.png`, fullPage: false })
    // aperçu FHMP
    await p.getByText(/F[eê]tes du haut et moyen pays/).first().click()
    await p.waitForTimeout(3500)
    const src = await p.locator('iframe').first().getAttribute('src')
    v(tag + ' aperçu FHMP : jeu Quiz (master /jouer), plus le visuel Nuits du Sud', /\/jouer\?/.test(src || '') && !/nds2026/.test(src || ''), src)
    const fr = p.frames().find(f => /\/jouer/.test(f.url()))
    if (fr) {
      await fr.waitForSelector('body', { timeout: 15000 }).catch(() => {})
      await p.waitForTimeout(2000)
      const html = await fr.content()
      v(tag + ' aperçu FHMP : logo FHMP démo affiché', /\/demo\/fhmp-logo\.svg/.test(html))
      v(tag + ' aperçu FHMP : aucune mention Nuits du Sud', !/Nuits du Sud/i.test(await fr.locator('body').innerText()))
    } else v(tag + ' aperçu FHMP : cadre trouvé', false)
    await p.screenshot({ path: `${OUT}/67-apercu-fhmp-${tag}.png`, fullPage: true })
    // ecran « Jeu » : question du quiz de demonstration + bonus
    await p.locator('button', { hasText: /^Jeu$/ }).last().click().catch(() => {})
    await p.waitForTimeout(3000)
    const fr2 = p.frames().find(f => /\/jouer/.test(f.url()))
    const t2 = fr2 ? await fr2.locator('body').innerText().catch(() => '') : ''
    v(tag + ' aperçu FHMP : question du quiz de démonstration affichée', /Vence|olivier|galoubet|Grasse/.test(t2), t2.replace(/\s+/g, ' ').slice(0, 80))
    await p.screenshot({ path: `${OUT}/68-apercu-fhmp-question-${tag}.png`, fullPage: true })
    await ctx.close()
  }
  await br.close(); await pool.end(); console.log('KO=' + ko); process.exit(ko)
})()
