/**
 * @file /src/utils/pagination.ts
 * @name Pagination
 * @description Utility functions for paginating the editor content.
 */

import { Node as PMNode, ResolvedPos, Schema } from "@tiptap/pm/model";
import { PAGE_NODE_NAME } from "../constants/page";
import { BODY_NODE_NAME } from "../constants/body";
import { HEADER_FOOTER_NODE_NAME } from "../constants/pageRegions";
import { PaginationNodeTypes } from "../types/pagination";
import { getEndOfPagePosition, getStartOfPagePosition } from "./nodes/page";
import { getEndOfParagraphPosition, getStartOfParagraphPosition, isPositionWithinParagraph } from "./nodes/paragraph";
import { isPosAtEndOfDocument, isPosAtStartOfDocument } from "./nodes/document";

/**
 * Get the start of the page and paragraph positions.
 * @param doc - The document node.
 * @param pos - The resolved position in the document or the absolute position of the node.
 * @returns {startOfPagePos: number, startOfParagraphPos: number} The start positions of the page and paragraph.
 */
export const getStartOfPageAndParagraphPosition = (
    doc: PMNode,
    pos: ResolvedPos | number
): { startOfPagePos: number; startOfParagraphPos: number } => {
    const startOfParagraphPos = getStartOfParagraphPosition(doc, pos);
    const startOfPagePos = getStartOfPagePosition(doc, pos);

    return { startOfPagePos, startOfParagraphPos };
};

/**
 * Get the end of the page and paragraph positions.
 * @param doc - The document node.
 * @param pos - The resolved position in the document or the absolute position of the node.
 * @returns {endOfPagePos: number, endOfParagraphPos: number} The end positions of the page and paragraph.
 */
export const getEndOfPageAndParagraphPosition = (
    doc: PMNode,
    $pos: ResolvedPos | number
): { endOfPagePos: number; endOfParagraphPos: number } => {
    const endOfParagraphPos = getEndOfParagraphPosition(doc, $pos);
    const endOfPagePos = getEndOfPagePosition(doc, $pos);

    return { endOfPagePos, endOfParagraphPos };
};

/**
 * Collect the node types for pagination.
 * @param schema - The schema of the editor.
 * @returns {PaginationNodeTypes} The node types for pagination.
 * @throws {Error} Throws an error if the page, body, or header/footer node types are not found in the schema.
 */
export const getPaginationNodeTypes = (schema: Schema): PaginationNodeTypes => {
    const { nodes } = schema;

    const pageNodeType = nodes[PAGE_NODE_NAME];
    const headerFooterNodeType = nodes[HEADER_FOOTER_NODE_NAME];
    const bodyNodeType = nodes[BODY_NODE_NAME];

    if (!pageNodeType || !headerFooterNodeType || !bodyNodeType) {
        throw new Error("Page, body, or header/footer node type not found in schema");
    }

    return { pageNodeType, headerFooterNodeType, bodyNodeType };
};

/**
 * Check if the given position is at the end of the page or the last child of the page.
 * @param doc - The document node.
 * @param $pos - The resolved position in the document or the absolute position of the node.
 * @param checkExactEnd - Whether to check for the exact end of the page (true) or the last child of the page (false).
 * @returns {boolean} True if the condition is met, false otherwise.
 */
export const isPosMatchingEndOfPageCondition = (doc: PMNode, $pos: ResolvedPos | number, checkExactEnd: boolean): boolean => {
    // Resolve position if given as a number
    if (typeof $pos === "number") {
        return isPosMatchingEndOfPageCondition(doc, doc.resolve($pos), checkExactEnd);
    }

    // Check if we are at the end of the document
    if (isPosAtEndOfDocument(doc, $pos)) {
        return true;
    }

    // Ensure that the position is within a valid block (paragraph)
    if (!isPositionWithinParagraph($pos)) {
        return false;
    }

    // Get positions for paragraph and page
    const { endOfParagraphPos, endOfPagePos } = getEndOfPageAndParagraphPosition(doc, $pos);
    if (endOfParagraphPos < 0) {
        console.warn("Invalid end of paragraph position");
        return false;
    }

    if (endOfPagePos < 0) {
        console.warn("Invalid end of page position");
        return false;
    }

    // Determine the condition to check
    if (checkExactEnd) {
        // Check if position is exactly at the end of the page
        if ($pos.pos === endOfPagePos) {
            console.log("At the end of the page");
            return true;
        }
        console.log("Not at the end of the page");
        return false;
    } else {
        // Check if position is at the last child of the page
        if (endOfParagraphPos + 1 === endOfPagePos) {
            console.log("In the last child of the page");
            return true;
        }
        console.log("Not in the last child of the page");
        return false;
    }
};

/**
 * Check if the given position is at the start of the document.
 * @param doc - The document node.
 * @param pos - The resolved position in the document or the absolute position of the node.
 * @param allowTextBlock - Whether to allow text blocks at the start of the document. Default is false.
 * @returns {boolean} True if the position is at the start of the document, false otherwise.
 */
export const isPosMatchingStartOfPageCondition = (doc: PMNode, $pos: ResolvedPos | number, checkExactStart: boolean): boolean => {
    // Resolve position if given as a number
    if (typeof $pos === "number") {
        return isPosMatchingStartOfPageCondition(doc, doc.resolve($pos), checkExactStart);
    }

    // Check if we are at the start of the document
    if (isPosAtStartOfDocument(doc, $pos, false)) {
        return true;
    }

    // Ensure that the position is within a valid block (paragraph)
    if (!isPositionWithinParagraph($pos)) {
        return false;
    }

    // Get positions for paragraph and page
    const { startOfPagePos, startOfParagraphPos } = getStartOfPageAndParagraphPosition(doc, $pos);
    if (startOfPagePos < 0) {
        console.warn("Invalid page position");
        return false;
    }

    if (startOfParagraphPos < 0) {
        console.warn("Invalid paragraph position");
        return false;
    }

    // Determine the condition to check
    const isFirstParagraph = startOfPagePos + 1 === startOfParagraphPos;
    if (checkExactStart) {
        // Check if position is exactly at the start of the page
        // First position of page will always be 1 more than the paragraph position
        const isPosAtStartOfParagraph = $pos.pos - 1 === startOfParagraphPos;
        if (isFirstParagraph && isPosAtStartOfParagraph) {
            console.log("At the start of the page");
            return true;
        }
        console.log("Not at the start of the page");
        return false;
    } else {
        // Check if position is at the first child of the page
        if (isFirstParagraph) {
            console.log("In the first child of the page");
            return true;
        }
        console.log("Not in the first child of the page");
        return false;
    }
};
