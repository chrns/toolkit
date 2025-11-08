import { useMemo, useState } from "preact/hooks";
import { Input } from "@/ui/components/Input";
import { ResultCard } from "@/ui/components/ResultCard";
import { parseSI, formatSI } from "@/lib/si";
import { PinIcon } from "@/ui/icons/PinIcon";

function fmt(val: number, unit: "Ah" | "Wh") {
  if (!isFinite(val) || val <= 0) return "—";
  const s = formatSI(val, unit as any);
  return s;
}

export function MetricsTab() {
  const [Vn, setVn] = useState("22.2");
  const [capAh, setCapAh] = useState("5");
  const [capWh, setCapWh] = useState("111");
  const [ahFixed, setAhFixed] = useState(true);
  const [whFixed, setWhFixed] = useState(false);

  const solved = useMemo(() => {
    const V = parseSI(Vn) ?? 0;
    const Ah_in = parseSI(capAh) ?? 0;
    const Wh_in = parseSI(capWh) ?? 0;

    let Ah = Ah_in;
    let Wh = Wh_in;

    if (ahFixed) {
      Wh = V > 0 ? V * Ah_in : 0;
    } else if (whFixed) {
      Ah = V > 0 ? Wh_in / V : 0;
    } else {
      if (Ah_in > 0 && (Wh_in <= 0 || V === 0)) {
        Wh = V > 0 ? V * Ah_in : 0;
      } else if (Wh_in > 0 && (Ah_in <= 0 || V === 0)) {
        Ah = V > 0 ? Wh_in / V : 0;
      }
    }

    return { V, Ah, Wh };
  }, [Vn, capAh, capWh, ahFixed, whFixed]);

  const resultRow = useMemo(() => {
    if (ahFixed) {
      return { label: "Capacity (Wh)", value: fmt(solved.Wh, "Wh") };
    }
    if (whFixed) {
      return { label: "Capacity (Ah)", value: fmt(solved.Ah, "Ah") };
    }
    if (solved.Ah > 0) {
      return { label: "Capacity (Wh)", value: fmt(solved.Wh, "Wh") };
    }
    if (solved.Wh > 0) {
      return { label: "Capacity (Ah)", value: fmt(solved.Ah, "Ah") };
    }
    return { label: "Capacity", value: "—" };
  }, [ahFixed, whFixed, solved.Ah, solved.Wh]);

  return (
    <div class="grid cols-2">
      <div class="grid">
        <Input
          label="Nominal voltage"
          value={Vn}
          onChange={setVn}
          suffix="V"
        />

        <Input
          label="Capacity"
          value={capAh}
          onChange={setCapAh}
          isFixed={whFixed}
          onToggleFix={() => {
            setAhFixed(true);
            setWhFixed(false);
          }}
          fixedContent={<PinIcon />}
          disabled={whFixed}
          suffix="Ah"
          placeholder="e.g. 2.5"
        />

        <Input
          label="Capacity"
          value={capWh}
          onChange={setCapWh}
          isFixed={ahFixed}
          onToggleFix={() => {
            setWhFixed(true);
            setAhFixed(false);
          }}
          fixedContent={<PinIcon />}
          disabled={ahFixed}
          suffix="Wh"
          placeholder="e.g. 9.25"
        />
      </div>

      <ResultCard
        rows={[
          resultRow,
        ]}
      />
    </div>
  );
}
