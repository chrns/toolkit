import { useMemo, useState } from 'preact/hooks';
import { Input } from '@/ui/components/Input';
import { Select } from '@/ui/components/Select';
import { ResultCard } from '@/ui/components/ResultCard';
import CodeSample from '@/ui/components/CodeSample';

type DataMode = 'hex' | 'ascii' | 'bin' | 'auto';

type Preset = {
  name: string;
  width: 8 | 16 | 32;
  poly: number;
  init: number;
  refin: boolean;
  refout: boolean;
  xorout: number;
  notes?: string;
};

const PRESETS: Preset[] = [
  // CRC-8 family
  { name: 'CRC-8/AUTOSAR', width: 8, poly: 0x2F, init: 0xFF, refin: false, refout: false, xorout: 0xFF },
  { name: 'CRC-8/BLUETOOTH', width: 8, poly: 0xA7, init: 0x00, refin: true, refout: true, xorout: 0x00 },
  { name: 'CRC-8/CDMA2000', width: 8, poly: 0x9B, init: 0xFF, refin: false, refout: false, xorout: 0x00 },
  { name: 'CRC-8/DARC', width: 8, poly: 0x39, init: 0x00, refin: true, refout: true, xorout: 0x00 },
  { name: 'CRC-8/DVB-S2', width: 8, poly: 0xD5, init: 0x00, refin: false, refout: false, xorout: 0x00 },
  { name: 'CRC-8/GSM-A', width: 8, poly: 0x1D, init: 0x00, refin: false, refout: false, xorout: 0x00 },
  { name: 'CRC-8/GSM-B', width: 8, poly: 0x49, init: 0x00, refin: false, refout: false, xorout: 0xFF },
  { name: 'CRC-8/HITAG', width: 8, poly: 0x1D, init: 0xFF, refin: false, refout: false, xorout: 0x00 },
  { name: 'CRC-8/I-432-1', width: 8, poly: 0x07, init: 0x00, refin: false, refout: false, xorout: 0x55 }, // CRC-8/ITU
  { name: 'CRC-8/I-CODE', width: 8, poly: 0x1D, init: 0xFD, refin: false, refout: false, xorout: 0x00 },
  { name: 'CRC-8/LTE', width: 8, poly: 0x9B, init: 0x00, refin: false, refout: false, xorout: 0x00 },
  { name: 'CRC-8/MAXIM', width: 8, poly: 0x31, init: 0x00, refin: true, refout: true, xorout: 0x00 }, // DOW-CRC
  { name: 'CRC-8/MIFARE-MAD', width: 8, poly: 0x1D, init: 0xC7, refin: false, refout: false, xorout: 0x00 },
  { name: 'CRC-8/NRSC-5', width: 8, poly: 0x31, init: 0xFF, refin: false, refout: false, xorout: 0x00 },
  { name: 'CRC-8/OPENSAFETY', width: 8, poly: 0x2F, init: 0x00, refin: false, refout: false, xorout: 0x00 },
  { name: 'CRC-8/ROHC', width: 8, poly: 0x07, init: 0xFF, refin: true, refout: true, xorout: 0x00 },
  { name: 'CRC-8/SAE-J1850', width: 8, poly: 0x1D, init: 0xFF, refin: false, refout: false, xorout: 0xFF },
  { name: 'CRC-8/SMBUS', width: 8, poly: 0x07, init: 0x00, refin: false, refout: false, xorout: 0x00 }, // CRC-8-CCITT
  { name: 'CRC-8/TECH-3250', width: 8, poly: 0x1D, init: 0xFF, refin: true, refout: true, xorout: 0x00 }, // CRC-8/AES, CRC-8/EBU
  { name: 'CRC-8/WCDMA', width: 8, poly: 0x9B, init: 0x00, refin: true, refout: true, xorout: 0x00 },

  // CRC-16 family
  { name: 'CRC-16/ARC', width: 16, poly: 0x8005, init: 0x0000, refin: true, refout: true, xorout: 0x0000 },
  { name: 'CRC-16/CDMA2000', width: 16, poly: 0xC867, init: 0xFFFF, refin: false, refout: false, xorout: 0x0000 },
  { name: 'CRC-16/CMS', width: 16, poly: 0x8005, init: 0xFFFF, refin: false, refout: false, xorout: 0x0000 },
  { name: 'CRC-16/DDS-110', width: 16, poly: 0x8005, init: 0x800D, refin: false, refout: false, xorout: 0x0000 },
  { name: 'CRC-16/DECT-R', width: 16, poly: 0x0589, init: 0x0000, refin: false, refout: false, xorout: 0x0001 },
  { name: 'CRC-16/DECT-X', width: 16, poly: 0x0589, init: 0x0000, refin: false, refout: false, xorout: 0x0000 },
  { name: 'CRC-16/DNP', width: 16, poly: 0x3D65, init: 0x0000, refin: true, refout: true, xorout: 0xFFFF },
  { name: 'CRC-16/EN-13757', width: 16, poly: 0x3D65, init: 0x0000, refin: false, refout: false, xorout: 0xFFFF },
  { name: 'CRC-16/GENIBUS', width: 16, poly: 0x1021, init: 0xFFFF, refin: false, refout: false, xorout: 0xFFFF },
  { name: 'CRC-16/GSM', width: 16, poly: 0x1021, init: 0x0000, refin: false, refout: false, xorout: 0xFFFF },
  { name: 'CRC-16/IBM-3740', width: 16, poly: 0x1021, init: 0xFFFF, refin: false, refout: false, xorout: 0x0000 },
  { name: 'CRC-16/IBM-SDLC', width: 16, poly: 0x1021, init: 0xFFFF, refin: true, refout: true, xorout: 0xFFFF },
  { name: 'CRC-16/ISO-IEC-14443-3-A', width: 16, poly: 0x1021, init: 0xC6C6, refin: true, refout: true, xorout: 0x0000 },
  { name: 'CRC-16/KERMIT', width: 16, poly: 0x1021, init: 0x0000, refin: true, refout: true, xorout: 0x0000 },
  { name: 'CRC-16/LJ1200', width: 16, poly: 0x6F63, init: 0x0000, refin: false, refout: false, xorout: 0x0000 },
  { name: 'CRC-16/M17', width: 16, poly: 0x5935, init: 0xFFFF, refin: false, refout: false, xorout: 0x0000 },
  { name: 'CRC-16/MAXIM-DOW', width: 16, poly: 0x8005, init: 0x0000, refin: true, refout: true, xorout: 0xFFFF },
  { name: 'CRC-16/MCRF4XX', width: 16, poly: 0x1021, init: 0xFFFF, refin: true, refout: true, xorout: 0x0000 },
  { name: 'CRC-16/MODBUS', width: 16, poly: 0x8005, init: 0xFFFF, refin: true, refout: true, xorout: 0x0000 },
  { name: 'CRC-16/NRSC-5', width: 16, poly: 0x080B, init: 0xFFFF, refin: true, refout: true, xorout: 0x0000 },
  { name: 'CRC-16/OPENSAFETY-A', width: 16, poly: 0x5935, init: 0x0000, refin: false, refout: false, xorout: 0x0000 },
  { name: 'CRC-16/OPENSAFETY-B', width: 16, poly: 0x755B, init: 0x0000, refin: false, refout: false, xorout: 0x0000 },
  { name: 'CRC-16/PROFIBUS', width: 16, poly: 0x1DCF, init: 0xFFFF, refin: false, refout: false, xorout: 0xFFFF },
  { name: 'CRC-16/RIELLO', width: 16, poly: 0x1021, init: 0xB2AA, refin: true, refout: true, xorout: 0x0000 },
  { name: 'CRC-16/SPI-FUJITSU', width: 16, poly: 0x1021, init: 0x1D0F, refin: false, refout: false, xorout: 0x0000 },
  { name: 'CRC-16/T10-DIF', width: 16, poly: 0x8BB7, init: 0x0000, refin: false, refout: false, xorout: 0x0000 },
  { name: 'CRC-16/TELEDISK', width: 16, poly: 0xA097, init: 0x0000, refin: false, refout: false, xorout: 0x0000 },
  { name: 'CRC-16/TMS37157', width: 16, poly: 0x1021, init: 0x89EC, refin: true, refout: true, xorout: 0x0000 },
  { name: 'CRC-16/UMTS', width: 16, poly: 0x8005, init: 0x0000, refin: false, refout: false, xorout: 0x0000 },
  { name: 'CRC-16/USB', width: 16, poly: 0x8005, init: 0xFFFF, refin: true, refout: true, xorout: 0xFFFF },
  { name: 'CRC-16/XMODEM', width: 16, poly: 0x1021, init: 0x0000, refin: false, refout: false, xorout: 0x0000 },

  // CRC-32 family
  { name: 'CRC-32/AIXM', width: 32, poly: 0x814141AB, init: 0x00000000, refin: false, refout: false, xorout: 0x00000000 },
  { name: 'CRC-32/AUTOSAR', width: 32, poly: 0xF4ACFB13, init: 0xFFFFFFFF, refin: true, refout: true, xorout: 0xFFFFFFFF },
  { name: 'CRC-32/BASE91-D', width: 32, poly: 0xA833982B, init: 0xFFFFFFFF, refin: true, refout: true, xorout: 0xFFFFFFFF },
  { name: 'CRC-32/BZIP2', width: 32, poly: 0x04C11DB7, init: 0xFFFFFFFF, refin: false, refout: false, xorout: 0xFFFFFFFF },
  { name: 'CRC-32/CD-ROM-EDC', width: 32, poly: 0x8001801B, init: 0x00000000, refin: true, refout: true, xorout: 0x00000000 },
  { name: 'CRC-32/CKSUM', width: 32, poly: 0x04C11DB7, init: 0x00000000, refin: false, refout: false, xorout: 0xFFFFFFFF },
  { name: 'CRC-32/ISCSI', width: 32, poly: 0x1EDC6F41, init: 0xFFFFFFFF, refin: true, refout: true, xorout: 0xFFFFFFFF },
  { name: 'CRC-32/ISO-HDLC', width: 32, poly: 0x04C11DB7, init: 0xFFFFFFFF, refin: true, refout: true, xorout: 0xFFFFFFFF },
  { name: 'CRC-32/JAMCRC', width: 32, poly: 0x04C11DB7, init: 0xFFFFFFFF, refin: true, refout: true, xorout: 0x00000000 },
  { name: 'CRC-32/MEF', width: 32, poly: 0x741B8CD7, init: 0xFFFFFFFF, refin: true, refout: true, xorout: 0x00000000 },
  { name: 'CRC-32/MPEG-2', width: 32, poly: 0x04C11DB7, init: 0xFFFFFFFF, refin: false, refout: false, xorout: 0x00000000 },
  { name: 'CRC-32/STM32 (HW unit)', width: 32, poly: 0x04C11DB7, init: 0xFFFFFFFF, refin: false, refout: false, xorout: 0x00000000 },
  { name: 'CRC-32/XFER', width: 32, poly: 0x000000AF, init: 0x00000000, refin: false, refout: false, xorout: 0x00000000 },
];

