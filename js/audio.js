/* Browser-lyd: afspilning, metronom, mikrofon, akkordlytning og stemmeapparat. Bygger på Lyd (lyd.js). */
var Audio2 = (function () {
  'use strict';
  var ctx = null, cache = {};
  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function bufferFor(greb, dir, onlyTop) {
    var key = greb + dir + (onlyTop || '');
    if (cache[key]) return cache[key];
    var c = getCtx();
    var data = Lyd.synthChord(c.sampleRate, greb, { direction: dir, onlyTop: onlyTop, seconds: 2.4, strumGap: dir === 'op' ? 0.018 : 0.028, seed: 3 });
    var b = c.createBuffer(1, data.length, c.sampleRate); b.copyToChannel(data, 0);
    return (cache[key] = b);
  }
  var master = null;
  function out() { var c = getCtx(); if (!master) { master = c.createGain(); master.gain.value = 0.9; var comp = c.createDynamicsCompressor(); master.connect(comp); comp.connect(c.destination); } return master; }
  /* Afspil akkord. dir: 'ned' (dyb -> lys) eller 'op'. when: AudioContext-tid (valgfri). */
  function playChord(greb, dir, when, gain, onlyTop) {
    var c = getCtx(), src = c.createBufferSource(), g = c.createGain();
    src.buffer = bufferFor(greb, dir || 'ned', onlyTop); g.gain.value = gain || 1;
    src.connect(g); g.connect(out()); src.start(when || c.currentTime);
    return src;
  }
  /* Afspil strengene én ad gangen (arpeggio) – godt til at høre, om hver streng klinger. */
  function playArpeggio(greb) {
    var c = getCtx(), t = c.currentTime + 0.05;
    Lyd.voicingNotes(greb).forEach(function (n, i) {
      var data = Lyd.ksString(c.sampleRate, Lyd.midiToFreq(n.midi), 1.6, { seed: 11 + i });
      var b = c.createBuffer(1, data.length, c.sampleRate); b.copyToChannel(data, 0);
      var s = c.createBufferSource(), g = c.createGain(); g.gain.value = 0.4; s.buffer = b; s.connect(g); g.connect(out()); s.start(t + i * 0.35);
    });
  }
  function playNote(midi) {
    var c = getCtx(), data = Lyd.ksString(c.sampleRate, Lyd.midiToFreq(midi), 3, { seed: midi, decay: 0.998 });
    var b = c.createBuffer(1, data.length, c.sampleRate); b.copyToChannel(data, 0);
    var s = c.createBufferSource(), g = c.createGain(); g.gain.value = 0.5; s.buffer = b; s.connect(g); g.connect(out()); s.start();
  }
  function click(when, accent) {
    var c = getCtx(), o = c.createOscillator(), g = c.createGain();
    o.frequency.value = accent ? 1600 : 1000; g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(accent ? 0.5 : 0.3, when + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, when + 0.05);
    o.connect(g); g.connect(out()); o.start(when); o.stop(when + 0.06);
  }
  /* Metronom med 8.-dele-opløsning. opts: bpm, beats (pr. takt), clicks (bool), onTick(i8, time) kaldes planlagt. */
  function Metronome(opts) {
    this.opts = opts; this.timer = null; this.next = 0; this.i = 0; this.running = false;
  }
  Metronome.prototype.start = function () {
    var c = getCtx(), self = this; this.running = true; this.i = 0; this.next = c.currentTime + 0.12;
    function sched() {
      while (self.next < c.currentTime + 0.12) {
        var i8 = self.i, t = self.next, beats = self.opts.beats || 4;
        if (i8 % 2 === 0 && self.opts.clicks !== false) click(t, (i8 / 2) % beats === 0);
        if (self.opts.onTick) self.opts.onTick(i8, t);
        (function (i8, t) { setTimeout(function () { if (self.running && self.opts.onUi) self.opts.onUi(i8); }, Math.max(0, (t - c.currentTime) * 1000)); })(i8, t);
        self.next += 30 / self.opts.bpm; self.i++;
      }
    }
    sched(); this.timer = setInterval(sched, 25);
  };
  Metronome.prototype.stop = function () { this.running = false; clearInterval(this.timer); };
  Metronome.prototype.setBpm = function (b) { this.opts.bpm = b; };

  /* ---- Mikrofon ---- */
  var mic = null;
  function startMic() {
    if (mic) return Promise.resolve(mic);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return Promise.reject(new Error('Mikrofon understøttes ikke i denne browser.'));
    return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }).then(function (stream) {
      var c = getCtx(), src = c.createMediaStreamSource(stream);
      var spec = c.createAnalyser(); spec.fftSize = 16384; spec.smoothingTimeConstant = 0; spec.minDecibels = -120; spec.maxDecibels = 0;
      var time = c.createAnalyser(); time.fftSize = 4096; time.smoothingTimeConstant = 0;
      src.connect(spec); src.connect(time);
      mic = { stream: stream, src: src, spec: spec, time: time, c: c };
      return mic;
    });
  }
  function stopMic() { if (mic) { mic.stream.getTracks().forEach(function (t) { t.stop(); }); mic.src.disconnect(); mic = null; } }
  function rms(arr) { var s = 0; for (var i = 0; i < arr.length; i++) s += arr[i] * arr[i]; return Math.sqrt(s / arr.length); }

  /* Lyt efter ét anslag og returnér kroma + gennemsnitsspektrum. onState('kalibrerer'|'venter'|'lytter'). */
  function listenChord(onState, opts) {
    opts = opts || {};
    return startMic().then(function (m) {
      return new Promise(function (resolve, reject) {
        var tbuf = new Float32Array(m.time.fftSize), fbuf = new Float32Array(m.spec.frequencyBinCount);
        var amb = [], t0 = performance.now(), phase = 'kalibrerer', onsetAt = 0, frames = 0;
        var chroma = new Float64Array(12), avg = new Float64Array(fbuf.length), cancelled = false, lastLevel = 0;
        onState && onState(phase);
        function tick() {
          if (cancelled) return;
          m.time.getFloatTimeDomainData(tbuf); var r = rms(tbuf), now = performance.now();
          if (opts.onLevel) opts.onLevel(r);
          if (phase === 'kalibrerer') { amb.push(r); if (now - t0 > 450) { phase = 'venter'; onState && onState(phase); } }
          else if (phase === 'venter') {
            var noise = amb.slice().sort(function (a, b) { return a - b; })[Math.floor(amb.length / 2)] || 0.001;
            if (r > Math.max(0.015, noise * 4) && r > lastLevel * 1.4) { phase = 'lytter'; onsetAt = now; onState && onState(phase); }
            if (now - t0 > 15000) { cancelled = true; return reject(new Error('timeout')); }
          } else if (phase === 'lytter') {
            if (now - onsetAt > 120 && frames < 20 && now - onsetAt > 120 + frames * 50) {
              m.spec.getFloatFrequencyData(fbuf);
              var lin = new Float64Array(fbuf.length);
              for (var i = 0; i < fbuf.length; i++) { lin[i] = Math.pow(10, fbuf[i] / 20); avg[i] += lin[i] / 20; }
              var ch = Lyd.chromaFromSpectrum(lin, m.c.sampleRate, m.spec.fftSize);
              for (i = 0; i < 12; i++) chroma[i] += ch[i];
              frames++;
            }
            if (frames >= 20) { return resolve({ chroma: chroma, avg: avg, sampleRate: m.c.sampleRate, fftSize: m.spec.fftSize }); }
          }
          lastLevel = 0.7 * lastLevel + 0.3 * r;
          requestAnimationFrame(tick);
        }
        tick();
        listenChord.cancel = function () { cancelled = true; reject(new Error('annulleret')); };
      });
    });
  }

  /* Stemmeapparat: kalder cb({freq, streng, cents}) ca. 12 gange i sekundet. Returnerer stop-funktion. */
  function startTuner(cb) {
    var stopped = false, hist = [];
    startMic().then(function (m) {
      var buf = new Float32Array(m.time.fftSize);
      (function loop() {
        if (stopped) return;
        m.time.getFloatTimeDomainData(buf);
        var p = Lyd.detectPitch(buf, m.c.sampleRate);
        if (p && p.freq > 60 && p.freq < 1100) {
          hist.push(p.freq); if (hist.length > 5) hist.shift();
          var med = hist.slice().sort(function (a, b) { return a - b; })[Math.floor(hist.length / 2)];
          var ns = Lyd.nearestString(med); ns.freq = med; cb(ns);
        } else { cb(null); }
        setTimeout(loop, 80);
      })();
    }).catch(function (e) { cb({ error: e.message || String(e) }); });
    return function () { stopped = true; };
  }

  return { getCtx: getCtx, playChord: playChord, playArpeggio: playArpeggio, playNote: playNote, click: click, Metronome: Metronome,
           startMic: startMic, stopMic: stopMic, listenChord: listenChord, startTuner: startTuner };
})();
