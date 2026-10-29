## What you will learn

Predict the output voltage of an ideal, unloaded resistor divider.

Replace this example with your own learning goal. For every supported syntax and its rendered result, open the [Markdown Article Template](../../resources/markdown-template.html).

## Before you start

- Understand voltage, resistance, and series circuits.
- Use the same unit for both resistor values.

## The idea

Two series resistors share the input voltage. Measure the output across the lower resistor, $R_2$.

$$
V_{\text{out}} = V_{\text{in}}\frac{R_2}{R_1 + R_2}
$$

> [!NOTE] Model assumption
> This calculation assumes no load is connected to the output.

## Worked example

Let $V_{\text{in}} = 5\,\text{V}$ and $R_1 = R_2 = 10\,\text{k}\Omega$.

| Quantity | Value |
| :--- | ---: |
| Input | 5.0 V |
| Predicted output | 2.5 V |

```python title="divider.py"
vin, r1, r2 = 5.0, 10000, 10000
vout = vin * r2 / (r1 + r2)
print(f"Predicted output: {vout:.2f} V")
```

## Try it

- [ ] Calculate the output for $R_1 = 20\,\text{k}\Omega$.
- [ ] Explain whether the output increases or decreases.

:::details Check your answer
With $R_2 = 10\,\text{k}\Omega$, the predicted output is
$5 \times 10 / 30 \approx 1.67\,\text{V}$, which is lower.

This is a calculation using nominal values, not a measured result.
:::

## Further reading

- [Voltage-divider note](../../notes/voltage-divider.html)
- [Markdown Article Template](../../resources/markdown-template.html)
