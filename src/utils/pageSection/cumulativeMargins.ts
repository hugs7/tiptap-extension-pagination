/**
 * @file /src/utils/cumulativePageSectionMargins.ts
 * @name CumulativePageSectionMargins
 * @description Utility functions for calculating cumulative page section margins.
 */

import { Node as PMNode } from "@tiptap/pm/model";
import { pageSectionTypes } from "../../constants/pageSection";
import { MarginConfig } from "../../types/paper";
import PageSectionType from "../../types/pageSection";
import { getPageSectionIndex, getPageSectionNodeByType } from "./pageSection";
import { calculatePageSectionDimensions } from "./dimensions";
import { getDefaultPageSectionPageMargins, getPageSectionNodePageMargins } from "./margins";

/**
 * Calculates the margins for a page section based on it's type and position in the page.
 * E.g. for body sections, the top margin is the page top margin subtract the header height and header top margin.
 * @param parentPageNode - The parent page node of the page section node.
 * @param pageSectionNode - The page section node to calculate the margins for.
 * @param sectionType - The type of the page section node to calculate the margins for.
 * @returns {MarginConfig} The calculated margins of the page section node.
 */
export const calculateCumulativePageSectionMargins = (
    parentPageNode: PMNode,
    pageSectionNode: PMNode,
    sectionType: PageSectionType
): MarginConfig => {
    const margins = getPageSectionNodePageMargins(pageSectionNode) ?? getDefaultPageSectionPageMargins(sectionType);

    const pageSectionIndex = getPageSectionIndex(sectionType);
    const sectionsAbove = pageSectionTypes.slice(0, pageSectionIndex - 1);

    return sectionsAbove.reduce<MarginConfig>((acc, aboveSectionType) => {
        const aboveSectionNode = getPageSectionNodeByType(parentPageNode, aboveSectionType);
        if (!aboveSectionNode) {
            return acc;
        }

        const { height } = calculatePageSectionDimensions(aboveSectionNode);
        const { bottom, top } = getPageSectionNodePageMargins(aboveSectionNode) ?? getDefaultPageSectionPageMargins(aboveSectionType);

        acc.top -= height + top + bottom;
        return acc;
    }, margins);
};
