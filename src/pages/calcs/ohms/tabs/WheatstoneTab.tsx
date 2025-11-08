import { parseSI, formatSI } from "@/lib/si";
import { Input } from "@/ui/components/Input";
import { ResultCard } from "@/ui/components/ResultCard";
import { useState } from "preact/hooks";
import { defaultResistance, defaultVoltage, resistancePlaceholder, voltagePlaceholder } from '@/pages/calcs/shared';
import { getWheatstoneOutputVoltage, getWheatstoneRx } from "@/lib/solvers";
import { QuestionMarkIcon } from "@/ui/icons/QuesionMarkIcon";


export function WheatstoneTab() {
  const [Vin, setVin] = useState(defaultVoltage);
  const [R1, setR1] = useState(defaultResistance);
  const [R2, setR2] = useState(defaultResistance);
  const [R3, setR3] = useState(defaultResistance);
  const [RX, setRX] = useState(defaultResistance);
  const [VB, setVB] = useState('-133m');
  const [isRxMode, setRxMode] = useState(true);
  const toggleMode = () => { setRxMode(!isRxMode) };

  const vin = parseSI(Vin) ?? 0, vb = parseSI(VB) ?? 0;
  const r1 = parseSI(R1) ?? 0, r2 = parseSI(R2) ?? 0, r3 = parseSI(R3) ?? 0, rx = parseSI(RX) ?? 0;

  const req = (r1 + r2) * (r3 + rx) / (r1 + r2 + r3 + rx);
  const ileak = vin / req;

  const rows = [
    !isRxMode
      ? { label: <><>V<sub>bridge</sub></></>, value: formatSI(getWheatstoneOutputVoltage(vin, r1, r2, r3, rx), 'V', 5) }
      : { label: <><>R<sub>x</sub></></>, value: formatSI(getWheatstoneRx(vin, r1, r2, r3, vb), 'Ω', 5) },
    { label: <><>I<sub>q</sub></></>, value: formatSI(ileak, 'A', 2) },
  ];


  return (
    <div class="grid cols-2">
      <div>
        <div class="grid cols-2">
          <Input label={<>V<sub>in</sub></>} value={Vin} onChange={setVin} suffix="V" placeholder={voltagePlaceholder} />
          <Input label={<>R<sub>1</sub></>} value={R1} onChange={setR1} suffix="Ω" placeholder={resistancePlaceholder} />
          <Input label={<>R<sub>2</sub></>} value={R2} onChange={setR2} suffix="Ω" placeholder={resistancePlaceholder} />
          <Input label={<>R<sub>3</sub></>} value={R3} onChange={setR3} suffix="Ω" placeholder={resistancePlaceholder} />
        </div>

        <div class="grid cols-2">
          <Input
            label={<>R<sub>x</sub></>}
            value={RX} onChange={setRX}
            suffix="Ω"
            isFixed={isRxMode}
            onToggleFix={toggleMode}
            disabled={isRxMode}
            fixedContent={<QuestionMarkIcon />}
            placeholder={resistancePlaceholder} />
          <Input
            label={<>V<sub>bridge</sub></>}
            value={VB} onChange={setVB}
            suffix="V"
            isFixed={!isRxMode}
            onToggleFix={toggleMode}
            disabled={!isRxMode}
            fixedContent={<QuestionMarkIcon />}
            placeholder={voltagePlaceholder} />
        </div>

      </div>
      <ResultCard rows={[...rows]} />
    </div>
  );
}