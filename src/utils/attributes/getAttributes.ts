/**
 * @file /src/utils/attributes/getAttributes.ts
 * @name GetAttributes
 * @description Utility functions for getting node attributes.
 */

import { Attrs, Node as PMNode } from "@tiptap/pm/model";
import { wrapJSONParse } from "../object";

/**
 * Check if the node has the specified attribute.
 * @param node - The node to check.
 * @param attr - The attribute to check for.
 * @returns {boolean} True if the node has the specified attribute, false otherwise.
 */
export const nodeHasAttribute = (node: PMNode, attr: string): boolean => {
    const { attrs } = node;
    return attr in attrs && attrs[attr] !== undefined && attrs[attr] !== null;
};

/**
 * A function used to compute the attributes for the node or mark
 * created by this rule. Can also be used to describe further
 * conditions the DOM element or style must match.
 * @param nodeTagAttribute - The attribute of the node tag.
 * @param preventNestedNodes - True if nested nodes should be prevented, false otherwise.
 * @returns {Attrs | false | null} When it returns `false`, the rule won't match.
 * When it returns null or undefined, that is interpreted as an empty/default set of
 * attributes.
 */
export const parseHTMLNodeGetAttrs =
    (nodeTagAttribute: string, preventNestedNodes: boolean) =>
    (node: HTMLElement): Attrs | false | null => {
        const parent = node.parentElement;

        if (preventNestedNodes) {
            if (parent && parent.hasAttribute(nodeTagAttribute)) {
                return false;
            }
        }

        const attrs = Array.from(node.attributes);

        return attrs.reduce((acc, attribute) => {
            const { name, value } = attribute;

            if (name in acc) {
                return acc;
            }

            return {
                ...acc,
                [name]: wrapJSONParse(value),
            };
        }, {});
    };
