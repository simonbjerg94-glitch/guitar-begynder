/* Lydmotor: akkordafspilning (Karplus-Strong), akkordgenkendelse (kroma) og stemmeapparat (autokorrelation).
   Ren JavaScript uden afhængigheder. Virker i browseren og i Node (til test). */
(function (root) {
  'use strict';
  var NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  var NOTE_DK = { 'C': 'C', 'C#': 'C#', 'D': 'D', 'D#': 'D#', 'E': 'E', 'F': 'F', 'F#': 'F#', 'G': 'G', 'G#': 'G#', 'A': 'A', 'A#': 'B♭', 'B': 'H' };
  // Åbne strenge fra 6. til 1. streng som MIDI-numre: E2 A2 D3 G3 B3 E4
  var OPEN_MIDI = [40, 45, 50, 55, 59, 64];

  function midiToFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  /* greb: streng som "x32010" (6. -> 1. streng). Returnerer liste {streng, midi} for de anslåede strenge. */
  function voicingNotes(greb) {
    var out = [];
    for (var i = 0; i < 6; i++) {
      var ch = greb[i];
      if (ch === 'x' || ch === 'X') continue;
      out.push({ streng: 6 - i, midi: OPEN_MIDI[i] + parseInt(ch, 10) });
    }
    return out;
  }

  /* ---------- Karplus-Strong ---------- */
  function rng(seed) { var s = seed >>> 0 || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

  /* Én streng: returnerer Float32Array. opts: decay, brightness (0..1), seed */
  function ksString(sampleRate, freq, seconds, opts) {
    opts = opts || {};
    var n = Math.floor(sampleRate * seconds);
    var out = new Float32Array(n);
    var period = sampleRate / freq;
    // Sløjfens forsinkelse = N - 0.5 (fremadrettet midling) + frac (allpass) = period
    var N = Math.floor(period + 0.5);
    var frac = period + 0.5 - N;                 // 0..1: fraktion til allpass-finjustering
    var C = (1 - frac) / (1 + frac);
    var buf = new Float32Array(N);
    var r = rng(opts.seed || 12345);
    var bright = opts.brightness == null ? 0.5 : opts.brightness;
    // støj-excitation, lavpasfiltreret afhængigt af "brightness" (blødere anslag med fingerspids/plekter)
    var prev = 0;
    for (var i = 0; i < N; i++) { var w = r() * 2 - 1; prev = prev + (1 - bright * 0.9 + 0.05) * (w - prev); buf[i] = prev; }
    var mean = 0; for (i = 0; i < N; i++) mean += buf[i]; mean /= N; for (i = 0; i < N; i++) buf[i] -= mean;
    var decay = opts.decay == null ? 0.996 : opts.decay;
    var idx = 0, apX = 0, apY = 0;
    for (i = 0; i < n; i++) {
      var cur = buf[idx];
      var nxt = buf[(idx + 1) % N];
      var avg = decay * 0.5 * (cur + nxt);
      var y = C * avg + apX - C * apY; apX = avg; apY = y;   // allpass for præcis tonehøjde
      out[i] = cur;
      buf[idx] = y;
      idx = (idx + 1) % N;
    }
    return out;
  }

  /* Hel akkord: anslag fra dyb til lys streng (ned) eller omvendt (op) med lille forsinkelse. */
  function synthChord(sampleRate, greb, opts) {
    opts = opts || {};
    var seconds = opts.seconds || 2.5;
    var gap = opts.strumGap == null ? 0.03 : opts.strumGap;
    var notes = voicingNotes(greb);
    if (opts.direction === 'op') notes = notes.slice().reverse();
    if (opts.onlyTop) notes = notes.slice(-opts.onlyTop);
    var detune = opts.detuneCents || [];
    var drop = opts.dropStrings || [];
    var total = Math.floor(sampleRate * (seconds + gap * 6));
    var out = new Float32Array(total);
    for (var k = 0; k < notes.length; k++) {
      var nt = notes[k];
      if (drop.indexOf(nt.streng) >= 0) continue;
      var cents = detune[6 - nt.streng] || 0;
      var f = midiToFreq(nt.midi) * Math.pow(2, cents / 1200);
      var s = ksString(sampleRate, f, seconds, { seed: (opts.seed || 7) * 31 + k * 101 + nt.midi, decay: opts.decay, brightness: opts.brightness });
      var off = Math.floor(k * gap * sampleRate);
      var amp = 0.35 * (opts.velocity || 1);
      for (var i = 0; i < s.length && off + i < total; i++) out[off + i] += s[i] * amp;
    }
    return out;
  }

  /* ---------- Akkordgenkendelse (kroma) ---------- */
  var DEFAULT_OPTS = { fmin: 70, fmax: 1500, harmonics: 5, harmDecay: 0.6 };

  /* mags: lineære amplituder pr. bin (længde fftSize/2). Returnerer 12-vektor. Bruger spidsfinding + parabolsk interpolation. */
  function chromaFromSpectrum(mags, sampleRate, fftSize, opts) {
    opts = opts || DEFAULT_OPTS;
    var chroma = new Float64Array(12);
    var binHz = sampleRate / fftSize;
    var lo = Math.max(2, Math.floor(opts.fmin / binHz)), hi = Math.min(mags.length - 2, Math.ceil(opts.fmax / binHz));
    var maxMag = 0, i;
    for (i = lo; i <= hi; i++) if (mags[i] > maxMag) maxMag = mags[i];
    if (maxMag <= 0) return chroma;
    var floor = maxMag * 0.02;      // ignorér svage spidser (støj, sidelober)
    var peaks = [];
    for (i = lo; i <= hi; i++) {
      var m = mags[i];
      if (m < floor || m < mags[i - 1] || m < mags[i + 1]) continue;
      var a = mags[i - 1], b = m, c = mags[i + 1];
      var d = 0.5 * (a - c) / (a - 2 * b + c || 1e-12);
      var f = (i + d) * binHz;
      peaks.push({ midiF: 69 + 12 * Math.log2(f / 440), w: Math.sqrt(m / maxMag) });   // komprimering: dæmper dominerende basstreng
    }
    // Estimér hvor meget hele guitaren er ude af stemning (vægtet cirkulært gennemsnit af afvigelsen fra nærmeste halvtone)
    var sx = 0, sy = 0;
    peaks.forEach(function (p) { var ang = 2 * Math.PI * (p.midiF - Math.round(p.midiF)); sx += p.w * Math.cos(ang); sy += p.w * Math.sin(ang); });
    var offset = (opts.tuningCorrection === false || !peaks.length) ? 0 : Math.atan2(sy, sx) / (2 * Math.PI);
    chroma.offsetCents = Math.round(offset * 100);
    peaks.forEach(function (p) {
      var mf = p.midiF - offset, near = Math.round(mf);
      if (Math.abs(mf - near) > 0.4) return;   // for langt fra en halvtone
      chroma[((near % 12) + 12) % 12] += p.w;
    });
    return chroma;
  }

  function norm(v) { var s = 0; for (var i = 0; i < v.length; i++) s += v[i] * v[i]; s = Math.sqrt(s) || 1; var o = new Float64Array(v.length); for (i = 0; i < v.length; i++) o[i] = v[i] / s; return o; }
  function cosine(a, b) { var s = 0, na = 0, nb = 0; for (var i = 0; i < 12; i++) { s += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; } return s / (Math.sqrt(na * nb) || 1); }

  /* Skabelon ud fra det konkrete greb inkl. overtoner (2. = oktav, 3. = kvint, 4. = oktav, 5. = stor terts). */
  function templateFromVoicing(greb, opts) {
    opts = opts || DEFAULT_OPTS;
    var t = new Float64Array(12);
    var notes = voicingNotes(greb);
    for (var k = 0; k < notes.length; k++) {
      for (var h = 1; h <= opts.harmonics; h++) {
        var f = midiToFreq(notes[k].midi) * h;
        if (f > opts.fmax) break;
        var pc = ((Math.round(notes[k].midi + 12 * Math.log2(h)) % 12) + 12) % 12;
        t[pc] += Math.pow(opts.harmDecay, h - 1);
      }
    }
    for (var i = 0; i < 12; i++) t[i] = Math.sqrt(t[i]);
    return norm(t);
  }

  function buildTemplates(chords, opts) {
    return chords.map(function (c) { return { id: c.id, navn: c.navn, greb: c.greb, familie: c.familie || c.id, t: templateFromVoicing(c.greb, opts) }; });
  }

  /* Rangér skabeloner mod en kroma-vektor. */
  function rankChroma(chroma, templates) {
    var c = norm(chroma);
    return templates.map(function (t) { return { id: t.id, navn: t.navn, familie: t.familie, score: cosine(c, t.t) }; })
      .sort(function (a, b) { return b.score - a.score; });
  }

  /* "Hvad spiller jeg?": bedste match + sikkerhed (afstand til næstbedste af en ANDEN akkordfamilie). */
  function identify(chroma, templates) {
    var r = rankChroma(chroma, templates);
    var best = r[0], second = null;
    // Foretræk grundakkorden i familien (fx Em frem for Em7), hvis den er næsten lige så god – det er den begyndere oftest øver.
    if (best.familie !== best.id) { for (var j = 1; j < r.length; j++) if (r[j].id === best.familie && r[j].score >= best.score - 0.04) { best = r[j]; break; } }
    for (var i = 1; i < r.length; i++) if (r[i].familie !== best.familie) { second = r[i]; break; }
    var margin = second ? best.score - second.score : 1;
    var level = best.score < 0.75 ? 'usikker' : (margin > 0.06 ? 'høj' : (margin > 0.025 ? 'middel' : 'lav'));
    return { best: best, second: second, margin: margin, level: level, ranking: r };
  }

  /* "Tjek akkord": målet er kendt. Returnerer ok + hvilke toner der mangler / er fremmede. */
  function checkChord(chroma, target, templates) {
    var id = identify(chroma, templates);
    var tScore = 0;
    for (var i = 0; i < id.ranking.length; i++) if (id.ranking[i].id === target.id) tScore = id.ranking[i].score;
    var bestOther = 0;
    for (i = 0; i < id.ranking.length; i++) if (id.ranking[i].familie !== (target.familie || target.id)) { bestOther = id.ranking[i].score; break; }
    var c = norm(chroma), mx = 0; for (i = 0; i < 12; i++) mx = Math.max(mx, c[i]);
    // forventede tonetrin og hvilke strenge der giver dem
    var notes = voicingNotes(target.greb), expected = {};
    notes.forEach(function (n) { var pc = n.midi % 12; (expected[pc] = expected[pc] || []).push(n.streng); });
    var missing = [], extra = [];
    Object.keys(expected).forEach(function (pc) { if (c[pc] < mx * 0.22) missing.push({ tone: NOTE_DK[NOTE_NAMES[pc]], strenge: expected[pc] }); });
    for (i = 0; i < 12; i++) if (!expected[i] && c[i] > mx * 0.55) extra.push({ tone: NOTE_DK[NOTE_NAMES[i]] });
    var ok = tScore >= 0.8 && tScore >= bestOther - 0.01 && missing.length === 0;
    return { ok: ok, score: tScore, bestOther: bestOther, missing: missing, extra: extra, identified: id };
  }


  /* Streng-for-streng-tjek på et gennemsnitligt amplitudespektrum: finder strenge, hvis grundtone er (næsten) væk.
     Strenge, hvis grundtone falder sammen med en overtone fra en dybere streng, kan ikke vurderes og springes over. */
  function stringCheck(mags, sampleRate, fftSize, greb) {
    var binHz = sampleRate / fftSize, notes = voicingNotes(greb), rows = [];
    function peakAt(f) { var lo = Math.floor(f * Math.pow(2, -35 / 1200) / binHz), hi = Math.ceil(f * Math.pow(2, 35 / 1200) / binHz), m = 0; for (var i = lo; i <= hi; i++) if (mags[i] > m) m = mags[i]; return m; }
    for (var k = 0; k < notes.length; k++) {
      var f0 = midiToFreq(notes[k].midi), overlapped = false;
      for (var j = 0; j < k; j++) for (var h = 2; h <= 6; h++) { if (Math.abs(1200 * Math.log2(midiToFreq(notes[j].midi) * h / f0)) < 35) overlapped = true; }
      rows.push({ streng: notes[k].streng, midi: notes[k].midi, peak: peakAt(f0), overlapped: overlapped });
    }
    var ref = rows.filter(function (r) { return !r.overlapped; }).map(function (r) { return r.peak; }).sort(function (a, b) { return a - b; });
    var med = ref.length ? ref[Math.floor(ref.length / 2)] : 0, mx = ref.length ? ref[ref.length - 1] : 0;
    rows.forEach(function (r) { r.svag = !r.overlapped && med > 0 && r.peak < 0.12 * Math.max(med, mx * 0.5); });
    return rows;
  }

  /* ---------- Stemmeapparat: autokorrelation ---------- */
  function detectPitch(buf, sampleRate) {
    var n = buf.length, rms = 0, i;
    for (i = 0; i < n; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / n);
    if (rms < 0.008) return null;                     // for stille
    var minLag = Math.floor(sampleRate / 1000), maxLag = Math.floor(sampleRate / 70);
    var best = -1, bestLag = -1, corr = new Float32Array(maxLag + 2);
    for (var lag = minLag; lag <= maxLag + 1; lag++) {
      var s = 0, e1 = 0, e2 = 0;
      for (i = 0; i < n - lag; i++) { s += buf[i] * buf[i + lag]; e1 += buf[i] * buf[i]; e2 += buf[i + lag] * buf[i + lag]; }
      corr[lag] = s / (Math.sqrt(e1 * e2) || 1);
    }
    // første tydelige top over 0.9 * max (undgår oktavfejl)
    var gmax = 0; for (lag = minLag; lag <= maxLag; lag++) gmax = Math.max(gmax, corr[lag]);
    if (gmax < 0.6) return null;
    for (lag = minLag + 1; lag <= maxLag; lag++) {
      if (corr[lag] > 0.9 * gmax && corr[lag] >= corr[lag - 1] && corr[lag] >= corr[lag + 1]) { bestLag = lag; best = corr[lag]; break; }
    }
    if (bestLag < 0) return null;
    var a = corr[bestLag - 1], b = corr[bestLag], c = corr[bestLag + 1];
    var shift = 0.5 * (a - c) / (a - 2 * b + c || 1e-12);
    return { freq: sampleRate / (bestLag + shift), clarity: best };
  }

  var GUITAR_STRINGS = [
    { streng: 6, navn: 'E', midi: 40 }, { streng: 5, navn: 'A', midi: 45 }, { streng: 4, navn: 'D', midi: 50 },
    { streng: 3, navn: 'G', midi: 55 }, { streng: 2, navn: 'H', midi: 59 }, { streng: 1, navn: 'E', midi: 64 }];

  function nearestString(freq) {
    var midiF = 69 + 12 * Math.log2(freq / 440), best = null;
    GUITAR_STRINGS.forEach(function (s) { var d = midiF - s.midi; if (!best || Math.abs(d) < Math.abs(best.diff)) best = { s: s, diff: d }; });
    return { streng: best.s, cents: Math.round(best.diff * 100) };
  }

  var api = { NOTE_NAMES: NOTE_NAMES, NOTE_DK: NOTE_DK, OPEN_MIDI: OPEN_MIDI, midiToFreq: midiToFreq, voicingNotes: voicingNotes,
    ksString: ksString, synthChord: synthChord, chromaFromSpectrum: chromaFromSpectrum, templateFromVoicing: templateFromVoicing,
    buildTemplates: buildTemplates, rankChroma: rankChroma, identify: identify, checkChord: checkChord, cosine: cosine, norm: norm,
    detectPitch: detectPitch, stringCheck: stringCheck, nearestString: nearestString, GUITAR_STRINGS: GUITAR_STRINGS, DEFAULT_OPTS: DEFAULT_OPTS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Lyd = api;
})(typeof self !== 'undefined' ? self : this);
