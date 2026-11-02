/**
 * Tests Playwright (Supabase Auth SIMULE par interception reseau) : mot de passe oublie, nouveau mot de passe,
 * inscription « Ma premiere fois » (nouveau compte, compte existant, SIRET invalide, mot de passe trop court,
 * email non confirme, echec d'enregistrement de la fiche puis reprise). 390 px.
 * usage : node pro-auth.js <dossier-sortie> [url-app]
 */
const { chromium } = require('playwright')
const OUT = process.argv[2], BASE = process.argv[3] || 'http://127.0.0.1:3100'
const AL = '[role=alert]:not(#__next-route-announcer__):not(:empty)'
let ko = 0; const v = (n, ok, d) => { console.log((ok ? 'OK ' : 'KO ') + n + (d ? ' [' + d + ']' : '')); if (!ok) ko++ }
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url')
const jwt = () => b64({ alg: 'HS256', typ: 'JWT' }) + '.' + b64({ sub: 'u-test', email: 'x@test.invalid', role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600, aud: 'authenticated' }) + '.sig'
const user = (id, mail, ident = true) => ({ id, aud: 'authenticated', role: 'authenticated', email: mail, identities: ident ? [{ id }] : [], app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() })
const json = (route, status, body) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

;(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME_BIN })
  const nouveauCtx = async () => { const c = await br.newContext({ viewport: { width: 390, height: 844 } }); return c }

  // ---------- 1. Mot de passe oublie ----------
  {
    const ctx = await nouveauCtx(), p = await ctx.newPage(); const vus = []
    await ctx.route('**/auth/v1/recover**', async r => { vus.push({ url: r.request().url(), body: r.request().postData() }); await json(r, 200, {}) })
    await p.goto(BASE + '/pro/connexion', { waitUntil: 'networkidle', timeout: 90000 })
    v('lien « Mot de passe oublié ? » present sous « Se connecter »', await p.getByText('Mot de passe oublié ?').count() === 1)
    await p.getByText('Mot de passe oublié ?').click()
    await p.getByRole('button', { name: 'Recevoir un lien par email' }).click()
    v('email vide : message de saisie en francais', (await p.locator(AL).innerText()).includes('adresse email valide'))
    await p.locator('input[type=email]').fill('inconnu@test.invalid')
    await p.getByRole('button', { name: 'Recevoir un lien par email' }).click()
    await p.waitForSelector('[role=status]')
    const t = await p.getByRole('status').innerText()
    v('message identique, sans fuite', t.startsWith('Si un compte existe pour cette adresse, un email vient d’être envoyé'), t.slice(0, 60))
    v('redirectTo = origine/pro/nouveau-mot-de-passe', vus.length === 1 && /redirect_to=[^&]*%2Fpro%2Fnouveau-mot-de-passe/.test(vus[0].url + (vus[0].body || '')) || (vus[0] && (vus[0].url + vus[0].body).includes('nouveau-mot-de-passe')), vus[0] && (vus[0].url).slice(-90))
    v('pas de debordement a 390 px', !(await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2)))
    await p.screenshot({ path: OUT + '/50-mot-de-passe-oublie-m390.png', fullPage: true })
    // limite de debit : message traduit
    await ctx.unroute('**/auth/v1/recover**')
    await ctx.route('**/auth/v1/recover**', r => json(r, 429, { code: 'over_email_send_rate_limit', msg: 'email rate limit exceeded' }))
    await p.getByRole('button', { name: 'Recevoir un lien par email' }).click()
    await p.waitForSelector(AL)
    v('limite de debit : message en francais', (await p.locator(AL).innerText()).includes('Trop de tentatives'))
    await ctx.close()
  }

  // ---------- 2. Nouveau mot de passe ----------
  async function pageRecup(hash, majUser) {
    const ctx = await nouveauCtx(), p = await ctx.newPage(); const put = []
    await ctx.route('**/auth/v1/user**', async r => {
      if (r.request().method() === 'PUT') { put.push(JSON.parse(r.request().postData() || '{}')); return majUser ? majUser(r) : json(r, 200, user('u-test', 'x@test.invalid')) }
      return json(r, 200, user('u-test', 'x@test.invalid'))
    })
    await p.goto(BASE + '/pro/nouveau-mot-de-passe' + hash, { waitUntil: 'networkidle', timeout: 90000 })
    return { ctx, p, put }
  }
  {
    const { ctx, p, put } = await pageRecup('#access_token=' + jwt() + '&refresh_token=r&expires_in=3600&token_type=bearer&type=recovery')
    await p.waitForSelector('input[type=password]', { timeout: 15000 })
    v('lien de recuperation : formulaire affiche', await p.locator('input[type=password]').count() === 2)
    await p.screenshot({ path: OUT + '/51-nouveau-mot-de-passe-m390.png', fullPage: true })
    const [a, b] = await p.locator('input[type=password]').all()
    await a.fill('court'); await b.fill('court'); await p.getByRole('button', { name: /Enregistrer/ }).click()
    v('mot de passe de moins de 8 caracteres refuse', (await p.locator(AL).innerText()).includes('8 caractères minimum') && put.length === 0)
    await a.fill('motdepasse1'); await b.fill('motdepasse2'); await p.getByRole('button', { name: /Enregistrer/ }).click()
    v('confirmation differente refusee', (await p.locator(AL).innerText()).includes('pas identiques') && put.length === 0)
    await a.fill('nouveaumdp123'); await b.fill('nouveaumdp123'); await p.getByRole('button', { name: /Enregistrer/ }).click()
    await p.waitForSelector('[role=status]')
    v('updateUser appele avec le nouveau mot de passe', put.length === 1 && put[0].password === 'nouveaumdp123')
    await p.waitForURL(/\/pro(\?|$)/, { timeout: 10000 }).catch(() => {})
    v('redirection vers /pro', /\/pro(\?|$|\/connexion)/.test(p.url()), p.url().replace(BASE, ''))
    await ctx.close()
  }
  {
    const { ctx, p } = await pageRecup('#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired')
    await p.waitForSelector(AL)
    v('lien expire : message clair + retour connexion', (await p.locator(AL).innerText()).includes('plus valable') && await p.getByText('Retour à la connexion').count() > 0)
    await p.screenshot({ path: OUT + '/52-lien-expire-m390.png', fullPage: true })
    await ctx.close()
  }
  {
    const { ctx, p } = await pageRecup('#access_token=' + jwt() + '&refresh_token=r&expires_in=3600&token_type=bearer&type=recovery', r => json(r, 422, { code: 'same_password', msg: 'New password should be different from the old password.' }))
    await p.waitForSelector('input[type=password]')
    const [a, b] = await p.locator('input[type=password]').all()
    await a.fill('ancienmdp123'); await b.fill('ancienmdp123'); await p.getByRole('button', { name: /Enregistrer/ }).click()
    await p.waitForSelector(AL)
    v('erreur Supabase traduite (meme mot de passe)', (await p.locator(AL).innerText()).includes('différent de l’ancien'))
    await ctx.close()
  }

  // ---------- 3. Inscription « Ma premiere fois » ----------
  const brouillon = (siret, email, etape = 6) => ({ etape, mode: 'manuel', perso: { prenom: 'Alice', nom: 'Test' }, f: {
    profil: 'commerce', nom: 'Boulangerie Test', secteur: 'Autre', adresse: '1 rue Test', codePostal: '06140', ville: 'Vence', siret, contact: 'Alice Test', email, tel: '', produits: 'pains', nbPointsVente: '1' } })
  async function inscription({ etape = 6, siret = '35600000000048', email = 'nouveau.test@test.invalid', mdp = 'motdepasse1', conf, signup, token, insertErr }) {
    const ctx = await nouveauCtx(), p = await ctx.newPage(); const appels = { signup: 0, token: 0, pros: 0 }
    await ctx.addInitScript(([k, b]) => { try { if (!sessionStorage.getItem('i')) { localStorage.setItem(k, JSON.stringify(b)); sessionStorage.setItem('i', '1') } } catch (e) {} }, ['flowin.premiere-fois.v1', brouillon(siret, email, etape)])
    await ctx.route('**/auth/v1/signup**', r => { appels.signup++; return signup(r, appels.signup) })
    await ctx.route('**/auth/v1/token**', r => { appels.token++; return token ? token(r) : json(r, 400, { code: 'invalid_credentials', msg: 'Invalid login credentials' }) })
    await ctx.route('**/rest/v1/pros**', async r => {
      const m = r.request().method()
      if (m === 'POST') { appels.pros++; return insertErr && appels.pros <= (insertErr.fois || 1) ? json(r, insertErr.status || 400, insertErr.body) : json(r, 201, []) }
      if (m === 'GET') return r.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
      return r.continue()
    })
    await p.goto(BASE + '/pro/premiere-fois', { waitUntil: 'networkidle', timeout: 90000 })
    await p.getByRole('button', { name: /Reprendre/ }).click()
    if (etape === 6) { await p.locator('#pf-mdp').fill(mdp); await p.locator('#pf-mdp2').fill(conf ?? mdp) }
    return { ctx, p, appels }
  }
  const suivant = p => p.locator('button.pf-btn').filter({ hasText: /Créer|Suivant|Continuer|C’est parti|Valider/ }).last()
  {
    const { ctx, p, appels } = await inscription({ signup: r => json(r, 200, { ...user('u-new', 'nouveau.test@test.invalid'), session: null }) })
    await suivant(p).click(); await p.waitForSelector('.pf-fin', { timeout: 20000 })
    v('nouveau compte : fiche enregistree, ecran de fin + email de confirmation', appels.pros === 1 && (await p.locator('.pf-info').innerText()).includes('email de confirmation'))
    await p.screenshot({ path: OUT + '/53-inscription-fin-m390.png', fullPage: true })
    await ctx.close()
  }
  {
    const { ctx, p } = await inscription({ mdp: 'court', signup: r => json(r, 200, {}) })
    await suivant(p).click()
    v('mot de passe trop court : bloque avant tout envoi', (await p.locator('.pf-err').first().innerText()).includes('8 caractères minimum'))
    await ctx.close()
  }
  {
    const { ctx, p } = await inscription({ conf: 'autre12345', signup: r => json(r, 200, {}) })
    await suivant(p).click()
    v('confirmation differente : bloque', (await p.locator('.pf-err').first().innerText()).includes('pas identiques'))
    await ctx.close()
  }
  {
    const { ctx, p } = await inscription({ etape: 1, siret: '12345678901234', signup: r => json(r, 200, {}) })
    await suivant(p).click()
    v('SIRET invalide : bloque avec un message', await p.locator('.pf-err').count() > 0, (await p.locator('.pf-err').first().innerText().catch(() => '')).slice(0, 60))
    await ctx.close()
  }
  {
    const { ctx, p, appels } = await inscription({ signup: r => json(r, 200, { ...user('u-old', 'nouveau.test@test.invalid', false), session: null }) })
    await suivant(p).click(); await p.waitForSelector('.pf-err, .pf-erreur, ' + AL, { timeout: 15000 }).catch(() => {})
    const t = await p.locator('body').innerText()
    v('compte existant (mauvais mot de passe) : message clair vers la connexion', t.includes('Un compte existe déjà avec cet email') && appels.pros === 0)
    await ctx.close()
  }
  {
    const { ctx, p, appels } = await inscription({ signup: r => json(r, 200, { ...user('u-old', 'nouveau.test@test.invalid', false), session: null }),
      token: r => json(r, 200, { access_token: jwt(), refresh_token: 'r', expires_in: 3600, token_type: 'bearer', user: user('u-old', 'nouveau.test@test.invalid') }) })
    await suivant(p).click(); await p.waitForSelector('.pf-fin', { timeout: 20000 })
    v('compte existant sans fiche (inscription interrompue) : fiche completee', appels.pros === 1)
    await ctx.close()
  }
  {
    const { ctx, p } = await inscription({ signup: r => json(r, 422, { code: 'weak_password', msg: 'Password should be at least 6 characters.' }) })
    await suivant(p).click(); await p.waitForSelector('.pf-erreur, .pf-err, ' + AL, { timeout: 15000 }).catch(() => {})
    const t = await p.locator('body').innerText()
    v('erreur signUp traduite (pas de texte anglais)', !/Password should|at least 6/.test(t) && t.includes('8 caractères'))
    await ctx.close()
  }
  {
    const { ctx, p, appels } = await inscription({ signup: r => json(r, 200, { ...user('u-new2', 'nouveau.test@test.invalid'), session: null }),
      insertErr: { fois: 2, status: 400, body: { code: '42501', message: 'permission denied for table pros' } } })
    await suivant(p).click(); await p.waitForTimeout(2500)
    const t = await p.locator('body').innerText()
    v('echec de la fiche : message francais, sans texte technique', t.includes('n’a pas pu être enregistrée') && !/permission denied/.test(t), '')
    await p.screenshot({ path: OUT + '/54-inscription-echec-fiche-m390.png', fullPage: true })
    await ctx.close()
  }
  {
    // reprise : 1er essai fiche refusee, 2e essai OK ; le signUp ne doit etre appele qu'UNE fois
    const { ctx, p, appels } = await inscription({ signup: r => json(r, 200, { ...user('u-new3', 'nouveau.test@test.invalid'), session: null }),
      insertErr: { fois: 1, status: 500, body: { code: 'XX000', message: 'boom' } } })
    await suivant(p).click(); await p.waitForTimeout(2000)
    await suivant(p).click(); await p.waitForSelector('.pf-fin', { timeout: 20000 }).catch(() => {})
    v('reprise apres echec : un seul signUp, fiche enregistree au 2e essai', appels.signup === 1 && (await p.locator('.pf-fin').count()) === 1, JSON.stringify(appels))
    await ctx.close()
  }
  await br.close(); console.log('KO=' + ko); process.exit(ko)
})()
