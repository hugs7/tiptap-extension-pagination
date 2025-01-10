/**
 * @file /src/utils/pageRegion/body.ts
 * @name Body
 * @description Utility functions for body in the editor.
 */

import { Node as PMNode } from "@tiptap/pm/model";
import { BODY_DEFAULT_ATTRIBUTES, BODY_NODE_ATTR_KEYS, BODY_NODE_NAME } from "../../../constants/body";
import { Nullable } from "../../../types/record";
import { BodyNodeAttributes } from "../../../types/body";
import { MarginConfig } from "../../../types/page";

/**
 * Check if the given node is a body node.
 * @param node - The node to check.
 * @returns {boolean} True if the node is a body node, false otherwise.
 */
export const isBodyNode = (node: Nullable<PMNode>): boolean => {
    if (!node) {
        console.warn("No node provided");
        return false;
    }

    return node.type.name === BODY_NODE_NAME;
};

/**
 * Retrieves the body node attributes, filling in any missing attributes with the default values.
 * @param bodyNode - The body node to retrieve the attributes for.
 * @returns {BodyNodeAttributes} The attributes of the specified body.
 */
export const getBodyNodeAttributes = (bodyNode: PMNode): BodyNodeAttributes => {
    const { attrs } = bodyNode;
    return { ...BODY_DEFAULT_ATTRIBUTES, ...attrs };
};

/**
 * Get the page margins from a body node.
 * @param bodyNode - The body node to get the page margins from.
 * @returns {Nullable<MarginConfig>} The page margins of the specified page.
 */
export const getBodyNodeMargins = (bodyNode: PMNode): Nullable<MarginConfig> => {
    const { attrs } = bodyNode;
    return attrs[BODY_NODE_ATTR_KEYS.pageMargins];
};
