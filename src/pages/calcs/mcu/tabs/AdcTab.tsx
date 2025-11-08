import { useState } from 'preact/hooks';
import { Input } from '@/ui/components/Input';
import { ResultCard } from '@/ui/components/ResultCard';
import { formatSI, parseSI } from '@/lib/si';
import { analyzeFromCodes, cinRange, sampleAdcData } from '@/lib/adc';
import { TextArea } from '@/ui/components/TextArea';
import { parseSamples } from '@/lib/utils';
import { Select } from '@/ui/components/Select';
import { resistancePlaceholder } from '@/pages/calcs/shared';

const defaultResolution: string = '12';
const placeholderResulution: string = defaultResolution;
const defaultRefVoltage: string = '3.3';
const placeholderRefVoltage: string = defaultRefVoltage;
const defaultRExt: string = '50k';
const placeholderRExt: string = defaultRExt;
const defaultClock: string = '8M';
const placeholderClock: string = defaultClock;
const defaultCap: string = '5p';
const placeholderCap: string = defaultCap;
const defaultJitter: string = '40p';

function renderHint(params: {
  snrClk_dB: number;
  sigSnr_dB: number;
  sigSinad_dB: number;
  Pn: number;
  Pharm: number;
  sigFreq_Hz: number;
  osr: number;
}) {
  const { snrClk_dB, sigSnr_dB, sigSinad_dB, Pn, Pharm } = params;
  const bullets: string[] = [];

  // noise vs distortion dominance
  if (Pn > Pharm * 1.6 || Math.abs(sigSinad_dB - sigSnr_dB) < 1.5) {
    bullets.push("Noise-limited: improve Vref/VDDA decoupling, average more (increase OSR), and drive the ADC at -3…-6 dBFS RMS.");
  }
  if (Pharm > Pn * 1.6 || (sigSnr_dB - sigSinad_dB) > 3) {
    bullets.push("Distortion-limited: check input driver linearity, acquisition time (t_acq), input RC/buffer cap, and VREF integrity. Keep level below clipping.");
  }
  if (snrClk_dB - sigSinad_dB < 3) {
    bullets.push("Jitter-limited near the current f0: reduce f0 or sampling jitter (better clock), or move signal lower in frequency.");
  }
  if (bullets.length === 0) {
    bullets.push("Looks balanced: you can still gain a few dB by modest OSR and ensuring -3…-6 dBFS RMS.");
  }

  return (
    bullets.map((b, i) => (<>{b}</>))
  );
}

