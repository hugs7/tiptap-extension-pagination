/**
 * @file /src/PaginationExtension.ts
 * @name Pagination
 * @description Custom pagination extension for the Tiptap editor.
 */

import { Extension, isNodeEmpty } from "@tiptap/core";
import { keymap } from "@tiptap/pm/keymap";
import { DEFAULT_PAPER_SIZE } from "./constants/paperSize";
import { DEFAULT_PAPER_COLOUR } from "./constants/paperColours";
import { DEFAULT_MARGIN_CONFIG } from "./constants/pageMargins";
import { DEFAULT_PAPER_ORIENTATION } from "./constants/paperOrientation";
import { PAGE_NODE_ATTR_KEYS } from "./constants/page";
import { DEFAULT_PAGE_BORDER_CONFIG } from "./constants/pageBorders";
import { PAGE_SECTION_NODE_ATTR_KEYS } from "./constants/pageSection";
import { BorderConfig, MultiSide, MarginConfig, PaperOrientation, PaperSize } from "./types/paper";
import PageSectionType from "./types/pageSection";
import PaginationPlugin from "./Plugins/Pagination";
import {
    getNextParagraph,
    getParagraphNodeAndPosition,
    getPreviousParagraph,
    getThisPageNodePosition,
    isAtStartOrEndOfParagraph,
    isParagraphNode,
    isPosAtEndOfPage,
    isPosAtStartOfDocument,
    isPosAtStartOfPage,
    isPositionWithinParagraph,
    isTextNode,
} from "./utils/pagination";
import {
    isHighlighting,
    getResolvedPosition,
    setSelectionAtPos,
    setSelection,
    moveToNextTextBlock,
    moveToNearestTextSelection,
    moveToPreviousTextBlock,
    setSelectionToEndOfParagraph,
} from "./utils/selection";
import { appendAndReplaceNode, deleteNode } from "./utils/node";
import { getPageNodeByPageNum, getPageNodePosByPageNum, isPageNode } from "./utils/page";
import { isValidPaperSize, pageNodeHasPageSize, setPageNodePosPaperSize, setPagePaperSize } from "./utils/paperSize";
import { getDeviceThemePaperColour, setPageNodePosPaperColour } from "./utils/paperColour";
import { setPageNodesAttribute } from "./utils/setPageAttributes";
import { setPageNodePosPaperOrientation } from "./utils/paperOrientation";
import { isMarginValid, isValidPageMargins, setPageSectionNodePosPageMargins, updatePageSectionMargin } from "./utils/pageSection/margins";
import { isBorderValid, isValidPageBorders, setPageNodePosPageBorders, updatePageBorder } from "./utils/pageBorders";
import { setDocumentSideConfig, setDocumentSideValue, setPageSideConfig, setPageSideValue } from "./utils/setSideConfig";

export interface PaginationOptions {
    /**
     * The default paper size for the document. Note this is only the default
     * so you can have settings in your editor which change the paper size.
     * This is only the setting for new documents.
     * @default "A4"
     * @example "A3"
     */
    defaultPaperSize: PaperSize;

    /**
     * The default paper colour for the document. Note this is only the default
     * so you can have settings in your editor which change the paper colour.
     * This is only the setting for new documents.
     * @default "#fff"
     * @example "#f0f0f0"
     */
    defaultPaperColour: string;

    /**
     * Whether to use the device theme to set the paper colour.
     * If enabled, the default paper colour will be ignored.
     * @default false
     * @example true | false
     */
    useDeviceThemeForPaperColour: boolean;

    /**
     * The default paper orientation for the document. Note this is only the default
     * so you can have settings in your editor which change the paper orientation.
     * This is only the setting for new documents.
     * @default "portrait"
     * @example "portrait" | "landscape"
     */
    defaultPaperOrientation: PaperOrientation;

    /**
     * The default margin configuration for the document. Note this is only the default
     * so you can have settings in your editor which change the margin configuration.
     * This is only the setting for new documents.
     * @default { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 }
     * @example { top: 10, right: 10, bottom: 10, left: 10 }
     */
    defaultMarginConfig: MarginConfig;

    /**
     * The default border configuration for the document. This controls the thickness
     * of the borders on the page. Note this is only the default so you can have
     * settings in your editor which change the border configuration. This is only
     * the setting for new documents.
     * @default { top: 1, right: 1, bottom: 1, left: 1 }
     * @example { top: 2, right: 2, bottom: 2, left: 2 }
     */
    defaultPageBorders: BorderConfig;
}

declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        page: {
            /**
             * Get the default paper size
             * @returns {PaperSize} The default paper size
             * @example editor.commands.getDefaultPaperSize()
             */
            getDefaultPaperSize: () => PaperSize;

            /**
             * Set the paper size
             * @param paperSize The paper size
             * @example editor.commands.setDocumentPaperSize("A4")
             */
            setDocumentPaperSize: (paperSize: PaperSize) => ReturnType;

            /**
             * Set the default paper size
             * @example editor.commands.setDocumentDefaultPaperSize()
             */
            setDocumentDefaultPaperSize: () => ReturnType;

            /**
             * Set the paper size for a specific page
             * @param pageNum The page number (0-indexed)
             * @param paperSize The paper size
             * @example editor.commands.setPagePaperSize(0, "A4")
             */
            setPagePaperSize: (pageNum: number, paperSize: PaperSize) => ReturnType;

            /**
             * Checks the paper sizes are set for each page in the document.
             * Sets the default paper size if not set.
             * @example editor.commands.checkPaperSizes()
             */
            checkPaperSizes: () => ReturnType;

            /**
             * Get the default paper colour
             * @returns {string} The default paper colour
             * @example editor.commands.getDefaultPaperColour()
             */
            getDefaultPaperColour: () => string;

            /**
             * Set the paper colour for the document
             * @param paperColour The paper colour
             * @example editor.commands.setDocumentPaperColour("#fff")
             */
            setDocumentPaperColour: (paperColour: string) => ReturnType;

            /**
             * Set the default paper colour
             * @example editor.commands.setDocumentDefaultPaperColour()
             */
            setDocumentDefaultPaperColour: () => ReturnType;

            /**
             * Set the paper colour for a specific page
             * @param pageNum The page number (0-indexed)
             * @param paperColour The paper colour
             * @example editor.commands.setPagePaperColour(0, "#fff")
             */
            setPagePaperColour: (pageNum: number, paperColour: string) => ReturnType;

            /**
             * Get the default paper orientation
             * @returns {PaperOrientation} The default paper orientation
             * @example editor.commands.getDefaultPaperOrientation()
             */
            getDefaultPaperOrientation: () => PaperOrientation;

            /**
             * Set the paper orientation for the document
             * @param paperOrientation The paper orientation
             * @example editor.commands.setDocumentPaperOrientation("portrait") | editor.commands.setDocumentPaperOrientation("landscape")
             */
            setDocumentPaperOrientation: (paperOrientation: PaperOrientation) => ReturnType;

            /**
             * Set the default paper orientation
             * @example editor.commands.setDocumentDefaultPaperOrientation()
             */
            setDocumentDefaultPaperOrientation: () => ReturnType;

            /**
             * Set the paper orientation for a specific page
             * @param pageNum The page number (0-indexed)
             * @param paperOrientation The paper orientation
             * @example editor.commands.setPagePaperOrientation(0, "portrait") | editor.commands.setPagePaperOrientation(0, "landscape")
             */
            setPagePaperOrientation: (pageNum: number, paperOrientation: PaperOrientation) => ReturnType;

            /**
             * Get the default page margins
             * @param sectionType The type of page section to get the margins for
             * @returns {MarginConfig} The default page margins
             * @example editor.commands.getDefaultPageMargins()
             */
            getDefaultPageSectionMargins: (sectionType: PageSectionType) => MarginConfig;

            /**
             * Set the page margins for the document
             * @param pageMargins The page margins (top, right, bottom, left)
             * @example editor.commands.setDocumentPageMargins({ top: 10, right: 15, bottom: 10, left: 15 })
             */
            setDocumentPageMargins: (pageMargins: MarginConfig) => ReturnType;

            /**
             * Set the default page margins
             * @example editor.commands.setDocumentDefaultPageMargins()
             */
            setDocumentDefaultPageMargins: () => ReturnType;

            /**
             * Set the page margins for a specific page
             * @param pageNum The page number (0-indexed)
             * @param pageMargins The page margins
             * @example editor.commands.setPagePageMargins(0, { top: 10, right: 15, bottom: 10, left: 15 })
             */
            setPagePageMargins: (pageNum: number, pageMargins: MarginConfig) => ReturnType;

            /**
             * Set a margin for the document on a specific side
             * @param margin The margin to set (top, right, bottom, left, x, y, all)
             * @param value The value to set the margin to
             * @example editor.commands.setDocumentPageMargin("top", 10)
             */
            setDocumentPageMargin: (margin: MultiSide, value: number) => ReturnType;

            /**
             * Set a margin for a specific page on a specific side
             * @param pageNum The page number (0-indexed)
             * @param margin The margin to set (top, right, bottom, left, x, y, all)
             * @param value The value to set the margin to
             * @example editor.commands.setPagePageMargin(0, "top", 10)
             */
            setPagePageMargin: (pageNum: number, margin: MultiSide, value: number) => ReturnType;

            /**
             * Get the default page borders
             * @returns {BorderConfig} The default page borders
             * @example editor.commands.getDefaultPageBorders()
             */
            getDefaultPageBorders: () => BorderConfig;

            /**
             * Set the page borders for the document
             * @param pageBorders The page borders (top, right, bottom, left)
             * @example editor.commands.setDocumentPageBorders({ top: 2, right: 2, bottom: 2, left: 2 })
             */
            setDocumentPageBorders: (pageBorders: BorderConfig) => ReturnType;

            /**
             * Set the default page borders
             * @example editor.commands.setDocumentDefaultPageBorders()
             */
            setDocumentDefaultPageBorders: () => ReturnType;

            /**
             * Set the page borders for a specific page
             * @param pageNum The page number (0-indexed)
             * @param pageBorders The page borders
             * @example editor.commands.setPageBorders(0, { top: 2, right: 2, bottom: 2, left: 2 })
             */
            setPageBorders: (pageNum: number, pageBorders: BorderConfig) => ReturnType;

            /**
             * Set a border for the document on a specific side
             * @param border The border to set (top, right, bottom, left, all)
             * @param value The value to set the border to
             */
            setDocumentPageBorder: (border: MultiSide, value: number) => ReturnType;

            /**
             * Set a border for a specific page on a specific side
             * @param pageNum The page number (0-indexed)
             * @param border The border to set (top, right, bottom, left, all)
             * @param value The value to set the border to
             */
            setPagePageBorder: (pageNum: number, border: MultiSide, value: number) => ReturnType;
        };
    }
}

