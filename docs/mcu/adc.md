# ADC

This help page summarizes the formulas and terminology used in the calculator and explains how to run measurements correctly. It covers **ideal estimates** (quantization, jitter, noise floor, ADC-internal distortion) and **measured metrics** (SNR, SINAD, ENOB, THD) from real data.

> **Notation.**
>
> $V_\mathrm{FS}$ — full‑scale **peak‑to‑peak** input range of the ADC;
>
> $V_{\mathrm{FS,rms}}=\dfrac{V_\mathrm{FS}}{2\sqrt2}$ — RMS of a full‑scale sine;
>
> $\Delta=\dfrac{V_\mathrm{FS}}{2^N}$ — LSB size (volts per code).

## Signal‑to‑Noise Ratio (estimate)

The calculator combines independent noise mechanisms in **power**:

```math
\mathrm{SNR}_{\mathrm{tot}} = 10 \log_{10}\!\left(\frac{1}{10^{-\mathrm{SNR}_\mathrm{q}/10} + 10^{-\mathrm{SNR}_\mathrm{clk}/10} + 10^{-\mathrm{SNR}_\mathrm{floor}/10}}\right).
```

Estimated effective number of bits:

```math
\mathrm{ENOB}_{\mathrm{est}} \approx \frac{\mathrm{SNR}_{\mathrm{tot}}-1.76}{6.02}.
```

Minimal signal level (RMS) to reach a **target SNR**:

```math
V_{\mathrm{req,rms}} = V_{\mathrm{FS,rms}} \cdot 10^{\dfrac{\mathrm{SNR}_\mathrm{target} - \mathrm{SNR}_\mathrm{ideal}}{20}}.
```

Required gain:

```math
G_{\mathrm{min}}=\frac{V_{\mathrm{req,rms}}}{V_{\mathrm{sig,rms}}},\qquad
G_{\mathrm{min,dB}}=20\log_{10}G_{\mathrm{min}}.
```

dBFS (decibels relative to full‑scale) for a signal of RMS amplitude $V_{\mathrm{sig,rms}}$:

```math
L_{\mathrm{sig}}^{\mathrm{dBFS}} = 20\log_{10}\!\frac{V_{\mathrm{sig,rms}}}{V_{\mathrm{FS,rms}}}.
```

Noise‑free resolution (approximate number of “stable” bits around a reading), where $\sigma_\text{codes}$ is RMS noise in **codes**:

```math
N_{\text{NF}} \approx N - \log_2\!\big(6.6\,\sigma_\text{codes}\big)
```

$\text{FS}_{\text{rms,codes}}$ — full‑scale sine in **codes** (RMS):

```math
\text{FS}_{\text{rms,codes}}=\frac{2^N-1}{2\sqrt{2}}.
```

Given the signal peak‑to‑peak:

```math
V_{\text{sig,rms,codes}} = \dfrac{V_\text{pp}}{2\sqrt2\,\Delta}.
```

### Quantization noise

Even with perfect source and reference, an ideal ADC has finite SNR due to quantization.

```math
\Delta = \dfrac{V_\mathrm{FS}}{2^N},\qquad
P_q \approx \frac{\Delta^2}{12}.
```

For a full‑scale sine:

```math
V_\mathrm{rms}= \frac{V_\mathrm{FS}}{2\sqrt{2}}\;\Rightarrow\; P_s \approx \frac{V_\mathrm{FS}^2}{8}.
```

Ideal SNR:

```math
\mathrm{SNR}_\mathrm{ideal} = 10\log_{10}\!\left(\frac{P_s}{P_q}\right)
= 10\log_{10}\!\left(\frac{V_\mathrm{FS}^2/8}{(V_\mathrm{FS}/2^N)^2/12}\right)
= 6.02\,N + 1.76~\text{dB}.
```

If the input is below full‑scale, SNR drops by the signal’s dBFS:

