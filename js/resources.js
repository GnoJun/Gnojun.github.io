(function () {
    const resourcesGrid =
        document.querySelector(
            "#resources-grid"
        );

    const resourceSearchInput =
        document.querySelector(
            "#resource-search"
        );

    const resourceSearchClear =
        document.querySelector(
            "#resource-search-clear"
        );

    const resourceFilterButtons =
        Array.from(
            document.querySelectorAll(
                ".resource-filter-button"
            )
        );

    const resourceStatus =
        document.querySelector(
            "#resource-status"
        );

    const resourcesEmptyState =
        document.querySelector(
            "#resources-empty-state"
        );

    const resourcesEmptyText =
        document.querySelector(
            "#resources-empty-text"
        );


    if (
        !resourcesGrid ||
        typeof resourceLibrary ===
            "undefined" ||
        !Array.isArray(resourceLibrary)
    ) {
        return;
    }


    let activeResourceFilter = "all";
    let resourceSearchQuery = "";
    let resourceSearchTimer;


    function normalizeResourceText(value) {
        return String(value ?? "")
            .normalize("NFKD")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();
    }


    function escapeResourceHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }


    function createResourceTags(tags) {
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
                            ${escapeResourceHtml(tag)}
                        </li>
                    `;
                })
                .join("");


        return `
            <ul
                class="resource-tags"
                aria-label="Resource topics"
            >
                ${tagMarkup}
            </ul>
        `;
    }


    function createResourceAction(resource) {
        if (!resource.url) {
            return `
                <span class="resource-link-pending">
                    Link pending verification
                </span>
            `;
        }


        const isExternal =
            resource.external === true;

        const linkLabel =
            resource.linkLabel ||
            (
                isExternal
                    ? "Open Resource"
                    : "View Resource"
            );

        const externalAttributes =
            isExternal
                ? `
                    target="_blank"
                    rel="noopener noreferrer"
                `
                : "";


        return `
            <a
                class="resource-card-link"
                href="${escapeResourceHtml(
                    resource.url
                )}"
                ${externalAttributes}
                aria-label="${escapeResourceHtml(
                    linkLabel
                )}: ${escapeResourceHtml(
                    resource.title
                )}"
            >
                ${escapeResourceHtml(
                    linkLabel
                )}

                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    ${
                        isExternal
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
        `;
    }


    function createResourceCard(resource) {
        return `
            <article
                class="resource-card"
                data-resource-category="${escapeResourceHtml(
                    resource.category
                )}"
            >

                <div class="resource-card-header">

                    <span
                        class="
                            resource-category
                            resource-category-${escapeResourceHtml(
                                resource.category
                            )}
                        "
                    >
                        ${escapeResourceHtml(
                            resource.categoryLabel
                        )}
                    </span>

                    <span class="resource-type">
                        ${escapeResourceHtml(
                            resource.resourceType
                        )}
                    </span>

                </div>


                <p class="resource-provider">
                    ${escapeResourceHtml(
                        resource.provider
                    )}
                </p>

                <h2 class="resource-title">
                    ${escapeResourceHtml(
                        resource.title
                    )}
                </h2>

                <p class="resource-description">
                    ${escapeResourceHtml(
                        resource.description
                    )}
                </p>


                ${createResourceTags(
                    resource.tags
                )}


                <div class="resource-card-footer">

                    ${createResourceAction(
                        resource
                    )}

                </div>

            </article>
        `;
    }


    function getResourceSearchText(resource) {
        const tags =
            Array.isArray(resource.tags)
                ? resource.tags
                : [];

        return normalizeResourceText(
            [
                resource.title,
                resource.provider,
                resource.resourceType,
                resource.category,
                resource.categoryLabel,
                resource.description,
                ...tags
            ].join(" ")
        );
    }


    function resourceMatchesFilter(resource) {
        return (
            activeResourceFilter === "all" ||
            resource.category ===
                activeResourceFilter
        );
    }


    function resourceMatchesSearch(resource) {
        if (!resourceSearchQuery) {
            return true;
        }

        return getResourceSearchText(
            resource
        ).includes(resourceSearchQuery);
    }


    function getVisibleResources() {
        return resourceLibrary.filter(
            function (resource) {
                return (
                    resourceMatchesFilter(
                        resource
                    ) &&
                    resourceMatchesSearch(
                        resource
                    )
                );
            }
        );
    }


    function renderResources(resources) {
        resourcesGrid.innerHTML =
            resources
                .map(createResourceCard)
                .join("");
    }


    function updateResourceButtons() {
        resourceFilterButtons.forEach(
            function (button) {
                const isActive =
                    button.dataset
                        .resourceFilter ===
                    activeResourceFilter;

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


    function getActiveResourceLabel() {
        const activeButton =
            resourceFilterButtons.find(
                function (button) {
                    return (
                        button.dataset
                            .resourceFilter ===
                        activeResourceFilter
                    );
                }
            );

        return activeButton
            ? activeButton.textContent.trim()
            : "All";
    }


    function updateResourceStatus(count) {
        if (!resourceStatus) {
            return;
        }

        const noun =
            count === 1
                ? "resource"
                : "resources";

        const visibleSearch =
            resourceSearchInput
                ? resourceSearchInput
                    .value
                    .trim()
                : "";

        const categoryLabel =
            getActiveResourceLabel();


        if (
            visibleSearch &&
            activeResourceFilter !== "all"
        ) {
            resourceStatus.textContent =
                `${count} ${noun} matching ` +
                `“${visibleSearch}” in ` +
                categoryLabel;

            return;
        }


        if (visibleSearch) {
            resourceStatus.textContent =
                `${count} ${noun} matching ` +
                `“${visibleSearch}”`;

            return;
        }


        if (
            activeResourceFilter !== "all"
        ) {
            resourceStatus.textContent =
                `${count} ${noun} in ` +
                categoryLabel;

            return;
        }


        resourceStatus.textContent =
            `${count} ${noun}`;
    }


    function updateResourceEmptyState(
        count
    ) {
        if (!resourcesEmptyState) {
            return;
        }

        resourcesEmptyState.hidden =
            count !== 0;

        if (
            count !== 0 ||
            !resourcesEmptyText
        ) {
            return;
        }

        const visibleSearch =
            resourceSearchInput
                ? resourceSearchInput
                    .value
                    .trim()
                : "";

        const categoryLabel =
            getActiveResourceLabel();


        if (
            visibleSearch &&
            activeResourceFilter !== "all"
        ) {
            resourcesEmptyText.textContent =
                `No resources in ` +
                `${categoryLabel} match ` +
                `“${visibleSearch}”.`;

            return;
        }


        if (visibleSearch) {
            resourcesEmptyText.textContent =
                `No resources match ` +
                `“${visibleSearch}”.`;

            return;
        }


        resourcesEmptyText.textContent =
            `There are currently no resources ` +
            `in ${categoryLabel}.`;
    }


    function updateSearchClearButton() {
        if (
            !resourceSearchInput ||
            !resourceSearchClear
        ) {
            return;
        }

        resourceSearchClear.hidden =
            resourceSearchInput.value
                .length === 0;
    }


    function updateResourceInterface() {
        const visibleResources =
            getVisibleResources();

        renderResources(
            visibleResources
        );

        updateResourceButtons();

        updateResourceStatus(
            visibleResources.length
        );

        updateResourceEmptyState(
            visibleResources.length
        );

        updateSearchClearButton();
    }


    function clearResourceSearch() {
        if (!resourceSearchInput) {
            return;
        }

        resourceSearchInput.value = "";
        resourceSearchQuery = "";

        updateResourceInterface();

        resourceSearchInput.focus();
    }


    resourceFilterButtons.forEach(
        function (button) {
            button.addEventListener(
                "click",
                function () {
                    activeResourceFilter =
                        button.dataset
                            .resourceFilter ||
                        "all";

                    updateResourceInterface();
                }
            );
        }
    );


    if (resourceSearchInput) {
        resourceSearchInput.addEventListener(
            "input",
            function () {
                clearTimeout(
                    resourceSearchTimer
                );

                updateSearchClearButton();

                resourceSearchTimer =
                    setTimeout(
                        function () {
                            resourceSearchQuery =
                                normalizeResourceText(
                                    resourceSearchInput
                                        .value
                                );

                            updateResourceInterface();
                        },
                        120
                    );
            }
        );


        resourceSearchInput.addEventListener(
            "keydown",
            function (event) {
                if (
                    event.key === "Escape" &&
                    resourceSearchInput.value
                ) {
                    clearResourceSearch();
                }
            }
        );
    }


    if (resourceSearchClear) {
        resourceSearchClear.addEventListener(
            "click",
            clearResourceSearch
        );
    }


    const initialFilterButton =
        resourceFilterButtons.find(
            function (button) {
                return (
                    button.getAttribute(
                        "aria-pressed"
                    ) === "true"
                );
            }
        ) || resourceFilterButtons[0];


    if (initialFilterButton) {
        activeResourceFilter =
            initialFilterButton.dataset
                .resourceFilter ||
            "all";
    }


    updateResourceInterface();
})();