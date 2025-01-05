/**
 * @file /src/utils/pageSection.ts
 * @name PageSection
 * @description Utility functions for page sections in the editor.
 */

import { Node as PMNode } from "@tiptap/pm/model";
import PageSectionType from "../types/pageSection";
import { Nullable } from "../types/record";
import { PAGE_SECTION_NODE_NAME } from "../constants/pageSection";

/**
 * Check if the given node is a page section node.
 * @param node - The node to check.
 * @returns {boolean} True if the node is a page section node, false otherwise.
 */
export const isPageSectionNode = (node: Nullable<PMNode>): boolean => {
    if (!node) {
        console.warn("No node provided");
        return false;
    }

    return node.type.name === PAGE_SECTION_NODE_NAME;
};

/**
 * Get the type of the page section node.
 * @param node - The page section node.
 * @returns {Nullable<PageSectionType>} The type of the page section node or null if the node is not a page section node.
 */
export const getPageSectionType = (node: PMNode): Nullable<PageSectionType> => {
    const { attrs } = node;
    return attrs.type;
};
