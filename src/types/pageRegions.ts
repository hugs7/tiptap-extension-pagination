/**
 * @file /src/types/pageRegions.ts
 * @name PageRegions
 * @description Type definitions for page regions in the editor.
 */

import { BodyNodeAttributes } from "./body";
import { XMarginConfig } from "./page";

export type HeaderFooter = "header" | "footer";
export type PageRegion = "header" | "body" | "footer";

/**
 * Attributes for header and footer nodes.
 */
export type HeaderFooterNodeAttributes<T extends HeaderFooter | unknown> = {
    /**
     * The type of the node. Either "header" or "footer".
     */
    type: T;

    /**
     * The start position of the header in millimeters. That is, the distance from the top of
     * the page to the top of the header.
     */
    start: number;

    /**
     * Height of the header in millimeters.
     */
    height: number;

    /**
     * The x-axis margins of the header.
     */
    xMargins: XMarginConfig;
};

/**
 * Attributes for a header node.
 */
export type HeaderNodeAttributes = HeaderFooterNodeAttributes<"header">;

/**
 * Attributes for a footer node.
 */
export type FooterNodeAttributes = HeaderFooterNodeAttributes<"footer">;

/**
 * Groups the attributes of all the page regions into a single object.
 */
export type PageRegionNodeAttributesObject = {
    header: HeaderNodeAttributes;
    body: BodyNodeAttributes;
    footer: FooterNodeAttributes;
};
