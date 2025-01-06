/**
 * @file /src/constants/pageSection.ts
 * @name PageSection
 * @description Constants for page sections in the editor.
 */

import { AttributeConfig } from "../types/page";
import PageSectionType, { PageSectionNodeAttributes } from "../types/pageSection";
import { PAGE_ATTRIBUTES } from "./page";
import { DEFAULT_MARGIN_CONFIG } from "./pageMargins";

export const PAGE_SECTION_NODE_NAME = "pageSection" as const;

/**
 * The default page section type.
 */
export const DEFAULT_PAGE_SECTION_TYPE: PageSectionType = "body";

/**
 * The complete list of page section types.
 */
export const pageSectionTypes: PageSectionType[] = ["header", "body", "footer"];

/**
 * Lookup keys for page section node attributes.
 */
export const PAGE_SECTION_NODE_ATTR_KEYS = {
    pageMargins: "pageMargins",
    type: "type",
} as const;

/**
 * The default page section attributes.
 */
export const PAGE_SECTION_ATTRIBUTES: {
    [K in keyof PageSectionNodeAttributes]: AttributeConfig<PageSectionNodeAttributes[K]>;
} = {
    type: { default: DEFAULT_PAGE_SECTION_TYPE },
    paperSize: PAGE_ATTRIBUTES.paperSize,
    paperOrientation: PAGE_ATTRIBUTES.paperOrientation,
    pageMargins: { default: DEFAULT_MARGIN_CONFIG },
};
