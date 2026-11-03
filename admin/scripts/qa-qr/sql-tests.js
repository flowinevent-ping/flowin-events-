/**
 * Tests SQL des QR permanents (sql/09-qr-permaliens.sql) sur la base locale JETABLE.
 * Prerequis : base flowin_qa reconstruite (run.sh) + seed.sql. Aucune base distante.
 * usage : NODE_PATH=<dossier avec pg> node sql-tests.js <sortie.json>
 */
const { Client } = require('pg')
const fs = require('fs')

const UID = { a: '00000000-0000-4000-8000-00000000000a', b: '00000000-0000-4000-8000-00000000000b', sa: '00000000-0000-4000-8000-0000000000fa' }
const resultats = []
const noter = (nom, ok, detail) => { resultats.push({ nom, ok: !!ok, detail: detail || '' }); console.log((ok ? 'OK   ' : 'ECHEC') + ' ' + nom + (detail ? ' — ' + detail : '')) }

async function main() {
  const c = new Client({ host: '/tmp', port: 54399, user: 'postgres', database: 'flowin_qa' })
  await c.connect()
  /* Execute `fn` dans une transaction avec un role + une identite, puis annule (ROLLBACK) sauf si garder. */
  async function en(role, uid, fn, garder) {
    await c.query('begin')
    try {
      await c.query('set local role ' + role)
      await c.query("select set_config('request.jwt.claim.sub', $1, true)", [uid || ''])
      const r = await fn()
      await c.query('reset role')
      await c.query(garder ? 'commit' : 'rollback')
      return { ok: true, r }
    } catch (e) {
      await c.query('rollback')
      return { ok: false, e }
    }
  }
  const q = (sql, p) => c.query(sql, p).then(r => r.rows)

  /* 1. codes ------------------------------------------------------------ */
  const t = (await q("select count(*)::int n, count(*) filter (where code_court is null)::int sans, min(length(code_court))::int mini, count(distinct code_court)::int dist, count(*) filter (where code_court !~ '^[a-z0-9]{8,32}$')::int mauvais from qr_stations"))[0]
  noter('Chaque QR a un code court', t.sans === 0 && t.n > 0, t.n + ' QR, ' + t.sans + ' sans code')
  noter('Codes uniques', t.dist === t.n, t.dist + ' codes distincts / ' + t.n)
  noter('Codes >= 8 caracteres, format [a-z0-9]', t.mini >= 8 && t.mauvais === 0, 'longueur min ' + t.mini)
  const sequentiel = (await q("select code_court from qr_stations order by created_at, id")).map(r => r.code_court)
  const incr = sequentiel.every((x, i) => i === 0 || x > sequentiel[i - 1])
  noter('Codes non incrementaux (pas devinables par comptage)', !incr || sequentiel.length < 6, 'ordre de creation != ordre alphabetique')

  /* 2. idempotence des QR par defaut ------------------------------------ */
  const avant = (await q("select count(*)::int n from qr_stations where event_id='ev-qa-fleuriste'"))[0].n
  await q("select qr_assurer_defauts('ev-qa-fleuriste')")
  await q("select qr_assurer_defauts('ev-qa-fleuriste')")
  const apres = (await q("select count(*)::int n from qr_stations where event_id='ev-qa-fleuriste'"))[0].n
  noter('qr_assurer_defauts sans doublon quand on le rejoue', avant === apres, avant + ' -> ' + apres)

  /* 3. garde-fous de structure ------------------------------------------ */
  let r = await en('authenticated', UID.a, () => c.query("insert into qr_stations (event_id, nom, source_qr) values ('ev-qa-boulangerie','Doublon','caisse')"))
  noter('Deux QR de meme slug dans une animation : refuse', !r.ok && /uniq_qr_stations_event_source|duplicate/i.test(r.e.message), r.e && r.e.code)
  r = await en('authenticated', UID.a, () => c.query("insert into qr_stations (event_id, nom, source_qr, type_qr) values ('ev-qa-boulangerie','Faux digital','pas-un-reseau','digital')"))
  noter('QR « digital » sans slug reseaux-* : refuse', !r.ok && /type_slug_coherent/.test(r.e.message), r.e && r.e.message.slice(0, 80))
  r = await en('authenticated', UID.a, () => c.query("insert into qr_stations (event_id, nom, source_qr, type_qr) values ('ev-qa-boulangerie','Faux physique','reseaux-triche','physique')"))
  noter('QR « physique » avec slug reseaux-* : refuse', !r.ok && /type_slug_coherent/.test(r.e.message))
  r = await en('authenticated', UID.a, () => c.query("insert into qr_stations (event_id, nom, source_qr, code_court) values ('ev-qa-boulangerie','Code court','x-1','abc')"))
  noter('Code trop court (< 8) refuse', !r.ok && /code_court_format/.test(r.e.message))
  r = await en('authenticated', UID.a, () => c.query("update qr_stations set source_qr='autre' where event_id='ev-qa-boulangerie' and source_qr='caisse'"))
  noter('Changer le slug d\'un QR : refuse', !r.ok && /ne peut pas changer/.test(r.e.message))
  r = await en('anon', '', () => c.query("update qr_stations set event_id='ev-qa-garage' where event_id='ev-qa-boulangerie' and source_qr='caisse'"))
  noter('Deplacer un QR vers une autre animation : refuse', !r.ok && /ne peut pas changer/.test(r.e.message))
  r = await en('authenticated', UID.a, () => c.query("update qr_stations set code_court='aaaaaaaaaaaa' where event_id='ev-qa-boulangerie' and source_qr='caisse'"))
  noter('Changer le code d\'un QR : refuse', !r.ok && /ne peut pas changer/.test(r.e.message))
  r = await en('authenticated', UID.a, () => c.query("update qr_stations set publie=false where event_id='ev-qa-boulangerie' and source_qr='caisse'"))
  noter('Masquer un QR (publie=false) reste possible', r.ok)

  /* 4. changement de jeu : qui peut ? ----------------------------------- */
  const etat = async () => (await q("select module, cfg->'master'->>'id' as master from events where id='ev-qa-boulangerie'"))[0]
  const avantJeu = await etat()
  r = await en('anon', '', () => c.query("select changer_jeu_station('ev-qa-boulangerie','spin')"))
  noter('Sans session : changement de jeu refuse', !r.ok && /propriétaire/.test(r.e.message), r.e && r.e.message)
  r = await en('authenticated', UID.b, () => c.query("select changer_jeu_station('ev-qa-boulangerie','spin')"))
  noter('Pro d\'une AUTRE animation : changement refuse', !r.ok && /propriétaire/.test(r.e.message))
  r = await en('anon', '', () => c.query("update events set module='spin' where id='ev-qa-boulangerie'"))
  noter('Ecriture directe events.module sans droit : refusee', !r.ok && /propriétaire/.test(r.e.message))
  r = await en('anon', '', () => c.query("update events set cfg = jsonb_set(cfg,'{master,id}','\"vote\"') where id='ev-qa-boulangerie'"))
  noter('Ecriture directe cfg.master.id sans droit : refusee', !r.ok && /propriétaire/.test(r.e.message))
  r = await en('anon', '', () => c.query("update events set cfg = jsonb_set(cfg,'{texteDiffusion}','\"bonjour\"', true) where id='ev-qa-boulangerie'"))
  noter('Autre modification de cfg (texte, lots...) sans toucher au jeu : toujours possible', r.ok)
  r = await en('anon', '', () => c.query("update events set cfg = cfg - 'master' where id='ev-qa-boulangerie'"))
  noter('Reecriture de cfg sans champ master (ecrans existants) : pas lue comme un changement de jeu', r.ok)
  const inchange = await etat()
  noter('Les refus n\'ont rien modifie', inchange.module === avantJeu.module && inchange.master === avantJeu.master, JSON.stringify(inchange))

  r = await en('authenticated', UID.a, () => c.query("select changer_jeu_station('ev-qa-boulangerie','nds2026')"))
  noter('Jeu Nuits du Sud interdit comme cible', !r.ok && /Jeu inconnu|jeu/.test(r.e.message))
  r = await en('authenticated', UID.a, () => c.query("select changer_jeu_station('ev-qa-boulangerie','jeu-bidon')"))
  noter('Jeu inconnu refuse', !r.ok)

  /* proprietaire : quiz -> spin, puis spin -> quizmaster, SA : -> tombola ; on GARDE pour les tests suivants */
  const codeCaisse = (await q("select code_court from qr_stations where event_id='ev-qa-boulangerie' and source_qr='magasin'"))[0].code_court
  r = await en('authenticated', UID.a, () => c.query("select changer_jeu_station('ev-qa-boulangerie','spin')"), true)
  const e1 = await etat()
  noter('Proprietaire : quiz -> roue, module ET master synchronises', r.ok && e1.module === 'spin' && e1.master === 'spin', JSON.stringify(e1))
  const persoConserve = (await q("select cfg->'master' as m from events where id='ev-qa-boulangerie'"))[0].m
  noter('La configuration (perso) est conservee, seul l\'id du jeu change', persoConserve && persoConserve.id === 'spin')
  r = await en('authenticated', UID.a, () => c.query("select changer_jeu_station('ev-qa-boulangerie','quizmaster')"), true)
  const e2 = await etat()
  noter('Proprietaire : roue -> Quiz Master (hors masters) : plus de master', r.ok && e2.module === 'quizmaster' && e2.master === null, JSON.stringify(e2))
  r = await en('authenticated', UID.sa, () => c.query("select changer_jeu_station('ev-qa-boulangerie','tombola')"), true)
  const e3 = await etat()
  noter('Super Admin : -> tombola', r.ok && e3.module === 'tombola' && e3.master === 'tombola', JSON.stringify(e3))
  r = await en('postgres', '', () => c.query("update events set module='quiz', cfg = jsonb_set(cfg,'{master,id}','\"quiz\"') where id='ev-qa-boulangerie'"), true)
  noter('Retour au quiz (SQL editor)', r.ok)

  const codeApres = (await q("select code_court from qr_stations where event_id='ev-qa-boulangerie' and source_qr='magasin'"))[0].code_court
  noter('Le code du QR n\'a pas bougé apres 4 changements de jeu', codeApres === codeCaisse, codeCaisse)

  const jr = await q("select par_role, par_email, avant->>'module' av, apres->>'module' ap, (par is not null) has_par, le is not null has_le from qr_jeu_journal where event_id='ev-qa-boulangerie' order by id")
  noter('Journal : 4 changements enregistres (qui, quand, avant, apres)', jr.length === 4 && jr.every(x => x.has_le), JSON.stringify(jr.map(x => x.par_role + ':' + x.av + '>' + x.ap)))
  noter('Journal : role du proprietaire / Super Admin / service', jr[0].par_role === 'proprietaire' && jr[2].par_role === 'super_admin' && jr[3].par_role === 'service')
  const avantMaster = (await q("select avant->'master' m from qr_jeu_journal where event_id='ev-qa-boulangerie' order by id limit 1"))[0].m
  noter('Journal : l\'ancienne configuration complete est gardee (retour arriere possible)', avantMaster && avantMaster.id === 'quiz')
  r = await en('anon', '', () => c.query('select count(*)::int n from qr_jeu_journal'))
  noter('Journal illisible sans session', !r.ok && /permission denied/i.test(r.e.message))
  r = await en('authenticated', UID.a, () => c.query("select count(*)::int n from qr_jeu_journal"))
  noter('Journal : le proprietaire ne voit que ses animations', r.ok && r.r.rows[0].n === 4, r.ok ? String(r.r.rows[0].n) : '')
  r = await en('authenticated', UID.b, () => c.query("select count(*)::int n from qr_jeu_journal where event_id='ev-qa-boulangerie'"))
  noter('Journal : un autre pro ne voit pas ces changements', r.ok && r.r.rows[0].n === 0)

  /* 5. regles par QR + statistiques apres changement de jeu --------------- */
  /* Joueur 1 joue le QR physique "magasin" (quiz) le matin, le jeu change, il rejoue : meme QR, meme jour. */
  const ins = (j, src, jour) => c.query("insert into participations (event_id, joueur_id, ticket_code, source_qr, played_date) values ('ev-qa-boulangerie',$1,'T',$2,$3)", [j, src, jour || new Date().toISOString().slice(0, 10)])
  await q("delete from participations where event_id='ev-qa-boulangerie'")
  await ins('j-qa-1', 'magasin')
  await c.query("select changer_jeu_station('ev-qa-boulangerie','spin')")
  let ko = false
  try { await ins('j-qa-1', 'magasin') } catch (e) { ko = /uniq_participation_qr_physique_jour/.test(e.message) }
  noter('Regle « 1 partie / jour / QR physique » : toujours appliquee apres changement de jeu', ko)
  let ok2 = true
  try { await ins('j-qa-1', 'caisse') } catch (e) { ok2 = false }
  noter('Autre QR physique le meme jour : autorise', ok2)
  let ok3 = true
  try { await ins('j-qa-1', 'magasin', '2099-01-02') } catch (e) { ok3 = false }
  noter('Meme QR un autre jour : autorise', ok3)
  await ins('j-qa-2', 'reseaux-tiktok')
  let ko2 = false
  try { await c.query("update participations set played_date='2098-01-01' where false"); await ins('j-qa-2', 'reseaux-tiktok', '2099-05-05') } catch (e) { ko2 = /uniq_participation_digital_compte_event/.test(e.message) }
  noter('QR digital : 1 fois par compte (index en base), meme apres changement de jeu', ko2)
  let ko3 = false
  try { await ins('j-qa-2', 'reseaux-facebook-concours', '2099-05-06') } catch (e) { ko3 = /uniq_participation_digital_compte_event/.test(e.message) }
  noter('QR digital : un 2e QR digital de la meme animation ne redonne pas droit a une partie', ko3)
  /* contournement : retirer / modifier la source (l'index ne s'applique qu'aux sources reseaux-*) */
  let contourne = true
  try { await ins('j-qa-2', null, '2099-05-07') } catch (e) { contourne = false }
  noter('CONSTAT (reste ouvert) : un compte qui a joue en digital peut rejouer en retirant `source` du lien (traite comme lien principal)', contourne === true, 'a decider avec Romain (voir rapport) — protection cote client uniquement')
  const st = await q("select source, parties::int, joueurs::int from stats_qr_evenement(array['ev-qa-boulangerie']) where source in ('magasin','caisse','reseaux-tiktok') order by source")
  const mag = st.find(x => x.source === 'magasin')
  noter('Statistiques par QR : l\'historique d\'avant le changement de jeu reste rattache au QR', mag && mag.parties === 2, JSON.stringify(st))

  fs.writeFileSync(process.argv[2] || 'sql-tests.json', JSON.stringify(resultats, null, 2))
  const echecs = resultats.filter(x => !x.ok)
  console.log('\n' + (resultats.length - echecs.length) + '/' + resultats.length + ' OK')
  await c.end()
  process.exit(echecs.length ? 1 : 0)
}
main().catch(e => { console.error(e); process.exit(2) })
