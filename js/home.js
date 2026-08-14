(function () {
    const focusContainer =
        document.querySelector(
            "#home-focus-container"
        );

    const recentNotesContainer =
        document.querySelector(
            "#home-recent-notes"
        );

    const featuredComponentsContainer =
        document.querySelector(
            "#home-featured-components"
        );

    const featuredResourcesContainer =
        document.querySelector(
            "#home-featured-resources"
        );


    if (
        !focusContainer &&
        !recentNotesContainer &&
        !featuredComponentsContainer &&
        !featuredResourcesContainer
    ) {
        return;
    }


    function escapeHomeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }


    function formatHomeDate(dateString) {
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


    function getMilestoneStatus(status) {
        const statuses = {
            implemented: {
                label: "Implemented",
                className: "implemented"
            },

            prototype: {
                label: "Prototype",
                className: "prototype"
            },

            testing: {
                label: "Testing",
                className: "testing"
            },

            planned: {
                label: "Planned",
                className: "planned"
            }
        };


        return (
            statuses[status] ||
            statuses.planned
        );
    }


    function createMilestoneMarkup(
        milestone
    ) {
        const milestoneStatus =
            getMilestoneStatus(
                milestone.status
            );


        return `
            <li class="home-milestone">

                <span
                    class="
                        home-milestone-indicator
                        home-milestone-indicator-${milestoneStatus.className}
                    "
                    aria-hidden="true"
                ></span>

                <span class="home-milestone-label">
                    ${escapeHomeHtml(
                        milestone.label
                    )}
                </span>

                <span
                    class="
                        home-milestone-status
                        home-milestone-status-${milestoneStatus.className}
                    "
                >
                    ${milestoneStatus.label}
                </span>

            </li>
        `;
    }


    function renderCurrentFocus() {
        if (
            !focusContainer ||
            typeof homeDashboard ===
                "undefined" ||
            !homeDashboard.currentFocus
        ) {
            return;
        }


        const focus =
            homeDashboard.currentFocus;

        const milestones =
            Array.isArray(focus.milestones)
                ? focus.milestones
                : [];


        focusContainer.innerHTML = `
            <article class="home-focus-card">

                <div class="home-focus-content">

                    <div class="home-focus-status-row">

                        <p class="home-focus-eyebrow">
                            ${escapeHomeHtml(
                                focus.eyebrow
                            )}
                        </p>

                        <span class="home-focus-status">
                            ${escapeHomeHtml(
                                focus.status
                            )}
                        </span>

                    </div>


                    <h2 id="home-focus-heading">
                        ${escapeHomeHtml(
                            focus.title
                        )}
                    </h2>

                    <p class="home-focus-description">
                        ${escapeHomeHtml(
                            focus.description
                        )}
                    </p>


                    <a
                        class="button button-secondary"
                        href="${escapeHomeHtml(
                            focus.projectUrl
                        )}"
                    >
                        View Current Project

                        <svg
                            class="icon"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path d="M5 12h14"></path>
                            <path d="M13 6l6 6-6 6"></path>
                        </svg>
                    </a>

                </div>


                <div class="home-progress-panel">

                    <p class="home-progress-label">
                        Project Progress
                    </p>

                    <h3>
                        Current subsystem status
                    </h3>

                    <ul class="home-milestone-list">
                        ${milestones
                            .map(
                                createMilestoneMarkup
                            )
                            .join("")}
                    </ul>

                </div>

            </article>
        `;
    }


    function getRecentNotes(limit) {
        if (
            typeof labNotes === "undefined" ||
            !Array.isArray(labNotes)
        ) {
            return [];
        }


        return labNotes
            .slice()
            .sort(function (firstNote, secondNote) {
                const firstDate =
                    Date.parse(firstNote.date) || 0;

                const secondDate =
                    Date.parse(secondNote.date) || 0;

                return secondDate - firstDate;
            })
            .slice(0, limit);
    }


    function createRecentNoteCard(note) {
        const actionMarkup =
            note.url
                ? `
                    <a
                        class="home-preview-link"
                        href="${escapeHomeHtml(
                            note.url
                        )}"
                    >
                        View Note

                        <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path d="M5 12h14"></path>
                            <path d="M13 6l6 6-6 6"></path>
                        </svg>
                    </a>
                `
                : `
                    <span class="
                            home-preview-pending
                            content-card-link-muted
                        "
                    >
                        Detail page planned
                    </span>
                `;


        return `
            <article
                class="
                    home-preview-card
                    content-card
                "
            >

                <div class="home-preview-card-meta">

                    <span>
                        ${escapeHomeHtml(
                            note.category
                        )}
                    </span>

                    <time datetime="${escapeHomeHtml(
                        note.date
                    )}">
                        ${escapeHomeHtml(
                            formatHomeDate(note.date)
                        )}
                    </time>

                </div>


                <h4>
                    ${escapeHomeHtml(
                        note.title
                    )}
                </h4>

                <p>
                    ${escapeHomeHtml(
                        note.summary
                    )}
                </p>


                <div class="home-preview-card-footer">

                    <span class="home-preview-state">
                        ${escapeHomeHtml(
                            note.status
                        )}
                    </span>

                    ${actionMarkup}

                </div>

            </article>
        `;
    }


    function renderRecentNotes() {
        if (!recentNotesContainer) {
            return;
        }


        const notes =
            getRecentNotes(3);


        if (notes.length === 0) {
            recentNotesContainer.innerHTML = `
                <p class="home-preview-empty">
                    No lab notes are available yet.
                </p>
            `;

            return;
        }


        recentNotesContainer.innerHTML =
            notes
                .map(createRecentNoteCard)
                .join("");
    }


    function getSelectedItems(
        library,
        selectedIds,
        limit
    ) {
        if (!Array.isArray(library)) {
            return [];
        }


        const ids =
            Array.isArray(selectedIds)
                ? selectedIds
                : [];


        const selectedItems =
            ids
                .map(function (id) {
                    return library.find(
                        function (item) {
                            return item.id === id;
                        }
                    );
                })
                .filter(Boolean);


        if (selectedItems.length > 0) {
            return selectedItems.slice(
                0,
                limit
            );
        }


        return library.slice(0, limit);
    }


    function createComponentPreviewCard(
        component
    ) {
        const destination =
            component.detailsUrl ||
            component.projectUrl ||
            "";

        const actionLabel =
            component.detailsUrl
                ? "View Component"
                : component.projectUrl
                    ? "Related Project"
                    : "";


        const actionMarkup =
            destination
                ? `
                    <a
                        class="home-preview-link"
                        href="${escapeHomeHtml(
                            destination
                        )}"
                    >
                        ${actionLabel}

                        <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path d="M5 12h14"></path>
                            <path d="M13 6l6 6-6 6"></path>
                        </svg>
                    </a>
                `
                : `
                    <span class="
                            home-preview-pending
                            content-card-link-muted
                        "
                    >
                        Reference planned
                    </span>
                `;


        return `
            <article
                class="
                    home-preview-card
                    content-card
                "
            >

                <div class="home-preview-card-meta">

                    <span>
                        ${escapeHomeHtml(
                            component.categoryLabel
                        )}
                    </span>

                    <time
                        class="content-card-date"
                        datetime="${escapeHomeHtml(
                            component.date
                        )}"
                    >
                        ${escapeHomeHtml(
                            formatHomeDate(
                                component.date
                            )
                        )}
                    </time>

                </div>


                <p class="home-preview-kicker">
                    ${escapeHomeHtml(
                        component.model
                    )}
                </p>

                <h4>
                    ${escapeHomeHtml(
                        component.name
                    )}
                </h4>

                <p>
                    ${escapeHomeHtml(
                        component.summary
                    )}
                </p>


                <div class="home-preview-card-footer">

                    <span class="home-preview-state">
                        ${escapeHomeHtml(
                            component.status
                        )}
                    </span>

                    ${actionMarkup}

                </div>

            </article>
        `;
    }


    function renderFeaturedComponents() {
        if (!featuredComponentsContainer) {
            return;
        }


        const componentIds =
            typeof homeDashboard !==
                "undefined"
                ? homeDashboard
                    .featuredComponentIds
                : [];


        const components =
            getSelectedItems(
                typeof componentLibrary !==
                    "undefined"
                    ? componentLibrary
                    : [],
                componentIds,
                3
            );


        if (components.length === 0) {
            featuredComponentsContainer
                .innerHTML = `
                    <p class="home-preview-empty">
                        No component references are available yet.
                    </p>
                `;

            return;
        }


        featuredComponentsContainer.innerHTML =
            components
                .map(
                    createComponentPreviewCard
                )
                .join("");
    }


    function createResourcePreviewCard(
        resource
    ) {
        const externalAttributes =
            resource.external === true
                ? `
                    target="_blank"
                    rel="noopener noreferrer"
                `
                : "";


        const actionMarkup =
            resource.url
                ? `
                    <a
                        class="home-preview-link"
                        href="${escapeHomeHtml(
                            resource.url
                        )}"
                        ${externalAttributes}
                    >
                        ${escapeHomeHtml(
                            resource.linkLabel ||
                            "View Resource"
                        )}

                        <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            ${
                                resource.external === true
                                    ? `
                                        <path d="M14 5h5v5"></path>
                                        <path d="M10 14L19 5"></path>
                                        <path d="M19 13v6H5V5h6"></path>
                                    `
                                    : `
                                        <path d="M5 12h14"></path>
                                        <path d="M13 6l6 6-6 6"></path>
                                    `
                            }
                        </svg>
                    </a>
                `
                : `
                    <span class="
                            home-preview-pending
                            content-card-link-muted
                        "
                    >
                        Link pending verification
                    </span>
                `;


        return `
            <article
                class="
                    home-preview-card
                    content-card
                "
            >

                <div class="home-preview-card-meta">

                    <span>
                        ${escapeHomeHtml(
                            resource.categoryLabel
                        )}
                    </span>

                    <time
                        class="content-card-date"
                        datetime="${escapeHomeHtml(
                            resource.date
                        )}"
                    >
                        ${escapeHomeHtml(
                            formatHomeDate(
                                resource.date
                            )
                        )}
                    </time>

                </div>


                <p class="home-preview-kicker">
                    ${escapeHomeHtml(
                        resource.provider
                    )}
                </p>

                <h4>
                    ${escapeHomeHtml(
                        resource.title
                    )}
                </h4>

                <p>
                    ${escapeHomeHtml(
                        resource.description
                    )}
                </p>


                <div class="home-preview-card-footer">

                    ${actionMarkup}

                </div>

            </article>
        `;
    }


    function renderFeaturedResources() {
        if (!featuredResourcesContainer) {
            return;
        }


        const resourceIds =
            typeof homeDashboard !==
                "undefined"
                ? homeDashboard
                    .featuredResourceIds
                : [];


        const resources =
            getSelectedItems(
                typeof resourceLibrary !==
                    "undefined"
                    ? resourceLibrary
                    : [],
                resourceIds,
                3
            );


        if (resources.length === 0) {
            featuredResourcesContainer
                .innerHTML = `
                    <p class="home-preview-empty">
                        No engineering resources are available yet.
                    </p>
                `;

            return;
        }


        featuredResourcesContainer.innerHTML =
            resources
                .map(
                    createResourcePreviewCard
                )
                .join("");
    }


    renderCurrentFocus();
    renderRecentNotes();
    renderFeaturedComponents();
    renderFeaturedResources();
})();