/**
 * @file /src/utils/pageBorders.ts
 * @name PageBorders
 * @description Utility functions for handling page borders.
 */

import { EditorState, Transaction } from "@tiptap/pm/state";
import { Dispatch, Editor } from "@tiptap/core";
import { Node as PMNode } from "@tiptap/pm/model";
import { PAGE_NODE_ATTR_KEYS } from "../constants/page";
import { DEFAULT_PAGE_BORDER_CONFIG } from "../constants/pageBorders";
import { BorderConfig, MultiSide } from "../types/paper";
import { Nullable } from "../types/record";
import { px } from "./units";
import { getPageAttributeByPageNum } from "./page";
import { setPageNodePosSideConfig, updatePageSideConfig } from "./setSideConfig";

/**
 * Checks if a (single) border is valid.
 * Borders must be non-negative and finite to be considered valid.
 * @param border - The border to check.
 * @returns {boolean} True if the border is valid, false otherwise.
 */
export const isBorderValid = (border: number): boolean => {
    return border >= 0 && isFinite(border);
};

/**
 * Checks if the page borders are valid.
 * Borders must be non-negative and finite to be considered valid.
 * @param pageBorder - The page borders to check.
 * @returns {boolean} True if the page borders are valid, false otherwise.
 */
export const isValidPageBorders = (pageBorder: BorderConfig): boolean => {
    return Object.values(pageBorder).every(isBorderValid);
};

/**
 * Get the page borders from a page node.
 * @param pageNode - The page node to get the page borders from.
 * @returns {Nullable<BorderConfig>} The page borders of the specified page.
 */
export const getPageNodePageBorders = (pageNode: PMNode): Nullable<BorderConfig> => {
    const { attrs } = pageNode;
    return attrs[PAGE_NODE_ATTR_KEYS.pageBorders];
};

/**
 * Converts a border config to a CSS string using px as the unit.
 * @param pageBorders - The page borders to convert to a CSS string.
 * @returns {string} The CSS string representation of the page borders. Remember MDN says
 * order is (top, right, bottom, left). See https://developer.mozilla.org/en-US/docs/Web/CSS/border.
 */
export const calculateShorthandPageBorders = (pageBorders: BorderConfig): string => {
    const { top, right, bottom, left } = pageBorders;

    const borders = [top, right, bottom, left].map(px).join(" ");
    return borders;
};

/**
 * Retrieves the page border config of a specific page using the editor instance.
 * Falls back to the default page border config if the page number is invalid.
 * @param context - The current editor instance or editor state.
 * @param pageNum - The page number to retrieve the page border config for.
 * @returns {BorderConfig} The page border config of the specified page or default.
 */
export const getPageNumPageBorders = (context: Editor | EditorState, pageNum: number): BorderConfig => {
    const getDefault = context instanceof Editor ? context.commands.getDefaultPageBorders : () => DEFAULT_PAGE_BORDER_CONFIG;
    return getPageAttributeByPageNum(context, pageNum, getDefault, getPageNodePageBorders);
};

/**
 * Set the page borders of a page node.
 * @param tr - The transaction to apply the change to.
 * @param dispatch - The dispatch function to apply the transaction.
 * @param pagePos - The position of the page node to set the page borders for.
 * @param pageNode - The page node to set the page borders for.
 * @param pageBorders - The page borders to set.
 * @returns {boolean} True if the page borders were set, false otherwise.
 */
export const setPageNodePosPageBorders = (
    tr: Transaction,
    dispatch: Dispatch,
    pagePos: number,
    pageNode: PMNode,
    pageBorders: BorderConfig
): boolean => {
    return setPageNodePosSideConfig(
        tr,
        dispatch,
        pagePos,
        pageNode,
        pageBorders,
        isValidPageBorders,
        getPageNodePageBorders,
        PAGE_NODE_ATTR_KEYS.pageBorders
    );
};

/**
 * Updates the border on the given page. Does not dispatch the transaction.
 * @param tr - The transaction to apply the change to.
 * @param pagePos - The position of the page node to update the border for.
 * @param pageNode - The page node to update the border for.
 * @param border - The border to update.
 * @param value - The new value of the border.
 * @returns {boolean} True if the border was updated, false otherwise.
 */
export const updatePageBorder = (
    tr: Transaction,
    pagePos: number,
    pageNode: PMNode,
    border: Exclude<MultiSide, "all">,
    value: number
): boolean => {
    return updatePageSideConfig(
        tr,
        pagePos,
        pageNode,
        border,
        value,
        getPageNodePageBorders,
        isValidPageBorders,
        DEFAULT_PAGE_BORDER_CONFIG,
        PAGE_NODE_ATTR_KEYS.pageBorders
    );
};
