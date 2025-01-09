/**
 * @file /src/utils/pageRegion/margins.ts
 * @name Margins
 * @description Utility functions for body margins
 */

import { Node as PMNode } from "@tiptap/pm/model";
import { DEFAULT_PAGE_MARGIN_CONFIG, DEFAULT_X_MARGIN_CONFIG } from "../../constants/pageMargins";
import { FOOTER_DEFAULT_ATTRIBUTES, HEADER_FOOTER_DEFAULT_ATTRIBUTES } from "../../constants/pageRegions";
import { MarginConfig, YMarginConfig } from "../../types/page";
import {
    getHeaderFooterNodeHeight,
    getHeaderFooterNodePageEndOffset,
    getHeaderFooterNodeType,
    getHeaderFooterNodeXMargins,
    getHeaderNodeAttributes,
} from "./pageRegion";
import { mm } from "../units";
import { calculateBodyDimensions } from "./dimensions";
import { getPageRegionNode } from "./getAttributes";
import { getPaperDimensionsFromPageNode } from "../paperSize";
import { getPageNodePageMargins } from "../pageMargins";

/**
 * Checks if a (single) margin is valid.
 * Margins must be non-negative and finite to be considered valid.
 * @param margin - The margin to check.
 * @returns {boolean} True if the margin is valid, false otherwise.
 */
export const isMarginValid = (margin: number): boolean => {
    return margin >= 0 && isFinite(margin);
};

/**
 * Checks if the page margins are valid.
 * Margins must be non-negative and finite to be considered valid.
 * @param pageMargins - The page margins to check.
 * @returns {boolean} True if the page margins are valid, false otherwise.
 */
export const isValidPageMargins = (pageMargins: MarginConfig): boolean => {
    return Object.values(pageMargins).every(isMarginValid);
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

/**
 * Converts a margin config to a CSS string using millimeters as the unit.
 * @param pageMargins - The page margins to convert to a CSS string.
 * @returns {string} The CSS string representation of the page margins. Remember MDN says
 * order is (top, right, bottom, left). See https://developer.mozilla.org/en-US/docs/Web/CSS/padding.
 */
export const calculateShorthandMargins = (pageMargins: MarginConfig): string => {
    const { top, right, bottom, left } = pageMargins;

    const padding = [top, right, bottom, left].map(mm).join(" ");
    return padding;
};
