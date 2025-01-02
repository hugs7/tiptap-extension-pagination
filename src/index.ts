/**
 * @file /src/index.ts
 * @name Index
 * @description Main entry point for the package
 */

// === Extensions ===
import PaginationExtension from "./PaginationExtension";

// === Types ===

export type { PaperSize } from "./types/paper";

// === Constants ===
export { DEFAULT_PAPER_SIZE, paperSizes, paperDimensions, LIGHT_PAPER_COLOUR, DARK_PAPER_COLOUR } from "./constants/paper";

// === Nodes ===
import PageNode from "./Nodes/Page";

// === Utils ===
export { isPageNode } from "./utils/page";
export { getPageNumber } from "./utils/pagination";
export { getPageNumPaperSize, getPageNumPaperColour } from "./utils/paper";

// === Exports ===
export { PageNode };

export default PaginationExtension;