function clamp(n: number, min: number, max: number) { return Math.min(Math.max(n, min), max); }
function maskForWidth(width: number) { return width >= 32 ? 0xFFFFFFFF >>> 0 : ((1 << width) - 1) >>> 0; }

function reflectBits(v: number, width: number) {
  let x = 0 >>> 0;
  for (let i = 0; i < width; i++) { x = (x << 1) | (v & 1); v >>>= 1; }
  return x >>> 0;
}

function detectDataMode(s: string): Exclude<DataMode, 'auto'> {
  const t = (s || '').trim();
  if (!t) return 'hex';
  const onlyHex = /^[0-9a-fA-F\s]+$/.test(t) && /[0-9a-fA-F]/.test(t);
  const onlyBin = /^[01\s]+$/.test(t) && /[01]/.test(t);
  if (onlyBin) return 'bin';
  if (onlyHex && t.replace(/\s+/g, '').length % 2 === 0) return 'hex';
  return 'ascii';
}

function parseData(input: string, mode: DataMode): Uint8Array {
  const s = (input || '').trim();
  if (!s) return new Uint8Array();
  if (mode === 'hex') {
    const hex = s.replace(/[^0-9a-fA-F]/g, '');
    const out = new Uint8Array(Math.ceil(hex.length / 2));
    for (let i = 0; i < out.length; i++) {
      const byte = hex.substr(i * 2, 2);
      out[i] = parseInt(byte.padEnd(2, '0'), 16) & 0xFF;
    }
    return out;
  } else if (mode === 'bin') {
    const bits = s.replace(/[^01]/g, '');
    const out = new Uint8Array(Math.ceil(bits.length / 8));
    for (let i = 0; i < bits.length; i++) {
      const b = bits.charCodeAt(i) - 48; // '0'->0, '1'->1
      const byteIndex = Math.floor(i / 8);
      const bitIndex = 7 - (i % 8);
      out[byteIndex] |= (b & 1) << bitIndex;
    }
    return out;
  } else {
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xFF;
    return out;
  }
}

