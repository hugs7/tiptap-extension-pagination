/**
 * @file /src/utils/nodes/page/pagePosition.ts
 * @name PagePosition
 * @description Utility functions for page position nodes.
 */

import { Node as PMNode, ResolvedPos } from "@tiptap/pm/model";
import { PAGE_NODE_NAME } from "../../../constants/page";
import { getParentNodePosOfType } from "../node";
import { isPageNode } from "./page";
import { DirectChild, NullableNodePos } from "../../../types/node";
import { isPageNumInRange } from "./pageRange";

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
 * Get the child of the page node at the specified position.
 * @param doc - The document node.
 * @param pos - The resolved position in the document or the absolute position of the node.
 * @returns {DirectChild} The child of the page node at the specified position.
 */
export const getPageChild = (doc: PMNode, pos: ResolvedPos | number): DirectChild => {
    if (typeof pos !== "number") {
        return getPageChild(doc, pos.pos);
    }

    return doc.childAfter(pos);
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

/**
 * Gets the page node of the page before the page at the specified position.
 * @param doc - The document node.
 * @param pos - Any position in the current page.
 * @returns {NullableNodePos} The page node of the page before the current page.
 */
export const getPageBeforePos = (doc: PMNode, pos: ResolvedPos | number): NullableNodePos => {
    const thisPageChild = getPageChild(doc, pos);
    const thisPageNode = thisPageChild.node;
    if (!thisPageNode || !isPageNode(thisPageNode)) {
        console.warn("No page node found");
        return { node: null, pos: -1 };
    }

    const pageNum = thisPageChild.index;
    const prevPageNum = pageNum - 1;
    if (!isPageNumInRange(doc, prevPageNum)) {
        return { node: null, pos: -1 };
    }

    const prevPagePos = thisPageChild.offset - 1;
    return getPageNodeAndPosition(doc, prevPagePos);
};

/**
 * Gets the page node of the page after the page at the specified position.
 * @param doc - The document node.
 * @param pos - Any position in the current page.
 * @returns {NullableNodePos} The page node of the page after the current page.
 */
export const getPageAfterPos = (doc: PMNode, pos: ResolvedPos | number): NullableNodePos => {
    const thisPageChild = getPageChild(doc, pos);
    const thisPageNode = thisPageChild.node;
    if (!thisPageNode || !isPageNode(thisPageNode)) {
        console.warn("No page node found");
        return { node: null, pos: -1 };
    }

    const pageNum = thisPageChild.index;
    const nextPageNum = pageNum + 1;
    if (!isPageNumInRange(doc, nextPageNum)) {
        return { node: null, pos: -1 };
    }

    const nextPagePos = thisPageChild.offset + thisPageNode.nodeSize;
    return getPageNodeAndPosition(doc, nextPagePos);
};
