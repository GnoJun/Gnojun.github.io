const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

if (navToggle && navMenu) {
    const dropdown = navMenu.querySelector('[data-courses-dropdown]');
    const summary = dropdown?.querySelector('summary');
    const courseLinks = dropdown ? [...dropdown.querySelectorAll('a')] : [];
    const hoverQuery = window.matchMedia('(min-width: 769px) and (hover: hover) and (pointer: fine)');
    const mobileQuery = window.matchMedia('(max-width: 768px)');
    let openedByHover = false;

    function closeCourses() {
        if (dropdown) dropdown.open = false;
        openedByHover = false;
    }

    function setMenuState(isOpen, restoreFocus = false) {
        navMenu.classList.toggle('is-open', isOpen);
        navToggle.classList.toggle('is-active', isOpen);
        navToggle.setAttribute('aria-expanded', String(isOpen));
        navToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
        if (!isOpen) closeCourses();
        if (restoreFocus) navToggle.focus();
    }

    navToggle.addEventListener('click', () => {
        setMenuState(navToggle.getAttribute('aria-expanded') !== 'true');
    });
    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => setMenuState(false));
    });

    if (dropdown && summary) {
        dropdown.addEventListener('pointerenter', event => {
            if (event.pointerType !== 'touch' && hoverQuery.matches && !dropdown.open) {
                dropdown.open = true;
                openedByHover = true;
            }
        });
        dropdown.addEventListener('pointerleave', () => {
            if (openedByHover && !dropdown.contains(document.activeElement)) closeCourses();
        });
        dropdown.addEventListener('focusout', event => {
            if (!dropdown.contains(event.relatedTarget)) closeCourses();
        });
        summary.addEventListener('click', () => { openedByHover = false; });
        summary.addEventListener('keydown', event => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                dropdown.open = true;
                openedByHover = false;
                const link = event.key === 'ArrowDown' ? courseLinks[0] : courseLinks.at(-1);
                link?.focus();
            }
        });
    }

    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        if (dropdown?.open) {
            event.preventDefault();
            closeCourses();
            summary.focus();
        } else if (navMenu.classList.contains('is-open')) {
            event.preventDefault();
            setMenuState(false, true);
        }
    });
    document.addEventListener('pointerdown', event => {
        if (!event.target.closest('.navbar')) setMenuState(false);
        else if (dropdown && !dropdown.contains(event.target)) closeCourses();
    });
    document.addEventListener('focusin', event => {
        if (navMenu.classList.contains('is-open') && !event.target.closest('.navbar')) {
            setMenuState(false);
        }
    });
    mobileQuery.addEventListener('change', () => {
        const focusWasInMenu = navMenu.contains(document.activeElement);
        setMenuState(false, mobileQuery.matches && focusWasInMenu);
    });
}
const currentYear = document.querySelector("#current-year");

if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
}

const filterButtons =
    document.querySelectorAll(".filter-button");

const projectCards =
    document.querySelectorAll(".project-card[data-category]");

const filterStatus =
    document.querySelector("#filter-status");

const emptyState =
    document.querySelector("#empty-state");


if (filterButtons.length > 0 && projectCards.length > 0) {

    function updateFilterStatus(visibleCount, filterLabel) {
        if (!filterStatus) {
            return;
        }

        const projectWord =
            visibleCount === 1
                ? "project"
                : "projects";

        if (filterLabel === "All") {
            filterStatus.textContent =
                `${visibleCount} ${projectWord}`;

            return;
        }

        filterStatus.textContent =
            `${visibleCount} ${projectWord} in ${filterLabel}`;
    }


    function updateActiveButton(activeButton) {
        filterButtons.forEach(function (button) {
            const isActive =
                button === activeButton;

            button.classList.toggle(
                "is-active",
                isActive
            );

            button.setAttribute(
                "aria-pressed",
                String(isActive)
            );
        });
    }


    function filterProjects(filterValue) {
        let visibleCount = 0;

        projectCards.forEach(function (card) {
            const categoryValue =
                card.dataset.category || "";

            const categories =
                categoryValue
                    .split(/\s+/)
                    .filter(Boolean);

            const shouldShow =
                filterValue === "all" ||
                categories.includes(filterValue);

            card.hidden = !shouldShow;

            if (shouldShow) {
                visibleCount += 1;
            }
        });

        return visibleCount;
    }


    function applyProjectFilter(activeButton) {
        const filterValue =
            activeButton.dataset.filter || "all";

        const filterLabel =
            activeButton.textContent.trim();

        const visibleCount =
            filterProjects(filterValue);

        updateActiveButton(activeButton);

        updateFilterStatus(
            visibleCount,
            filterLabel
        );

        if (emptyState) {
            emptyState.hidden =
                visibleCount !== 0;
        }
    }


    filterButtons.forEach(function (button) {
        button.addEventListener(
            "click",
            function () {
                applyProjectFilter(button);
            }
        );
    });


    const initialButton =
        document.querySelector(
            '.filter-button[aria-pressed="true"]'
        ) || filterButtons[0];

    applyProjectFilter(initialButton);
}

const projectToc =
    document.querySelector(".project-toc");


