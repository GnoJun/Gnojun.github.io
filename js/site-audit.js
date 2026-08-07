(function () {
    const pagesToAudit = [
        "index.html",
        "about.html",
        "projects.html",
        "lab-notes.html",
        "components.html",
        "resources.html",

        "projects/esp32-lab-station.html",

        "notes/voltage-divider.html",

        "components/esp32-s3-n16r8.html",

        "404.html"
    ];


    const runButton =
        document.querySelector(
            "#run-site-audit"
        );

    const issuesOnlyButton =
        document.querySelector(
            "#audit-toggle-issues"
        );

    const reportList =
        document.querySelector(
            "#site-audit-report-list"
        );

    const auditStatus =
        document.querySelector(
            "#site-audit-status"
        );

    const pagesCount =
        document.querySelector(
            "#audit-pages-count"
        );

    const resourcesCount =
        document.querySelector(
            "#audit-resources-count"
        );

    const passedCount =
        document.querySelector(
            "#audit-passed-count"
        );

    const issuesCount =
        document.querySelector(
            "#audit-issues-count"
        );


    if (
        !runButton ||
        !reportList
    ) {
        return;
    }


    let latestReports = [];

    let showIssuesOnly = false;


    function escapeAuditHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }


    function createIssue(
        type,
        message,
        detail = ""
    ) {
        return {
            type,
            message,
            detail
        };
    }


    function isIgnoredUrl(value) {
        if (!value) {
            return true;
        }

        const normalizedValue =
            value.trim().toLowerCase();


        return (
            normalizedValue.startsWith(
                "mailto:"
            ) ||
            normalizedValue.startsWith(
                "tel:"
            ) ||
            normalizedValue.startsWith(
                "javascript:"
            ) ||
            normalizedValue.startsWith(
                "data:"
            ) ||
            normalizedValue.startsWith(
                "blob:"
            )
        );
    }


    function getPageUrl(pagePath) {
        return new URL(
            pagePath,
            window.location.href
        );
    }


    async function fetchDocument(
        pagePath
    ) {
        const pageUrl =
            getPageUrl(pagePath);


        const response =
            await fetch(
                pageUrl,
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }


        const html =
            await response.text();


        const parser =
            new DOMParser();


        const documentObject =
            parser.parseFromString(
                html,
                "text/html"
            );


        return {
            pageUrl,
            documentObject
        };
    }


    function auditDuplicateIds(
        documentObject
    ) {
        const issues = [];

        const idCounts =
            new Map();


        documentObject
            .querySelectorAll("[id]")
            .forEach(function (element) {
                const id =
                    element.id.trim();

                if (!id) {
                    return;
                }


                idCounts.set(
                    id,
                    (
                        idCounts.get(id) ||
                        0
                    ) + 1
                );
            });


        idCounts.forEach(
            function (count, id) {
                if (count > 1) {
                    issues.push(
                        createIssue(
                            "Duplicate ID",
                            `"${id}" appears ${count} times.`
                        )
                    );
                }
            }
        );


        return issues;
    }


    function auditImages(
        documentObject
    ) {
        const issues = [];


        documentObject
            .querySelectorAll("img")
            .forEach(function (image) {

                if (
                    !image.hasAttribute(
                        "alt"
                    )
                ) {
                    issues.push(
                        createIssue(
                            "Accessibility",
                            "Image is missing an alt attribute.",
                            image.getAttribute(
                                "src"
                            ) || ""
                        )
                    );
                }


                const alt =
                    image.getAttribute(
                        "alt"
                    );


                if (
                    alt &&
                    alt.trim()
                        .toLowerCase() ===
                        "image"
                ) {
                    issues.push(
                        createIssue(
                            "Accessibility",
                            'Avoid alt="image". Use a meaningful description or alt="".',
                            image.getAttribute(
                                "src"
                            ) || ""
                        )
                    );
                }
            });


        return issues;
    }


    function auditLinks(
        documentObject
    ) {
        const issues = [];


        documentObject
            .querySelectorAll("a")
            .forEach(function (link) {
                const href =
                    link.getAttribute(
                        "href"
                    );


                if (
                    href === null ||
                    href.trim() === ""
                ) {
                    issues.push(
                        createIssue(
                            "Invalid Link",
                            "Anchor has no valid href."
                        )
                    );

                    return;
                }


                if (
                    href.trim() === "#"
                ) {
                    issues.push(
                        createIssue(
                            "Invalid Link",
                            'Avoid placeholder href="#".',
                            link.textContent.trim()
                        )
                    );
                }


                if (
                    link.target ===
                    "_blank"
                ) {
                    const relValues =
                        link.rel
                            .split(/\s+/)
                            .filter(Boolean);


                    if (
                        !relValues.includes(
                            "noopener"
                        )
                    ) {
                        issues.push(
                            createIssue(
                                "Link Safety",
                                'target="_blank" link is missing rel="noopener".',
                                href
                            )
                        );
                    }
                }
            });


        return issues;
    }


    function auditDocumentStructure(
        documentObject
    ) {
        const issues = [];


        const h1Elements =
            documentObject
                .querySelectorAll("h1");


        if (h1Elements.length !== 1) {
            issues.push(
                createIssue(
                    "Document Structure",
                    `Expected 1 H1 but found ${h1Elements.length}.`
                )
            );
        }


        const mainElements =
            documentObject
                .querySelectorAll("main");


        if (mainElements.length !== 1) {
            issues.push(
                createIssue(
                    "Document Structure",
                    `Expected 1 main element but found ${mainElements.length}.`
                )
            );
        }


        const title =
            documentObject
                .querySelector("title")
                ?.textContent
                ?.trim();


        if (!title) {
            issues.push(
                createIssue(
                    "Metadata",
                    "Page is missing a title."
                )
            );
        }


        const description =
            documentObject
                .querySelector(
                    'meta[name="description"]'
                )
                ?.getAttribute(
                    "content"
                )
                ?.trim();


        if (!description) {
            issues.push(
                createIssue(
                    "Metadata",
                    "Page is missing a meta description."
                )
            );
        }


        return issues;
    }


    function auditNoIndex(
        documentObject
    ) {
        const issues = [];


        const robotsContent =
            documentObject
                .querySelector(
                    'meta[name="robots"]'
                )
                ?.getAttribute(
                    "content"
                )
                ?.toLowerCase() ||
            "";


        if (
            !robotsContent.includes(
                "noindex"
            )
        ) {
            issues.push(
                createIssue(
                    "Privacy / Indexing",
                    "Page does not currently include noindex."
                )
            );
        }


        return issues;
    }


    function collectResourceUrls(
        documentObject,
        pageUrl
    ) {
        const resources =
            new Set();


        const resourceElements = [
            ...documentObject.querySelectorAll(
                "img[src]"
            ),

            ...documentObject.querySelectorAll(
                "script[src]"
            ),

            ...documentObject.querySelectorAll(
                'link[rel~="stylesheet"][href]'
            )
        ];


        resourceElements.forEach(
            function (element) {
                const value =
                    element.getAttribute(
                        "src"
                    ) ||
                    element.getAttribute(
                        "href"
                    );


                if (
                    !value ||
                    isIgnoredUrl(value)
                ) {
                    return;
                }


                try {
                    const url =
                        new URL(
                            value,
                            pageUrl
                        );


                    if (
                        url.origin ===
                        window.location.origin
                    ) {
                        url.hash = "";

                        resources.add(
                            url.href
                        );
                    }
                } catch (error) {
                    return;
                }
            }
        );


        return resources;
    }


    function collectInternalLinks(
        documentObject,
        pageUrl
    ) {
        const links =
            new Set();


        documentObject
            .querySelectorAll(
                "a[href]"
            )
            .forEach(function (link) {
                const href =
                    link.getAttribute(
                        "href"
                    );


                if (
                    !href ||
                    href.trim() === "#" ||
                    isIgnoredUrl(href)
                ) {
                    return;
                }


                try {
                    const url =
                        new URL(
                            href,
                            pageUrl
                        );


                    if (
                        url.origin !==
                        window.location.origin
                    ) {
                        return;
                    }


                    links.add(
                        url.href
                    );
                } catch (error) {
                    return;
                }
            });


        return links;
    }


    async function checkUrl(
        url
    ) {
        try {
            const requestUrl =
                new URL(url);

            requestUrl.hash = "";


            const response =
                await fetch(
                    requestUrl,
                    {
                        cache: "no-store"
                    }
                );


            return {
                url,
                ok: response.ok,
                status: response.status
            };

        } catch (error) {
            return {
                url,
                ok: false,
                status: 0
            };
        }
    }


    async function validateUrls(
        urls,
        type
    ) {
        const results =
            await Promise.all(
                Array.from(urls)
                    .map(checkUrl)
            );


        return results
            .filter(
                function (result) {
                    return !result.ok;
                }
            )
            .map(
                function (result) {
                    return createIssue(
                        type,
                        result.status
                            ? `HTTP ${result.status}`
                            : "Request failed",
                        result.url
                    );
                }
            );
    }


    async function checkFragmentLinks(
        links
    ) {
        const issues = [];


        for (
            const linkValue
            of links
        ) {
            const linkUrl =
                new URL(linkValue);


            if (!linkUrl.hash) {
                continue;
            }


            const targetId =
                decodeURIComponent(
                    linkUrl.hash.slice(1)
                );


            if (!targetId) {
                continue;
            }


            try {
                const response =
                    await fetch(
                        new URL(
                            linkUrl.pathname,
                            window.location.origin
                        ),
                        {
                            cache: "no-store"
                        }
                    );


                if (!response.ok) {
                    continue;
                }


                const html =
                    await response.text();


                const documentObject =
                    new DOMParser()
                        .parseFromString(
                            html,
                            "text/html"
                        );


                const target =
                    documentObject
                        .getElementById(
                            targetId
                        );


                if (!target) {
                    issues.push(
                        createIssue(
                            "Broken Fragment",
                            `No element exists with id="${targetId}".`,
                            linkValue
                        )
                    );
                }

            } catch (error) {
                issues.push(
                    createIssue(
                        "Broken Fragment",
                        "Could not verify fragment target.",
                        linkValue
                    )
                );
            }
        }


        return issues;
    }


    async function auditPage(
        pagePath
    ) {
        const report = {
            pagePath,
            pageLoaded: false,
            resourcesChecked: 0,
            issues: []
        };


        try {
            const {
                pageUrl,
                documentObject
            } =
                await fetchDocument(
                    pagePath
                );


            report.pageLoaded =
                true;


            report.issues.push(
                ...auditDuplicateIds(
                    documentObject
                ),

                ...auditImages(
                    documentObject
                ),

                ...auditLinks(
                    documentObject
                ),

                ...auditDocumentStructure(
                    documentObject
                ),

                ...auditNoIndex(
                    documentObject
                )
            );


            const resourceUrls =
                collectResourceUrls(
                    documentObject,
                    pageUrl
                );


            const internalLinks =
                collectInternalLinks(
                    documentObject,
                    pageUrl
                );


            report.resourcesChecked =
                resourceUrls.size +
                internalLinks.size;


            const [
                brokenResources,
                brokenLinks,
                brokenFragments
            ] =
                await Promise.all([
                    validateUrls(
                        resourceUrls,
                        "Missing Resource"
                    ),

                    validateUrls(
                        internalLinks,
                        "Broken Internal Link"
                    ),

                    checkFragmentLinks(
                        internalLinks
                    )
                ]);


            report.issues.push(
                ...brokenResources,
                ...brokenLinks,
                ...brokenFragments
            );

        } catch (error) {
            report.issues.push(
                createIssue(
                    "Page Load",
                    `Could not load ${pagePath}.`,
                    error.message
                )
            );
        }


        return report;
    }


    function getIssueClass(
        issueType
    ) {
        const warningTypes =
            new Set([
                "Accessibility",
                "Metadata",
                "Privacy / Indexing",
                "Document Structure"
            ]);


        return warningTypes.has(
            issueType
        )
            ? "warning"
            : "error";
    }


    function createIssueMarkup(
        issue
    ) {
        const issueClass =
            getIssueClass(
                issue.type
            );


        const detailMarkup =
            issue.detail
                ? `
                    <code>
                        ${escapeAuditHtml(
                            issue.detail
                        )}
                    </code>
                `
                : "";


        return `
            <li
                class="
                    site-audit-issue
                    site-audit-issue-${issueClass}
                "
            >

                <div>

                    <span class="site-audit-issue-type">
                        ${escapeAuditHtml(
                            issue.type
                        )}
                    </span>

                    <p>
                        ${escapeAuditHtml(
                            issue.message
                        )}
                    </p>

                    ${detailMarkup}

                </div>

            </li>
        `;
    }


    function createReportMarkup(
        report
    ) {
        const hasIssues =
            report.issues.length > 0;


        const stateLabel =
            hasIssues
                ? `${report.issues.length} issue${
                    report.issues.length === 1
                        ? ""
                        : "s"
                }`
                : "Passed";


        const issueMarkup =
            hasIssues
                ? `
                    <ul class="site-audit-issue-list">
                        ${report.issues
                            .map(
                                createIssueMarkup
                            )
                            .join("")}
                    </ul>
                `
                : `
                    <p class="site-audit-passed-message">
                        No automated issues detected on this page.
                    </p>
                `;


        return `
            <article
                class="
                    site-audit-report
                    ${
                        hasIssues
                            ? "has-issues"
                            : "is-passed"
                    }
                "
                data-audit-has-issues="${String(
                    hasIssues
                )}"
            >

                <header class="site-audit-report-header">

                    <div>

                        <p class="site-audit-report-path">
                            ${escapeAuditHtml(
                                report.pagePath
                            )}
                        </p>

                        <p class="site-audit-report-meta">
                            ${report.resourcesChecked}
                            linked resources checked
                        </p>

                    </div>


                    <span
                        class="
                            site-audit-report-state
                            ${
                                hasIssues
                                    ? "has-issues"
                                    : "is-passed"
                            }
                        "
                    >
                        ${escapeAuditHtml(
                            stateLabel
                        )}
                    </span>

                </header>


                ${issueMarkup}

            </article>
        `;
    }


    function renderReports() {
        const visibleReports =
            showIssuesOnly
                ? latestReports.filter(
                    function (report) {
                        return (
                            report.issues
                                .length > 0
                        );
                    }
                )
                : latestReports;


        if (
            visibleReports.length === 0
        ) {
            reportList.innerHTML = `
                <div class="site-audit-empty">

                    <h3>
                        No issues detected.
                    </h3>

                    <p>
                        All scanned pages passed the
                        current automated checks.
                    </p>

                </div>
            `;

            return;
        }


        reportList.innerHTML =
            visibleReports
                .map(
                    createReportMarkup
                )
                .join("");
    }


    function updateSummary() {
        const totalPages =
            latestReports.length;


        const totalResources =
            latestReports.reduce(
                function (
                    total,
                    report
                ) {
                    return (
                        total +
                        report.resourcesChecked
                    );
                },
                0
            );


        const totalIssues =
            latestReports.reduce(
                function (
                    total,
                    report
                ) {
                    return (
                        total +
                        report.issues.length
                    );
                },
                0
            );


        const totalPassed =
            latestReports.filter(
                function (report) {
                    return (
                        report.issues.length === 0
                    );
                }
            ).length;


        if (pagesCount) {
            pagesCount.textContent =
                totalPages;
        }

        if (resourcesCount) {
            resourcesCount.textContent =
                totalResources;
        }

        if (passedCount) {
            passedCount.textContent =
                totalPassed;
        }

        if (issuesCount) {
            issuesCount.textContent =
                totalIssues;
        }
    }


    async function runAudit() {
        runButton.disabled = true;

        runButton.textContent =
            "Running Audit...";


        if (issuesOnlyButton) {
            issuesOnlyButton.disabled =
                true;
        }


        if (auditStatus) {
            auditStatus.textContent =
                `Scanning ${pagesToAudit.length} pages...`;
        }


        reportList.innerHTML = `
            <div class="site-audit-empty">

                <h3>
                    Scanning portfolio...
                </h3>

                <p>
                    Checking internal resources,
                    links, accessibility, and
                    document structure.
                </p>

            </div>
        `;


        const reports = [];


        for (
            const pagePath
            of pagesToAudit
        ) {
            if (auditStatus) {
                auditStatus.textContent =
                    `Checking ${pagePath}...`;
            }


            const report =
                await auditPage(
                    pagePath
                );


            reports.push(
                report
            );
        }


        latestReports =
            reports;


        updateSummary();

        renderReports();


        const totalIssues =
            reports.reduce(
                function (
                    total,
                    report
                ) {
                    return (
                        total +
                        report.issues.length
                    );
                },
                0
            );


        if (auditStatus) {
            auditStatus.textContent =
                totalIssues === 0
                    ? "Audit complete. No automated issues were detected."
                    : `Audit complete. ${totalIssues} issue${
                        totalIssues === 1
                            ? ""
                            : "s"
                    } detected.`;
        }


        runButton.disabled =
            false;

        runButton.textContent =
            "Run Audit Again";


        if (issuesOnlyButton) {
            issuesOnlyButton.disabled =
                false;
        }
    }


    runButton.addEventListener(
        "click",
        runAudit
    );


    if (issuesOnlyButton) {
        issuesOnlyButton.addEventListener(
            "click",
            function () {
                showIssuesOnly =
                    !showIssuesOnly;


                issuesOnlyButton
                    .setAttribute(
                        "aria-pressed",
                        String(
                            showIssuesOnly
                        )
                    );


                issuesOnlyButton
                    .classList
                    .toggle(
                        "is-active",
                        showIssuesOnly
                    );


                issuesOnlyButton
                    .textContent =
                    showIssuesOnly
                        ? "Show All Pages"
                        : "Show Issues Only";


                renderReports();
            }
        );
    }
})();