/**
 * @file /src/utils/paperSize.ts
 * @name PaperSize
 * @description Utility functions for paper sizes.
 */

import { EditorState, Transaction } from "@tiptap/pm/state";
import { Dispatch, Editor } from "@tiptap/core";
import { Node as PMNode } from "@tiptap/pm/model";
import { DEFAULT_PAPER_SIZE, paperDimensions } from "../constants/paper";
import { PaperOrientation, PaperDimensions, PaperSize } from "../types/paper";
import { PageNodeAttributes, PageContentPixelDimensions } from "../types/page";
import { Nullable } from "../types/record";
import { getPageAttribute, isPageNode } from "./page";
import { mmToPixels } from "./window";
import { nodeHasAttribute } from "./node";
import { setPageNodeAttribute } from "./setPageAttributes";
import { PAGE_NODE_ATTR_KEYS } from "../constants/page";

/**
 * Check if the given paper size is valid.
 * @param paperSize - The paper size to check.
 * @returns {boolean} True if the paper size is valid, false otherwise.
 */
export const isValidPaperSize = (paperSize: PaperSize): boolean => {
    return paperSize in paperDimensions;
};

/**
 * Given a paper size, return the dimensions of the paper
 * @param paperSize - The paper size
 * @param orientation - The orientation of the paper
 * @returns {PaperDimensions} - The dimensions of the paper
 */
export const getPaperDimensions = (paperSize: PaperSize, orientation: PaperOrientation): PaperDimensions => {
    if (!isValidPaperSize(paperSize)) {
        paperSize = DEFAULT_PAPER_SIZE;
    }

    const dimensions = paperDimensions[paperSize];
    if (orientation === "landscape") {
        return flipDimensions(dimensions);
    } else {
        return dimensions;
    }
};

/**
 * Flips the width and height of a given set of dimensions.
 * @param dimensions - The dimensions to flip.
 * @returns {PaperDimensions} The flipped dimensions.
 */
export const flipDimensions = (dimensions: PaperDimensions): PaperDimensions => {
    return { width: dimensions.height, height: dimensions.width };
};

/**
 * Calculates the pixel width and height of a given paper size. Excludes page
 * margins as we are only calculating the area where content can be added.
 * @param pageNodeAttributes - The attributes of the page node.
 * @returns {PageContentPixelDimensions} The height and width of the page in pixels.
 */
export const calculatePageContentPixelDimensions = (pageNodeAttributes: PageNodeAttributes): PageContentPixelDimensions => {
    const { paperSize, paperOrientation, pageMargins } = pageNodeAttributes;
    const { top, right, bottom, left } = pageMargins;
    const { width, height } = getPaperDimensions(paperSize, paperOrientation);
    const pageHeight = mmToPixels(height - (top + bottom));
    const pageWidth = mmToPixels(width - (left + right));

    return { pageContentHeight: pageHeight, pageContentWidth: pageWidth };
};

/**
 * Check if a page node has a paper size attribute.
 * @param pageNode - The page node to check.
 * @returns {boolean} True if the page node has a paper size attribute, false otherwise.
 */
export const pageNodeHasPageSize = (pageNode: PMNode): boolean => {
    return nodeHasAttribute(pageNode, PAGE_NODE_ATTR_KEYS.paperSize);
};

/**
 * Get the paper size of a particular page node in the document.
 * @param pageNode - The page node to find the paper size for
 * @returns {Nullable<PaperSize>} The paper size of the specified page or null
 * if the paper size is not set.
 */
export const getPageNodePaperSize = (pageNode: PMNode): Nullable<PaperSize> => {
    const { attrs } = pageNode;
    return attrs[PAGE_NODE_ATTR_KEYS.paperSize];
};

/**
 * Retrieves the paper size of a specific page using the editor instance.
 * Falls back to the default paper size if the page number is invalid.
 * @param context - The current editor instance or editor state.
 * @param pageNum - The page number to retrieve the paper size for.
 * @returns {PaperSize} The paper size of the specified page or default.
 */
export const getPageNumPaperSize = (context: Editor | EditorState, pageNum: number): PaperSize => {
    const getDefault = context instanceof Editor ? context.commands.getDefaultPaperSize : () => DEFAULT_PAPER_SIZE;
    return getPageAttribute(context, pageNum, getDefault, getPageNodePaperSize);
};

/**
 * Set the paper size for a page node at the specified position.
 * @param tr - The transaction to apply the change to.
 * @param dispatch - The dispatch function to apply the transaction.
 * @param pagePos - The position of the page node to set the paper size for.
 * @param paperSize - The paper size to set.
 * @returns {boolean} True if the paper size was set, false otherwise.
 */
export const setPagePaperSize = (tr: Transaction, dispatch: Dispatch, pagePos: number, paperSize: PaperSize): boolean => {
    const pageNode = tr.doc.nodeAt(pagePos);
    if (!pageNode) {
        console.error("No node found at pos:", pagePos);
        return false;
    }

    return setPageNodePosPaperSize(tr, dispatch, pagePos, pageNode, paperSize);
};

/**
 * Helper to set the paper size for a page node at the specified position.
 * @param tr - The transaction to apply the change to.
 * @param dispatch - The dispatch function to apply the transaction.
 * @param pagePos - The position of the page node to set the paper size for.
 * @param pageNode - The page node to set the paper size for.
 * @param paperSize - The paper size to set.
 * @returns {boolean} True if the paper size was set, false otherwise.
 */
export const setPageNodePosPaperSize = (
    tr: Transaction,
    dispatch: Dispatch,
    pagePos: number,
    pageNode: PMNode,
    paperSize: PaperSize
): boolean => {
    if (!dispatch) return false;

    if (!isValidPaperSize(paperSize)) {
        console.warn(`Invalid paper size: ${paperSize}`);
        return false;
    }

    if (!isPageNode(pageNode)) {
        console.error("Unexpected! Node at pos:", pagePos, "is not a page node!");
        return false;
    }

    if (getPageNodePaperSize(pageNode) === paperSize) {
        // Paper size is already set
        return false;
    }

    setPageNodeAttribute(tr, pagePos, pageNode, PAGE_NODE_ATTR_KEYS.paperSize, paperSize);

    dispatch(tr);
    return true;
};