function stm32PackWords(data: Uint8Array): Uint8Array {
  const out = new Uint8Array(data.length);
  let i = 0, o = 0;
  // Swap bytes inside each full 32-bit word (little-endian packing)
  while (i + 4 <= data.length) {
    out[o++] = data[i + 3];
    out[o++] = data[i + 2];
    out[o++] = data[i + 1];
    out[o++] = data[i + 0];
    i += 4;
  }
  // Copy remaining tail bytes (1..3) as-is
  while (i < data.length) out[o++] = data[i++];
  return out;
}

function crcCompute(data: Uint8Array, width: number, poly: number, init: number, refin: boolean, refout: boolean, xorout: number, step?: boolean) {
  const topbit = 1 << (width - 1);
  const mask = maskForWidth(width);
  let reg = init & mask;
  const steps: { index: number; in: number; crc: number }[] = [];

  if (refin) {
    // reflected algorithm (LSB-first)
    const polyRef = reflectBits(poly, width) & mask;
    for (let i = 0; i < data.length; i++) {
      reg ^= data[i] & 0xFF;
      for (let b = 0; b < 8; b++) {
        const lsb = reg & 1;
        reg >>>= 1;
        if (lsb) reg ^= polyRef;
      }
      reg &= mask;
      if (step) steps.push({ index: i, in: data[i], crc: reg >>> 0 });
    }
  } else {
    // normal algorithm (MSB-first)
    for (let i = 0; i < data.length; i++) {
      reg ^= (data[i] & 0xFF) << (width - 8);
      for (let b = 0; b < 8; b++) {
        const msb = reg & topbit;
        reg = (reg << 1) & mask;
        if (msb) reg ^= poly;
      }
      reg &= mask;
      if (step) steps.push({ index: i, in: data[i], crc: reg >>> 0 });
    }
  }

  let out = reg & mask;
  if (!refin && refout) {
    // Apply final reflection only for MSB-first processing.
    // For LSB-first (refin=true) the register already holds the reflected remainder.
    out = reflectBits(out, width) & mask;
  }
  out = (out ^ xorout) & mask;
  return { crc: out >>> 0, steps };
}

