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
import { getParagraphNodeAndPosition } from "./nodes/paragraph";

/**
 * Get the start of the paragraph position.
 * @param doc - The document node.
 * @param pos - The resolved position in the document or the absolute position of the node.
 * @returns {number} The start position of the paragraph.
 */
export const getStartOfParagraphPosition = (doc: PMNode, pos: ResolvedPos | number): number => {
    if (typeof pos === "number") {
        return getStartOfParagraphPosition(doc, doc.resolve(pos));
    }

    const { paragraphPos } = getParagraphNodeAndPosition(doc, pos);
    return paragraphPos;
};

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
 * Get the end of the paragraph position.
 * @param doc - The document node.
 * @param pos - The resolved position in the document or the absolute position of the node.
 * @returns {number} The end position of the paragraph.
 */
export const getEndOfParagraphPosition = (doc: PMNode, $pos: ResolvedPos | number): number => {
    if (typeof $pos === "number") {
        return getEndOfParagraphPosition(doc, doc.resolve($pos));
    }

    const { paragraphPos, paragraphNode } = getParagraphNodeAndPosition(doc, $pos);
    if (!paragraphNode) {
        return paragraphPos;
    }

    return paragraphPos + paragraphNode.content.size;
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
