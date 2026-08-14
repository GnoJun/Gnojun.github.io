(function () {
    const projectsGrid =
        document.querySelector(
            "#project-grid"
        );


    if (
        !projectsGrid ||
        typeof projectLibrary ===
            "undefined" ||
        !Array.isArray(projectLibrary)
    ) {
        return;
    }

    function validateProjectLibrary(projects) {
        const usedIds =
            new Set();


        projects.forEach(
            function (project, index) {
                const position =
                    `Project at index ${index}`;


                if (
                    typeof project.id !==
                        "string" ||
                    !project.id.trim()
                ) {
                    console.warn(
                        `${position} is missing a valid id.`,
                        project
                    );
                }


                if (usedIds.has(project.id)) {
                    console.warn(
                        `Duplicate project id: "${project.id}".`,
                        project
                    );
                }


                usedIds.add(project.id);


                if (
                    typeof project.title !==
                        "string" ||
                    !project.title.trim()
                ) {
                    console.warn(
                        `${position} is missing a valid title.`,
                        project
                    );
                }


                if (
                    typeof project.category !==
                        "string" ||
                    !project.category.trim()
                ) {
                    console.warn(
                        `${position} is missing a category.`,
                        project
                    );
                }


                if (
                    !Array.isArray(
                        project.technologies
                    )
                ) {
                    console.warn(
                        `${position} technologies must be an array.`,
                        project
                    );
                }
            }
        );
    }


    function escapeProjectHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function formatProjectDate(
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


    function createProjectTags(
        technologies
    ) {
        if (
            !Array.isArray(technologies) ||
            technologies.length === 0
        ) {
            return "";
        }


        return technologies
            .map(function (technology) {
                return `
                    <li>
                        ${escapeProjectHtml(
                            technology
                        )}
                    </li>
                `;
            })
            .join("");
    }

    function createProjectAction(project) {
        if (project.detailsUrl) {
            return `
                <a
                    href="${escapeProjectHtml(
                        project.detailsUrl
                    )}"
                    class="project-link"
                >
                    ${escapeProjectHtml(
                        project.actionLabel ||
                        "View Case Study"
                    )}

                    <svg
                        class="icon"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path d="M5 12h14"></path>
                        <path d="M13 6l6 6-6 6"></path>
                    </svg>
                </a>
            `;
        }


        return `
            <span
                class="
                    project-link
                    project-link-muted
                    content-card-link-muted
                "
            >
                ${escapeProjectHtml(
                    project.actionLabel ||
                    "Case study coming soon"
                )}
            </span>
        `;
    }

    function createProjectCard(project) {
        return `
            <article
                class="
                    project-card
                    content-card
                "
                data-category="${escapeProjectHtml(
                    project.category
                )}"
            >

                <div class="project-card-content">

                   <div
                        class="
                            project-card-header
                            content-card-header
                        "
                    >

                        <p class="project-category">
                            ${escapeProjectHtml(
                                project.categoryLabel
                            )}
                        </p>


                        <time
                            class="content-card-date"
                            datetime="${escapeProjectHtml(
                                project.date
                            )}"
                        >
                            ${escapeProjectHtml(
                                formatProjectDate(
                                    project.date
                                )
                            )}
                        </time>

                    </div>


                    <h2 class="project-title">
                        ${escapeProjectHtml(
                            project.title
                        )}
                    </h2>


                    <p class="project-description">
                        ${escapeProjectHtml(
                            project.description
                        )}
                    </p>


                    <ul
                        class="project-tags"
                        aria-label="Technologies used"
                    >
                        ${createProjectTags(
                            project.technologies
                        )}
                    </ul>


                    <div
                        class="
                            project-card-footer
                            content-card-footer
                        "
                    >

                        ${createProjectAction(
                            project
                        )}

                    </div>

                </div>

            </article>
        `;
    }


    function renderProjects() {
        projectsGrid.innerHTML =
            projectLibrary
                .map(createProjectCard)
                .join("");
    }


    renderProjects();
})();