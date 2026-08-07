(function () {
    const widthsToTest = [
        320,
        390,
        430,
        768,
        1024
    ];


    const pagesToTest = [
        {
            path: "index.html",

            label: "Home",

            layoutRules: [
                {
                    selector:
                        ".home-preview-grid",

                    maxWidth:
                        1024,

                    expectedColumns:
                        1
                }
            ]
        },

        {
            path: "about.html",

            label: "About",

            layoutRules: []
        },

        {
            path: "projects.html",

            label: "Projects",

            layoutRules: []
        },

        {
            path: "lab-notes.html",

            label: "Lab Notes",

            layoutRules: [
                {
                    selector:
                        ".notes-grid",

                    maxWidth:
                        900,

                    expectedColumns:
                        1
                }
            ]
        },

        {
            path: "components.html",

            label: "Components",

            layoutRules: [
                {
                    selector:
                        ".components-grid",

                    maxWidth:
                        1024,

                    expectedColumns:
                        1
                }
            ]
        },

        {
            path: "resources.html",

            label: "Resources",

            layoutRules: [
                {
                    selector:
                        ".resources-grid",

                    maxWidth:
                        1024,

                    expectedColumns:
                        1
                }
            ]
        },

        {
            path:
                "projects/esp32-lab-station.html",

            label:
                "ESP32 Lab Station",

            layoutRules: []
        },

        {
            path:
                "notes/voltage-divider.html",

            label:
                "Voltage Divider",

            layoutRules: [
                {
                    selector:
                        ".tech-note-variable-grid",

                    maxWidth:
                        768,

                    expectedColumns:
                        1
                },

                {
                    selector:
                        ".tech-note-callout-grid",

                    maxWidth:
                        768,

                    expectedColumns:
                        1
                },

                {
                    selector:
                        ".tech-note-media-grid",

                    maxWidth:
                        768,

                    expectedColumns:
                        1
                }
            ]
        },

        {
            path:
                "components/esp32-s3-n16r8.html",

            label:
                "ESP32-S3 Component",

            layoutRules: [
                {
                    selector:
                        ".component-detail-spec-grid",

                    maxWidth:
                        768,

                    expectedColumns:
                        1
                },

                {
                    selector:
                        ".component-detail-interface-grid",

                    maxWidth:
                        768,

                    expectedColumns:
                        1
                },

                {
                    selector:
                        ".component-detail-pin-grid",

                    maxWidth:
                        768,

                    expectedColumns:
                        1
                },

                {
                    selector:
                        ".component-detail-media-grid",

                    maxWidth:
                        768,

                    expectedColumns:
                        1
                }
            ]
        }
    ];


    const pageSelect =
        document.querySelector(
            "#responsive-page-select"
        );

    const widthButtons =
        Array.from(
            document.querySelectorAll(
                ".responsive-width-button"
            )
        );

    const frameContainer =
        document.querySelector(
            "#responsive-device-frame"
        );

    const previewFrame =
        document.querySelector(
            "#responsive-preview-frame"
        );

    const currentWidthOutput =
        document.querySelector(
            "#responsive-current-width"
        );

    const previewStatus =
        document.querySelector(
            "#responsive-preview-status"
        );

    const checkCurrentButton =
        document.querySelector(
            "#check-current-responsive"
        );

    const currentResults =
        document.querySelector(
            "#responsive-current-results"
        );

    const runAuditButton =
        document.querySelector(
            "#run-responsive-audit"
        );

    const auditStatus =
        document.querySelector(
            "#responsive-audit-status"
        );

    const reportList =
        document.querySelector(
            "#responsive-report-list"
        );


    if (
        !pageSelect ||
        !frameContainer ||
        !previewFrame
    ) {
        return;
    }


    let currentWidth =
        390;


    function escapeResponsiveHtml(
        value
    ) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }


    function getPageConfiguration(
        pagePath
    ) {
        return (
            pagesToTest.find(
                function (page) {
                    return (
                        page.path ===
                        pagePath
                    );
                }
            ) ||
            {
                path: pagePath,
                label: pagePath,
                layoutRules: []
            }
        );
    }


    function updateWidthButtons() {
        widthButtons.forEach(
            function (button) {
                const buttonWidth =
                    Number(
                        button.dataset
                            .responsiveWidth
                    );

                const isActive =
                    buttonWidth ===
                    currentWidth;


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


    function setPreviewWidth(
        width
    ) {
        currentWidth =
            width;


        frameContainer.style.width =
            `${width}px`;


        if (currentWidthOutput) {
            currentWidthOutput.textContent =
                `${width} px`;
        }


        updateWidthButtons();


        if (previewStatus) {
            previewStatus.textContent =
                `Previewing ${pageSelect.value} at ${width}px.`;
        }
    }


    function loadPreviewPage(
        pagePath
    ) {
        if (previewStatus) {
            previewStatus.textContent =
                `Loading ${pagePath}...`;
        }


        previewFrame.src =
            pagePath;
    }


    function waitForFrameLoad() {
        return new Promise(
            function (resolve) {

                if (
                    previewFrame
                        .contentDocument
                        ?.readyState ===
                    "complete"
                ) {
                    resolve();
                    return;
                }


                previewFrame.addEventListener(
                    "load",
                    function handleLoad() {
                        previewFrame
                            .removeEventListener(
                                "load",
                                handleLoad
                            );

                        resolve();
                    }
                );
            }
        );
    }


    function waitForLayout() {
        return new Promise(
            function (resolve) {
                requestAnimationFrame(
                    function () {
                        requestAnimationFrame(
                            function () {
                                setTimeout(
                                    resolve,
                                    80
                                );
                            }
                        );
                    }
                );
            }
        );
    }


    function getGridColumnCount(
        element
    ) {
        const frameWindow =
            previewFrame
                .contentWindow;


        if (!frameWindow) {
            return null;
        }


        const style =
            frameWindow
                .getComputedStyle(
                    element
                );


        const columns =
            style
                .gridTemplateColumns
                .trim();


        if (
            !columns ||
            columns === "none"
        ) {
            return null;
        }


        return columns
            .split(/\s+/)
            .filter(Boolean)
            .length;
    }


    function elementIsVisible(
        element
    ) {
        const frameWindow =
            previewFrame
                .contentWindow;


        if (!frameWindow) {
            return false;
        }


        const style =
            frameWindow
                .getComputedStyle(
                    element
                );


        return (
            style.display !== "none" &&
            style.visibility !==
                "hidden" &&
            element.getClientRects()
                .length > 0
        );
    }


    function ancestorContainsOverflow(
        element
    ) {
        const frameWindow =
            previewFrame
                .contentWindow;


        if (!frameWindow) {
            return false;
        }


        let parent =
            element.parentElement;


        while (
            parent &&
            parent !==
                previewFrame
                    .contentDocument
                    ?.body
        ) {
            const style =
                frameWindow
                    .getComputedStyle(
                        parent
                    );


            const overflowX =
                style.overflowX;


            if (
                overflowX === "auto" ||
                overflowX === "scroll" ||
                overflowX === "hidden" ||
                overflowX === "clip"
            ) {
                return true;
            }


            parent =
                parent.parentElement;
        }


        return false;
    }


    function describeElement(
        element
    ) {
        if (!element) {
            return "Unknown element";
        }


        let description =
            element.tagName
                .toLowerCase();


        if (element.id) {
            description +=
                `#${element.id}`;
        }


        if (
            element.classList.length >
            0
        ) {
            description +=
                "." +
                Array.from(
                    element.classList
                )
                    .slice(0, 3)
                    .join(".");
        }


        return description;
    }


    function findOverflowCandidates(
        documentObject,
        viewportWidth
    ) {
        const candidates =
            [];


        documentObject
            .querySelectorAll("*")
            .forEach(function (element) {

                if (
                    !elementIsVisible(
                        element
                    )
                ) {
                    return;
                }


                if (
                    ancestorContainsOverflow(
                        element
                    )
                ) {
                    return;
                }


                const rect =
                    element
                        .getBoundingClientRect();


                const exceedsRight =
                    rect.right >
                    viewportWidth + 2;


                const exceedsLeft =
                    rect.left < -2;


                if (
                    exceedsRight ||
                    exceedsLeft
                ) {
                    candidates.push({
                        element,

                        amount:
                            Math.max(
                                rect.right -
                                    viewportWidth,
                                Math.abs(
                                    rect.left
                                ),
                                0
                            )
                    });
                }
            });


        return candidates
            .sort(
                function (
                    first,
                    second
                ) {
                    return (
                        second.amount -
                        first.amount
                    );
                }
            )
            .slice(0, 5);
    }


    function checkPageOverflow(
        documentObject
    ) {
        const root =
            documentObject
                .documentElement;

        const body =
            documentObject.body;

        const frameWindow =
            previewFrame
                .contentWindow;


        const viewportWidth =
            frameWindow
                ? frameWindow.innerWidth
                : root.clientWidth;


        const pageScrollWidth =
            Math.max(
                root.scrollWidth,
                body
                    ? body.scrollWidth
                    : 0
            );


        const hasOverflow =
            pageScrollWidth >
            viewportWidth + 2;


        if (!hasOverflow) {
            return {
                passed: true,

                message:
                    `No horizontal page overflow detected. ` +
                    `Actual viewport: ${viewportWidth}px.`,

                details: []
            };
        }


        const overflowAmount =
            pageScrollWidth -
            viewportWidth;


        const candidates =
            findOverflowCandidates(
                documentObject,
                viewportWidth
            );


        return {
            passed: false,

            message:
                `Page is ${overflowAmount}px wider than ` +
                `the actual ${viewportWidth}px viewport.`,

            details:
                candidates.map(
                    function (
                        candidate
                    ) {
                        return (
                            describeElement(
                                candidate.element
                            ) +
                            ` (+${Math.ceil(
                                candidate.amount
                            )}px)`
                        );
                    }
                )
        };
    }

    function checkLayoutRules(
        documentObject,
        pageConfig,
        viewportWidth
    ) {
        const results =
            [];


        pageConfig.layoutRules
            .forEach(function (rule) {

                if (
                    viewportWidth >
                    rule.maxWidth
                ) {
                    return;
                }


                const elements =
                    documentObject
                        .querySelectorAll(
                            rule.selector
                        );


                if (
                    elements.length === 0
                ) {
                    results.push({
                        passed: false,

                        message:
                            `${rule.selector} was not found.`
                    });

                    return;
                }


                elements.forEach(
                    function (element) {
                        const columnCount =
                            getGridColumnCount(
                                element
                            );


                        if (
                            columnCount === null
                        ) {
                            results.push({
                                passed:
                                    false,

                                message:
                                    `${rule.selector} is not currently using a measurable grid layout.`
                            });

                            return;
                        }


                        const passed =
                            columnCount ===
                            rule
                                .expectedColumns;


                        results.push({
                            passed,

                            message:
                                passed
                                    ? `${rule.selector} uses ${columnCount} column at ${viewportWidth}px.`
                                    : `${rule.selector} uses ${columnCount} columns at ${viewportWidth}px; expected ${rule.expectedColumns}.`
                        });
                    }
                );
            });


        return results;
    }


    function inspectCurrentFrame() {
        const documentObject =
            previewFrame
                .contentDocument;


        if (!documentObject) {
            return {
                page:
                    pageSelect.value,

                width:
                    currentWidth,

                checks: [
                    {
                        passed:
                            false,

                        message:
                            "The preview document could not be accessed."
                    }
                ]
            };
        }


        const pageConfig =
            getPageConfiguration(
                pageSelect.value
            );


        const checks =
            [];


        checks.push(
            checkPageOverflow(
                documentObject
            )
        );


        checks.push(
            ...checkLayoutRules(
                documentObject,
                pageConfig,
                currentWidth
            )
        );


        return {
            page:
                pageConfig.path,

            label:
                pageConfig.label,

            width:
                currentWidth,

            checks
        };
    }


    function createCheckMarkup(
        check
    ) {
        const detailMarkup =
            Array.isArray(
                check.details
            ) &&
            check.details.length > 0
                ? `
                    <ul>
                        ${check.details
                            .map(
                                function (
                                    detail
                                ) {
                                    return `
                                        <li>
                                            <code>
                                                ${escapeResponsiveHtml(
                                                    detail
                                                )}
                                            </code>
                                        </li>
                                    `;
                                }
                            )
                            .join("")}
                    </ul>
                `
                : "";


        return `
            <div
                class="
                    responsive-check-result
                    ${
                        check.passed
                            ? "is-passed"
                            : "has-error"
                    }
                "
            >

                <span
                    class="responsive-check-icon"
                    aria-hidden="true"
                >
                    ${
                        check.passed
                            ? "✓"
                            : "×"
                    }
                </span>

                <div>

                    <p>
                        ${escapeResponsiveHtml(
                            check.message
                        )}
                    </p>

                    ${detailMarkup}

                </div>

            </div>
        `;
    }


    function renderCurrentResults(
        report
    ) {
        if (!currentResults) {
            return;
        }


        currentResults.innerHTML = `
            <div class="responsive-current-report">

                <div class="responsive-current-report-heading">

                    <strong>
                        ${escapeResponsiveHtml(
                            report.page
                        )}
                    </strong>

                    <span>
                        ${report.width}px
                    </span>

                </div>

                <div class="responsive-check-list">

                    ${report.checks
                        .map(
                            createCheckMarkup
                        )
                        .join("")}

                </div>

            </div>
        `;
    }


    async function checkCurrentPreview() {
        if (checkCurrentButton) {
            checkCurrentButton.disabled =
                true;

            checkCurrentButton.textContent =
                "Checking...";
        }


        await waitForLayout();


        const report =
            inspectCurrentFrame();


        renderCurrentResults(
            report
        );


        if (checkCurrentButton) {
            checkCurrentButton.disabled =
                false;

            checkCurrentButton.textContent =
                "Check Current View";
        }
    }


    async function loadAuditPage(
        pagePath
    ) {
        if (
            previewFrame
                .getAttribute("src") ===
            pagePath
        ) {
            await waitForLayout();

            return;
        }


        const loadPromise =
            new Promise(
                function (resolve) {
                    previewFrame.addEventListener(
                        "load",
                        function handleLoad() {
                            previewFrame
                                .removeEventListener(
                                    "load",
                                    handleLoad
                                );

                            resolve();
                        }
                    );
                }
            );


        previewFrame.src =
            pagePath;


        await loadPromise;

        await waitForLayout();
    }


    async function inspectAtWidth(
        pageConfig,
        width
    ) {
        setPreviewWidth(
            width
        );


        await waitForLayout();


        const documentObject =
            previewFrame
                .contentDocument;


        if (!documentObject) {
            return {
                page:
                    pageConfig.path,

                label:
                    pageConfig.label,

                width,

                checks: [
                    {
                        passed:
                            false,

                        message:
                            "Page could not be inspected."
                    }
                ]
            };
        }


        const checks = [
            checkPageOverflow(
                documentObject
            ),

            ...checkLayoutRules(
                documentObject,
                pageConfig,
                width
            )
        ];


        return {
            page:
                pageConfig.path,

            label:
                pageConfig.label,

            width,

            checks
        };
    }


    function createAuditReportMarkup(
        report
    ) {
        const failedChecks =
            report.checks.filter(
                function (check) {
                    return !check.passed;
                }
            );


        const passed =
            failedChecks.length ===
            0;


        return `
            <article
                class="
                    responsive-audit-report
                    ${
                        passed
                            ? "is-passed"
                            : "has-error"
                    }
                "
            >

                <header>

                    <div>

                        <p>
                            ${escapeResponsiveHtml(
                                report.page
                            )}
                        </p>

                        <span>
                            ${report.width}px
                        </span>

                    </div>

                    <strong>
                        ${
                            passed
                                ? "Passed"
                                : `${failedChecks.length} issue${
                                    failedChecks.length === 1
                                        ? ""
                                        : "s"
                                }`
                        }
                    </strong>

                </header>


                <div class="responsive-check-list">

                    ${report.checks
                        .map(
                            createCheckMarkup
                        )
                        .join("")}

                </div>

            </article>
        `;
    }


    async function runResponsiveAudit() {
        if (!runAuditButton) {
            return;
        }


        runAuditButton.disabled =
            true;

        runAuditButton.textContent =
            "Running Audit...";


        if (checkCurrentButton) {
            checkCurrentButton.disabled =
                true;
        }


        if (reportList) {
            reportList.innerHTML = "";
        }


        const originalPage =
            pageSelect.value;

        const originalWidth =
            currentWidth;


        const reports =
            [];


        const totalTests =
            pagesToTest.length *
            widthsToTest.length;


        let completedTests =
            0;


        for (
            const pageConfig
            of pagesToTest
        ) {
            pageSelect.value =
                pageConfig.path;


            if (auditStatus) {
                auditStatus.textContent =
                    `Loading ${pageConfig.path}...`;
            }


            await loadAuditPage(
                pageConfig.path
            );


            for (
                const width
                of widthsToTest
            ) {
                completedTests += 1;


                if (auditStatus) {
                    auditStatus.textContent =
                        `Test ${completedTests} of ${totalTests}: ${pageConfig.path} at ${width}px`;
                }


                const report =
                    await inspectAtWidth(
                        pageConfig,
                        width
                    );


                reports.push(
                    report
                );
            }
        }


        const issueReports =
            reports.filter(
                function (report) {
                    return report.checks.some(
                        function (check) {
                            return (
                                !check.passed
                            );
                        }
                    );
                }
            );


        if (reportList) {
            const reportsToRender =
                issueReports.length > 0
                    ? issueReports
                    : reports;


            reportList.innerHTML =
                reportsToRender
                    .map(
                        createAuditReportMarkup
                    )
                    .join("");
        }


        if (auditStatus) {
            auditStatus.textContent =
                issueReports.length === 0
                    ? `Responsive audit complete. All ${totalTests} viewport tests passed.`
                    : `Responsive audit complete. ${issueReports.length} viewport test${
                        issueReports.length === 1
                            ? ""
                            : "s"
                    } contain issues.`;
        }


        pageSelect.value =
            originalPage;


        await loadAuditPage(
            originalPage
        );


        setPreviewWidth(
            originalWidth
        );


        runAuditButton.disabled =
            false;

        runAuditButton.textContent =
            "Run Responsive Audit";


        if (checkCurrentButton) {
            checkCurrentButton.disabled =
                false;
        }
    }


    widthButtons.forEach(
        function (button) {
            button.addEventListener(
                "click",
                function () {
                    const width =
                        Number(
                            button.dataset
                                .responsiveWidth
                        );


                    if (
                        !Number.isFinite(
                            width
                        )
                    ) {
                        return;
                    }


                    setPreviewWidth(
                        width
                    );
                }
            );
        }
    );


    pageSelect.addEventListener(
        "change",
        function () {
            loadPreviewPage(
                pageSelect.value
            );
        }
    );


    previewFrame.addEventListener(
        "load",
        function () {
            if (previewStatus) {
                previewStatus.textContent =
                    `Previewing ${pageSelect.value} at ${currentWidth}px.`;
            }
        }
    );


    if (checkCurrentButton) {
        checkCurrentButton.addEventListener(
            "click",
            checkCurrentPreview
        );
    }


    if (runAuditButton) {
        runAuditButton.addEventListener(
            "click",
            runResponsiveAudit
        );
    }


    setPreviewWidth(
        currentWidth
    );
})();