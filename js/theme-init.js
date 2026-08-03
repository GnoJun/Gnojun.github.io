(function () {
    const storageKey =
        "ee-portfolio-theme";

    const root =
        document.documentElement;

    const systemThemeQuery =
        window.matchMedia(
            "(prefers-color-scheme: light)"
        );


    let savedTheme = null;


    try {
        const storedValue =
            localStorage.getItem(
                storageKey
            );

        if (
            storedValue === "light" ||
            storedValue === "dark"
        ) {
            savedTheme = storedValue;
        }
    } catch (error) {
        savedTheme = null;
    }


    const systemTheme =
        systemThemeQuery.matches
            ? "light"
            : "dark";


    const initialTheme =
        savedTheme || systemTheme;


    root.dataset.theme =
        initialTheme;

    root.dataset.themeSource =
        savedTheme
            ? "user"
            : "system";

    root.style.colorScheme =
        initialTheme;


    const themeColorMeta =
        document.querySelector(
            'meta[name="theme-color"]'
        );


    if (themeColorMeta) {
        themeColorMeta.setAttribute(
            "content",
            initialTheme === "light"
                ? "#f5f7fb"
                : "#0f1115"
        );
    }
})();