(function () {
    const markdownContainers =
        document.querySelectorAll(
            "[data-markdown-src]"
        );


    if (markdownContainers.length === 0) {
        return;
    }


    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function resolveMarkdownUrl(
        rawUrl,
        markdownSource
    ) {
        try {
            const markdownUrl =
                new URL(
                    markdownSource,
                    window.location.href
                );


            const resolvedUrl =
                new URL(
                    rawUrl,
                    markdownUrl
                );


            if (
                resolvedUrl.protocol !== "http:" &&
                resolvedUrl.protocol !== "https:"
            ) {
                return "";
            }


            return resolvedUrl.href;

        } catch (error) {
            return "";
        }
    }


    function renderInlineMarkdown(text) {
        let output =
            escapeHtml(text);


        /* Inline code */

        output =
            output.replace(
                /`([^`]+)`/g,
                "<code>$1</code>"
            );


        /* Bold */

        output =
            output.replace(
                /\*\*([^*]+)\*\*/g,
                "<strong>$1</strong>"
            );


        /* Italic */

        output =
            output.replace(
                /\*([^*]+)\*/g,
                "<em>$1</em>"
            );


        /* Links */

        output =
            output.replace(
                /\[([^\]]+)\]\(([^)]+)\)/g,
                function (
                    match,
                    label,
                    url
                ) {
                    return `
                        <a href="${url}">
                            ${label}
                        </a>
                    `;
                }
            );


        return output;
    }


    function createHeadingId(text) {
        return text
            .toLowerCase()
            .replace(/<[^>]*>/g, "")
            .replace(/[^a-z0-9\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-");
    }

    function splitMarkdownTableRow(
        line
    ) {
        let content =
            String(line ?? "")
                .trim();


        if (
            content.startsWith("|")
        ) {
            content =
                content.slice(1);
        }


        if (
            content.endsWith("|") &&
            !content.endsWith("\\|")
        ) {
            content =
                content.slice(
                    0,
                    -1
                );
        }


        const cells = [];

        let currentCell = "";

        let inInlineCode = false;


        for (
            let index = 0;
            index < content.length;
            index += 1
        ) {
            const character =
                content[index];


            if (
                character === "\\" &&
                content[index + 1] === "|"
            ) {
                currentCell += "|";

                index += 1;

                continue;
            }


            if (
                character === "`"
            ) {
                inInlineCode =
                    !inInlineCode;

                currentCell +=
                    character;

                continue;
            }


            if (
                character === "|" &&
                !inInlineCode
            ) {
                cells.push(
                    currentCell.trim()
                );

                currentCell = "";

                continue;
            }


            currentCell +=
                character;
        }


        cells.push(
            currentCell.trim()
        );


        return cells;
    }

    function parseMarkdownTableSeparator(
        line
    ) {
        if (
            !String(line ?? "")
                .includes("|")
        ) {
            return null;
        }


        const cells =
            splitMarkdownTableRow(
                line
            );


        if (
            cells.length === 0
        ) {
            return null;
        }


        const alignments = [];


        for (
            const cell
            of cells
        ) {
            const marker =
                cell
                    .replace(
                        /\s+/g,
                        ""
                    );


            if (
                !/^:?-{3,}:?$/.test(
                    marker
                )
            ) {
                return null;
            }


            const startsWithColon =
                marker.startsWith(":");

            const endsWithColon =
                marker.endsWith(":");


            if (
                startsWithColon &&
                endsWithColon
            ) {
                alignments.push(
                    "center"
                );

                continue;
            }


            if (endsWithColon) {
                alignments.push(
                    "right"
                );

                continue;
            }


            alignments.push(
                "left"
            );
        }


        return alignments;
    }

    function normalizeMarkdownTableRow(
        cells,
        columnCount
    ) {
        const normalizedCells =
            cells.slice(
                0,
                columnCount
            );


        while (
            normalizedCells.length <
            columnCount
        ) {
            normalizedCells.push("");
        }


        return normalizedCells;
    }

    function createMarkdownTable(
        headerCells,
        alignments,
        bodyRows
    ) {
        const columnCount =
            headerCells.length;


        const normalizedHeader =
            normalizeMarkdownTableRow(
                headerCells,
                columnCount
            );


        const headerMarkup =
            normalizedHeader
                .map(
                    function (
                        cell,
                        index
                    ) {
                        const alignment =
                            alignments[index] ||
                            "left";


                        return `
                            <th
                                scope="col"
                                class="markdown-table-align-${alignment}"
                            >
                                ${renderInlineMarkdown(
                                    cell
                                )}
                            </th>
                        `;
                    }
                )
                .join("");


        const bodyMarkup =
            bodyRows
                .map(
                    function (row) {
                        const cells =
                            normalizeMarkdownTableRow(
                                row,
                                columnCount
                            );


                        const cellMarkup =
                            cells
                                .map(
                                    function (
                                        cell,
                                        index
                                    ) {
                                        const alignment =
                                            alignments[index] ||
                                            "left";


                                        return `
                                            <td
                                                class="markdown-table-align-${alignment}"
                                            >
                                                ${renderInlineMarkdown(
                                                    cell
                                                )}
                                            </td>
                                        `;
                                    }
                                )
                                .join("");


                        return `
                            <tr>
                                ${cellMarkup}
                            </tr>
                        `;
                    }
                )
                .join("");


        return `
            <div
                class="markdown-table-wrapper"
                role="region"
                aria-label="Scrollable data table"
                tabindex="0"
            >
                <table class="markdown-table">

                    <thead>
                        <tr>
                            ${headerMarkup}
                        </tr>
                    </thead>

                    <tbody>
                        ${bodyMarkup}
                    </tbody>

                </table>
            </div>
        `;
    }

    const markdownCalloutTypes = {
        note: {
            label:
                "Engineering Note"
        },

        warning: {
            label:
                "Warning"
        },

        implemented: {
            label:
                "Implemented"
        },

        prototype: {
            label:
                "Prototype"
        },

        testing: {
            label:
                "Testing"
        },

        planned: {
            label:
                "Planned"
        }
    };

    function parseMarkdownCalloutStart(
        line
    ) {
        const match =
            String(line ?? "")
                .trim()
                .match(
                    /^>\s*\[!([a-z-]+)\](?:\s+(.+))?$/i
                );


        if (!match) {
            return null;
        }


        const type =
            match[1]
                .toLowerCase();


        const configuration =
            markdownCalloutTypes[
                type
            ];


        if (!configuration) {
            return null;
        }


        return {
            type,

            label:
                configuration.label,

            title:
                (
                    match[2] || ""
                ).trim()
        };
    }

    function createMarkdownCallout(
        callout,
        bodyLines
    ) {
        const bodyText =
            bodyLines
                .join(" ")
                .trim();


        const titleMarkup =
            callout.title
                ? `
                    <h3
                        class="markdown-callout-title"
                    >
                        ${renderInlineMarkdown(
                            callout.title
                        )}
                    </h3>
                `
                : "";


        const bodyMarkup =
            bodyText
                ? `
                    <p
                        class="markdown-callout-body"
                    >
                        ${renderInlineMarkdown(
                            bodyText
                        )}
                    </p>
                `
                : "";


        return `
            <aside
                class="
                    markdown-callout
                    markdown-callout-${callout.type}
                "
                aria-label="${escapeHtml(
                    callout.label
                )}"
            >

                <div
                    class="markdown-callout-heading"
                >

                    <span
                        class="markdown-callout-label"
                    >
                        ${escapeHtml(
                            callout.label
                        )}
                    </span>

                    ${titleMarkup}

                </div>


                ${bodyMarkup}

            </aside>
        `;
    }

    function parseMarkdown(
        markdown,
        markdownSource
    ) {
        const lines =
            markdown
                .replace(/\r\n/g, "\n")
                .split("\n");


        const output = [];

        const consumedTableLines =
            new Set();

        const consumedCalloutLines =
            new Set();

        let paragraphLines = [];

        let listType = null;

        let codeBlockOpen = false;
        let codeLanguage = "";
        let codeLines = [];

        let mathBlockOpen = false;
        let mathLines = [];


        function flushParagraph() {
            if (
                paragraphLines.length === 0
            ) {
                return;
            }


            output.push(`
                <p>
                    ${renderInlineMarkdown(
                        paragraphLines.join(" ")
                    )}
                </p>
            `);


            paragraphLines = [];
        }


        function closeList() {
            if (!listType) {
                return;
            }


            output.push(
                listType === "ul"
                    ? "</ul>"
                    : "</ol>"
            );


            listType = null;
        }


        function flushCodeBlock() {
            const languageClass =
                codeLanguage
                    ? ` language-${escapeHtml(
                        codeLanguage
                    )}`
                    : "";


            output.push(`
                <pre>
                    <code class="${languageClass.trim()}">${escapeHtml(
                        codeLines.join("\n")
                    )}</code>
                </pre>
            `);


            codeLines = [];
            codeLanguage = "";
        }


        function flushMathBlock() {
            const expression =
                mathLines
                    .join("\n")
                    .trim();


            output.push(`
                <div
                    class="markdown-equation"
                    data-math="${escapeHtml(
                        expression
                    )}"
                    data-math-display="true"
                ></div>
            `);


            mathLines = [];
        }


        lines.forEach(function (line,index) {

            if (
                consumedTableLines.has(
                    index
                ) ||
                consumedCalloutLines.has(
                    index
                )
            ) {
                return;
            }

            const trimmed =
                line.trim();


            /* Code block */

            if (
                trimmed.startsWith("```")
            ) {
                if (!codeBlockOpen) {
                    flushParagraph();
                    closeList();

                    codeBlockOpen = true;

                    codeLanguage =
                        trimmed
                            .slice(3)
                            .trim();

                    return;
                }


                codeBlockOpen = false;

                flushCodeBlock();

                return;
            }


            if (codeBlockOpen) {
                codeLines.push(line);
                return;
            }


            /* Math block */

            if (trimmed === "$$") {
                if (!mathBlockOpen) {
                    flushParagraph();
                    closeList();

                    mathBlockOpen = true;

                    return;
                }


                mathBlockOpen = false;

                flushMathBlock();

                return;
            }


            if (mathBlockOpen) {
                mathLines.push(line);

                return;
            }


            /* Blank line */

            if (!trimmed) {
                flushParagraph();
                closeList();

                return;
            }

            /* Table */

            const nextLine =
                lines[index + 1] || "";


            const tableAlignments =
                parseMarkdownTableSeparator(
                    nextLine
                );


            if (
                trimmed.includes("|") &&
                tableAlignments
            ) {
                const headerCells =
                    splitMarkdownTableRow(
                        line
                    );


                if (
                    headerCells.length ===
                    tableAlignments.length
                ) {
                    flushParagraph();

                    closeList();


                    const bodyRows = [];


                    consumedTableLines.add(
                        index + 1
                    );


                    let bodyIndex =
                        index + 2;


                    while (
                        bodyIndex <
                        lines.length
                    ) {
                        const bodyLine =
                            lines[bodyIndex];

                        const bodyTrimmed =
                            bodyLine.trim();


                        if (
                            !bodyTrimmed ||
                            !bodyTrimmed.includes("|")
                        ) {
                            break;
                        }


                        if (
                            bodyTrimmed.startsWith("## ") ||
                            bodyTrimmed.startsWith("### ") ||
                            bodyTrimmed.startsWith("```") ||
                            bodyTrimmed === "$$"
                        ) {
                            break;
                        }


                        bodyRows.push(
                            splitMarkdownTableRow(
                                bodyLine
                            )
                        );


                        consumedTableLines.add(
                            bodyIndex
                        );


                        bodyIndex += 1;
                    }


                    output.push(
                        createMarkdownTable(
                            headerCells,
                            tableAlignments,
                            bodyRows
                        )
                    );


                    return;
                }
            }

            /* Image */

            const imageMatch =
                trimmed.match(
                    /^!\[([^\]]*)\]\((\S+?)(?:\s+"([^"]*)")?\)$/
                );


            if (imageMatch) {
                flushParagraph();
                closeList();


                const altText =
                    imageMatch[1];

                const imagePath =
                    imageMatch[2];

                const caption =
                    imageMatch[3] || "";


                const imageUrl =
                    resolveMarkdownUrl(
                        imagePath,
                        markdownSource
                    );

                const isThemeAwareDiagram =
                    imagePath
                        .toLowerCase()
                        .endsWith(
                            ".diagram.svg"
                        );


                if (!imageUrl) {
                    output.push(`
                        <p class="markdown-image-error">
                            Image could not be loaded:
                            ${escapeHtml(imagePath)}
                        </p>
                    `);

                    return;
                }


                output.push(`
                    <figure class="markdown-figure">

                        <img
                            class="${
                                isThemeAwareDiagram
                                    ? "markdown-image markdown-image-diagram"
                                    : "markdown-image"
                            }"
                            src="${escapeHtml(
                                imageUrl
                            )}"
                            alt="${escapeHtml(
                                altText
                            )}"
                            loading="lazy"
                            decoding="async"
                        >

                        ${
                            caption
                                ? `
                                    <figcaption>
                                        ${escapeHtml(
                                            caption
                                        )}
                                    </figcaption>
                                `
                                : ""
                        }

                    </figure>
                `);


                return;
            }

            /* H2 */

            if (
                trimmed.startsWith("## ")
            ) {
                flushParagraph();
                closeList();


                const heading =
                    trimmed.slice(3);


                const headingHtml =
                    renderInlineMarkdown(
                        heading
                    );


                output.push(`
                    <h2
                        id="${createHeadingId(
                            heading
                        )}"
                    >
                        ${headingHtml}
                    </h2>
                `);

                return;
            }


            /* H3 */

            if (
                trimmed.startsWith("### ")
            ) {
                flushParagraph();
                closeList();


                const heading =
                    trimmed.slice(4);


                output.push(`
                    <h3
                        id="${createHeadingId(
                            heading
                        )}"
                    >
                        ${renderInlineMarkdown(
                            heading
                        )}
                    </h3>
                `);

                return;
            }


            /* Unordered list */

            const unorderedMatch =
                trimmed.match(
                    /^[-*]\s+(.+)$/
                );


            if (unorderedMatch) {
                flushParagraph();


                if (listType !== "ul") {
                    closeList();

                    output.push("<ul>");

                    listType = "ul";
                }


                output.push(`
                    <li>
                        ${renderInlineMarkdown(
                            unorderedMatch[1]
                        )}
                    </li>
                `);

                return;
            }


            /* Ordered list */

            const orderedMatch =
                trimmed.match(
                    /^\d+\.\s+(.+)$/
                );


            if (orderedMatch) {
                flushParagraph();


                if (listType !== "ol") {
                    closeList();

                    output.push("<ol>");

                    listType = "ol";
                }


                output.push(`
                    <li>
                        ${renderInlineMarkdown(
                            orderedMatch[1]
                        )}
                    </li>
                `);

                return;
            }

            /* Callout */

            const callout =
                parseMarkdownCalloutStart(
                    line
                );


            if (callout) {
                flushParagraph();

                closeList();


                const bodyLines =
                    [];


                let bodyIndex =
                    index + 1;


                while (
                    bodyIndex <
                    lines.length
                ) {
                    const bodyLine =
                        lines[
                            bodyIndex
                        ];

                    const bodyTrimmed =
                        bodyLine.trim();


                    if (
                        parseMarkdownCalloutStart(
                            bodyLine
                        )
                    ) {
                        break;
                    }


                    if (
                        !bodyTrimmed.startsWith(
                            ">"
                        )
                    ) {
                        break;
                    }


                    const bodyContent =
                        bodyTrimmed === ">"
                            ? ""
                            : bodyTrimmed
                                .replace(
                                    /^>\s?/,
                                    ""
                                );


                    bodyLines.push(
                        bodyContent
                    );


                    consumedCalloutLines
                        .add(
                            bodyIndex
                        );


                    bodyIndex += 1;
                }


                output.push(
                    createMarkdownCallout(
                        callout,
                        bodyLines
                    )
                );


                return;
            }

            /* Blockquote */

            if (
                trimmed.startsWith("> ")
            ) {
                flushParagraph();
                closeList();


                output.push(`
                    <blockquote>
                        <p>
                            ${renderInlineMarkdown(
                                trimmed.slice(2)
                            )}
                        </p>
                    </blockquote>
                `);

                return;
            }


            paragraphLines.push(
                trimmed
            );
        });


        flushParagraph();
        closeList();


        if (codeBlockOpen) {
            flushCodeBlock();
        }


        if (mathBlockOpen) {
            flushMathBlock();
        }


        return output.join("");
    }


    async function loadMarkdown(
        container
    ) {
        const source =
            container.dataset
                .markdownSrc;


        if (!source) {
            return;
        }


        container.setAttribute(
            "aria-busy",
            "true"
        );


        try {
            const response =
                await fetch(
                    source,
                    {
                        cache:
                            "no-store"
                    }
                );


            if (!response.ok) {
                throw new Error(
                    `HTTP ${response.status}`
                );
            }


            const markdown =
                await response.text();


            container.innerHTML =
                parseMarkdown(
                    markdown,
                    source
                );


            container.setAttribute(
                "aria-busy",
                "false"
            );


            if (
                typeof renderMathElements ===
                "function"
            ) {
                renderMathElements(
                    container
                );
            }


            container.dispatchEvent(
                new CustomEvent(
                    "markdown:rendered",
                    {
                        bubbles: true
                    }
                )
            );

        } catch (error) {
            console.error(
                "Markdown could not be loaded:",
                source,
                error
            );


            container.innerHTML = `
                <div
                    class="markdown-load-error"
                    role="alert"
                >
                    <h2>
                        Content unavailable
                    </h2>

                    <p>
                        This technical document
                        could not be loaded.
                    </p>
                </div>
            `;


            container.setAttribute(
                "aria-busy",
                "false"
            );
        }
    }


    markdownContainers.forEach(
        loadMarkdown
    );
})();