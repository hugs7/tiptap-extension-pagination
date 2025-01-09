/**
 * @file /src/utils/margins/bodyMargins.ts
 * @name BodyMargins
 * @description Utility functions for body margins.
 */

import { Node as PMNode } from "@tiptap/pm/model";
import { MarginConfig } from "../../types/page";
import { DEFAULT_PAGE_MARGIN_CONFIG } from "../../constants/pageMargins";
import { getPageNodePageMargins } from "./pageMargins";
import { getHeaderNodeAttributes } from "./headerFooter";
import { getPageRegionNode } from "../nodes/pageRegion/getAttributes";

/**
 * Calculate the effective DOM margins of the body node. Takes into account
 * what the margins should be to ensure the header and footer nodes are
 * visible on the page.
 * @param pageNode - The page node containing the body node.
 * @returns {MarginConfig} The effective margins of the body node.
 */
export const calculateBodyMargins = (pageNode: PMNode): MarginConfig => {
    // Copy the default margin config to avoid modifying the original.
    const { ...bodyMargins } = getPageNodePageMargins(pageNode) ?? DEFAULT_PAGE_MARGIN_CONFIG;

    const headerNode = getPageRegionNode(pageNode, "header");
    const footerNode = getPageRegionNode(pageNode, "footer");
    if (headerNode) {
        const { pageEndOffset: start, height } = getHeaderNodeAttributes(headerNode);
        const headerTotalHeight = start + height;
        bodyMargins.top -= headerTotalHeight;
        bodyMargins.bottom -= headerTotalHeight;
    }

    if (footerNode) {
        bodyMargins.bottom = 0;
    }

    return bodyMargins;
};
