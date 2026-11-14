// YIN pitch detector with parabolic interpolation. Returns {freq, clarity} or null.
(function (root) {
  var d = new Float32Array(2048);
  function detectPitch(buf, sr) {
    var n = buf.length, W = n >> 1, i, tau;
    var mean = 0;
    for (i = 0; i < n; i++) mean += buf[i];
    mean /= n;
    var rms = 0;
    for (i = 0; i < n; i++) { var v = buf[i] - mean; rms += v * v; }
    rms = Math.sqrt(rms / n);
    if (rms < 0.004) return null;
    var tauMax = Math.min(W - 1, Math.floor(sr / 55));
    if (d.length < tauMax + 2) d = new Float32Array(tauMax + 2);
    var run = 0;
    d[0] = 1;
    for (tau = 1; tau <= tauMax; tau++) {
      var s = 0;
      for (i = 0; i < W; i++) { var x = buf[i] - buf[i + tau]; s += x * x; }
      run += s;
      d[tau] = run > 0 ? s * tau / run : 1;
    }
    var tauMin = Math.max(2, Math.floor(sr / 1400)), best = -1;
    for (tau = tauMin; tau < tauMax; tau++) {
      if (d[tau] < 0.12) {
        while (tau + 1 < tauMax && d[tau + 1] < d[tau]) tau++;
        best = tau; break;
      }
    }
    if (best < 0) {
      var m = 1;
      for (tau = tauMin; tau < tauMax; tau++) if (d[tau] < m) { m = d[tau]; best = tau; }
      if (best < 0 || m > 0.3) return null;
    }
    var a = d[best - 1], b = d[best], c = d[best + 1], den = a - 2 * b + c;
    var shift = den ? 0.5 * (a - c) / den : 0;
    if (shift > 1 || shift < -1) shift = 0;
    return { freq: sr / (best + shift), clarity: 1 - b, rms: rms };
  }
  root.detectPitch = detectPitch;
  if (typeof module !== 'undefined') module.exports = detectPitch;
})(typeof self !== 'undefined' ? self : this);
