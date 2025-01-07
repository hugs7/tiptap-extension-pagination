/**
 * @file /src/utils/pageSectionMargins.ts
 * @name PageSectionMargins
 * @description Utility functions for page section margins
 */

import { Dispatch, Editor } from "@tiptap/core";
import { Node as PMNode } from "@tiptap/pm/model";
import { EditorState, Transaction } from "@tiptap/pm/state";
import { DEFAULT_MARGIN_CONFIG } from "../../constants/pageMargins";
import { PAGE_SECTION_NODE_ATTR_KEYS } from "../../constants/pageSection";
import { MultiSide, MarginConfig } from "../../types/paper";
import { Nullable } from "../../types/record";
import PageSectionType from "../../types/pageSection";
import { setPageNodePosSideConfig, updatePageSideConfig } from "../setSideConfig";
import { mm } from "../units";
import { getPageSectionAttributeByPageNum } from "./pageSection";

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
 * Get the page margins from a page section node.
 * @param pageSectionNode - The page section node to get the page margins from.
 * @returns {Nullable<MarginConfig>} The page margins of the specified page.
 */
export const getPageSectionNodePageMargins = (pageSectionNode: PMNode): Nullable<MarginConfig> => {
    const { attrs } = pageSectionNode;
    return attrs[PAGE_SECTION_NODE_ATTR_KEYS.pageMargins];
};

/**
 * Retrieves the default page margin config of a specific page section.
 * @param sectionType - The type of the page section node to retrieve the default page margin config for.
 * @returns {MarginConfig} The default page margin config of the specified page section.
 */
export const getDefaultPageSectionPageMargins = (sectionType: PageSectionType): MarginConfig => {
    switch (sectionType) {
        case "header":
        case "footer":
            return { ...DEFAULT_MARGIN_CONFIG, top: 0, bottom: 0 };
        case "body":
            return DEFAULT_MARGIN_CONFIG;
    }
};

/**
 * Retrieves the page margin config of a specific page section using the editor instance.
 * Falls back to the default page margin config if the page number is invalid.
 * @param context - The current editor instance or editor state.
 * @param pageNum - The page number to retrieve the page margin config for.
 * @param sectionType - The type of the page section node to retrieve the page margin config for.
 * @returns {MarginConfig} The page margin config of the specified page or default.
 */
export const getPageNumSectionPageMargins = (
    context: Editor | EditorState,
    pageNum: number,
    sectionType: PageSectionType
): MarginConfig => {
    const getDefault = () =>
        context instanceof Editor
            ? context.commands.getDefaultPageSectionMargins(sectionType)
            : getDefaultPageSectionPageMargins(sectionType);
    const marginConfig = getPageSectionAttributeByPageNum(context, pageNum, sectionType, getDefault, getPageSectionNodePageMargins);

    if (marginConfig.bottom !== 0) {
        switch (sectionType) {
            case "header":
                // Any gap will be handled by the body top margin
                marginConfig.bottom = 0;
                break;
            case "body":
                // Any gap will be handled by the footer top margin
                marginConfig.bottom = 0;
                break;
        }
    }

    return marginConfig;
};

/**
 * Converts a margin config to a CSS string using millimeters as the unit.
 * @param pageMargins - The page margins to convert to a CSS string.
 * @returns {string} The CSS string representation of the page margins. Remember MDN says
 * order is (top, right, bottom, left). See https://developer.mozilla.org/en-US/docs/Web/CSS/padding.
 */
export const calculateShorthandPageSectionMargins = (pageMargins: MarginConfig): string => {
    const { top, right, bottom, left } = pageMargins;

    const padding = [top, right, bottom, left].map(mm).join(" ");
    return padding;
};

/**
 * Set the page margins of a page section node.
 * @param tr - The transaction to apply the change to.
 * @param dispatch - The dispatch function to apply the transaction.
 * @param pagePos - The position of the page section node to set the page margins for.
 * @param pageSectionNode - The page section node to set the page margins for.
 * @param pageMargins - The page margins to set.
 * @returns {boolean} True if the page margins were set, false otherwise.
 */
export const setPageSectionNodePosPageMargins = (
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
        getPageSectionNodePageMargins,
        PAGE_SECTION_NODE_ATTR_KEYS.pageMargins
    );
};

/**
 * Updates the margin on the given page. Does not dispatch the transaction.
 * @param tr - The transaction to apply the change to.
 * @param pagePos - The position of the page section node to update the margin for.
 * @param pageSectionNode - The page section node to update the margin for.
 * @param margin - The margin to update.
 * @param value - The new value of the margin.
 * @returns {boolean} True if the margin was updated, false otherwise.
 */
export const updatePageSectionMargin = (
    tr: Transaction,
    pagePos: number,
    pageSectionNode: PMNode,
    margin: Exclude<MultiSide, "all">,
    value: number
): boolean => {
    return updatePageSideConfig(
        tr,
        pagePos,
        pageSectionNode,
        margin,
        value,
        getPageSectionNodePageMargins,
        isValidPageMargins,
        DEFAULT_MARGIN_CONFIG,
        PAGE_SECTION_NODE_ATTR_KEYS.pageMargins
    );
};
