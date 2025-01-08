/**
 * @file /src/utils/pageRegion/getAttributes.ts
 * @name GetAttributes
 * @description Utility functions for getting page region attributes.
 */

import { Node as PMNode } from "@tiptap/pm/model";
import { Editor } from "@tiptap/core";
import { EditorState } from "@tiptap/pm/state";
import { PageRegion } from "../../types/pageRegions";
import { Nullable } from "../../types/record";
import { NullableNodePos } from "../../types/node";
import { getStateFromContext } from "../editor";
import { doesDocHavePageNodes, getPageNodeByPageNum, handleOutOfRangePageNum, isPageNumInRange } from "../page";
import { getHeaderFooterNodeType, isHeaderFooterNode } from "./pageRegion";
import { isBodyNode } from "./body";

/**
 * Get the page region node of the current page by the page region type.
 * @param pageNode - The page node to search for the neighbouring page region.
 * @param regionType - The type of the page region to search for.
 * @returns {Nullable<PMNode>} The neighbouring page region node or null if not found.
 */
export const getPageRegionNode = (pageNode: PMNode, regionType: PageRegion): Nullable<PMNode> => {
    let pageRegionNode: Nullable<PMNode> = null;

    pageNode.forEach((node) => {
        if (isHeaderFooterNode(node)) {
            if (getHeaderFooterNodeType(node) === regionType) {
                pageRegionNode = node;
            }
        } else if (isBodyNode(node)) {
            if (node.type.name === regionType) {
                pageRegionNode = node;
            }
        }
    });

    return pageRegionNode;
};

/**
 * Get the page region node and position of the current page by the page region type.
 * @param pagePos - The position of the page node to search for the neighbouring page region.
 * @param pageNode - The page node to search for the neighbouring page region.
 * @param regionType - The type of the page region to search for.
 * @returns {NullableNodePos} The neighbouring page region node and position or null if not found.
 */
export const getPageRegionNodeAndPos = (pagePos: number, pageNode: PMNode, regionType: PageRegion): NullableNodePos => {
    let pageRegionNode: Nullable<PMNode> = null;
    let pos = pagePos;

    if (!pageNode) {
        return { node: null, pos: -1 };
    }

    pageNode.forEach((node, index) => {
        if (isHeaderFooterNode(node)) {
            if (getHeaderFooterNodeType(node) === regionType) {
                pageRegionNode = node;
                pos += index;
            }
        } else if (isBodyNode(node)) {
            if (node.type.name === regionType) {
                pageRegionNode = node;
                pos += index;
            }
        }
    });

    return { node: pageRegionNode, pos: pageRegionNode ? pos : -1 };
};

/**
 * Retrieves a specific attribute of a the body node of specified type of a given page number.
 * Falls back to the default value if the page number is invalid or the attribute is missing.
 * @param context - The current editor instance or editor state.
 * @param pageNum - The page number to retrieve the attribute for.
 * @param regionType - The type of the region to retrieve the attribute for.
 * @param getDefault - A function to retrieve the default value of the attribute.
 * @param getNodeAttribute - A function to retrieve the attribute from a body node.
 * @returns {T} The attribute of the specified body node or default.
 */
export const getPageRegionAttributeByPageNum = <T>(
    context: Editor | EditorState,
    pageNum: number,
    regionType: PageRegion,
    getDefault: () => T,
    getNodeAttribute: (node: PMNode) => Nullable<T>
): T => {
    const state = getStateFromContext(context);

    if (!doesDocHavePageNodes(state)) {
        return getDefault();
    }

    const { doc } = state;

    if (!isPageNumInRange(doc, pageNum)) {
        return handleOutOfRangePageNum(state, pageNum, (s, p) =>
            getPageRegionAttributeByPageNum(s, p, regionType, getDefault, getNodeAttribute)
        );
    }

    const pageNode = getPageNodeByPageNum(doc, pageNum);
    if (!pageNode) {
        return getDefault();
    }

    const pageRegionNode = getPageRegionNode(pageNode, regionType);
    if (!pageRegionNode) {
        return getDefault();
    }

    return getNodeAttribute(pageRegionNode) ?? getDefault();
};
