/**
 * @file /src/utils/pagination.ts
 * @name Pagination
 * @description Utility functions for paginating the editor content.
 */

import { Node as PMNode, ResolvedPos } from "@tiptap/pm/model";
import { EditorState, Transaction } from "@tiptap/pm/state";
import { EditorView } from "@tiptap/pm/view";
import { MIN_PARAGRAPH_HEIGHT } from "../constants/tiptap";
import { PAGE_NODE_NAME } from "../constants/page";
import { NodePosArray } from "../types/node";
import { CursorMap } from "../types/cursor";
import { Nullable } from "../types/record";
import { getParentNodePosOfType, getPositionNodeType, isNodeEmpty } from "./node";
import {
    moveToNearestValidCursorPosition,
    moveToNextTextBlock,
    moveToPreviousTextBlock,
    moveToThisTextBlock,
    setSelection,
    setSelectionAtEndOfDocument,
} from "./selection";
import { inRange } from "./math";
import { collectPageNodes, isPageNode, isPageNumInRange } from "./page";
import { getCalculatedPageNodeAttributes } from "./getPageAttributes";

/**
 * Check if the given node is a paragraph node.
 * @param node - The node to check.
 * @returns {boolean} True if the node is a paragraph node, false otherwise.
 */
export const isParagraphNode = (node: Nullable<PMNode>): boolean => {
    if (!node) {
        console.warn("No node provided");
        return false;
    }

    return node.type.name === "paragraph";
};

/**
 * Check if the given node is a text node.
 * @param node - The node to check.
 * @returns {boolean} True if the node is a text node, false otherwise.
 */
export const isTextNode = (node: Nullable<PMNode>): boolean => {
    if (!node) {
        console.warn("No node provided");
        return false;
    }

    return node.type.name === "text";
};

/**
 * Get the type of the node at the specified position.
 * @param $pos - The resolved position in the document.
 * @returns The type of the node at the specified position.
 */
export const isPositionWithinParagraph = ($pos: ResolvedPos): boolean => {
    return getPositionNodeType($pos) === "paragraph";
};

/**
 * Get the page node (parent of the current node) position.
 * @param doc - The document node.
 * @param pos - The resolved position in the document or the absolute position of the node.
 * @returns {number} The position of the page node.
 */
export const getThisPageNodePosition = (doc: PMNode, pos: ResolvedPos | number): number => {
    return getParentNodePosOfType(doc, pos, PAGE_NODE_NAME).pos;
};

/**
 * Get the paragraph node position.
 * @param doc - The document node.
 * @param pos - The resolved position in the document or the absolute position of the node.
 * @returns {number} The position of the paragraph node.
 */
export const getThisParagraphNodePosition = (doc: PMNode, pos: ResolvedPos | number): number => {
    return getParentNodePosOfType(doc, pos, "paragraph").pos;
};

/**
 * Get the page node position and the page node itself.
 * @param doc - The document node.
 * @param pos - The resolved position in the document or the absolute position of the node.
 * @returns {pagePos: number, pageNode: Node} The position and the node of the page.
 */
export const getPageNodeAndPosition = (doc: PMNode, pos: ResolvedPos | number): { pagePos: number; pageNode: Nullable<PMNode> } => {
    if (typeof pos === "number") {
        return getPageNodeAndPosition(doc, doc.resolve(pos));
    }

    const pagePos = getThisPageNodePosition(doc, pos);
    const pageNode = doc.nodeAt(pagePos);
    if (!isPageNode(pageNode)) {
        console.warn("No page node found");
        return { pagePos: -1, pageNode };
    }

    return { pagePos, pageNode };
};

/**
 * Get the paragraph node position and the paragraph node itself.
 * @param doc - The document node.
 * @param pos - The resolved position in the document or the absolute position of the node.
 * @returns {paragraphPos: number, paragraphNode: Node} The position and the node of the paragraph.
 */
