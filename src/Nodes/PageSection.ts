/**
 * @file /src/Nodes/PageSection.ts
 * @name PageSection
 * @description Sits directly under the page node and encapsulates the content of a
 * section on the page. I.e. a header, footer, or main content.
 */

import { Node, NodeViewRendererProps, mergeAttributes } from "@tiptap/core";
import { DEFAULT_PAGE_SECTION_TYPE, PAGE_SECTION_ATTRIBUTES, PAGE_SECTION_NODE_NAME } from "../constants/pageSection";
import { getPageSectionType, isPageSectionNode } from "../utils/pageSection/pageSection";
import { addNodeAttributes, parseHTMLNode } from "../utils/node";
import { calculateShorthandPageSectionMargins } from "../utils/pageSection/margins";
import { mm } from "../utils/units";
import { getPageNodeAndPosition } from "../utils/pagination";
import { calculatePageSectionDimensions } from "../utils/pageSection/dimensions";
import { calculateCumulativePageSectionMargins } from "../utils/pageSection/cumulativeMargins";
import { constructChildOnlyClipboardSerialiser, constructClipboardPlugin } from "../utils/clipboard";

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
        return [parseHTMLNode(baseElement, pageSectionAttribute, true)];
    },

    renderHTML({ HTMLAttributes }) {
        return [baseElement, mergeAttributes(HTMLAttributes, { [pageSectionAttribute]: true, class: PAGE_SECTION_NODE_NAME }), 0];
    },

    addNodeView() {
        return (props: NodeViewRendererProps) => {
            const { editor, node, getPos } = props;
            const pos = getPos();
            const sectionType = getPageSectionType(node) ?? DEFAULT_PAGE_SECTION_TYPE;

            const { pageNode } = getPageNodeAndPosition(editor.state.doc, pos);
            if (!pageNode) {
                throw new Error("Page node not found from page section node at position " + pos);
            }

            const dom = document.createElement(baseElement);
            dom.setAttribute(pageSectionAttribute, String(true));
            dom.classList.add(PAGE_SECTION_NODE_NAME);

            const { width: sectionWidth, height: sectionHeight } = calculatePageSectionDimensions(node);
            const margins = calculateCumulativePageSectionMargins(pageNode, node, sectionType);

            dom.style.height = mm(sectionHeight);
            dom.style.width = mm(sectionWidth);
            dom.style.margin = calculateShorthandPageSectionMargins(margins);

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
        const pageSectionClipboardSerializer = constructChildOnlyClipboardSerialiser(this.editor.schema, isPageSectionNode);
        const clipboardPlugin = constructClipboardPlugin("pageSectionClipboardPlugin", pageSectionClipboardSerializer);

        return [clipboardPlugin];
    },
});

export default PageSectionNode;
