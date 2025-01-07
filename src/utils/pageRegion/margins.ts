/**
 * @file /src/utils/pageRegoin/margins.ts
 * @name Margins
 * @description Utility functions for body margins
 */

import { Dispatch, Editor } from "@tiptap/core";
import { Node as PMNode } from "@tiptap/pm/model";
import { EditorState, Transaction } from "@tiptap/pm/state";
import { DEFAULT_MARGIN_CONFIG, DEFAULT_X_MARGIN_CONFIG } from "../../constants/pageMargins";
import { BODY_NODE_ATTR_KEYS } from "../../constants/body";
import { HEADER_FOOTER_DEFAULT_ATTRIBUTES, HEADER_FOOTER_NODE_ATTR_KEYS } from "../../constants/pageRegions";
import { Nullable } from "../../types/record";
import { setPageNodePosSideConfig, updatePageSideConfig } from "../setSideConfig";
import { MarginConfig, MultiAxisSide, XMarginConfig, YMarginConfig } from "../../types/page";
import { getHeaderFooterNodeStart, getPageRegionAttributeByPageNum, getPageRegionNode } from "./pageRegion";
import { mm } from "../units";
import { HeaderFooter } from "../../types/pageRegions";
import { calculateBodyDimensions } from "./dimensions";

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
 * Get the page margins from a body node.
 * @param bodyNode - The body node to get the page margins from.
 * @returns {Nullable<MarginConfig>} The page margins of the specified page.
 */
export const getBodyNodeMargins = (bodyNode: PMNode): Nullable<MarginConfig> => {
    const { attrs } = bodyNode;
    return attrs[BODY_NODE_ATTR_KEYS.pageMargins];
};

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
 * Calculate the effective DOM margins of the header or footer node. Takes into account
 * what the margins should be to ensure the other page region nodes are
 * visible on the page.
 * @param pageNode - The page node containing the header/footer node.
 * @param headerFooterNode - The header or footer node to calculate the margins for.
 */
export const calculateHeaderFooterMargins = (pageNode: PMNode, headerFooterNode: PMNode): MarginConfig => {
    const nodeType = headerFooterNode.type.name as HeaderFooter;

    let yMargins: YMarginConfig = { top: 0, bottom: 0 };

    switch (nodeType) {
        case "header":
            const nodeHeight = getHeaderFooterNodeStart(headerFooterNode) ?? HEADER_FOOTER_DEFAULT_ATTRIBUTES.height;
            yMargins.top = nodeHeight;
            break;
        case "footer":
            const footerNode = headerFooterNode;
            const footerNodeStart = getHeaderFooterNodeStart(footerNode) ?? HEADER_FOOTER_DEFAULT_ATTRIBUTES.start;
            yMargins.top = footerNodeStart;

            const bodyNode = getPageRegionNode(pageNode, "body");
            if (bodyNode) {
                const { top } = getBodyNodeMargins(bodyNode) ?? DEFAULT_MARGIN_CONFIG;
                const { height } = calculateBodyDimensions(pageNode, bodyNode);
                yMargins.top -= top + height;
            }

            break;
    }

    const xMargins = getHeaderFooterNodeXMargins(headerFooterNode) ?? DEFAULT_X_MARGIN_CONFIG;

    return { ...xMargins, ...yMargins };
};

/**
 * Retrieves the page margin config of a specific body using the editor instance.
 * Falls back to the default page margin config if the page number is invalid.
 * @param context - The current editor instance or editor state.
 * @param pageNum - The page number to retrieve the page margin config for.
 * @returns {MarginConfig} The page margin config of the specified page or default.
 */
export const getPageNumBodyMargins = (context: Editor | EditorState, pageNum: number): MarginConfig => {
    const getDefault = () => (context instanceof Editor ? context.commands.getDefaultPageMargins() : DEFAULT_MARGIN_CONFIG);
    return getPageRegionAttributeByPageNum(context, pageNum, "body", getDefault, getBodyNodeMargins);
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

/**
 * Set the page margins of a body node.
 * @param tr - The transaction to apply the change to.
 * @param dispatch - The dispatch function to apply the transaction.
 * @param pagePos - The position of the body node to set the page margins for.
 * @param pageSectionNode - The body node to set the page margins for.
 * @param pageMargins - The page margins to set.
 * @returns {boolean} True if the page margins were set, false otherwise.
 */
export const setBodyNodePosPageMargins = (
    tr: Transaction,
    dispatch: Dispatch,
    pagePos: number,
    pageSectionNode: PMNode,
    pageMargins: MarginConfig
): boolean => {
    return setPageNodePosSideConfig(
        tr,
        dispatch,
        pagePos,
        pageSectionNode,
        pageMargins,
        isValidPageMargins,
        getBodyNodeMargins,
        BODY_NODE_ATTR_KEYS.pageMargins
    );
};

/**
 * Updates the margin on the given page. Does not dispatch the transaction.
 * @param tr - The transaction to apply the change to.
 * @param pagePos - The position of the body node to update the margin for.
 * @param pageSectionNode - The body node to update the margin for.
 * @param margin - The margin to update.
 * @param value - The new value of the margin.
 * @returns {boolean} True if the margin was updated, false otherwise.
 */
export const updateBodyMargin = (
    tr: Transaction,
    pagePos: number,
    pageSectionNode: PMNode,
    margin: MultiAxisSide,
    value: number
): boolean => {
    return updatePageSideConfig(
        tr,
        pagePos,
        pageSectionNode,
        margin,
        value,
        getBodyNodeMargins,
        isValidPageMargins,
        DEFAULT_MARGIN_CONFIG,
        BODY_NODE_ATTR_KEYS.pageMargins
    );
};