export const getParagraphNodeAndPosition = (
    doc: PMNode,
    pos: ResolvedPos | number
): { paragraphPos: number; paragraphNode: Nullable<PMNode> } => {
    if (typeof pos === "number") {
        return getParagraphNodeAndPosition(doc, doc.resolve(pos));
    }

    if (isPosAtStartOfDocument(doc, pos)) {
        // Find the next paragraph node
        const { nextParagraphPos, nextParagraphNode } = getNextParagraph(doc, pos.pos);
        return { paragraphPos: nextParagraphPos, paragraphNode: nextParagraphNode };
    } else if (isPosAtEndOfDocument(doc, pos)) {
        // Find the previous paragraph node
        const { prevParagraphPos, prevParagraphNode } = getPreviousParagraph(doc, pos.pos);
        return { paragraphPos: prevParagraphPos, paragraphNode: prevParagraphNode };
    }

    const paragraphPos = getThisParagraphNodePosition(doc, pos);
    const paragraphNode = doc.nodeAt(paragraphPos);
    if (!isParagraphNode(paragraphNode)) {
        console.warn("No paragraph node found");
        return { paragraphPos: -1, paragraphNode };
    }

    return { paragraphPos, paragraphNode };
};

/**
 * Get the start of the page position.
 * @param doc - The document node.
 * @param pos - The resolved position in the document or the absolute position of the node.
 * @returns {number} The start position of the page.
 */
export const getStartOfPagePosition = (doc: PMNode, pos: ResolvedPos | number): number => {
    if (typeof pos === "number") {
        return getStartOfPagePosition(doc, doc.resolve(pos));
    }

    const { pagePos } = getPageNodeAndPosition(doc, pos);

    return pagePos;
};

/**
 * Get the start of the paragraph position.
 * @param doc - The document node.
 * @param pos - The resolved position in the document or the absolute position of the node.
 * @returns {number} The start position of the paragraph.
 */
export const getStartOfParagraphPosition = (doc: PMNode, pos: ResolvedPos | number): number => {
    if (typeof pos === "number") {
        return getStartOfParagraphPosition(doc, doc.resolve(pos));
    }

    const { paragraphPos } = getParagraphNodeAndPosition(doc, pos);
    return paragraphPos;
};

/**
 * Get the start of the page and paragraph positions.
 * @param doc - The document node.
 * @param pos - The resolved position in the document or the absolute position of the node.
 * @returns {startOfPagePos: number, startOfParagraphPos: number} The start positions of the page and paragraph.
 */
export const getStartOfPageAndParagraphPosition = (
    doc: PMNode,
    pos: ResolvedPos | number
): { startOfPagePos: number; startOfParagraphPos: number } => {
    const startOfParagraphPos = getStartOfParagraphPosition(doc, pos);
    const startOfPagePos = getStartOfPagePosition(doc, pos);

    return { startOfPagePos, startOfParagraphPos };
};

/**
 * Get the end of the page position.
 * @param doc - The document node.
 * @param pos - The resolved position in the document or the absolute position of the node.
 * @returns {number} The end position of the page.
 */
export const getEndOfPagePosition = (doc: PMNode, pos: ResolvedPos | number): number => {
    if (typeof pos === "number") {
        return getEndOfPagePosition(doc, doc.resolve(pos));
    }

    const { pagePos, pageNode } = getPageNodeAndPosition(doc, pos);
    if (!pageNode) {
        return pagePos;
    }

    return pagePos + pageNode.content.size;
};

/**
 * Get the end of the paragraph position.
 * @param doc - The document node.
 * @param pos - The resolved position in the document or the absolute position of the node.
 * @returns {number} The end position of the paragraph.
 */
export const getEndOfParagraphPosition = (doc: PMNode, $pos: ResolvedPos | number): number => {
    if (typeof $pos === "number") {
        return getEndOfParagraphPosition(doc, doc.resolve($pos));
    }

    const { paragraphPos, paragraphNode } = getParagraphNodeAndPosition(doc, $pos);
    if (!paragraphNode) {
        return paragraphPos;
    }

    return paragraphPos + paragraphNode.content.size;
};

/**
 * Get the end of the page and paragraph positions.
 * @param doc - The document node.
 * @param pos - The resolved position in the document or the absolute position of the node.
 * @returns {endOfPagePos: number, endOfParagraphPos: number} The end positions of the page and paragraph.
 */