function genLUT(width: number, poly: number, refin: boolean): number[] {
  const mask = maskForWidth(width);
  const table: number[] = new Array(256).fill(0);
  if (refin) {
    const polyRef = reflectBits(poly, width) & mask;
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = (c & 1) ? (polyRef ^ (c >>> 1)) : (c >>> 1);
      table[i] = c & mask;
    }
  } else {
    const topbit = 1 << (width - 1);
    for (let i = 0; i < 256; i++) {
      let c = i << (width - 8);
      for (let j = 0; j < 8; j++) c = (c & topbit) ? ((c << 1) ^ poly) : (c << 1);
      table[i] = c & mask;
    }
  }
  return table;
}

function toHex(crc: number, width: number) {
  const digits = Math.ceil(width / 4);
  return '0x' + crc.toString(16).toUpperCase().padStart(digits, '0');
}

function cArray(name: string, arr: number[], cType: string) {
  const lines: string[] = [];
  for (let i = 0; i < arr.length; i += 8) lines.push('  ' + arr.slice(i, i + 8).map(v => '0x' + v.toString(16).toUpperCase()).join(', ') + (i + 8 >= arr.length ? '' : ','));
  return `static const ${cType} ${name}[${arr.length}] = {\n${lines.join('\n')}\n};`;
}

