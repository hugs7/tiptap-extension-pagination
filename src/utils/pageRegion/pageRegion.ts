/**
 * @file /src/utils/pageRegion/pageRegion.ts
 * @name PageRegion
 * @description Utility functions for creating custom page regions in the editor.
 */

import { Node as PMNode } from "@tiptap/pm/model";
import { HeaderNodeAttributes, FooterNodeAttributes, PageRegion, HeaderFooter } from "../../types/pageRegions";
import { Nullable } from "../../types/record";
import {
    HEADER_DEFAULT_ATTRIBUTES,
    FOOTER_DEFAULT_ATTRIBUTES,
    HEADER_FOOTER_NODE_ATTR_KEYS,
    HEADER_FOOTER_NODE_NAME,
} from "../../constants/pageRegions";
import { Editor } from "@tiptap/core";
import { EditorState } from "@tiptap/pm/state";
import { getStateFromContext } from "../editor";
import { doesDocHavePageNodes, getPageNodeByPageNum, handleOutOfRangePageNum, isPageNumInRange } from "../page";
import { XMarginConfig } from "../../types/page";

/**
 * Determines if the given node is a header node.
 * @param node - The node to check.
 * @returns {boolean} True if the node is a header node, false otherwise.
 */
export const isHeaderFooterNode = (node: PMNode): boolean => {
    return node.type.name === HEADER_FOOTER_NODE_NAME;
};

/**
 * Get the type of the header or footer node.
 * @param headerFooterNode - The header or footer node to retrieve the type for.
 * @returns {Nullable<HeaderFooter>} The type of the specified header or footer node or null if not found.
 */
export const getHeaderFooterNodeType = (headerFooterNode: PMNode): Nullable<HeaderFooter> => {
    const { attrs } = headerFooterNode;
    return attrs[HEADER_FOOTER_NODE_ATTR_KEYS.type];
};

/**
 * Get the x margins from a header or footer node.
 * @param headerFooterNode - The header or footer node.
 * @returns {Nullable<XMarginConfig>} The x margins of the specified header or footer.
 */
export const getHeaderFooterNodeXMargins = (headerFooterNode: PMNode): Nullable<XMarginConfig> => {
    const { attrs } = headerFooterNode;
    return attrs[HEADER_FOOTER_NODE_ATTR_KEYS.xMargins];
};

/**
 * Get the page region node of the current page by the page region type.
 * @param pageNode - The page node to search for the neighbouring page region.
 * @param pageRegion - The type of the page region to search for.
 * @returns {Nullable<PMNode>} The neighbouring page region node or null if not found.
 */
export const getPageRegionNode = (pageNode: PMNode, pageRegion: PageRegion): Nullable<PMNode> => {
    let neighbouringPageRegionNode: Nullable<PMNode> = null;

    pageNode.forEach((node) => {
        if (node.type.name === pageRegion) {
            neighbouringPageRegionNode = node;
        }
    });

    return neighbouringPageRegionNode;
};

/**
 * Get the start position of the header or footer node.
 * @param headerFooterNode - The header or footer node to retrieve the start position for.
 * @returns {Nullable<number>} The start position of the specified header or footer node or null if not found.
 */
export const getHeaderFooterNodeStart = (headerFooterNode: PMNode): Nullable<number> => {
    const { attrs } = headerFooterNode;
    return attrs[HEADER_FOOTER_NODE_ATTR_KEYS.start];
};

/**
 * Get the height of the header or footer node.
 * @param headerFooterNode - The header or footer node to retrieve the height for.
 * @returns {Nullable<number>} The height of the specified header or footer node or null if not found.
 */
export const getHeaderFooterNodeHeight = (headerFooterNode: PMNode): Nullable<number> => {
    const { attrs } = headerFooterNode;
    return attrs[HEADER_FOOTER_NODE_ATTR_KEYS.height];
};

/**
 * Retrieves the header node attributes, filling in any missing attributes with the default values.
 * @param headerFooterNode - The header or footer node to retrieve the attributes for.
 * @returns {HeaderNodeAttributes} The attributes of the specified header.
 */
export const getHeaderNodeAttributes = (headerFooterNode: PMNode): HeaderNodeAttributes => {
    const { attrs } = headerFooterNode;
    const mergedAttrs = { ...HEADER_DEFAULT_ATTRIBUTES, ...attrs };
    if (mergedAttrs.type !== "header") {
        console.warn("Header node attributes are not of type 'header'");
    }

    return mergedAttrs;
};

/**
 * Retrieves the footer node attributes, filling in any missing attributes with the default values.
 * @param headerFooterNode - The header or footer node to retrieve the attributes for.
 * @returns {FooterNodeAttributes} The attributes of the specified footer.
 */
export const getFooterNodeAttributes = (headerFooterNode: PMNode): FooterNodeAttributes => {
    const { attrs } = headerFooterNode;
    const mergedAttrs = { ...FOOTER_DEFAULT_ATTRIBUTES, ...attrs };
    if (mergedAttrs.type !== "footer") {
        console.warn("Footer node attributes are not of type 'footer'");
    }

    return mergedAttrs;
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
