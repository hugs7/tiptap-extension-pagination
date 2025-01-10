/**
 * @file /src/utils/nodes/page/pageRange.ts
 * @name PageRange
 * @description Utility functions for page ranges.
 */

import { Node as PMNode } from "@tiptap/pm/model";
import { inRange } from "../../math";
import { EditorState } from "@tiptap/pm/state";

/**
 * Get the page number of the given node.
 * @param node - The node to get the page number for.
 * @returns {Nullable<number>} The page number of the node or null if the node is not a page node.
 */
const getNumPagesInDoc = (doc: PMNode): number => {
    return doc.childCount;
};

/**
 * Get the last page number in the document (0-indexed).
 * @param doc - The current document.
 * @returns {number} The last page number in the document (0-indexed).
 */
const getLastPageNum = (doc: PMNode): number => {
    return getNumPagesInDoc(doc) - 1;
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
 * Check if the page number is in range for the document.
 * @param doc - The current document.
 * @param pageNum - The page number to check (0-indexed).
 * @returns {boolean} True if the page number is in range, false otherwise.
 */
export const isPageNumInRange = (doc: PMNode, pageNum: number): boolean => {
    const lastPageNum = getLastPageNum(doc);
    return inRange(pageNum, 0, lastPageNum);
};