export function AdcTab() {
  const [refVoltValue, setRefVoltValue] = useState(defaultRefVoltage);
  const [resValue, setResValue] = useState(defaultResolution);
  const [clockValue, setClockValue] = useState(defaultClock);
  const [osrValue, setOsrValue] = useState('1');
  const [capValue, setCapValue] = useState(defaultCap);
  const [rSwValue, setRSwValue] = useState('2k');
  const [rExtValue, setRExtValue] = useState(defaultRExt);
  const [sigmaTValue, setSigmaTValue] = useState(defaultJitter);
  const [floorValue, setFloorValue] = useState('-70');
  const [thdValue, setThdValue] = useState('-73');
  const [sigFreqValue, setSigFreqValue] = useState('10k');
  const [sigVppValue, setSigVppValue] = useState('2');
  const [samplesText, setSamplesText] = useState(sampleAdcData.toString());

  // parse data
  const ref = parseSI(refVoltValue) ?? 0;
  const res = parseSI(resValue) ?? 0;
  const clock = parseSI(clockValue) ?? 1;
  const snrFloor = parseSI(floorValue) ?? 0;
  const csh = parseSI(capValue) ?? 0;
  const osr = parseSI(osrValue) ?? 0;
  const rSw = parseSI(rSwValue) ?? 0;
  const rExt = parseSI(rExtValue) ?? 0;
  const sigmaT = parseSI(sigmaTValue) ?? 0;
  const adcThd = parseSI(thdValue) ?? 0;
  const sigFreq = parseSI(sigFreqValue) ?? 0;
  const sigVpp = parseSI(sigVppValue) ?? 0;

  // Theoretical calculations
  const qStep: number = ref / Math.pow(2, res);
  const vFsRms: number = ref / (2 * Math.SQRT2), vSigRms = sigVpp / (2 * Math.SQRT2), lSig: number = 20 * Math.log10(vSigRms / vFsRms);
  const snrQ: number = 6.02 * res + 1.76 + lSig + 10 * Math.log10(osr);
  const fCross: number = Math.pow(10, -snrQ / 20) / (2 * Math.PI * sigmaT);
  const snrClk: number = -20 * Math.log10(2 * Math.PI * sigFreq * sigmaT);
  const snrEst = 10 * Math.log10(1 / (Math.pow(10, -snrQ / 10) + Math.pow(10, -snrClk / 10)) + Math.pow(10, -snrFloor / 10));
  const sinadEst = -10 * Math.log10(Math.pow(10, -snrEst / 10) + Math.pow(10, adcThd / 10));
  const tAcq: number = (rSw + rExt) * csh * Math.log(Math.pow(2, res + 1));
  const clk: number = 1 / clock;
  const cycles: number = tAcq / clk;
  const [cBufMin, cBufMax] = cinRange(rExt, sigFreq, csh, ref, res, 0.1, ref);

  // Analysing signal
  const samples = parseSamples(samplesText) ?? [];
  const N = samples.length;
  let sigSnr = 0, sigSinad = 0, sigEnob = 0, sigNoiseFloor = 0, sigThd = 0;
  let Pn_meas = 0, Pharm_meas = 0;

  if (N >= 8) {
    const r = analyzeFromCodes(samples, res);
    if (r) {
      sigSnr = r.SNR_dB;
      sigSinad = r.SINAD_dB;
      sigEnob = r.ENOB_bits;
      sigNoiseFloor = r.noiseFloor_dBFS_bin;
      sigThd = r.THD_dB;
      Pn_meas = r.Pn;
      Pharm_meas = r.Pharm;
    }
  }

  const theoreticalRows = [
    { label: <>LSB / SNR<sub>q</sub></>, value: formatSI(qStep, 'V', 2) + ' / ' + formatSI(snrQ, 'dB', 2) },
    { label: <>f<sub>cross</sub> / SNR<sub>clk</sub></>, value: formatSI(fCross, 'Hz', 2) + ' / ' + formatSI(snrClk, 'dB', 2) },
    { label: <>SNR<sub>est</sub> / SINAD<sub>est</sub></>, value: formatSI(snrEst, 'dB', 2) + ' / ' + formatSI(sinadEst, 'dB', 2) },
    { label: <>t<sub>acq</sub> / Cycles</>, value: formatSI(tAcq, 's', 2) + ' / ' + formatSI(cycles, '', 2) },
    { label: <>C<sub>buf</sub> range</>, value: formatSI(cBufMin, 'F', 2) + ' ... ' + formatSI(cBufMax, 'F', 2) },
  ];

  const realSignalRows = [
    { label: <>SNR</>, value: formatSI(sigSnr, 'dB', 2) }, // de-facto SNR
    { label: <>SINAD</>, value: formatSI(sigSinad, 'dB', 2) }, // de-facto SINAD
    { label: <>ENOB</>, value: formatSI(sigEnob, 'bits', 1) }, // de-facto ENOB
    { label: <>Noise floor</>, value: formatSI(sigNoiseFloor, 'dB', 2) }, // Noise floor
    { label: <>THD</>, value: formatSI(sigThd, 'dB', 2) },
  ];

  return (
    <div class="grid cols-2">
      <div>
        <div class="grid cols-2">
          <Input
            label="ADC reference voltage"
            value={refVoltValue}
            onChange={setRefVoltValue}
            suffix="V"
            placeholder={placeholderRefVoltage}
          />
          <Input
            label="ADC resolution"
            value={resValue}
            onChange={setResValue}
            suffix="bits"
            placeholder={placeholderResulution}
          />

          <Input
            label="ADC clock"
            value={clockValue}
            onChange={setClockValue}
            suffix='Hz'
            placeholder={placeholderClock}
          />
          <Select
            label="Oversampling"
            value={osrValue}
            onChange={(v) => setOsrValue((v as any) || 'x1')}
            options={[
              { value: '1', label: 'x1' },
              { value: '2', label: 'x2' },
              { value: '4', label: 'x4' },
              { value: '8', label: 'x8' },
              { value: '16', label: 'x16' },
              { value: '32', label: 'x32' },
              { value: '64', label: 'x64' },
              { value: '128', label: 'x128' },
              { value: '256', label: 'x256' },
            ]}
          />

          <Input
            label={<>C<sub>S/H</sub> capacitance</>}
            value={capValue}
            onChange={setCapValue}
            suffix="F"
            placeholder={placeholderCap}
          />
          <Input
            label={<>R<sub>SW</sub> resistance</>}
            value={rSwValue}
            onChange={setRSwValue}
            suffix="Ω"
            placeholder={resistancePlaceholder}
          />

          <Input
            label={<>R<sub>ext</sub> resistance</>}
            value={rExtValue}
            onChange={setRExtValue}
            suffix='Ω'
            placeholder={placeholderRExt}
          />
          <Input
            label="Clock jitter"
            value={sigmaTValue}
            onChange={setSigmaTValue}
            suffix='s'
            placeholder='40p'
          />

          <Input
            label="ADC's THD"
            value={thdValue}
            onChange={setThdValue}
            suffix='dBFS'
            placeholder='-70'
          />
          <Input
            label="Noise floor"
            value={floorValue}
            onChange={setFloorValue}
            suffix='dBFS'
            placeholder='-70'
          />

          <Input
            label="Input signal frequency"
            value={sigFreqValue}
            onChange={setSigFreqValue}
            suffix='Hz'
            placeholder='10k'
          />
          <Input
            label={<>Input signal V<sub>pp</sub></>}
            value={sigVppValue}
            onChange={setSigVppValue}
            suffix='V'
            placeholder='2'
          />
        </div>
        <hr />
        <TextArea
          label="Samples (comma/space/newline separated)"
          value={samplesText}
          onChange={setSamplesText}
          placeholder="e.g., 1023, 1050, 1070, ..."
          rows={8}
        />
      </div>
      <div>
        <ResultCard rows={[...theoreticalRows]} />
        <br />
        <ResultCard rows={[...realSignalRows]} />
        <br />
        <div class="hint">
          {renderHint({
            snrClk_dB: snrClk,
            sigSnr_dB: sigSnr,
            sigSinad_dB: sigSinad,
            Pn: Pn_meas,
            Pharm: Pharm_meas,
            sigFreq_Hz: sigFreq,
            osr
          })}
        </div>
      </div>
    </div >
  );
}
