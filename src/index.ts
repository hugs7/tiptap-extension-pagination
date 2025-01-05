/**
 * @file /src/index.ts
 * @name Index
 * @description Main entry point for the package
 */

// === Extensions ===
import PaginationExtension from "./PaginationExtension";

// === Types ===
export type { PaginationOptions } from "./PaginationExtension";
export type * from "./types/cursor";
export type * from "./types/node";
export type * from "./types/page";
export type * from "./types/paper";

// === Constants ===
export { DEFAULT_PAPER_SIZE, paperSizes, paperDimensions } from "./constants/paperSize";
export { LIGHT_PAPER_COLOUR, DARK_PAPER_COLOUR, DEFAULT_PAPER_COLOUR } from "./constants/paperColours";
export { DEFAULT_PAPER_ORIENTATION, paperOrientationsSelect } from "./constants/paperOrientation";
export { pageSides } from "./constants/pageSides";
export { DEFAULT_PAGE_MARGIN_NAME, DEFAULT_MARGIN_CONFIG, commonMarginConfigs } from "./constants/pageMargins";
export { DEFAULT_PAGE_BORDER_CONFIG } from "./constants/pageBorders";

// === Nodes ===
import PageNode from "./Nodes/Page";
import PageSectionNode from "./Nodes/PageSection";

// === Utils ===
export { isPageNode } from "./utils/page";
export { getPageNumber, getThisPageNodePosition } from "./utils/pagination";
export { getPageNumPaperSize, getPageNodePaperSize } from "./utils/paperSize";
export { getPageNumPaperColour, getPageNodePaperColour } from "./utils/paperColour";
export { getPageNumPaperOrientation, getPageNodePaperOrientation } from "./utils/paperOrientation";
export { getPageNumPaperMargins, getPageNodePaperMargins } from "./utils/paperMargins";
export { getPageNumPageBorders, getPageNodePageBorders } from "./utils/pageBorders";
export { doesDocHavePageNodes } from "./utils/page";

// === Exports ===
export { PageNode, PageSectionNode };

export default PaginationExtension;
