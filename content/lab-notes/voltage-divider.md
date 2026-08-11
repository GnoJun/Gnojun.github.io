## Overview

A resistive voltage divider uses two resistors connected in series. The output voltage is measured at the node between the two resistors.

The circuit produces an output voltage that is a fraction of the input voltage. That fraction is determined by the ratio of the resistor values.

### Key idea

- **Input:** higher voltage
- **Output:** scaled voltage
- **Best use:** signal measurement


## Circuit Structure

R1 connects the input voltage to the output node.

R2 connects the output node to ground.

The output voltage is measured between the midpoint and ground.


## Equation and Variables

The output voltage depends on the input voltage and the ratio between R1 and R2.

$$
V_{\text{out}} = V_{\text{in}}\frac{R_2}{R_1 + R_2}
$$

Where:

- `Vin` is the voltage across the complete divider.
- `Vout` is the voltage measured at the midpoint.
- `R1` is the resistor between the input and output node.
- `R2` is the resistor between the output node and ground.


## Worked Example

Suppose both resistors have the same value:

- Input voltage: **5 V**
- R1: **1 kΩ**
- R2: **1 kΩ**

Substitute the values:

$$
V_{\text{out}}
=
5
\frac{1000}{1000 + 1000}
$$

Therefore:

$$
V_{\text{out}} = 2.5\text{ V}
$$


## Applications and Limitations

### Useful For

- Scaling an ADC input voltage
- Creating a reference voltage
- Biasing an analog signal
- Measuring battery voltage

### Common Mistakes

- Using the divider to power a load
- Ignoring the loading effect
- Choosing resistor values that are too low
- Choosing resistor values that are too high


## Engineering Note

> A voltage divider is best treated as a signal-scaling circuit rather than a power supply.

When connecting the divider to an ADC or another circuit, always consider the input impedance of the connected load.