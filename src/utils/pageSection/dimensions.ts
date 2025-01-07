/**
 * @file /src/utils/pageSectionDimensions.ts
 * @name PageSectionDimensions
 * @description Utility functions for page section dimensions.
 */

import { Node as PMNode } from "@tiptap/pm/model";
import { DEFAULT_PAGE_SECTION_TYPE } from "../../constants/pageSection";
import { DEFAULT_PAPER_ORIENTATION } from "../../constants/paperOrientation";
import { DEFAULT_PAPER_SIZE } from "../../constants/paperSize";
import { PaperDimensions } from "../../types/paper";
import { getPageNodePaperOrientation } from "../paperOrientation";
import { getPageNodePaperSize, getPaperDimensions } from "../paperSize";
import { getDefaultPageSectionPageMargins, getPageSectionNodePageMargins } from "./margins";
import { getPageSectionType } from "./pageSection";

/**
 * Calculates the dimensions in millimetres of a page section node based on its paper size
 * and orientation.
 * @param pageSectionNode - The page section node to calculate the dimensions for.
 * @returns {PaperDimensions} The dimensions of the page section node.
 */
export const calculatePageSectionDimensions = (pageSectionNode: PMNode): PaperDimensions => {
    const paperSize = getPageNodePaperSize(pageSectionNode) ?? DEFAULT_PAPER_SIZE;
    const paperOrientation = getPageNodePaperOrientation(pageSectionNode) ?? DEFAULT_PAPER_ORIENTATION;
    const { bottom, left, right, top } =
        getPageSectionNodePageMargins(pageSectionNode) ??
        getDefaultPageSectionPageMargins(getPageSectionType(pageSectionNode) ?? DEFAULT_PAGE_SECTION_TYPE);

    const { width: pageWidth, height: pageHeight } = getPaperDimensions(paperSize, paperOrientation);
    return { width: pageWidth - (left + right), height: pageHeight - (top + bottom) };
};
