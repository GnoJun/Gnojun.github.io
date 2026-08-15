const resourceLibrary = [
    {
        id: "esp32-s3-component-reference",

        category: "embedded",

        categoryLabel: "Embedded",

        date:
            "2026-08-04",

        title: "ESP32-S3 N16R8 Component Reference",

        provider:
            "Junlong Engineering Portfolio",

        resourceType:
            "Internal Reference",

        description:
            "A project-specific reference covering the ESP32-S3 logic level, interfaces, current pin assignments, safety considerations, and lab-station integration.",

        url:
            "components/esp32-s3-n16r8.html",

        external: false,

        linkLabel:
            "View Reference",

        tags: [
            "ESP32-S3",
            "Microcontroller",
            "GPIO",
            "I2C",
            "Embedded Systems"
        ]
    },

    {
        id: "voltage-divider-note",

        category: "circuits",

        categoryLabel: "Circuits",

        date:
            "2026-08-14",

        title: "Resistive Voltage Divider",

        provider:
            "Junlong Engineering Portfolio",

        resourceType:
            "Technical Note",

        description:
            "A technical note explaining the voltage-divider circuit, equation, variables, worked example, applications, and loading limitations.",

        url:
            "notes/voltage-divider.html",

        external: false,

        linkLabel:
            "View Note",

        tags: [
            "Voltage Divider",
            "Resistors",
            "ADC",
            "Analog Circuits"
        ]
    },

    {
        id: "esp32-s3-official-documentation",

        category: "official-docs",

        categoryLabel: "Official Docs",

        date:
            "2026-08-14",

        title: "ESP32-S3 Programming Documentation",

        provider:
            "Espressif Systems",

        resourceType:
            "Official Documentation",

        description:
            "The primary documentation collection to consult when verifying ESP32-S3 peripherals, GPIO behavior, development workflows, and hardware capabilities.",

        url: "https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/index.html",

        external: true,

        linkLabel:
            "Open Documentation",

        tags: [
            "ESP32-S3",
            "ESP-IDF",
            "GPIO",
            "Peripherals",
            "Official Documentation"
        ]
    },

    {
        id: "basys-3-board-documentation",

        category: "fpga",

        categoryLabel: "FPGA & Digital",

        date:
            "2026-08-14",

        title: "Basys 3 Board Documentation",

        provider:
            "Digilent",

        resourceType:
            "Board Reference",

        description:
            "Reference material for the Basys 3 development board, onboard I/O, FPGA interfaces, constraints, and digital-design experiments.",

        url: "https://digilent.com/reference/programmable-logic/basys-3/reference-manual?srsltid=AfmBOooB36XsQT08y6lmVcQIBrJ1Oik4MMuhSRfBj--tTuyGNHtuGmFF",

        external: true,

        linkLabel:
            "Open Documentation",

        tags: [
            "Basys 3",
            "FPGA",
            "Artix-7",
            "Verilog",
            "Digital Design"
        ]
    },

    {
        id: "hdl-learning-reference",

        category: "fpga",

        categoryLabel: "FPGA & Digital",

        date:
            "2026-08-14",

        title: "HDL and Digital Design Reference",

        provider:
            "Learning Collection",

        resourceType:
            "Learning Reference",

        description:
            "A future collection for Verilog syntax, combinational logic, sequential logic, finite-state machines, simulation, and timing concepts.",

        url: "",

        external: true,

        linkLabel:
            "Open Resource",

        tags: [
            "Verilog",
            "HDL",
            "FSM",
            "Timing",
            "Digital Logic"
        ]
    },

    {
        id: "circuit-simulation-reference",

        category: "circuits",

        categoryLabel: "Circuits",

        date:
            "2026-08-14",

        title: "Circuit Simulation Reference",

        provider:
            "Simulation Tools Collection",

        resourceType:
            "Tool Reference",

        description:
            "A future collection of circuit-simulation tools and references for testing analog behavior, transient response, filters, and component values.",

        url: "",

        external: true,

        linkLabel:
            "Open Resource",

        tags: [
            "Simulation",
            "SPICE",
            "Analog Circuits",
            "Transient Analysis"
        ]
    },

    {
        id: "kicad-documentation",

        category: "pcb",

        categoryLabel: "PCB",

        date:
            "2026-08-14",

        title: "KiCad Documentation",

        provider:
            "KiCad Project",

        resourceType:
            "Software Documentation",

        description:
            "Documentation for schematic capture, symbol and footprint management, PCB layout, design-rule checking, and manufacturing-file generation.",

        url: "",

        external: true,

        linkLabel:
            "Open Documentation",

        tags: [
            "KiCad",
            "PCB",
            "Schematic",
            "Footprint",
            "Gerber"
        ]
    },

    {
        id: "web-platform-documentation",

        category: "tools",

        categoryLabel: "Tools",

        date:
            "2026-08-14",

        title: "Web Platform Documentation",

        provider:
            "Web Development Reference",

        resourceType:
            "Development Reference",

        description:
            "A future reference for semantic HTML, responsive CSS, JavaScript APIs, accessibility, and browser-compatible portfolio development.",

        url: "",

        external: true,

        linkLabel:
            "Open Documentation",

        tags: [
            "HTML",
            "CSS",
            "JavaScript",
            "Accessibility",
            "Responsive Design"
        ]
    },

    {
        id: "git-workflow-reference",

        category: "tools",

        categoryLabel: "Tools",

        date:
            "2026-08-14",

        title: "Git and GitHub Workflow Reference",

        provider:
            "Development Tools Collection",

        resourceType:
            "Workflow Reference",

        description:
            "A practical reference for commits, repository synchronization, GitHub workflows, project history, and safe multi-device development.",

        url:
            "resources/git-workflow.html",

        external:
            false,

        linkLabel:
            "View Guide",

        tags: [
            "Git",
            "GitHub",
            "Version Control",
            "GitHub Pages",
            "Deployment"
        ]
    },

    {
        id: "site-health-audit",

        category: "tools",

        categoryLabel: "Tools",

        date:
            "2026-08-01",

        title: "Site Health Audit",

        provider:
            "Junlong Engineering Portfolio",

        resourceType:
            "Development Utility",

        description:
            "Scan portfolio pages for broken internal resources, accessibility problems, invalid links, duplicate IDs, and structural issues.",

        url: "dev-audit.html",

        external: false,

        linkLabel:
            "View Page",

        tags: [
            "HTML",
            "CSS",
            "JavaScript"
        ]
    },

    {
        id: "responsive-test-lab",

        category: "tools",

        categoryLabel: "Tools",

        date:
            "2026-08-01",

        title: "Responsive Test Lab",

        provider:
            "Junlong Engineering Portfolio",

        resourceType:
            "Development Utility",

        description:
            "Preview portfolio pages at controlled viewport widths and automatically detect horizontal overflow and incorrect multi-column layouts.",

        url: "responsive-test.html",

        external: false,

        linkLabel:
            "View Page",

        tags: [
            "HTML",
            "CSS",
            "JavaScript"
        ]
    }
];