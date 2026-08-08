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
                class="project-card"
                data-category="${escapeProjectHtml(
                    project.category
                )}"
            >

                <div class="project-card-content">

                    <p class="project-category">
                        ${escapeProjectHtml(
                            project.categoryLabel
                        )}
                    </p>


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


                    ${createProjectAction(project)}

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