function cCodeSnippet(name: string, width: number, poly: number, init: number, refin: boolean, refout: boolean, xorout: number, useLut: boolean) {
  const ctype = width <= 8 ? 'uint8_t' : width <= 16 ? 'uint16_t' : 'uint32_t';
  const maskHex = toHex(maskForWidth(width), width);
  let lut = '';
  if (useLut) {
    const table = genLUT(width, poly, refin);
    lut = cArray(`${name}_table`, table, ctype) + '\n\n';
  }
  const func = refin ? `
${lut}${ctype} ${name}(const uint8_t* data, size_t len) {
  ${ctype} reg = ${toHex(init, width)};
  ${ctype} poly = ${toHex(reflectBits(poly, width), width)}; // reflected poly
  for (size_t i=0;i<len;i++) {
${useLut ? `    reg = (${ctype})(${name}_table[(reg ^ data[i]) & 0xFF] ^ (reg >> 8));` : `    reg ^= data[i];
    for (int b=0;b<8;b++){ ${ctype} lsb = reg & 1; reg >>= 1; if (lsb) reg ^= poly; }`}
  }
  ${ctype} out = reg;
  ${refout ? `// refout=true, already LSB-first state` : `// refout=false
  // reflect to MSB-first width
  out = ( ${ctype} )(${ctype})(${ctype})(${ctype})(${ctype})0; // no-op placeholder`}
  out ^= ${toHex(xorout, width)};
  return (${ctype})(out & ${maskHex});
}` : `
${lut}${ctype} ${name}(const uint8_t* data, size_t len) {
  ${ctype} reg = ${toHex(init, width)};
  ${ctype} poly = ${toHex(poly, width)};
  for (size_t i=0;i<len;i++) {
${useLut ? `    reg = (${ctype})(${name}_table[((reg >> ${width - 8}) ^ data[i]) & 0xFF] ^ (reg << 8));` : `    reg ^= ((${ctype})data[i]) << ${width - 8};
    for (int b=0;b<8;b++){ ${ctype} msb = reg & ${toHex(1 << (width - 1), width)}; reg <<= 1; if (msb) reg ^= poly; reg &= ${maskHex}; }`}
    reg &= ${maskHex};
  }
  ${ctype} out = ${refout ? `/* reflect output */ 0 /* reflect at callsite if needed */` : `reg`};
  out ^= ${toHex(xorout, width)};
  return (${ctype})(out & ${maskHex});
}`;
  return func;
}

export default function CrcTab() {
  const [presetName, setPresetName] = useState<string>(PRESETS[0].name);
  const preset = useMemo(() => PRESETS.find(p => p.name === presetName) || PRESETS[0], [presetName]);

  // Add string states for UI interop
  const [widthStr, setWidthStr] = useState<string>(String(preset.width));

  const [width, setWidth] = useState<number>(preset.width);
  const [poly, setPoly] = useState<string>('0x' + preset.poly.toString(16).toUpperCase());
  const [init, setInit] = useState<string>('0x' + preset.init.toString(16).toUpperCase());
  const [refin, setRefin] = useState<boolean>(preset.refin);
  const [refout, setRefout] = useState<boolean>(preset.refout);
  const [xorout, setXorout] = useState<string>('0x' + preset.xorout.toString(16).toUpperCase());

  const [dataMode, setDataMode] = useState<DataMode>('hex');
  const [dataStr, setDataStr] = useState<string>('01 02 03 04');
  const [showSteps, setShowSteps] = useState<boolean>(false);
  const [useLut, setUseLut] = useState<boolean>(true);

  // Sync params on preset change
  useMemo(() => {
    setWidth(preset.width);
    setWidthStr(String(preset.width));
    setPoly('0x' + preset.poly.toString(16).toUpperCase());
    setInit('0x' + preset.init.toString(16).toUpperCase());
    setRefin(preset.refin);
    setRefout(preset.refout);
    setXorout('0x' + preset.xorout.toString(16).toUpperCase());
  }, [preset]);

  function parseHexAuto(s: string) {
    if (s.trim().toLowerCase().startsWith('0x')) return parseInt(s, 16) >>> 0;
    return parseInt(s, 16) >>> 0;
  }

  const widthParsed = useMemo(() => {
    const v = parseInt((widthStr || '').trim(), 10);
    return Number.isFinite(v) ? v : width;
  }, [widthStr, width]);

  const effectiveMode = useMemo(() => dataMode === 'auto' ? detectDataMode(dataStr) : dataMode, [dataMode, dataStr]);
  const bytesRaw = useMemo(() => parseData(dataStr, effectiveMode), [dataStr, effectiveMode]);
  const isSTM32 = presetName === 'CRC-32/STM32 (HW unit)';
  const [stm32Pack, setStm32Pack] = useState<'swap' | 'none'>('swap');
  const bytes = useMemo(() => (isSTM32 && stm32Pack === 'swap' ? stm32PackWords(bytesRaw) : bytesRaw), [bytesRaw, isSTM32, stm32Pack]);

  const bytesPreview = useMemo(() => Array.from(bytes).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' '), [bytes]);

  const params = useMemo(() => {
    const w = clamp(Math.floor(widthParsed), 1, 32);
    const p = parseHexAuto(poly) & maskForWidth(w);
    const i = parseHexAuto(init) & maskForWidth(w);
    const xo = parseHexAuto(xorout) & maskForWidth(w);
    return { w, p, i, xo };
  }, [widthParsed, poly, init, xorout]);

  const result = useMemo(() => {
    return crcCompute(bytes, params.w, params.p, params.i, refin, refout, params.xo, showSteps);
  }, [bytes, params, refin, refout, showSteps]);

  const crcHex = useMemo(() => toHex(result.crc, params.w), [result.crc, params.w]);
  const cCode = useMemo(() => cCodeSnippet('crc_calc', params.w, params.p, params.i, refin, refout, params.xo, useLut), [params, refin, refout, useLut]);

  const rowsMain = [
    { label: 'CRC (hex)', value: crcHex },
    { label: 'Width', value: `${params.w} bits` },
    { label: 'Bytes', value: String(bytes.length) },
    ...(isSTM32 ? [{ label: 'Data (parsed -> hex)', value: bytesPreview || '—' }] : []),
    { label: 'Test 123456789', value: toHex(crcCompute(parseData('123456789', 'ascii'), params.w, params.p, params.i, refin, refout, params.xo).crc, params.w) },
    ...(isSTM32 ? [{ label: 'STM32 mode', value: stm32Pack === 'swap' ? 'Per-word byte-swap applied' : 'No swap' }] : []),
  ];

  return (
    <div>
      <div class="grid cols-2">
        <div>
          <div class="grid cols-2">
            <Select
              label="Preset"
              value={presetName}
              onChange={setPresetName}
              options={PRESETS.map(p => ({ value: p.name, label: p.name }))}
            />
            <Select
              label="Data format"
              value={dataMode}
              onChange={(v) => setDataMode((v as any) || 'hex')}
              options={[
                { value: 'hex', label: 'HEX' },
                { value: 'auto', label: 'AUTO' },
                { value: 'ascii', label: 'ASCII' },
                { value: 'bin', label: 'BIN' },
              ]}
            />
          </div>
          {isSTM32 && (
            <Select
              label="STM32 byte packing"
              value={stm32Pack}
              onChange={(v) => setStm32Pack((v as 'swap' | 'none') || 'swap')}
              options={[
                { value: 'swap', label: 'Pack 32-bit LE (DD CC BB AA; tail as-is)' },
                { value: 'none', label: 'No swap (AA BB CC DD)' },
              ]}
            />
          )}

          <div class="grid cols-2">
            <Input label={<>Poly (MSB-first)</>} value={poly} onChange={setPoly} placeholder="0x04C11DB7" />
            <Input label="Init" value={init} onChange={setInit} placeholder="0xFFFFFFFF" />
          </div>

          <div class="grid cols-3">
            <Select label="RefIn" value={refin ? 'true' : 'false'} onChange={(v) => setRefin(v === 'true')} options={[{ value: 'false', label: 'false' }, { value: 'true', label: 'true' }]} />
            <Select label="RefOut" value={refout ? 'true' : 'false'} onChange={(v) => setRefout(v === 'true')} options={[{ value: 'false', label: 'false' }, { value: 'true', label: 'true' }]} />
            <Input label="XorOut" value={xorout} onChange={setXorout} placeholder="0x00000000" />
          </div>

          <Input label="Data" value={dataStr} onChange={setDataStr} placeholder="01 02 03 04" />
        </div>
        <ResultCard rows={[...rowsMain]} />
      </div>
      <br />
      <CodeSample
        title="C code"
        language="c"
        code={cCode}
        highlight
        copyable
      />
    </div>
  );
}