export const getEndOfPageAndParagraphPosition = (
    doc: PMNode,
    $pos: ResolvedPos | number
): { endOfPagePos: number; endOfParagraphPos: number } => {
    const endOfParagraphPos = getEndOfParagraphPosition(doc, $pos);
    const endOfPagePos = getEndOfPagePosition(doc, $pos);

    return { endOfPagePos, endOfParagraphPos };
};

/**
 * Check if the editor is currently highlighting text.
 * @param state - The current editor state.
 * @returns True if text is currently highlighted, false otherwise.
 */
const isPosMatchingStartOfPageCondition = (doc: PMNode, $pos: ResolvedPos | number, checkExactStart: boolean): boolean => {
    // Resolve position if given as a number
    if (typeof $pos === "number") {
        return isPosMatchingStartOfPageCondition(doc, doc.resolve($pos), checkExactStart);
    }

    // Check if we are at the start of the document
    if (isPosAtStartOfDocument(doc, $pos)) {
        return true;
    }

    // Ensure that the position is within a valid block (paragraph)
    if (!isPositionWithinParagraph($pos)) {
        return false;
    }

    // Get positions for paragraph and page
    const { startOfPagePos, startOfParagraphPos } = getStartOfPageAndParagraphPosition(doc, $pos);
    if (startOfPagePos < 0) {
        console.warn("Invalid page position");
        return false;
    }

    if (startOfParagraphPos < 0) {
        console.warn("Invalid paragraph position");
        return false;
    }

    // Determine the condition to check
    const isFirstParagraph = startOfPagePos + 1 === startOfParagraphPos;
    if (checkExactStart) {
        // Check if position is exactly at the start of the page
        // First position of page will always be 1 more than the paragraph position
        const isPosAtStartOfParagraph = $pos.pos - 1 === startOfParagraphPos;
        if (isFirstParagraph && isPosAtStartOfParagraph) {
            console.log("At the start of the page");
            return true;
        }
        console.log("Not at the start of the page");
        return false;
    } else {
        // Check if position is at the first child of the page
        if (isFirstParagraph) {
            console.log("In the first child of the page");
            return true;
        }
        console.log("Not in the first child of the page");
        return false;
    }
};

/**
 * Check if the given position is at the start of the page or the first child of the page.
 * @param doc - The document node.
 * @param $pos - The resolved position in the document or the absolute position of the node.
 * @returns {boolean} True if the condition is met, false otherwise.
 */
export const isPosAtStartOfPage = (doc: PMNode, $pos: ResolvedPos | number): boolean => {
    return isPosMatchingStartOfPageCondition(doc, $pos, true);
};

/**
 * Check if the given position is at the first paragraph child of the page.
 * @param doc - The document node.
 * @param pos - The resolved position in the document or the absolute position of the node.
 * @returns {boolean} True if the position is at the start of the page, false otherwise.
 */
export const isPosAtFirstChildOfPage = (doc: PMNode, $pos: ResolvedPos | number): boolean => {
    return isPosMatchingStartOfPageCondition(doc, $pos, false);
};

/**
 * Check if the given position is at the end of the page or the last child of the page.
 * @param doc - The document node.
 * @param $pos - The resolved position in the document or the absolute position of the node.
 * @param checkExactEnd - Whether to check for the exact end of the page (true) or the last child of the page (false).
 * @returns {boolean} True if the condition is met, false otherwise.
 */
const isPosMatchingEndOfPageCondition = (doc: PMNode, $pos: ResolvedPos | number, checkExactEnd: boolean): boolean => {
    // Resolve position if given as a number
    if (typeof $pos === "number") {
        return isPosMatchingEndOfPageCondition(doc, doc.resolve($pos), checkExactEnd);
    }

    // Check if we are at the end of the document
    if (isPosAtEndOfDocument(doc, $pos)) {
        return true;
    }

    // Ensure that the position is within a valid block (paragraph)
    if (!isPositionWithinParagraph($pos)) {
        return false;
    }

    // Get positions for paragraph and page
    const { endOfParagraphPos, endOfPagePos } = getEndOfPageAndParagraphPosition(doc, $pos);
    if (endOfParagraphPos < 0) {
        console.warn("Invalid end of paragraph position");
        return false;
    }

    if (endOfPagePos < 0) {
        console.warn("Invalid end of page position");
        return false;
    }

    // Determine the condition to check
    if (checkExactEnd) {
        // Check if position is exactly at the end of the page
        if ($pos.pos === endOfPagePos) {
            console.log("At the end of the page");
            return true;
        }
        console.log("Not at the end of the page");
        return false;
    } else {
        // Check if position is at the last child of the page
        if (endOfParagraphPos + 1 === endOfPagePos) {
            console.log("In the last child of the page");
            return true;
        }
        console.log("Not in the last child of the page");
        return false;
    }
};

