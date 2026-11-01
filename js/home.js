(function () {
    const resourceContainer = document.querySelector("#home-featured-resources");
    if (!resourceContainer) return;

    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
        })[character]);
    }

    const kindLabels = { note: "Note", component: "Component", reference: "Reference" };

    if (resourceContainer) {
        const library = typeof resourceLibrary !== "undefined" ? resourceLibrary : [];
        const resources = [...library].sort((a, b) =>
            (b.date || "").localeCompare(a.date || "") || a.title.localeCompare(b.title)
        ).slice(0, 3);
        resourceContainer.innerHTML = resources.length ? resources.map((resource, index) => {
            const url = resource.url || `resources.html?q=${encodeURIComponent(resource.id)}`;
            const external = Boolean(resource.url && resource.external);
            return `
            <li class="home-resource-row">
                <span class="home-resource-number" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>
                <div class="home-resource-copy">
                    <p class="home-resource-meta">${escapeHtml(kindLabels[resource.kind] || "Reference")}</p>
                    <h3><a class="text-link" href="${escapeHtml(url)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}><span class="link-label">${escapeHtml(resource.title)}</span> <span class="link-arrow" aria-hidden="true">${external ? "&#8599;" : "&rarr;"}</span>${external ? '<span class="visually-hidden"> (opens in a new tab)</span>' : ""}</a></h3>
                    <p>${escapeHtml(resource.description)}</p>
                </div>
            </li>`;
        }).join("") : '<li class="home-preview-empty">No resources are available yet.</li>';
    }
})();
