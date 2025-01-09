/**
 * @file /src/constants/page.ts
 * @name Page
 * @description Constants for page nodes in the editor.
 */

import { DEFAULT_PAPER_ORIENTATION } from "../constants/paperOrientation";
import { PageNodeAttributes } from "../types/page";
import { NodeAttributes } from "../types/node";
import { DEFAULT_PAGE_BORDER_CONFIG } from "./pageBorders";
import { DEFAULT_PAPER_SIZE } from "./paperSize";
import { DEFAULT_PAPER_COLOUR } from "./paperColours";
import { DEFAULT_PAGE_MARGIN_CONFIG } from "./pageMargins";

export const PAGE_NODE_NAME = "page" as const;

export const PAGE_NODE_ATTR_KEYS = {
    paperSize: "paperSize",
    paperOrientation: "paperOrientation",
    paperColour: "paperColour",
    pageMargins: "pageMargins",
    pageBorders: "pageBorders",
} as const;

export const PAGE_ATTRIBUTES: NodeAttributes<PageNodeAttributes> = {
    paperSize: { default: DEFAULT_PAPER_SIZE },
    paperOrientation: { default: DEFAULT_PAPER_ORIENTATION },
    paperColour: { default: DEFAULT_PAPER_COLOUR },
    pageMargins: { default: DEFAULT_PAGE_MARGIN_CONFIG },
    pageBorders: { default: DEFAULT_PAGE_BORDER_CONFIG },
};

// ====== Page Gap ======

export const DEFAULT_PAGE_GAP: number = 12;
