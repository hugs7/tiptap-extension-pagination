/**
 * @file /src/utils/nodes/page/pagePosition.ts
 * @name PagePosition
 * @description Utility functions for page position nodes.
 */

import { Node as PMNode, ResolvedPos } from "@tiptap/pm/model";
import { PAGE_NODE_NAME } from "../../../constants/page";
import { getParentNodePosOfType } from "../node";
import { isPageNode } from "./page";
import { NullableNodePos } from "../../../types/node";

/**
 * Get the page node (parent of the current node) position.
 * @param doc - The document node.
 * @param pos - The resolved position in the document or the absolute position of the node.
 * @returns {number} The position of the page node.
 */
export const getThisPageNodePosition = (doc: PMNode, pos: ResolvedPos | number): number => {
    return getParentNodePosOfType(doc, pos, PAGE_NODE_NAME).pos;
};

/**
 * Get the page node position and the page node itself.
 * @param doc - The document node.
 * @param pos - The resolved position in the document or the absolute position of the node.
 * @returns {NullableNodePos} The position and the node of the page.
 */
export const getPageNodeAndPosition = (doc: PMNode, pos: ResolvedPos | number): NullableNodePos => {
    if (typeof pos === "number") {
        return getPageNodeAndPosition(doc, doc.resolve(pos));
    }

    const pagePos = getThisPageNodePosition(doc, pos);
    const pageNode = doc.nodeAt(pagePos);
    if (!isPageNode(pageNode)) {
        console.warn("No page node found");
        return { pos: -1, node: pageNode };
    }

    return { pos: pagePos, node: pageNode };
};

/**
 * Get the start of the page position.
 * @param doc - The document node.
 * @param pos - The resolved position in the document or the absolute position of the node.
 * @returns {number} The start position of the page.
 */
export const getStartOfPagePosition = (doc: PMNode, pos: ResolvedPos | number): number => {
    if (typeof pos === "number") {
        return getStartOfPagePosition(doc, doc.resolve(pos));
    }

    const { pos: pagePos } = getPageNodeAndPosition(doc, pos);

    return pagePos;
};

/**
 * Get the end of the page position.
 * @param doc - The document node.
 * @param pos - The resolved position in the document or the absolute position of the node.
 * @returns {number} The end position of the page.
 */
export const getEndOfPagePosition = (doc: PMNode, pos: ResolvedPos | number): number => {
    if (typeof pos === "number") {
        return getEndOfPagePosition(doc, doc.resolve(pos));
    }

    const { pos: pagePos, node: pageNode } = getPageNodeAndPosition(doc, pos);
    if (!pageNode) {
        return pagePos;
    }

    return pagePos + pageNode.content.size;
};
