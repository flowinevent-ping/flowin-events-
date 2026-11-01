// Verifie le pre-remplissage du bon de commande depuis le compte pro connecte (sans stockage local prealable)
// et la mise en service (commande payee -> acces ouvert). usage : node pro-prefill.js <dossier-sortie> <url-app> <url-shim>
const { chromium } = require('playwright')
const OUT = process.argv[2], BASE = process.argv[3] || 'http://127.0.0.1:3100', SHIM = process.argv[4] || 'http://127.0.0.1:54321'
const SESSION = (uid, email) => { const b = o => Buffer.from(JSON.stringify(o)).toString('base64url'); const exp = Math.floor(Date.now() / 1000) + 86400
  return { access_token: b({ alg: 'HS256', typ: 'JWT' }) + '.' + b({ sub: uid, email, role: 'authenticated', exp, aud: 'authenticated' }) + '.sig', refresh_token: 'r', expires_in: 86400, expires_at: exp, token_type: 'bearer', user: { id: uid, email, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() } } }
;(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME_BIN })
  let ko = 0; const verif = (nom, ok, d) => { console.log((ok ? 'OK ' : 'KO ') + nom + (d ? ' [' + d + ']' : '')); if (!ok) ko++ }
  // pro-b : aucune commande, stockage local vide -> le bon doit se pre-remplir depuis sa fiche en base
  await fetch(SHIM + '/__as?sub=00000000-0000-4000-8000-0000000000b1', { method: 'POST' })
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 } })
  await ctx.addInitScript(s => { try { localStorage.setItem('sb-127-auth-token', JSON.stringify(s)); if (!sessionStorage.getItem('qa-init')) { localStorage.removeItem('flowin_am_prefill'); sessionStorage.setItem('qa-init', '1') } } catch (e) {} }, SESSION('00000000-0000-4000-8000-0000000000b1', 'garage@test.invalid'))
  const p = await ctx.newPage()
  await p.goto(BASE + '/pro/commandes?pro=pro-b', { waitUntil: 'networkidle', timeout: 90000 })
  const lien = p.getByText('Choisir mon offre et signer').first()
  verif('lien « Choisir mon offre » present (pro sans commande)', await lien.count() > 0)
  await lien.click()
  await p.waitForURL(/bon-commande-animation/, { timeout: 30000 })
  await p.waitForTimeout(1500)
  const v = await p.evaluate(() => ({ raison: (document.getElementById('f_raison') || {}).value, email: (document.getElementById('f_email') || {}).value, contact: (document.getElementById('f_contact') || {}).value, ville: (document.getElementById('f_ville') || {}).value, info: (document.getElementById('prefillInfo') || {}).style && document.getElementById('prefillInfo').style.display }))
  verif('raison sociale pre-remplie depuis le compte', v.raison === 'Garage Martin (test)', v.raison)
  verif('email pre-rempli depuis le compte', v.email === 'garage@test.invalid', v.email)
  verif('ville pre-remplie', v.ville === 'Vence', v.ville)
  verif('rien d\'invente : SIRET vide reste vide', (await p.evaluate(() => (document.getElementById('f_siret') || {}).value)) === '')
  await p.screenshot({ path: OUT + '/40-bon-commande-prerempli-m390.png', fullPage: false })
  await br.close(); console.log('KO=' + ko); process.exit(ko)
})()
