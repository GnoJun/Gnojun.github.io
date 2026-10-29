(function () {
    const focusContainer = document.querySelector("#home-focus-container");
    const resourceContainer = document.querySelector("#home-featured-resources");
    if (!focusContainer && !resourceContainer) return;

    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
        })[character]);
    }

    const dashboard = typeof homeDashboard !== "undefined" ? homeDashboard : {};
    const statusLabels = {
        implemented: "Implemented", prototype: "Prototype",
        testing: "Testing", planned: "Planned"
    };
    const kindLabels = { note: "Note", component: "Component", reference: "Reference" };

    if (focusContainer && dashboard.currentFocus) {
        const focus = dashboard.currentFocus;
        const milestones = Array.isArray(focus.milestones) ? focus.milestones : [];
        focusContainer.innerHTML = `
            <article class="home-focus-layout">
                <div class="home-focus-copy">
                    <p class="home-section-label">Current project</p>
                    <h2 id="home-focus-heading">${escapeHtml(focus.title)}</h2>
                    <p class="home-focus-description">${escapeHtml(focus.description)}</p>
                    <a class="home-text-link text-link" href="${escapeHtml(focus.projectUrl)}"><span class="link-label">Explore the project</span> <span class="link-arrow" aria-hidden="true">&rarr;</span></a>
                </div>
                <figure class="home-project-visual">
                    <img src="images/projects/esp32-lab/esp32-lab.webp" alt="ESP32-S3 lab station prototype with two OLED displays and push buttons" width="2286" height="1643" loading="lazy" decoding="async">
                    <figcaption>ESP32-S3 Portable Lab Station &middot; Prototype</figcaption>
                </figure>
                <footer class="home-project-footer home-focus-progress">
                    <p class="home-progress-label">${escapeHtml(focus.status)}</p>
                    <details class="home-project-details">
                        <summary>Development progress</summary>
                        <ul class="home-milestone-list">${milestones.map(milestone => {
                            const status = Object.hasOwn(statusLabels, milestone.status) ? milestone.status : "planned";
                            return `<li class="home-milestone">
                                <span class="home-milestone-label">${escapeHtml(milestone.label)}</span>
                                <span class="home-milestone-status">${statusLabels[status]}</span>
                            </li>`;
                        }).join("")}</ul>
                    </details>
                </footer>
            </article>`;
    }

    if (resourceContainer) {
        const library = typeof resourceLibrary !== "undefined" ? resourceLibrary : [];
        const selectedIds = Array.isArray(dashboard.featuredResourceIds) ? dashboard.featuredResourceIds : [];
        const selected = selectedIds.map(id => library.find(item => item.id === id)).filter(item => item?.url);
        const resources = selected.length ? selected : library.filter(item => item.url).slice(0, 3);
        const summaries = dashboard.resourceSummaries || {};
        resourceContainer.innerHTML = resources.length ? resources.map((resource, index) => `
            <li class="home-resource-row">
                <span class="home-resource-number" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>
                <div class="home-resource-copy">
                    <p class="home-resource-meta">${escapeHtml(kindLabels[resource.kind] || "Reference")}</p>
                    <h3><a class="text-link" href="${escapeHtml(resource.url)}"${resource.external ? ' target="_blank" rel="noopener noreferrer"' : ""}><span class="link-label">${escapeHtml(resource.title)}</span> <span class="link-arrow" aria-hidden="true">${resource.external ? "&#8599;" : "&rarr;"}</span>${resource.external ? '<span class="visually-hidden"> (opens in a new tab)</span>' : ""}</a></h3>
                    <p>${escapeHtml(summaries[resource.id] || resource.description)}</p>
                </div>
            </li>`).join("") : '<li class="home-preview-empty">No resources are available yet.</li>';
    }
})();
