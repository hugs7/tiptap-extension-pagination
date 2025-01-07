/**
 * @file /src/types/page.ts
 * @name Page
 * @description This file contains type definitions for page sizes.
 */

import { PaperOrientation, PaperSize } from "./paper";

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

// ====== Page Sides ======

export type XPageSide = "left" | "right";
export type YPageSide = "top" | "bottom";
export type PageSide = XPageSide | YPageSide;
export type Axis = "x" | "y";
export type MultiSide = PageSide | Axis | "all";
export type MultiAxisSide = PageSide | Axis;

// ====== Margins ======

/**
 * Margins on the page in millimeters.
 */
export type MarginConfig = {
    [key in PageSide]: number;
};

/**
 * X-axis margins on the page in millimeters.
 */
export type XMarginConfig = {
    [key in XPageSide]: number;
};

/**
 * Y-axis margins on the page in millimeters.
 */
export type YMarginConfig = {
    [key in YPageSide]: number;
};

export type CommonMarginName = "normal" | "narrow" | "moderate" | "wide";

// ====== Page Borders ======

export type BorderConfig = {
    [key in PageSide]: number;
};