```math
\mathrm{SNR}_\mathrm{q}(V_\text{sig}) \approx 6.02N+1.76 + L_{\mathrm{sig}}^{\mathrm{dBFS}}.
```

Oversampling and proper low‑pass/decimation improve in‑band quantization SNR by $10\log_{10}\mathrm{OSR}$ (≈ +3 dB per ×2, ≈ +1 bit per ×4):

```math
\mathrm{SNR}_\mathrm{q}(V_\text{sig}) \approx 6.02N+1.76 + L_{\mathrm{sig}}^{\mathrm{dBFS}} + 10 \log_{10}{(\mathrm{OSR})}.
```

**Recommendation (target ENOB):**

```math
\Delta\text{ENOB}=\mathrm{ENOB}_\text{target}-\mathrm{ENOB},\qquad
\mathrm{OSR}\approx 4^{\,\Delta\text{ENOB}}.
```

**ADC internal distortion (THD).** Typical STM32 THD is about −73 dBc (order of magnitude). Since distortion is **not** noise, include it via **SINAD**:

```math
\mathrm{SINAD}_{\mathrm{est}}=
-10\log_{10}\!\Big(10^{-\mathrm{SNR}_{q,\mathrm{OSR}}/10}\;+ \;10^{\mathrm{THD}_{\mathrm{ADC}}/10}\Big).
```

### Clock jitter

Sampling‑clock uncertainty adds an error proportional to signal slope:

```math
\mathrm{SNR}_{\text{clk}} \approx -20 \log_{10}\!\big(2 \pi f_\text{sig}\,\sigma_t\big).
```

A useful crossover (where $\mathrm{SNR}_\mathrm{q}=\mathrm{SNR}_\mathrm{clk}$):

```math
f_{\text{cross}} \approx \frac{10^{-\,\mathrm{SNR_{q}}/20}}{2\pi\sigma_t}.
```

> For a 12‑bit ADC with $\sigma_t\!\approx\!40$ ps and full‑scale drive, $f_\text{cross}$ is around **0.8 MHz**; far above power‑line or kHz‑range signals.

### Noise floor

Add an estimated in‑band noise floor (model value, dBFS RMS). Indicative figures:

- 12‑bit SAR @ 12–16 MHz, $V_\text{ref}=3.3$ V -> **−68…−72 dBFS**
- 14‑bit low‑power SAR (e.g., ADS7042 class) -> **−82…−86 dBFS**
- 24‑bit ΔΣ (audio‑band) -> **−110…−120 dBFS**

These values depend on bandwidth (RBW/ENBW), supply/reference quality, and layout.

## Acquisition time

Choose acquisition time so the internal sample/hold capacitor $C_{S/H}$ settles to within **½ LSB**.

```math
t_\text{acq}\;\ge\;(R_\text{tot}\,C_{S/H})\;\ln\!\big(2^{N+1}\big),\qquad
R_\text{tot}=R_\text{sw}+R_\text{src}.
```

- $R_\text{sw}$ — internal S/H switch resistance (often 1–3 kΩ, varies with device and conditions).
- $R_\text{src}$ — your external source/series resistance.

> If a **buffer capacitor** $C_\text{in}$ is placed at the ADC pin (tens of nF), it acts as a **local source**, so $R_\text{tot}\approx R_\text{sw}$ in the formula above. The large external $C_\text{in}$ itself is **not** the capacitor that must settle during $t_\text{acq}$; the tiny internal $C_{S/H}$ is.

### Picking a buffer capacitor $C_\text{in}$

It should satisfy three constraints:

1) **Small charge‑sharing droop** (≤ ½ LSB):

```math
\Delta V_\text{droop}\;\approx\;\frac{C_{S/H}}{C_{S/H}+C_\text{in}}\;\Delta V_\text{step},\qquad
C_\text{in}\;\ge\;C_{S/H}\!\left(\frac{\Delta V_\text{step}}{\varepsilon}-1\right),
```

