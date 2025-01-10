/**
 * @file /src/utils/page.ts
 * @name Page
 * @description Utility functions for page nodes in the editor.
 */

import { Node as PMNode, ResolvedPos } from "@tiptap/pm/model";
import { EditorState } from "@tiptap/pm/state";
import { Editor } from "@tiptap/core";
import { PAGE_NODE_NAME } from "../../constants/page";
import { NodePos, NodePosArray } from "../../types/node";
import { Nullable } from "../../types/record";
import { inRange } from "../math";
import { getStateFromContext } from "../editor";
import { getParentNodePosOfType } from "./node";
import { isPosMatchingEndOfPageCondition, isPosMatchingStartOfPageCondition } from "../pagination";

/**
 * Check if the given node is a page node.
 * @param node - The node to check.
 * @returns {boolean} True if the node is a page node, false otherwise.
 */
export const isPageNode = (node: Nullable<PMNode>): boolean => {
    if (!node) {
        console.warn("No node provided");
        return false;
    }

    return node.type.name === PAGE_NODE_NAME;
};

/**
 * Get the page number of the given node.
 * @param node - The node to get the page number for.
 * @returns {Nullable<number>} The page number of the node or null if the node is not a page node.
 */
export const getNumPagesInDoc = (doc: PMNode): number => {
    return doc.childCount;
};

/**
 * Get the last page number in the document.
 * @param doc - The current document.
 * @returns {number} The last page number in the document.
 */
export const getLastPageNum = (doc: PMNode): number => {
    return getNumPagesInDoc(doc) - 1;
};

/**
 * Check if the page number is in range for the document.
 * @param doc - The current document.
 * @param pageNum - The page number to check.
 * @returns {boolean} True if the page number is in range, false otherwise.
 */
export const isPageNumInRange = (doc: PMNode, pageNum: number): boolean => {
    const lastPageNum = getLastPageNum(doc);
    return inRange(pageNum, 0, lastPageNum);
};

/**
 * Get the page node by page number.
 * @param doc - The current document.
 * @param pageNum - The page number to find the page node for (0-indexed).
 * @returns {Nullable<PMNode>} The page node of the specified page or null
 * if the page could not be found.
 */
export const getPageNodeByPageNum = (doc: PMNode, pageNum: number): Nullable<PMNode> => {
    if (!isPageNumInRange(doc, pageNum)) {
        console.warn("Page number:", pageNum, "is out of range for the document");
        return null;
    }

    const pageNode = doc.child(pageNum);
    if (!isPageNode(pageNode)) {
        console.error("Unexpected! Doc child num:", pageNum, "is not a page node!");
        return null;
    }

    return pageNode;
};

/**
 * Check if the document has page nodes.
 * @param state - The editor state.
 * @returns {boolean} True if the document has page nodes, false otherwise.
 */
export const doesDocHavePageNodes = (state: EditorState): boolean => {
    const { schema } = state;
    const pageType = schema.nodes.page;

    let hasPageNodes = false;

    state.doc.forEach((node) => {
        if (node.type === pageType) {
            hasPageNodes = true;
            return false;
        }
    });

    return hasPageNodes;
};

/**
 * Collect page nodes and their positions in the document.
 * @param doc - The document node.
 * @returns {NodePosArray} A map of page positions to page nodes.
 */
export const collectPageNodes = (doc: PMNode): NodePosArray => {
    const pageNodes: NodePosArray = [];
    doc.forEach((node, offset) => {
        if (isPageNode(node)) {
            pageNodes.push({ node, pos: offset });
        }
    });

    return pageNodes;
};

/**
 * Get the page node and position by page number.
 * @param doc - The current document.
 * @param pageNum - The page number to find the page node for (0-indexed).
 * @returns {Nullable<NodePos>} The page node position of the specified page or null
 * if the page could not be found.
 */
export const getPageNodePosByPageNum = (doc: PMNode, pageNum: number): Nullable<NodePos> => {
    if (!isPageNumInRange(doc, pageNum)) {
        console.warn("Page number:", pageNum, "is out of range for the document");
        return null;
    }

    const pageNodes = collectPageNodes(doc);
    return pageNodes[pageNum];
};

/**
 * Get the page number of the resolved position.
 * @param doc - The document node.
 * @param $pos - The resolved position in the document.
 * @param zeroIndexed - Whether to return the page number as zero-indexed. Default is true.
 * @returns {number} The page number of the resolved position.
 */
export const getPageNumber = (doc: PMNode, $pos: ResolvedPos | number, zeroIndexed: boolean = true): number => {
    if (typeof $pos === "number") {
        return getPageNumber(doc, doc.resolve($pos));
    }

    const { pagePos } = getPageNodeAndPosition(doc, $pos);
    if (pagePos < 0) {
        console.log("Unable to find page node");
        return -1;
    }

    const pageNodes = collectPageNodes(doc);
    const pageNode = pageNodes.findIndex((node) => node.pos === pagePos);
    return pageNode + (zeroIndexed ? 0 : 1);
};

