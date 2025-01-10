/**
 * @file /src/utils/pageRegion/margins.ts
 * @name Margins
 * @description Utility functions for body margins
 */

import { Dispatch, Editor } from "@tiptap/core";
import { Node as PMNode } from "@tiptap/pm/model";
import { EditorState, Transaction } from "@tiptap/pm/state";
import { DEFAULT_PAGE_MARGIN_CONFIG } from "../../constants/pageMargins";
import { BODY_NODE_ATTR_KEYS } from "../../constants/body";
import { MarginConfig, MultiAxisSide } from "../../types/page";
import { setPageNodePosSideConfig, updatePageSideConfig } from "../setSideConfig";
import { mm } from "../units";
import { getBodyNodeMargins } from "./body";
import { getPageRegionAttributeByPageNum } from "./getAttributes";

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
