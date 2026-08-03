(function () {
    const storageKey =
        "ee-portfolio-theme";

    const root =
        document.documentElement;

    const systemThemeQuery =
        window.matchMedia(
            "(prefers-color-scheme: light)"
        );


    function getCurrentTheme() {
        return root.dataset.theme === "light"
            ? "light"
            : "dark";
    }


    function updateThemeColor(theme) {
        const themeColorMeta =
            document.querySelector(
                'meta[name="theme-color"]'
            );

        if (!themeColorMeta) {
            return;
        }

        themeColorMeta.setAttribute(
            "content",
            theme === "light"
                ? "#f5f7fb"
                : "#0f1115"
        );
    }


    function updateThemeControls() {
        const currentTheme =
            getCurrentTheme();

        const nextTheme =
            currentTheme === "dark"
                ? "light"
                : "dark";

        const nextThemeLabel =
            nextTheme === "light"
                ? "Light mode"
                : "Dark mode";

        const accessibleLabel =
            `Switch to ${nextTheme} theme`;

        const themeButtons =
            document.querySelectorAll(
                "[data-theme-toggle]"
            );


        themeButtons.forEach(
            function (button) {
                button.setAttribute(
                    "aria-label",
                    accessibleLabel
                );

                button.setAttribute(
                    "title",
                    accessibleLabel
                );

                button.dataset.currentTheme =
                    currentTheme;


                const visibleLabel =
                    button.querySelector(
                        ".theme-toggle-label"
                    );

                if (visibleLabel) {
                    visibleLabel.textContent =
                        nextThemeLabel;
                }
            }
        );
    }


    function saveTheme(theme) {
        try {
            localStorage.setItem(
                storageKey,
                theme
            );
        } catch (error) {
            console.warn(
                "The selected theme could not be saved.",
                error
            );
        }
    }


    function applyTheme(
        theme,
        options = {}
    ) {
        const persist =
            options.persist !== false;

        const source =
            options.source ||
            (
                persist
                    ? "user"
                    : "system"
            );


        root.dataset.theme =
            theme;

        root.dataset.themeSource =
            source;

        root.style.colorScheme =
            theme;


        if (persist) {
            saveTheme(theme);
        }


        updateThemeColor(theme);
        updateThemeControls();
    }


    function toggleTheme() {
        const currentTheme =
            getCurrentTheme();

        const nextTheme =
            currentTheme === "dark"
                ? "light"
                : "dark";

        applyTheme(nextTheme, {
            persist: true,
            source: "user"
        });
    }


    function handleSystemThemeChange(
        event
    ) {
        if (
            root.dataset.themeSource !==
            "system"
        ) {
            return;
        }

        applyTheme(
            event.matches
                ? "light"
                : "dark",
            {
                persist: false,
                source: "system"
            }
        );
    }


    function initializeThemeControls() {
        const themeButtons =
            document.querySelectorAll(
                "[data-theme-toggle]"
            );


        themeButtons.forEach(
            function (button) {
                button.addEventListener(
                    "click",
                    toggleTheme
                );
            }
        );


        updateThemeControls();


        if (
            typeof systemThemeQuery
                .addEventListener ===
            "function"
        ) {
            systemThemeQuery.addEventListener(
                "change",
                handleSystemThemeChange
            );
        } else if (
            typeof systemThemeQuery
                .addListener ===
            "function"
        ) {
            systemThemeQuery.addListener(
                handleSystemThemeChange
            );
        }
    }


    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initializeThemeControls
        );
    } else {
        initializeThemeControls();
    }
})();