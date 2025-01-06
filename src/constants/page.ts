/**
 * @file /src/constants/page.ts
 * @name Page
 * @description Constants for page nodes in the editor.
 */

import { DEFAULT_PAPER_ORIENTATION } from "../constants/paperOrientation";
import { AttributeConfig, PageNodeAttributes } from "../types/page";
import { DEFAULT_PAGE_BORDER_CONFIG } from "./pageBorders";
import { DEFAULT_PAPER_SIZE } from "./paperSize";
import { DEFAULT_PAPER_COLOUR } from "./paperColours";

export const PAGE_NODE_NAME = "page" as const;

export const PAGE_NODE_ATTR_KEYS = {
    paperSize: "paperSize",
    paperColour: "paperColour",
    paperOrientation: "paperOrientation",
    pageBorders: "pageBorders",
} as const;

export const PAGE_ATTRIBUTES: {
    [K in keyof PageNodeAttributes]: AttributeConfig<PageNodeAttributes[K]>;
} = {
    paperSize: { default: DEFAULT_PAPER_SIZE },
    paperColour: { default: DEFAULT_PAPER_COLOUR },
    paperOrientation: { default: DEFAULT_PAPER_ORIENTATION },
    pageBorders: { default: DEFAULT_PAGE_BORDER_CONFIG },
};

// ====== Page Gap ======

export const DEFAULT_PAGE_GAP: number = 12;