where $\varepsilon=\dfrac{V_\text{ref}}{2^{N+1}}$.

Pessimistically, $\Delta V_\text{step}=V_\text{ref}$ (multi‑channel scan, worst‑case jump).

2) **Preserve amplitude at $f_\text{max}$** (RC low‑pass with $R_\text{ser}$):

```math
f_c \gtrsim K(r_{\text{dB}})\,f_\text{max}\quad\Rightarrow\quad
C_\text{in}\;\lesssim\;\frac{1}{2\pi R_\text{ser}\,K(r_{\text{dB}})\,f_\text{max}},
```

with

```math
K(r_{\text{dB}})=\frac{1}{\sqrt{10^{\,r_{\text{dB}}/10}-1}}
```

Typical choices:
- $r_{\text{dB}}=0.1$ dB -> $K\approx 6.6$
- $r_{\text{dB}}=0.5$ dB -> $K\approx 2.6$

3) **Recover between samples**:

```math
\tau_\text{ext}\approx (R_\text{ser}+R_\text{source})\,C_\text{in},\qquad
\text{use }T_\text{ch}\gtrsim 5\,\tau_\text{ext}\ (\lesssim 1\% \text{ residue}).
```

As a result:

```math
C_\text{in} \in \big[\,C_\text{min,step}\;\,\,;C_\text{max,band}\,\big].
```

If the interval is empty, reduce source impedance or relax the amplitude tolerance.

## Processing a real signal (measurement recipe)

Use **fixed coherent tones** to characterize the ADC path, then test your **real signal**.

- **Length:** choose $N=2^m$ (e.g., 4096 or 8192).
- **Coherence:** capture an **integer** number of periods $M$ in $N$ samples (pick **odd** $M\ge 7$).
  If $F_s$ is fixed, set $f_0 \approx M\,F_s/N$.
- **Amplitude:** target **−3…−6 dBFS (RMS)**.
- **Window:** `rect` for coherent power‑of‑two $N$; otherwise `hann`.

**THD coverage:** if you want harmonics up to $H$:

```math
H\cdot M \;<\; \frac{N}{2}-\text{guard}\quad(\text{guard}=1 \text{ for rect, } 2 \text{ for hann}).
```

## Calculating SNR / SINAD / THD / ENOB from data

If $N=2^m$ and the record is coherent:

```math
w[n]=1,\quad \mathrm{CG}=1,\quad U=1,\quad \mathrm{ENBW}_\text{bins}=1.
```

If not (non‑power‑of‑two or non‑coherent), use **periodic Hann**:

```math
w[n]=\tfrac12\left(1-\cos\frac{2\pi n}{N}\right),\quad
\mathrm{CG}=\tfrac12,\quad
U=\tfrac{3}{8},\quad
\mathrm{ENBW}_\text{bins}=1.5.
```

**FFT steps**

1) Remove DC:

```math
x_0[n]=x[n]-\bar x,\quad \bar x=\frac1N\sum x[n].
```

2) Window:

```math
y[n]=w[n]\cdot x_0[n].
```

3) FFT (no scaling):

```math
X[k]=\sum_{n=0}^{N-1} y[n]\,e^{-j2\pi nk/N}.
```

4) One‑sided spectrum: use bins $k=1..N/2-1$ (exclude DC and Nyquist).

5) Fundamental bin:

```math
k_0=\mathrm{round}\!\left(\frac{f_0 N}{F_s}\right)\quad\text{or}\quad k_0=\arg\max_k |X[k]|.
```

**Powers** (same units for signal and noise; “2” for one‑sided fold)

- Tone / harmonics (amplitude‑corrected):

```math
P_\text{tone}=\frac{2}{N^2\,\mathrm{CG}^2}\sum_{k\in\mathcal{B}}|X[k]|^2.
```

- Noise (power‑normalized):

