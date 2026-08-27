const labNotes = [
    {
        id: "ohms-law",
        type: "formula",
        category: "Circuit Analysis",
        title: "Ohm's Law",
        summary:
            "The fundamental relationship between voltage, current, and resistance in a resistive circuit.",
        formula: String.raw`
            V = IR
        `,
        formulaSearch:
            "V I R voltage current resistance",
        date: "2026-08-01",
        status: "Reference",        
        tags: [
            "Voltage",
            "Current",
            "Resistance"
        ]
    },

    {
        id: "rc-time-constant",
        type: "formula",
        category: "Analog Circuits",
        title: "RC Time Constant",
        summary:
            "A reference for estimating how quickly a resistor-capacitor circuit charges or discharges.",
        formula: String.raw`
            \tau = RC
        `,
        formulaSearch:
            "tau R C time constant resistor capacitor",
        date: "2026-08-02",
        status: "Reference",
        tags: [
            "RC Circuit",
            "Capacitor",
            "Transient"
        ]
    },

    {
        id: "voltage-divider",
        type: "circuit",
        category: "Analog Circuits",
        title: "Resistive Voltage Divider",
        summary:
            "A two-resistor circuit used to produce a lower output voltage from a higher input voltage.",
        formula: String.raw`
            V_{\text{out}}
            =
            V_{\text{in}}
            \frac{R_2}{R_1 + R_2}
        `,
        formulaSearch:
            "Vout Vin R1 R2 voltage divider",
        date: "2026-08-03",
        status: "Documented",
        url: "notes/voltage-divider.html",
        tags: [
            "Resistors",
            "Voltage",
            "ADC Input"
        ]
    },

    {
        id: "led-current-limiting",
        type: "circuit",
        category: "Practical Circuits",
        title: "LED Current-Limiting Resistor",
        summary:
            "Selecting a resistor that limits LED current and protects both the LED and microcontroller output.",
        formula: String.raw`
            R =
            \frac{V_s - V_f}{I}
        `,
        formulaSearch:
            "R Vs Vf I supply forward voltage current",
        date: "2026-08-01",
        status: "Documented",
        tags: [
            "LED",
            "GPIO",
            "Protection"
        ]
    },

    {
        id: "esp32-i2c-oled-test",
        type: "lab",
        category: "Embedded Systems",
        title: "ESP32-S3 OLED I²C Test",
        summary:
            "Initial verification of the shared I²C bus using an ESP32-S3 and an OLED display on GPIO 8 and GPIO 9.",
        formula: "",
        date: "2026-08-01",
        status: "Completed",
        tags: [
            "ESP32-S3",
            "OLED",
            "I2C"
        ]
    },

    {
        id: "pwm-signal-test",
        type: "lab",
        category: "Instrumentation",
        title: "ESP32 PWM Signal Test",
        summary:
            "Testing output frequency and duty-cycle control for the portable signal-generator subsystem.",
        formula: String.raw`
            D =
            \frac{t_{\text{on}}}{T}
            \times 100\%
        `,
        formulaSearch:
            "D Ton T duty cycle PWM percent",
        date: "2026-08-01",
        status: "In Progress",
        tags: [
            "PWM",
            "Frequency",
            "Signal Generator"
        ]
    },

    {
        id: "pwm-signal-test",
        type: "course",
        category: "EELE 201",
        title: "Circuits I",
        summary:
            "A collection of the notes that I took in circuits I.",
        
        formulaSearch:
            "D Ton T duty cycle PWM percent",
        date: "2026-08-01",
        status: "In Progress",
        tags: [
            "PWM",
            "Frequency",
            "Signal Generator"
        ]
    }
];

/*
==================================================
LAB NOTE DATA TEMPLATE

复制下面的对象，并放进 labNotes 数组中。
不要把本注释中的模板直接取消注释。
==================================================

{
    id: "NOTE_SLUG",

    type: "lab",

    category: "NOTE_CATEGORY",

    title: "NOTE_TITLE",

    summary:
        "Write a concise one- or two-sentence description.",

    formula: String.raw`
        V = IR
    `,

    formulaSearch:
        "V I R voltage current resistance",

    date: "YYYY-MM-DD",

    status: "Draft",

    url: "notes/NOTE_SLUG.html",

    tags: [
        "TAG_ONE",
        "TAG_TWO",
        "TAG_THREE"
    ]
}

Valid type values:

- "lab"
- "circuit"
- "formula"

Recommended status values:

- "Draft"
- "Planned"
- "In Progress"
- "Completed"
- "Documented"
- "Reference"

For a note without a formula:

formula: "",
formulaSearch: "",

*/