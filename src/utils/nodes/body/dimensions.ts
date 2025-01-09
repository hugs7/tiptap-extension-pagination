/**
 * @file /src/utils/pageRegion/Dimensions.ts
 * @name Dimensions
 * @description Utility functions for body dimensions.
 */

import { Node as PMNode } from "@tiptap/pm/model";
import { PaperDimensions } from "../../../types/paper";
import { DEFAULT_PAGE_MARGIN_CONFIG } from "../../../constants/pageMargins";
import { getPageNodePageMargins } from "../../margins/pageMargins";
import { getPaperDimensionsFromPageNode } from "../../paperSize";

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