/**
 * Check if the given position is exactly at the end of the page.
 * @param doc - The document node.
 * @param pos - The resolved position in the document or the absolute position of the node.
 * @returns {boolean} True if the position is at the end of the page, false otherwise.
 */
export const isPosAtEndOfPage = (doc: PMNode, $pos: ResolvedPos | number): boolean => {
    return isPosMatchingEndOfPageCondition(doc, $pos, true);
};

/**
 * Check if the given position is at the last paragraph child of the page.
 * @param doc - The document node.
 * @param pos - The resolved position in the document or the absolute position of the node.
 * @returns {boolean} True if the position is at the end of the page, false otherwise.
 */
export const isPosAtLastChildOfPage = (doc: PMNode, $pos: ResolvedPos | number): boolean => {
    return isPosMatchingEndOfPageCondition(doc, $pos, false);
};

/**
 * Check if the given position is at the start of the document.
 * @param doc - The document node.
 * @param $pos - The resolved position in the document or the absolute position of the node.
 * @returns {boolean} True if the position is at the start of the document, false otherwise.
 */
export const isPosAtStartOfDocument = (doc: PMNode, $pos: ResolvedPos | number): boolean => {
    if (typeof $pos === "number") {
        return isPosAtStartOfDocument(doc, doc.resolve($pos));
    }

    return $pos.pos <= 1;
};

/**
 * Check if the given position is at the end of the document.
 * @param doc - The document node.
 * @param $pos - The resolved position in the document or the absolute position of the node.
 * @returns {boolean} True if the position is at the end of the document, false otherwise.
 */
export const isPosAtEndOfDocument = (doc: PMNode, $pos: ResolvedPos | number): boolean => {
    if (typeof $pos === "number") {
        return isPosAtEndOfDocument(doc, doc.resolve($pos));
    }

    return $pos.pos >= doc.nodeSize - 2;
};

/**
 * Get the previous paragraph node.
 * @param doc - The document node.
 * @param pos - The position in the document.
 * @returns {PMNode} The previous paragraph node.
 */
export const getPreviousParagraph = (doc: PMNode, pos: number): { prevParagraphPos: number; prevParagraphNode: Nullable<PMNode> } => {
    let prevParagraphPos = pos;
    let prevParagraphNode = null;
    while (prevParagraphNode === null && prevParagraphPos > 0) {
        prevParagraphPos -= 1;
        const node = doc.nodeAt(prevParagraphPos);
        if (!node) {
            continue;
        }

        if (isParagraphNode(node)) {
            prevParagraphNode = node;
            prevParagraphPos = prevParagraphPos;
        }
    }

    if (!prevParagraphNode) {
        prevParagraphPos = -1;
    }

    return { prevParagraphPos, prevParagraphNode };
};

/**
 * Get the next paragraph node.
 * @param doc - The document node.
 * @param pos - The position in the document.
 * @returns {PMNode} The next paragraph node.
 */
export const getNextParagraph = (doc: PMNode, pos: number): { nextParagraphPos: number; nextParagraphNode: Nullable<PMNode> } => {
    const documentLength = doc.nodeSize;
    let nextParagraphPos = pos;
    let nextParagraphNode = null;
    while (nextParagraphNode === null && nextParagraphPos < documentLength) {
        nextParagraphPos += 1;
        const node = doc.nodeAt(nextParagraphPos);
        if (!node) {
            continue;
        }

        if (isParagraphNode(node)) {
            nextParagraphNode = node;
            nextParagraphPos = nextParagraphPos;
        }
    }

    if (!nextParagraphNode) {
        nextParagraphPos = -1;
    }

    return { nextParagraphPos, nextParagraphNode };
};

