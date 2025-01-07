/**
 * @file /src/constants/pageRegions.ts
 * @name PageRegions
 * @description Constants for page regions in the editor.
 */

import { NodeAttributes } from "../types/node";
import { HeaderFooterNodeAttributes } from "../types/pageRegions";

export const HEADER_FOOTER_NODE_NAME = "header-footer" as const;

/**
 * Key for the header footer node attributes.
 */
export const HEADER_FOOTER_NODE_ATTR_KEYS = {
    start: "start",
    height: "height",
    xMargins: "xMargins",
} as const;

/**
 * Default attributes for header and footer nodes.
 */
export const HEADER_FOOTER_DEFAULT_ATTRIBUTES: HeaderFooterNodeAttributes = {
    start: 10,
    height: 10,
    xMargins: { left: 25.4, right: 25.4 },
};

/**
 * The header/footer node attributes.
 */
export const HEADER_FOOTER_ATTRIBUTES: NodeAttributes<HeaderFooterNodeAttributes> = {
    start: { default: HEADER_FOOTER_DEFAULT_ATTRIBUTES.start },
    height: { default: HEADER_FOOTER_DEFAULT_ATTRIBUTES.height },
    xMargins: { default: HEADER_FOOTER_DEFAULT_ATTRIBUTES.xMargins },
};
