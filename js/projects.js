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


                    <a
                        href="${escapeProjectHtml(
                            project.detailsUrl
                        )}"
                        class="project-link"
                    >
                        View Case Study

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