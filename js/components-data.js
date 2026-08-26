const componentLibrary = [
    {
        id: "esp32-s3-n16r8",

        category: "controller",

        categoryLabel: "Controller",

        date:
            "2026-08-11",

        name: "ESP32-S3 N16R8",

        model: "ESP32-S3 development board",

        supply:
            "5 V USB input / 3.3 V logic",

        interfaces:
            "Wi-Fi, Bluetooth, I²C, SPI, UART, USB",

        status: "In Use",

        summary:
            "The primary microcontroller platform for my portable lab station, display interfaces, wireless communication, and embedded-system experiments.",

        detailsUrl:
            "components/esp32-s3-n16r8.html",
        projectUrl:
            "",

        datasheetUrl: "",

        tags: [
            "ESP32-S3",
            "Embedded",
            "Wireless",
            "USB",
            "GPIO"
        ]
    },


    {
        id: "pn532-nfc-module",

        category: "communication",

        categoryLabel: "Communication",

        date:
            "2026-08-11",

        name: "PN532 NFC Module",

        model: "PN532-based NFC reader module",

        supply:
            "Module-dependent — verify board version",

        interfaces:
            "I²C, SPI, or HSU depending on configuration",

        status: "In Use",

        summary:
            "An NFC reader module used for contactless-card experiments, card identification, and balance-system prototypes.",

        projectUrl: "",

        datasheetUrl: "",

        tags: [
            "NFC",
            "RFID",
            "PN532",
            "I2C",
            "Contactless"
        ]
    },

    {
        id: "sh1106-oled",

        category: "display",

        categoryLabel: "Display",

        date:
            "2026-08-11",

        name: "SH1106 OLED Display",

        model: "Monochrome OLED module",

        supply:
            "Module-dependent — verify board version",

        interfaces:
            "I²C or SPI depending on module",

        status: "In Use",

        summary:
            "A compact monochrome display used for embedded menus, measurement results, system information, and portable user interfaces.",

        projectUrl:
            "projects/esp32-lab-station.html",

        datasheetUrl: "",

        tags: [
            "OLED",
            "SH1106",
            "Display",
            "I2C",
            "U8g2"
        ]
    },

    {
        id: "ssd1306-oled",

        category: "display",

        categoryLabel: "Display",

        date:
            "2026-08-11",

        name: "SSD1306 OLED Display",

        model: "Monochrome OLED module",

        supply:
            "Module-dependent — verify board version",

        interfaces:
            "I²C or SPI depending on module",

        status: "Available",

        summary:
            "A common OLED display platform suitable for sensor values, compact interfaces, icons, and low-power embedded applications.",

        projectUrl: "",

        datasheetUrl: "",

        tags: [
            "OLED",
            "SSD1306",
            "Display",
            "I2C",
            "Embedded UI"
        ]
    },

    {
        id: "basys-3",

        category: "digital-logic",

        categoryLabel: "Digital Logic",

        date:
            "2026-08-11",

        name: "Basys 3 FPGA Board",

        model: "Artix-7 FPGA development board",

        supply:
            "USB powered",

        interfaces:
            "FPGA I/O, switches, LEDs, displays, and PMOD",

        status: "Learning",

        summary:
            "An FPGA development platform used for digital logic, finite-state machines, Verilog, timing analysis, and hardware verification.",

        projectUrl: "",

        datasheetUrl: "",

        tags: [
            "FPGA",
            "Artix-7",
            "Verilog",
            "Digital Design",
            "Basys 3"
        ]
    }
];