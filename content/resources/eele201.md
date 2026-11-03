## Overview

This EELE 201 review follows the four supplied answer sets: **Exam I**, **Exam I Version 2**, **Exam II**, and **Exam II Version 2**. Problem references below use those labels and the original problem numbers.

These exams focus on DC circuit analysis: simplifying networks, writing independent equations, interpreting measurements, and replacing a network with an equivalent circuit. The worked examples connect the circuit model to the calculation and the sign of the result.

> [!TIP] Start with the drawing
> Mark the reference node, source polarities, current arrows, and the two terminals of the requested voltage. After replacing a meter or turning off a source, redraw the connections before calculating.

## Exam Map

| Topic | Exam I | Exam I Version 2 | Exam II | Exam II Version 2 |
| --- | --- | --- | --- | --- |
| Network reduction and current division | P1 | P3 | -- | -- |
| Source power and mesh currents | P2 | P1 | -- | -- |
| Controlled sources and nodal equations | P1, P3 | P2 | -- | -- |
| Ideal meters and signed readings | P4 | P4 | -- | -- |
| Superposition | -- | -- | P1 | -- |
| Ideal op-amps and feedback | -- | -- | P2 | P2 |
| Thevenin and Norton equivalents | -- | -- | P3 | P3 |
| Load power and maximum power transfer | -- | -- | -- | P1 |

The first-order RC/RL formulas at the end are a separate reference for later study; these four practice sets do not contain transient-response problems.

## 1. Reference Directions and Network Reduction

Use the passive sign convention for resistors: current enters the terminal marked positive, so $v=iR$. Kirchhoff's current law gives $\sum i=0$ at a node, and Kirchhoff's voltage law gives $\sum v=0$ around a loop.

A negative voltage or current means the result is opposite to the reference you chose. Keep that sign through the rest of the calculation.

Two resistors are in series when their shared node has no other current path. They are in parallel when both ends connect to the same two nodes:

$$
R_{\text{series}}=R_a+R_b, \qquad R_a\parallel R_b=\frac{R_aR_b}{R_a+R_b}
$$

### Worked Example: Two Stages of Current Division

In **Exam I Version 2, P3**, the right-hand wire makes $R_3$ and $R_4$ parallel. The source current splits between $R_1$ and the branch containing $R_2+(R_3\parallel R_4)$.

![A 1.25 A source feeds R1 in parallel with R2 followed by parallel R3 and R4. The requested current Ix flows downward through R4.](../../images/courses/eele201/current-divider.svg "Exam I Version 2, P3: redraw the nodes before reducing the network")

First reduce the right-hand pair:

$$
R_{34}=300\parallel400=171.4286\,\Omega
$$

Then find the current through $R_2$, using resistance values in ohms:

$$
I_{234}=1.25\frac{100}{100+200+171.4286}=0.2651515\,\text{A}
$$

Split that current between $R_3$ and $R_4$:

$$
I_x=I_{234}\frac{R_3}{R_3+R_4}=0.2651515\frac{300}{700}=0.1136364\,\text{A}
$$

For two parallel resistors, the current in one branch uses the **other branch's resistance** in the numerator. The requested wire current is the $R_4$ current, rather than the entire current through $R_2$.

## 2. Source Power and Mesh Currents

For any two-terminal element, define current entering its positive voltage terminal:

$$
p=vi
$$

- $p>0$: the element absorbs power.
- $p<0$: the element supplies power.

A voltage source can absorb power. Its source symbol alone does not determine the direction of energy transfer. When reporting a positive magnitude, include the word **absorbed** or **supplied**.

In mesh analysis, assign a current to each mesh of a planar circuit and apply KVL. A resistor shared by two meshes contributes a term such as $R(I_1-I_2)$. An outer current source fixes a mesh current; a current source between two meshes requires a supermesh and a current constraint.

### Worked Example: Source Power in Version 2

For **Exam I Version 2, P1**, choose clockwise mesh currents $I_1$ in the left loop, $I_2$ in the upper loop, and $I_3$ in the lower-right loop. The source arrows give

$$
I_1=0.10\,\text{A}, \qquad I_2=-0.20\,\text{A}
$$

KVL around the lower-right loop gives

