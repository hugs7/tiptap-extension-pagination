/**
 * @file /src/utils/pageRegion/margins.ts
 * @name Margins
 * @description Utility functions for body margins
 */

import { Dispatch, Editor } from "@tiptap/core";
import { Node as PMNode } from "@tiptap/pm/model";
import { EditorState, Transaction } from "@tiptap/pm/state";
import { DEFAULT_PAGE_MARGIN_CONFIG, DEFAULT_X_MARGIN_CONFIG } from "../../constants/pageMargins";
import { BODY_NODE_ATTR_KEYS } from "../../constants/body";
import { FOOTER_DEFAULT_ATTRIBUTES, HEADER_DEFAULT_ATTRIBUTES, HEADER_FOOTER_DEFAULT_ATTRIBUTES } from "../../constants/pageRegions";
import { MarginConfig, MultiAxisSide, YMarginConfig } from "../../types/page";
import { setPageNodePosSideConfig, updatePageSideConfig } from "../setSideConfig";
import {
    getHeaderFooterNodeHeight,
    getHeaderFooterNodePageEndOffset,
    getHeaderFooterNodeType,
    getHeaderFooterNodeXMargins,
} from "./pageRegion";
import { mm } from "../units";
import { calculateBodyDimensions } from "./dimensions";
import { getBodyNodeMargins } from "./body";
import { getPageRegionAttributeByPageNum, getPageRegionNode } from "./getAttributes";
import { getPaperDimensionsFromPageNode } from "../paperSize";

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
    const startOffset = getHeaderFooterNodePageEndOffset(headerNode) ?? HEADER_DEFAULT_ATTRIBUTES.pageEndOffset;
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
        const { top } = getBodyNodeMargins(bodyNode) ?? DEFAULT_PAGE_MARGIN_CONFIG;
        const { height } = calculateBodyDimensions(pageNode, bodyNode);
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
 * Retrieves the page margin config of a specific body using the editor instance.
 * Falls back to the default page margin config if the page number is invalid.
 * @param context - The current editor instance or editor state.
 * @param pageNum - The page number to retrieve the page margin config for.
 * @returns {MarginConfig} The page margin config of the specified page or default.
 */
export const getPageNumPageMargins = (context: Editor | EditorState, pageNum: number): MarginConfig => {
    const getDefault = () => DEFAULT_PAGE_MARGIN_CONFIG;
    return getPageRegionAttributeByPageNum(context, pageNum, "body", getDefault, getBodyNodeMargins);
};

/**
 * Calculate the effective DOM margins of the body node. Takes into account
 * what the margins should be to ensure the header and footer nodes are
 * visible on the page.
 * @param bodyNode - The body node to calculate the margins for.
 * @returns {MarginConfig} The effective margins of the body node.
 */
export const calculateBodyMargins = (bodyNode: PMNode): MarginConfig => {
    // Copy the default margin config to avoid modifying the original.
    const { ...bodyMargins } = getBodyNodeMargins(bodyNode) ?? DEFAULT_PAGE_MARGIN_CONFIG;

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

/**
 * Set the page margins of a body node.
 * @param tr - The transaction to apply the change to.
 * @param dispatch - The dispatch function to apply the transaction.
 * @param pagePos - The position of the body node to set the page margins for.
 * @param bodyNode - The body node to set the page margins for.
 * @param pageMargins - The page margins to set.
 * @returns {boolean} True if the page margins were set, false otherwise.
 */
export const setBodyNodePosPageMargins = (
    tr: Transaction,
    dispatch: Dispatch,
    pagePos: number,
    bodyNode: PMNode,
    pageMargins: MarginConfig
): boolean => {
    return setPageNodePosSideConfig(
        tr,
        dispatch,
        pagePos,
        bodyNode,
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
 * @param bodyNode - The body node to update the margin for.
 * @param margin - The margin to update.
 * @param value - The new value of the margin.
 * @returns {boolean} True if the margin was updated, false otherwise.
 */
export const updateBodyMargin = (tr: Transaction, pagePos: number, bodyNode: PMNode, margin: MultiAxisSide, value: number): boolean => {
    return updatePageSideConfig(
        tr,
        pagePos,
        bodyNode,
        margin,
        value,
        getBodyNodeMargins,
        isValidPageMargins,
        DEFAULT_PAGE_MARGIN_CONFIG,
        BODY_NODE_ATTR_KEYS.pageMargins
    );
};
