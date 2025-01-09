/**
 * @file /src/utils/getPageAttributes.ts
 * @name GetPageAttributes
 * @description Utility functions for getting page attributes.
 */

import { EditorState } from "@tiptap/pm/state";
import { Node as PMNode } from "@tiptap/pm/model";
import { DEFAULT_PAPER_SIZE } from "../../../constants/paperSize";
import { DEFAULT_PAGE_MARGIN_CONFIG } from "../../../constants/pageMargins";
import { DEFAULT_PAPER_ORIENTATION } from "../../../constants/paperOrientation";
import { DEFAULT_PAPER_COLOUR } from "../../../constants/paperColours";
import { DEFAULT_PAGE_BORDER_CONFIG } from "../../../constants/pageBorders";
import { FOOTER_DEFAULT_ATTRIBUTES, HEADER_DEFAULT_ATTRIBUTES } from "../../../constants/pageRegions";
import { BODY_DEFAULT_ATTRIBUTES } from "../../../constants/body";
import { PageNodeAttributes, PageContentPixelDimensions } from "../../../types/page";
import { PageRegionNodeAttributesObject } from "../../../types/pageRegions";
import { calculatePageContentPixelDimensions, getPageNodePaperSize, getPageNumPaperSize } from "../../paperSize";
import { getPageNodePaperOrientation, getPageNumPaperOrientation } from "../../paperOrientation";
import { getPageNodePaperColour, getPageNumPaperColour } from "../../paperColour";
import { getPageNodePageMargins, getPageNumPageMargins } from "../../margins/pageMargins";
import { getPageNodePageBorders, getPageNumPageBorders } from "../../borders/pageBorders";
import { doesDocHavePageNodes, getPageNodeByPageNum } from "./page";
import { getFooterNodeAttributes, getHeaderNodeAttributes } from "../../margins/headerFooter";
import { getBodyNodeAttributes } from "../body/body";
import { getPageRegionNode } from "../headerFooter/getAttributes";

/**
 * Retrieves the page node attributes from the editor state.
 * @param pageNode - The page node to retrieve the attributes for.
 * @returns {PageNodeAttributes} The attributes of the specified page.
 */
export const getPageNodeAttributes = (pageNode: PMNode): PageNodeAttributes => {
    const paperSize = getPageNodePaperSize(pageNode) ?? DEFAULT_PAPER_SIZE;
    const paperOrientation = getPageNodePaperOrientation(pageNode) ?? DEFAULT_PAPER_ORIENTATION;
    const paperColour = getPageNodePaperColour(pageNode) ?? DEFAULT_PAPER_COLOUR;
    const pageMargins = getPageNodePageMargins(pageNode) ?? DEFAULT_PAGE_MARGIN_CONFIG;
    const pageBorders = getPageNodePageBorders(pageNode) ?? DEFAULT_PAGE_BORDER_CONFIG;

    return { paperSize, paperOrientation, paperColour, pageMargins, pageBorders };
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
    const pageMargins = getPageNumPageMargins(state, pageNum);
    const pageBorders = getPageNumPageBorders(state, pageNum);

    return { paperSize, paperColour, paperOrientation, pageMargins, pageBorders };
};

/**
 * Retrieves the default page region node attributes.
 * @returns {PageRegionNodeAttributesObject} The default attributes of the page regions.
 */
const getDefaultPageRegionNodeAttributes = (): PageRegionNodeAttributesObject => {
    return { header: HEADER_DEFAULT_ATTRIBUTES, body: BODY_DEFAULT_ATTRIBUTES, footer: FOOTER_DEFAULT_ATTRIBUTES };
};

/**
 * Retrieves body attributes from the editor state.
 * @param state - The current editor state.
 * @param pageNum - The page number to retrieve the attributes for.
 * @returns {PageNodeAttributes} The attributes of the specified page.
 */
const getPageRegionNodeAttributes = (state: EditorState, pageNum: number): PageRegionNodeAttributesObject => {
    if (!doesDocHavePageNodes(state)) {
        return getDefaultPageRegionNodeAttributes();
    }

    const pageNode = getPageNodeByPageNum(state.doc, pageNum);
    if (!pageNode) {
        return getDefaultPageRegionNodeAttributes();
    }

    const headerNode = getPageRegionNode(pageNode, "header");
    const bodyNode = getPageRegionNode(pageNode, "body");
    const footerNode = getPageRegionNode(pageNode, "footer");

    const headerAttributes = headerNode ? getHeaderNodeAttributes(headerNode) : HEADER_DEFAULT_ATTRIBUTES;
    const bodyAttributes = bodyNode ? getBodyNodeAttributes(bodyNode) : BODY_DEFAULT_ATTRIBUTES;
    const footerAttributes = footerNode ? getFooterNodeAttributes(footerNode) : FOOTER_DEFAULT_ATTRIBUTES;

    return { body: bodyAttributes, header: headerAttributes, footer: footerAttributes };
};

/**
 * Retrieves the page node attributes and calculates the pixel dimensions of the page.
 * @param pageNodeAttributes - The attributes of the page node.
 * @returns { PageNodeAttributes, PageRegionNodeAttributesObject, PagePixelDimensions } The attributes of the page node,
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
