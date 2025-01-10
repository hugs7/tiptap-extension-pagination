/**
 * @file /src/utils/paragraph.ts
 * @name Paragraph
 * @description Utility functions for paragraphs.
 */

import { Node as PMNode, ResolvedPos } from "@tiptap/pm/model";
import { Nullable } from "../types/record";
import { getParentNodePosOfType, isNodeEmpty } from "./node";
import { isPosAtEndOfDocument, isPosAtStartOfDocument } from "./pagination";
import { inRange } from "./math";

/**
 * Check if the given node is a paragraph node.
 * @param node - The node to check.
 * @returns {boolean} True if the node is a paragraph node, false otherwise.
 */
export const isParagraphNode = (node: Nullable<PMNode>): boolean => {
    if (!node) {
        console.warn("No node provided");
        return false;
    }

    return node.type.name === "paragraph";
};

/**
 * Get the previous paragraph node.
 * @param doc - The document node.
 * @param pos - The position in the document.
 * @returns {PMNode} The previous paragraph node.
 */
export const getPreviousParagraph = (doc: PMNode, pos: number): { prevParagraphPos: number; prevParagraphNode: Nullable<PMNode> } => {
    let prevParagraphPos = pos;
    let prevParagraphNode = null;
    while (prevParagraphNode === null && prevParagraphPos > 0) {
        prevParagraphPos -= 1;
        const node = doc.nodeAt(prevParagraphPos);
        if (!node) {
            continue;
        }

        if (isParagraphNode(node)) {
            prevParagraphNode = node;
            prevParagraphPos = prevParagraphPos;
        }
    }

    if (!prevParagraphNode) {
        prevParagraphPos = -1;
    }

    return { prevParagraphPos, prevParagraphNode };
};

/**
 * Get the next paragraph node.
 * @param doc - The document node.
 * @param pos - The position in the document.
 * @returns {PMNode} The next paragraph node.
 */
export const getNextParagraph = (doc: PMNode, pos: number): { nextParagraphPos: number; nextParagraphNode: Nullable<PMNode> } => {
    const documentLength = doc.content.size;
    let nextParagraphPos = pos;
    let nextParagraphNode = null;
    while (nextParagraphNode === null && nextParagraphPos < documentLength) {
        nextParagraphPos += 1;
        const node = doc.nodeAt(nextParagraphPos);
        if (!node) {
            continue;
        }

        if (isParagraphNode(node)) {
            nextParagraphNode = node;
            nextParagraphPos = nextParagraphPos;
        }
    }

    if (!nextParagraphNode) {
        nextParagraphPos = -1;
    }

    return { nextParagraphPos, nextParagraphNode };
};

/**
 * Determine if the resolved position is at the start of a paragraph node.
 * @param doc - The document node.
 * @param $pos - The resolved position in the document.
 * @returns {boolean} True if the position is at the start of a paragraph node, false otherwise.
 */
export const isAtStartOfParagraph = (doc: PMNode, $pos: ResolvedPos | number): boolean => {
    if (typeof $pos === "number") {
        return isAtStartOfParagraph(doc, doc.resolve($pos));
    }

    const { paragraphPos, paragraphNode } = getParagraphNodeAndPosition(doc, $pos);
    if (!paragraphNode) {
        return false;
    }

    // We allow for the cursor to be at the start of the paragraph node or the start of the first text child node.
    return inRange($pos.pos, paragraphPos, paragraphPos + 1);
};

/**
 * Determine if the resolved position is at the end of a paragraph node.
 * @param doc - The document node.
 * @param $pos - The resolved position in the document.
 * @returns {boolean} True if the position is at the end of a paragraph node, false otherwise.
 */
export const isAtEndOfParagraph = (doc: PMNode, $pos: ResolvedPos | number): boolean => {
    if (typeof $pos === "number") {
        return isAtEndOfParagraph(doc, doc.resolve($pos));
    }

    const { paragraphPos, paragraphNode } = getParagraphNodeAndPosition(doc, $pos);
    if (!paragraphNode) {
        return false;
    }

    return $pos.pos + 1 === paragraphPos + paragraphNode.nodeSize;
};

