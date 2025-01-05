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
 * Get the attribute for a page section.
 * @returns {string} The attribute for the page section.
 */
export const getSectionAttribute = (type: PageSectionType): string => {
    return `data-page-section-${type}`;
};

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
