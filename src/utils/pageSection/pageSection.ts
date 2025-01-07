/**
 * @file /src/utils/pageSection.ts
 * @name PageSection
 * @description Utility functions for page sections in the editor.
 */

import { Node as PMNode } from "@tiptap/pm/model";
import PageSectionType from "../../types/pageSection";
import { Nullable } from "../../types/record";
import { PAGE_SECTION_NODE_ATTR_KEYS, PAGE_SECTION_NODE_NAME, pageSectionTypes } from "../../constants/pageSection";
import { EditorState } from "@tiptap/pm/state";
import { Editor } from "@tiptap/core";
import { doesDocHavePageNodes, getPageNodeByPageNum, handleOutOfRangePageNum, isPageNumInRange } from "../page";
import { getStateFromContext } from "../editor";

/**
 * Check if the given node is a page section node.
 * @param node - The node to check.
 * @returns {boolean} True if the node is a page section node, false otherwise.
 */
export const isPageSectionNode = (node: Nullable<PMNode>): boolean => {
    if (!node) {
        console.warn("No node provided");
        return false;
    }

    return node.type.name === PAGE_SECTION_NODE_NAME;
};

/**
 * Get the type of the page section node.
 * @param node - The page section node.
 * @returns {Nullable<PageSectionType>} The type of the page section node or null if the node is not a page section node.
 */
export const getPageSectionType = (node: PMNode): Nullable<PageSectionType> => {
    const { attrs } = node;
    return attrs[PAGE_SECTION_NODE_ATTR_KEYS.type];
};

/**
 * Get the index of the page section type in the list of page section types.
 * @param sectionType - The page section type to get the index of.
 * @returns {number} The index of the page section type.
 */
export const getPageSectionIndex = (sectionType: PageSectionType): number => {
    return pageSectionTypes.indexOf(sectionType);
};

/**
 * Given a page node, finds the (first (should be only)) page section node of the specified type.
 * @param pageNode - The page node to search for the page section node.
 * @param sectionType - The type of the page section node to search for.
 * @returns {Nullable<PMNode>} The page section node of the specified type or null if not found.
 */
export const getPageSectionNodeByType = (pageNode: PMNode, sectionType: PageSectionType): Nullable<PMNode> => {
    let pageSectionNode: Nullable<PMNode> = null;

    pageNode.content.forEach((psNode) => {
        if (!pageSectionNode && isPageSectionNode(psNode) && getPageSectionType(psNode) === sectionType) {
            pageSectionNode = psNode;
        }
    });

    return pageSectionNode;
};

/**
 * Retrieves a specific attribute of a the page section node of specified type of a given page number.
 * Falls back to the default value if the page number is invalid or the attribute is missing.
 * @param context - The current editor instance or editor state.
 * @param pageNum - The page number to retrieve the attribute for.
 * @param sectionType - The type of the page section node to retrieve the attribute from.
 * @param getDefault - A function to retrieve the default value of the attribute.
 * @param getNodeAttribute - A function to retrieve the attribute from a page section node.
 * @returns {T} The attribute of the specified page section node or default.
 */
export const getPageSectionAttributeByPageNum = <T>(
    context: Editor | EditorState,
    pageNum: number,
    sectionType: PageSectionType,
    getDefault: () => T,
    getNodeAttribute: (node: PMNode) => Nullable<T>
): T => {
    const state = getStateFromContext(context);

    if (!doesDocHavePageNodes(state)) {
        return getDefault();
    }

    const { doc } = state;

    if (isPageNumInRange(doc, pageNum)) {
        return handleOutOfRangePageNum(state, pageNum, (s, p) =>
            getPageSectionAttributeByPageNum(s, p, sectionType, getDefault, getNodeAttribute)
        );
    }

    const pageNode = getPageNodeByPageNum(doc, pageNum);
    if (!pageNode) {
        return getDefault();
    }

    const pageSectionNode = getPageSectionNodeByType(pageNode, sectionType);
    if (!pageSectionNode) {
        return getDefault();
    }

    return getNodeAttribute(pageSectionNode) ?? getDefault();
};
