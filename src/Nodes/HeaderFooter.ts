/**
 * @file /src/Nodes/HeaderFooter.ts
 * @name HeaderFooter
 * @description The Header/Footer node for the editor.
 */

import { HEADER_FOOTER_NODE_NAME, HEADER_FOOTER_ATTRIBUTES, FOOTER_DEFAULT_ATTRIBUTES } from "../constants/pageRegions";
import { constructChildOnlyClipboardPlugin } from "../utils/clipboard";
import { Node, NodeViewRendererProps, mergeAttributes } from "@tiptap/core";
import { mm } from "../utils/units";
import { calculateHeaderFooterDimensions } from "../utils/pageRegion/dimensions";
import {
    getHeaderFooterNodePageEndOffset,
    getHeaderFooterNodeType,
    getHeaderFooterNodeXMargins,
    isHeaderFooterNode,
} from "../utils/pageRegion/pageRegion";
import { addNodeAttributes } from "../utils/attributes/addAttributes";
import { parseHTMLNode } from "../utils/nodes/node";
import { getPageNodeAndPosition } from "../utils/nodes/page/pagePosition";

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
            const pageRegionType = getHeaderFooterNodeType(node);
            if (!pageNode) {
                throw new Error(`Page node not found from ${pageRegionType ?? HEADER_FOOTER_NODE_NAME} node at position ${pos}`);
            }

            const dom = document.createElement(baseElement);
            dom.setAttribute(headerFooterAttribute, String(true));
            dom.classList.add(HEADER_FOOTER_NODE_NAME);

            const { width, height } = calculateHeaderFooterDimensions(pageNode, node);
            const endOffset = getHeaderFooterNodePageEndOffset(node) ?? FOOTER_DEFAULT_ATTRIBUTES.pageEndOffset;
            const xMargins = getHeaderFooterNodeXMargins(node) ?? FOOTER_DEFAULT_ATTRIBUTES.xMargins;

            dom.style.height = mm(height);
            dom.style.width = mm(width);
            dom.style.left = mm(xMargins.left);
            switch (pageRegionType) {
                case "header":
                    dom.style.top = mm(endOffset);
                    break;
                case "footer":
                    dom.style.bottom = mm(endOffset);
                    break;
            }

            dom.style.border = "1px solid #ccc";

            dom.style.overflow = "hidden";
            dom.style.position = "absolute";
            dom.style.boxSizing = "border-box";

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
