/**
 * @file /src/types/pageSection.ts
 * @name PageSection
 * @description Type definitions for page sections in the editor.
 */

import { PageNodeAttributes } from "./page";
import { MarginConfig } from "./paper";

type PageSectionType = "header" | "body" | "footer";

/**
 * Attributes for a page section node.
 */
export type PageSectionNodeAttributes = Pick<PageNodeAttributes, "paperSize" | "paperOrientation"> & {
    pageMargins: MarginConfig;
    type: PageSectionType;
};

/**
 * Object mapping page section types to their attributes (for a given page)
 */
export type PageSectionNoteAttributesObject = { [key in PageSectionType]: PageSectionNodeAttributes };

export default PageSectionType;
