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
import { getPageSectionType, isPageSectionNode } from "../utils/pageSection/pageSection";
import { addNodeAttributes } from "../utils/node";
import { calculateShorthandPageSectionMargins } from "../utils/pageSection/margins";
import { mm } from "../utils/units";
import { getPageNodeAndPosition } from "../utils/pagination";
import { calculatePageSectionDimensions } from "../utils/pageSection/dimensions";
import { calculateCumulativePageSectionMargins } from "../utils/pageSection/cumulativeMargins";

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
