const homeDashboard = {
    currentFocus: {
        eyebrow:
            "Current Engineering Focus",

        title:
            "ESP32-S3 Portable Lab Station",

        description:
            "A portable engineering platform built around the ESP32-S3, with an OLED interface and signal-generation and measurement tools in development.",

        status:
            "Active Development",

        projectUrl:
            "projects/esp32-lab-station.html",

        milestones: [
            {
                label:
                    "OLED menu system",

                status:
                    "implemented"
            },

            {
                label:
                    "Signal generator",

                status:
                    "prototype"
            },

            {
                label:
                    "Oscilloscope",

                status:
                    "prototype"
            },

            {
                label:
                    "Passive buzzer",

                status:
                    "prototype"
            },

            {
                label:
                    "Wireless communication",

                status:
                    "planned"
            }
        ]
    },



    resourceSummaries: {
        "esp32-s3-n16r8": "Pinout, interfaces, and electrical limits for the ESP32-S3 N16R8.",
        "voltage-divider": "A worked example of voltage scaling, with equations and loading limits.",
        "esp32-s3-official-documentation": "Official documentation for developing with the ESP32-S3."
    },

    featuredResourceIds: [
        "esp32-s3-n16r8",
        "voltage-divider",
        "esp32-s3-official-documentation"
    ]
};