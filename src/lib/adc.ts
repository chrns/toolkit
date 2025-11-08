export function cinRange(
  rExt: number,
  sigFreq: number,
  csh: number,
  vRef: number,
  nBits: number,
  rippleDb: number = 0.1,
  vStep?: number
): [number, number] {
  const eps = 1e-30;
  if (!(rExt > 0) || !(sigFreq > 0) || !(csh > 0) || !(vRef > 0) || !(nBits > 0)) {
    return [0, 0];
  }

  // 1) Cin >= Csh * (ΔVstep / (½LSB) - 1)
  const halfLSB = vRef / Math.pow(2, nBits + 1);
  const dVstep = (vStep ?? vRef);
  let cMin = csh * (dVstep / Math.max(halfLSB, eps) - 1);
  if (!Number.isFinite(cMin) || cMin < 0) cMin = 0;
  // 2) fc >= K * f_max, где K = 1/sqrt(10^(r/10)-1)
  const denom = Math.pow(10, rippleDb / 10) - 1;
  if (!(denom > 0)) return [0, 0];
  const K = 1 / Math.sqrt(denom);
  const fc = K * sigFreq;
  const cMax = 1 / (2 * Math.PI * Math.max(rExt, eps) * Math.max(fc, eps));

  if (!Number.isFinite(cMax) || cMin > cMax) return [cMax, cMin];

  return [cMin, cMax];
}

// --- Helper functions for spectrum analysis ---

type WindowKind = 'rect' | 'hann';

function isPow2(n: number) { return n > 0 && (n & (n - 1)) === 0; }

function pickWindowKind(n: number): WindowKind {
  return isPow2(n) ? 'rect' : 'hann';
}

function windowConsts(kind: WindowKind) {
  if (kind === 'rect') return { CG: 1.0, U: 1.0, ENBW_bins: 1.0, guard: 1 as const };
  // periodic Hann: 0.5*(1 - cos(2πn/N))
  return { CG: 0.5, U: 0.375, ENBW_bins: 1.5, guard: 2 as const };
}

function applyWindow(x: Float64Array, kind: WindowKind): Float64Array {
  const N = x.length;
  if (kind === 'rect') return new Float64Array(x);
  const y = new Float64Array(N);
  for (let n = 0; n < N; n++) y[n] = x[n] * (0.5 - 0.5 * Math.cos(2 * Math.PI * n / N));
  return y;
}

// --- FFT utilities ---

// in-place bit-reversal for radix-2
function bitReversePermute(re: Float64Array, im: Float64Array) {
  const N = re.length;
  let j = 0;
  for (let i = 0; i < N; i++) {
    if (i < j) {
      const tr = re[i]; re[i] = re[j]; re[j] = tr;
      const ti = im[i]; im[i] = im[j]; im[j] = ti;
    }
    let m = N >>> 1;
    while (m >= 1 && j >= m) { j -= m; m >>>= 1; }
    j += m;
  }
}

// Radix-2 Cooley–Tukey FFT (no scaling), N must be power of two
function fftRadix2(re: Float64Array, im: Float64Array) {
  const N = re.length;
  bitReversePermute(re, im);
  for (let len = 2; len <= N; len <<= 1) {
    const ang = -2 * Math.PI / len;
    const wlen_r = Math.cos(ang), wlen_i = Math.sin(ang);
    for (let i = 0; i < N; i += len) {
      let wr = 1, wi = 0;
      for (let j = 0; j < (len >> 1); j++) {
        const u_r = re[i + j], u_i = im[i + j];
        const v_r = re[i + j + (len >> 1)] * wr - im[i + j + (len >> 1)] * wi;
        const v_i = re[i + j + (len >> 1)] * wi + im[i + j + (len >> 1)] * wr;
        re[i + j] = u_r + v_r; im[i + j] = u_i + v_i;
        re[i + j + (len >> 1)] = u_r - v_r; im[i + j + (len >> 1)] = u_i - v_i;
        // w *= wlen
        const tmp = wr * wlen_r - wi * wlen_i;
        wi = wr * wlen_i + wi * wlen_r;
        wr = tmp;
      }
    }
  }
}

// Fallback DFT for non-power-of-two lengths (O(N^2))
function dft(re: Float64Array, im: Float64Array) {
  const N = re.length;
  const outR = new Float64Array(N);
  const outI = new Float64Array(N);
  for (let k = 0; k < N; k++) {
    let sr = 0, si = 0;
    for (let n = 0; n < N; n++) {
      const ang = -2 * Math.PI * k * n / N;
      const c = Math.cos(ang), s = Math.sin(ang);
      sr += re[n] * c - im[n] * s;
      si += re[n] * s + im[n] * c;
    }
    outR[k] = sr; outI[k] = si;
  }
  re.set(outR); im.set(outI);
}

