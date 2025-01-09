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
export type * from "./types/body";

// === Constants ===
export { DEFAULT_PAPER_SIZE, paperSizes, paperDimensions } from "./constants/paperSize";
export { LIGHT_PAPER_COLOUR, DARK_PAPER_COLOUR, DEFAULT_PAPER_COLOUR } from "./constants/paperColours";
export { DEFAULT_PAPER_ORIENTATION, paperOrientationsSelect } from "./constants/paperOrientation";
export { pageSides } from "./constants/pageSides";
export { DEFAULT_PAGE_MARGIN_NAME, DEFAULT_PAGE_MARGIN_CONFIG, commonMarginConfigs } from "./constants/pageMargins";
export { DEFAULT_PAGE_BORDER_CONFIG } from "./constants/pageBorders";

// === Nodes ===
import PageNode from "./Nodes/Page";
import HeaderFooterNode from "./Nodes/HeaderFooter";
import BodyNode from "./Nodes/Body";

// === Utils ===
export { isPageNode } from "./utils/nodes/page/page";
export { getPageNumber, getThisPageNodePosition } from "./utils/pagination";
export { getPageNumPaperSize, getPageNodePaperSize } from "./utils/paperSize";
export { getPageNumPaperOrientation, getPageNodePaperOrientation } from "./utils/paperOrientation";
export { getPageNumPaperColour, getPageNodePaperColour } from "./utils/paperColour";
export { getPageNumPageMargins, getPageNodePageMargins } from "./utils/margins/pageMargins";
export { getPageNumPageBorders, getPageNodePageBorders } from "./utils/borders/pageBorders";
export { doesDocHavePageNodes } from "./utils/nodes/page/page";

// === Exports ===
export { PageNode, HeaderFooterNode, BodyNode };

export default PaginationExtension;
