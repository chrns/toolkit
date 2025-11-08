# Switching Converter

This calculator auto-detects the topology from your inputs and computes the key sizing values for the inductor and output filter.

> **Auto-detect rule**
>
> - $V_{out} < 0$ — **Inverting (buck-boost)**
> - $V_{out} ≥ 0$ and $V_{out} > V_{in}$ — **Boost**
> - otherwise — **Buck**

**Inputs**

- $V_{in}$ — input voltage  
- $V_{out}$ — desired output voltage (negative for inverting)  
- $V_d$ — diode forward drop (V)  
- $V_t$ — switch (transistor) drop when ON (V)  
- $f$ — switching frequency (Hz)  
- $I_{out}$ — load current (A)  
- **Either** $I_{out,min}$ (minimum load to stay CCM) **or** Ripple % (inductor ripple as % of average inductor current)  
  > If Ripple % is provided, the calculator sizes **L** to meet it.  
  > If $I_{out,min}$ is provided, the calculator sizes **L** so CCM holds down to that load.

**Key symbols**

- $D$ — duty cycle (0...1)  
- $I_{Lavg}$ — average inductor current  
- $ΔI_{L}$ — inductor ripple current (peak-to-peak)  
- $I_{pk} = I_{Lavg} + \Delta I_{L}/2$
- $I_{rms} = \sqrt{I_{Lavg}^2 + \Delta I_L^2 / 12}$  
- $L$ — inductance  
- Ripple % (output) = $100 \cdot \Delta I_L / I_{Lavg}$

## Buck (step-down)

**Duty cycle (with drops)**

```math
D = \frac{V_{out}+V_d}{V_{in}-V_t+V_d}
```

**Average inductor current**

```math
I_{L,avg} = I_{out}
```

**How we get $\Delta I_L$**

- If **Ripple%** is given:
  ```math
  \Delta I_L = \frac{\text{Ripple\%}}{100}\; I_{L,avg}
  ```
- If **$I_{out,min}$** is given (CCM boundary):
  ```math
  \Delta I_L = 2\,I_{out,min}
  ```

**Inductance**

```math
L = \frac{(V_{in}-V_t - V_{out}) D}{\,\Delta I_L f}
```

**Currents**

```math
I_{pk} = I_{L,avg}+\frac{\Delta I_L}{2},\quad
I_{rms} = \sqrt{\,I_{L,avg}^2 + \frac{(\Delta I_L)^2}{12}\,}
```

**Output capacitor from a target voltage ripple $\Delta V_{out,pp}$**

```math
C_{out} \approx \frac{\Delta I_L}{\,8 f\, \Delta V_{out,pp}}
```

## Boost (step-up)

**Duty cycle (with drops)**

```math
D = 1 - \frac{V_{in}-V_t}{V_{out}+V_d}
```

**Average inductor current (ideal power balance)**

```math
I_{L,avg} = I_{in} = \frac{V_{out}\, I_{out}}{V_{in}}
```

**How we get $\Delta I_L$**

- If **Ripple%** is given:
  ```math
  \Delta I_L = \frac{\text{Ripple\%}}{100}\; I_{L,avg}
  ```
- If **$I_{out,min}$** is given (CCM boundary):
  ```math
  \Delta I_L = 2\, I_{out,min}\, \frac{D}{1 - D}
  ```

**Inductance**

```math
L = \frac{(V_{in}-V_t)\; D}{\,\Delta I_L\, f}
```

**Currents**

```math
I_{pk} = I_{L,avg}+\frac{\Delta I_L}{2},\quad
I_{rms} = \sqrt{\,I_{L,avg}^2 + \frac{(\Delta I_L)^2}{12}\,}
```

**(Optional) Output capacitor from a target voltage ripple $\Delta V_{out,pp}$**

```math
C_{out} \approx \frac{I_{out}\, D}{\,f\, \Delta V_{out,pp}}
```


## Inverting (buck-boost)

Let $V_{o} = |V_{out}|$ (use magnitude in formulas; the output is negative).

**Duty cycle (with drops)**

```math
D = \frac{V_o + V_d}{V_{in} - V_t + V_o + V_d}
```

($V_{out}=-V_o$)

**Average inductor current (ideal power balance)**

```math
I_{L,avg} \approx \frac{V_o I_{out}}{V_{in}}
```

**How we get $\Delta I_L$**

- If **Ripple%** is given:
  ```math
  \Delta I_L = \frac{\text{Ripple\%}}{100}\; I_{L,avg}
  ```
- If **$I_{out,min}$** is given (CCM boundary):
  ```math
  \Delta I_L = 2\, I_{out,min}\, \frac{V_{in}}{V_o}
  ```

**Inductance**

```math
L = \frac{(V_{in}-V_t)\; D}{\,\Delta I_L\, f}
```

**Currents**

```math
I_{pk}=I_{L,avg}+\frac{\Delta I_L}{2}
\qquad
I_{rms}=\sqrt{I_{L,avg}^2+\frac{(\Delta I_L)^2}{12}}
```

**Output capacitor from a target voltage ripple $\Delta V_{out,pp}$**

```math
C_{out} \approx \frac{I_{out}\, D}{\,f\, \Delta V_{out,pp}}
```

## Practical checks

- **Inductor saturation:** choose $I_{sat} > I_{pk}$ with margin
- **Thermal & conduction losses:** not covered in these ideal equations; include $R_{DS(on)}$, winding resistance, and diode loss when refining the design
- **Real voltage ripple ($V_{pp}$):** requires $C_{out}$, ESR, and $f$ (see optional formulas above)

## References:

- TI [AN-1197](https://www.ti.com/lit/an/slva477b/slva477b.pdf) — Buck Switching Converter Design Equations
- TI [AN-1198](https://www.ti.com/lit/an/snva021b/snva021b.pdf) — Boost Converter Design Equations
- TI [SNVA021B](https://www.ti.com/lit/an/slva372d/slva372d.pdf) — Basic Calculation of a Boost Converter’s Power Stage
- TI [SLVA630A](https://www.ti.com/lit/an/slva630a/slva630a.pdf) — Output Ripple Voltage for Buck/Boost Switching Regulators
- TI [SNVA559C](https://www.ti.com/lit/an/snva559c/snva559c.pdf) — Switching Regulator Fundamentals