function fftAnyLength(re: Float64Array, im: Float64Array) {
  if (isPow2(re.length)) fftRadix2(re, im);
  else dft(re, im);
}

type Spectrum = {
  Pk: Float64Array; // |X[k]|^2, one-sided k in [0..N/2]
  kStart: number;
  kEnd: number;
  N: number;
};

function computeOneSidedPk(y: Float64Array): Spectrum {
  const N = y.length;
  const re = new Float64Array(y);
  const im = new Float64Array(N);
  fftAnyLength(re, im);
  const half = N >>> 1;
  const kStart = 0;
  const kEnd = isPow2(N) ? half : Math.floor(N / 2);
  const Pk = new Float64Array(kEnd + 1);
  for (let k = 0; k <= kEnd; k++) {
    const a = re[k], b = im[k];
    Pk[k] = a * a + b * b;
  }
  return { Pk, kStart, kEnd, N };
}

type AnalyzeResult = {
  k0: number;
  P1: number;
  Pn: number;
  Pharm: number;
  SNR_dB: number;
  SINAD_dB: number;
  THD_dB: number;
  ENOB_bits: number;
  noiseFloor_dBFS_bin: number;
};

export function analyzeFromCodes(codes: number[], nBits: number): AnalyzeResult | null {
  const N = codes.length;
  if (N < 8) return null;

  // remove DC
  let mean = 0; for (let i = 0; i < N; i++) mean += codes[i]; mean /= N;
  const x0 = new Float64Array(N);
  for (let i = 0; i < N; i++) x0[i] = codes[i] - mean;

  const kind = pickWindowKind(N);
  const { CG, U, ENBW_bins, guard } = windowConsts(kind);
  const y = applyWindow(x0, kind);

  const { Pk, kEnd } = computeOneSidedPk(y);
  const kStart = 1; // drop DC
  const kNyq = kEnd;

  // find fundamental
  let k0 = 1, maxv = -1;
  for (let k = kStart; k <= kNyq - 1; k++) {
    if (Pk[k] > maxv) { maxv = Pk[k]; k0 = k; }
  }

  const Nlin = N;
  const scaleTone = 2 / (Nlin * Nlin * CG * CG);
  const scaleNoise = 2 / (Nlin * Nlin * U);

  const sumBins = (a: number, b: number) => {
    let s = 0;
    for (let k = Math.max(a, kStart); k <= Math.min(b, kNyq - 1); k++) s += Pk[k];
    return s;
  };

  // fundamental power
  const P1 = scaleTone * sumBins(k0 - guard, k0 + guard);

  // harmonics
  let Pharm = 0;
  const maxH = 10;
  for (let h = 2; h <= maxH; h++) {
    const kh = h * k0;
    if (kh + guard >= kNyq) break;
    Pharm += scaleTone * sumBins(kh - guard, kh + guard);
  }

  // noise (exclude fundamental and harmonic bands)
  const exclude = new Uint8Array(kNyq + 1);
  for (let k = k0 - guard; k <= k0 + guard; k++) if (k >= kStart && k < kNyq) exclude[k] = 1;
  for (let h = 2; h <= maxH; h++) {
    const kh = h * k0; if (kh + guard >= kNyq) break;
    for (let k = kh - guard; k <= kh + guard; k++) if (k >= kStart && k < kNyq) exclude[k] = 1;
  }
  let Pn_raw = 0, noiseBins = 0;
  for (let k = kStart; k < kNyq; k++) {
    if (!exclude[k]) { Pn_raw += Pk[k]; noiseBins++; }
  }
  const Pn = scaleNoise * Pn_raw;

  const eps = 1e-300;
  const SNR_dB = 10 * Math.log10((P1) / (Pn + eps));
  const THD_dB = 10 * Math.log10((Pharm + eps) / (P1 + eps));
  const SINAD_dB = 10 * Math.log10((P1) / (Pn + Pharm + eps));
  const ENOB_bits = (SINAD_dB - 1.76) / 6.02;

  // noise floor per bin in dBFS (normalize by full-scale sine power in codes)
  const FS_rms_codes = ((1 << nBits) - 1) / (2 * Math.SQRT2);
  const Pfs = FS_rms_codes * FS_rms_codes;
  const noiseFloor_dBFS_bin = 10 * Math.log10(((Pn / noiseBins) + eps) / Pfs);

  return { k0, P1, Pn, Pharm, SNR_dB, SINAD_dB, THD_dB, ENOB_bits, noiseFloor_dBFS_bin };
}

