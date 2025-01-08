/**
 * @file /src/constants/pageRegions.ts
 * @name PageRegions
 * @description Constants for page regions in the editor.
 */

import { NodeAttributes } from "../types/node";
import { FooterNodeAttributes, HeaderFooterNodeAttributes, HeaderNodeAttributes } from "../types/pageRegions";

export const HEADER_FOOTER_NODE_NAME = "header-footer" as const;

/**
 * Key for the header footer node attributes.
 */
export const HEADER_FOOTER_NODE_ATTR_KEYS = {
    type: "type",
    pageEndOffset: "pageEndOffset",
    height: "height",
    xMargins: "xMargins",
} as const;

/**
 * Default attributes for header and footer nodes.
 */
export const HEADER_FOOTER_DEFAULT_ATTRIBUTES: Omit<HeaderFooterNodeAttributes<unknown>, "type" | "pageEndOffset"> = {
    height: 10,
    xMargins: { left: 25.4, right: 25.4 },
};

/**
 * Default attributes for header nodes
 */
export const HEADER_DEFAULT_ATTRIBUTES: HeaderNodeAttributes = {
    type: "header",
    pageEndOffset: 10,
    ...HEADER_FOOTER_DEFAULT_ATTRIBUTES,
};

/**
 * Default attributes for footer nodes
 */
export const FOOTER_DEFAULT_ATTRIBUTES: FooterNodeAttributes = {
    type: "footer",
    pageEndOffset: -10,
    ...HEADER_FOOTER_DEFAULT_ATTRIBUTES,
};

/**
 * The header/footer node attributes.
 */
export const HEADER_FOOTER_ATTRIBUTES: NodeAttributes<HeaderFooterNodeAttributes<unknown>> = Object.fromEntries(
    Object.entries(HEADER_DEFAULT_ATTRIBUTES).map(([key, value]) => [key, { default: value }])
) as NodeAttributes<HeaderFooterNodeAttributes<unknown>>;
