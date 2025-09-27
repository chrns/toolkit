# Calculator's math

... ...

# Impedance

```math
X_C = \dfrac{1}{2 \pi f C} \\
X_L = \dfrac{1}{2 \pi f L}
```



## Voltage divider

Calculator provides calculations for R-, L-, and C- voltage dividers.

Resistor voltage dividers are commonly used to create reference voltages. Here's how you can calculate the output voltage:

```math
V_{out} = V_{in} \dfrac{R_2}{R_1 + R_2}
```

Same for inductors:

```math
V_{out} = V_{in} \dfrac{L_2}{L_1 + L_2}
```

Capacitor voltage divider using formulas:

```math
X_C = \frac{1}{\omega C} \\

V_{out} = V_{in} \cdot \frac{X_{C_2}}{X_{C_1} + X_{C_2}}
```

---

# Impedance

Using IPC-2141

## Microstrip

```math
Z_0 = \frac{87}{\sqrt{\epsilon_r + 1.41}} \cdot \ln{\frac{5.98h}{0.8\omega + t}}
```

## Stripline

```math
Z_0 = \frac{60}{\sqrt{\epsilon_r}} \cdot \ln{\frac{1.9(2h+t)}{0.8\omega + t}}
```

## Embedded Microstrip

```math
Z_0 = \frac{87}{\sqrt{\epsilon_{rp}}} \cdot \ln{\frac{5.98h}{0.8\omega + t}} \\

\epsilon_{rp} = [ 1 - exp(-1.55 \frac{h}{h_p})]
```

## Asymmetric Stripline

```math
Z_0 = \frac{80}{\sqrt{\epsilon_r}} \cdot (\frac{1.9 (2h_a + t)}{0.8 \omega + t}) \cdot (1 - \frac{h_a}{4h_b})
```

## Edge Coupled Microstrip

```math
Z_d = \frac{174} / \sqrt{\epsilon_r + 1.41} \cdot \frac{5.98h}{0.8 \omega + t} \cdot [1 - 0.48 exp(-0.96 \frac{s}{h})]
```

## Broadside Coupled Stripline

```math
Z_0 = \frac{80}{\sqrt{\epsilon_r}} \ln{\frac{1.9(2h_p + t)}{0.8 \omega + t}} \cdot (1 - \frac{h_p}{4(h_t + h_p + t)})
```

## Edge Coupled Stripline

```math
Z_0 = \frac{60}{\sqrt{\epsilon_r}} \cdot (\frac{1.9 (2h + t)}{0.8 \omega + t}) \\

Z_d = 2 Z_0 [ 1 - 0.347 exp(-2.9 \frac{s}{2h + t}) ]
```