/**
 * Determine if the resolved position is at the start of a paragraph node.
 * @param doc - The document node.
 * @param $pos - The resolved position in the document.
 * @returns {boolean} True if the position is at the start of a paragraph node, false otherwise.
 */
export const isAtStartOfParagraph = (doc: PMNode, $pos: ResolvedPos | number): boolean => {
    if (typeof $pos === "number") {
        return isAtStartOfParagraph(doc, doc.resolve($pos));
    }

    const { paragraphPos, paragraphNode } = getParagraphNodeAndPosition(doc, $pos);
    if (!paragraphNode) {
        return false;
    }

    // We allow for the cursor to be at the start of the paragraph node or the start of the first text child node.
    return inRange($pos.pos, paragraphPos, paragraphPos + 1);
};

/**
 * Determine if the resolved position is at the end of a paragraph node.
 * @param doc - The document node.
 * @param $pos - The resolved position in the document.
 * @returns {boolean} True if the position is at the end of a paragraph node, false otherwise.
 */
export const isAtEndOfParagraph = (doc: PMNode, $pos: ResolvedPos | number): boolean => {
    if (typeof $pos === "number") {
        return isAtEndOfParagraph(doc, doc.resolve($pos));
    }

    const { paragraphPos, paragraphNode } = getParagraphNodeAndPosition(doc, $pos);
    if (!paragraphNode) {
        return false;
    }

    return $pos.pos + 1 === paragraphPos + paragraphNode.nodeSize;
};

/**
 * Determine if the resolved position is at the start or end of a paragraph node.
 * @param doc - The document node.
 * @param $pos - The resolved position in the document.
 * @returns {boolean} True if the position is at the start or end of a paragraph node, false otherwise.
 */
export const isAtStartOrEndOfParagraph = (doc: PMNode, $pos: ResolvedPos | number): boolean => {
    return isAtStartOfParagraph(doc, $pos) || isAtEndOfParagraph(doc, $pos);
};

/**
 * Determine if the previous paragraph is empty.
 * @param doc - The document node.
 * @param $pos - The resolved position in the document or the absolute position of the node.
 * @returns {boolean} True if the previous paragraph is empty or does not exist, false otherwise.
 */
export const isPreviousParagraphEmpty = (doc: PMNode, $pos: ResolvedPos | number): boolean => {
    if (typeof $pos === "number") {
        return isPreviousParagraphEmpty(doc, doc.resolve($pos));
    }

    const { prevParagraphNode } = getPreviousParagraph(doc, $pos.pos);
    if (!prevParagraphNode) {
        return false;
    }

    return isNodeEmpty(prevParagraphNode);
};

/**
 * Determine if the next paragraph is empty.
 * @param doc - The document node.
 * @param $pos - The resolved position in the document or the absolute position of the node.
 * @returns {boolean} True if the next paragraph is empty or does not exist, false otherwise.
 */
export const isNextParagraphEmpty = (doc: PMNode, $pos: ResolvedPos | number): boolean => {
    if (typeof $pos === "number") {
        return isNextParagraphEmpty(doc, doc.resolve($pos));
    }

    const { nextParagraphNode } = getNextParagraph(doc, $pos.pos);
    if (!nextParagraphNode) {
        return false;
    }

    return isNodeEmpty(nextParagraphNode);
};

/**
 * Get the page number of the resolved position.
 * @param doc - The document node.
 * @param $pos - The resolved position in the document.
 * @param zeroIndexed - Whether to return the page number as zero-indexed. Default is true.
 * @returns {number} The page number of the resolved position.
 */
export const getPageNumber = (doc: PMNode, $pos: ResolvedPos | number, zeroIndexed: boolean = true): number => {
    if (typeof $pos === "number") {
        return getPageNumber(doc, doc.resolve($pos));
    }

    const { pagePos } = getPageNodeAndPosition(doc, $pos);
    if (pagePos < 0) {
        console.log("Unable to find page node");
        return -1;
    }

    const pageNodes = collectPageNodes(doc);
    const pageNode = pageNodes.findIndex((node) => node.pos === pagePos);
    return pageNode + (zeroIndexed ? 0 : 1);
};

/**
 * Collect content nodes and their old positions
 * @param state - The editor state.
 * @returns {NodePosArray} The content nodes and their positions.
 */
