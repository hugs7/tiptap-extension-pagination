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
export type HeaderFooterNodeAttributes = {
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

export type PageRegionNodeAttributesObject = {
    header: HeaderFooterNodeAttributes;
    body: BodyNodeAttributes;
    footer: HeaderFooterNodeAttributes;
};
