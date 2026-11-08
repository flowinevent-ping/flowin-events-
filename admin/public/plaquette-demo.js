/* Plaquettes interactives : outils de demonstration (ES5, iOS Safari). Charge par plaquette-animation-magasin.html et
   plaquette-super-event.html. N'ajoute que des boutons : le parcours existant n'est pas modifie.
   - « Effacer ce que j'ai saisi » + « ← Retour » sur chaque ecran qui contient un formulaire ;
   - « Recommencer la demo » en un clic ;
   - bascule discrete « Mode demo : rien n'est enregistre » (desactivee par defaut) : plus aucun envoi reel
     (demande de rappel, inscription, commande) tant qu'elle est activee. */
(function () {
  'use strict';
  var CLE_MODE = 'flowin_demo_mode';
  function lire() { try { return window.sessionStorage.getItem(CLE_MODE) === '1'; } catch (e) { return false; } }
  function ecrire(on) { try { if (on) window.sessionStorage.setItem(CLE_MODE, '1'); else window.sessionStorage.removeItem(CLE_MODE); } catch (e) {} }
  var demo = lire();
  function el(tag, attrs, txt) {
    var n = document.createElement(tag);
    for (var k in attrs) if (attrs.hasOwnProperty(k)) n.setAttribute(k, attrs[k]);
    if (txt) n.textContent = txt;
    return n;
  }
  function effacerStockage(complet) {
    var cles = ['flowin_am_certif'];
    if (complet) cles.push('flowin_am_prefill', CLE_MODE);
    for (var i = 0; i < cles.length; i++) { try { window.sessionStorage.removeItem(cles[i]); } catch (e) {} try { window.localStorage.removeItem(cles[i]); } catch (e2) {} }
  }

  /* ----- Blocage des envois reels en mode demo ----- */
  var fetchOrigine = window.fetch;
  if (fetchOrigine) {
    window.fetch = function (url, opts) {
      var u = String(url && url.url ? url.url : url);
      var m = ((opts && opts.method) || 'GET').toUpperCase();
      if (demo && m !== 'GET' && m !== 'HEAD') {
        avertir('Mode démo : rien n’a été envoyé ni enregistré.');
        return Promise.resolve(new Response(JSON.stringify({ ok: true, demo: true }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }
      return fetchOrigine.apply(window, arguments);
    };
  }
  document.addEventListener('click', function (e) {
    if (!demo) return;
    var a = e.target; while (a && a !== document && !(a.tagName === 'A' && a.getAttribute('href'))) a = a.parentNode;
    if (!a || a === document) return;
    var h = a.getAttribute('href') || '';
    if (h.indexOf('/pro/') === 0 || h.indexOf('/bon-commande') === 0 || h.indexOf('/rejoindre') === 0) {
      e.preventDefault(); e.stopPropagation();
      avertir('Mode démo : ce lien (inscription ou commande réelle) est désactivé.');
    }
  }, true);

  /* ----- Interface ----- */
  var css = '.fd-pill{position:fixed;left:10px;bottom:calc(var(--bot,64px) + 8px);z-index:60;font:600 11px/1 system-ui,sans-serif;color:#555;background:rgba(255,255,255,.92);border:1px solid #cbd5e1;border-radius:99px;padding:7px 11px;cursor:pointer;opacity:.75}'
    + '.fd-pill.on{background:#B45309;color:#fff;border-color:#B45309;opacity:1}'
    + '.fd-panel{position:fixed;left:10px;bottom:calc(var(--bot,64px) + 44px);z-index:61;width:min(300px,calc(100vw - 20px));background:#fff;border:1px solid #cbd5e1;border-radius:14px;box-shadow:0 12px 30px rgba(0,0,0,.18);padding:14px;font:500 13px/1.45 system-ui,sans-serif;color:#1c1024;display:none}'
    + '.fd-panel.open{display:block}.fd-panel label{display:flex;gap:8px;align-items:flex-start;cursor:pointer;font-weight:700}'
    + '.fd-panel button{margin-top:10px;width:100%;border:1.5px solid #7A4FE0;background:#fff;color:#7A4FE0;border-radius:99px;padding:10px;font:700 13px system-ui,sans-serif;cursor:pointer}'
    + '.fd-toast{position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:70;background:#B45309;color:#fff;border-radius:12px;padding:10px 14px;font:700 13px/1.4 system-ui,sans-serif;max-width:92vw;display:none;text-align:center}'
    + '.fd-bar{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 12px}.fd-bar button{border:1.5px solid #cbd5e1;background:#fff;color:#334155;border-radius:99px;padding:8px 14px;font:700 12.5px system-ui,sans-serif;cursor:pointer}';
  var st = el('style', {}); st.appendChild(document.createTextNode(css)); document.head.appendChild(st);
  var toast = el('div', { 'class': 'fd-toast', role: 'status' });
  var timer = null;
  function avertir(t) { toast.textContent = t; toast.style.display = 'block'; if (timer) clearTimeout(timer); timer = setTimeout(function () { toast.style.display = 'none'; }, 3500); }

  function monter() {
    document.body.appendChild(toast);
    var pill = el('button', { 'class': 'fd-pill', type: 'button', id: 'fdPill', 'aria-expanded': 'false' }, 'Démo');
    var panel = el('div', { 'class': 'fd-panel', id: 'fdPanel', role: 'dialog', 'aria-label': 'Outils de démonstration' });
    var lab = el('label', {}); var cb = el('input', { type: 'checkbox', id: 'fdMode' }); cb.checked = demo;
    lab.appendChild(cb); lab.appendChild(el('span', {}, 'Mode démo : rien n’est enregistré'));
    var note = el('div', { style: 'margin-top:6px;font-size:12px;color:#64748b' }, 'Désactivé par défaut. Activé : aucun envoi réel (rappel, inscription, commande).');
    var rec = el('button', { type: 'button', id: 'fdReset' }, 'Recommencer la démo');
    panel.appendChild(lab); panel.appendChild(note); panel.appendChild(rec);
    document.body.appendChild(pill); document.body.appendChild(panel);
    /* Etiquette « Demo » masquee pour le prospect (elle faisait « maquette ») : visible seulement avec ?demo=1 ou si le mode demo est actif. */
    if (!demo && !/[?&]demo=1(&|$)/.test(location.search)) pill.style.display = 'none';
    function maj() { pill.className = 'fd-pill' + (demo ? ' on' : ''); pill.textContent = demo ? 'Démo : rien enregistré' : 'Démo'; }
    maj();
    pill.addEventListener('click', function () { var o = panel.className.indexOf('open') < 0; panel.className = 'fd-panel' + (o ? ' open' : ''); pill.setAttribute('aria-expanded', o ? 'true' : 'false'); });
    cb.addEventListener('change', function () { demo = cb.checked; ecrire(demo); maj(); panel.className = 'fd-panel'; pill.setAttribute('aria-expanded', 'false'); if (demo) avertir('Mode démo activé : rien ne sera enregistré.'); });
    rec.addEventListener('click', function () {
      effacerStockage(true); /* le mode demo est aussi remis a zero */
      location.href = location.pathname + location.search.replace(/[?&]demo=\d/, '');
      setTimeout(function () { location.reload(); }, 50);
    });

    /* « Effacer » + « Retour » sur chaque ecran avec formulaire. */
    var ecrans = document.querySelectorAll('.pg, .sheet');
    for (var i = 0; i < ecrans.length; i++) (function (sc) {
      var aForm = sc.querySelector('input, select, textarea');
      if (!aForm || sc.querySelector('.fd-bar')) return;
      var bar = el('div', { 'class': 'fd-bar' });
      var ret = el('button', { type: 'button', 'data-demo': 'retour' }, '← Retour');
      var eff = el('button', { type: 'button', 'data-demo': 'effacer' }, 'Effacer ce que j’ai saisi');
      bar.appendChild(ret); bar.appendChild(eff);
      var cible = sc.querySelector('.in') || sc;
      cible.insertBefore(bar, cible.firstChild);
      ret.addEventListener('click', function () {
        var fermer = sc.querySelector('[data-close]');
        if (sc.className.indexOf('sheet') >= 0 && fermer) { fermer.click(); return; }
        var prev = document.getElementById('prev'); if (prev) prev.click();
      });
      eff.addEventListener('click', function () {
        var f = sc.querySelectorAll('form'); for (var a = 0; a < f.length; a++) { try { f[a].reset(); f[a].style.display = ''; } catch (e) {} }
        var champs = sc.querySelectorAll('input, select, textarea');
        for (var b = 0; b < champs.length; b++) { var c = champs[b]; if (c.type === 'checkbox' || c.type === 'radio') c.checked = false; else if (c.tagName === 'SELECT') c.selectedIndex = 0; else c.value = ''; }
        var errs = sc.querySelectorAll('.err'); for (var d = 0; d < errs.length; d++) errs[d].className = errs[d].className.replace(/ ?err/g, '');
        var msg = sc.querySelector('.fmsg'); if (msg) { msg.textContent = ''; msg.className = 'fmsg'; }
        var merci = sc.querySelector('.merci'); if (merci) merci.className = merci.className.replace(/ ?on/g, '');
        var bt = sc.querySelector('#r_send'); if (bt) bt.disabled = false;
        if (sc.id !== 'rappel') { effacerStockage(false); var h = '#' + sc.id; location.hash = h; location.reload(); }
      });
    })(ecrans[i]);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', monter); else monter();
})();