$$
4\,\text{V}+(200\,\Omega)(I_3-I_1)+(300\,\Omega)I_3=0
$$

Thus $I_3=0.032\,\text{A}$. The voltage-source current is $I_3-I_2=0.232\,\text{A}$, entering its positive terminal. Its absorbed power is $4(0.232)=0.928\,\text{W}$.

With the right-hand node as ground, the center node is $4\,\text{V}$, the left node is $14\,\text{V}$, and the bottom node is $-9.6\,\text{V}$. These voltages determine the two current-source powers:

| Source | Power magnitude | Interpretation |
| --- | --- | --- |
| $V_S$ | $0.928\,\text{W}$ | Absorbed |
| $I_{S1}$ | $2.36\,\text{W}$ | Supplied |
| $I_{S2}$ | $0.800\,\text{W}$ | Supplied |

:::details Check the original Exam I power problem
In **Exam I, P2**, take the bottom-center node as ground and call the top-center voltage $V$. The two resistive paths each have a total resistance of $500\,\Omega$, giving

$$
\frac{V-5\,\text{V}}{500\,\Omega}+\frac{V-7.5\,\text{V}}{500\,\Omega}=0.50\,\text{A}
$$

Therefore $V=131.25\,\text{V}$. The branch currents are $0.2525\,\text{A}$ and $0.2475\,\text{A}$. The voltage sources absorb $1.2625\,\text{W}$ and $1.85625\,\text{W}$, while the current source supplies $65.625\,\text{W}$.

The resistors dissipate $62.50625\,\text{W}$. Adding all signed element powers gives zero, providing an independent check.
:::

## 3. Nodal Analysis and Controlled Sources

Choose a reference node, write branch currents as voltage differences divided by resistance, and apply KCL. For a voltage source between two nonreference nodes, form a **supernode**: write KCL around the pair and add the source's voltage constraint.

Replace every controlling current or voltage with an expression in the allowed unknowns. The letter $G$ does not imply the same units in every circuit:

| Source in the practice sets | Relationship | Units of $G$ |
| --- | --- | --- |
| Exam I, P1: voltage-controlled current source | $i=GV_x$ | $\text{A/V}$ |
| Exam I, P3: current-controlled current source | $i=Gi_x$ | Dimensionless |
| Exam I Version 2, P2: current-controlled voltage source | $v=Gi_x$ | $\text{V/A}=\Omega$ |

### Building a Minimum Set of Equations

In **Exam I, P3**, the original labels give $V_B=0$, $V_C=-V_{S1}$, and $V_A-V_E=V_{S2}$. The controlling current points from D to E through $R_4$:

$$
i_x=\frac{V_D-V_E}{R_4}
$$

The remaining unknowns are $V_A$, $V_D$, and $V_E$. Use the source constraint and two independent KCL equations. At D:

$$
\frac{V_D-V_C}{R_2}+\frac{V_D-V_A}{R_3}+\frac{V_D-V_E}{R_4}=0
$$

For the supernode containing A and E, the controlled source enters the supernode from C:

$$
\frac{V_A}{R_1}+\frac{V_A-V_D}{R_3}+\frac{V_E-V_D}{R_4}-G\frac{V_D-V_E}{R_4}=0
$$

Together with $V_A-V_E=V_{S2}$, these determine the three unknowns. Adding every alternative KCL equation from the answer sheet introduces a redundant equation.

### A Controlled Source Can Produce a Negative Output

In **Exam I, P1**, the left circuit has $R_2\parallel R_3=120\,\Omega$. Its loop current is $5/(100+120+400)=8.0645\,\text{mA}$. The marked polarity across $R_4$ opposes the return-current drop, so

$$
V_x=-(400\,\Omega)(8.0645\,\text{mA})=-3.225806\,\text{V}
$$

The dependent source current is $GV_x=-48.3871\,\text{mA}$. In the output network, $R_5$ is parallel with the series pair $R_6+R_7$, and the requested voltage is across $R_7$:

$$
V_{\text{out}}=(GV_x)\left[R_5\parallel(R_6+R_7)\right]\frac{R_7}{R_6+R_7}=-9.408602\,\text{V}
$$

The negative result follows from the reference polarity; taking an absolute value would change the answer.

## 4. Ideal Meters Change the Connections

