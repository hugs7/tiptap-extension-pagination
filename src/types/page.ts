/**
 * @file /src/types/page.ts
 * @name Page
 * @description This file contains type definitions for page sizes.
 */

import { BorderConfig, PaperOrientation, PaperSize } from "./paper";

/**
 * The dimensions of a page in pixels. Deliberately not using PaperDimensions
 * from /src/types/paper.ts to avoid mistakenly using the wrong units.
 */
export type PageContentPixelDimensions = { pageContentHeight: number; pageContentWidth: number };

/**
 * Attributes for a page node.
 */
export type PageNodeAttributes = {
    paperSize: PaperSize;
    paperColour: string;
    paperOrientation: PaperOrientation;
    pageBorders: BorderConfig;
};

export type AttributeConfig<T> = {
    default: T;
};
