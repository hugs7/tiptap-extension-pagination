/**
 * @file /src/utils/paperOrientation.ts
 * @name PaperOrientation
 * @description Utility functions for paper orientations.
 */

import { Dispatch, Editor } from "@tiptap/core";
import { EditorState, Transaction } from "@tiptap/pm/state";
import { Node as PMNode } from "@tiptap/pm/model";
import { PAGE_NODE_ATTR_KEYS } from "../constants/page";
import { DEFAULT_PAPER_ORIENTATION } from "../constants/paperOrientation";
import { Nullable } from "../types/record";
import { PaperOrientation } from "../types/paper";
import { isPageNode } from "./nodes/page/page";
import { getPageAttributeByPageNum } from "./nodes/page/pageNumber";
import { setPageNodeAttribute } from "./setPageAttributes";

/**
 * Get the paper orientation of a particular page node in the document.
 * @param pageNode - The page node to find the paper orientation for
 * @returns {Nullable<PaperOrientation>} The paper orientation of the specified page or null
 * if the paper orientation is not set.
 */
export const getPageNodePaperOrientation = (pageNode: PMNode): Nullable<PaperOrientation> => {
    const { attrs } = pageNode;
    return attrs[PAGE_NODE_ATTR_KEYS.paperOrientation];
};

/**
 * Retrieves the paper orientation of a specific page using the editor instance.
 * Falls back to the default paper orientation if the page number is invalid.
 * @param context - The current editor instance or editor state.
 * @param pageNum - The page number to retrieve the paper orientation for.
 * @returns {PaperOrientation} The paper orientation of the specified page or default.
 */
export const getPageNumPaperOrientation = (context: Editor | EditorState, pageNum: number): PaperOrientation => {
    const getDefault = context instanceof Editor ? context.commands.getDefaultPaperOrientation : () => DEFAULT_PAPER_ORIENTATION;
    return getPageAttributeByPageNum(context, pageNum, getDefault, getPageNodePaperOrientation);
};

/**
 * Set the paper orientation of a page node to the given value.
 * @param tr - The transaction to apply the change to.
 * @param dispatch - The dispatch function to apply the transaction.
 * @param pagePos - The position of the page node to set the paper colour for.
 * @param pageNode - The page node to set the paper colour for.
 * @param paperOrientation - The paper orientation to set.
 * @returns {boolean} True if the paper colour was set, false otherwise.
 */
export const setPageNodePosPaperOrientation = (
    tr: Transaction,
    dispatch: Dispatch,
    pagePos: number,
    pageNode: PMNode,
    paperOrientation: PaperOrientation
): boolean => {
    if (!dispatch) return false;

    if (!isPageNode(pageNode)) {
        console.error("Unexpected! Node at pos:", pagePos, "is not a page node!");
        return false;
    }

    if (getPageNodePaperOrientation(pageNode) === paperOrientation) {
        // Paper colour is already set
        return false;
    }

    setPageNodeAttribute(tr, pagePos, pageNode, PAGE_NODE_ATTR_KEYS.paperOrientation, paperOrientation);

    dispatch(tr);
    return true;
};