| Instrument | Ideal model | Positive display convention |
| --- | --- | --- |
| Voltmeter | Open circuit: zero current through the meter | $V_{\text{terminal}}-V_{\text{COM}}$ |
| Ammeter | Short circuit: zero voltage across the meter | Current entering the A terminal and leaving COM |

Replace the meters with those models before reducing the resistors. An ammeter may bypass a resistor; a voltmeter inserted in a branch may interrupt its current.

In **Exam I, P4**, the ammeter shorts $R_2$, and the voltmeter opens the connection between the $R_3$ and $R_4$ branches. Their currents vanish. The remaining current is $7.5/(10+50)=0.125\,\text{A}$, entering COM, so the ammeter reads $-125\,\text{mA}$. Both voltmeter terminals end up at the same potential, giving $0\,\text{V}$.

In **Exam I Version 2, P4**, the ammeter connects the $R_4/R_5$ junction to the bottom node. The $R_5+R_6$ branch then has zero applied voltage. The source sees

$$
R_{\text{seen}}=10+20+(30\parallel40)=47.142857\,\Omega
$$

Its terminal voltage is $(0.35\,\text{A})R_{\text{seen}}=16.5\,\text{V}$. The voltmeter leads are reversed relative to this voltage, so its display is $-16.5\,\text{V}$. The ammeter reads the $R_4$ current, $0.35(30/70)=+150\,\text{mA}$.

## 5. Superposition

In a linear circuit, find one independent source's contribution at a time, then add the signed voltage or current contributions.

- Replace an inactive independent voltage source with a short circuit.
- Replace an inactive independent current source with an open circuit.
- Keep dependent sources active and preserve their controlling relationships.

### Worked Example: Three Independent Sources

For **Exam II, P1**, let $V_a$ be the node left of $V_{S2}$ and $V_x$ the node to its right. The source polarity gives $V_a-V_x=V_{S2}$. A supernode equation is

$$
\frac{V_a-V_{S1}}{R_1}+\frac{V_a}{R_2}+\frac{V_x}{R_3}+\frac{V_x}{R_4}=I_S
$$

With $R_1=100\,\Omega$, $R_2=200\,\Omega$, $R_3=300\,\Omega$, and $R_4=400\,\Omega$, the separate-source calculations give

$$
V_x=0.48V_{S1}-0.72V_{S2}+(48\,\Omega)I_S
$$

| Active source | Contribution with the supplied values |
| --- | --- |
| $V_{S1}=2\,\text{V}$ | $+0.96\,\text{V}$ |
| $V_{S2}=4\,\text{V}$ | $-2.88\,\text{V}$ |
| $I_S=0.05\,\text{A}$ | $+2.40\,\text{V}$ |

Thus $V_x=0.48\,\text{V}$. The voltage-source coefficients are dimensionless, while the current-source coefficient must have units of resistance.

Superposition applies to voltages and currents. Calculate power from the combined voltage or current, since power is not a linear function of the sources.

## 6. Ideal Op-Amps and the Measured Output

For an ideal op-amp, the input currents are zero. With negative feedback and operation within the supply limits, the inputs have equal voltage:

$$
i_+=i_-=0, \qquad v_+=v_-
$$

The equal input voltages do not imply a physical connection. Apply KCL at the feedback nodes, then check the actual amplifier output against its supply rails.

> [!IMPORTANT] Read both measurement terminals
> Both Exam II op-amp problems label $V_{\text{out}}$ across a resistor. Calculate that voltage difference separately from the amplifier output relative to ground.

### Worked Example: Feedback with a Loaded Divider

In **Exam II Version 2, P2**, let $u$ be the noninverting input voltage, $w$ the junction of $R_4$, $R_5$, and $R_6$, and $v_o$ the amplifier output relative to ground. The requested voltage across $R_5$ is $V_{\text{out}}=v_o-w$.

![An ideal op-amp with input node u and feedback junction w. R5 connects the amplifier output vo to w, and the requested Vout is the voltage across R5.](../../images/courses/eele201/op-amp-feedback.svg "Exam II Version 2, P2: distinguish the amplifier output from the measured resistor voltage")

The input branch containing $V_{\text{in}}$ and $R_2$ forms a supernode with $u$. Zero input current gives

