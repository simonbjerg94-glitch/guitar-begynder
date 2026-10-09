/* Guitar fra bunden – app-logik. Alt gemmes lokalt i browseren (localStorage). Ingen konti, ingen servere. */
(function () {
  'use strict';
  var A = AKKORD_DATA.akkorder, BY = {}; A.forEach(function (a) { BY[a.id] = a; });
  var ALLE_TRIN = []; REJSE.forEach(function (lv) { lv.trin.forEach(function (t) { t.niveau = lv.niveau; ALLE_TRIN.push(t); }); });
  var KEY = 'guitar-begynder-v1';
  var S = load();
  function load() {
    var d; try { d = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    d = d || {};
    d.dage = d.dage || {};           // 'YYYY-MM-DD' -> minutter
    d.fokusDage = d.fokusDage || {}; // akkord-id -> [datoer]
    d.trinKlaret = d.trinKlaret || {};
    d.skift = d.skift || {};         // 'Em|Am' -> [{dato, n}]
    d.badges = d.badges || {};
    d.indst = d.indst || { laengde: 10, ugemaal: 5 };
    d.sessioner = d.sessioner || [];
    return d;
  }
  function save() { localStorage.setItem(KEY, JSON.stringify(S)); }
  function today(off) { var d = new Date(); d.setDate(d.getDate() + (off || 0)); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function $(sel, el) { return (el || document).querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }
  function toast(msg) { var t = document.createElement('div'); t.className = 'toast'; t.innerHTML = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2600); }
  function navn(id) { return BY[id] ? BY[id].navn : id; }
  function kort(id) { return id.replace('-mini', ' mini'); }

  /* ---------- Fremskridt ---------- */
  function pairKey(p) { return p[0] + '|' + p[1]; }
  function bestSkift(p) { var h = S.skift[pairKey(p)] || []; return h.reduce(function (m, x) { return Math.max(m, x.n); }, 0); }
  function trinKlaret(t) {
    if (S.trinKlaret[t.id]) return true;
    if (!t.krav) return false;
    if (t.krav.dage && t.type === 'akkord') return (S.fokusDage[t.akkord] || []).length >= t.krav.dage;
    if (t.krav.dage) return (S.fokusDage['trin:' + t.id] || []).length >= t.krav.dage;
    if (t.krav.skift) return bestSkift(t.skift) >= t.krav.skift;
    return false;
  }
  function aktueltTrin() { for (var i = 0; i < ALLE_TRIN.length; i++) if (!trinKlaret(ALLE_TRIN[i])) return ALLE_TRIN[i]; return ALLE_TRIN[ALLE_TRIN.length - 1]; }
  function antalKlaret() { return ALLE_TRIN.filter(trinKlaret).length; }
  function laerteAkkorder() { var r = []; ALLE_TRIN.forEach(function (t) { if (t.type === 'akkord' && trinKlaret(t)) r.push(t.akkord); }); return r; }
  function streak() {
    // dage med spil i træk; én hviledag bryder ikke striben, to gør
    var n = 0, gap = 0, d = S.dage[today()] ? 0 : -1;
    if (d === -1 && !S.dage[today(-1)]) { if (!S.dage[today(-2)]) return 0; d = -2; }
    for (var i = d; i > -400; i--) {
      if (S.dage[today(i)]) { n++; gap = 0; } else { gap++; if (gap >= 2) break; }
    }
    return n;
  }
  function iTraek() { var n = 0; for (var i = 0; i > -30; i--) { if (S.dage[today(i)]) n++; else if (i < 0) break; } return n; }
  function ugeDage() { // mandag–søndag i denne uge
    var d = new Date(), wd = (d.getDay() + 6) % 7, r = [];
    for (var i = 0; i < 7; i++) r.push(today(i - wd));
    return r;
  }
  function ugeSpillet() { return ugeDage().filter(function (x) { return S.dage[x]; }).length; }
  function totalMin() { return Object.keys(S.dage).reduce(function (s, k) { return s + S.dage[k]; }, 0); }
  function logFokus(key) { var l = S.fokusDage[key] = S.fokusDage[key] || []; if (l.indexOf(today()) < 0) l.push(today()); }
  function logMinutter(m) { S.dage[today()] = Math.round(((S.dage[today()] || 0) + m) * 10) / 10; }

  var BADGES = [
    { id: 'foerste-lyd', em: '🎸', navn: 'Første lyd', test: function () { return Object.keys(S.dage).length > 0; } },
    { id: 'foerste-akkord', em: '✋', navn: 'Første akkord', test: function () { return laerteAkkorder().length >= 1; } },
    { id: 'fem-akkorder', em: '🖐️', navn: 'Alle fem', test: function () { return ['Em', 'Am', 'C', 'G', 'D'].every(function (a) { return laerteAkkorder().indexOf(a) >= 0; }); } },
    { id: 'tre-dage', em: '🔥', navn: '3 dage i træk', test: function () { return streak() >= 3; } },
    { id: 'syv-dage', em: '🏆', navn: '7 dages stribe', test: function () { return streak() >= 7; } },
    { id: 'ugemaal', em: '🎯', navn: 'Ugemål nået', test: function () { return ugeSpillet() >= S.indst.ugemaal; } },
    { id: 'tredive-skift', em: '⚡', navn: '30 skift/min', test: function () { return Object.keys(S.skift).some(function (k) { return S.skift[k].some(function (x) { return x.n >= 30; }); }); } },
    { id: 'en-time', em: '⏱️', navn: '60 minutter', test: function () { return totalMin() >= 60; } },
    { id: 'foerste-sang', em: '🎶', navn: 'Første sang', test: function () { return ALLE_TRIN.some(function (t) { return t.niveau === 5 && trinKlaret(t); }); } }
  ];
  function tjekBadges() {
    BADGES.forEach(function (b) { if (!S.badges[b.id] && b.test()) { S.badges[b.id] = today(); save(); toast(b.em + ' Nyt mærke: <b>' + b.navn + '</b>'); } });
  }

  /* ---------- Dagens øvelse ---------- */
  function dagensPlan() {
    var t = aktueltTrin(), laert = laerteAkkorder(), akkord, par, afslut = { type: 'slag', moenster: 'fire' };
    if (t.type === 'akkord') { akkord = t.akkord; var forrige = laert.filter(function (a) { return a !== akkord && BY[a].gruppe === 'hoved'; }).pop(); par = forrige ? [forrige, akkord] : null; }
    else if (t.type === 'skift') { akkord = t.skift[1]; par = t.skift; }
    else if (t.type === 'slag') { akkord = t.akkord; afslut = { type: 'slag', moenster: t.moenster }; var sk = ALLE_TRIN.filter(function (x) { return x.type === 'skift'; }); par = sk[sk.length - 1].skift; }
    else if (t.type === 'sang') { var sg = SANGE[t.sang]; akkord = sg.raekke[0]; par = [sg.raekke[0], sg.raekke[1]]; afslut = { type: 'sang', sang: t.sang }; }
    else { akkord = laert.length ? laert[laert.length - 1] : 'Em7'; par = laert.length >= 2 ? [laert[laert.length - 2], laert[laert.length - 1]] : null; }
    var L = S.indst.laengde, fordeling = { 5: [1, 1.5, 2, 0.5], 10: [2, 3, 4, 1], 15: [2, 4, 6, 3] }[L] || [2, 3, 4, 1];
    var segs = [
      { id: 'opvarm', titel: 'Opvarmning', min: fordeling[0] },
      { id: 'akkord', titel: 'Én akkord: ' + navn(akkord), min: fordeling[1], akkord: akkord },
      par ? { id: 'skift', titel: 'Ét skift: ' + kort(par[0]) + ' ↔ ' + kort(par[1]), min: fordeling[2], par: par }
          : { id: 'skift', titel: 'Sæt – slå – slip: ' + kort(akkord), min: fordeling[2], par: null, akkord: akkord },
      { id: 'afslut', titel: afslut.type === 'sang' ? 'Afslutning: ' + SANGE[afslut.sang].navn : 'Afslutning: ' + SLAGMOENSTRE[afslut.moenster].navn, min: fordeling[3], afslut: afslut, akkord: akkord }
    ];
    return { trin: t, akkord: akkord, par: par, segs: segs };
  }

  /* ---------- Rammer og navigation ---------- */
  var cleanup = [];
  function onLeave(fn) { cleanup.push(fn); }
  function render(title, html, back) {
    cleanup.forEach(function (f) { try { f(); } catch (e) {} }); cleanup = [];
    $('#top').innerHTML = (back ? '<button class="back" aria-label="Tilbage" onclick="history.back()">‹</button>' : '') + '<h1>' + title + '</h1>';
    $('#app').innerHTML = html; window.scrollTo(0, 0);
  }
  function setNav(name) { $$('nav.bottom a').forEach(function (a) { a.classList.toggle('on', a.dataset.nav === name); }); }
  function route() {
    var h = location.hash.replace(/^#\/?/, '') || 'hjem', p = h.split('/');
    var map = { hjem: vHjem, rejse: vRejse, trin: vTrin, akkorder: vAkkorder, akkord: vAkkord, oev: vOev, lyt: vLyt, krop: vKrop, mig: vMig, om: vOm, session: vSession };
    (map[p[0]] || vHjem)(p.slice(1).map(decodeURIComponent));
    setNav({ trin: 'rejse', akkord: 'akkorder', session: 'hjem', krop: 'hjem', mig: 'hjem', om: 'hjem' }[p[0]] || p[0]);
  }
  window.addEventListener('hashchange', route);

  /* ---------- Hjem ---------- */
  function vHjem() {
    var plan = dagensPlan(), st = streak(), uge = ugeDage(), spilletIdag = !!S.dage[today()];
    var hvile = iTraek() >= 6 && !spilletIdag;
    var ugeHtml = uge.map(function (d, i) { return '<div><i class="' + (S.dage[d] ? 'on' : '') + (d === today() ? ' today' : '') + '"></i>' + 'MTOTFLS'[i] + '</div>'; }).join('');
    var pct = Math.round(antalKlaret() / ALLE_TRIN.length * 100);
    render('Guitar fra bunden', '' +
      '<div class="card hero">' +
        '<small>DAGENS ØVELSE · ' + S.indst.laengde + ' MIN</small>' +
        '<h2 style="margin:.3rem 0 .2rem">' + (spilletIdag ? 'Godt gået i dag! 🎉' : esc(plan.segs[1].titel)) + '</h2>' +
        '<p class="muted mb0">' + (spilletIdag ? 'Du har spillet i dag. Vil du tage en runde mere, så er du velkommen.' : esc(plan.segs[2].titel)) + '</p>' +
        '<div class="row mt"><a class="btn white big grow" href="#session">' + (spilletIdag ? 'Spil igen' : 'Start dagens øvelse') + ' ▶</a></div>' +
        '<div class="grid3 mt"><div class="stat"><b>' + st + '</b><span>dages stribe</span></div><div class="stat"><b>' + ugeSpillet() + '/' + S.indst.ugemaal + '</b><span>dage denne uge</span></div><div class="stat"><b>' + Math.round(totalMin()) + '</b><span>minutter i alt</span></div></div>' +
        '<div class="week mt">' + ugeHtml + '</div>' +
      '</div>' +
      (hvile ? '<div class="card warn"><b>Hviledag?</b><p class="mb0">Du har spillet ' + iTraek() + ' dage i træk. Giv gerne fingrene en fridag i dag – en enkelt hviledag bryder ikke din stribe.</p></div>' : '') +
      '<div class="card"><div class="row"><div class="grow"><h3 class="mb0">Din rejse</h3><small>Niveau ' + plan.trin.niveau + ' · ' + esc(plan.trin.titel) + '</small></div><b>' + pct + '%</b></div>' +
        '<div class="progress mt"><i style="width:' + pct + '%"></i></div><a class="btn light block mt" href="#trin/' + plan.trin.id + '">Fortsæt hvor du slap</a></div>' +
      '<div class="grid2">' +
        '<a class="card" style="text-decoration:none;color:inherit;margin:0" href="#krop"><b>🧘 Krop & råd</b><br><small>Ømme fingre, holdning, pauser</small></a>' +
        '<a class="card" style="text-decoration:none;color:inherit;margin:0" href="#mig"><b>🏅 Mærker & indstillinger</b><br><small>' + Object.keys(S.badges).length + ' af ' + BADGES.length + ' mærker</small></a>' +
      '</div>' +
      '<div class="card soft mt"><small>Ømme fingerspidser de første uger er helt normalt. Skarp smerte, prikken eller hævede led er ikke – så hold pause.</small></div>');
  }

  /* ---------- Rejse ---------- */
  function vRejse() {
    var cur = aktueltTrin(), html = '';
    REJSE.forEach(function (lv) {
      var done = lv.trin.filter(trinKlaret).length;
      html += '<div class="card"><div class="row"><div class="grow"><small>NIVEAU ' + lv.niveau + '</small><h2 class="mb0">' + esc(lv.titel) + '</h2></div><span class="pill ' + (done === lv.trin.length ? 'done' : '') + '">' + done + '/' + lv.trin.length + '</span></div>' +
        '<p class="muted mt">' + esc(lv.intro) + '</p><ul class="list">' +
        lv.trin.map(function (t, i) {
          var k = trinKlaret(t), now = t === cur;
          return '<li onclick="location.hash=\'trin/' + t.id + '\'"><span class="ico ' + (k ? 'done' : '') + '">' + (k ? '✓' : (i + 1)) + '</span><div class="grow"><b>' + esc(t.titel) + '</b>' + (now ? ' <span class="pill">Næste</span>' : '') + '<br><small>' + kravTekst(t) + '</small></div><span class="chev">›</span></li>';
        }).join('') + '</ul></div>';
    });
    render('Din rejse', html);
  }
  function kravTekst(t) {
    if (t.type === 'laes' || t.type === 'stem') return 'Læs og prøv';
    if (t.krav && t.krav.skift) return 'Mål: ' + t.krav.skift + ' skift på et minut · bedste: ' + bestSkift(t.skift);
    if (t.type === 'akkord') return 'Øv på ' + t.krav.dage + ' forskellige dage · ' + (S.fokusDage[t.akkord] || []).length + ' indtil nu';
    return 'Øv på ' + t.krav.dage + ' forskellige dage · ' + (S.fokusDage['trin:' + t.id] || []).length + ' indtil nu';
  }
  function vTrin(p) {
    var t = ALLE_TRIN.filter(function (x) { return x.id === p[0]; })[0] || aktueltTrin(), k = trinKlaret(t), html = '';
    html += '<div class="card"><small>NIVEAU ' + t.niveau + '</small><h2>' + esc(t.titel) + '</h2><span class="pill ' + (k ? 'done' : '') + '">' + (k ? 'Klaret ✓' : kravTekst(t)) + '</span></div>';
    if (t.tekst) html += '<div class="card">' + t.tekst.map(function (x) { return '<p>' + x + '</p>'; }).join('') + '</div>';
    if (t.id === '0-dele') html += '<div class="card"><img class="diagram" src="img/guitar-dele.svg" alt="Guitarens dele"></div>';
    if (t.type === 'stem') html += '<a class="btn block big" href="#lyt/stem">Åbn stemmeapparatet</a>';
    if (t.type === 'akkord') html += '<a class="btn block big" href="#akkord/' + t.akkord + '">Åbn ' + esc(navn(t.akkord)) + '</a><p class="hint mt">Trinnet bliver klaret af sig selv, når du har øvet akkorden i dagens øvelse på ' + t.krav.dage + ' forskellige dage.</p>';
    if (t.type === 'skift') html += '<a class="btn block big" href="#oev/skift/' + t.skift.join('/') + '">Træn skiftet</a><p class="hint mt">Trinnet bliver klaret, når du når ' + t.krav.skift + ' skift på et minut.</p>';
    if (t.type === 'slag') html += '<a class="btn block big" href="#oev/slag/' + t.moenster + '/' + t.akkord + '">Øv mønsteret</a>';
    if (t.type === 'sang') { var sg = SANGE[t.sang]; html += '<a class="btn block big" href="#oev/sang/' + t.sang + '">Spil med på rækken</a>' + (sg.eksempler.length ? '<div class="card mt"><b>Kendt fra fx</b><ul>' + sg.eksempler.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul><small>Find sangen i din egen musiktjeneste og spil med. Akkorderne kan variere mellem versioner.</small></div>' : ''); }
    html += '<button class="btn ' + (k ? 'ghost' : 'light') + ' block mt" id="mark">' + (k ? 'Marker som ikke klaret' : 'Marker som klaret') + '</button>';
    render('Trin', html, true);
    $('#mark').onclick = function () { if (k) { delete S.trinKlaret[t.id]; } else { S.trinKlaret[t.id] = today(); } save(); tjekBadges(); vTrin([t.id]); };
  }

  /* ---------- Akkorder ---------- */
  function tile(a) { return '<button class="chordtile" onclick="location.hash=\'akkord/' + a.id + '\'"><img src="' + a.diagram + '" alt="' + esc(a.navn) + '" loading="lazy"><b>' + esc(a.navn) + '</b></button>'; }
  function vAkkorder() {
    function grp(g) { return A.filter(function (a) { return a.gruppe === g; }).map(tile).join(''); }
    render('Akkorder', '<h2>De fem første</h2><div class="chordgrid">' + grp('hoved') + '</div>' +
      '<h2 class="mt">Lette versioner</h2><p class="hint">Brug dem de første dage – så kan du spille med med det samme.</p><div class="chordgrid">' + grp('variant') + '</div>' +
      '<h2 class="mt">Næste skridt</h2><div class="chordgrid">' + grp('ekstra') + '</div>');
  }
  function photoSlot(id, el) {
    fetch('images/' + id + '/captions.json').then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (caps) {
      if (!caps || !caps.length) throw 0;
      caps = caps.map(function (c) { return typeof c === 'string' ? { tekst: c } : c; });   // streng eller {tekst, kredit}
      el.innerHTML = '<div class="photo-head"><b>Rigtige fotos</b><small>Tjekket mod diagrammet</small></div><div class="carousel"><div class="track">' + caps.map(function (c, i) { return '<figure><img src="images/' + id + '/' + (i + 1) + '.webp" alt="' + esc(c.tekst) + '"><figcaption>' + esc(c.tekst) + (c.kredit ? '<br><small style="color:#e2e8f0">Foto: ' + esc(c.kredit) + '</small>' : '') + '</figcaption></figure>'; }).join('') + '</div></div>' +
        (caps.length > 1 ? '<div class="dots">' + caps.map(function (_, i) { return '<i class="' + (i ? '' : 'on') + '"></i>'; }).join('') + '</div>' : '');
      el.insertAdjacentHTML('beforeend', '<div style="height:.75rem"></div>');
      var tr = $('.track', el); tr.addEventListener('scroll', function () { var i = Math.round(tr.scrollLeft / tr.clientWidth); $$('.dots i', el).forEach(function (d, j) { d.classList.toggle('on', i === j); }); });
    }).catch(function () {
      el.innerHTML = '';   // ingen verificerede fotos endnu – så vises kun gribebrættet/diagrammet
    });
  }
  function vAkkord(p) {
    var a = BY[p[0]] || BY.Em, lv = a.lettere_variant && BY[a.lettere_variant];
    var strings = a.strenge.map(function (s) {
      return '<li>' + s.streng + '. streng (' + (s.aaben_tone === 'B' ? 'H' : s.aaben_tone) + '): ' + (s.status === 'dæmpet' ? '<b>slå ikke</b>' : s.status === 'åben' ? 'åben' : '<b>' + s.baand + '. bånd</b> med ' + s.finger_navn + ' (' + s.finger + ')') + '</li>';
    }).join('');
    render(esc(a.navn), '' +
      '<div id="foto"></div>' +
      '<div class="card"><div class="seg full" id="visvalg"><button data-v="guitar">På guitaren</button><button data-v="diagram">Som diagram</button></div><div id="vis" class="mt"></div>' +
        '<div class="grid2 mt"><button class="btn" id="play">▶ Hør akkorden</button><button class="btn light" id="arp">♪ Streng for streng</button></div>' +
        '<p class="hint center mt mb0">Slå: ' + esc(a.anslag.tekst.toLowerCase()) + '</p></div>' +
      '<div class="card"><h3>Sådan sætter du fingrene</h3><ol class="steps">' + a.trin.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>' +
        '<details class="mt"><summary>Streng for streng</summary><ul>' + strings + '</ul></details></div>' +
      '<div class="card"><h3>🎤 Tjek din akkord</h3><p class="hint">Sæt fingrene, tryk på knappen og slå akkorden én gang. Appen lytter i ca. et sekund. Lyden bliver i telefonen og gemmes ikke.</p><div id="tjek"></div><button class="btn block big" id="lyt">Lyt efter ' + esc(kort(a.id)) + '</button></div>' +
      '<div class="card"><h3>Typiske fejl</h3>' + a.typiske_fejl.map(function (f) { return '<div class="mistake"><b>' + esc(f.fejl) + '</b>' + esc(f.ret) + '</div>'; }).join('') + '</div>' +
      '<div class="card soft"><b>💡 Tip</b><p class="mb0">' + esc(a.tip) + '</p></div>' +
      (lv ? '<div class="card"><b>For svær lige nu?</b><p>Prøv den lette version først.</p><a class="btn light block" href="#akkord/' + lv.id + '">' + esc(lv.navn) + '</a></div>' : ''), true);
    photoSlot(a.id, $('#foto'));
    visAkkord(a, $('#vis'), $('#visvalg'));
    $('#play').onclick = function () { Audio2.playChord(a.greb, 'ned'); };
    $('#arp').onclick = function () { Audio2.playArpeggio(a.greb); };
    $('#lyt').onclick = function () { lytTjek(a, $('#tjek'), $('#lyt')); };
  }

  /* Akkorden vist som realistisk gribebræt (standard) eller som klassisk diagram. Valget huskes. */
  function visAkkord(a, box, valg) {
    function tegn() {
      var v = S.indst.visning || 'guitar';
      box.innerHTML = v === 'guitar'
        ? Gribebraet.render(a) + '<p class="hint center mt mb0">Sådan ser du det, når du kigger ned på din guitar: hovedet til venstre, tykkeste streng øverst. Tallet er fingeren.</p>'
        : '<img class="diagram" src="' + a.diagram + '" alt="Diagram ' + esc(a.navn) + '"><p class="hint center mt mb0">Diagram: guitaren på højkant, tykkeste streng til venstre.</p>';
      if (valg) $$('button', valg).forEach(function (b) { b.classList.toggle('on', b.dataset.v === v); });
    }
    if (valg) $$('button', valg).forEach(function (b) { b.onclick = function () { S.indst.visning = b.dataset.v; save(); tegn(); }; });
    tegn();
  }
  function lytTjek(a, box, btn) {
    btn.disabled = true;
    box.innerHTML = '<div class="listen-orb live">🎤</div><p class="center" id="lst">Et øjeblik …</p>';
    var stateTxt = { kalibrerer: 'Vær stille et øjeblik …', venter: '<b>Slå akkorden nu</b>', lytter: 'Lytter …' };
    Audio2.listenChord(function (s) { var e = $('#lst'); if (e) e.innerHTML = stateTxt[s]; }).then(function (r) {
      var res = Lyd.checkChord(r.chroma, a, TEMPLATES), sc = Lyd.stringCheck(r.avg, r.sampleRate, r.fftSize, a.greb);
      var svage = sc.filter(function (x) { return x.svag; }).map(function (x) { return x.streng; });
      var ok = res.ok && svage.length === 0, html;
      if (ok) html = '<div class="result ok"><div style="font-size:2rem">✓</div><h2>Det lyder som ' + esc(navn(a.id)) + '</h2><small>Flot! Prøv at slippe og sætte fingrene igen et par gange.</small></div>';
      else {
        var hint = [];
        if (svage.length) hint.push('Streng ' + svage.join(' og ') + ' klinger svagt eller slet ikke. Tjek at fingrene står på spidsen og ikke rører den.');
        res.missing.forEach(function (m) { hint.push('Tonen ' + m.tone + ' mangler (streng ' + m.strenge.join('/') + ').'); });
        var id = res.identified.best; if (id.familie !== (a.familie || a.id)) hint.push('Det lød mere som ' + navn(id.id) + '.');
        if (!hint.length) hint.push('Ikke helt ren. Er guitaren stemt? Prøv igen tættere på telefonen.');
        html = '<div class="result bad"><h2>Ikke helt endnu</h2><p class="mb0">' + hint.map(esc).join('<br>') + '</p></div>';
      }
      box.innerHTML = html; btn.disabled = false; btn.textContent = 'Prøv igen';
      logFokus(a.id); save();
    }).catch(function (e) {
      box.innerHTML = '<div class="result info">' + (e && e.message === 'timeout' ? 'Jeg hørte ikke noget anslag. Prøv igen og slå lidt kraftigere.' : 'Mikrofonen kunne ikke startes. Giv appen lov til at bruge mikrofonen i browserens indstillinger.') + '</div>';
      btn.disabled = false;
    });
    onLeave(function () { if (Audio2.listenChord.cancel) Audio2.listenChord.cancel(); Audio2.stopMic(); });
  }
  var TEMPLATES = Lyd.buildTemplates(A.map(function (a) { return { id: a.id, navn: a.navn, greb: a.greb, familie: a.familie }; }));

  /* ---------- Øv: skift-træner, slagmønstre, sange ---------- */
  function vOev(p) {
    var mode = p[0] || 'skift';
    var tabs = '<div class="tabs"><button data-m="skift">Skift</button><button data-m="slag">Slag</button><button data-m="sang">Sange</button></div>';
    if (mode === 'skift') return skiftTraener(tabs, p[1] && p[2] ? [p[1], p[2]] : null);
    if (mode === 'slag') return slagView(tabs, p[1] || 'fire', p[2] || 'G');
    if (mode === 'sang') return sangView(tabs, p[1]);
  }
  function wireTabs(mode) { $$('.tabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.m === mode); b.onclick = function () { location.hash = 'oev/' + b.dataset.m; }; }); }
  function chordOptions(sel) { return A.map(function (a) { return '<option value="' + a.id + '"' + (a.id === sel ? ' selected' : '') + '>' + esc(a.navn) + '</option>'; }).join(''); }

  function skiftTraener(tabs, par, embed) {
    par = par || (dagensPlan().par) || ['Em', 'Am'];
    var html = (embed ? '' : tabs) + '<div class="card"><h3>Et-minut-skift</h3><p class="hint">Skift frem og tilbage i ét minut. Slå én gang på hver akkord og tryk på den store knap for hvert rent skift.</p>' +
      '<div class="row"><select id="a1" class="grow">' + chordOptions(par[0]) + '</select><span>↔</span><select id="a2" class="grow">' + chordOptions(par[1]) + '</select></div>' +
      '<div class="grid2 mt"><img class="diagram" id="d1" alt=""><img class="diagram" id="d2" alt=""></div></div>' +
      '<div class="card center"><div class="timer" id="tid">1:00</div><div class="counter" id="cnt">0</div><small>skift · bedste: <b id="best">0</b></small>' +
      '<button class="btn block big mt" id="tael" disabled>+1 skift</button><div class="row mt"><button class="btn light grow" id="start">Start minuttet</button></div>' +
      '<div class="field mt"><label for="bpm">Metronom <b id="bpmv">60</b> slag/min</label><label><input type="checkbox" id="met"> til</label></div><input type="range" id="bpm" min="40" max="120" step="2" value="60"></div>';
    if (embed) return html;
    render('Øv', html); wireTabs('skift'); wireSkift();
  }
  function wireSkift(onDone) {
    var met = null, timer = null, n = 0, left = 60;
    function cur() { return [$('#a1').value, $('#a2').value]; }
    function upd() { var p = cur(); $('#d1').src = BY[p[0]].diagram; $('#d2').src = BY[p[1]].diagram; $('#best').textContent = bestSkift(p); }
    $('#a1').onchange = $('#a2').onchange = upd; upd();
    $('#bpm').oninput = function () { $('#bpmv').textContent = this.value; if (met) met.setBpm(+this.value); };
    $('#met').onchange = function () { if (this.checked) { met = new Audio2.Metronome({ bpm: +$('#bpm').value, beats: 4 }); met.start(); } else if (met) { met.stop(); met = null; } };
    $('#tael').onclick = function () { n++; $('#cnt').textContent = n; };
    $('#start').onclick = function () {
      if (timer) return; n = 0; left = 60; $('#cnt').textContent = 0; $('#tael').disabled = false; $('#start').disabled = true; Audio2.getCtx();
      timer = setInterval(function () {
        left--; $('#tid').textContent = '0:' + String(left).padStart(2, '0');
        if (left <= 0) {
          clearInterval(timer); timer = null; $('#tael').disabled = true; $('#start').disabled = false; $('#start').textContent = 'Igen';
          var p = cur(), k = pairKey(p), before = bestSkift(p);
          (S.skift[k] = S.skift[k] || []).push({ dato: today(), n: n }); logMinutter(1); save(); tjekBadges(); upd();
          Audio2.click(Audio2.getCtx().currentTime, true);
          toast(n > before ? '🎉 Ny rekord: ' + n + ' skift!' : n + ' skift – godt arbejde.');
          if (onDone) onDone(n);
        }
      }, 1000);
    };
    onLeave(function () { if (met) met.stop(); clearInterval(timer); });
  }

  function slagHtml(mo) { return '<div class="pattern" id="pat">' + mo.slag.map(function (s, i) { return '<div><div class="arrow">' + (s === 'N' ? '↓' : s === 'O' ? '↑' : '') + '</div><div class="cnt">' + mo.taelling[i] + '</div></div>'; }).join('') + '</div>'; }
  function slagView(tabs, mid, akk) {
    var mo = SLAGMOENSTRE[mid] || SLAGMOENSTRE.fire;
    var html = tabs + '<div class="seg" id="mvalg">' + Object.keys(SLAGMOENSTRE).map(function (k) { return '<button data-k="' + k + '" class="' + (k === mid ? 'on' : '') + '">' + SLAGMOENSTRE[k].navn + '</button>'; }).join('') + '</div>' +
      '<div class="card mt"><h3>' + esc(mo.navn) + '</h3><p class="hint">' + esc(mo.tip) + '</p>' + slagHtml(mo) + '<p class="hint mt mb0">↓ = nedslag (dyb streng først) · ↑ = opslag (kun de tynde strenge, let)</p></div>' +
      '<div class="card"><div class="row"><label class="grow">Akkord <select id="sakk">' + chordOptions(akk) + '</select></label></div>' +
      '<div class="field"><span>Tempo <b id="bpmv">' + mo.tempo + '</b></span></div><input type="range" id="bpm" min="40" max="110" step="2" value="' + mo.tempo + '">' +
      '<button class="btn block big mt" id="go">▶ Spil med</button></div>';
    render('Øv', html); wireTabs('slag');
    $$('#mvalg button').forEach(function (b) { b.onclick = function () { location.hash = 'oev/slag/' + b.dataset.k + '/' + $('#sakk').value; }; });
    wireSlag(mo, function () { return BY[$('#sakk').value].greb; }, function () { logFokus('trin:' + (ALLE_TRIN.filter(function (t) { return t.moenster === mid; })[0] || {}).id); save(); });
  }
  function wireSlag(mo, grebFn, onStart) {
    var met = null;
    $('#bpm').oninput = function () { $('#bpmv').textContent = this.value; if (met) met.setBpm(+this.value); };
    $('#go').onclick = function () {
      if (met) { met.stop(); met = null; this.textContent = '▶ Spil med'; $$('#pat > div').forEach(function (d) { d.classList.remove('now'); }); return; }
      if (onStart) onStart();
      met = new Audio2.Metronome({ bpm: +$('#bpm').value, beats: 4,
        onTick: function (i8, t) { var s = mo.slag[i8 % 8]; if (s) Audio2.playChord(grebFn(), s === 'N' ? 'ned' : 'op', t, s === 'N' ? 0.9 : 0.55, s === 'O' ? 4 : null); },
        onUi: function (i8) { $$('#pat > div').forEach(function (d, j) { d.classList.toggle('now', j === i8 % 8); }); } });
      met.start(); this.textContent = '■ Stop';
    };
    onLeave(function () { if (met) met.stop(); });
  }

  function sangView(tabs, sid) {
    if (!sid) {
      render('Øv', tabs + '<p class="hint">Akkordrækker fra kendte sange. Appen spiller med, og den aktuelle akkord lyser op. Find selve sangen i din egen musiktjeneste.</p>' +
        '<div class="card"><ul class="list">' + Object.keys(SANGE).map(function (k) { var s = SANGE[k]; return '<li onclick="location.hash=\'oev/sang/' + k + '\'"><span class="ico">♪</span><div class="grow"><b>' + esc(s.navn) + '</b><br><small>' + (s.eksempler[0] ? esc(s.eksempler[0]) : 'Øvelse') + '</small></div><span class="chev">›</span></li>'; }).join('') + '</ul></div>');
      return wireTabs('sang');
    }
    var sg = SANGE[sid], mo = SLAGMOENSTRE.fire;
    render(esc(sg.navn), '<div class="card"><div class="prog" id="prog">' + sg.raekke.map(function (c) { return '<span>' + kort(c) + '</span>'; }).join('') + '</div><p class="hint mt">' + esc(sg.tip) + '</p>' +
      (sg.eksempler.length ? '<small>Kendt fra fx: ' + sg.eksempler.map(esc).join(' · ') + '. Akkorderne kan variere mellem versioner.</small>' : '') + '</div>' +
      '<div class="card center"><img class="diagram" id="cd" style="max-width:200px" alt=""><div id="pat" style="display:none"></div>' +
      '<div class="field"><span>Tempo <b id="bpmv">' + sg.tempo + '</b></span><label><input type="checkbox" id="lyd" checked> guitarlyd</label></div><input type="range" id="bpm" min="40" max="110" step="2" value="' + sg.tempo + '">' +
      '<button class="btn block big mt" id="go">▶ Spil med</button></div>', true);
    var met = null, idx = 0;
    function show(i) { $$('#prog span').forEach(function (s, j) { s.classList.toggle('now', j === i); }); $('#cd').src = BY[sg.raekke[i]].diagram; }
    show(0);
    $('#bpm').oninput = function () { $('#bpmv').textContent = this.value; if (met) met.setBpm(+this.value); };
    $('#go').onclick = function () {
      if (met) { met.stop(); met = null; this.textContent = '▶ Spil med'; return; }
      var t = ALLE_TRIN.filter(function (x) { return x.sang === sid; })[0]; if (t) { logFokus('trin:' + t.id); save(); tjekBadges(); }
      met = new Audio2.Metronome({ bpm: +$('#bpm').value, beats: 4,
        onTick: function (i8, time) { if (i8 % 2) return; var beat = i8 / 2, ci = Math.floor(beat / sg.slagPrAkkord) % sg.raekke.length; if ($('#lyd') && $('#lyd').checked) Audio2.playChord(BY[sg.raekke[ci]].greb, 'ned', time, 0.8); },
        onUi: function (i8) { if (i8 % 2) return; var ci = Math.floor(i8 / 2 / sg.slagPrAkkord) % sg.raekke.length; show(ci); } });
      met.start(); this.textContent = '■ Stop';
    };
    onLeave(function () { if (met) met.stop(); });
  }

  /* ---------- Lyt: hvad spiller jeg? + stemmeapparat ---------- */
  function vLyt(p) {
    var mode = p[0] || 'hvad';
    var tabs = '<div class="tabs"><button data-m="hvad">Hvad spiller jeg?</button><button data-m="stem">Stem guitaren</button></div>';
    if (mode === 'stem') {
      render('Lyt', tabs + '<div class="card tuner"><p class="hint">Slå én åben streng ad gangen. Viseren skal stå i midten.</p><div class="note" id="tn">–</div><div id="tc" class="muted">Tryk på start</div>' +
        '<div class="meter"><div class="needle" id="nd"></div></div><div class="row"><small class="grow" style="text-align:left">for lav – stram</small><small class="grow" style="text-align:right">for høj – løsn</small></div>' +
        '<div class="strings6 mt">' + Lyd.GUITAR_STRINGS.map(function (s) { return '<button data-m="' + s.midi + '" data-s="' + s.streng + '">' + s.navn + '<small>' + s.streng + '. str</small></button>'; }).join('') + '</div>' +
        '<p class="hint mt">Tryk på en streng for at høre referencetonen.</p><button class="btn block big" id="ts">🎤 Start stemmeapparat</button></div>' +
        '<div class="card soft"><small>Stem altid <b>op</b> til tonen: Er strengen for høj, så løsn den lidt under tonen og stram langsomt op igen.</small></div>');
      wireTabs('stem');
      $$('.strings6 button').forEach(function (b) { b.onclick = function () { Audio2.playNote(+b.dataset.m); }; });
      var stop = null;
      $('#ts').onclick = function () {
        if (stop) { stop(); stop = null; Audio2.stopMic(); this.textContent = '🎤 Start stemmeapparat'; return; }
        this.textContent = '■ Stop';
        stop = Audio2.startTuner(function (r) {
          if (!r) return; if (r.error) { $('#tc').textContent = 'Mikrofonen kunne ikke startes.'; return; }
          var c = Math.max(-50, Math.min(50, r.cents));
          $('#tn').textContent = r.streng.navn; $('#nd').style.left = (50 + c) + '%';
          $('#tc').innerHTML = r.streng.streng + '. streng · ' + (Math.abs(r.cents) <= 5 ? '<b style="color:var(--ok)">Stemt ✓</b>' : (r.cents < 0 ? 'for lav – stram lidt' : 'for høj – løsn lidt') + ' (' + (r.cents > 0 ? '+' : '') + r.cents + ' cent)');
          $$('.strings6 button').forEach(function (b) { b.classList.toggle('on', +b.dataset.s === r.streng.streng); });
        });
      };
      onLeave(function () { if (stop) stop(); Audio2.stopMic(); });
      return;
    }
    render('Lyt', tabs + '<div class="card center"><p class="hint">Slå en akkord – appen gætter, hvilken det er. Det virker bedst med en stemt guitar i et stille rum.</p><div id="res"><div class="listen-orb">🎤</div></div><button class="btn block big" id="go">Lyt</button></div>' +
      '<div class="card soft"><small><b>Godt at vide:</b> Nogle akkorder deler toner og ligner hinanden meget for en mikrofon, fx C og A-mol eller G og E-mol. Er appen i tvivl, siger den det. Lyden behandles kun på telefonen og gemmes ikke.</small></div>');
    wireTabs('hvad');
    $('#go').onclick = function () {
      var btn = this; btn.disabled = true;
      $('#res').innerHTML = '<div class="listen-orb live">🎤</div><p id="lst">Et øjeblik …</p>';
      var stTxt = { kalibrerer: 'Vær stille et øjeblik …', venter: '<b>Slå en akkord nu</b>', lytter: 'Lytter …' };
      Audio2.listenChord(function (s) { var e = $('#lst'); if (e) e.innerHTML = stTxt[s]; }).then(function (r) {
        var id = Lyd.identify(r.chroma, TEMPLATES), b = BY[id.best.id];
        var html;
        if (id.level === 'usikker') html = '<div class="result info"><h2>Prøv igen</h2><p class="mb0">Jeg kunne ikke høre en tydelig akkord. Slå alle strengene igen, lidt tættere på telefonen.</p></div>';
        else html = '<div class="result ' + (id.level === 'lav' ? 'info' : 'ok') + '"><small>' + (id.level === 'høj' ? 'Ret sikker' : id.level === 'middel' ? 'Nogenlunde sikker' : 'Usikker') + '</small><h2>Det lyder som ' + esc(b.navn) + '</h2>' +
          (id.level !== 'høj' && id.second ? '<p class="mb0">… eller måske ' + esc(navn(id.second.id)) + '</p>' : '') + '</div><img class="diagram mt" style="max-width:180px" src="' + b.diagram + '" alt="">';
        $('#res').innerHTML = html; btn.disabled = false; btn.textContent = 'Lyt igen';
      }).catch(function (e) { $('#res').innerHTML = '<div class="result info">' + (e && e.message === 'timeout' ? 'Jeg hørte ikke noget anslag.' : 'Mikrofonen kunne ikke startes.') + '</div>'; btn.disabled = false; });
    };
    onLeave(function () { if (Audio2.listenChord.cancel) Audio2.listenChord.cancel(); Audio2.stopMic(); });
  }

  /* ---------- Dagens øvelse: guidet session ---------- */
  function vSession() {
    var plan = dagensPlan(), segs = plan.segs, i = 0, left = 0, timer = null, running = false, brugt = 0;
    render('Dagens øvelse', '<div class="seglist" id="sl">' + segs.map(function (s) { return '<i style="flex:' + s.min + '"></i>'; }).join('') + '</div><div id="seg"></div>', true);
    function fmt(s) { return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0'); }
    function show() {
      var s = segs[i]; left = Math.round(s.min * 60);
      $$('#sl i').forEach(function (e, j) { e.className = j < i ? 'done' : j === i ? 'now' : ''; });
      var body = '';
      if (s.id === 'opvarm') body = '<ol class="steps">' + OPVARMNING.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol><div class="card soft mt mb0"><small>Ømme fingerspidser er normalt i starten. Skarp smerte, prikken eller hævede led er det ikke – så stop for i dag.</small></div>';
      if (s.id === 'akkord') body = '<div id="svis"></div><p class="mt"><b>Sæt – slå – slip:</b> Sæt fingrene, slå akkorden og lyt. Løft fingrene en centimeter og slap af. Gentag roligt.</p><div class="row"><button class="btn light grow" id="hoer">▶ Hør</button><button class="btn grow" id="tjk">🎤 Tjek</button></div><div id="tjekbox"></div>';
      if (s.id === 'skift' && s.par) body = skiftTraener('', s.par, true);
      if (s.id === 'skift' && !s.par) body = '<img class="diagram" style="max-width:200px" src="' + BY[s.akkord].diagram + '" alt=""><p class="mt">Sæt fingrene på akkorden, slå én gang, slip helt og sæt dem igen. Tæl hvor mange gange du når på et minut. Det er dit første "skift".</p>';
      if (s.id === 'afslut' && s.afslut.type === 'slag') { var mo = SLAGMOENSTRE[s.afslut.moenster]; body = '<p>' + esc(mo.tip) + '</p>' + slagHtml(mo) + '<input type="range" id="bpm" min="40" max="110" step="2" value="' + mo.tempo + '" style="display:none"><span id="bpmv" style="display:none"></span><button class="btn block mt" id="go">▶ Spil med på ' + esc(kort(s.akkord)) + '</button>'; }
      if (s.id === 'afslut' && s.afslut.type === 'sang') body = '<p>Slut af med akkordrækken <b>' + esc(SANGE[s.afslut.sang].navn) + '</b>.</p><a class="btn block" href="#oev/sang/' + s.afslut.sang + '">Åbn rækken</a>';
      $('#seg').innerHTML = '<div class="card"><small>DEL ' + (i + 1) + ' AF ' + segs.length + '</small><h2>' + esc(s.titel) + '</h2><div class="timer" id="t">' + fmt(left) + '</div>' +
        '<div class="row mt"><button class="btn grow big" id="pp">' + (running ? '❚❚ Pause' : '▶ Start') + '</button><button class="btn light" id="nx">' + (i < segs.length - 1 ? 'Næste ›' : 'Afslut') + '</button></div></div><div class="card">' + body + '</div>';
      $('#pp').onclick = function () { running = !running; this.textContent = running ? '❚❚ Pause' : '▶ Start'; Audio2.getCtx(); };
      $('#nx').onclick = next;
      if ($('#svis')) visAkkord(BY[s.akkord], $('#svis'));
      if ($('#hoer')) { $('#hoer').onclick = function () { Audio2.playChord(BY[s.akkord].greb, 'ned'); }; $('#tjk').onclick = function () { lytTjek(BY[s.akkord], $('#tjekbox'), $('#tjk')); }; }
      if (s.id === 'skift' && s.par) wireSkift();
      if ($('#go') && s.afslut) { var mo2 = SLAGMOENSTRE[s.afslut.moenster]; wireSlag(mo2, function () { return BY[s.akkord].greb; }); }
    }
    function next() {
      if (i < segs.length - 1) { i++; cleanupSeg(); show(); } else finish();
    }
    function cleanupSeg() { var keep = cleanup.indexOf(stopTimer); cleanup.forEach(function (f, j) { if (j !== keep) try { f(); } catch (e) {} }); cleanup = [stopTimer]; }
    function stopTimer() { clearInterval(timer); }
    function finish() {
      stopTimer(); cleanupSeg();
      var min = Math.max(1, Math.round(brugt / 60));
      logMinutter(min); logFokus(plan.akkord); S.sessioner.push({ dato: today(), min: min, fokus: plan.akkord }); save(); tjekBadges();
      $('#sl').remove();
      $('#seg').innerHTML = '<div class="card hero center"><div style="font-size:3rem">🎉</div><h2>Dagens øvelse er klaret</h2><p>' + min + ' minutter · stribe: ' + streak() + ' dage · ' + ugeSpillet() + '/' + S.indst.ugemaal + ' dage denne uge</p><a class="btn white block" href="#hjem">Tilbage til forsiden</a></div>' +
        '<div class="card soft"><small>Lad fingrene hvile nu. Ømme fingerspidser er normalt – det bliver bedre efter et par uger, når huden bliver hårdere.</small></div>';
    }
    timer = setInterval(function () {
      if (!running) return; left--; brugt++;
      var t = $('#t'); if (t) t.textContent = fmt(Math.max(0, left));
      if (left === 0) { Audio2.click(Audio2.getCtx().currentTime, true); Audio2.click(Audio2.getCtx().currentTime + 0.15, true); if (i < segs.length - 1) toast('Tid til næste del: <b>' + esc(segs[i + 1].titel) + '</b>'); }
    }, 1000);
    onLeave(stopTimer);
    show();
  }

  /* ---------- Krop & råd ---------- */
  function vKrop() {
    render('Krop & råd', '<div class="card soft"><p class="mb0">Skrevet med en fysioterapeuts øjne: små daglige doser, afslappet krop og respekt for fingrene.</p></div>' +
      KROP_RAAD.map(function (r) { return '<div class="card"><h3>' + esc(r.titel) + '</h3><p class="mb0">' + esc(r.tekst) + '</p></div>'; }).join('') +
      '<div class="card"><h3>Opvarmning (1–2 min)</h3><ol class="steps">' + OPVARMNING.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol></div>', true);
  }

  /* ---------- Mig: mærker, indstillinger, privatliv ---------- */
  function vMig() {
    tjekBadges();
    render('Mærker & indstillinger', '<h2>Mærker</h2><div class="badges">' + BADGES.map(function (b) { return '<div class="badge ' + (S.badges[b.id] ? 'on' : '') + '"><span class="em">' + b.em + '</span>' + b.navn + '</div>'; }).join('') + '</div>' +
      '<div class="card mt"><h3>Dagens øvelse</h3><div class="field"><span>Længde</span><div class="seg" id="len">' + [5, 10, 15].map(function (m) { return '<button data-v="' + m + '" class="' + (S.indst.laengde === m ? 'on' : '') + '">' + m + ' min</button>'; }).join('') + '</div></div>' +
      '<div class="field"><span>Ugemål</span><div class="seg" id="goal">' + [3, 4, 5, 6].map(function (m) { return '<button data-v="' + m + '" class="' + (S.indst.ugemaal === m ? 'on' : '') + '">' + m + ' dage</button>'; }).join('') + '</div></div></div>' +
      '<div class="card"><h3>Dine skift-rekorder</h3>' + (Object.keys(S.skift).length ? '<ul>' + Object.keys(S.skift).map(function (k) { return '<li>' + k.replace('|', ' ↔ ') + ': <b>' + bestSkift(k.split('|')) + '</b></li>'; }).join('') + '</ul>' : '<small>Ingen endnu – prøv et-minut-skift under Øv.</small>') + '</div>' +
      '<div class="card"><h3>Privatliv</h3><p>Alt gemmes kun på denne telefon. Der er ingen konto, og intet sendes nogen steder hen. Mikrofonen bruges kun, mens du trykker "Lyt" eller bruger stemmeapparatet, og lyden gemmes ikke.</p><button class="btn ghost" id="nulstil">Slet mine data</button></div>' +
      '<a class="btn light block" href="#om">Om appen og fotokreditering</a>', true);
    $$('#len button').forEach(function (b) { b.onclick = function () { S.indst.laengde = +b.dataset.v; save(); vMig(); }; });
    $$('#goal button').forEach(function (b) { b.onclick = function () { S.indst.ugemaal = +b.dataset.v; save(); vMig(); }; });
    $('#nulstil').onclick = function () { if (confirm('Slet alle dine fremskridt på denne telefon?')) { localStorage.removeItem(KEY); S = load(); vMig(); } };
  }


  /* ---------- Om appen: privatliv og fotokreditering (ren tekst, ingen eksterne links) ---------- */
  function vOm() {
    render('Om appen', '<div class="card"><h3>Guitar fra bunden</h3><p>Prototype, version 0.2. Lavet som idé til Simon Bjerg Lauridsen. Ikke offentliggjort.</p>' +
      '<p class="mb0">Akkordbillederne "På guitaren" er tegnet direkte ud fra akkordernes greb og er derfor altid korrekte. Rigtige fotos vises kun, når de er tjekket finger for finger mod diagrammet.</p></div>' +
      '<div class="card"><h3>Privatliv</h3><p class="mb0">Alt gemmes kun på denne telefon. Ingen konto, ingen server. Mikrofonen bruges kun, mens du lytter eller stemmer, og lyden gemmes ikke.</p></div>' +
      '<div class="card"><h3>Fotokreditering</h3><div id="kred"><small>Henter …</small></div></div>', true);
    fetch('images/kilder.json').then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (k) {
      $('#kred').innerHTML = k.length ? k.map(function (x) { return '<p><b>' + esc(x.akkord) + '</b>: "' + esc(x.titel) + '" af ' + esc(x.forfatter) + ', ' + esc(x.licens) + '. Kilde: ' + esc(x.kilde) + (x.aendringer ? '. Ændringer: ' + esc(x.aendringer) : '') + '.</p>'; }).join('') : '<small>Ingen fotos fra andre endnu.</small>';
    }).catch(function () { $('#kred').innerHTML = '<small>Ingen fotos fra andre endnu.</small>'; });
  }
  /* Demo-data til skærmbilleder: ?demo=1 */
  if (/[?&]demo=1/.test(location.search)) {
    S = load(); S.dage = {}; [-9, -8, -6, -5, -4, -3, -2, -1].forEach(function (d) { S.dage[today(d)] = 10; });
    S.fokusDage = { Em7: [today(-9)], Em: [today(-8), today(-6)], Am: [today(-5), today(-4)], C: [today(-2)] };
    ['0-dele', '0-hold', '0-stem', '0-fingre', '3-metode'].forEach(function (id) { S.trinKlaret[id] = today(-9); });
    S.skift = { 'Em|Am': [{ dato: today(-4), n: 18 }, { dato: today(-3), n: 26 }, { dato: today(-2), n: 32 }] };
    S.badges = {}; save();
  }
  route(); tjekBadges();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js');
})();