export const sampleAdcData: number[] = [2762, 3552, 3939, 3849, 3321, 2478, 1521, 691, 201, 173, 620, 1445, 2437, 3323, 3861, 3932, 3542, 2787, 1841, 940, 318, 128, 420, 1135, 2101, 3053, 3728, 3963, 3721, 3073, 2167, 1225, 486, 137, 270, 855, 1761, 2750, 3545, 3937, 3853, 3328, 2490, 1531, 697, 204, 171, 613, 1434, 2426, 3315, 3857, 3934, 3550, 2798, 1852, 951, 323, 128, 414, 1124, 2088, 3044, 3723, 3962, 3727, 3083, 2179, 1235, 492, 140, 265, 846, 1751, 2740, 3537, 3936, 3857, 3338, 2500, 1543, 707, 207, 168, 604, 1421, 2414, 3305, 3853, 3936, 3555, 2808, 1865, 959, 327, 127, 408, 1114, 2076, 3033, 3718, 3963, 3731, 3092, 2190, 1245, 499, 141, 261, 836, 1737, 2728, 3530, 3933, 3860, 3346, 2511, 1553, 714, 211, 165, 597, 1410, 2402, 3296, 3850, 3937, 3564, 2818, 1876, 970, 334, 127, 402, 1104, 2065, 3022, 3711, 3963, 3738, 3102, 2203, 1256, 506, 144, 256, 827, 1726, 2717, 3522, 3931, 3864, 3354, 2523, 1566, 724, 214, 164, 589, 1399, 2390, 3287, 3846, 3940, 3570, 2829, 1888, 978, 339, 127, 396, 1093, 2052, 3011, 3705, 3962, 3743, 3110, 2213, 1267, 513, 144, 252, 819, 1714, 2706, 3513, 3929, 3868, 3363, 2534, 1577, 732, 218, 161, 581, 1387, 2378, 3277, 3842, 3942, 3577, 2840, 1899, 989, 343, 127, 389, 1083, 2040, 3001, 3699, 3962, 3748, 3122, 2225, 1277, 520, 146, 248, 808, 1702, 2694, 3507, 3927, 3872, 3372, 2546, 1588, 740, 222, 159, 572, 1377, 2366, 3268, 3836, 3944, 3584, 2850, 1910, 998, 349, 125, 383, 1072, 2028, 2991, 3692, 3961, 3753, 3131, 2237, 1288, 528, 148, 244, 799, 1690, 2683, 3500, 3924, 3875, 3380, 2556, 1599, 749, 225, 157, 567, 1365, 2354, 3259, 3834, 3944, 3591, 2860, 1923, 1009, 356, 126, 377, 1062, 2015, 2980, 3686, 3960, 3759, 3140, 2249, 1298, 534, 150, 240, 791, 1679, 2672, 3491, 3923, 3878, 3388, 2569, 1610, 757, 229, 155, 558, 1354, 2343, 3248, 3828, 3947, 3597, 2872, 1934, 1019, 361, 125, 372, 1052, 2004, 2969, 3681, 3961, 3764, 3149, 2260, 1309, 542, 152, 235, 782, 1665, 2660, 3482, 3920, 3881, 3397, 2579, 1622, 767, 232, 153, 552, 1343, 2331, 3240, 3824, 3948, 3605, 2881, 1946, 1028, 367, 125, 366, 1043, 1992, 2958, 3675, 3960, 3769, 3159, 2272, 1320, 548, 154, 232, 773, 1655, 2648, 3474, 3918, 3885, 3405, 2590, 1633, 774, 236, 151, 544, 1331, 2319, 3232, 3819, 3949, 3611, 2892, 1957, 1039, 372, 126, 360, 1032, 1980, 2948, 3669, 3960, 3774, 3169, 2283, 1331, 556, 155, 228, 764, 1644, 2636, 3467, 3916, 3888, 3412, 2601, 1645, 783, 241, 149, 536, 1320, 2306, 3221, 3815, 3951, 3617, 2902, 1969, 1048, 378, 125, 355, 1021, 1967, 2938, 3662, 3959, 3779, 3179, 2295, 1342, 564, 158, 224, 755, 1631, 2624, 3459, 3912, 3891, 3420, 2611, 1656, 793, 245, 147, 530, 1309, 2295, 3212, 3810, 3952, 3624, 2912, 1980, 1058, 384, 125, 350, 1012, 1955, 2927, 3655, 3957, 3784, 3187, 2306, 1353, 572, 161, 220, 746, 1619, 2615, 3451, 3910, 3894, 3428, 2623, 1667, 801, 249, 146, 521, 1298, 2283, 3202, 3806, 3953, 3629, 2922, 1992, 1069, 389, 126, 344, 1001, 1943, 2917, 3649, 3957, 3789, 3195, 2317, 1364, 579, 162, 217, 737, 1608, 2602, 3444, 3907, 3897, 3437, 2634, 1679, 810, 253, 145, 514, 1286, 2271, 3192, 3801, 3955, 3637, 2933, 2005, 1079, 395, 127, 338, 992, 1931, 2905, 3642, 3956, 3794, 3205, 2329, 1375, 587, 165, 214, 729, 1596, 2591, 3435, 3904, 3900, 3444, 2645, 1690, 819, 257, 142, 508, 1276, 2258, 3183, 3797, 3954, 3643, 2943, 2016, 1088, 401, 127, 333, 981, 1918, 2895, 3636, 3956, 3797, 3215, 2341, 1386, 593, 167, 210, 720, 1584, 2578, 3428, 3900, 3902, 3452, 2657, 1703, 829, 261, 141, 500, 1264, 2246, 3173, 3793, 3956, 3650, 2953, 2028, 1099, 408, 128, 328, 971, 1906, 2884, 3629, 3955, 3802, 3224, 2353, 1398, 602, 169, 206, 711, 1573, 2568, 3418, 3898, 3907, 3460, 2668, 1714, 838, 267, 139, 493, 1255, 2234, 3163, 3787, 3956, 3657, 2964, 2039, 1110, 413, 128, 323, 960, 1895, 2873, 3623, 3953, 3807, 3232, 2364, 1408, 610, 172, 203, 704, 1561, 2556, 3409, 3896, 3908, 3468, 2678, 1725, 847, 271, 139, 486, 1243, 2221, 3154, 3781, 3957, 3662, 2974, 2051, 1121, 420, 128, 317, 951, 1883, 2862, 3616, 3952, 3811, 3242, 2375, 1419, 618, 174, 201, 695, 1549, 2544, 3400, 3892, 3912, 3475, 2690, 1736, 856, 274, 136, 480, 1231, 2210, 3145, 3776, 3958, 3669, 2984, 2063, 1130, 425, 129, 313, 942, 1871, 2851, 3609, 3951, 3815, 3250, 2387, 1430, 624, 177, 196, 686, 1538, 2533, 3393, 3889, 3914, 3482, 2701, 1749, 865, 280, 136, 474, 1221, 2197, 3134, 3771, 3959, 3674, 2994, 2074, 1140, 432, 130, 307, 931, 1857, 2840, 3602, 3950, 3819, 3260, 2400, 1442, 632, 180, 193, 677, 1525, 2520, 3385, 3886, 3916, 3491, 2711, 1759, 874, 284, 135, 466, 1211, 2186, 3123, 3767, 3961, 3681, 3005, 2085, 1151, 439, 130, 302, 921, 1846, 2829, 3596, 3949, 3825, 3269, 2409, 1452, 641, 183, 191, 669, 1515, 2508, 3376, 3881, 3919, 3498, 2722, 1771, 883, 288, 133, 460, 1200, 2174, 3115, 3761, 3961, 3686, 3013, 2097, 1161, 445, 132, 297, 912, 1833, 2818, 3588, 3947, 3829, 3277, 2421, 1463, 649, 186, 187, 661, 1502, 2497, 3366, 3879, 3922, 3505, 2733, 1783, 894, 293, 132, 452, 1189, 2161, 3104, 3756, 3961, 3692, 3023, 2108, 1171, 451, 132, 293, 903, 1822, 2807, 3581, 3946, 3833, 3285, 2433, 1475, 657, 188, 184, 652, 1491, 2485, 3358, 3876, 3924, 3512, 2742, 1794, 903, 299, 131, 446, 1179, 2149, 3094, 3751, 3961, 3699, 3034, 2120, 1182, 458, 134, 287, 893, 1810, 2796, 3575, 3944, 3838, 3295, 2444, 1484, 665, 192, 181, 644, 1480, 2473, 3349, 3873, 3926, 3521, 2754, 1806, 912, 302, 130, 439, 1168, 2137, 3083, 3746, 3961, 3703, 3044, 2132, 1192, 465, 135, 283, 883, 1799, 2784, 3567, 3943, 3841, 3303, 2455, 1497, 673, 194, 178, 637, 1468, 2462, 3341, 3870, 3928, 3527, 2764, 1817, 921, 307, 129, 433, 1156, 2125, 3074, 3739, 3962, 3710, 3054, 2144, 1203, 472, 136, 279, 873, 1787, 2773, 3560, 3941, 3845, 3312, 2467, 1508, 681, 197, 177, 629, 1457, 2448, 3332, 3864, 3930, 3534, 2776, 1829, 932, 313, 129, 426, 1146, 2113, 3064, 3734, 3962, 3715, 3063, 2155, 1214, 478, 137, 274, 864, 1775]