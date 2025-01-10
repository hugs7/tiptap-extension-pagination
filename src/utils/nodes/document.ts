/**
 * @file /src/utils/nodes/document.ts
 * @name Document
 * @description Utility functions for the document node.
 */

import { Node as PMNode, ResolvedPos } from "@tiptap/pm/model";

/**
 * Check if the given position is at the start of the document.
 * @param doc - The document node.
 * @param $pos - The resolved position in the document or the absolute position of the node.
 * @returns {boolean} True if the position is at the start of the document, false otherwise.
 */
export const isPosAtStartOfDocument = (doc: PMNode, $pos: ResolvedPos | number, allowTextBlock: boolean): boolean => {
    if (typeof $pos === "number") {
        return isPosAtStartOfDocument(doc, doc.resolve($pos), allowTextBlock);
    }

    const maxPos = allowTextBlock ? 2 : 1;

    return $pos.pos <= maxPos;
};

/**
 * Check if the given position is at the end of the document.
 * @param doc - The document node.
 * @param $pos - The resolved position in the document or the absolute position of the node.
 * @returns {boolean} True if the position is at the end of the document, false otherwise.
 */
export const isPosAtEndOfDocument = (doc: PMNode, $pos: ResolvedPos | number): boolean => {
    if (typeof $pos === "number") {
        return isPosAtEndOfDocument(doc, doc.resolve($pos));
    }

    return $pos.pos >= doc.nodeSize - 2;
};
