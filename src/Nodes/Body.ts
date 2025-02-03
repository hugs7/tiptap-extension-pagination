/**
 * @file /src/Nodes/Body.ts
 * @name Body
 * @description The Body node situated within a page.
 */

import { Node, mergeAttributes } from "@tiptap/core";
import { BODY_ATTRIBUTES, BODY_NODE_NAME } from "../constants/body";
import { isBodyNode } from "../utils/nodes/body/body";
import { parseHTMLNode } from "../utils/nodes/node";
import { constructChildOnlyClipboardPlugin } from "../utils/clipboard";
import { addNodeAttributes } from "../utils/attributes/addAttributes";
import { ReactBodyNode } from "./ReactBodyNode";
import { ReactNodeViewRenderer } from "@tiptap/react";

const baseElement = "div" as const;
const bodyAttribute = "data-page-body" as const;

export const BodyNode = Node.create({
    name: BODY_NODE_NAME,
    group: "block",
    content: "block+",
    defining: true,
    isolating: false,

    addAttributes() {
        return addNodeAttributes(BODY_ATTRIBUTES);
    },

    parseHTML() {
        return [parseHTMLNode(baseElement, bodyAttribute, true)];
    },

    renderHTML({ HTMLAttributes }) {
        return [baseElement, mergeAttributes(HTMLAttributes, { [bodyAttribute]: true, class: BODY_NODE_NAME }), 0];
    },

    addNodeView() {
        return ReactNodeViewRenderer(ReactBodyNode);
    },

    addProseMirrorPlugins() {
        return [constructChildOnlyClipboardPlugin("bodyChildOnlyClipboardPlugin", this.editor.schema, isBodyNode)];
    },
});
