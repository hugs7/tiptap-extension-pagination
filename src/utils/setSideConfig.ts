/**
 * @file /src/utils/setSideConfig.ts
 * @name SetSideConfig
 * @description Utility functions for setting side configuration (e.g. margins, borders) for page nodes.
 */

import { Node as PMNode } from "@tiptap/pm/model";
import { Transaction } from "@tiptap/pm/state";
import { Dispatch } from "@tiptap/core";
import { pageSides } from "../constants/pageSides";
import { PageSide, MultiSide, MultiAxisSide } from "../types/page";
import { Nullable } from "../types/record";
import { getPageNodePosByPageNum, isPageNode } from "./nodes/page/page";
import { setPageNodeAttribute } from "./nodes/page/setPageAttributes";
import { NodePos } from "../types/node";

type SideConfig<V> = { [key in PageSide]: V };

/**
 * Generic helper to set the side configuration of a document.
 * @param attrKey - The key of the attribute to update.
 * @param isValidConfig - A function to validate the side configuration.
 * @param setNodesAttribute - A function to set the attribute nodes.
 * @returns
 */
export const setDocumentSideConfig =
    <V, T extends SideConfig<V>>(
        attrKey: string,
        isValidConfig: (config: T) => boolean,
        setNodesAttribute: (tr: Transaction, attr: string, value: any) => boolean
    ) =>
    (sideConfig: T) =>
    ({ tr, dispatch }: { tr: Transaction; dispatch: Dispatch }): boolean => {
        if (!dispatch) return false;

        if (!isValidConfig(sideConfig)) {
            console.warn("Invalid side config", sideConfig);
            return false;
        }

        setNodesAttribute(tr, attrKey, sideConfig);

        dispatch(tr);
        return true;
    };

/**
 * Sets the side configuration of a node.
 * @param setNodePosByPageNum - A function to get the position of a node by page number.
 * @param setGenericPageNodePosSideConfig - A function to set the side configuration of a node.
 * @param pageNum - The page number to set the side configuration for.
 * @param sideConfig - The side configuration to set.
 * @returns {boolean} True if the side configuration was set, false otherwise.
 */
export const setPageSideConfig =
    <V, T extends SideConfig<V>>(
        setNodePosByPageNum: (doc: PMNode, pageNum: number) => Nullable<NodePos>,
        setGenericPageNodePosSideConfig: (tr: Transaction, dispatch: Dispatch, pagePos: number, pageNode: PMNode, sideConfig: T) => boolean
    ) =>
    (pageNum: number, sideConfig: T) =>
    ({ tr, dispatch }: { tr: Transaction; dispatch: Dispatch }): boolean => {
        const { doc } = tr;

        const pageNodePos = setNodePosByPageNum(doc, pageNum);
        if (!pageNodePos) {
            return false;
        }

        const { pos: pagePos, node: pageNode } = pageNodePos;

        return setGenericPageNodePosSideConfig(tr, dispatch, pagePos, pageNode, sideConfig);
    };

/**
 * Set one side of the document side configuration.
 * @param setDocumentSideConfig - A function to set the document side configuration.
 * @param isValueValid - A function to validate the value.
 * @param updateSideConfig - A function to update the side configuration of a page node.
 * @returns {boolean} True if the side value was set, false otherwise.
 */
export const setDocumentSideValue =
    <V, T extends SideConfig<V>>(
        setDocumentSideConfig: (sideConfig: T) => boolean,
        isValueValid: (value: V) => boolean,
        updateSideConfig: (tr: Transaction, pagePos: number, pageNode: PMNode, side: MultiAxisSide, value: V) => boolean
    ) =>
    (side: MultiSide, value: V) =>
    ({ tr, dispatch }: { tr: Transaction; dispatch: Dispatch }): boolean => {
        if (!dispatch) return false;

        if (side === "all") {
            const sideConfig = { top: value, right: value, bottom: value, left: value } as T;
            return setDocumentSideConfig(sideConfig);
        }

        if (!isValueValid(value)) {
            console.warn("Invalid margin value", value);
            return false;
        }

        const { doc } = tr;
        const transactions: boolean[] = [];

        doc.forEach((node, pos) => {
            transactions.push(updateSideConfig(tr, pos, node, side, value));
        });

        const success = transactions.some((changed) => changed);
        if (success) {
            dispatch(tr);
        }

        return success;
    };

/**
 * Set one side of the page side configuration.
 * @param setPageSideConfig - A function to set the side configuration of a page node.
 * @param isValueValid - A function to validate the value.
 * @param updateSideConfig - A function to update the side configuration of a page node.
 * @param pageNum - The page number to set the side value for.
 * @param side - The side to set the value for.
 * @returns {boolean} True if the side value was set, false otherwise.
 */
