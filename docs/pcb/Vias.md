# Via's characteristics

Via parasitic inductance (Howard Johnson's approximation):

```math
L_{\texttt{via}} \approx A \, h \, \left[\ln\!\left(\frac{4 \, h}{d}\right) + 1\right]
```

$A$ — 5.08e-9; $K$ — 0.55 pF/mm; $h$ — via length/height; $d$ — hole diameter; $p$ — pad diameter.

Via parasitic capacitance:

```math
C_{\texttt{via}} \approx K \,\varepsilon_r\, \frac{d \, h}{p - d}
```

Self-resonant frequency:

```math
f_\text{SRF} = \frac{1}{2\pi\sqrt{L_{\texttt{via}} C_{\texttt{via}}}}
```

Impedance:

```math
Z = \sqrt{ \dfrac{L_{\texttt{via}}}{C_{\texttt{via}}} }
```


