/* FLOWIN · MODE DEMO (maquette cliquable, 10/11/2026)
 *
 * Activation : n'importe quelle adresse avec ?demo=1 (memorise pour l'onglet, sessionStorage) ;
 * ?demo=0 en sort. Charge EN PREMIER (layout Next + pages statiques), avant tout autre script.
 *
 * Securite : en mode demo, AUCUNE requete d'ecriture ne part. Toute requete fetch / sendBeacon
 * dont la methode n'est pas GET / HEAD / OPTIONS est court-circuitee ici, dans le navigateur, et
 * recoit une fausse reponse « reussie ». Les lectures restent reelles.
 *   - REST Supabase (insert / update / upsert / delete) : la ligne envoyee est renvoyee telle quelle
 *     et gardee pour la session (sessionStorage flowin_demo_objets) ;
 *   - RPC Supabase : rejouee en GET (PostgREST execute un GET dans une transaction LECTURE SEULE :
 *     une fonction qui lit repond normalement, une fonction qui ecrit echoue) ; en cas d'echec,
 *     fausse reponse { ok: true } ;
 *   - stockage, fonctions, inscription (auth), routes /api : fausse reponse.
 * Tout ce qui est intercepte est journalise (window.__flowinDemo.interceptes, sessionStorage
 * flowin_demo_journal) : on peut lire ce qui AURAIT ete ecrit.
 *
 * Pas de blocage : au clic sur un bouton, les champs vides visibles de l'ecran sont remplis de
 * valeurs « Démo » (jamais de vraies coordonnees), puis le clic est rejoue.
 *
 * Syntaxe iOS Safari-safe : var, indexOf, pas de spread, pas d'Object.assign. */