if (projectToc) {
    const tocList =
        projectToc.querySelector(".project-toc-list");

    const tocLinks =
        Array.from(
            projectToc.querySelectorAll(
                '.project-toc-link[href^="#"]'
            )
        );

    const tocSections =
        tocLinks
            .map(function (link) {
                return document.querySelector(
                    link.getAttribute("href")
                );
            })
            .filter(Boolean);


    if (tocLinks.length > 0 && tocSections.length > 0) {
        const linkBySectionId =
            new Map(
                tocLinks.map(function (link) {
                    return [
                        link.hash.slice(1),
                        link
                    ];
                })
            );

        const visibleSections = new Map();

        let currentSectionId = "";
        let sectionObserver;
        let resizeTimer;


        function setActiveTocLink(sectionId) {
            if (
                !linkBySectionId.has(sectionId) ||
                currentSectionId === sectionId
            ) {
                return;
            }

            currentSectionId = sectionId;

            tocLinks.forEach(function (link) {
                link.removeAttribute("aria-current");
            });

            const activeLink =
                linkBySectionId.get(sectionId);

            activeLink.setAttribute(
                "aria-current",
                "location"
            );


            if (tocList) {
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
                    left: Math.max(0, targetLeft),
                    behavior:
                        prefersReducedMotion
                            ? "auto"
                            : "smooth"
                });
            }
        }


        function createSectionObserver() {
            if (sectionObserver) {
                sectionObserver.disconnect();
            }

            visibleSections.clear();

            const siteHeader =
                document.querySelector(".site-header");

            const stickyOffset =
                (siteHeader?.offsetHeight || 0) +
                projectToc.offsetHeight +
                16;

            sectionObserver =
                new IntersectionObserver(
                    function (entries) {
                        entries.forEach(function (entry) {
                            visibleSections.set(
                                entry.target.id,
                                entry
                            );
                        });

                        const activeSections =
                            tocSections
                                .filter(function (section) {
                                    const entry =
                                        visibleSections.get(
                                            section.id
                                        );

                                    return entry?.isIntersecting;
                                })
                                .sort(function (
                                    firstSection,
                                    secondSection
                                ) {
                                    const firstDistance =
                                        Math.abs(
                                            firstSection
                                                .getBoundingClientRect()
                                                .top -
                                            stickyOffset
                                        );

                                    const secondDistance =
                                        Math.abs(
                                            secondSection
                                                .getBoundingClientRect()
                                                .top -
                                            stickyOffset
                                        );

                                    return (
                                        firstDistance -
                                        secondDistance
                                    );
                                });

                        if (activeSections.length > 0) {
                            setActiveTocLink(
                                activeSections[0].id
                            );
                        }
                    },
                    {
                        rootMargin:
                            `-${stickyOffset}px 0px -55% 0px`,

                        threshold: [
                            0,
                            0.1,
                            0.25,
                            0.5,
                            0.75,
                            1
                        ]
                    }
                );

            tocSections.forEach(function (section) {
                sectionObserver.observe(section);
            });
        }


        tocLinks.forEach(function (link) {
            link.addEventListener(
                "click",
                function () {
                    setActiveTocLink(
                        link.hash.slice(1)
                    );
                }
            );
        });


        const initialSectionId =
            window.location.hash.slice(1);

        if (linkBySectionId.has(initialSectionId)) {
            setActiveTocLink(initialSectionId);
        } else {
            setActiveTocLink(tocSections[0].id);
        }


        createSectionObserver();


        window.addEventListener(
            "resize",
            function () {
                clearTimeout(resizeTimer);

                resizeTimer = setTimeout(
                    createSectionObserver,
                    150
                );
            }
        );
    }
}

const readingProgress =
    document.querySelector(".reading-progress");

const readingProgressBar =
    document.querySelector(".reading-progress-bar");

const floatingBackToTop =
    document.querySelector(".floating-back-to-top");


if (readingProgress && readingProgressBar) {
    let updateRequested = false;
    let previousPercentage = -1;


    function updateReadingInterface() {
        const scrollTop =
            window.scrollY ||
            document.documentElement.scrollTop;

        const scrollableHeight =
            document.documentElement.scrollHeight -
            window.innerHeight;

        const rawProgress =
            scrollableHeight > 0
                ? scrollTop / scrollableHeight
                : 0;

        const progress =
            Math.min(
                Math.max(rawProgress, 0),
                1
            );

        const percentage =
            Math.round(progress * 100);


        readingProgressBar.style.transform =
            `scaleX(${progress})`;


        if (percentage !== previousPercentage) {
            readingProgress.setAttribute(
                "aria-valuenow",
                String(percentage)
            );

            previousPercentage = percentage;
        }


        if (floatingBackToTop) {
            const shouldShowButton =
                scrollTop > 600;

            floatingBackToTop.classList.toggle(
                "is-visible",
                shouldShowButton
            );
        }
    }


    function requestReadingUpdate() {
        if (updateRequested) {
            return;
        }

        updateRequested = true;

        window.requestAnimationFrame(
            function () {
                updateReadingInterface();
                updateRequested = false;
            }
        );
    }


    window.addEventListener(
        "scroll",
        requestReadingUpdate,
        {
            passive: true
        }
    );


    window.addEventListener(
        "resize",
        requestReadingUpdate
    );


    document.addEventListener(
        "markdown:rendered",
        requestReadingUpdate
    );

    updateReadingInterface();
}

/* =========================
   Math Rendering
========================= */

function renderMathElements(root = document) {
    if (
        typeof window.katex === "undefined" ||
        !root
    ) {
        return;
    }

    const mathElements =
        root.querySelectorAll("[data-math]");


    mathElements.forEach(function (element) {
        const expression =
            element.dataset.math;

        const alreadyRendered =
            element.dataset.mathRendered === "true";

        if (!expression || alreadyRendered) {
            return;
        }

        const displayMode =
            element.dataset.mathDisplay !== "false";


        window.katex.render(
            expression,
            element,
            {
                displayMode: displayMode,
                throwOnError: false,
                strict: "warn"
            }
        );


        element.dataset.mathRendered =
            "true";
    });
}


renderMathElements(document);
