/**
 * @file /src/utils/buildPageView.ts
 * @name BuildPageView
 * @description Utility functions for building the page view.
 */

import { Node as PMNode, ResolvedPos } from "@tiptap/pm/model";
import { EditorState, Transaction } from "@tiptap/pm/state";
import { EditorView } from "@tiptap/pm/view";
import { MIN_PARAGRAPH_HEIGHT } from "../constants/pagination";
import { NodePosArray } from "../types/node";
import { CursorMap } from "../types/cursor";
import { Nullable } from "../types/record";
import { MarginConfig } from "../types/page";
import { moveToNearestValidCursorPosition, moveToThisTextBlock, setSelection, setSelectionAtEndOfDocument } from "./selection";
import { inRange } from "./math";
import { getPaginationNodeAttributes } from "./nodes/page/attributes/getPageAttributes";
import { isParagraphNode } from "./nodes/paragraph";
import { isTextNode } from "./nodes/text";
import { getPaginationNodeTypes } from "./pagination";
import { isPageNumInRange } from "./nodes/page/pageNumber";

/**
 * Builds a new document with paginated content.
 * @param view - The editor view.
 * @returns {void}
 */
export const buildPageView = (view: EditorView): void => {
    const { state, dispatch } = view;
    const { doc } = state;

    try {
        const contentNodes = collectContentNodes(state);
        const nodeHeights = measureNodeHeights(view, contentNodes);

        // Record the cursor's old position
        const { tr, selection } = state;
        const oldCursorPos = selection.from;

        const { newDoc, oldToNewPosMap } = buildNewDocument(state, contentNodes, nodeHeights);

        // Compare the content of the documents
        if (!newDoc.content.eq(doc.content)) {
            tr.replaceWith(0, doc.content.size, newDoc.content);
            tr.setMeta("pagination", true);

            const newDocContentSize = newDoc.content.size;
            const newCursorPos = mapCursorPosition(contentNodes, oldCursorPos, oldToNewPosMap, newDocContentSize);
            paginationUpdateCursorPosition(tr, newCursorPos);
        }

        dispatch(tr);
    } catch (error) {
        console.error("Error updating page view. Details:", error);
    }
};

/**
 * Collect content nodes and their existing positions
 * @param state - The editor state.
 * @returns {NodePosArray} The content nodes and their positions.
 */
const collectContentNodes = (state: EditorState): NodePosArray => {
    const { schema } = state;
    const { pageNodeType, headerFooterNodeType, bodyNodeType } = getPaginationNodeTypes(schema);

    const contentNodes: NodePosArray = [];
    state.doc.forEach((pageNode, offset) => {
        if (pageNode.type === pageNodeType) {
            let pageContentOffset = 1;
            pageNode.forEach((pageRegionNode, pageRegionOffset) => {
                if (pageRegionNode.type === headerFooterNodeType) {
                    // Don't collect header/footer nodes
                    // But we do need to account for their size/offset
                    pageContentOffset += 1;
                } else if (pageRegionNode.type === bodyNodeType) {
                    pageRegionNode.forEach((child, childOffset) => {
                        contentNodes.push({ node: child, pos: offset + pageRegionOffset + childOffset + pageContentOffset });
                    });
                } else {
                    contentNodes.push({ node: pageRegionNode, pos: offset + pageRegionOffset + pageContentOffset });
                }
            });
        } else {
            contentNodes.push({ node: pageNode, pos: offset + 1 });
        }
    });

    return contentNodes;
};

/**
 * Calculates the margins of the element.
 * @param element - The element to calculate margins for.
 * @returns {MarginConfig} The margins of the element.
 */
const calculateElementMargins = (element: HTMLElement): MarginConfig => {
    const style = window.getComputedStyle(element);
    return {
        top: parseFloat(style.marginTop),
        right: parseFloat(style.marginRight),
        bottom: parseFloat(style.marginBottom),
        left: parseFloat(style.marginLeft),
    };
};

/**
 * Measure the heights of the content nodes.
 * @param view - The editor view.
 * @param contentNodes - The content nodes and their positions.
 * @returns {number[]} The heights of the content nodes.
 */
