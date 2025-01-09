/**
 * @file /src/utils/pageMargins.ts
 * @name PageMargins
 * @description Utility functions for page margins.
 */

import { Node as PMNode } from "@tiptap/pm/model";
import { Nullable } from "../types/record";
import { MarginConfig, MultiAxisSide } from "../types/page";
import { PAGE_NODE_ATTR_KEYS } from "../constants/page";
import { Dispatch, Editor } from "@tiptap/core";
import { EditorState, Transaction } from "@tiptap/pm/state";
import { DEFAULT_PAGE_MARGIN_CONFIG } from "../constants/pageMargins";
import { getPageAttributeByPageNum } from "./page";
import { setPageNodePosSideConfig, updatePageSideConfig } from "./setSideConfig";
import { isValidPageMargins } from "./pageRegion/margins";

/**
 * Get the page margins from a page node.
 * @param pageNode - The page node to get the page margins from.
 * @returns {Nullable<MarginConfig>} The page margins of the specified page.
 */
export const getPageNodePageMargins = (pageNode: PMNode): Nullable<MarginConfig> => {
    const { attrs } = pageNode;
    return attrs[PAGE_NODE_ATTR_KEYS.pageMargins];
};

/**
 * Retrieves the page margin config of a specific page using the editor instance.
 * Falls back to the default page margin config if the page number is invalid.
 * @param context - The current editor instance or editor state.
 * @param pageNum - The page number to retrieve the page margin config for.
 * @returns {BorderConfig} The page margin config of the specified page or default.
 */
export const getPageNumPageMargins = (context: Editor | EditorState, pageNum: number): MarginConfig => {
    const getDefault = context instanceof Editor ? context.commands.getDefaultPageMargins : () => DEFAULT_PAGE_MARGIN_CONFIG;
    return getPageAttributeByPageNum(context, pageNum, getDefault, getPageNodePageMargins);
};

/**
 * Set the page margins of a page node.
 * @param tr - The transaction to apply the change to.
 * @param dispatch - The dispatch function to apply the transaction.
 * @param pagePos - The position of the page node to set the page margins for.
 * @param pageNode - The page node to set the page margins for.
 * @param pageMargins - The page margins to set.
 * @returns {boolean} True if the page margins were set, false otherwise.
 */
export const setPageNodePosPageMargins = (
    tr: Transaction,
    dispatch: Dispatch,
    pagePos: number,
    pageNode: PMNode,
    pageMargins: MarginConfig
): boolean => {
    return setPageNodePosSideConfig(
        tr,
        dispatch,
        pagePos,
        pageNode,
        pageMargins,
        isValidPageMargins,
        getPageNodePageMargins,
        PAGE_NODE_ATTR_KEYS.pageMargins
    );
};

/**
 * Updates the margin on the given page. Does not dispatch the transaction.
 * @param tr - The transaction to apply the change to.
 * @param pagePos - The position of the page node to update the margin for.
 * @param pageNode - The page node to update the margin for.
 * @param margin - The margin to update.
 * @param value - The new value of the margin.
 * @returns {boolean} True if the margin was updated, false otherwise.
 */
export const updatePageMargin = (tr: Transaction, pagePos: number, pageNode: PMNode, margin: MultiAxisSide, value: number): boolean => {
    return updatePageSideConfig(
        tr,
        pagePos,
        pageNode,
        margin,
        value,
        getPageNodePageMargins,
        isValidPageMargins,
        DEFAULT_PAGE_MARGIN_CONFIG,
        PAGE_NODE_ATTR_KEYS.pageMargins
    );
};