$$
\frac{u}{1000\,\Omega}+\frac{u-2.5\,\text{V}}{2000\,\Omega}=2\,\text{mA}
$$

Therefore $u=13/6\,\text{V}$. The inverting input is also at $u$. KCL there gives

$$
\frac{u}{R_3}+\frac{u-w}{R_4}=0
$$

Hence $w=(1+R_4/R_3)u=91/18\,\text{V}$. At $w$, the current through $R_5$ supplies both the $R_4$ and $R_6$ paths:

$$
V_{\text{out}}=R_5\left(\frac{w-u}{R_4}+\frac{w}{R_6}\right)=7.824074\,\text{V}
$$

The amplifier output is $v_o=w+V_{\text{out}}=12.87963\,\text{V}$, within the $\pm20\,\text{V}$ rails. Treating $R_5$ and $R_6$ as an unloaded divider would miss the $R_4$ current.

:::details The two-amplifier circuit in Exam II, P2
The upper noninverting input is $u=1.5\,\text{V}$ because no current flows through $R_1$. The lower input has an inverted voltage source and a resistor network, giving

$$
l=-V_{\text{in2}}\frac{R_6}{R_5+R_6}=-\frac{15}{11}\,\text{V}
$$

The two inverting inputs are linked by $R_3$, with feedback through $R_2$ and $R_4$. Their amplifier outputs are

$$
V_u=u+\frac{R_2}{R_3}(u-l)=3.40909\,\text{V}
$$

$$
V_l=l+\frac{R_4}{R_3}(l-u)=-5.18182\,\text{V}
$$

The requested voltage across $R_7$ is $V_u-V_l=8.59091\,\text{V}$. Check each amplifier's output against the rails individually. In the ideal model, the load $R_7$ does not change these output voltages.
:::

## 7. Thevenin and Norton Equivalents

Define the port voltage and external short-circuit current before calculating:

$$
V_{\text{TH}}=V_A-V_B=V_{\text{OC}}, \qquad I_{\text{SC}}:\ A\rightarrow B
$$

The Thevenin model is a voltage source in series with $R_{\text{TH}}$; the Norton model is a current source in parallel with the same resistance.

1. Remove the external load and find the open-circuit voltage.
2. Deactivate the independent sources and find the resistance seen from A-B. Keep dependent sources active; use a test source when necessary.
3. Find or check the short-circuit current with $I_{\text{SC}}=V_{\text{TH}}/R_{\text{TH}}$ for the reference above.

For these two problems, the resistance reductions are

$$
R_{\text{TH,II}}=R_5\parallel\left[(R_1\parallel R_2)+(R_3+R_4)\right]
$$

$$
R_{\text{TH,II V2}}=R_6+\left[R_2\parallel(R_3+R_4+R_5)\right]
$$

| Problem | $V_A-V_B$ | $R_{\text{TH}}$ | External short current, A to B |
| --- | --- | --- | --- |
| Exam II, P3 | $-13.55263\,\text{V}$ | $302.63158\,\Omega$ | $-44.78261\,\text{mA}$ |
| Exam II Version 2, P3 | $-3.492857\,\text{V}$ | $771.42857\,\Omega$ | $-4.527778\,\text{mA}$ |

A negative short-circuit current means the actual external current flows from B to A. Version 2 places terminal A on the right of the drawing: follow the terminal labels rather than a left-to-right assumption.

When drawing the Norton source with signed value $I_N=I_{\text{SC}}$, use a reference source arrow from **B to A**; it drives the external short from A to B. Reverse the source arrow if you instead label it with a positive magnitude for these negative results.

## 8. Load Power and Maximum Power Transfer

For a resistive Thevenin equivalent with $R_{\text{TH}}>0$:

$$
I_L=\frac{V_{\text{TH}}}{R_{\text{TH}}+R_L}, \qquad P_L=\frac{V_{\text{TH}}^2R_L}{(R_{\text{TH}}+R_L)^2}
$$

Maximum load power occurs at

$$
R_{L,\text{opt}}=R_{\text{TH}}, \qquad P_{L,\max}=\frac{V_{\text{TH}}^2}{4R_{\text{TH}}}
$$

### Worked Example: An Actual Load Is Not Necessarily Matched