/**
 * Handles cases where the given page number is out of range.
 * Logs a warning and falls back to the last page number.
 * @param state - The current editor state.
 * @param pageNum - The page number to validate.
 * @param fallbackFn - A function to determine the fallback value based on the last page number.
 * @returns {T} The result of the fallback function.
 */
export const handleOutOfRangePageNum = <T>(
    state: EditorState,
    pageNum: number,
    fallbackFn: (state: EditorState, pageNum: number) => T
): T => {
    console.warn("Page number:", pageNum, "is out of range for the document. Using last page.");
    const lastPageNum = getLastPageNum(state.doc);
    return fallbackFn(state, lastPageNum);
};

/**
 * Retrieves a specific attribute of a given page number.
 * Falls back to defaults if the page number is invalid or the attribute is missing.
 * @param context - The current editor instance or editor state.
 * @param pageNum - The page number to retrieve the attribute for.
 * @param getDefault - A function to get the default value for the attribute.
 * @param getNodeAttribute - A function to extract the attribute from the page node.
 * @returns {T} The attribute of the specified page or default.
 */
export const getPageAttributeByPageNum = <T>(
    context: Editor | EditorState,
    pageNum: number,
    getDefault: () => T,
    getNodeAttribute: (node: PMNode) => Nullable<T>
): T => {
    const state = getStateFromContext(context);

    if (!doesDocHavePageNodes(state)) {
        return getDefault();
    }

    const { doc } = state;

    if (!isPageNumInRange(doc, pageNum)) {
        return handleOutOfRangePageNum(state, pageNum, (s, p) => getPageAttributeByPageNum(s, p, getDefault, getNodeAttribute));
    }

    const pageNode = getPageNodeByPageNum(doc, pageNum);
    if (!pageNode) {
        return getDefault();
    }

    return getNodeAttribute(pageNode) ?? getDefault();
};

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
 * @returns {pagePos: number, pageNode: Node} The position and the node of the page.
 */
export const getPageNodeAndPosition = (doc: PMNode, pos: ResolvedPos | number): { pagePos: number; pageNode: Nullable<PMNode> } => {
    if (typeof pos === "number") {
        return getPageNodeAndPosition(doc, doc.resolve(pos));
    }

    const pagePos = getThisPageNodePosition(doc, pos);
    const pageNode = doc.nodeAt(pagePos);
    if (!isPageNode(pageNode)) {
        console.warn("No page node found");
        return { pagePos: -1, pageNode };
    }

    return { pagePos, pageNode };
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

    const { pagePos } = getPageNodeAndPosition(doc, pos);

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

    const { pagePos, pageNode } = getPageNodeAndPosition(doc, pos);
    if (!pageNode) {
        return pagePos;
    }

    return pagePos + pageNode.content.size;
};

/**
 * Check if the given position is at the start of the page or the first child of the page.
 * @param doc - The document node.
 * @param $pos - The resolved position in the document or the absolute position of the node.
 * @returns {boolean} True if the condition is met, false otherwise.
 */
export const isPosAtStartOfPage = (doc: PMNode, $pos: ResolvedPos | number): boolean => {
    return isPosMatchingStartOfPageCondition(doc, $pos, true);
};

/**
 * Check if the given position is at the first paragraph child of the page.
 * @param doc - The document node.
 * @param pos - The resolved position in the document or the absolute position of the node.
 * @returns {boolean} True if the position is at the start of the page, false otherwise.
 */
export const isPosAtFirstChildOfPage = (doc: PMNode, $pos: ResolvedPos | number): boolean => {
    return isPosMatchingStartOfPageCondition(doc, $pos, false);
};

/**
 * Check if the given position is exactly at the end of the page.
 * @param doc - The document node.
 * @param pos - The resolved position in the document or the absolute position of the node.
 * @returns {boolean} True if the position is at the end of the page, false otherwise.
 */
export const isPosAtEndOfPage = (doc: PMNode, $pos: ResolvedPos | number): boolean => {
    return isPosMatchingEndOfPageCondition(doc, $pos, true);
};

/**
 * Check if the given position is at the last paragraph child of the page.
 * @param doc - The document node.
 * @param pos - The resolved position in the document or the absolute position of the node.
 * @returns {boolean} True if the position is at the end of the page, false otherwise.
 */
export const isPosAtLastChildOfPage = (doc: PMNode, $pos: ResolvedPos | number): boolean => {
    return isPosMatchingEndOfPageCondition(doc, $pos, false);
};
