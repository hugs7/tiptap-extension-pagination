/**
 * @file /src/constants/paper.ts
 * @name Paper
 * @description Constants for the paper sizes
 */

import {
    APaperSize,
    BPaperSize,
    CPaperSize,
    USPaperSize,
    PaperDimensions,
    PaperSize,
    PaperOrientation,
    PaperOrientationSelect,
    MarginConfig,
    Margin,
    CommonMarginName,
} from "../types/paper";
import { titleCase } from "../utils/string";

export const DEFAULT_PAPER_SIZE: PaperSize = "A4" as const;

const aPaperSizes: Record<APaperSize, PaperDimensions> = {
    A0: { width: 841, height: 1189 },
    A1: { width: 594, height: 841 },
    A2: { width: 420, height: 594 },
    A3: { width: 297, height: 420 },
    A4: { width: 210, height: 297 },
    A5: { width: 148, height: 210 },
    A6: { width: 105, height: 148 },
    A7: { width: 74, height: 105 },
    A8: { width: 52, height: 74 },
    A9: { width: 37, height: 52 },
    A10: { width: 26, height: 37 },
    A11: { width: 18, height: 26 },
    A12: { width: 13, height: 18 },
    A13: { width: 9, height: 13 },
    "2A0": { width: 1189, height: 1682 },
    "4A0": { width: 1682, height: 2378 },
    "A0+": { width: 914, height: 1292 },
    "A1+": { width: 609, height: 914 },
    "A3+": { width: 329, height: 483 },
};

const bPaperSizes: Record<BPaperSize, PaperDimensions> = {
    B0: { width: 1000, height: 1414 },
    B1: { width: 707, height: 1000 },
    B2: { width: 500, height: 707 },
    B3: { width: 353, height: 500 },
    B4: { width: 250, height: 353 },
    B5: { width: 176, height: 250 },
    B6: { width: 125, height: 176 },
    B7: { width: 88, height: 125 },
    B8: { width: 62, height: 88 },
    B9: { width: 44, height: 62 },
    B10: { width: 31, height: 44 },
    B11: { width: 22, height: 31 },
    B12: { width: 15, height: 22 },
    B13: { width: 11, height: 15 },
    "B0+": { width: 1118, height: 1580 },
    "B1+": { width: 720, height: 1020 },
    "B2+": { width: 520, height: 720 },
};

const cPaperSizes: Record<CPaperSize, PaperDimensions> = {
    C0: { width: 917, height: 1297 },
    C1: { width: 648, height: 917 },
    C2: { width: 458, height: 648 },
    C3: { width: 324, height: 458 },
    C4: { width: 229, height: 324 },
    C5: { width: 162, height: 229 },
    C6: { width: 114, height: 162 },
    C7: { width: 81, height: 114 },
    C8: { width: 57, height: 81 },
    C9: { width: 40, height: 57 },
    C10: { width: 28, height: 40 },
};

export const usPaperSizes: Record<USPaperSize, PaperDimensions> = {
    Letter: { width: 216, height: 279 },
    Legal: { width: 216, height: 356 },
    Tabloid: { width: 279, height: 432 },
    Ledger: { width: 432, height: 279 },
    "Junior Legal": { width: 127, height: 203 },
    "Half Letter": { width: 140, height: 216 },
    "Government Letter": { width: 203, height: 267 },
    "Government Legal": { width: 216, height: 330 },
    "ANSI A": { width: 216, height: 279 },
    "ANSI B": { width: 279, height: 432 },
    "ANSI C": { width: 432, height: 559 },
    "ANSI D": { width: 559, height: 864 },
    "ANSI E": { width: 864, height: 1118 },
    "Arch A": { width: 229, height: 305 },
    "Arch B": { width: 305, height: 457 },
    "Arch C": { width: 457, height: 610 },
    "Arch D": { width: 610, height: 914 },
    "Arch E": { width: 914, height: 1219 },
    "Arch E1": { width: 762, height: 1067 },
    "Arch E2": { width: 660, height: 965 },
    "Arch E3": { width: 686, height: 991 },
};

export const paperDimensions: Record<PaperSize, PaperDimensions> = {
    ...aPaperSizes,
    ...bPaperSizes,
    ...cPaperSizes,
    ...usPaperSizes,
};

export const paperSizes: PaperSize[] = Object.keys(paperDimensions) as PaperSize[];

export const LIGHT_PAPER_COLOUR: string = "#fff";
export const DARK_PAPER_COLOUR: string = "#222";
export const DEFAULT_PAPER_COLOUR: string = LIGHT_PAPER_COLOUR;

export const paperOrientations: PaperOrientation[] = ["portrait", "landscape"];

/**
 * A mapped version of the paper orientations where the oreintation is the key
 * and the label is the title cased version of the orientation. E.g. can be used
 * in a select input.
 */
export const paperOrientationsSelect: PaperOrientationSelect[] = paperOrientations.map((orientation) => ({
    orientation,
    label: titleCase(orientation),
}));

export const DEFAULT_PAPER_ORIENTATION: PaperOrientation = "portrait";

/**
 * Common margin configurations for different margin sizes.
 */
export const commonMarginConfigs: Record<CommonMarginName, MarginConfig> = {
    normal: { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 },
    narrow: { top: 12.7, right: 12.7, bottom: 12.7, left: 12.7 },
    moderate: { top: 25.4, right: 19.1, bottom: 25.4, left: 19.1 },
    wide: { top: 25.4, right: 50.8, bottom: 25.4, left: 50.8 },
};

/**
 * The common margin name for the default margin configuration.
 */
export const DEFAULT_PAGE_MARGIN_NAME: CommonMarginName = "normal";

/**
 * Standard margins are 1 inch or 25.4mm on all sides.
 */
export const DEFAULT_MARGIN_CONFIG: MarginConfig = commonMarginConfigs[DEFAULT_PAGE_MARGIN_NAME];

export const marginSides: Margin[] = ["top", "right", "bottom", "left"];
