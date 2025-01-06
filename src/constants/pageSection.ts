/**
 * @file /src/constants/pageSection.ts
 * @name PageSection
 * @description Constants for page sections in the editor.
 */

import { AttributeConfig } from "../types/page";
import { PageSectionNodeAttributes } from "../types/pageSection";
import { PAGE_ATTRIBUTES } from "./page";
import { DEFAULT_MARGIN_CONFIG } from "./pageMargins";

export const PAGE_SECTION_NODE_NAME = "pageSection" as const;

export const PAGE_SECTION_NODE_ATTR_KEYS = {
    pageMargins: "pageMargins",
    type: "type",
} as const;

export const PAGE_SECTION_ATTRIBUTES: {
    [K in keyof PageSectionNodeAttributes]: AttributeConfig<PageSectionNodeAttributes[K]>;
} = {
    type: { default: "body" },
    paperSize: PAGE_ATTRIBUTES.paperSize,
    paperOrientation: PAGE_ATTRIBUTES.paperOrientation,
    pageMargins: { default: DEFAULT_MARGIN_CONFIG },
};
