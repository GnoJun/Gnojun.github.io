## Overview

Circuit analysis connects a circuit diagram to the voltages, currents, and energy inside it. These EELE 201 notes review resistive networks and focus on first-order RC and RL circuits: how they respond when a switch changes position.

Start every problem by choosing a reference node, labeling voltage polarities, and assigning current directions. A negative answer simply means the actual direction or polarity is opposite to the one chosen.

## Resistive Circuits

Three relationships form the starting point for circuit analysis:

- **Ohm's law:** $v = iR$, with current entering the resistor's positive voltage terminal.
- **Kirchhoff's current law (KCL):** the algebraic sum of currents at a node is zero.
- **Kirchhoff's voltage law (KVL):** the algebraic sum of voltages around a closed loop is zero.

Nodal analysis applies KCL to unknown node voltages. Mesh analysis applies KVL to mesh currents in a planar circuit. Choose the method that gives fewer independent equations.

For an unloaded voltage divider, $R_1$ connects the input to the output node, and $R_2$ connects the output to ground:

$$
V_{\text{out}} = V_{\text{in}}\frac{R_2}{R_1 + R_2}
$$

If a load is connected across $R_2$, replace $R_2$ in the divider calculation with the parallel combination $R_2 \parallel R_{\text{load}}$.

## Capacitors and Inductors

A capacitor stores energy in an electric field; an inductor stores energy in a magnetic field. Using the passive sign convention, where current enters the positive voltage terminal:

$$
i_C(t) = C\frac{\mathrm{d}v_C(t)}{\mathrm{d}t}
$$

$$
v_L(t) = L\frac{\mathrm{d}i_L(t)}{\mathrm{d}t}
$$

With finite, non-impulsive signals, capacitor voltage and inductor current remain continuous through a switching event at $t = 0$:

$$
v_C(0^+) = v_C(0^-), \qquad i_L(0^+) = i_L(0^-)
$$

The symbols $0^-$ and $0^+$ mean immediately before and immediately after switching. In DC steady state, an ideal capacitor behaves as an open circuit and an ideal inductor behaves as a short circuit.

## First-Order Response

For a first-order circuit with a constant source after switching, the complete response has the form

$$
x(t) = x(\infty) + \left[x(0^+) - x(\infty)\right]e^{-t/\tau}, \qquad t \geq 0
$$

Here, $x(t)$ is the capacitor voltage $v_C(t)$ in an RC circuit or the inductor current $i_L(t)$ in an RL circuit. The response moves from the **initial value** $x(0^+)$ toward the **final value** $x(\infty)$.

The time constant depends on the storage element:

$$
\tau_{RC} = R_{\text{eq}}C, \qquad \tau_{RL} = \frac{L}{R_{\text{eq}}}
$$

$R_{\text{eq}}$ is the resistance seen looking into the storage element's terminals in the circuit after switching. To find it, remove the storage element, short independent voltage sources, and open independent current sources. Keep dependent sources active; use a test source if needed.

For $R_{\text{eq}} > 0$, the difference from the final value falls to about **36.8%** after one time constant and **0.67%** after five. Five time constants is a useful estimate of settling time.

## Worked Example: Charging a Capacitor

At $t = 0$, an initially discharged $100\,\mu\text{F}$ capacitor is connected to an ideal $5\,\text{V}$ DC source through a $1\,\text{k}\Omega$ resistor. The capacitor's other terminal is grounded, and $v_C$ is measured relative to ground.

The initial voltage is $v_C(0^+) = 0\,\text{V}$, the final voltage is $v_C(\infty) = 5\,\text{V}$, and

$$
\tau = RC = (1000)(100 \times 10^{-6}) = 0.10\,\text{s}
$$

Substituting these values into the response equation gives

$$
v_C(t) = 5\left(1 - e^{-t/(0.10\,\text{s})}\right)\,\text{V}, \qquad t \geq 0
$$

| Time | Capacitor voltage | Interpretation |
| --- | --- | --- |
| $0$ | $0\,\text{V}$ | Initial condition |
| $0.10\,\text{s}$ | $3.16\,\text{V}$ | One time constant |
| $0.50\,\text{s}$ | $4.97\,\text{V}$ | Approximately settled |

The charging current starts at $5\,\text{mA}$ and approaches zero as the capacitor voltage approaches the source voltage.

## Problem-Solving Checklist

1. Analyze the circuit before switching to find $v_C(0^-)$ or $i_L(0^-)$. Use a DC steady-state model only when the initial conditions justify it.
2. Apply continuity to obtain the initial value after switching.
3. Analyze the circuit after switching to find the final DC value.
4. Find $R_{\text{eq}}$ and calculate the appropriate time constant.
5. Write the response and check its units, initial value, and long-term limit.

### Try It Yourself

An initially unenergized $20\,\text{mH}$ inductor is connected in series with a $100\,\Omega$ resistor and an ideal $10\,\text{V}$ DC source. Find the time constant and the current at one time constant.

:::details Check your answer
The time constant is $\tau = L/R = 0.20\,\text{ms}$. The final current is $10/100 = 0.10\,\text{A}$, so

$$
i_L(t) = 0.10\left(1 - e^{-t/(0.20\,\text{ms})}\right)\,\text{A}
$$

At $t = \tau$, the current is approximately $63.2\,\text{mA}$.
:::

## Related Notes

- [Resistive Voltage Divider](../../notes/voltage-divider.html)
- [Circuits II](../../notes/circuits-ii.html)
