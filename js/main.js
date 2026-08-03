const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav-menu");

if (navToggle && navMenu) {
    const navLinks = navMenu.querySelectorAll("a");

    function setMenuState(isOpen) {
        navMenu.classList.toggle("is-open", isOpen);
        navToggle.classList.toggle("is-active", isOpen);

        navToggle.setAttribute(
            "aria-expanded",
            String(isOpen)
        );

        navToggle.setAttribute(
            "aria-label",
            isOpen
                ? "Close navigation"
                : "Open navigation"
        );
    }

    navToggle.addEventListener("click", function () {
        const isCurrentlyOpen =
            navToggle.getAttribute("aria-expanded") === "true";

        setMenuState(!isCurrentlyOpen);
    });

    navLinks.forEach(function (link) {
        link.addEventListener("click", function () {
            setMenuState(false);
        });
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            setMenuState(false);
        }
    });

    window.addEventListener("resize", function () {
        if (window.innerWidth > 768) {
            setMenuState(false);
        }
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

const notesGrid =
    document.querySelector("#notes-grid");

const noteFilterButtons =
    Array.from(
        document.querySelectorAll(
            ".note-filter-button"
        )
    );

const noteSearchInput =
    document.querySelector("#note-search");

const noteSearchClear =
    document.querySelector(
        "#notes-search-clear"
    );

const notesStatus =
    document.querySelector("#notes-status");

const notesEmptyState =
    document.querySelector(
        "#notes-empty-state"
    );

const notesEmptyTitle =
    document.querySelector(
        "#notes-empty-title"
    );

const notesEmptyText =
    document.querySelector(
        "#notes-empty-text"
    );


if (
    notesGrid &&
    typeof labNotes !== "undefined" &&
    Array.isArray(labNotes)
) {
    function validateLabNotesData(notes) {
        const validTypes =
            new Set([
                "lab",
                "circuit",
                "formula"
            ]);

        const requiredTextFields = [
            "id",
            "type",
            "category",
            "title",
            "summary",
            "date",
            "status"
        ];

        const usedIds =
            new Set();

        const usedUrls =
            new Set();


        notes.forEach(function (note, index) {
            const notePosition =
                `Lab note at index ${index}`;


            requiredTextFields.forEach(
                function (field) {
                    const value =
                        note[field];

                    if (
                        typeof value !== "string" ||
                        value.trim() === ""
                    ) {
                        console.warn(
                            `${notePosition} is missing ` +
                            `a valid "${field}" field.`,
                            note
                        );
                    }
                }
            );


            if (
                typeof note.id === "string" &&
                note.id.trim()
            ) {
                if (usedIds.has(note.id)) {
                    console.warn(
                        `Duplicate lab note id: ` +
                        `"${note.id}".`,
                        note
                    );
                }

                usedIds.add(note.id);
            }


            if (
                typeof note.type === "string" &&
                !validTypes.has(note.type)
            ) {
                console.warn(
                    `Invalid lab note type: ` +
                    `"${note.type}".`,
                    note
                );
            }


            if (!Array.isArray(note.tags)) {
                console.warn(
                    `${notePosition} must use an ` +
                    `array for "tags".`,
                    note
                );
            }


            if (
                typeof note.date === "string" &&
                !/^\d{4}-\d{2}-\d{2}$/.test(
                    note.date
                )
            ) {
                console.warn(
                    `${notePosition} should use ` +
                    `YYYY-MM-DD for "date".`,
                    note
                );
            }


            if (
                typeof note.url === "string" &&
                note.url.trim()
            ) {
                if (usedUrls.has(note.url)) {
                    console.warn(
                        `Duplicate lab note URL: ` +
                        `"${note.url}".`,
                        note
                    );
                }

                usedUrls.add(note.url);
            }
        });
    }


    validateLabNotesData(labNotes);


    let activeNoteFilter = "all";
    let noteSearchQuery = "";
    let noteSearchTimer;


    function normalizeNoteText(value) {
        return String(value ?? "")
            .normalize("NFKD")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();
    }


    function formatNoteDate(dateString) {
        const date =
            new Date(`${dateString}T00:00:00`);

        if (Number.isNaN(date.getTime())) {
            return dateString;
        }

        return new Intl.DateTimeFormat(
            "en-US",
            {
                year: "numeric",
                month: "short",
                day: "numeric"
            }
        ).format(date);
    }


    function getNoteTypeLabel(type) {
        const labels = {
            lab: "Lab",
            circuit: "Circuit",
            formula: "Formula"
        };

        return labels[type] || "Note";
    }


    function createNoteTags(tags) {
        if (
            !Array.isArray(tags) ||
            tags.length === 0
        ) {
            return "";
        }

        const tagItems =
            tags
                .map(function (tag) {
                    return `<li>${tag}</li>`;
                })
                .join("");

        return `
            <ul
                class="note-tags"
                aria-label="Note topics"
            >
                ${tagItems}
            </ul>
        `;
    }


    function escapeHtmlAttribute(value) {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll('"', "&quot;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;");
    }

    function createFormulaPreview(formula) {
        if (!formula) {
            return "";
        }

        const safeFormula =
            escapeHtmlAttribute(formula);


        return `
            <div
                class="note-formula"
                data-math="${safeFormula}"
                data-math-display="true"
                aria-label="Formula preview"
            ></div>
        `;
    }


    function createNoteCard(note) {
        const typeLabel =
            getNoteTypeLabel(note.type);

        const noteLinkMarkup =
            note.url
                ? `
                    <a
                        href="${note.url}"
                        class="note-link"
                    >
                        View Note
                    </a>
                `
                : `
                    <span class="note-link">
                        Details coming soon
                    </span>
                `;

        return `
            <article
                class="note-card"
                data-note-type="${note.type}"
            >

                <div class="note-card-header">

                    <span
                        class="
                            note-type
                            note-type-${note.type}
                        "
                    >
                        ${typeLabel}
                    </span>

                    <time
                        class="note-date"
                        datetime="${note.date}"
                    >
                        ${formatNoteDate(note.date)}
                    </time>

                </div>


                <p class="note-category">
                    ${note.category}
                </p>

                <h2 class="note-title">
                    ${note.title}
                </h2>

                <p class="note-summary">
                    ${note.summary}
                </p>


                ${createFormulaPreview(note.formula)}

                ${createNoteTags(note.tags)}


                <div class="note-card-footer">

                    <span class="note-status">
                        ${note.status}
                    </span>

                    ${noteLinkMarkup}

                </div>

            </article>
        `;
    }


    function getNoteSearchText(note) {
        const tags =
            Array.isArray(note.tags)
                ? note.tags
                : [];

        return normalizeNoteText(
            [
                note.title,
                note.type,
                note.category,
                note.summary,
                note.formula,
                note.formulaSearch,
                note.status,
                ...tags
            ].join(" ")
        );
    }


    function noteMatchesActiveFilter(note) {
        return (
            activeNoteFilter === "all" ||
            note.type === activeNoteFilter
        );
    }


    function noteMatchesSearch(note) {
        if (!noteSearchQuery) {
            return true;
        }

        return getNoteSearchText(note)
            .includes(noteSearchQuery);
    }


    function getVisibleNotes() {
        return labNotes.filter(
            function (note) {
                return (
                    noteMatchesActiveFilter(note) &&
                    noteMatchesSearch(note)
                );
            }
        );
    }


    function getActiveFilterLabel() {
        const activeButton =
            noteFilterButtons.find(
                function (button) {
                    return (
                        button.dataset.noteFilter ===
                        activeNoteFilter
                    );
                }
            );

        return activeButton
            ? activeButton.textContent.trim()
            : "All";
    }


    function renderLabNotes(notes) {
        notesGrid.innerHTML =
            notes
                .map(createNoteCard)
                .join("");


        renderMathElements(notesGrid);
    }


    function updateNotesStatus(visibleCount) {
        if (!notesStatus) {
            return;
        }

        const noteWord =
            visibleCount === 1
                ? "note"
                : "notes";

        const filterLabel =
            getActiveFilterLabel();

        const visibleQuery =
            noteSearchInput
                ? noteSearchInput.value.trim()
                : "";

        if (
            visibleQuery &&
            activeNoteFilter !== "all"
        ) {
            notesStatus.textContent =
                `${visibleCount} ${noteWord} matching ` +
                `“${visibleQuery}” in ${filterLabel}`;

            return;
        }

        if (visibleQuery) {
            notesStatus.textContent =
                `${visibleCount} ${noteWord} matching ` +
                `“${visibleQuery}”`;

            return;
        }

        if (activeNoteFilter !== "all") {
            notesStatus.textContent =
                `${visibleCount} ${noteWord} in ` +
                filterLabel;

            return;
        }

        notesStatus.textContent =
            `${visibleCount} ${noteWord}`;
    }


    function updateEmptyState(visibleCount) {
        if (!notesEmptyState) {
            return;
        }

        const hasResults =
            visibleCount > 0;

        notesEmptyState.hidden =
            hasResults;

        if (hasResults) {
            return;
        }

        const visibleQuery =
            noteSearchInput
                ? noteSearchInput.value.trim()
                : "";

        const filterLabel =
            getActiveFilterLabel();

        if (
            visibleQuery &&
            activeNoteFilter !== "all"
        ) {
            if (notesEmptyTitle) {
                notesEmptyTitle.textContent =
                    "No matching notes";
            }

            if (notesEmptyText) {
                notesEmptyText.textContent =
                    `No ${filterLabel.toLowerCase()} ` +
                    `notes match “${visibleQuery}”.`;
            }

            return;
        }

        if (visibleQuery) {
            if (notesEmptyTitle) {
                notesEmptyTitle.textContent =
                    "No matching notes";
            }

            if (notesEmptyText) {
                notesEmptyText.textContent =
                    `No notes match “${visibleQuery}”.`;
            }

            return;
        }

        if (notesEmptyTitle) {
            notesEmptyTitle.textContent =
                "No notes found";
        }

        if (notesEmptyText) {
            notesEmptyText.textContent =
                `There are currently no notes in ` +
                `${filterLabel}.`;
        }
    }


    function updateNoteFilterButtons() {
        noteFilterButtons.forEach(
            function (button) {
                const isActive =
                    button.dataset.noteFilter ===
                    activeNoteFilter;

                button.classList.toggle(
                    "is-active",
                    isActive
                );

                button.setAttribute(
                    "aria-pressed",
                    String(isActive)
                );
            }
        );
    }


    function updateSearchClearButton() {
        if (
            !noteSearchClear ||
            !noteSearchInput
        ) {
            return;
        }

        noteSearchClear.hidden =
            noteSearchInput.value.length === 0;
    }


    function updateLabNotesInterface() {
        const visibleNotes =
            getVisibleNotes();

        renderLabNotes(visibleNotes);

        updateNoteFilterButtons();

        updateNotesStatus(
            visibleNotes.length
        );

        updateEmptyState(
            visibleNotes.length
        );

        updateSearchClearButton();
    }


    function clearNoteSearch() {
        if (!noteSearchInput) {
            return;
        }

        noteSearchInput.value = "";
        noteSearchQuery = "";

        updateLabNotesInterface();

        noteSearchInput.focus();
    }


    noteFilterButtons.forEach(
        function (button) {
            button.addEventListener(
                "click",
                function () {
                    activeNoteFilter =
                        button.dataset.noteFilter ||
                        "all";

                    updateLabNotesInterface();
                }
            );
        }
    );


    if (noteSearchInput) {
        noteSearchInput.addEventListener(
            "input",
            function () {
                clearTimeout(noteSearchTimer);

                updateSearchClearButton();

                noteSearchTimer =
                    setTimeout(
                        function () {
                            noteSearchQuery =
                                normalizeNoteText(
                                    noteSearchInput.value
                                );

                            updateLabNotesInterface();
                        },
                        120
                    );
            }
        );


        noteSearchInput.addEventListener(
            "keydown",
            function (event) {
                if (
                    event.key === "Escape" &&
                    noteSearchInput.value
                ) {
                    clearNoteSearch();
                }
            }
        );
    }


    if (noteSearchClear) {
        noteSearchClear.addEventListener(
            "click",
            clearNoteSearch
        );
    }


    const initialNoteFilter =
        noteFilterButtons.find(
            function (button) {
                return (
                    button.getAttribute(
                        "aria-pressed"
                    ) === "true"
                );
            }
        ) || noteFilterButtons[0];


    if (initialNoteFilter) {
        activeNoteFilter =
            initialNoteFilter.dataset.noteFilter ||
            "all";
    }


    updateLabNotesInterface();
}