/**
 * @file /src/Nodes/HeaderFooter.ts
 * @name HeaderFooter
 * @description The Header/Footer node for the editor.
 */

import { HEADER_FOOTER_NODE_NAME, HEADER_FOOTER_ATTRIBUTES } from "../constants/pageRegions";
import { constructChildOnlyClipboardPlugin } from "../utils/clipboard";
import { addNodeAttributes, parseHTMLNode } from "../utils/node";
import { Node, NodeViewRendererProps, mergeAttributes } from "@tiptap/core";
import { getPageNodeAndPosition } from "../utils/pagination";
import { mm } from "../utils/units";
import { calculateHeaderFooterDimensions } from "../utils/nodes/headerFooter/dimensions";
import { calculateShorthandMargins } from "../utils/margins/pageMargins";
import { calculateHeaderFooterMargins } from "../utils/margins/headerFooter";
import { isHeaderFooterNode, getHeaderFooterNodeType } from "../utils/nodes/headerFooter/headerFooter";

const baseElement = "div" as const;
const headerFooterAttribute = "data-page-header-footer" as const;

const HeaderFooterNode = Node.create({
    name: HEADER_FOOTER_NODE_NAME,
    group: "block",
    content: "block+",
    defining: true,
    isolating: true,

    addAttributes() {
        return addNodeAttributes(HEADER_FOOTER_ATTRIBUTES);
    },

    parseHTML() {
        return [parseHTMLNode(baseElement, headerFooterAttribute, true)];
    },

    renderHTML({ HTMLAttributes }) {
        return [baseElement, mergeAttributes(HTMLAttributes, { [headerFooterAttribute]: true, class: HEADER_FOOTER_NODE_NAME }), 0];
    },

    addNodeView() {
        return (props: NodeViewRendererProps) => {
            const { editor, node, getPos } = props;
            const pos = getPos();

            const { pageNode } = getPageNodeAndPosition(editor.state.doc, pos);
            if (!pageNode) {
                const pageRegionType = getHeaderFooterNodeType(node);
                throw new Error(`Page node not found from ${pageRegionType ?? HEADER_FOOTER_NODE_NAME} node at position ${pos}`);
            }

            const dom = document.createElement(baseElement);
            dom.setAttribute(headerFooterAttribute, String(true));
            dom.classList.add(HEADER_FOOTER_NODE_NAME);

            const { width, height } = calculateHeaderFooterDimensions(pageNode, node);
            const calculatedMargins = calculateHeaderFooterMargins(pageNode, node);

            dom.style.height = mm(height);
            dom.style.width = mm(width);
            dom.style.margin = calculateShorthandMargins(calculatedMargins);

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
        return [constructChildOnlyClipboardPlugin("headerChildOnlyClipboardPlugin", this.editor.schema, isHeaderFooterNode)];
    },
});

export default HeaderFooterNode;
