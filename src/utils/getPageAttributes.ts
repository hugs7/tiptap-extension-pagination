/**
 * @file /src/utils/getPageAttributes.ts
 * @name GetPageAttributes
 * @description Utility functions for getting page attributes.
 */

import { EditorState } from "@tiptap/pm/state";
import { PageNodeAttributes, PageContentPixelDimensions } from "../types/page";
import PageSectionType, { PageSectionNodeAttributes, PageSectionNoteAttributesObject } from "../types/pageSection";
import { calculatePageContentPixelDimensions, getPageNumPaperSize } from "./paperSize";
import { getPageNumPaperColour } from "./paperColour";
import { getPageNumPaperOrientation } from "./paperOrientation";
import { getPageNumSectionPageMargins } from "./pageSection/margins";
import { getPageNumPageBorders } from "./pageBorders";
import { pageSectionTypes } from "../constants/pageSection";

/**
 * Retrieves page attributes from the editor state.
 * @param state - The current editor state.
 * @param pageNum - The page number to retrieve the attributes for.
 * @returns {PageNodeAttributes} The attributes of the specified page.
 */
const getPageNodeAttributes = (state: EditorState, pageNum: number): PageNodeAttributes => {
    const paperSize = getPageNumPaperSize(state, pageNum);
    const paperColour = getPageNumPaperColour(state, pageNum);
    const paperOrientation = getPageNumPaperOrientation(state, pageNum);
    const pageBorders = getPageNumPageBorders(state, pageNum);

    return { paperSize, paperColour, paperOrientation, pageBorders };
};

/**
 * Retrieves page section attributes from the editor state.
 * @param state - The current editor state.
 * @param pageNum - The page number to retrieve the attributes for.
 * @param sectionType - The type of section to retrieve the attributes for.
 * @returns {PageNodeAttributes} The attributes of the specified page.
 */
const getPageSectionNodeAttributes = (state: EditorState, pageNum: number, sectionType: PageSectionType): PageSectionNodeAttributes => {
    const paperSize = getPageNumPaperSize(state, pageNum);
    const paperOrientation = getPageNumPaperOrientation(state, pageNum);
    const pageMargins = getPageNumSectionPageMargins(state, pageNum, sectionType);

    return { paperSize, paperOrientation, pageMargins, type: sectionType };
};

/**
 * Retrieves page section attributes from the editor state.
 * @param state - The current editor state.
 * @param pageNum - The page number to retrieve the attributes for.
 * @returns {PageNodeAttributes} The attributes of the specified page.
 */
const getPageSectionsNodeAttributes = (state: EditorState, pageNum: number): PageSectionNoteAttributesObject => {
    return pageSectionTypes.reduce((acc, sectionType) => {
        acc[sectionType] = getPageSectionNodeAttributes(state, pageNum, sectionType);
        return acc;
    }, {} as PageSectionNoteAttributesObject);
};

/**
 * Retrieves the page node attributes and calculates the pixel dimensions of the page.
 * @param pageNodeAttributes - The attributes of the page node.
 * @returns { PageNodeAttributes, PageSectionNodeAttributes, PagePixelDimensions } The attributes of the page node,
 * page section node and the pixel dimensions of the page.
 */
export const getPaginationNodeAttributes = (
    state: EditorState,
    pageNum: number
): {
    pageNodeAttributes: PageNodeAttributes;
    pageSectionsNodeAttributes: PageSectionNoteAttributesObject;
    pagePixelDimensions: PageContentPixelDimensions;
} => {
    const pageNodeAttributes = getPageNodeAttributes(state, pageNum);
    const pageSectionsNodeAttributes = getPageSectionsNodeAttributes(state, pageNum);
    const pagePixelDimensions = calculatePageContentPixelDimensions(pageNodeAttributes);

    return { pageNodeAttributes, pageSectionsNodeAttributes, pagePixelDimensions };
};
