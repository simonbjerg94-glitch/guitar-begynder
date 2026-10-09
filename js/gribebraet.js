/* Realistisk gribebræt tegnet i kode (SVG). Spillerens udsyn: hovedet/sadlen til venstre, 6. streng (tykkeste) øverst.
   Fingrene tegnes direkte ud fra grebet i akkorder.json – derfor altid korrekt. Virker offline og i Node (til test). */
(function (root) {
  'use strict';
  var W = 560, H = 380, NUT = 80, BOARD_T = 48, BOARD_B = 320, FRETS = 4, SCALE = 2240;
  function fretX(n) { return NUT + SCALE * (1 - Math.pow(2, -n / 12)); }              // ægte båndafstande
  // Strengene spreder sig en anelse væk fra sadlen, som på en rigtig hals
  function stringY(s, x) { var t = (x - NUT) / (fretX(FRETS) - NUT), spread = 41 + 3 * t, mid = (BOARD_T + BOARD_B) / 2; return mid - (s - 3.5) * spread; }
  var GAUGE = { 6: 4.4, 5: 3.7, 4: 3.0, 3: 2.4, 2: 1.7, 1: 1.4 };
  var FNAVN = { 1: 'pegefinger', 2: 'langfinger', 3: 'ringfinger', 4: 'lillefinger' };
  var LABEL = { 6: 'E', 5: 'A', 4: 'D', 3: 'G', 2: 'H', 1: 'E' };

  /* Returnerer geometri for hver trykket streng – bruges både til tegning og til test. */
  function layout(greb) {
    var out = [];
    for (var i = 0; i < 6; i++) {
      var ch = greb.charAt(i), s = 6 - i;
      if (ch === 'x' || ch === '0') continue;
      var f = parseInt(ch, 10), x0 = fretX(f - 1), x1 = fretX(f);
      var x = x1 - (x1 - x0) * 0.3;                                      // lige bag båndtråden
      out.push({ streng: s, baand: f, x: x, y: stringY(s, x), fretLo: x0, fretHi: x1 });
    }
    return out;
  }

  function render(akkord, opts) {
    opts = opts || {};
    var greb = akkord.greb, uid = 'g' + akkord.id.replace(/[^a-z0-9]/gi, '');
    var fingers = {}; (akkord.strenge || []).forEach(function (s) { if (s.finger) fingers[s.streng] = s.finger; });
    var p = [];
    p.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" class="fretboard" role="img" aria-label="' + (akkord.navn || akkord.id) + ' vist på et gribebræt">');
    p.push('<defs>' +
      '<linearGradient id="' + uid + 'bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eceae5"/><stop offset="1" stop-color="#d9d6cf"/></linearGradient>' +
      '<linearGradient id="' + uid + 'wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1a12"/><stop offset=".12" stop-color="#4a2e1f"/><stop offset=".5" stop-color="#3b2418"/><stop offset=".88" stop-color="#4d3021"/><stop offset="1" stop-color="#24160f"/></linearGradient>' +
      '<filter id="' + uid + 'grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.006 0.22" numOctaves="3" seed="7" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0.10  0 0 0 0 0.06  0 0 0 0 0.03  0 0 0 0.55 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>' +
      '<linearGradient id="' + uid + 'head" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1c120c"/><stop offset="1" stop-color="#3a2519"/></linearGradient>' +
      '<linearGradient id="' + uid + 'bone" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d8d2c2"/><stop offset=".45" stop-color="#fbf8ef"/><stop offset="1" stop-color="#cfc7b4"/></linearGradient>' +
      '<linearGradient id="' + uid + 'fret" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6b6f75"/><stop offset=".35" stop-color="#f4f6f8"/><stop offset=".6" stop-color="#b9bec4"/><stop offset="1" stop-color="#5d6167"/></linearGradient>' +
      '<radialGradient id="' + uid + 'pearl" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#e9e4da"/><stop offset="1" stop-color="#bdb5a5"/></radialGradient>' +
      '<linearGradient id="' + uid + 'wound" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a6a3a"/><stop offset=".4" stop-color="#f0d9a8"/><stop offset=".7" stop-color="#b8925a"/><stop offset="1" stop-color="#6b4f28"/></linearGradient>' +
      '<pattern id="' + uid + 'wind" width="2.2" height="6" patternUnits="userSpaceOnUse" patternTransform="skewX(-35)"><rect width="2.2" height="6" fill="url(#' + uid + 'wound)"/><rect width=".7" height="6" fill="#5a4020" opacity=".55"/></pattern>' +
      '<linearGradient id="' + uid + 'plain" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7d838a"/><stop offset=".45" stop-color="#ffffff"/><stop offset="1" stop-color="#6f757c"/></linearGradient>' +
      '<radialGradient id="' + uid + 'skin" cx=".42" cy=".38" r=".75"><stop offset="0" stop-color="#f6d2bb"/><stop offset=".55" stop-color="#e7b496"/><stop offset="1" stop-color="#c98d6e"/></radialGradient>' +
      '<linearGradient id="' + uid + 'skinStem" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c98d6e"/><stop offset=".5" stop-color="#ebbc9f"/><stop offset="1" stop-color="#c58a6b"/></linearGradient>' +
      '<filter id="' + uid + 'sh" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="SourceAlpha" stdDeviation="3"/><feOffset dx="2" dy="4"/><feComponentTransfer><feFuncA type="linear" slope=".45"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '<filter id="' + uid + 'ssh"><feGaussianBlur stdDeviation="1.2"/></filter>' +
      '</defs>');
    p.push('<rect width="' + W + '" height="' + H + '" rx="18" fill="url(#' + uid + 'bg)"/>');
    var xEnd = W - 8;
    // hoved (venstre) og gribebræt
    p.push('<path d="M8 ' + (BOARD_T - 14) + ' L' + NUT + ' ' + (BOARD_T - 2) + ' L' + NUT + ' ' + (BOARD_B + 2) + ' L8 ' + (BOARD_B + 14) + ' Z" fill="url(#' + uid + 'head)"/>');
    p.push('<rect x="' + NUT + '" y="' + (BOARD_T - 4) + '" width="' + (xEnd - NUT) + '" height="' + (BOARD_B - BOARD_T + 8) + '" fill="url(#' + uid + 'wood)"/>');
    p.push('<rect x="' + NUT + '" y="' + (BOARD_T - 4) + '" width="' + (xEnd - NUT) + '" height="' + (BOARD_B - BOARD_T + 8) + '" fill="#000" filter="url(#' + uid + 'grain)"/>');
    p.push('<rect x="' + NUT + '" y="' + (BOARD_B + 4) + '" width="' + (xEnd - NUT) + '" height="6" fill="#1a100a" opacity=".55"/>');
    // indlægsprikker (3. og 5. bånd)
    [3, 5].filter(function (f) { return f <= FRETS; }).forEach(function (f) { var cx = (fretX(f - 1) + fretX(f)) / 2; p.push('<circle cx="' + cx.toFixed(1) + '" cy="' + ((BOARD_T + BOARD_B) / 2) + '" r="9" fill="url(#' + uid + 'pearl)" opacity=".92"/>'); });
    // båndtråde
    for (var f = 1; f <= FRETS; f++) { var fx = fretX(f); p.push('<rect x="' + (fx - 2.6).toFixed(1) + '" y="' + (BOARD_T - 4) + '" width="5.2" height="' + (BOARD_B - BOARD_T + 8) + '" rx="2" fill="url(#' + uid + 'fret)"/>'); }
    // sadel
    p.push('<rect x="' + (NUT - 9) + '" y="' + (BOARD_T - 8) + '" width="11" height="' + (BOARD_B - BOARD_T + 16) + '" rx="2.5" fill="url(#' + uid + 'bone)" stroke="#a89f8a" stroke-width=".8"/>');
    // strenge (skygge + streng)
    for (var s = 6; s >= 1; s--) {
      var y0 = stringY(s, NUT), y1 = stringY(s, xEnd), g = GAUGE[s], wound = s >= 3;
      p.push('<line x1="8" y1="' + (y0 + (y0 - (BOARD_T + BOARD_B) / 2) * -0.35 + 4).toFixed(1) + '" x2="' + NUT + '" y2="' + (y0 + 3).toFixed(1) + '" stroke="#000" stroke-width="' + g + '" opacity=".25" filter="url(#' + uid + 'ssh)"/>');
      p.push('<line x1="' + NUT + '" y1="' + (y0 + 4).toFixed(1) + '" x2="' + xEnd + '" y2="' + (y1 + 4).toFixed(1) + '" stroke="#000" stroke-width="' + g + '" opacity=".35" filter="url(#' + uid + 'ssh)"/>');
      var yh = y0 + (y0 - (BOARD_T + BOARD_B) / 2) * -0.35;
      p.push('<line x1="8" y1="' + yh.toFixed(1) + '" x2="' + (NUT - 3) + '" y2="' + y0.toFixed(1) + '" stroke="' + (wound ? '#c7a56c' : '#c9ced4') + '" stroke-width="' + g + '"/>');
      p.push('<polygon points="' + NUT + ',' + (y0 - g / 2).toFixed(2) + ' ' + xEnd + ',' + (y1 - g / 2).toFixed(2) + ' ' + xEnd + ',' + (y1 + g / 2).toFixed(2) + ' ' + NUT + ',' + (y0 + g / 2).toFixed(2) + '" fill="url(#' + uid + (wound ? 'wind' : 'plain') + ')"/>');
    }
    // X / O ved sadlen + strengenavne
    for (var i = 0; i < 6; i++) {
      var st = 6 - i, ch = greb.charAt(i), y = stringY(st, NUT), mx = NUT - 30;
      if (ch === 'x') p.push('<g data-marker="x" data-streng="' + st + '"><circle cx="' + mx + '" cy="' + y.toFixed(1) + '" r="12" fill="#fff" opacity=".95"/><path d="M' + (mx - 6) + ',' + (y - 6).toFixed(1) + ' l12,12 m0,-12 l-12,12" stroke="#b91c1c" stroke-width="2.6" stroke-linecap="round"/></g>');
      else if (ch === '0') p.push('<g data-marker="o" data-streng="' + st + '"><circle cx="' + mx + '" cy="' + y.toFixed(1) + '" r="11" fill="#fff" opacity=".95"/><circle cx="' + mx + '" cy="' + y.toFixed(1) + '" r="6.5" fill="none" stroke="#0f766e" stroke-width="2.4"/></g>');
    }
    // fingre: "stilk" ned mod 1. streng-siden (hånden kommer nedefra) + fingerspids
    var L = layout(greb);
    L.slice().sort(function (a, b) { return a.streng - b.streng; }).forEach(function (t) {
      var fn = fingers[t.streng] || '';
      p.push('<path d="M' + (t.x - 11).toFixed(1) + ',' + t.y.toFixed(1) + ' C' + (t.x - 13).toFixed(1) + ',' + (t.y + 40).toFixed(1) + ' ' + (t.x - 18).toFixed(1) + ',' + (H - 20) + ' ' + (t.x - 22).toFixed(1) + ',' + (H + 4) + ' L' + (t.x + 8).toFixed(1) + ',' + (H + 4) + ' C' + (t.x + 8).toFixed(1) + ',' + (H - 20) + ' ' + (t.x + 12).toFixed(1) + ',' + (t.y + 40).toFixed(1) + ' ' + (t.x + 11).toFixed(1) + ',' + t.y.toFixed(1) + ' Z" fill="url(#' + uid + 'skinStem)" opacity=".38"/>');
    });
    L.forEach(function (t) {
      var fn = fingers[t.streng] || '';
      p.push('<g data-finger="' + fn + '" data-streng="' + t.streng + '" data-baand="' + t.baand + '" data-x="' + t.x.toFixed(2) + '" data-y="' + t.y.toFixed(2) + '" filter="url(#' + uid + 'sh)">' +
        '<ellipse cx="' + t.x.toFixed(1) + '" cy="' + t.y.toFixed(1) + '" rx="16" ry="18" fill="url(#' + uid + 'skin)" stroke="#b77d5f" stroke-width="1"/>' +
        '<ellipse cx="' + (t.x - 4).toFixed(1) + '" cy="' + (t.y - 5).toFixed(1) + '" rx="6" ry="3" fill="#fff" opacity=".35"/>' +
        '<text x="' + t.x.toFixed(1) + '" y="' + (t.y + 7).toFixed(1) + '" text-anchor="middle" font-family="system-ui,DejaVu Sans,Arial,sans-serif" font-size="20" font-weight="800" fill="#5b2c17">' + fn + '</text></g>');
    });
    // båndnumre under brættet
    for (f = 1; f <= FRETS; f++) p.push('<text x="' + ((fretX(f - 1) + fretX(f)) / 2).toFixed(1) + '" y="' + (H - 10) + '" text-anchor="middle" font-family="system-ui,DejaVu Sans,Arial,sans-serif" font-size="16" font-weight="600" fill="#475569">' + f + '. bånd</text>');
    for (s = 6; s >= 1; s--) p.push('<text x="' + (NUT - 62) + '" y="' + (stringY(s, NUT) + 4.5).toFixed(1) + '" text-anchor="middle" font-family="system-ui,DejaVu Sans,Arial,sans-serif" font-size="15" font-weight="700" fill="#e7e2d8">' + LABEL[s] + '</text>');
    p.push('</svg>');
    return p.join('');
  }
  var api = { render: render, layout: layout, fretX: fretX, stringY: stringY, FRETS: FRETS, NUT: NUT, FNAVN: FNAVN };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Gribebraet = api;
})(typeof self !== 'undefined' ? self : this);