export const collectContentNodes = (state: EditorState): NodePosArray => {
    const { schema } = state;
    const pageType = schema.nodes.page;

    const contentNodes: NodePosArray = [];
    state.doc.forEach((node, offset) => {
        if (node.type === pageType) {
            node.forEach((child, childOffset) => {
                contentNodes.push({ node: child, pos: offset + childOffset + 1 });
            });
        } else {
            contentNodes.push({ node, pos: offset + 1 });
        }
    });

    return contentNodes;
};

/**
 * Measure the heights of the content nodes.
 * @param view - The editor view.
 * @param contentNodes - The content nodes and their positions.
 * @returns {number[]} The heights of the content nodes.
 */
export const measureNodeHeights = (view: EditorView, contentNodes: NodePosArray): number[] => {
    const paragraphType = view.state.schema.nodes.paragraph;

    const nodeHeights = contentNodes.map(({ pos, node }) => {
        const dom = view.nodeDOM(pos);
        if (dom instanceof HTMLElement) {
            let { height } = dom.getBoundingClientRect();
            if (height === 0) {
                if (node.type === paragraphType || node.isTextblock) {
                    // Assign a minimum height to empty paragraphs or textblocks
                    height = MIN_PARAGRAPH_HEIGHT;
                }
            }
            return height;
        }

        return MIN_PARAGRAPH_HEIGHT; // Default to minimum height if DOM element is not found
    });

    return nodeHeights;
};

/**
 * Build the new document and keep track of new positions
 * @param state - The editor state.
 * @param contentNodes - The content nodes and their positions.
 * @param nodeHeights - The heights of the content nodes.
 * @returns {newDoc: PMNode, oldToNewPosMap: CursorMap} The new document and the mapping from old positions to new positions.
 */
export const buildNewDocument = (
    state: EditorState,
    contentNodes: NodePosArray,
    nodeHeights: number[]
): { newDoc: PMNode; oldToNewPosMap: CursorMap } => {
    const { schema, doc } = state;
    let pageNum = 0;

    const pageType = schema.nodes.page;
    const pages: PMNode[] = [];
    let { pageNodeAttributes, pagePixelDimensions } = getCalculatedPageNodeAttributes(state, pageNum);

    const addPage = (currentPageContent: PMNode[]): PMNode => {
        const pageNode = pageType.create(pageNodeAttributes, currentPageContent);
        pages.push(pageNode);
        return pageNode;
    };

    let currentPageContent: PMNode[] = [];
    let currentHeight = 0;

    const oldToNewPosMap: CursorMap = new Map<number, number>();
    let cumulativeNewDocPos = 0;

    for (let i = 0; i < contentNodes.length; i++) {
        const { node, pos: oldPos } = contentNodes[i];
        const nodeHeight = nodeHeights[i];

        if (currentHeight + nodeHeight > pagePixelDimensions.pageContentHeight && currentPageContent.length > 0) {
            const pageNode = addPage(currentPageContent);
            cumulativeNewDocPos += pageNode.nodeSize;
            currentPageContent = [];
            currentHeight = 0;
            pageNum++;
            if (isPageNumInRange(doc, pageNum)) {
                ({ pageNodeAttributes, pagePixelDimensions } = getCalculatedPageNodeAttributes(state, pageNum));
            }
        }

        if (currentPageContent.length === 0) {
            cumulativeNewDocPos += 1; // Start of the page node
        }

        // Record the mapping from old position to new position
        const nodeStartPosInNewDoc = cumulativeNewDocPos + currentPageContent.reduce((sum, n) => sum + n.nodeSize, 0);
        oldToNewPosMap.set(oldPos, nodeStartPosInNewDoc);

        currentPageContent.push(node);
        currentHeight += Math.max(nodeHeight, MIN_PARAGRAPH_HEIGHT);
    }

    if (currentPageContent.length > 0) {
        // Add final page (may not be full)
        addPage(currentPageContent);
    } else {
        pageNum--;
    }

    const newDoc = schema.topNodeType.create(null, pages);
    const docSize = newDoc.content.size;
    limitMappedCursorPositions(oldToNewPosMap, docSize);

    return { newDoc, oldToNewPosMap };
};