/**
 * Determine if the resolved position is at the start or end of a paragraph node.
 * @param doc - The document node.
 * @param $pos - The resolved position in the document.
 * @returns {boolean} True if the position is at the start or end of a paragraph node, false otherwise.
 */
export const isAtStartOrEndOfParagraph = (doc: PMNode, $pos: ResolvedPos | number): boolean => {
    return isAtStartOfParagraph(doc, $pos) || isAtEndOfParagraph(doc, $pos);
};

/**
 * Determine if the previous paragraph is empty.
 * @param doc - The document node.
 * @param $pos - The resolved position in the document or the absolute position of the node.
 * @returns {boolean} True if the previous paragraph is empty or does not exist, false otherwise.
 */
export const isPreviousParagraphEmpty = (doc: PMNode, $pos: ResolvedPos | number): boolean => {
    if (typeof $pos === "number") {
        return isPreviousParagraphEmpty(doc, doc.resolve($pos));
    }

    const { prevParagraphNode } = getPreviousParagraph(doc, $pos.pos);
    if (!prevParagraphNode) {
        return false;
    }

    return isNodeEmpty(prevParagraphNode);
};

/**
 * Determine if the next paragraph is empty.
 * @param doc - The document node.
 * @param $pos - The resolved position in the document or the absolute position of the node.
 * @returns {boolean} True if the next paragraph is empty or does not exist, false otherwise.
 */
export const isNextParagraphEmpty = (doc: PMNode, $pos: ResolvedPos | number): boolean => {
    if (typeof $pos === "number") {
        return isNextParagraphEmpty(doc, doc.resolve($pos));
    }

    const { nextParagraphNode } = getNextParagraph(doc, $pos.pos);
    if (!nextParagraphNode) {
        return false;
    }

    return isNodeEmpty(nextParagraphNode);
};

/**
 * Get the paragraph node position.
 * @param doc - The document node.
 * @param pos - The resolved position in the document or the absolute position of the node.
 * @returns {number} The position of the paragraph node.
 */
export const getThisParagraphNodePosition = (doc: PMNode, pos: ResolvedPos | number): number => {
    return getParentNodePosOfType(doc, pos, "paragraph").pos;
};

/**
 * Get the paragraph node position and the paragraph node itself.
 * @param doc - The document node.
 * @param pos - The resolved position in the document or the absolute position of the node.
 * @returns {paragraphPos: number, paragraphNode: Node} The position and the node of the paragraph.
 */
export const getParagraphNodeAndPosition = (
    doc: PMNode,
    pos: ResolvedPos | number
): { paragraphPos: number; paragraphNode: Nullable<PMNode> } => {
    if (typeof pos === "number") {
        return getParagraphNodeAndPosition(doc, doc.resolve(pos));
    }

    if (isPosAtStartOfDocument(doc, pos, false)) {
        // Find the next paragraph node
        const { nextParagraphPos, nextParagraphNode } = getNextParagraph(doc, pos.pos);
        return { paragraphPos: nextParagraphPos, paragraphNode: nextParagraphNode };
    } else if (isPosAtEndOfDocument(doc, pos)) {
        // Find the previous paragraph node
        const { prevParagraphPos, prevParagraphNode } = getPreviousParagraph(doc, pos.pos);
        return { paragraphPos: prevParagraphPos, paragraphNode: prevParagraphNode };
    }

    const paragraphPos = getThisParagraphNodePosition(doc, pos);
    const paragraphNode = doc.nodeAt(paragraphPos);
    if (!isParagraphNode(paragraphNode)) {
        console.warn("No paragraph node found");
        return { paragraphPos: -1, paragraphNode };
    }

    return { paragraphPos, paragraphNode };
};
