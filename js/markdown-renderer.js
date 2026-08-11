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


    function parseMarkdown(markdown) {
        const lines =
            markdown
                .replace(/\r\n/g, "\n")
                .split("\n");


        const output = [];

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


        lines.forEach(function (line) {
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
                    markdown
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