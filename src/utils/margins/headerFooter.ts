/**
 * @file /src/utils/pageRegion/pageRegion.ts
 * @name PageRegion
 * @description Utility functions for creating custom page regions in the editor.
 */

import { Node as PMNode } from "@tiptap/pm/model";
import { HeaderNodeAttributes, FooterNodeAttributes } from "../../types/pageRegions";
import { Nullable } from "../../types/record";
import {
    HEADER_DEFAULT_ATTRIBUTES,
    FOOTER_DEFAULT_ATTRIBUTES,
    HEADER_FOOTER_NODE_ATTR_KEYS,
    HEADER_FOOTER_DEFAULT_ATTRIBUTES,
} from "../../constants/pageRegions";
import { MarginConfig, XMarginConfig, YMarginConfig } from "../../types/page";
import { getPaperDimensionsFromPageNode } from "../paperSize";
import { getPageRegionNode } from "../nodes/pageRegion/getAttributes";
import { getPageNodePageMargins } from "./pageMargins";
import { calculateBodyDimensions } from "../nodes/body/dimensions";
import { DEFAULT_PAGE_MARGIN_CONFIG, DEFAULT_X_MARGIN_CONFIG } from "../../constants/pageMargins";
import { getHeaderFooterNodeType } from "../nodes/pageRegion/headerFooter";

/**
 * Get the x margins from a header or footer node.
 * @param headerFooterNode - The header or footer node.
 * @returns {Nullable<XMarginConfig>} The x margins of the specified header or footer.
 */
export const getHeaderFooterNodeXMargins = (headerFooterNode: PMNode): Nullable<XMarginConfig> => {
    const { attrs } = headerFooterNode;
    return attrs[HEADER_FOOTER_NODE_ATTR_KEYS.xMargins];
};

/**
 * Get the page end offset of the header or footer node.
 * @param headerFooterNode - The header or footer node to retrieve the page end offset for.
 * @returns {Nullable<number>} The page end offset of the specified header or footer node or null if not found.
 */
export const getHeaderFooterNodePageEndOffset = (headerFooterNode: PMNode): Nullable<number> => {
    const { attrs } = headerFooterNode;
    return attrs[HEADER_FOOTER_NODE_ATTR_KEYS.pageEndOffset];
};

/**
 * Get the height of the header or footer node.
 * @param headerFooterNode - The header or footer node to retrieve the height for.
 * @returns {Nullable<number>} The height of the specified header or footer node or null if not found.
 */
export const getHeaderFooterNodeHeight = (headerFooterNode: PMNode): Nullable<number> => {
    const { attrs } = headerFooterNode;
    return attrs[HEADER_FOOTER_NODE_ATTR_KEYS.height];
};

/**
 * Retrieves the header node attributes, filling in any missing attributes with the default values.
 * @param headerFooterNode - The header or footer node to retrieve the attributes for.
 * @returns {HeaderNodeAttributes} The attributes of the specified header.
 */
export const getHeaderNodeAttributes = (headerFooterNode: PMNode): HeaderNodeAttributes => {
    const { attrs } = headerFooterNode;
    const mergedAttrs = { ...HEADER_DEFAULT_ATTRIBUTES, ...attrs };
    if (mergedAttrs.type !== "header") {
        console.warn("Header node attributes are not of type 'header'");
    }

    return mergedAttrs;
};

/**
 * Retrieves the footer node attributes, filling in any missing attributes with the default values.
 * @param headerFooterNode - The header or footer node to retrieve the attributes for.
 * @returns {FooterNodeAttributes} The attributes of the specified footer.
 */
export const getFooterNodeAttributes = (headerFooterNode: PMNode): FooterNodeAttributes => {
    const { attrs } = headerFooterNode;
    const mergedAttrs = { ...FOOTER_DEFAULT_ATTRIBUTES, ...attrs };
    if (mergedAttrs.type !== "footer") {
        console.warn("Footer node attributes are not of type 'footer'");
    }

    return mergedAttrs;
};

/**
 * Calculate the effective DOM margins of the header node.
 * @param headerNode - The header node to calculate the margins for.
 * @param yMargins - The y margins to set.
 * @returns {void}
 */
const calculateHeaderMargins = (headerNode: PMNode, yMargins: YMarginConfig): void => {
    const startOffset = getHeaderFooterNodePageEndOffset(headerNode) ?? HEADER_FOOTER_DEFAULT_ATTRIBUTES.height;
    yMargins.top = startOffset;
};

/**
 * Calculate the effective DOM margins of the footer node.
 * @param pageNode - The page node containing the body node.
 * @param footerNode - The footer node to calculate the margins for.
 * @param yMargins - The y margins to set.
 * @returns {void}
 */
const calculateFooterMargins = (pageNode: PMNode, footerNode: PMNode, yMargins: YMarginConfig): void => {
    const { height: pageHeight } = getPaperDimensionsFromPageNode(pageNode);

    const footerHeight = getHeaderFooterNodeHeight(footerNode) ?? HEADER_FOOTER_DEFAULT_ATTRIBUTES.height;
    const endOffset = getHeaderFooterNodePageEndOffset(footerNode) ?? FOOTER_DEFAULT_ATTRIBUTES.pageEndOffset;
    yMargins.top = pageHeight - (footerHeight + endOffset);

    const bodyNode = getPageRegionNode(pageNode, "body");
    if (bodyNode) {
        const { top } = getPageNodePageMargins(pageNode) ?? DEFAULT_PAGE_MARGIN_CONFIG;
        const { height } = calculateBodyDimensions(pageNode);
        yMargins.top -= top + height;
    }
};

/**
 * Calculate the effective DOM margins of the header or footer node. Takes into account
 * what the margins should be to ensure the other page region nodes are
 * visible on the page.
 * @param pageNode - The page node containing the header/footer node.
 * @param headerFooterNode - The header or footer node to calculate the margins for.
 */
export const calculateHeaderFooterMargins = (pageNode: PMNode, headerFooterNode: PMNode): MarginConfig => {
    const nodeType = getHeaderFooterNodeType(headerFooterNode);

    let yMargins: YMarginConfig = { top: 0, bottom: 0 };

    switch (nodeType) {
        case "header":
            calculateHeaderMargins(headerFooterNode, yMargins);
            break;
        case "footer":
            calculateFooterMargins(pageNode, headerFooterNode, yMargins);
            break;
        default:
            console.error(`Unknown header/footer node type: ${nodeType}`);
    }

    const xMargins = getHeaderFooterNodeXMargins(headerFooterNode) ?? DEFAULT_X_MARGIN_CONFIG;

    return { ...xMargins, ...yMargins };
};
