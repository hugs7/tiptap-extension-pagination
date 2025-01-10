/**
 * @file /src/utils/nodes/page/pageNumber.ts
 * @name PageNumber
 * @description Utility functions for page numbers
 */

import { Node as PMNode, ResolvedPos } from "@tiptap/pm/model";
import { EditorState } from "@tiptap/pm/state";
import { Editor } from "@tiptap/core";
import { NodePos } from "../../../types/node";
import { Nullable } from "../../../types/record";
import { getStateFromContext } from "../../editor";
import { collectPageNodes, doesDocHavePageNodes, isPageNode } from "./page";
import { getPageNodeAndPosition } from "./pagePosition";
import { inRange } from "../../math";

/**
 * Get the page number of the given node.
 * @param node - The node to get the page number for.
 * @returns {Nullable<number>} The page number of the node or null if the node is not a page node.
 */
export const getNumPagesInDoc = (doc: PMNode): number => {
    return doc.childCount;
};

/**
 * Get the last page number in the document (0-indexed).
 * @param doc - The current document.
 * @returns {number} The last page number in the document (0-indexed).
 */
export const getLastPageNum = (doc: PMNode): number => {
    return getNumPagesInDoc(doc) - 1;
};

/**
 * Check if the page number is in range for the document.
 * @param doc - The current document.
 * @param pageNum - The page number to check (0-indexed).
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
