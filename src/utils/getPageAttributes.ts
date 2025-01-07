/**
 * @file /src/utils/getPageAttributes.ts
 * @name GetPageAttributes
 * @description Utility functions for getting page attributes.
 */

import { EditorState } from "@tiptap/pm/state";
import { Node as PMNode } from "@tiptap/pm/model";
import { PageNodeAttributes, PageContentPixelDimensions } from "../types/page";
import { calculatePageContentPixelDimensions, getPageNodePaperSize, getPageNumPaperSize } from "./paperSize";
import { getPageNodePaperColour, getPageNumPaperColour } from "./paperColour";
import { getPageNodePaperOrientation, getPageNumPaperOrientation } from "./paperOrientation";
import { getPageNodePageBorders, getPageNumPageBorders } from "./pageBorders";
import { DEFAULT_PAPER_SIZE } from "../constants/paperSize";
import { DEFAULT_PAPER_ORIENTATION } from "../constants/paperOrientation";
import { DEFAULT_PAPER_COLOUR } from "../constants/paperColours";
import { DEFAULT_PAGE_BORDER_CONFIG } from "../constants/pageBorders";
import { PageRegionNodeAttributesObject } from "../types/pageRegions";
import { getPageNodeByPageNum } from "./page";
import { HEADER_FOOTER_DEFAULT_ATTRIBUTES } from "../constants/pageRegions";
import { BODY_DEFAULT_ATTRIBUTES } from "../constants/body";
import { getHeaderFooterNodeAttributes, getPageRegionNode } from "./pageRegion/pageRegion";
import { getBodyNodeAttributes } from "./pageRegion/body";

/**
 * Retrieves the page node attributes from the editor state.
 * @param pageNode - The page node to retrieve the attributes for.
 * @returns {PageNodeAttributes} The attributes of the specified page.
 */
export const getPageNodeAttributes = (pageNode: PMNode): PageNodeAttributes => {
    const paperSize = getPageNodePaperSize(pageNode) ?? DEFAULT_PAPER_SIZE;
    const paperOrientation = getPageNodePaperOrientation(pageNode) ?? DEFAULT_PAPER_ORIENTATION;
    const paperColour = getPageNodePaperColour(pageNode) ?? DEFAULT_PAPER_COLOUR;
    const pageBorders = getPageNodePageBorders(pageNode) ?? DEFAULT_PAGE_BORDER_CONFIG;

    return { paperSize, paperOrientation, paperColour, pageBorders };
};

/**
 * Retrieves page attributes from the editor state for a given page number.
 * @param state - The current editor state.
 * @param pageNum - The page number to retrieve the attributes for.
 * @returns {PageNodeAttributes} The attributes of the specified page.
 */
const getPageNodeAttributesByPageNum = (state: EditorState, pageNum: number): PageNodeAttributes => {
    const paperSize = getPageNumPaperSize(state, pageNum);
    const paperColour = getPageNumPaperColour(state, pageNum);
    const paperOrientation = getPageNumPaperOrientation(state, pageNum);
    const pageBorders = getPageNumPageBorders(state, pageNum);

    return { paperSize, paperColour, paperOrientation, pageBorders };
};

/**
 * Retrieves body attributes from the editor state.
 * @param state - The current editor state.
 * @param pageNum - The page number to retrieve the attributes for.
 * @returns {PageNodeAttributes} The attributes of the specified page.
 */
const getPageRegionNodeAttributes = (state: EditorState, pageNum: number): PageRegionNodeAttributesObject => {
    const pageNode = getPageNodeByPageNum(state.doc, pageNum);
    if (!pageNode) {
        return { header: HEADER_FOOTER_DEFAULT_ATTRIBUTES, body: BODY_DEFAULT_ATTRIBUTES, footer: HEADER_FOOTER_DEFAULT_ATTRIBUTES };
    }

    const headerNode = getPageRegionNode(pageNode, "header");
    const bodyNode = getPageRegionNode(pageNode, "body");
    const footerNode = getPageRegionNode(pageNode, "footer");

    const headerAttributes = headerNode ? getHeaderFooterNodeAttributes(headerNode) : HEADER_FOOTER_DEFAULT_ATTRIBUTES;
    const bodyAttributes = bodyNode ? getBodyNodeAttributes(bodyNode) : BODY_DEFAULT_ATTRIBUTES;
    const footerAttributes = footerNode ? getHeaderFooterNodeAttributes(footerNode) : HEADER_FOOTER_DEFAULT_ATTRIBUTES;

    return { body: bodyAttributes, header: headerAttributes, footer: footerAttributes };
};

/**
 * Retrieves the page node attributes and calculates the pixel dimensions of the page.
 * @param pageNodeAttributes - The attributes of the page node.
 * @returns { PageNodeAttributes, PageSectionNodeAttributes, PagePixelDimensions } The attributes of the page node,
 * body node and the pixel dimensions of the page.
 */
export const getPaginationNodeAttributes = (
    state: EditorState,
    pageNum: number
): {
    pageNodeAttributes: PageNodeAttributes;
    pageRegionNodeAttributes: PageRegionNodeAttributesObject;
    pagePixelDimensions: PageContentPixelDimensions;
} => {
    const pageNodeAttributes = getPageNodeAttributesByPageNum(state, pageNum);
    const pageRegionNodeAttributes = getPageRegionNodeAttributes(state, pageNum);
    const pagePixelDimensions = calculatePageContentPixelDimensions(pageNodeAttributes);

    return { pageNodeAttributes, pageRegionNodeAttributes, pagePixelDimensions };
};