```math
P_\text{noise}=\frac{2}{N^2\,U}\sum_{k\in\text{noise}}|X[k]|^2.
```

Collect:

- $P_1$ — power of the fundamental band $\mathcal{B}_1=\{k_0\pm\text{guard}\}$;
- $P_\text{harm}=\sum_{h\ge2} P_h$ for $\mathcal{B}_h=\{h k_0\pm\text{guard}\}$ while \(h k_0<N/2\);
- $P_\text{noise}$ — sum over remaining bins.

**Metrics**

```math
\mathrm{SNR}_{\mathrm{dB}}=10\log_{10}\frac{P_1}{P_\text{noise}},\qquad
\mathrm{THD}_{\mathrm{dB}}=10\log_{10}\frac{P_\text{harm}}{P_1},
```

```math
\mathrm{SINAD}_{\mathrm{dB}}=10\log_{10}\frac{P_1}{P_\text{noise}+P_\text{harm}},\qquad
\mathrm{ENOB}\approx\frac{\mathrm{SINAD}-1.76}{6.02}.
```

**Noise floor**

Average per bin (dBFS/bin), normalized to full‑scale sine power $P_\mathrm{FS}=(\text{FS}_{\text{rms}})^2$ in your units:

```math
L_\text{floor,bin}^{\mathrm{dBFS}} = 10\log_{10}\!\left(\frac{P_\text{noise}/N_\text{noise}}{P_\mathrm{FS}}\right).
```

Noise density (dBFS/Hz), with RBW $=\mathrm{ENBW}_\text{bins}\cdot \frac{F_s}{N}$:

```math
L_\text{density}^{\mathrm{dBFS/Hz}} = L_\text{floor,bin}^{\mathrm{dBFS}} - 10\log_{10}\!\big(\mathrm{RBW}\big).
```

## Comparisons & recommendations

Compare ideal vs measured (**ΔSNR, ΔSINAD, ΔENOB**):

- If $P_\text{noise}$ dominates (SNR ↑ with OSR, SINAD ≈ SNR), you are **noise‑limited** -> improve $V_\text{ref}$/$V_{DDA}$ decoupling, raise OSR/averaging, increase signal level (−3…−6 dBFS).
- If $P_\text{harm}$ dominates (SNR grows, SINAD stalls), you are **distortion‑limited** -> check input driver linearity, acquisition time, input RC, VREF integrity; keep level below clipping.
- If $\mathrm{SNR}_\text{clk}$ is close to total SNR at your $f_0$, you are **jitter‑limited** -> lower $f_0$ or the jitter, or use a better sampling clock.

## References

- IEEE Std 1241‑2010 — *Standard for Terminology and Test Methods for Analog‑to‑Digital Converters*.
- Harris, F. J. (1978) — *On the Use of Windows for Harmonic Analysis with the Discrete Fourier Transform*, Proc. IEEE, 66(1), 51–83. DOI: 10.1109/PROC.1978.10837.
- Analog Devices, MT‑001/[MT‑003](https://www.analog.com/media/en/training-seminars/tutorials/MT-003.pdf) — *Dynamic ADC Specifications: SNR, SINAD, ENOB, THD, THD+N, and SFDR*.
- Analog Devices, MT‑008 — *Aperture Uncertainty and ADC System Performance*.
- Texas Instruments — *Noise Analysis in ADC Systems* (application note).
- Maxim Integrated — *Aperture Jitter and ADC SNR* (application note).
- STMicroelectronics, AN2834 — *How to Get the Best ADC Accuracy in STM32 MCUs*.
- STMicroelectronics, [AN5012](https://www.st.com/resource/en/application_note/an5012-analogtodigital-audio-conversion-example-using-stm32l4-series-microcontroller-peripherals-stmicroelectronics.pdf) — *Analog‑to‑digital audio conversion example using STM32L4 Series microcontroller peripherals*.