export const setPageSideValue =
    <V, T extends SideConfig<V>>(
        setPageSideConfig: (pageNum: number, sideConfig: T) => boolean,
        isValueValid: (value: V) => boolean,
        updateSideConfig: (tr: Transaction, pagePos: number, pageNode: PMNode, side: MultiAxisSide, value: V) => boolean
    ) =>
    (pageNum: number, side: MultiSide, value: V) =>
    ({ tr, dispatch }: { tr: Transaction; dispatch: Dispatch }): boolean => {
        if (!dispatch) return false;

        if (side === "all") {
            const sideConfig: T = { top: value, right: value, bottom: value, left: value } as T;
            return setPageSideConfig(pageNum, sideConfig);
        }

        if (!isValueValid(value)) {
            console.warn("Invalid side value", value);
            return false;
        }

        const { doc } = tr;
        const pageNodePos = getPageNodePosByPageNum(doc, pageNum);
        if (!pageNodePos) {
            return false;
        }

        const { pos: pagePos, node: pageNode } = pageNodePos;

        const success = updateSideConfig(tr, pagePos, pageNode, side, value);

        if (success) {
            dispatch(tr);
        }

        return success;
    };

/**
 * Set the paper side configuration of a page node.
 * @param tr - The transaction to apply the change to.
 * @param dispatch - The dispatch function to apply the transaction.
 * @param pagePos - The position of the page node to set the side config for.
 * @param pageNode - The page node to set the side config for.
 * @param configObj - The side config to set.
 * @param isValidConfig - A function to validate the side config.
 * @param getPageNodeSideConfig - A function to get the existing side config from the page node.
 * @param attrKey - The key of the attribute to update.
 * @returns {boolean} True if the side config were set, false otherwise.
 */
export const setPageNodePosSideConfig = <V, T extends SideConfig<V>>(
    tr: Transaction,
    dispatch: Dispatch,
    pagePos: number,
    pageNode: PMNode,
    configObj: T,
    isValidConfig: (config: T) => boolean,
    getPageNodeSideConfig: (pageNode: PMNode) => Nullable<T>,
    attrKey: string
): boolean => {
    if (!dispatch) return false;

    if (!isValidConfig(configObj)) {
        console.warn("Invalid side config:", configObj);
        return false;
    }

    if (!isPageNode(pageNode)) {
        console.error("Unexpected! Node at pos:", pagePos, "is not a page node!");
        return false;
    }

    if (getPageNodeSideConfig(pageNode) === configObj) {
        return false;
    }

    const success = setPageNodeAttribute(tr, pagePos, pageNode, attrKey, configObj);
    if (success) {
        dispatch(tr);
    }

    return success;
};

/**
 * Updates a page side configuration attribute. Does not dispatch the transaction.
 * @param tr - The transaction to apply the change to.
 * @param pagePos - The position of the page node to update the attribute for.
 * @param pageNode - The page node to update the attribute for.
 * @param configObj - The configuration object to update.
 * @param value - The new value of the configuration object.
 * @param getExistingConfig - A function to get the existing configuration object from
 * the node. Can return null if the configuration object is missing or invalid.
 * @param isValidConfig - A function to validate the configuration object.
 * @param defaultConfig - The default configuration object.
 * @param attrKey - The key of the attribute to update.
 * @returns {boolean} True if the attribute was updated, false otherwise.
 */
export const updatePageSideConfig = <V, T extends SideConfig<V>>(
    tr: Transaction,
    pagePos: number,
    pageNode: PMNode,
    configObj: MultiAxisSide,
    value: V,
    getExistingConfig: (pageNode: PMNode) => Nullable<T>,
    isValidConfig: (config: T) => boolean,
    defaultConfig: T,
    attrKey: string
): boolean => {
    if (!isPageNode(pageNode)) {
        return false;
    }

    const existingConfig = getExistingConfig(pageNode);
    let updatedConfig: T = { ...defaultConfig };
    if (existingConfig && isValidConfig(existingConfig)) {
        updatedConfig = { ...existingConfig };
    } else {
        if ((pageSides as MultiSide[]).includes(configObj)) {
            updatedConfig[configObj as PageSide] = value;
        } else {
            switch (configObj) {
                case "x":
                    updatedConfig.left = value;
                    updatedConfig.right = value;
                    break;
                case "y":
                    updatedConfig.top = value;
                    updatedConfig.bottom = value;
                    break;
                default:
                    console.error("Unhanded margin side", configObj);
            }
        }
    }

    return setPageNodeAttribute(tr, pagePos, pageNode, attrKey, updatedConfig);
};
