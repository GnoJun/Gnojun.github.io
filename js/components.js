(function () {
    const componentsGrid =
        document.querySelector(
            "#components-grid"
        );

    const componentSearchInput =
        document.querySelector(
            "#component-search"
        );

    const componentFilterButtons =
        Array.from(
            document.querySelectorAll(
                ".component-filter-button"
            )
        );

    const componentStatus =
        document.querySelector(
            "#component-status"
        );

    const componentsEmptyState =
        document.querySelector(
            "#components-empty-state"
        );

    const componentsEmptyText =
        document.querySelector(
            "#components-empty-text"
        );


    if (
        !componentsGrid ||
        typeof componentLibrary === "undefined" ||
        !Array.isArray(componentLibrary)
    ) {
        return;
    }


    let activeComponentFilter = "all";
    let componentSearchQuery = "";
    let componentSearchTimer;


    function normalizeComponentText(value) {
        return String(value ?? "")
            .normalize("NFKD")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();
    }


    function escapeComponentHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function formatComponentDate(
        dateString
    ) {
        const date =
            new Date(
                `${dateString}T00:00:00`
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return dateString;
        }


        return new Intl.DateTimeFormat(
            "en-US",
            {
                year:
                    "numeric",

                month:
                    "short",

                day:
                    "numeric"
            }
        ).format(
            date
        );
    }


    function createComponentTags(tags) {
        if (
            !Array.isArray(tags) ||
            tags.length === 0
        ) {
            return "";
        }

        const tagMarkup =
            tags
                .map(function (tag) {
                    return `
                        <li>
                            ${escapeComponentHtml(tag)}
                        </li>
                    `;
                })
                .join("");


        return `
            <ul
                class="component-tags"
                aria-label="Component topics"
            >
                ${tagMarkup}
            </ul>
        `;
    }


function createComponentActions(
    component
) {
    const actionLinks = [];


    if (component.detailsUrl) {
        actionLinks.push(`
            <a
                class="component-card-link"
                href="${escapeComponentHtml(
                    component.detailsUrl
                )}"
                aria-label="View ${escapeComponentHtml(
                    component.name
                )} component reference"
            >
                View Component

                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path d="M5 12h14"></path>
                    <path d="M13 6l6 6-6 6"></path>
                </svg>
            </a>
        `);
    }


    if (component.projectUrl) {
        actionLinks.push(`
            <a
                class="
                    component-card-link
                    component-card-link-secondary
                "
                href="${escapeComponentHtml(
                    component.projectUrl
                )}"
                aria-label="View project related to ${escapeComponentHtml(
                    component.name
                )}"
            >
                Related Project

                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path d="M5 12h14"></path>
                    <path d="M13 6l6 6-6 6"></path>
                </svg>
            </a>
        `);
    }


    if (actionLinks.length === 0) {
        return `
            <span class="
                component-reference-status
                content-card-link-muted
                "
            >
                Reference page planned
            </span>
        `;
    }


    return `
        <div class="component-card-actions">
            ${actionLinks.join("")}
        </div>
    `;
}


    function createComponentCard(component) {
        return `
            <article
                class="
                    component-card
                    content-card
                "

                data-component-category="
                    ${escapeComponentHtml(
                        component.category
                    )}
                "
            >

                <div class="
                        component-card-header
                        content-card-header
                    "
                >

                    <span
                        class="
                            component-category
                            component-category-${escapeComponentHtml(
                                component.category
                            )}
                        "
                    >
                        ${escapeComponentHtml(
                            component.categoryLabel
                        )}
                    </span>

                    <time
                        class="
                            component-card-date
                            content-card-date
                        "
                        datetime="${escapeComponentHtml(
                            component.date
                        )}"
                    >
                        ${escapeComponentHtml(
                            formatComponentDate(
                                component.date
                            )
                        )}
                    </time>

                </div>


                <p class="component-model">
                    ${escapeComponentHtml(
                        component.model
                    )}
                </p>

                <h2 class="component-name">
                    ${escapeComponentHtml(
                        component.name
                    )}
                </h2>

                <p class="component-summary">
                    ${escapeComponentHtml(
                        component.summary
                    )}
                </p>


                <dl class="component-spec-list">

                    <div>

                        <dt>
                            Supply / Logic
                        </dt>

                        <dd>
                            ${escapeComponentHtml(
                                component.supply
                            )}
                        </dd>

                    </div>

                    <div>

                        <dt>
                            Interfaces
                        </dt>

                        <dd>
                            ${escapeComponentHtml(
                                component.interfaces
                            )}
                        </dd>

                    </div>

                </dl>


                ${createComponentTags(
                    component.tags
                )}


                <div
                    class="
                        component-card-footer
                        content-card-footer
                    "
                >

                    <span class="component-card-status">
                        ${escapeComponentHtml(
                            component.status
                        )}
                    </span>


                    ${createComponentActions(
                        component
                    )}

                </div>

            </article>
        `;
    }


    function getComponentSearchText(component) {
        const tags =
            Array.isArray(component.tags)
                ? component.tags
                : [];

        return normalizeComponentText(
            [
                component.name,
                component.model,
                component.category,
                component.categoryLabel,
                component.supply,
                component.interfaces,
                component.status,
                component.summary,
                ...tags
            ].join(" ")
        );
    }


    function componentMatchesFilter(
        component
    ) {
        return (
            activeComponentFilter === "all" ||
            component.category ===
                activeComponentFilter
        );
    }


    function componentMatchesSearch(
        component
    ) {
        if (!componentSearchQuery) {
            return true;
        }

        return getComponentSearchText(
            component
        ).includes(componentSearchQuery);
    }


    function getVisibleComponents() {
        return componentLibrary.filter(
            function (component) {
                return (
                    componentMatchesFilter(
                        component
                    ) &&
                    componentMatchesSearch(
                        component
                    )
                );
            }
        );
    }


    function renderComponents(components) {
        componentsGrid.innerHTML =
            components
                .map(createComponentCard)
                .join("");
    }


    function updateComponentButtons() {
        componentFilterButtons.forEach(
            function (button) {
                const isActive =
                    button.dataset
                        .componentFilter ===
                    activeComponentFilter;

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


    function getActiveCategoryLabel() {
        const activeButton =
            componentFilterButtons.find(
                function (button) {
                    return (
                        button.dataset
                            .componentFilter ===
                        activeComponentFilter
                    );
                }
            );

        return activeButton
            ? activeButton.textContent.trim()
            : "All";
    }


    function updateComponentStatus(count) {
        if (!componentStatus) {
            return;
        }

        const noun =
            count === 1
                ? "component"
                : "components";

        const visibleSearch =
            componentSearchInput
                ? componentSearchInput
                    .value
                    .trim()
                : "";

        const categoryLabel =
            getActiveCategoryLabel();


        if (
            visibleSearch &&
            activeComponentFilter !== "all"
        ) {
            componentStatus.textContent =
                `${count} ${noun} matching ` +
                `“${visibleSearch}” in ` +
                categoryLabel;

            return;
        }


        if (visibleSearch) {
            componentStatus.textContent =
                `${count} ${noun} matching ` +
                `“${visibleSearch}”`;

            return;
        }


        if (
            activeComponentFilter !== "all"
        ) {
            componentStatus.textContent =
                `${count} ${noun} in ` +
                categoryLabel;

            return;
        }


        componentStatus.textContent =
            `${count} ${noun}`;
    }


    function updateComponentEmptyState(
        count
    ) {
        if (!componentsEmptyState) {
            return;
        }

        componentsEmptyState.hidden =
            count !== 0;

        if (
            count !== 0 ||
            !componentsEmptyText
        ) {
            return;
        }

        const visibleSearch =
            componentSearchInput
                ? componentSearchInput
                    .value
                    .trim()
                : "";

        const categoryLabel =
            getActiveCategoryLabel();


        if (visibleSearch) {
            componentsEmptyText.textContent =
                `No ${categoryLabel.toLowerCase()} ` +
                `components match ` +
                `“${visibleSearch}”.`;

            return;
        }


        componentsEmptyText.textContent =
            `There are currently no ` +
            `${categoryLabel.toLowerCase()} ` +
            `components.`;
    }


    function updateComponentInterface() {
        const visibleComponents =
            getVisibleComponents();

        renderComponents(
            visibleComponents
        );

        updateComponentButtons();

        updateComponentStatus(
            visibleComponents.length
        );

        updateComponentEmptyState(
            visibleComponents.length
        );
    }


    componentFilterButtons.forEach(
        function (button) {
            button.addEventListener(
                "click",
                function () {
                    activeComponentFilter =
                        button.dataset
                            .componentFilter ||
                        "all";

                    updateComponentInterface();
                }
            );
        }
    );


    if (componentSearchInput) {
        componentSearchInput.addEventListener(
            "input",
            function () {
                clearTimeout(
                    componentSearchTimer
                );

                componentSearchTimer =
                    setTimeout(
                        function () {
                            componentSearchQuery =
                                normalizeComponentText(
                                    componentSearchInput
                                        .value
                                );

                            updateComponentInterface();
                        },
                        120
                    );
            }
        );


        componentSearchInput.addEventListener(
            "keydown",
            function (event) {
                if (
                    event.key === "Escape" &&
                    componentSearchInput.value
                ) {
                    componentSearchInput.value =
                        "";

                    componentSearchQuery = "";

                    updateComponentInterface();

                    componentSearchInput.focus();
                }
            }
        );
    }


    const initialFilterButton =
        componentFilterButtons.find(
            function (button) {
                return (
                    button.getAttribute(
                        "aria-pressed"
                    ) === "true"
                );
            }
        ) || componentFilterButtons[0];


    if (initialFilterButton) {
        activeComponentFilter =
            initialFilterButton.dataset
                .componentFilter ||
            "all";
    }


    updateComponentInterface();
})();