const PaginationExtension = Extension.create<PaginationOptions>({
    name: "pagination",

    addOptions() {
        return {
            defaultPaperSize: DEFAULT_PAPER_SIZE,
            defaultPaperColour: DEFAULT_PAPER_COLOUR,
            useDeviceThemeForPaperColour: false,
            defaultPaperOrientation: DEFAULT_PAPER_ORIENTATION,
            defaultMarginConfig: DEFAULT_MARGIN_CONFIG,
            defaultPageBorders: DEFAULT_PAGE_BORDER_CONFIG,
        };
    },

    onCreate() {
        this.editor.commands.checkPaperSizes();
    },

    addProseMirrorPlugins() {
        return [
            keymap({
                Enter: (state, dispatch) => {
                    if (!dispatch) {
                        console.warn("No dispatch function provided");
                        return false;
                    }

                    if (isHighlighting(state)) {
                        return false;
                    }

                    const { doc, tr, schema, selection } = state;
                    const { from } = selection;
                    const $pos = getResolvedPosition(state);

                    // Ensure that the position is within a valid block (paragraph)
                    if (!isPositionWithinParagraph($pos)) {
                        console.warn("Not inside a paragraph node");
                        return false;
                    }

                    const { paragraphNode } = getParagraphNodeAndPosition(doc, $pos);
                    if (!paragraphNode) {
                        console.warn("No current paragraph node found");
                        return false;
                    }

                    // Create a new empty paragraph node
                    const newParagraph = schema.nodes.paragraph.create();
                    console.log("Inserting new paragraph at position", from);

                    if (isNodeEmpty(paragraphNode)) {
                        tr.insert(from, newParagraph);
                    } else {
                        if (isAtStartOrEndOfParagraph(doc, $pos)) {
                            tr.replaceSelectionWith(newParagraph);
                        } else {
                            const remainingContent = paragraphNode.content.cut($pos.parentOffset);
                            const newContentParagraph = schema.nodes.paragraph.create({}, remainingContent);
                            tr.replaceWith($pos.pos, $pos.pos + remainingContent.size, newContentParagraph);
                        }
                    }

                    const newSelection = moveToNextTextBlock(tr, from);
                    setSelection(tr, newSelection);
                    dispatch(tr);
                    return true;
                },
                Backspace: (state, dispatch) => {
                    if (!dispatch) {
                        console.warn("No dispatch function provided");
                        return false;
                    }

                    if (isHighlighting(state)) {
                        return false;
                    }

                    const { doc, tr, schema } = state;
                    const $pos = getResolvedPosition(state);
                    const thisNodePos = $pos.pos;

                    // Ensure that the position is within a valid block (paragraph)
                    if (!isPositionWithinParagraph($pos)) {
                        return false;
                    }

                    if (isPosAtEndOfPage(doc, $pos)) {
                        // Traverse $pos.path to find the nearest page node
                        const { paragraphPos, paragraphNode } = getParagraphNodeAndPosition(doc, $pos);
                        if (!paragraphNode) {
                            console.warn("No current paragraph node found");
                            return false;
                        }

                        if (isNodeEmpty(paragraphNode)) {
                            deleteNode(tr, paragraphPos, paragraphNode);
                            const selection = moveToPreviousTextBlock(tr, paragraphPos);
                            setSelection(tr, selection);
                        } else {
                            // Remove the last character from the current paragraph
                            const newContent = paragraphNode.content.cut(0, paragraphNode.content.size - 1);
                            const newParagraph = schema.nodes.paragraph.create({}, newContent);
                            tr.replaceWith(paragraphPos, paragraphPos + paragraphNode.nodeSize, newParagraph);
                            setSelectionAtPos(tr, thisNodePos - 1);
                        }
                    } else if (isPosAtStartOfDocument(doc, $pos, true)) {
                        // Prevent deleting the first page node
                        return true;
                    } else if (!isPosAtStartOfPage(doc, $pos)) {
                        return false;
                    } else {
                        // Traverse $pos.path to find the nearest page node
                        const thisPageNodePos = getThisPageNodePosition(doc, $pos);
                        const firstChildPos = thisPageNodePos + 1;
                        if (firstChildPos !== thisNodePos - 1) {
                            // Not at the beginning of the page
                            return false;
                        }

                        const prevPageChild = doc.childBefore(thisPageNodePos);
                        const prevPageNode = prevPageChild.node;

                        // Confirm that the previous node is a page node
                        if (!prevPageNode) {
                            // Start of document
                            console.log("No previous page node found");
                            return false;
                        }

                        if (!isPageNode(prevPageNode)) {
                            console.warn("Previous node is not a page node");
                            return false;
                        }

                        // Append the content of the current paragraph to the end of the previous paragraph
                        const { paragraphPos, paragraphNode } = getParagraphNodeAndPosition(doc, $pos);
                        if (!paragraphNode) {
                            console.warn("No current paragraph node found");
                            return false;
                        }

                        const { prevParagraphPos, prevParagraphNode } = getPreviousParagraph(doc, paragraphPos);
                        if (!prevParagraphNode) {
                            console.warn("No previous paragraph node found");
                            return false;
                        }

                        if (!isNodeEmpty(prevParagraphNode) || !isNodeEmpty(paragraphNode)) {
                            deleteNode(tr, paragraphPos, paragraphNode);
                        }

                        appendAndReplaceNode(tr, prevParagraphPos, prevParagraphNode, paragraphNode);

                        // Set the selection to the end of the previous paragraph
                        setSelectionToEndOfParagraph(tr, prevParagraphPos, prevParagraphNode);
                    }

                    dispatch(tr);
                    return true;
                },
                Delete: (state, dispatch) => {
                    if (!dispatch) {
                        console.warn("No dispatch function provided");
                        return false;
                    }

                    if (isHighlighting(state)) {
                        return false;
                    }

                    const { doc, tr } = state;
                    const $pos = getResolvedPosition(state);

                    // Ensure that the position is within a valid block (paragraph)
                    if (!isPositionWithinParagraph($pos)) {
                        console.warn("Not inside a paragraph node");
                        return false;
                    }

                    if (!isPosAtEndOfPage(doc, $pos)) {
                        return false;
                    }

                    // We need to remove the current paragraph node and prepend any
                    // content to the next paragraph node (which will now be at the
                    // end of the current page)
                    const thisPos = $pos.pos;
                    const expectedTextNodePos = thisPos - 1;
                    const thisTextNode = doc.nodeAt(expectedTextNodePos);
                    if (!thisTextNode) {
                        console.warn("No node found at position", expectedTextNodePos);
                        return false;
                    }

                    const { paragraphPos, paragraphNode } = getParagraphNodeAndPosition(doc, $pos);
                    if (!paragraphNode) {
                        console.warn("No current paragraph node found");
                        return false;
                    }

                    if (!isParagraphNode(thisTextNode) && !isTextNode(thisTextNode)) {
                        console.warn("Unexpected node type found at position", expectedTextNodePos);
                        return false;
                    }

                    const thisPageChild = doc.childAfter(paragraphPos);
                    if (!isPageNode(thisPageChild.node)) {
                        console.warn("No page node found");
                        return false;
                    }

                    const pageNum = thisPageChild.index;
                    const nextPageNum = pageNum + 1;
                    if (nextPageNum > doc.childCount - 1) {
                        console.log("At end of document");
                        // If we don't handle the delete, the default behaviour will remove this
                        // paragraph node, which we don't want.
                        dispatch(tr);
                        return true;
                    }

                    const nextPageNode = getPageNodeByPageNum(doc, nextPageNum);
                    if (!nextPageNode) {
                        console.log("No next page node found");
                        return false;
                    }

                    const { nextParagraphPos, nextParagraphNode } = getNextParagraph(doc, thisPos);
                    if (!nextParagraphNode) {
                        console.log("No first paragraph node found");
                        return false;
                    }

                    const thisNodeEmpty = isNodeEmpty(paragraphNode);
                    const nextNodeEmpty = isNodeEmpty(nextParagraphNode);
                    if (!nextNodeEmpty) {
                        deleteNode(tr, nextParagraphPos, nextParagraphNode);
                    }

                    appendAndReplaceNode(tr, paragraphPos, paragraphNode, nextParagraphNode);

                    if (thisNodeEmpty) {
                        const $newPos = tr.doc.resolve(thisPos);
                        if (nextNodeEmpty) {
                            moveToNextTextBlock(tr, $newPos);
                        } else {
                            moveToNearestTextSelection(tr, $newPos);
                        }
                    } else {
                        setSelectionAtPos(tr, thisPos);
                    }

                    dispatch(tr);
                    return true;
                },
            }),
            PaginationPlugin,
        ];
    },

    addCommands() {
        return {
            getDefaultPaperSize: () => this.options.defaultPaperSize,

            setDocumentPaperSize:
                (paperSize: PaperSize) =>
                ({ tr, dispatch }) => {
                    if (!dispatch) return false;

                    if (!isValidPaperSize(paperSize)) {
                        console.warn(`Invalid paper size: ${paperSize}`);
                        return false;
                    }

                    setPageNodesAttribute(tr, PAGE_NODE_ATTR_KEYS.paperSize, paperSize);

                    dispatch(tr);
                    return true;
                },

            setDocumentDefaultPaperSize:
                () =>
                ({ editor }) =>
                    editor.commands.setDocumentPaperSize(this.options.defaultPaperSize),

            setPagePaperSize:
                (pageNum: number, paperSize: PaperSize) =>
                ({ tr, dispatch }) => {
                    const { doc } = tr;

                    const pageNodePos = getPageNodePosByPageNum(doc, pageNum);
                    if (!pageNodePos) {
                        return false;
                    }

                    const { pos: pagePos, node: pageNode } = pageNodePos;

                    return setPageNodePosPaperSize(tr, dispatch, pagePos, pageNode, paperSize);
                },

            checkPaperSizes:
                () =>
                ({ tr, dispatch }) => {
                    const { doc } = tr;
                    const paperSizeUpdates: boolean[] = [];
                    doc.forEach((node, pos) => {
                        if (isPageNode(node)) {
                            if (!pageNodeHasPageSize(node)) {
                                paperSizeUpdates.push(setPagePaperSize(tr, dispatch, pos, this.options.defaultPaperSize));
                            }
                        }
                    });

                    // If any page sizes were updated
                    return paperSizeUpdates.some((update) => update);
                },

            getDefaultPaperColour: () => {
                if (this.options.useDeviceThemeForPaperColour) {
                    return getDeviceThemePaperColour();
                } else {
                    return this.options.defaultPaperColour;
                }
            },

            setDocumentPaperColour:
                (paperColour: string) =>
                ({ tr, dispatch }) => {
                    if (!dispatch) return false;

                    setPageNodesAttribute(tr, PAGE_NODE_ATTR_KEYS.paperColour, paperColour);

                    dispatch(tr);
                    return true;
                },

            setDocumentDefaultPaperColour:
                () =>
                ({ editor }) => {
                    const { commands } = editor;
                    const defaultPaperColour = commands.getDefaultPaperColour();
                    return commands.setDocumentPaperColour(defaultPaperColour);
                },

            setPagePaperColour:
                (pageNum: number, paperColour: string) =>
                ({ tr, dispatch }) => {
                    const { doc } = tr;

                    const pageNodePos = getPageNodePosByPageNum(doc, pageNum);
                    if (!pageNodePos) {
                        return false;
                    }

                    const { pos: pagePos, node: pageNode } = pageNodePos;

                    return setPageNodePosPaperColour(tr, dispatch, pagePos, pageNode, paperColour);
                },

            getDefaultPaperOrientation: () => {
                return this.options.defaultPaperOrientation;
            },

            setDocumentPaperOrientation:
                (paperOrientation: PaperOrientation) =>
                ({ tr, dispatch }) => {
                    if (!dispatch) return false;

                    setPageNodesAttribute(tr, PAGE_NODE_ATTR_KEYS.paperOrientation, paperOrientation);

                    dispatch(tr);
                    return true;
                },

            setDocumentDefaultPaperOrientation:
                () =>
                ({ editor }) =>
                    editor.commands.setDocumentPaperOrientation(this.options.defaultPaperOrientation),

            setPagePaperOrientation:
                (pageNum: number, paperOrientation: PaperOrientation) =>
                ({ tr, dispatch }) => {
                    const { doc } = tr;

                    const pageNodePos = getPageNodePosByPageNum(doc, pageNum);
                    if (!pageNodePos) {
                        return false;
                    }

                    const { pos: pagePos, node: pageNode } = pageNodePos;

                    return setPageNodePosPaperOrientation(tr, dispatch, pagePos, pageNode, paperOrientation);
                },

            getDefaultPageSectionMargins: (sectionType: PageSectionType) => {
                switch (sectionType) {
                    case "header":
                    case "footer":
                        return { ...this.options.defaultMarginConfig, top: 0, bottom: 0 };
                    case "body":
                        return this.options.defaultMarginConfig;
                }
            },

            setDocumentPageMargins: setDocumentSideConfig(PAGE_SECTION_NODE_ATTR_KEYS.pageMargins, isValidPageMargins),

            setDocumentDefaultPageMargins:
                () =>
                ({ editor }) =>
                    editor.commands.setDocumentPageMargins(this.options.defaultMarginConfig),

            setPagePageMargins: setPageSideConfig(setPageSectionNodePosPageMargins),

            setDocumentPageMargin:
                (margin: MultiSide, value: number) =>
                ({ tr, dispatch, editor }) =>
                    setDocumentSideValue(editor.commands.setDocumentPageMargins, isMarginValid, updatePageSectionMargin)(margin, value)({
                        tr,
                        dispatch,
                    }),

            setPagePageMargin:
                (pageNum: number, margin: MultiSide, value: number) =>
                ({ tr, dispatch, editor }) =>
                    setPageSideValue(editor.commands.setPagePageMargins, isMarginValid, updatePageSectionMargin)(pageNum, margin, value)({
                        tr,
                        dispatch,
                    }),

            getDefaultPageBorders: () => {
                return this.options.defaultPageBorders;
            },

            setDocumentPageBorders: setDocumentSideConfig(PAGE_NODE_ATTR_KEYS.pageBorders, isValidPageBorders),

            setDocumentDefaultPageBorders:
                () =>
                ({ editor }) => {
                    return editor.commands.setDocumentPageBorders(this.options.defaultPageBorders);
                },

            setPageBorders: setPageSideConfig(setPageNodePosPageBorders),

            setDocumentPageBorder:
                (border: MultiSide, value: number) =>
                ({ tr, dispatch, editor }) =>
                    setDocumentSideValue(editor.commands.setDocumentPageBorders, isBorderValid, updatePageBorder)(border, value)({
                        tr,
                        dispatch,
                    }),

            setPagePageBorder:
                (pageNum: number, border: MultiSide, value: number) =>
                ({ tr, dispatch, editor }) =>
                    setPageSideValue(editor.commands.setPageBorders, isBorderValid, updatePageBorder)(pageNum, border, value)({
                        tr,
                        dispatch,
                    }),
        };
    },
});

export default PaginationExtension;
