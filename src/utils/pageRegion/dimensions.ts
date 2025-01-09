/**
 * @file /src/utils/pageRegion/Dimensions.ts
 * @name Dimensions
 * @description Utility functions for body dimensions.
 */

import { Node as PMNode } from "@tiptap/pm/model";
import { DEFAULT_PAGE_MARGIN_CONFIG, DEFAULT_X_MARGIN_CONFIG } from "../../constants/pageMargins";
import { HEADER_FOOTER_DEFAULT_ATTRIBUTES } from "../../constants/pageRegions";
import { PaperDimensions } from "../../types/paper";
import { getHeaderFooterNodeHeight, getHeaderFooterNodeXMargins } from "./pageRegion";
import { getPaperDimensionsFromPageNode } from "../paperSize";
import { getPageNodePageMargins } from "../pageMargins";

/**
 * Calculates the dimensions in millimetres of a header or footer node based on its paper size
 * @param pageNode - The page node containing the header or footer node.
 * @param headerFooterNode - The header or footer node to calculate the dimensions for.
 * @returns {PaperDimensions} The dimensions of the header or footer node.
 */
export const calculateHeaderFooterDimensions = (pageNode: PMNode, headerFooterNode: PMNode): PaperDimensions => {
    const { width: pageWidth } = getPaperDimensionsFromPageNode(pageNode);
    const { left, right } = getHeaderFooterNodeXMargins(headerFooterNode) ?? DEFAULT_X_MARGIN_CONFIG;

    const width = pageWidth - (left + right);
    const height = getHeaderFooterNodeHeight(headerFooterNode) ?? HEADER_FOOTER_DEFAULT_ATTRIBUTES.height;
    return { width, height };
};

/**
 * Calculates the dimensions in millimetres of a body node based on its paper size
 * and orientation.
 * @param pageNode - The page node containing the body node.
 * @returns {PaperDimensions} The dimensions of the body node.
 */
export const calculateBodyDimensions = (pageNode: PMNode): PaperDimensions => {
    const { width: pageWidth, height: pageHeight } = getPaperDimensionsFromPageNode(pageNode);
    const { bottom, left, right, top } = getPageNodePageMargins(pageNode) ?? DEFAULT_PAGE_MARGIN_CONFIG;

    const width = pageWidth - (left + right);
    const height = pageHeight - (top + bottom);
    return { width, height };
};
