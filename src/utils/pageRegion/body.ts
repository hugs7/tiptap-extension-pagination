/**
 * @file /src/utils/pageRegion/body.ts
 * @name Body
 * @description Utility functions for body in the editor.
 */

import { Node as PMNode } from "@tiptap/pm/model";
import { Nullable } from "../../types/record";
import { BODY_DEFAULT_ATTRIBUTES, BODY_NODE_NAME } from "../../constants/body";
import { DEFAULT_MARGIN_CONFIG } from "../../constants/pageMargins";
import { MarginConfig } from "../../types/page";
import { getHeaderFooterNodeAttributes, getPageRegionNode } from "./pageRegion";
import { getBodyNodeMargins } from "./margins";
import { BodyNodeAttributes } from "../../types/body";

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
 * Calculate the effective DOM margins of the body node. Takes into account
 * what the margins should be to ensure the header and footer nodes are
 * visible on the page.
 * @param pageNode - The page node containing the body node.
 * @param bodyNode - The body node to calculate the margins for.
 * @returns {MarginConfig} The effective margins of the body node.
 */
export const calculateBodyMargins = (pageNode: PMNode, bodyNode: PMNode): MarginConfig => {
    const bodyMargins = getBodyNodeMargins(bodyNode) ?? DEFAULT_MARGIN_CONFIG;

    const headerNode = getPageRegionNode(pageNode, "header");
    const footerNode = getPageRegionNode(pageNode, "footer");
    if (headerNode) {
        const { start, height } = getHeaderFooterNodeAttributes(headerNode);
        const headerTotalHeight = start + height;
        bodyMargins.top -= headerTotalHeight;
        bodyMargins.bottom -= headerTotalHeight;
    }

    if (footerNode) {
        bodyMargins.bottom = 0;
    }

    return bodyMargins;
};