(function () {
  var W = window;
  if (W.__flowinDemo) return;
  var CLE = 'flowin_demo', CLE_OBJ = 'flowin_demo_objets', CLE_JOURNAL = 'flowin_demo_journal';
  var PRO_DEMO = 'pro-qa-tech-1';

  function param(n) {
    var m = new RegExp('[?&]' + n + '=([^&#]*)').exec(W.location.search);
    return m ? decodeURIComponent(m[1]) : null;
  }
  function sget(k) { try { return W.sessionStorage.getItem(k); } catch (e) { return null; } }
  function sset(k, v) { try { W.sessionStorage.setItem(k, v); } catch (e) { /* navigation privee */ } }
  function sdel(k) { try { W.sessionStorage.removeItem(k); } catch (e) { /* rien */ } }

  var p = param('demo');
  if (p === '1') sset(CLE, '1');
  if (p === '0') { sdel(CLE); sdel(CLE_OBJ); sdel(CLE_JOURNAL); }
  var actif = p === '1' || (p !== '0' && sget(CLE) === '1');

  var D = { actif: actif, proDemo: PRO_DEMO, interceptes: [] };
  W.__flowinDemo = D;
  if (!actif) return;

  /* ---------- Pro par defaut : le compte de test ---------- */
  var chemin = W.location.pathname;
  if (/^\/pro(\/|$)/.test(chemin) && !/^\/pro\/(inscription|premiere-fois|connexion|nouveau-mot-de-passe)/.test(chemin) && !param('pro')) {
    var sep = W.location.search ? '&' : '?';
    W.location.replace(chemin + W.location.search + sep + 'pro=' + PRO_DEMO + W.location.hash);
  }

  function lireJson(k, def) { try { var v = JSON.parse(sget(k) || 'null'); return v === null ? def : v; } catch (e) { return def; } }
  function journal(entree) {
    D.interceptes.push(entree);
    var j = lireJson(CLE_JOURNAL, []);
    j.push(entree);
    if (j.length > 200) j = j.slice(j.length - 200);
    sset(CLE_JOURNAL, JSON.stringify(j));
  }
  function garder(table, methode, ligne) {
    var o = lireJson(CLE_OBJ, []);
    o.push({ table: table, methode: methode, ligne: ligne, quand: new Date().toISOString() });
    if (o.length > 100) o = o.slice(o.length - 100);
    sset(CLE_OBJ, JSON.stringify(o));
  }
  D.objets = function (table) {
    var o = lireJson(CLE_OBJ, []), r = [], i;
    for (i = 0; i < o.length; i++) if (!table || o[i].table === table) r.push(o[i]);
    return r;
  };
  D.journal = function () { return lireJson(CLE_JOURNAL, []); };

  /* ---------- Fausses reponses ---------- */
  var fetch0 = W.fetch ? W.fetch.bind(W) : null;
  function idDemo() { return 'demo-' + Math.random().toString(36).slice(2, 10); }
  function rep(status, corps) {
    var texte = corps === undefined || corps === null || status === 204 ? null : (typeof corps === 'string' ? corps : JSON.stringify(corps));
    return new Response(texte, { status: status, headers: { 'Content-Type': 'application/json', 'X-Flowin-Demo': '1' } });
  }
  function lireEntete(h, nom) {
    if (!h) return '';
    nom = nom.toLowerCase();
    if (typeof h.get === 'function') return h.get(nom) || '';
    var k;
    for (k in h) if (Object.prototype.hasOwnProperty.call(h, k) && k.toLowerCase() === nom) return String(h[k]);
    return '';
  }
  function filtresEq(u) {
    var r = {};
    u.searchParams.forEach(function (v, k) { if (v.indexOf('eq.') === 0 && k !== 'select') r[k] = v.slice(3); });
    return r;
  }
  function completer(ligne, eq) {
    var o = {}, k;
    if (ligne && typeof ligne === 'object') for (k in ligne) if (Object.prototype.hasOwnProperty.call(ligne, k)) o[k] = ligne[k];
    for (k in eq) if (Object.prototype.hasOwnProperty.call(eq, k) && o[k] === undefined) o[k] = eq[k];
    if (o.id === undefined) o.id = idDemo();
    if (o.created_at === undefined) o.created_at = new Date().toISOString();
    return o;
  }
  /* RPC dont la reponse doit etre fixee en demo (le reste : GET en lecture seule, sinon { ok: true }). */
  var RPC_DEMO = {
    verifier_pin_pro: function () { return true; },
    valider_lot: function (b) { return lotDemo(b, true); },
    accepter_ticket_expire: function (b) { return lotDemo(b, true); },
    consulter_lot: function (b) { return lotDemo(b, false); }
  };
  /* Billet Demo (lot.html?t=demo-…) : jamais un vrai billet. */
  function lotDemo(b, valide) {
    if (String((b && b.p_token) || '').indexOf('demo') !== 0) return null;
    var d = { ok: true, demo: true, partenaire: 'pt-demo', partenaire_nom: 'Commerce Démo', lot: 'Bon cadeau Démo', valeur: 10,
      gagnant: 'Joueur Démo', ticket_code: String(b.p_token).replace(/^demo-?/, '').toUpperCase() || 'DEMO', etat: 'gagne', operation_nom: 'Animation Démo' };
    if (valide) { d.etat = 'retire'; d.valide_le = new Date().toISOString(); d.retire_le = d.valide_le; }
    return d;
  }
  function versGet(u, corps) {
    var g = new URL(u.href), k, v;
    for (k in corps) if (Object.prototype.hasOwnProperty.call(corps, k)) {
      v = corps[k];
      if (v === null || v === undefined) continue;
      if (Object.prototype.toString.call(v) === '[object Array]') v = '{' + v.map(function (x) { return typeof x === 'string' ? '"' + x.replace(/"/g, '\\"') + '"' : String(x); }).join(',') + '}';
      else if (typeof v === 'object') v = JSON.stringify(v);
      g.searchParams.set(k, String(v));
    }
    return g.href;
  }

  function repondre(url, methode, entetes, texte, origine) {
    var u, corps = null;
    try { u = new URL(url, W.location.href); } catch (e) { return Promise.resolve(rep(200, { ok: true, demo: true })); }
    try { corps = texte ? JSON.parse(texte) : null; } catch (e) { corps = typeof texte === 'string' ? texte.slice(0, 500) : '[binaire]'; }
    var p = u.pathname, entree = { methode: methode, url: u.href, corps: corps, origine: origine || 'fetch', quand: new Date().toISOString() };
    journal(entree);
    var supa = u.host.indexOf('.supabase.co') > 0;

    if (supa && p.indexOf('/rest/v1/rpc/') === 0) {
      var fn = p.slice('/rest/v1/rpc/'.length);
      entree.rpc = fn;
      if (RPC_DEMO[fn]) { var f = RPC_DEMO[fn](corps); if (f !== null) return Promise.resolve(rep(200, f)); }
      var h = {}, ak = lireEntete(entetes, 'apikey'), au = lireEntete(entetes, 'authorization'), ac = lireEntete(entetes, 'accept');
      if (ak) h.apikey = ak;
      if (au) h.Authorization = au;
      if (ac) h.Accept = ac;
      return fetch0(versGet(u, corps && typeof corps === 'object' ? corps : {}), { method: 'GET', headers: h }).then(function (r) {
        if (r.ok) { entree.lecture = true; return r; }
        entree.lecture = false;
        return rep(200, { ok: true, demo: true, id: idDemo(), message: 'Mode démo : rien n’est enregistré.' });
      }, function () { return rep(200, { ok: true, demo: true }); });
    }
    if (supa && p.indexOf('/rest/v1/') === 0) {
      var table = p.slice('/rest/v1/'.length), prefer = lireEntete(entetes, 'prefer'), accept = lireEntete(entetes, 'accept');
      var eq = filtresEq(u), lignes = [], i;
      if (methode !== 'DELETE') {
        var src = Object.prototype.toString.call(corps) === '[object Array]' ? corps : [corps];
        for (i = 0; i < src.length; i++) { lignes.push(completer(src[i], eq)); garder(table, methode, lignes[i]); }
      } else garder(table, methode, eq);
      if (prefer.indexOf('return=representation') < 0) return Promise.resolve(rep(methode === 'POST' ? 201 : 204, null));
      if (accept.indexOf('vnd.pgrst.object') >= 0) return Promise.resolve(rep(methode === 'POST' ? 201 : 200, lignes[0] || {}));
      return Promise.resolve(rep(methode === 'POST' ? 201 : 200, lignes));
    }
    if (supa && p.indexOf('/storage/v1/') === 0) {
      var cle = p.replace(/^\/storage\/v1\/object\/(sign\/|upload\/sign\/)?/, '');
      return Promise.resolve(rep(200, { Key: cle, Id: idDemo(), path: cle.replace(/^[^/]+\//, ''), signedURL: '/storage/v1/object/sign/' + cle + '?token=demo' }));
    }
    if (supa && p.indexOf('/auth/v1/') === 0) {
      var maintenant = new Date().toISOString();
      var user = { id: '00000000-0000-4000-8000-000000000000', aud: 'authenticated', role: 'authenticated', email: (corps && corps.email) || 'demo@demo.invalid',
        identities: [{ id: 'demo', provider: 'email' }], created_at: maintenant, updated_at: maintenant, app_metadata: {}, user_metadata: {} };
      if (p.indexOf('/auth/v1/signup') === 0 || p.indexOf('/auth/v1/user') === 0) return Promise.resolve(rep(200, user));
      if (p.indexOf('/auth/v1/logout') === 0) return Promise.resolve(rep(204, null));
      if (p.indexOf('/auth/v1/token') === 0) return Promise.resolve(rep(400, { error: 'demo', error_description: 'Mode démo : connexion désactivée.' }));
      return Promise.resolve(rep(200, {}));
    }
    return Promise.resolve(rep(200, { ok: true, demo: true, id: idDemo(), message: 'Mode démo : rien n’est enregistré.' }));
  }

  function fetchDemo(input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) ? input.url : String(input);
    var methode = String((init && init.method) || (input && input.method) || 'GET').toUpperCase();
    if (methode === 'GET' || methode === 'HEAD' || methode === 'OPTIONS') return fetch0(input, init);
    var entetes = (init && init.headers) || (input && input.headers) || null;
    var b = init && init.body;
    if (b === undefined && input && typeof input.clone === 'function') {
      return input.clone().text().then(function (t) { return repondre(url, methode, entetes, t); });
    }
    return repondre(url, methode, entetes, typeof b === 'string' ? b : (b ? '[binaire]' : ''));
  }
  if (fetch0) W.fetch = fetchDemo;
  D.fetch = fetchDemo;
  if (W.navigator && W.navigator.sendBeacon) {
    W.navigator.sendBeacon = function (url, data) { journal({ methode: 'BEACON', url: String(url), corps: typeof data === 'string' ? data : '[donnees]', origine: 'beacon', quand: new Date().toISOString() }); return true; };
  }
  /* Formulaires HTML classiques en POST : jamais envoyes. */
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (f && String(f.method || '').toLowerCase() === 'post' && f.getAttribute('action')) { e.preventDefault(); journal({ methode: 'POST', url: f.action, corps: '[formulaire]', origine: 'form', quand: new Date().toISOString() }); }
  }, true);

  /* ---------- Remplissage automatique (valeurs Démo) ---------- */
  function imageDejaPresente(el) {
    var n = el.parentNode, k, imgs, j;
    for (k = 0; k < 5 && n && n.querySelectorAll; k++) {
      imgs = n.querySelectorAll('img');
      for (j = 0; j < imgs.length; j++) { if (imgs[j].getAttribute('src') && imgs[j].naturalWidth > 0) return true; }
      n = n.parentNode;
    }
    return false;
  }
  function visible(el) { return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length); }
  function indice(el) {
    var t = [el.name, el.id, el.placeholder, el.getAttribute('autocomplete'), el.getAttribute('aria-label'), el.getAttribute('inputmode')], lab = '';
    try { if (el.id) { var l = document.querySelector('label[for="' + el.id + '"]'); if (l) lab = l.textContent; } } catch (e) { /* id exotique */ }
    if (!lab && el.closest) { var lp = el.closest('label'); if (lp) lab = lp.textContent; }
    if (!lab && el.parentNode) { var pl = el.parentNode.querySelector && el.parentNode.querySelector('label'); if (pl) lab = pl.textContent; }
    t.push(lab);
    return t.join(' ').toLowerCase();
  }
  function valeurPour(el) {
    var ty = String(el.type || 'text').toLowerCase(), k = indice(el), v;
    if (ty === 'email' || k.indexOf('mail') >= 0) v = 'demo@demo.invalid';
    else if (ty === 'password') v = 'demo-demo-2026';
    else if (ty === 'number' || ty === 'range') v = el.min && parseFloat(el.min) > 0 ? el.min : '1';
    else if (ty === 'date') v = '2026-12-15';
    else if (ty === 'time') v = '10:00';
    else if (ty === 'datetime-local') v = '2026-12-15T10:00';
    else if (ty === 'month') v = '2026-12';
    else if (ty === 'url') v = 'https://demo.invalid';
    else if (ty === 'tel' || /(^|[^a-z])tel|t[ée]l[ée]phone|t[ée]l\.|portable|mobile|phone/.test(k)) v = '00 00 00 00 00';
    else if (/siret|siren|tva|iban|bic/.test(k)) v = '[démo]';
    else if (/postal|(^|[^a-z])cp([^a-z]|$)|zip/.test(k)) v = '00000';
    else if (/\bpin\b|code pro|code professionnel|\b0000\b/.test(k)) v = '0000';
    else if (/pr[ée]nom/.test(k)) v = 'Prénom Démo';
    else if (/ville|commune/.test(k)) v = 'Ville Démo';
    else if (/adresse|\brue\b/.test(k)) v = '1 rue Démo';
    else if (/enseigne|commerce|raison|soci[ée]t[ée]|entreprise|[ée]tablissement/.test(k)) v = 'Commerce Démo';
    else if (/\bnom\b|name/.test(k)) v = 'Nom Démo';
    else if (/montant|prix|panier|valeur|quantit|nombre|\bnb\b/.test(k) || el.getAttribute('inputmode') === 'numeric' || el.getAttribute('inputmode') === 'decimal') v = '1';
    else v = el.tagName === 'TEXTAREA' ? 'Texte de démonstration (Démo).' : 'Démo';
    var max = parseInt(el.getAttribute('maxlength') || '', 10);
    if (max > 0 && v.length > max) v = /^\d/.test(v) || v === '00 00 00 00 00' ? '0000000000'.slice(0, max) : v.slice(0, max);
    var min = parseInt(el.getAttribute('minlength') || '', 10);
    while (min > 0 && v.length < min) v += ' Démo';
    return v;
  }
  function poser(el, v) {
    var proto = el.tagName === 'TEXTAREA' ? W.HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? W.HTMLSelectElement.prototype : W.HTMLInputElement.prototype;
    var d = Object.getOwnPropertyDescriptor(proto, 'value');
    if (d && d.set) d.set.call(el, v); else el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
  var PNG_DEMO = 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAeklEQVR4nO3PUQkAIBTAwNfLKsY1mCH8OITBAtxm7fN1wwUNaEEDWtCAFjSgBQ1oQQNa0IAWNKAFDWhBA1rQgBY0oAUNaEEDWtCAFjSgBQ1oQQNa0IAWNKAFDWhBA1rQgBY0oAUNaEEDWtCAFjSgBQ1oQQNa0IAWPHYBSbSxPHGJaQkAAAAASUVORK5CYII=';
  function fichierDemo() {
    var bin = atob(PNG_DEMO), a = new Uint8Array(bin.length), i;
    for (i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
    return new File([a], 'logo-demo.png', { type: 'image/png' });
  }
  var ACCORD = /accepte|cgv|conditions|j.ai lu|consen|certifie|reconnais|engage|autorise|valide mon|bon pour accord/;
  function remplir(racine) {
    racine = racine || document;
    var n = 0, i, el, ty, champs = racine.querySelectorAll('input, textarea, select'), radios = {};
    for (i = 0; i < champs.length; i++) {
      el = champs[i];
      if (el.disabled || el.readOnly || el.closest('#flowin-demo-bar')) continue;
      ty = String(el.type || '').toLowerCase();
      if (ty === 'file') {
        if (el.getAttribute('data-demo') || (el.files && el.files.length) || String(el.accept || '').indexOf('image') < 0) continue;
        if (imageDejaPresente(el)) continue; /* 10/11 : un logo deja affiche n'est jamais remplace par l'image de demo */
        try { var dt = new DataTransfer(); dt.items.add(fichierDemo()); el.files = dt.files; el.setAttribute('data-demo', '1'); el.dispatchEvent(new Event('change', { bubbles: true })); n++; } catch (e) { /* navigateur ancien */ }
        continue;
      }
      if (!visible(el)) continue;
      if (ty === 'hidden' || ty === 'submit' || ty === 'button' || ty === 'reset' || ty === 'search' || ty === 'color' || ty === 'image') continue;
      if (ty === 'checkbox') { if (!el.checked && (el.required || ACCORD.test(indice(el)))) { el.click(); n++; } continue; }
      if (ty === 'radio') { if (el.name) { if (!radios[el.name]) radios[el.name] = []; radios[el.name].push(el); } continue; }
      if (el.tagName === 'SELECT') {
        if (!el.value) { var j; for (j = 0; j < el.options.length; j++) if (el.options[j].value && !el.options[j].disabled) { poser(el, el.options[j].value); n++; break; } }
        continue;
      }
      if (String(el.value || '').replace(/\s/g, '') === '') { poser(el, valeurPour(el)); n++; }
    }
    /* Consentements obligatoires des jeux (bascules data-consent, classe « on ») : la case « jeu ». */
    var cs = racine.querySelectorAll('[data-consent="jeu"]');
    for (i = 0; i < cs.length; i++) if (String(cs[i].className).indexOf(' on') < 0 && String(cs[i].className).indexOf('on ') !== 0 && cs[i].className !== 'on' && visible(cs[i])) { cs[i].click(); n++; }
    var nom;
    for (nom in radios) if (Object.prototype.hasOwnProperty.call(radios, nom)) {
      var g = radios[nom], coche = false;
      for (i = 0; i < g.length; i++) if (g[i].checked) coche = true;
      if (!coche && g[0].required) { g[0].click(); n++; }
    }
    return n;
  }
  D.remplir = remplir;

  var rejeu = false;
  function cible(e) {
    var t = e.target;
    if (!t || !t.closest) return null;
    var b = t.closest('button, input[type=submit], input[type=button], [role=button]');
    if (!b || b.closest('#flowin-demo-bar')) return null;
    return b;
  }
  /* Bouton desactive tant que l'ecran est incomplet : on remplit des le contact. */
  function auContact(e) { var b = cible(e); if (b && b.disabled) remplir(b.closest('form') || document); }
  document.addEventListener('pointerdown', auContact, true);
  document.addEventListener('touchstart', auContact, true);
  document.addEventListener('click', function (e) {
    if (rejeu) return;
    var b = cible(e);
    if (!b) return;
    var n = remplir(b.closest('form') || document);
    if (n > 0) {
      e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      setTimeout(function () { rejeu = true; try { b.click(); } finally { rejeu = false; } }, 80);
    }
  }, true);

  /* ---------- Bandeau ---------- */
  function urlSortie() {
    var u = new URL(W.location.href);
    u.searchParams.set('demo', '0');
    return u.pathname + u.search + u.hash;
  }
  function bandeau() {
    if (W.self !== W.top) return; /* apercu dans un cadre : pas de second bandeau */
    if (!document.body || document.getElementById('flowin-demo-bar')) return;
    var b = document.createElement('div');
    b.id = 'flowin-demo-bar';
    b.setAttribute('role', 'status');
    b.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:2147483647;height:24px;display:flex;align-items:center;justify-content:center;gap:6px;' +
      'background:#141a2e;color:#fff;font:600 12px/24px system-ui,-apple-system,Segoe UI,Roboto,sans-serif;letter-spacing:.2px;box-shadow:0 1px 4px rgba(0,0,0,.25);pointer-events:none';
    b.appendChild(document.createTextNode('Mode démo : rien n’est enregistré · '));
    var a = document.createElement('a');
    a.href = urlSortie();
    a.textContent = 'Quitter';
    a.style.cssText = 'color:#F28C28;text-decoration:underline;pointer-events:auto';
    b.appendChild(a);
    document.body.appendChild(b);
    /* 10/11 (controle) : le bandeau ne masque plus le haut de la page (barre de l'espace pro). */
    document.body.className += ' flowin-demo';
    document.body.style.paddingTop = '24px';
    document.documentElement.style.setProperty('--flowin-demo-h', '24px');
  }
  /* Apres l'hydratation de React (sinon un noeud en trop dans <body> casse l'hydratation). */
  W.addEventListener('load', function () { setTimeout(bandeau, 300); setInterval(bandeau, 1500); });

  /* Animations « creees » pendant la demo : visibles dans Mes animations (/pro). */
  function mesAnimationsDemo() {
    if (W.location.pathname !== '/pro' || document.getElementById('flowin-demo-crees')) return;
    var evs = D.objets('events'), vus = {}, liste = [], i, l;
    for (i = evs.length - 1; i >= 0; i--) { l = evs[i].ligne || {}; if (l.id && !vus[l.id] && evs[i].methode === 'POST') { vus[l.id] = 1; liste.push(l); } }
    if (!liste.length) return;
    var h1 = document.querySelector('main h1, h1');
    if (!h1 || !h1.parentNode) return;
    var box = document.createElement('div');
    box.id = 'flowin-demo-crees';
    box.style.cssText = 'margin:10px 0 14px;padding:12px 14px;border:2px dashed #3B5CC4;border-radius:14px;background:#f5f7fc;font:14px/1.4 system-ui,sans-serif;color:#141a2e';
    var t = document.createElement('div');
    t.style.cssText = 'font-weight:800;margin-bottom:6px';
    t.textContent = 'Créées pendant la démo (non enregistrées)';
    box.appendChild(t);
    for (i = 0; i < liste.length; i++) {
      var r = document.createElement('div');
      var cfg = liste[i].cfg || {};
      r.textContent = '• ' + (liste[i].nom || liste[i].titre || cfg.nom || cfg.titre || 'Animation Démo') + (liste[i].module ? ' · ' + liste[i].module : '') + ' · ' + (liste[i].status || 'brouillon');
      box.appendChild(r);
    }
    h1.parentNode.insertBefore(box, h1.nextSibling);
  }
  W.addEventListener('load', function () { setTimeout(mesAnimationsDemo, 600); setInterval(mesAnimationsDemo, 2000); });
})();
