# Wheatstone Bridge Calculator

Wheatstone Bridge is commonly used for precise resistance measurements (e.g., strain gauges, thermistors, or sensor bridges).

```
       R1        R2
Vin ──/\/──┬────/\/──┬── GND
           │         │
           │         │
         V+│       V-│
           └──Vbridge┘
           │         │
      R3   |     Rx  |
Vin ──/\/──┴────/\/──┴── GND
```

When all resistors are known, the differential output voltage is:

```math
V_{bridge} = V_{in} \left( \frac{R_2}{R_1 + R_2} - \frac{R_x}{R_3 + R_x} \right)
```

When the bridge output voltage is known, the unknown resistor \(R_x\) can be found as:

```math
R_x = \frac{R_3 \cdot R_2 \cdot (V_{in} - V_{bridge})}{R_1 \cdot V_{bridge} + R_2 \cdot (V_{in} - V_{bridge})}
```

Leakage current:

```math
R_{eq} \;=\; (R_1+R_2)\;\parallel\;(R_3+R_x)
\;=\; \frac{(R_1+R_2)(R_3+R_x)}{R_1+R_2+R_3+R_x} \\
I_{total} \;=\; \frac{V_{in}}{R_{eq}}
```
