/**
 * @file /src/utils/nodes/text.ts
 * @name Text
 * @description Utility functions for text nodes.
 */

import { Node as PMNode } from "@tiptap/pm/model";
import { Nullable } from "../../types/record";

/**
 * Check if the given node is a text node.
 * @param node - The node to check.
 * @returns {boolean} True if the node is a text node, false otherwise.
 */
export const isTextNode = (node: Nullable<PMNode>): boolean => {
    if (!node) {
        console.warn("No node provided");
        return false;
    }

    return node.type.name === "text";
};