const measureNodeHeights = (view: EditorView, contentNodes: NodePosArray): number[] => {
    const paragraphType = view.state.schema.nodes.paragraph;

    const nodeHeights = contentNodes.map(({ pos, node }) => {
        const domNode = view.nodeDOM(pos);
        if (domNode instanceof HTMLElement) {
            let { height } = domNode.getBoundingClientRect();

            const { top: marginTop } = calculateElementMargins(domNode);

            if (height === 0) {
                if (node.type === paragraphType || node.isTextblock) {
                    // Assign a minimum height to empty paragraphs or textblocks
                    height = MIN_PARAGRAPH_HEIGHT;
                }
            }

            // We use top margin only because there is overlap of margins between paragraphs
            return height + marginTop;
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
const buildNewDocument = (
    state: EditorState,
    contentNodes: NodePosArray,
    nodeHeights: number[]
): { newDoc: PMNode; oldToNewPosMap: CursorMap } => {
    const { schema, doc } = state;
    let pageNum = 0;

    const { pageNodeType: pageType, headerFooterNodeType: headerFooterType, bodyNodeType: bodyType } = getPaginationNodeTypes(schema);

    const pages: PMNode[] = [];
    let { pageNodeAttributes, pageRegionNodeAttributes, bodyPixelDimensions } = getPaginationNodeAttributes(state, pageNum);

    const constructPageRegions = (currentPageContent: PMNode[]): PMNode[] => {
        const { header: headerAttrs, body: bodyAttrs, footer: footerAttrs } = pageRegionNodeAttributes;
        const pageHeader = headerFooterType.create(headerAttrs, []); // TODO - Add header content
        const pageBody = bodyType.create(bodyAttrs, currentPageContent);
        const pageFooter = headerFooterType.create(footerAttrs, []); // TODO - Add footer content

        return [pageHeader, pageBody, pageFooter];
    };

    const addPage = (currentPageContent: PMNode[]): PMNode => {
        const pageNodeContents = constructPageRegions(currentPageContent);
        const pageNode = pageType.create(pageNodeAttributes, pageNodeContents);
        pages.push(pageNode);
        return pageNode;
    };

    let currentPageContent: PMNode[] = [];
    let currentHeight = 0;

    const oldToNewPosMap: CursorMap = new Map<number, number>();
    const pageOffset = 1;
    const bodyOffset = 1;
    let cumulativeNewDocPos = pageOffset + bodyOffset;

    for (let i = 0; i < contentNodes.length; i++) {
        const { node, pos: oldPos } = contentNodes[i];
        const nodeHeight = nodeHeights[i];

        const isPageFull = currentHeight + nodeHeight > bodyPixelDimensions.bodyHeight;
        if (isPageFull && currentPageContent.length > 0) {
            const pageNode = addPage(currentPageContent);
            cumulativeNewDocPos += pageNode.nodeSize;
            currentPageContent = [];
            currentHeight = 0;
            pageNum++;
            if (isPageNumInRange(doc, pageNum)) {
                ({ pageNodeAttributes, pageRegionNodeAttributes, bodyPixelDimensions } = getPaginationNodeAttributes(state, pageNum));
            }
        }

        // Record the mapping from old position to new position
        const nodeStartPosInNewDoc = cumulativeNewDocPos + currentPageContent.reduce((sum, n) => sum + n.nodeSize, 0);

        oldToNewPosMap.set(oldPos, nodeStartPosInNewDoc);

        currentPageContent.push(node);
        currentHeight += nodeHeight;
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

/**
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
 * @param newDocContentSize - The size of the new document. Serves as maximum limit for cursor position.
 * @returns {number} The new cursor position.
 */
const mapCursorPosition = (contentNodes: NodePosArray, oldCursorPos: number, oldToNewPosMap: CursorMap, newDocContentSize: number) => {
    let newCursorPos: Nullable<number> = null;
    for (let i = 0; i < contentNodes.length; i++) {
        const { node, pos: oldNodePos } = contentNodes[i];
        const nodeSize = node.nodeSize;

        if (inRange(oldCursorPos, oldNodePos, oldNodePos + nodeSize)) {
            const offsetInNode = oldCursorPos - oldNodePos;
            const newNodePos = oldToNewPosMap.get(oldNodePos);
            if (newNodePos === undefined) {
                console.error("Unable to determine new node position from cursor map!");
                newCursorPos = 0;
            } else {
                newCursorPos = Math.min(newNodePos + offsetInNode, newDocContentSize - 1);
            }

            break;
        }
    }

    return newCursorPos;
};

/**
 * Check if the given position is at the start of a text block.
 * @param doc - The document node.
 * @param $pos - The resolved position in the document.
 * @returns {boolean} True if the position is at the start of a text block, false otherwise.
 */
const isNodeBeforeAvailable = ($pos: ResolvedPos): boolean => {
    return !!$pos.nodeBefore && (isTextNode($pos.nodeBefore) || isParagraphNode($pos.nodeBefore));
};

/**
 * Check if the given position is at the end of a text block.
 * @param doc - The document node.
 * @param $pos - The resolved position in the document.
 * @returns {boolean} True if the position is at the end of a text block, false otherwise.
 */
const isNodeAfterAvailable = ($pos: ResolvedPos): boolean => {
    return !!$pos.nodeAfter && (isTextNode($pos.nodeAfter) || isParagraphNode($pos.nodeAfter));
};

/**
 * Sets the cursor selection after creating the new document.
 * @param tr - The current transaction.
 * @returns {void}
 */
const paginationUpdateCursorPosition = (tr: Transaction, newCursorPos: Nullable<number>): void => {
    if (newCursorPos !== null) {
        const $pos = tr.doc.resolve(newCursorPos);
        let selection;

        if ($pos.parent.isTextblock || isNodeBeforeAvailable($pos) || isNodeAfterAvailable($pos)) {
            selection = moveToThisTextBlock(tr, $pos);
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
