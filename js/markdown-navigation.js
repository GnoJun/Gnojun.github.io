(function () {
    const navigation =
        document.querySelector(
            "[data-markdown-navigation]"
        );

    const markdownDocument =
        document.querySelector(
            ".markdown-document[data-markdown-src]"
        );


    if (
        !navigation ||
        !markdownDocument
    ) {
        return;
    }


    const tocList =
        navigation.querySelector(
            "[data-markdown-toc-list]"
        );

    const progressElement =
        navigation.querySelector(
            ".markdown-reading-progress"
        );

    const progressBar =
        navigation.querySelector(
            ".markdown-reading-progress-bar"
        );

    const navigationContent =
        navigation.querySelector(
            "[data-markdown-navigation-content]"
        );

    const navigationToggle =
        navigation.querySelector(
            "[data-markdown-navigation-toggle]"
        );


    if (
        !tocList ||
        !progressElement ||
        !progressBar ||
        !navigationContent ||
        !navigationToggle
    ) {
        return;
    }


    let headings = [];

    let currentSectionId = "";

    let updateRequested = false;

    let contentResizeObserver = null;

    let navigationCollapsed =
        false;


    function createHeadingId(text) {
        return String(text ?? "")
            .toLowerCase()
            .replace(
                /[^a-z0-9\s-]/g,
                ""
            )
            .trim()
            .replace(
                /\s+/g,
                "-"
            );
    }


    function prepareHeadingIds(
        headingElements
    ) {
        const usedIds =
            new Set();


        headingElements.forEach(
            function (
                heading,
                index
            ) {
                const headingText =
                    heading
                        .textContent
                        .trim();


                const baseId =
                    heading.id ||
                    createHeadingId(
                        headingText
                    ) ||
                    `section-${index + 1}`;


                let finalId =
                    baseId;

                let suffix = 2;


                while (
                    usedIds.has(
                        finalId
                    )
                ) {
                    finalId =
                        `${baseId}-${suffix}`;

                    suffix += 1;
                }


                heading.id =
                    finalId;

                usedIds.add(
                    finalId
                );
            }
        );
    }


    function getMarkdownHeadings() {
        return Array.from(
            markdownDocument
                .querySelectorAll(
                    "h2"
                )
        ).filter(
            function (heading) {
                return Boolean(
                    heading
                        .textContent
                        .trim()
                );
            }
        );
    }


    function createTocLink(
        heading
    ) {
        const listItem =
            document.createElement(
                "li"
            );

        const link =
            document.createElement(
                "a"
            );


        link.className =
            "project-toc-link";

        link.href =
            `#${heading.id}`;

        link.textContent =
            heading
                .textContent
                .trim();


        listItem.appendChild(
            link
        );


        return listItem;
    }


    function renderToc() {
        tocList.replaceChildren();


        const fragment =
            document
                .createDocumentFragment();


        headings.forEach(
            function (heading) {
                fragment.appendChild(
                    createTocLink(
                        heading
                    )
                );
            }
        );


        tocList.appendChild(
            fragment
        );
    }


    function getTocLinks() {
        return Array.from(
            tocList.querySelectorAll(
                ".project-toc-link"
            )
        );
    }

    function updateNavigationToggle() {
        navigation.classList.toggle(
            "is-collapsed",
            navigationCollapsed
        );


        navigationToggle.setAttribute(
            "aria-expanded",
            String(
                !navigationCollapsed
            )
        );


        navigationToggle.setAttribute(
            "aria-label",
            navigationCollapsed
                ? "Show section navigation"
                : "Hide section navigation"
        );


        navigationToggle.setAttribute(
            "title",
            navigationCollapsed
                ? "Show section navigation"
                : "Hide section navigation"
        );


        const label =
            navigationToggle.querySelector(
                ".markdown-navigation-toggle-label"
            );


        if (label) {
            label.textContent =
                navigationCollapsed
                    ? "Sections"
                    : "Hide";
        }


        document.documentElement
            .style
            .setProperty(
                "--markdown-toc-offset",
                navigationCollapsed
                    ? "0px"
                    : "var(--toc-height)"
            );
    }

    function getStickyOffset() {
        const siteHeader =
            document.querySelector(
                ".site-header"
            );


        const navigationHeight =
            navigationCollapsed
                ? 0
                : navigation.offsetHeight;


        return (
            (siteHeader?.offsetHeight || 0) +
            navigationHeight +
            16
        );
    }

    function setActiveHeading(
        headingId
    ) {
        if (
            !headingId ||
            currentSectionId ===
                headingId
        ) {
            return;
        }


        const tocLinks =
            getTocLinks();


        const activeLink =
            tocLinks.find(
                function (link) {
                    return (
                        link.hash.slice(1) ===
                        headingId
                    );
                }
            );


        if (!activeLink) {
            return;
        }


        currentSectionId =
            headingId;


        tocLinks.forEach(
            function (link) {
                link.removeAttribute(
                    "aria-current"
                );
            }
        );


        activeLink.setAttribute(
            "aria-current",
            "location"
        );


        const prefersReducedMotion =
            window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches;


        const targetLeft =
            activeLink.offsetLeft -
            (
                tocList.clientWidth -
                activeLink.clientWidth
            ) / 2;


        tocList.scrollTo({
            left:
                Math.max(
                    0,
                    targetLeft
                ),

            behavior:
                prefersReducedMotion
                    ? "auto"
                    : "smooth"
        });
    }


    function updateActiveHeading() {
        if (
            headings.length === 0
        ) {
            return;
        }


        const readingLine =
            window.scrollY +
            getStickyOffset() +
            1;


        let activeHeading =
            headings[0];


        headings.forEach(
            function (heading) {
                const headingTop =
                    heading
                        .getBoundingClientRect()
                        .top +
                    window.scrollY;


                if (
                    headingTop <=
                    readingLine
                ) {
                    activeHeading =
                        heading;
                }
            }
        );


        setActiveHeading(
            activeHeading.id
        );
    }


    function getProgressStartHeading() {
        return (
            markdownDocument
                .querySelector(
                    "#overview"
                ) ||
            headings[0] ||
            null
        );
    }


    function updateReadingProgress() {
        const startHeading =
            getProgressStartHeading();


        if (!startHeading) {
            return;
        }


        const stickyOffset =
            getStickyOffset();


        const headingTop =
            startHeading
                .getBoundingClientRect()
                .top +
            window.scrollY;


        const documentBottom =
            markdownDocument
                .getBoundingClientRect()
                .bottom +
            window.scrollY;


        const startScroll =
            headingTop -
            stickyOffset;


        const endScroll =
            Math.max(
                startScroll + 1,

                documentBottom -
                window.innerHeight
            );


        const rawProgress =
            (
                window.scrollY -
                startScroll
            ) /
            (
                endScroll -
                startScroll
            );


        const progress =
            Math.min(
                Math.max(
                    rawProgress,
                    0
                ),
                1
            );


        const percentage =
            Math.round(
                progress * 100
            );


        progressBar.style.transform =
            `scaleX(${progress})`;


        progressElement.setAttribute(
            "aria-valuenow",
            String(
                percentage
            )
        );
    }


    function updateNavigation() {
        updateActiveHeading();

        updateReadingProgress();
    }


    function requestNavigationUpdate() {
        if (updateRequested) {
            return;
        }


        updateRequested = true;


        window.requestAnimationFrame(
            function () {
                updateNavigation();

                updateRequested =
                    false;
            }
        );
    }

    function toggleNavigation() {
        navigationCollapsed =
            !navigationCollapsed;


        updateNavigationToggle();


        requestNavigationUpdate();
    }

    function initializeNavigation() {
        headings =
            getMarkdownHeadings();


        if (
            headings.length === 0
        ) {
            navigation.hidden =
                true;

            return;
        }


        navigation.hidden =
            false;

        updateNavigationToggle();


        prepareHeadingIds(
            headings
        );


        renderToc();


        currentSectionId =
            "";


        updateNavigation();


        if (
            typeof ResizeObserver !==
            "undefined"
        ) {
            if (
                contentResizeObserver
            ) {
                contentResizeObserver
                    .disconnect();
            }


            contentResizeObserver =
                new ResizeObserver(
                    requestNavigationUpdate
                );


            contentResizeObserver
                .observe(
                    markdownDocument
                );
        }
    }


    window.addEventListener(
        "scroll",
        requestNavigationUpdate,
        {
            passive: true
        }
    );


    window.addEventListener(
        "resize",
        requestNavigationUpdate
    );

    navigationToggle
        .addEventListener(
            "click",
            toggleNavigation
        );


    document.addEventListener(
        "markdown:rendered",
        function (event) {
            if (
                event.target !==
                markdownDocument
            ) {
                return;
            }


            initializeNavigation();
        }
    );


    if (
        markdownDocument
            .querySelector("h2")
    ) {
        initializeNavigation();
    }
})();