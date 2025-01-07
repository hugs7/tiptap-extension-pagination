/**
 * @file /src/Nodes/Page.ts
 * @name Page
 * @description Custom node for creating a page in the editor.
 */

import { Node, NodeViewRendererProps, mergeAttributes } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { DEFAULT_PAPER_SIZE } from "../constants/paperSize";
import { DEFAULT_PAGE_BORDER_CONFIG } from "../constants/pageBorders";
import { DEFAULT_PAPER_COLOUR } from "../constants/paperColours";
import { DEFAULT_PAPER_ORIENTATION } from "../constants/paperOrientation";
import { PAGE_NODE_NAME, DEFAULT_PAGE_GAP, PAGE_ATTRIBUTES } from "../constants/page";
import { PAGE_SECTION_NODE_NAME } from "../constants/pageSection";
import { getPageNodePaperSize, getPaperDimensions } from "../utils/paperSize";
import { getPageNodePaperColour } from "../utils/paperColour";
import { isPageNode } from "../utils/page";
import { getPageNodePaperOrientation } from "../utils/paperOrientation";
import { mm, px } from "../utils/units";
import { calculateShorthandPageBorders, getPageNodePageBorders } from "../utils/pageBorders";
import { addNodeAttributes, parseHTMLNodeGetAttrs } from "../utils/node";
import { constructChildOnlyClipboardSerialiser } from "../utils/clipboard";

const baseElement = "div" as const;
const dataPageAttribute = "data-page" as const;

type PageNodeOptions = {
    pageGap: number;
};

const PageNode = Node.create<PageNodeOptions>({
    name: PAGE_NODE_NAME,
    group: "block",
    content: `${PAGE_SECTION_NODE_NAME}{1, 3}`, // We must have a body section and can optionally have a header and footer
    defining: true,
    isolating: false,

    addOptions() {
        return {
            pageGap: DEFAULT_PAGE_GAP,
        };
    },

    addAttributes() {
        return addNodeAttributes(PAGE_ATTRIBUTES);
    },

    parseHTML() {
        return [
            {
                tag: `${baseElement}[${dataPageAttribute}]`,
                getAttrs: parseHTMLNodeGetAttrs(dataPageAttribute, true),
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return [baseElement, mergeAttributes(HTMLAttributes, { [dataPageAttribute]: true, class: "page" }), 0];
    },

    addNodeView() {
        return (props: NodeViewRendererProps) => {
            const { node } = props;
            const dom = document.createElement(baseElement);
            dom.setAttribute(dataPageAttribute, String(true));
            dom.classList.add(PAGE_NODE_NAME);

            const paperSize = getPageNodePaperSize(node) ?? DEFAULT_PAPER_SIZE;
            const paperOrientation = getPageNodePaperOrientation(node) ?? DEFAULT_PAPER_ORIENTATION;
            const pageBorders = getPageNodePageBorders(node) ?? DEFAULT_PAGE_BORDER_CONFIG;
            const { width, height } = getPaperDimensions(paperSize, paperOrientation);

            dom.style.width = mm(width);
            dom.style.height = mm(height);

            dom.style.borderWidth = calculateShorthandPageBorders(pageBorders);
            dom.style.borderStyle = "solid";
            dom.style.borderColor = "#ccc";

            const paperColour = getPageNodePaperColour(node) ?? DEFAULT_PAPER_COLOUR;
            dom.style.background = paperColour;

            dom.style.overflow = "hidden";
            dom.style.position = "relative";

            dom.style.marginTop = px(this.options.pageGap);
            dom.style.marginLeft = "auto";
            dom.style.marginRight = "auto";

            const contentDOM = document.createElement(baseElement);
            dom.appendChild(contentDOM);

            return {
                dom,
                contentDOM,
            };
        };
    },

    addProseMirrorPlugins() {
        const paginationClipboardSerializer = constructChildOnlyClipboardSerialiser(this.editor.schema, isPageNode);

        return [
            new Plugin({
                key: new PluginKey("pageClipboardPlugin"),
                props: {
                    clipboardSerializer: paginationClipboardSerializer,
                },
            }),
        ];
    },
});

export default PageNode;
