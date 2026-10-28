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
    const kindLabels = { note: "Lab note", component: "Component", reference: "Reference" };

    if (focusContainer && dashboard.currentFocus) {
        const focus = dashboard.currentFocus;
        const milestones = Array.isArray(focus.milestones) ? focus.milestones : [];
        focusContainer.innerHTML = `
            <article class="home-focus-layout">
                <div class="home-focus-copy">
                    <p class="section-label">${escapeHtml(focus.eyebrow)}</p>
                    <h2 id="home-focus-heading">${escapeHtml(focus.title)}</h2>
                    <p class="home-focus-description">${escapeHtml(focus.description)}</p>
                    <a class="home-text-link text-link" href="${escapeHtml(focus.projectUrl)}"><span class="link-label">Explore the project</span> <span class="link-arrow" aria-hidden="true">&rarr;</span></a>
                </div>
                <div class="home-focus-progress">
                    <p class="home-progress-label">${escapeHtml(focus.status)}</p>
                    <h3>Subsystem status</h3>
                    <ul class="home-milestone-list">${milestones.map(milestone => {
                        const status = Object.hasOwn(statusLabels, milestone.status) ? milestone.status : "planned";
                        return `<li class="home-milestone">
                            <span class="home-milestone-indicator home-milestone-indicator-${status}" aria-hidden="true"></span>
                            <span class="home-milestone-label">${escapeHtml(milestone.label)}</span>
                            <span class="home-milestone-status home-milestone-status-${status}">${statusLabels[status]}</span>
                        </li>`;
                    }).join("")}</ul>
                </div>
            </article>`;
    }

    if (resourceContainer) {
        const library = typeof resourceLibrary !== "undefined" ? resourceLibrary : [];
        const selectedIds = Array.isArray(dashboard.featuredResourceIds) ? dashboard.featuredResourceIds : [];
        const selected = selectedIds.map(id => library.find(item => item.id === id)).filter(item => item?.url);
        const resources = selected.length ? selected : library.filter(item => item.url).slice(0, 3);
        resourceContainer.innerHTML = resources.length ? resources.map(resource => `
            <li class="home-resource-row">
                <p class="home-resource-meta">${escapeHtml(kindLabels[resource.kind] || "Reference")} <span aria-hidden="true">/</span> ${escapeHtml(resource.category)}</p>
                <div class="home-resource-copy">
                    <h3><a class="text-link" href="${escapeHtml(resource.url)}"${resource.external ? ' target="_blank" rel="noopener noreferrer"' : ""}><span class="link-label">${escapeHtml(resource.title)}</span> <span class="link-arrow" aria-hidden="true">${resource.external ? "&#8599;" : "&rarr;"}</span>${resource.external ? '<span class="visually-hidden"> (opens in a new tab)</span>' : ""}</a></h3>
                    <p>${escapeHtml(resource.description)}</p>
                </div>
            </li>`).join("") : '<li class="home-preview-empty">No resources are available yet.</li>';
    }
})();
