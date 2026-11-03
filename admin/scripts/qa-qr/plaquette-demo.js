/** Playwright (390 / 1440) : outils de demo des plaquettes (Effacer, Retour, Recommencer, mode demo bloque les envois). usage : node plaquette-demo.js <sortie> [url] */
const { chromium } = require('playwright')
const OUT = process.argv[2], BASE = process.argv[3] || 'http://127.0.0.1:3100'
let ko = 0; const v = (n, ok, d) => { console.log((ok ? 'OK ' : 'KO ') + n + (d ? ' [' + d + ']' : '')); if (!ok) ko++ }
;(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME_BIN })
  for (const [w, h, tag] of [[390, 844, 'm390'], [1440, 900, 'd1440']]) for (const page of ['plaquette-animation-magasin.html', 'plaquette-super-event.html']) {
    const nom = page.replace('plaquette-', '').replace('.html', '') + ' ' + tag
    const ctx = await br.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage()
    let envois = 0
    await ctx.route('**/functions/v1/notify-rappel', r => { envois++; return r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }) })
    await p.goto(BASE + '/' + page + '#rappel', { waitUntil: 'networkidle' })
    await p.waitForTimeout(600)
    v(nom + ' : pastille « Démo » discrète présente, mode désactivé par défaut', await p.locator('#fdPill').count() === 1 && !(await p.evaluate(() => sessionStorage.getItem('flowin_demo_mode'))))
    v(nom + ' : feuille de rappel avec « ← Retour » et « Effacer »', await p.locator('#rappel [data-demo=retour]').count() === 1 && await p.locator('#rappel [data-demo=effacer]').count() === 1)
    await p.fill('#r_prenom', 'Test'); await p.fill('#r_entreprise', 'Société test')
    await p.locator('#rappel [data-demo=effacer]').click()
    v(nom + ' : « Effacer ce que j’ai saisi » vide le formulaire', (await p.inputValue('#r_prenom')) === '' && (await p.inputValue('#r_entreprise')) === '')
    await p.screenshot({ path: `${OUT}/80-demo-rappel-${page.slice(10, 15)}-${tag}.png` })
    // mode demo : envoi bloque
    await p.locator('#fdPill').click(); await p.locator('#fdMode').check()
    for (const [id, val] of [['prenom', 'Ada'], ['nom', 'Test'], ['entreprise', 'Demo SARL'], ['ville', 'Nice'], ['tel', '0600000000'], ['email', 'a@test.invalid']]) await p.fill('#r_' + id, val)
    await p.locator('#r_consent').check()
    await p.locator('#r_send').click(); await p.waitForTimeout(800)
    v(nom + ' : mode démo actif → aucun envoi réel', envois === 0 && await p.locator('#r_merci.on').count() === 1, 'envois=' + envois)
    await p.locator('#rappel [data-demo=effacer]').click()
    v(nom + ' : Effacer ré-affiche le formulaire après envoi démo', await p.locator('#fRappel').isVisible() && await p.locator('#r_merci.on').count() === 0)
    // mode demo desactive : envoi reel
    await p.locator('#fdPill').click(); await p.locator('#fdMode').uncheck()
    for (const [id, val] of [['prenom', 'Ada'], ['nom', 'Test'], ['entreprise', 'Demo SARL'], ['ville', 'Nice'], ['tel', '0600000000'], ['email', 'a@test.invalid']]) await p.fill('#r_' + id, val)
    await p.locator('#r_consent').check(); await p.locator('#r_send').click(); await p.waitForTimeout(800)
    v(nom + ' : mode démo désactivé → parcours existant intact (envoi parti)', envois === 1 && await p.locator('#r_merci.on').count() === 1, 'envois=' + envois)
    await p.locator('#rappel [data-demo=retour]').click(); await p.waitForTimeout(400)
    v(nom + ' : « ← Retour » ferme la feuille', !(await p.locator('#rappel').evaluate(e => /on/.test(e.className))))
    if (page === 'plaquette-animation-magasin.html') {
      await p.goto(BASE + '/' + page + '#offres', { waitUntil: 'networkidle' }); await p.waitForTimeout(500)
      v(nom + ' : écran Offres avec Retour + Effacer', await p.locator('#offres [data-demo=retour]').count() === 1 && await p.locator('#offres [data-demo=effacer]').count() === 1)
      await p.locator('#offres [data-demo=effacer]').click(); await p.waitForTimeout(1200)
      v(nom + ' : Effacer (Offres) recharge sur l’écran Offres', /#offres/.test(p.url()))
      await p.locator('#fdPill').click(); await p.locator('#fdMode').check(); await p.locator('#fdPill').click()
      await p.locator('#fdReset').click(); await p.waitForTimeout(1500)
      v(nom + ' : « Recommencer la démo » : retour accueil, mode démo remis à zéro', !(await p.evaluate(() => sessionStorage.getItem('flowin_demo_mode'))))
      await p.goto(BASE + '/' + page + '#commander', { waitUntil: 'networkidle' }); await p.waitForTimeout(500)
      await p.locator('#fdPill').click(); await p.locator('#fdMode').check()
      await p.locator('#endOrder').click({ force: true }); await p.waitForTimeout(400)
      v(nom + ' : mode démo : « Je commande » ne quitte pas la plaquette', /plaquette-animation-magasin/.test(p.url()))
      await p.screenshot({ path: `${OUT}/81-demo-commander-${tag}.png` })
    }
    if (tag === 'm390') v(nom + ' : pas de débordement à 390 px', !(await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2)))
    await ctx.close()
  }
  await br.close(); console.log('KO=' + ko); process.exit(ko)
})()
