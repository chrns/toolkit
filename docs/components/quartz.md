# Quartz crystal load network

- $C_L$: target load capacitance specified in the crystal datasheet (e.g., 10 pF)
- $C_s$: stray/board capacitance (pads, traces, package, probe, etc.), excluding the explicit pin caps below
- $C_{IN}$, $C_{OUT}$: parasitic pin capacitances on the MCU/oscillator pins (XTAL_IN / XTAL_OUT)
- $C_1$, $C_2$: external load capacitors you choose
- $K_{ppm}$: frequency sensitivity (ppm per +1 pF) around the specified $C_L$ from the crystal datasheet

**Effective load seen by the crystal**

For a standard two-capacitor load network, the effective load capacitance is the series combination of the two legs, plus the stray capacitance:

```math
C_{\text{load}} \;=\; \frac{C_{1,\text{eff}}\;C_{2,\text{eff}}}{C_{1,\text{eff}}+C_{2,\text{eff}}}\;+\;C_s,
```

where the effective leg capacitors include the pin parasitics:

```math
C_{1,\text{eff}} = C_1 + C_{\text{IN}},\qquad
C_{2,\text{eff}} = C_2 + C_{\text{OUT}}.
```

## Symmetric case (no pin imbalance)

If you ignore pin imbalance (or set both to zero) and target a symmetric solution $C_1 = C_2 = C$, then:

```math
C_{\text{load}} = \frac{C}{2} + C_s.
```

To meet the datasheet target $C_{load} = C_L$, solve for $C$:

```math
C \;=\; 2\,(C_L - C_s)
```

In code this is the $Ceq$ line:

```math
Ceq = 2 * (C_L - C_s)
```

After computing, the value is snapped to the nearest E-series part (E192 in the symmetric display).

**Asymmetric case (different pin parasitics)**

When $C_{IN} \neq C_{OUT}$, the most practical approach is to make the effective legs equal to the same symmetric target $S_{target} = 2\,(C_L - C_s)$,
then back out the external parts:

```math
C_1 = S_{\text{target}} - C_{\text{IN}},\qquad
C_2 = S_{\text{target}} - C_{\text{OUT}}.
```

These are then rounded to E-series (E24 in the UI), and we recompute $C_{load}$ with the rounded values to see the residual error.

⸻

## Frequency error from load-capacitance mismatch

Crystals exhibit a (local) pullability around their specified load $C_L$. Datasheets often quote a sensitivity like “$\alpha$ ppm per +1 pF” near $C_L$. Using the user-provided slope $K_{ppm}$:

**Compute the capacitance error:**

```math
\Delta C = C_{\text{load}} - C_L,
\qquad
\Delta C_{\text{pF}} = \frac{\Delta C}{1\text{ pF}}.
```

**Convert to frequency error in ppm:**

```math
\Delta f_{\text{ppm}} \;\approx\; K_{\text{ppm}} \cdot \Delta C_{\text{pF}}.
```

(Optionally, $\Delta f \,[\text{Hz}] \approx f_0 \cdot \Delta f_{\text{ppm}}/10^6$ for a nominal frequency $f_0$. In the code this line is present but commented out.)

This ppm estimate is linearized: it’s valid for small deviations around $C_L$ and for the specific crystal cut and motional parameters implied by the datasheet’s slope.

## Practical notes & assumptions

- The model assumes a parallel-resonant crystal specified at $C_L$.
- $C_s$ (stray) is the board-level overhead excluding the explicit pin parasitics (which are entered separately as $C_{IN}$, $C_{OUT}$).
- The “E-series” rounding shows a realistic BOM pick and then recomputes the achieved $C_{load}$ and the resulting ppm error.
- The ppm-per-pF slope is datasheet-specific and local to $C_L$; for large $|\Delta C|$ the relationship becomes non-linear.
- Temperature, aging, drive level, and motional resistance effects are not included here.
