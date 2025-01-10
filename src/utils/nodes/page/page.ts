/**
 * @file /src/utils/page.ts
 * @name Page
 * @description Utility functions for page nodes in the editor.
 */

import { Node as PMNode, ResolvedPos } from "@tiptap/pm/model";
import { EditorState } from "@tiptap/pm/state";
import { PAGE_NODE_NAME } from "../../../constants/page";
import { NodePosArray } from "../../../types/node";
import { Nullable } from "../../../types/record";
import { isPosMatchingEndOfPageCondition, isPosMatchingStartOfPageCondition } from "../../pagination";

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