/***
 * Limit mapped cursor positions to document size to prevent out of bounds errors
 * when setting the cursor position
 * @param oldToNewPosMap - The mapping from old positions to new positions.
 * @param docSize - The size of the new document.
 * @returns {void}
 */
const limitMappedCursorPositions = (oldToNewPosMap: CursorMap, docSize: number): void => {
    oldToNewPosMap.forEach((newPos, oldPos) => {
        if (newPos > docSize) {
            oldToNewPosMap.set(oldPos, docSize);
        }
    });
};

/**
 * Map the cursor position from the old document to the new document.
 * @param contentNodes - The content nodes and their positions.
 * @param oldCursorPos - The old cursor position.
 * @param oldToNewPosMap - The mapping from old positions to new positions.
 * @returns {number} The new cursor position.
 */
export const mapCursorPosition = (contentNodes: NodePosArray, oldCursorPos: number, oldToNewPosMap: CursorMap) => {
    let newCursorPos: Nullable<number> = null;
    for (let i = 0; i < contentNodes.length; i++) {
        const { node, pos: oldNodePos } = contentNodes[i];
        const nodeSize = node.nodeSize;

        if (oldNodePos <= oldCursorPos && oldCursorPos <= oldNodePos + nodeSize) {
            const oldNodeTextPos = oldNodePos + 1; // Start of paragraph will always be 1 less than the start of the text
            const offsetInNode = oldCursorPos - oldNodeTextPos;
            const newNodePos = oldToNewPosMap.get(oldNodePos);
            if (newNodePos === undefined) {
                console.error("Unable to determine new node position from cursor map!");
                newCursorPos = 0;
            } else {
                newCursorPos = newNodePos + offsetInNode;
            }

            break;
        }
    }

    return newCursorPos;
};

/**
 * Sets the cursor selection after creating the new document.
 * @param tr - The current transaction.
 * @returns {void}
 */
export const paginationUpdateCursorPosition = (tr: Transaction, newCursorPos: Nullable<number>): void => {
    if (newCursorPos !== null) {
        const $pos = tr.doc.resolve(newCursorPos);
        let selection;

        const startOfParagraph = isAtStartOfParagraph(tr.doc, $pos);
        const endOfParagraph = isAtEndOfParagraph(tr.doc, $pos);
        console.log("Is start of paragraph", startOfParagraph);
        console.log("Is end of paragraph", endOfParagraph);

        console.log("Is parent a text block", $pos.parent.isTextblock, $pos.parent.type.name);
        console.log("Node Before", $pos.nodeBefore);
        console.log("Node Before type", $pos.nodeBefore?.type.name);

        console.log("Node After", $pos.nodeAfter);
        console.log("Node after type", $pos.nodeAfter?.type.name);

        if ($pos.parent.isTextblock) {
            if (isPosAtFirstChildOfPage(tr.doc, newCursorPos)) {
                if (isPosAtStartOfPage(tr.doc, newCursorPos)) {
                    selection = moveToThisTextBlock(tr, $pos);
                } else {
                    selection = moveToNextTextBlock(tr, $pos);
                }
            } else if (isPosAtLastChildOfPage(tr.doc, newCursorPos)) {
                if (isPosAtEndOfPage(tr.doc, newCursorPos)) {
                    selection = moveToPreviousTextBlock(tr, $pos);
                } else {
                    selection = moveToThisTextBlock(tr, $pos);
                }
            } else {
                selection = moveToNextTextBlock(tr, $pos);
            }
        } else if ($pos.nodeBefore && (isTextNode($pos.nodeBefore) || isParagraphNode($pos.nodeBefore))) {
            selection = moveToNextTextBlock(tr, $pos);
        } else if ($pos.nodeAfter && (isTextNode($pos.nodeAfter) || isParagraphNode($pos.nodeAfter))) {
            selection = moveToNextTextBlock(tr, $pos);
        } else {
            selection = moveToNearestValidCursorPosition($pos);
        }

        if (selection) {
            setSelection(tr, selection);
        } else {
            // Fallback to a safe selection at the end of the document
            setSelectionAtEndOfDocument(tr);
        }
    } else {
        setSelectionAtEndOfDocument(tr);
    }
};