In **Exam II Version 2, P1**, the ideal voltage source fixes the left node at $2\,\text{V}$. With the load disconnected and B as ground, KCL at A gives

$$
\frac{V_A-2\,\text{V}}{200\,\Omega}+\frac{V_A}{300\,\Omega}=0.05\,\text{A}
$$

Thus $V_{\text{TH}}=7.2\,\text{V}$.

![A two-source resistive network supplies an optional load between A and B. The 2 V source fixes the left node, and the 50 mA current source injects current into A.](../../images/courses/eele201/load-power.svg "Exam II Version 2, P1: find the port equivalent before connecting the load")

Turn off the voltage source by shorting it and the current source by opening it. The short bypasses $R_1$, leaving $R_{\text{TH}}=R_2\parallel R_3=120\,\Omega$.

The best-matched load is therefore $120\,\Omega$, receiving $108\,\text{mW}$. For the specified actual load of $1000\,\Omega$:

$$
P_L=\frac{(7.2\,\text{V})^2(1000\,\Omega)}{(120\,\Omega+1000\,\Omega)^2}=41.3265\,\text{mW}
$$

The corresponding load voltage is $6.42857\,\text{V}$. Maximum power transfer and the power delivered to a particular load are different calculations.

## Practice and Final Checks

:::quiz choice
An ideal ammeter carries $125\,\text{mA}$ into COM and out of its A terminal. What does it display?

- [ ] $+125\,\text{mA}$
- [x] $-125\,\text{mA}$
- [ ] $0\,\text{mA}$

---

A positive reading corresponds to current entering A and leaving COM. The stated current has the opposite direction.
:::

:::quiz numeric answer=0.48 unit=V tolerance=0.001
Use $V_x=0.48V_{S1}-0.72V_{S2}+(48\,\Omega)I_S$ with $V_{S1}=2\,\text{V}$, $V_{S2}=4\,\text{V}$, and $I_S=0.05\,\text{A}$. Find $V_x$.

---

Add the signed contributions: $0.96-2.88+2.40=0.48\,\text{V}$.
:::

:::quiz numeric answer=0.108 unit=W tolerance=0.0001
A port has $V_{\text{TH}}=7.2\,\text{V}$ and $R_{\text{TH}}=120\,\Omega$. What maximum power can a matched resistive load receive?

---

The matched load is $120\,\Omega$. Its power is $7.2^2/(4\times120)=0.108\,\text{W}$, or $108\,\text{mW}$.
:::

Before finishing a solution:

- [ ] Check whether wires and ideal meters change which elements share a node.
- [ ] Keep source polarities and reference arrows visible throughout the calculation.
- [ ] Write only independent equations, including every required source constraint.
- [ ] Verify the units of controlled-source gains and superposition coefficients.
- [ ] Report source power with its absorbed or supplied interpretation.
- [ ] Identify both terminals of the requested voltage and check op-amp output limits.
- [ ] Use the same A-B convention for open-circuit voltage and short-circuit current.
- [ ] Check the result with KCL, KVL, power balance, or a limiting case.

## Further Study: First-Order Circuits

For later RC/RL review, using the passive sign convention:

$$
i_C=C\frac{\mathrm{d}v_C}{\mathrm{d}t}, \qquad v_L=L\frac{\mathrm{d}i_L}{\mathrm{d}t}
$$

With finite, non-impulsive switching signals, capacitor voltage and inductor current are continuous: $v_C(0^+)=v_C(0^-)$ and $i_L(0^+)=i_L(0^-)$. For a stable first-order circuit with constant sources after switching:

$$
x(t)=x(\infty)+\left[x(0^+)-x(\infty)\right]e^{-t/\tau}
$$

Here $x$ is $v_C$ for an RC circuit or $i_L$ for an RL circuit, with

$$
\tau_{RC}=R_{\text{eq}}C, \qquad \tau_{RL}=\frac{L}{R_{\text{eq}}}
$$

Find the equivalent resistance from the storage element's terminals in the circuit after switching, with independent sources deactivated and dependent sources retained. In the final DC steady state, an ideal capacitor is open and an ideal inductor is short.

## Related Notes

- [Resistive Voltage Divider](../../notes/voltage-divider.html)
- [Circuits II](../../notes/circuits-ii.html)
- [Physics II](../../notes/physics-ii.html)
