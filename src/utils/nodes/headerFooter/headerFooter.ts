/**
 * @file /src/utils/nodes/pageRegion/headerFooter.ts
 * @name HeaderFooter
 * @description Utility functions for header and footer nodes.
 */

import { Node as PMNode } from "@tiptap/pm/model";
import { HeaderFooter } from "../../../types/pageRegions";
import { Nullable } from "../../../types/record";
import { HEADER_FOOTER_NODE_ATTR_KEYS, HEADER_FOOTER_NODE_NAME } from "../../../constants/pageRegions";

/**
 * Determines if the given node is a header node.
 * @param node - The node to check.
 * @returns {boolean} True if the node is a header node, false otherwise.
 */
export const isHeaderFooterNode = (node: PMNode): boolean => {
    return node.type.name === HEADER_FOOTER_NODE_NAME;
};

/**
 * Get the type of the header or footer node.
 * @param headerFooterNode - The header or footer node to retrieve the type for.
 * @returns {Nullable<HeaderFooter>} The type of the specified header or footer node or null if not found.
 */
export const getHeaderFooterNodeType = (headerFooterNode: PMNode): Nullable<HeaderFooter> => {
    const { attrs } = headerFooterNode;
    return attrs[HEADER_FOOTER_NODE_ATTR_KEYS.type];
};
