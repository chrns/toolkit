# Microstrip (single-ended)

**Equation:**

```math
Z_0 \approx \frac{87}{\sqrt{\varepsilon_r + 1.41}}\;
\ln\!\Bigg(\frac{5.98\,h}{0.8\,w + t}\Bigg)
```

**Notes:**

- $h$: dielectric height to reference plane; $w$: trace width; $t$: copper thickness (derived from copper weight).
- Empirical constants 87, 5.98, 0.8, and 1.41 are from IPC tables.
- Assumes “thin” copper and homogeneous dielectric, no effective permittivity splitting.

# Stripline (symmetric, single-ended)

**Equation:**

```math
Z_0 \approx \frac{60}{\sqrt{\varepsilon_r}}\;
\ln\!\Bigg(\frac{1.9\,(2h + t)}{0.8\,w + t}\Bigg)
```

**Notes:**

- $h$: spacing from the center conductor to one plane (so total dielectric height is $2h + t$).
- Empirical constants 60, 1.9, 0.8.


# Embedded Microstrip

**Effective relative permittivity:**

```math
\varepsilon_{rp} \approx \varepsilon_r \left(1 - e^{-1.55\,h/h_p}\right)
```

**Characteristic impedance:**

```math
Z_0 \approx \frac{60}{\sqrt{\varepsilon_{rp}}}\;
\ln\!\Bigg(\frac{5.98\,h_p}{0.8\,w + t}\Bigg)
```

**Notes:**

- $h$: base substrate height; $h_p$: height to the top “coating” plane (or effective cover).
- Uses the same log form as microstrip but replaces $\varepsilon_r$ with $\varepsilon_{rp}$ via an exponential fit from IPC tables.

# Asymmetric Stripline

**Equations:**

```math
Z_0 \approx
\left[\frac{80}{\sqrt{\varepsilon_r}}\;\ln\!\Bigg(\frac{1.9\,(2h_a + t)}{0.8\,w + t}\Bigg)\right]\;
\left(1 - \frac{h_a}{4h_b}\right)
```

**Notes:**

- $h_a:$ distance to the near plane; $h_b$: distance to the far plane.
- The multiplicative factor $\left(1 - \frac{h_a}{4h_b}\right)$ is an empirical asymmetry correction.

# Edge-Coupled Microstrip

**Equation (for a “differential”/coupled impedance proxy $Z_d$):**

```math
Z_d \approx
\frac{174}{\sqrt{\varepsilon_r + 1.41}}\;
\ln\!\Bigg(\frac{5.98\,h}{0.8\,w + t}\Bigg)\;
\Big(1 - 0.48\,e^{-0.96\,s/h}\Big)
```

**Notes:**

- $s$: edge-to-edge spacing between the two traces.
- The last factor reduces coupling as spacing increases (purely empirical fit).

# Broadside-Coupled Stripline

**Equations:**

```math
Z_0 \approx \frac{80}{\sqrt{\varepsilon_r}}\;
\ln\!\Bigg(\frac{1.9\,(2h_p + t)}{0.8\,w + t}\Bigg)\;
\left(1 - \frac{h_p}{4\,(h_t + h_p + t)}\right)
```

**Notes:**

- $h_p$: distance from a trace to its closest plane; $h_t:$ inter-trace vertical separation (between the two broadside traces).
- The final factor is an empirical broadside-coupling correction.

# Edge-Coupled Stripline

**Single-ended stripline (same as above):**

```math
Z_0 \approx \frac{60}{\sqrt{\varepsilon_r}}\;
\ln\!\Bigg(\frac{1.9\,(2h + t)}{0.8\,w + t}\Bigg)
```

**Coupled/differential-proxy:**

```math
Z_d \approx 2Z_0\;\Big[1 - 0.347\,\exp\!\Big(\!-\,\frac{2.9\,s}{2h + t}\Big)\Big]
```

**Notes:**

- $s$: lateral spacing between the two striplines.
- As spacing grows, the exponential term vanishes and $Z_d \to 2Z_0$.