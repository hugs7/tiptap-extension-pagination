/**
 * @file /src/utils/setPageAttributes.ts
 * @name SetPageAttributes
 * @description Utility functions for setting page attributes.
 */

import { Node as PMNode } from "@tiptap/pm/model";
import { Transaction } from "@tiptap/pm/state";
import { isPageNode } from "./page";
import { isBodyNode } from "../body";
import { getPageRegionNodeAndPos } from "../../pageRegion/getAttributes";
import { setNodeAttribute, setNodesTypeAttribute } from "../../attributes/setAttributes";

/**
 * Set a page node attribute to the given value for all page nodes in the document.
 * @param tr - The transaction to apply the change to.
 * @param attr - The attribute to set.
 * @param value - The value to set the attribute to.
 * @returns {boolean} True if any attribute was changed, false otherwise.
 */
export const setPageNodesAttribute = (tr: Transaction, attr: string, value: any): boolean => {
    return setNodesTypeAttribute(tr, attr, value, setPageNodeAttribute);
};

/**
 * Set a page node attribute to the given value.
 * @param tr - The transaction to apply the change to.
 * @param pos - The position of the node to set the attribute for.
 * @param node - The node to set the attribute for.
 * @param attr - The attribute to set.
 * @param value - The value to set the attribute to.
 * @returns {boolean} True if the attribute was changed, false otherwise.
 */
export const setPageNodeAttribute = (tr: Transaction, pos: number, node: PMNode, attr: string, value: any): boolean => {
    if (!isPageNode(node)) {
        return false;
    }

    return setNodeAttribute(tr, pos, node, attr, value);
};

/**
 * Set a body node attribute to the given value for all body nodes in the document.
 * @param tr - The transaction to apply the change to.
 * @param attr - The attribute to set.
 * @param value - The value to set the attribute to.
 * @returns {boolean} True if any attribute was changed, false otherwise.
 */
export const setBodyNodesAttribute = (tr: Transaction, attr: string, value: any): boolean => {
    return setNodesTypeAttribute(tr, attr, value, setBodyNodeAttribute);
};

/**
 * Set a body node attribute to the given value.
 * @param tr - The transaction to apply the change to.
 * @param pagePos - The position of the node to set the attribute for.
 * @param pageNode - The page node (parent of the body nody).
 * @param attr - The attribute to set.
 * @param value - The value to set the attribute to.
 * @returns {boolean} True if the attribute was changed, false otherwise.
 */
export const setBodyNodeAttribute = <T>(tr: Transaction, pagePos: number, pageNode: PMNode, attr: string, value: T): boolean => {
    if (!isPageNode(pageNode)) {
        return false;
    }

    const { node: bodyNode, pos: bodyPos } = getPageRegionNodeAndPos(pagePos, pageNode, "body");
    if (!bodyNode || !isBodyNode(bodyNode)) {
        return false;
    }

    return setNodeAttribute(tr, bodyPos, bodyNode, attr, value);
};
