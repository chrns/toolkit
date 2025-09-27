# Quartz

Schema:

```
MCU XTAL_IN o──┬───|| C1 ||───┐
               │              │
            Crystal             GND
               │              │
MCU XTAL_OUT o─┴───|| C2 ||───┘
```

Datasheet provides expected load capacitance, $C_L$. You can find it via following formula:

```math
C_L \;=\; \frac{C_1 \cdot C_2}{C_1 + C_2} \;+\; C_s
```

where $C_s$ is the total stray to ground (PCB + oscillator pin parasitics).

To keep it simple, $C_1$ == $C_2$, then:

```math
C = 2 \cdot (C_{L} - C_{S})
```

---


$XTAL_{in}$ and $XTAL_{out}$ could have different capacity. In other words:

```math
C_{in} \;=\; C_{1} + C_{par_{1}} \\
C_{out} \;=\; C_{2} + C_{par_{2}} \\
```

Usually C1 =






Добавил автосинтез номиналов:
	•	Исходим из равенства эффективных шунтов по сторонам:
S = C_1{+}C_{in} = C_2{+}C_{out}
и целевого условия C_{load} = S/2 + C_s = C_L \Rightarrow S = 2\,(C_L - C_s).
	•	Получаем:
	•	C1_{opt} = \max\{0,\, 2(C_L - C_s) - C_{in}\}
	•	C2_{opt} = \max\{0,\, 2(C_L - C_s) - C_{out}\}
	•	Считаю C_load при этих авто-значениях, а также:
	•	разницу \Delta C = C_{load}^{auto} - C_L,




## References

- NXP ,[AN14518](https://www.nxp.com/docs/en/application-note/AN14518.pdf)
- ST, [AN2867](https://www.st.com/resource/en/application_note/an2867-guidelines-for-oscillator-design-on-stm8afals-and-stm32-mcusmpus-stmicroelectronics.pdf)
- TI, [TCAN455x Clock Optimization and Design Guidelines](https://www.ti.com/lit/an/slla549/slla549.pdf?ts=1758717885924)