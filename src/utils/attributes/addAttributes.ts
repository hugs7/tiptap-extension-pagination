/**
 * @file /src/utils/attributes/addAttributes.ts
 * @name AddAttributes
 * @description Utility functions for adding node attributes.
 */

import { Attributes } from "@tiptap/core";
import { NodeAttributes } from "../../types/node";

/**
 * Add the specified attributes to the node.
 * @param attributes - The attributes to add to the node.
 * @returns {Attributes} The attributes to add to the node.
 */
export const addNodeAttributes = <T extends Record<string, any>>(attributes: NodeAttributes<T>): Attributes => {
    return Object.entries(attributes).reduce(
        (attributes, [key, config]) => ({
            ...attributes,
            [key]: {
                default: config.default,
                parseHTML: parseHTMLAttribute(key, config.default),
                renderHTML: renderHTMLAttribute(key),
            },
        }),
        {} as Attributes
    );
};

/**
 * Parse the HTML attribute of the element.
 * @param element - The element to parse the attribute from.
 * @param attr - The attribute to parse.
 * @param fallback - The fallback value if the attribute is not found.
 * @returns {T} The parsed attribute value or the fallback value.
 */
const parseHTMLAttribute =
    <T>(attr: string, fallback: T) =>
    (element: HTMLElement): T => {
        const margins = element.getAttribute(attr);
        return margins ? JSON.parse(margins) : fallback;
    };

/**
 * Render the HTML attribute.
 * @param attr - The attribute to render.
 * @param attributes - The attributes to render.
 * @returns {Object} The rendered attribute.
 */
const renderHTMLAttribute =
    <T extends Record<string, unknown>>(attr: keyof T) =>
    (attributes: T): { [key in keyof T]: string } => {
        const value = attributes[attr];

        return {
            [attr]: JSON.stringify(value),
        } as { [key in keyof T]: string };
    };
