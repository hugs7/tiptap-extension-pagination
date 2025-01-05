/**
 * @file /src/Nodes/PageSection.ts
 * @name PageSection
 * @description Sits directly under the page node and encapsulates the content of a
 * section on the page. I.e. a header, footer, or main content.
 */

import { Node, NodeViewRendererProps, mergeAttributes } from "@tiptap/core";
import { DOMSerializer, Fragment } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { PAGE_SECTION_ATTRIBUTES, PAGE_SECTION_NODE_NAME } from "../constants/pageSection";
import PageSectionType from "../types/pageSection";
import { getSectionAttribute, isPageSectionNode } from "../utils/pageSection";
import { addNodeAttributes } from "../utils/node";
import { getPageNodePaperSize, getPaperDimensions } from "../utils/paperSize";
import { getPageNodePaperOrientation } from "../utils/paperOrientation";
import { getPageNodePaperMargins } from "../utils/paperMargins";
import { DEFAULT_PAPER_SIZE } from "../constants/paperSize";
import { DEFAULT_PAPER_ORIENTATION } from "../constants/paperOrientation";
import { DEFAULT_MARGIN_CONFIG } from "../constants/pageMargins";
import { mm } from "../utils/units";

const baseElement = "div" as const;

type PageSectionNodeOptions = {
    type: PageSectionType;
};

const PageSection = Node.create<PageSectionNodeOptions>({
    name: PAGE_SECTION_NODE_NAME,
    group: PAGE_SECTION_NODE_NAME,
    content: "block*",
    defining: true,
    isolating: false,

    addOptions() {
        return {
            type: "main",
        };
    },

    addAttributes() {
        return addNodeAttributes(PAGE_SECTION_ATTRIBUTES);
    },

    parseHTML() {
        const type = this.options.type;
        const sectionAttribute = getSectionAttribute(type);
        return [
            {
                tag: `${baseElement}[${sectionAttribute}]`,
                getAttrs: (node) => {
                    const parent = (node as HTMLElement).parentElement;

                    // Prevent nested page section nodes
                    if (parent && parent.hasAttribute(sectionAttribute)) {
                        return false;
                    }

                    return { type };
                },
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        const type = this.options.type;
        const sectionAttribute = getSectionAttribute(type);
        return [baseElement, mergeAttributes(HTMLAttributes, { [sectionAttribute]: true }), 0];
    },

    addNodeView() {
        return (props: NodeViewRendererProps) => {
            const { node } = props;
            const sectionType = this.options.type;
            const sectionAttribute = getSectionAttribute(sectionType);

            const dom = document.createElement(baseElement);
            dom.setAttribute(sectionAttribute, String(true));
            dom.classList.add(PAGE_SECTION_NODE_NAME);

            const paperSize = getPageNodePaperSize(node) ?? DEFAULT_PAPER_SIZE;
            const paperOrientation = getPageNodePaperOrientation(node) ?? DEFAULT_PAPER_ORIENTATION;
            const paperMargins = getPageNodePaperMargins(node) ?? DEFAULT_MARGIN_CONFIG;
            const { width: pageWidth, height: pageHeight } = getPaperDimensions(paperSize, paperOrientation);

            dom.style.width = mm(pageWidth - paperMargins.left - paperMargins.right);
            dom.style.height = mm(pageHeight - paperMargins.top - paperMargins.bottom);

            dom.style.border = "1px solid #ccc";

            dom.style.overflow = "hidden";
            dom.style.position = "relative";

            dom.style.marginTop = mm(paperMargins.top);
            dom.style.marginLeft = mm(paperMargins.left);
            dom.style.marginRight = mm(paperMargins.right);
            dom.style.marginBottom = mm(paperMargins.bottom);

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

export default PageSection;
