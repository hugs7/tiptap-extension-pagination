/**
 * @file /src/types/paper.ts
 * @name Paper
 * @description This file contains type definitions for paper sizes.
 */

export type PaperDimensions = { width: number; height: number };

export type APaperSize =
    | "A0"
    | "A1"
    | "A2"
    | "A3"
    | "A4"
    | "A5"
    | "A6"
    | "A7"
    | "A8"
    | "A9"
    | "A10"
    | "A11"
    | "A12"
    | "A13"
    | "2A0"
    | "4A0"
    | "A0+"
    | "A1+"
    | "A3+";

export type BPaperSize =
    | "B0"
    | "B1"
    | "B2"
    | "B3"
    | "B4"
    | "B5"
    | "B6"
    | "B7"
    | "B8"
    | "B9"
    | "B10"
    | "B11"
    | "B12"
    | "B13"
    | "B0+"
    | "B1+"
    | "B2+";

export type CPaperSize = "C0" | "C1" | "C2" | "C3" | "C4" | "C5" | "C6" | "C7" | "C8" | "C9" | "C10";

export type USPaperSize =
    | "Letter"
    | "Legal"
    | "Tabloid"
    | "Ledger"
    | "Junior Legal"
    | "Half Letter"
    | "Government Letter"
    | "Government Legal"
    | "ANSI A"
    | "ANSI B"
    | "ANSI C"
    | "ANSI D"
    | "ANSI E"
    | "Arch A"
    | "Arch B"
    | "Arch C"
    | "Arch D"
    | "Arch E"
    | "Arch E1"
    | "Arch E2"
    | "Arch E3";

export type PaperSize = APaperSize | BPaperSize | CPaperSize | USPaperSize;

export type PaperOrientation = "portrait" | "landscape";
export type PaperOrientationSelect = { orientation: PaperOrientation; label: string };
