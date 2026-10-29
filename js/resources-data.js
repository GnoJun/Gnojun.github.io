// Shared catalogue for the Resources library and homepage.
// kind: note | component | reference. Entries without a URL are inline references.
const resourceLibrary = [
    {
        "id": "ohms-law",
        "kind": "note",
        "category": "Circuit Analysis",
        "title": "Ohm's Law",
        "description": "The fundamental relationship between voltage, current, and resistance in a resistive circuit.",
        "tags": [
            "Voltage",
            "Current",
            "Resistance"
        ],
        "external": false,
        "date": "2026-08-01",
        "status": "Reference",
        "formula": "V = IR",
        "formulaSearch": "V I R voltage current resistance"
    },
    {
        "id": "rc-time-constant",
        "kind": "note",
        "category": "Analog Circuits",
        "title": "RC Time Constant",
        "description": "A reference for estimating how quickly a resistor-capacitor circuit charges or discharges.",
        "tags": [
            "RC Circuit",
            "Capacitor",
            "Transient"
        ],
        "external": false,
        "date": "2026-08-02",
        "status": "Reference",
        "formula": "\\tau = RC",
        "formulaSearch": "tau R C time constant resistor capacitor"
    },
    {
        "id": "voltage-divider",
        "kind": "note",
        "category": "Analog Circuits",
        "title": "Resistive Voltage Divider",
        "description": "A two-resistor circuit used to produce a lower output voltage from a higher input voltage. A technical note explaining the voltage-divider circuit, equation, variables, worked example, applications, and loading limitations.",
        "tags": [
            "Resistors",
            "Voltage",
            "ADC Input",
            "Voltage Divider",
            "ADC",
            "Analog Circuits"
        ],
        "url": "notes/voltage-divider.html",
        "external": false,
        "date": "2026-08-14",
        "status": "Documented",
        "formula": "V_{\\text{out}}\n            =\n            V_{\\text{in}}\n            \\frac{R_2}{R_1 + R_2}",
        "formulaSearch": "Vout Vin R1 R2 voltage divider",
        "provider": "Junlong Engineering Portfolio",
        "resourceType": "Technical Note"
    },
    {
        "id": "led-current-limiting",
        "kind": "note",
        "category": "Practical Circuits",
        "title": "LED Current-Limiting Resistor",
        "description": "Selecting a resistor that limits LED current and protects both the LED and microcontroller output.",
        "tags": [
            "LED",
            "GPIO",
            "Protection"
        ],
        "external": false,
        "date": "2026-08-01",
        "status": "Documented",
        "formula": "R =\n            \\frac{V_s - V_f}{I}",
        "formulaSearch": "R Vs Vf I supply forward voltage current"
    },
    {
        "id": "esp32-i2c-oled-test",
        "kind": "note",
        "category": "Embedded Systems",
        "title": "ESP32-S3 OLED I²C Test",
        "description": "Initial verification of the shared I²C bus using an ESP32-S3 and an OLED display on GPIO 8 and GPIO 9.",
        "tags": [
            "ESP32-S3",
            "OLED",
            "I2C"
        ],
        "external": false,
        "date": "2026-08-01",
        "status": "Completed"
    },
    {
        "id": "pwm-signal-test",
        "kind": "note",
        "category": "Instrumentation",
        "title": "ESP32 PWM Signal Test",
        "description": "Testing output frequency and duty-cycle control for the portable signal-generator subsystem.",
        "tags": [
            "PWM",
            "Frequency",
            "Signal Generator"
        ],
        "external": false,
        "date": "2026-08-01",
        "status": "In Progress",
        "formula": "D =\n            \\frac{t_{\\text{on}}}{T}\n            \\times 100\\%",
        "formulaSearch": "D Ton T duty cycle PWM percent"
    },
    {
        "id": "eele201",
        "kind": "note",
        "category": "EELE 201",
        "title": "Circuits I",
        "description": "A collection of the notes that I took in circuits I.",
        "tags": [
            "PWM",
            "Frequency",
            "Signal Generator"
        ],
        "url": "notes/eele201.html",
        "external": false,
        "date": "2026-08-01",
        "status": "In Progress",
        "formulaSearch": "D Ton T duty cycle PWM percent"
    },
    {
        "id": "esp32-s3-n16r8",
        "kind": "component",
        "category": "Controller",
        "title": "ESP32-S3 N16R8",
        "description": "The primary microcontroller platform for my portable lab station, display interfaces, wireless communication, and embedded-system experiments. A project-specific reference covering the ESP32-S3 logic level, pinout, and safety considerations.",
        "tags": [
            "ESP32-S3",
            "Embedded",
            "Wireless",
            "USB",
            "GPIO",
            "Microcontroller",
            "I2C",
            "Embedded Systems"
        ],
        "url": "components/esp32-s3-n16r8.html",
        "external": false,
        "date": "2026-08-11",
        "status": "In Use",
        "model": "ESP32-S3 development board",
        "supply": "5 V USB input / 3.3 V logic",
        "interfaces": "Wi-Fi, Bluetooth, I²C, SPI, UART, USB",
        "provider": "Junlong Engineering Portfolio",
        "resourceType": "Internal Reference"
    },
    {
        "id": "pn532-nfc-module",
        "kind": "component",
        "category": "Communication",
        "title": "PN532 NFC Module",
        "description": "An NFC reader module used for contactless-card experiments, card identification, and balance-system prototypes.",
        "tags": [
            "NFC",
            "RFID",
            "PN532",
            "I2C",
            "Contactless"
        ],
        "external": false,
        "date": "2026-08-11",
        "status": "In Use",
        "model": "PN532-based NFC reader module",
        "supply": "Module-dependent — verify board version",
        "interfaces": "I²C, SPI, or HSU depending on configuration"
    },
    {
        "id": "sh1106-oled",
        "kind": "component",
        "category": "Display",
        "title": "SH1106 OLED Display",
        "description": "A compact monochrome display used for embedded menus, measurement results, system information, and portable user interfaces.",
        "tags": [
            "OLED",
            "SH1106",
            "Display",
            "I2C",
            "U8g2"
        ],
        "external": false,
        "date": "2026-08-11",
        "status": "In Use",
        "model": "Monochrome OLED module",
        "supply": "Module-dependent — verify board version",
        "interfaces": "I²C or SPI depending on module",
        "projectUrl": "projects/esp32-lab-station.html"
    },
    {
        "id": "ssd1306-oled",
        "kind": "component",
        "category": "Display",
        "title": "SSD1306 OLED Display",
        "description": "A common OLED display platform suitable for sensor values, compact interfaces, icons, and low-power embedded applications.",
        "tags": [
            "OLED",
            "SSD1306",
            "Display",
            "I2C",
            "Embedded UI"
        ],
        "external": false,
        "date": "2026-08-11",
        "status": "Available",
        "model": "Monochrome OLED module",
        "supply": "Module-dependent — verify board version",
        "interfaces": "I²C or SPI depending on module"
    },
    {
        "id": "basys-3",
        "kind": "component",
        "category": "Digital Logic",
        "title": "Basys 3 FPGA Board",
        "description": "An FPGA development platform used for digital logic, finite-state machines, Verilog, timing analysis, and hardware verification.",
        "tags": [
            "FPGA",
            "Artix-7",
            "Verilog",
            "Digital Design",
            "Basys 3"
        ],
        "external": false,
        "date": "2026-08-11",
        "status": "Learning",
        "model": "Artix-7 FPGA development board",
        "supply": "USB powered",
        "interfaces": "FPGA I/O, switches, LEDs, displays, and PMOD"
    },
    {
        "id": "esp32-s3-official-documentation",
        "kind": "reference",
        "category": "Official Docs",
        "title": "ESP32-S3 Programming Documentation",
        "description": "The primary documentation collection to consult when verifying ESP32-S3 peripherals, GPIO behavior, development workflows, and hardware capabilities.",
        "tags": [
            "ESP32-S3",
            "ESP-IDF",
            "GPIO",
            "Peripherals",
            "Official Documentation"
        ],
        "url": "https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/index.html",
        "external": true,
        "date": "2026-08-14",
        "provider": "Espressif Systems",
        "resourceType": "Official Documentation"
    },
    {
        "id": "basys-3-board-documentation",
        "kind": "reference",
        "category": "FPGA & Digital",
        "title": "Basys 3 Board Documentation",
        "description": "Reference material for the Basys 3 development board, onboard I/O, FPGA interfaces, constraints, and digital-design experiments.",
        "tags": [
            "Basys 3",
            "FPGA",
            "Artix-7",
            "Verilog",
            "Digital Design"
        ],
        "url": "https://digilent.com/reference/programmable-logic/basys-3/reference-manual?srsltid=AfmBOooB36XsQT08y6lmVcQIBrJ1Oik4MMuhSRfBj--tTuyGNHtuGmFF",
        "external": true,
        "date": "2026-08-14",
        "provider": "Digilent",
        "resourceType": "Board Reference"
    },
    {
        "id": "hdl-learning-reference",
        "kind": "reference",
        "category": "FPGA & Digital",
        "title": "HDLBits — Digital Hardware Design Practice",
        "description": "An interactive problem set and reference for learning Verilog, combinational & sequential logic, finite-state machines, simulation, and timing concepts directly in your browser.",
        "tags": [
            "Verilog",
            "HDL",
            "FSM",
            "Timing",
            "Digital Logic"
        ],
        "url": "https://hdlbits.01xz.net/wiki/Main_Page",
        "external": true,
        "date": "2026-08-26",
        "provider": "HDLBits",
        "resourceType": "Learning Reference"
    },
    {
        "id": "circuit-lab",
        "kind": "reference",
        "category": "Circuits",
        "title": "Circuit Simulation and Schematics",
        "description": "Online circuit simulator and schematic editor. Easily build circuits with professional-grade schematics, and analyze analog/digital behavior, transient response, filters, and component values with SPICE-like simulation tools directly in your browser.",
        "tags": [
            "Simulation",
            "SPICE",
            "Analog Circuits",
            "Transient Analysis"
        ],
        "url": "https://www.circuitlab.com/",
        "external": true,
        "date": "2026-08-14",
        "provider": "CircuitLab",
        "resourceType": "Tool Reference"
    },
    {
        "id": "kicad-documentation",
        "kind": "reference",
        "category": "PCB",
        "title": "KiCad Documentation",
        "description": "It provides comprehensive user manuals, beginner guides, and reference materials for every tool in the software, including the schematic editor, PCB layout editor, and gerber viewer.",
        "tags": [
            "KiCad",
            "PCB",
            "Schematic",
            "Footprint",
            "Gerber"
        ],
        "url": "https://docs.kicad.org/",
        "external": true,
        "date": "2026-08-14",
        "provider": "KiCad Development Team",
        "resourceType": "Software Documentation"
    },
    {
        "id": "git-workflow-reference",
        "kind": "reference",
        "category": "Tools",
        "title": "Git and GitHub Workflow Reference",
        "description": "A practical reference for commits, repository synchronization, GitHub workflows, project history, and safe multi-device development.",
        "tags": [
            "Git",
            "GitHub",
            "Version Control",
            "GitHub Pages",
            "Deployment"
        ],
        "url": "resources/git-workflow.html",
        "external": false,
        "date": "2026-08-14",
        "provider": "Development Tools Collection",
        "resourceType": "Workflow Reference"
    },
    {
        "id": "site-health-audit",
        "kind": "reference",
        "category": "Tools",
        "title": "Site Health Audit",
        "description": "Scan portfolio pages for broken internal resources, accessibility problems, invalid links, duplicate IDs, and structural issues.",
        "tags": [
            "HTML",
            "CSS",
            "JavaScript"
        ],
        "url": "dev-audit.html",
        "external": false,
        "date": "2026-08-01",
        "provider": "Junlong Engineering Portfolio",
        "resourceType": "Development Utility"
    },
    {
        "id": "responsive-test-lab",
        "kind": "reference",
        "category": "Tools",
        "title": "Responsive Test Lab",
        "description": "Preview portfolio pages at controlled viewport widths and automatically detect horizontal overflow and incorrect multi-column layouts.",
        "tags": [
            "HTML",
            "CSS",
            "JavaScript"
        ],
        "url": "responsive-test.html",
        "external": false,
        "date": "2026-08-01",
        "provider": "Junlong Engineering Portfolio",
        "resourceType": "Development Utility"
    },
    {
        "id": "markdown-article-template",
        "kind": "reference",
        "category": "Tools",
        "title": "Markdown Article Template",
        "description": "A copyable writing guide with live examples of code, equations, tables, images, callouts, and expandable teaching exercises.",
        "tags": [
            "Markdown",
            "Template",
            "Writing",
            "Math",
            "Code"
        ],
        "url": "resources/markdown-template.html",
        "external": false,
        "date": "2026-10-29",
        "provider": "GnoJun",
        "resourceType": "Writing Guide"
    },
    {
        "id": "markdown-reference",
        "kind": "reference",
        "category": "Tools",
        "title": "Markdown Reference",
        "description": "A practical reference for the Markdown syntax, rendered elements, and CSS selectors used across the engineering portfolio.",
        "tags": [
            "HTML",
            "CSS",
            "JavaScript",
            "Markdown"
        ],
        "url": "resources/markdown-ref.html",
        "external": false,
        "date": "2026-08-17",
        "provider": "Junlong Engineering Portfolio",
        "resourceType": "Development Utility"
    }
];
