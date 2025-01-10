/**
 * @file /src/utils/nodes/body/bodyCondition.ts
 * @name BodyCondition
 * @description Utility functions for body conditions.
 */

import { Node as PMNode, ResolvedPos } from "@tiptap/pm/model";
import { isPosAtEndOfDocument, isPosAtStartOfDocument } from "../document";
import { isPositionWithinParagraph } from "../paragraph";
import { getStartOfBodyAndParagraphPosition, getEndOfBodyAndParagraphPosition } from "../../pagination";

/**
 * Check if the given position is at the start of the body or the first child of the body.
 * @param doc - The document node.
 * @param $pos - The resolved position in the document or the absolute position of the node.
 * @returns {boolean} True if the condition is met, false otherwise.
 */
export const isPosAtStartOfBody = (doc: PMNode, $pos: ResolvedPos | number): boolean => {
    return isPosMatchingStartOfBodyCondition(doc, $pos, true);
};

/**
 * Check if the given position is at the first paragraph child of the body.
 * @param doc - The document node.
 * @param pos - The resolved position in the document or the absolute position of the node.
 * @returns {boolean} True if the position is at the start of the body, false otherwise.
 */
export const isPosAtFirstChildOfBody = (doc: PMNode, $pos: ResolvedPos | number): boolean => {
    return isPosMatchingStartOfBodyCondition(doc, $pos, false);
};

/**
 * Check if the given position is exactly at the end of the body.
 * @param doc - The document node.
 * @param pos - The resolved position in the document or the absolute position of the node.
 * @returns {boolean} True if the position is at the end of the body, false otherwise.
 */
export const isPosAtEndOfBody = (doc: PMNode, $pos: ResolvedPos | number): boolean => {
    return isPosMatchingEndOfBodyCondition(doc, $pos, true);
};

/**
 * Check if the given position is at the last paragraph child of the body.
 * @param doc - The document node.
 * @param pos - The resolved position in the document or the absolute position of the node.
 * @returns {boolean} True if the position is at the end of the body, false otherwise.
 */
export const isPosAtLastChildOfBody = (doc: PMNode, $pos: ResolvedPos | number): boolean => {
    return isPosMatchingEndOfBodyCondition(doc, $pos, false);
};

/**
 * Check if the given position is at the start of the document.
 * @param doc - The document node.
 * @param pos - The resolved position in the document or the absolute position of the node.
 * @param allowTextBlock - Whether to allow text blocks at the start of the document. Default is false.
 * @returns {boolean} True if the position is at the start of the document, false otherwise.
 */
export const isPosMatchingStartOfBodyCondition = (doc: PMNode, $pos: ResolvedPos | number, checkExactStart: boolean): boolean => {
    // Resolve position if given as a number
    if (typeof $pos === "number") {
        return isPosMatchingStartOfBodyCondition(doc, doc.resolve($pos), checkExactStart);
    }

    // Check if we are at the start of the document
    if (isPosAtStartOfDocument(doc, $pos, false)) {
        return true;
    }

    // Ensure that the position is within a valid block (paragraph)
    if (!isPositionWithinParagraph($pos)) {
        return false;
    }

    // Get positions for paragraph and body
    const { startOfBodyPos, startOfParagraphPos } = getStartOfBodyAndParagraphPosition(doc, $pos);
    if (startOfBodyPos < 0) {
        console.warn("Invalid body position");
        return false;
    }

    if (startOfParagraphPos < 0) {
        console.warn("Invalid paragraph position");
        return false;
    }

    // Determine the condition to check
    // First position of paragraph will always be 1 more than the body position
    const isFirstParagraph = startOfBodyPos + 1 === startOfParagraphPos;
    if (checkExactStart) {
        // Check if position is exactly at the start of the body
        // First position of text will always be 1 more than the first paragraph position
        const isPosAtStartOfParagraph = startOfParagraphPos + 1 === $pos.pos;
        if (isFirstParagraph && isPosAtStartOfParagraph) {
            console.log("At the start of the body");
            return true;
        }
        console.log("Not at the start of the body");
        return false;
    } else {
        // Check if position is at the first child of the body
        if (isFirstParagraph) {
            console.log("In the first child of the body");
            return true;
        }
        console.log("Not in the first child of the body");
        return false;
    }
};

/**
 * Check if the given position is at the end of the body or the last child of the body.
 * @param doc - The document node.
 * @param $pos - The resolved position in the document or the absolute position of the node.
 * @param checkExactEnd - Whether to check for the exact end of the body (true) or the last child of the body (false).
 * @returns {boolean} True if the condition is met, false otherwise.
 */
export const isPosMatchingEndOfBodyCondition = (doc: PMNode, $pos: ResolvedPos | number, checkExactEnd: boolean): boolean => {
    // Resolve position if given as a number
    if (typeof $pos === "number") {
        return isPosMatchingEndOfBodyCondition(doc, doc.resolve($pos), checkExactEnd);
    }

    // Check if we are at the end of the document
    if (isPosAtEndOfDocument(doc, $pos)) {
        return true;
    }

    // Ensure that the position is within a valid block (paragraph)
    if (!isPositionWithinParagraph($pos)) {
        return false;
    }

    // Get positions for paragraph and body
    const { endOfParagraphPos, endOfBodyPos } = getEndOfBodyAndParagraphPosition(doc, $pos);
    if (endOfParagraphPos < 0) {
        console.warn("Invalid end of paragraph position");
        return false;
    }

    if (endOfBodyPos < 0) {
        console.warn("Invalid end of body position");
        return false;
    }

    // Determine the condition to check
    // Last position of paragraph will always be 1 less than the end of the last body position
    const isLastParagraph = endOfParagraphPos + 1 === endOfBodyPos;
    if (checkExactEnd) {
        // Check if position is exactly at the end of the body
        // Last position of text will always be 1 less than the end of the last paragraph position
        const isPosAtEndOfParagraph = endOfParagraphPos + 1 === $pos.pos;
        if (isLastParagraph && isPosAtEndOfParagraph) {
            console.log("At the end of the body body");
            return true;
        }
        console.log("Not at the end of the body body");
        return false;
    } else {
        // Check if position is at the last child of the body
        if (isLastParagraph) {
            console.log("In the last child of the page body");
            return true;
        }
        console.log("Not in the last child of the page body");
        return false;
    }
};
