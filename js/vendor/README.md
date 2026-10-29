# Article renderer dependencies

These pinned browser bundles are stored locally so Markdown parsing, footnotes, expandable sections, and code highlighting do not need a CDN request. The bundles are unmodified; their local filenames include the upstream version.

| Local file | Version | Download source | Upstream | Local license |
| :--- | :--- | :--- | :--- | :--- |
| `markdown-it-15.0.3.min.js` | 15.0.3 | [jsDelivr browser UMD bundle](https://cdn.jsdelivr.net/npm/markdown-it@15.0.3/dist/browser/markdown-it.umd.min.js) | [markdown-it](https://github.com/markdown-it/markdown-it) | [MIT](markdown-it.LICENSE) |
| `markdown-it-footnote-4.0.0.min.js` | 4.0.0 | [jsDelivr browser bundle](https://cdn.jsdelivr.net/npm/markdown-it-footnote@4.0.0/dist/markdown-it-footnote.min.js) | [markdown-it-footnote](https://github.com/markdown-it/markdown-it-footnote) | [MIT](markdown-it-footnote.LICENSE) |
| `markdown-it-container-4.0.0.min.js` | 4.0.0 | [jsDelivr browser bundle](https://cdn.jsdelivr.net/npm/markdown-it-container@4.0.0/dist/markdown-it-container.min.js) | [markdown-it-container](https://github.com/markdown-it/markdown-it-container) | [MIT](markdown-it-container.LICENSE) |
| `highlight-11.12.0.min.js` | 11.12.0 | [jsDelivr common-language browser bundle](https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.12.0/highlight.min.js) | [highlight.js](https://github.com/highlightjs/highlight.js) | [BSD 3-Clause](highlight.LICENSE) |

License files were downloaded from each pinned npm package's root `LICENSE` file:

- [markdown-it license source](https://cdn.jsdelivr.net/npm/markdown-it@15.0.3/LICENSE)
- [markdown-it-footnote license source](https://cdn.jsdelivr.net/npm/markdown-it-footnote@4.0.0/LICENSE)
- [markdown-it-container license source](https://cdn.jsdelivr.net/npm/markdown-it-container@4.0.0/LICENSE)
- [highlight.js distribution license source](https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.12.0/LICENSE)

## Integration

`js/markdown-renderer.js` loads the three Markdown bundles only on pages containing an element with `data-markdown-src`. It then loads `js/markdown-engine.js`, which configures Markdown parsing, the footnote plugin, and the `details` container. The engine adds this site's code toolbars, callouts, task lists, image figures, heading IDs, table controls, and math placeholders. Raw HTML in article sources is disabled.

The renderer loads highlight.js when an article contains code with a language label. The common-language bundle includes JavaScript, Python, C++, Bash, JSON, XML/HTML, CSS, and other common languages. Unknown labels remain plain text. Highlighting is an optional enhancement; the original code remains readable and copyable if it cannot load.

KaTeX is a separate, optional external dependency, not one of these vendored bundles. Articles containing equations load [KaTeX 0.18.1 JavaScript](https://cdn.jsdelivr.net/npm/katex@0.18.1/dist/katex.min.js) and [its stylesheet](https://cdn.jsdelivr.net/npm/katex@0.18.1/dist/katex.min.css) from jsDelivr. The stylesheet also requests its font files. Equations keep readable LaTeX source if this enhancement is unavailable. [KaTeX upstream](https://github.com/KaTeX/KaTeX).

When updating a dependency, update its local filename, loader path, version and source URL in this document, and local license together. Check existing articles and the [live Markdown guide](../../resources/markdown-template.html), including literal code, safe links, nested blocks, equations, footnotes, keyboard controls, and the mobile layout.
