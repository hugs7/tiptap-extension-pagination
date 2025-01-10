/**
 * @file /src/utils/paperColour.ts
 * @name PaperColour
 * @description Utility functions for paper colours.
 */

import { EditorState, Transaction } from "@tiptap/pm/state";
import { Dispatch, Editor } from "@tiptap/core";
import { Node as PMNode } from "@tiptap/pm/model";
import { DEFAULT_PAPER_COLOUR, DARK_PAPER_COLOUR, LIGHT_PAPER_COLOUR } from "../constants/paperColours";
import { PAGE_NODE_ATTR_KEYS } from "../constants/page";
import { DARK_THEME } from "../constants/theme";
import { Nullable } from "../types/record";
import { getPageAttributeByPageNum, isPageNode } from "./nodes/page";
import { isValidColour } from "./colour";
import { nodeHasAttribute } from "./attributes/getAttributes";
import { getDeviceTheme } from "./theme";
import { setPageNodeAttribute } from "./setPageAttributes";

/**
 * Get the paper colour based on the device theme.
 * @returns {string} The paper colour based on the device theme.
 */
export const getDeviceThemePaperColour = (): string => {
    return getDeviceTheme() === DARK_THEME ? DARK_PAPER_COLOUR : LIGHT_PAPER_COLOUR;
};

/**
 * Check if a page node has a paper colour attribute.
 * @param pageNode - The page node to check.
 * @returns {boolean} True if the page node has a paper colour attribute, false otherwise.
 */
export const pageNodeHasPaperColour = (pageNode: PMNode): boolean => {
    return nodeHasAttribute(pageNode, PAGE_NODE_ATTR_KEYS.paperColour);
};

/**
 * Get the paper colour of a particular page node in the document.
 * @param pageNode - The page node to find the paper colour for
 * @returns {Nullable<string>} The paper colour of the specified page or null
 * if the paper colour is not set.
 */
export const getPageNodePaperColour = (pageNode: PMNode): Nullable<string> => {
    const { attrs } = pageNode;
    return attrs[PAGE_NODE_ATTR_KEYS.paperColour];
};

/**
 * Retrieves the paper color of a specific page using the editor instance.
 * Falls back to the default paper color if the page number is invalid.
 * @param context - The current editor instance or editor state.
 * @param pageNum - The page number to retrieve the paper color for.
 * @returns {string} The paper color of the specified page or default.
 */
export const getPageNumPaperColour = (context: Editor | EditorState, pageNum: number): string => {
    const getDefault = context instanceof Editor ? context.commands.getDefaultPaperColour : () => DEFAULT_PAPER_COLOUR;
    return getPageAttributeByPageNum(context, pageNum, getDefault, getPageNodePaperColour);
};

/**
 * Set the paper colour for a page node at the specified position.
 * @param tr - The transaction to apply the change to.
 * @param dispatch - The dispatch function to apply the transaction.
 * @param pagePos - The position of the page node to set the paper colour for.
 * @param pageNode - The page node to set the paper colour for.
 * @param paperColour - The paper colour to set.
 * @returns {boolean} True if the paper colour was set, false otherwise.
 */
export const setPageNodePosPaperColour = (
    tr: Transaction,
    dispatch: Dispatch,
    pagePos: number,
    pageNode: PMNode,
    paperColour: string
): boolean => {
    if (!dispatch) return false;

    if (!isValidColour(paperColour)) {
        console.warn("Invalid paper colour:", paperColour);
        return false;
    }

    if (!isPageNode(pageNode)) {
        console.error("Unexpected! Node at pos:", pagePos, "is not a page node!");
        return false;
    }

    if (getPageNodePaperColour(pageNode) === paperColour) {
        // Paper colour is already set
        return false;
    }

    setPageNodeAttribute(tr, pagePos, pageNode, PAGE_NODE_ATTR_KEYS.paperColour, paperColour);

    dispatch(tr);
    return true;
};
