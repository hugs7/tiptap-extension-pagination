/**
 * @file /src/Nodes/PageSection.ts
 * @name PageSection
 * @description Sits directly under the page node and encapsulates the content of a
 * section on the page. I.e. a header, footer, or main content.
 */

import { Node, NodeViewRendererProps, mergeAttributes } from "@tiptap/core";
import { DOMSerializer, Fragment } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { DEFAULT_PAGE_SECTION_TYPE, PAGE_SECTION_ATTRIBUTES, PAGE_SECTION_NODE_NAME } from "../constants/pageSection";
import { getPageSectionType, isPageSectionNode } from "../utils/pageSection";
import { addNodeAttributes } from "../utils/node";
import { getPageNodePaperSize, getPaperDimensions } from "../utils/paperSize";
import { getPageNodePaperOrientation } from "../utils/paperOrientation";
import { calculatePageSectionMargins, getPageSectionNodePageMargins } from "../utils/pageSectionMargins";
import { DEFAULT_PAPER_SIZE } from "../constants/paperSize";
import { DEFAULT_PAPER_ORIENTATION } from "../constants/paperOrientation";
import { DEFAULT_MARGIN_CONFIG } from "../constants/pageMargins";
import { mm } from "../utils/units";

const baseElement = "div" as const;
const pageSectionAttribute = "data-page-section" as const;

type PageSectionNodeOptions = {};

const PageSectionNode = Node.create<PageSectionNodeOptions>({
    name: PAGE_SECTION_NODE_NAME,
    group: "block",
    content: "block+",
    defining: true,
    isolating: false,

    addAttributes() {
        return addNodeAttributes(PAGE_SECTION_ATTRIBUTES);
    },

    parseHTML() {
        return [
            {
                tag: `${baseElement}[${pageSectionAttribute}]`,
                getAttrs: (node) => {
                    const parent = (node as HTMLElement).parentElement;

                    // Prevent nested page section nodes
                    if (parent && parent.hasAttribute(pageSectionAttribute)) {
                        return false;
                    }

                    return {};
                },
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return [baseElement, mergeAttributes(HTMLAttributes, { [pageSectionAttribute]: true, class: "pageSection" }), 0];
    },

    addNodeView() {
        return (props: NodeViewRendererProps) => {
            const { node } = props;
            const sectionType = getPageSectionType(node) ?? DEFAULT_PAGE_SECTION_TYPE;

            const dom = document.createElement(baseElement);
            dom.setAttribute(pageSectionAttribute, String(true));
            dom.classList.add(PAGE_SECTION_NODE_NAME);

            const paperSize = getPageNodePaperSize(node) ?? DEFAULT_PAPER_SIZE;
            const paperOrientation = getPageNodePaperOrientation(node) ?? DEFAULT_PAPER_ORIENTATION;
            const pageMargins = getPageSectionNodePageMargins(node) ?? DEFAULT_MARGIN_CONFIG;
            const { width: pageWidth, height: pageHeight } = getPaperDimensions(paperSize, paperOrientation);

            dom.style.width = mm(pageWidth - (pageMargins.left + pageMargins.right)); // TODO have independent margins for header and footer

            switch (sectionType) {
                case "header":
                    // TODO
                    dom.style.height = mm(pageMargins.top);

                    dom.style.marginTop = mm(0);
                    dom.style.marginLeft = mm(pageMargins.left); // TODO have independent margins for header
                    dom.style.marginRight = mm(pageMargins.right); // TODO have independent margins for header
                    dom.style.marginBottom = mm(0);
                    break;
                case "body":
                    dom.style.height = mm(pageHeight - (pageMargins.top + pageMargins.bottom));
                    dom.style.margin = calculatePageSectionMargins(pageMargins);
                    break;
                case "footer":
                    // TODO
                    dom.style.height = mm(pageMargins.bottom);

                    dom.style.marginTop = mm(0);
                    dom.style.marginLeft = mm(pageMargins.left); // TODO have independent margins for footer
                    dom.style.marginRight = mm(pageMargins.right); // TODO have independent margins for footer
                    dom.style.marginBottom = mm(0);
                    break;
            }

            dom.style.border = "1px solid #ccc";

            dom.style.overflow = "hidden";
            dom.style.position = "relative";

            const contentDOM = document.createElement(baseElement);
            dom.appendChild(contentDOM);

            return {
                dom,
                contentDOM,
            };
        };
    },

    addProseMirrorPlugins() {
        const schema = this.editor.schema;

        // Extend DOMSerializer to override serializeFragment
        const pageSectionClipboardSerializer = Object.create(DOMSerializer.fromSchema(schema));

        // Override serializeFragment
        pageSectionClipboardSerializer.serializeFragment = (
            fragment: Fragment,
            options = {},
            target = document.createDocumentFragment()
        ) => {
            const serializer = DOMSerializer.fromSchema(schema);

            fragment.forEach((node) => {
                if (isPageSectionNode(node)) {
                    // Serialize only the children of the page section node
                    serializer.serializeFragment(node.content, options, target);
                } else {
                    // Serialize non-page section nodes directly
                    serializer.serializeNode(node, options);
                }
            });

            return target;
        };

        return [
            new Plugin({
                key: new PluginKey("pageSectionClipboardPlugin"),
                props: {
                    clipboardSerializer: pageSectionClipboardSerializer,
                },
            }),
        ];
    },
});

export default PageSectionNode;
