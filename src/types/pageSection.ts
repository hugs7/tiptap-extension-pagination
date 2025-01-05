/**
 * @file /src/types/pageSection.ts
 * @name PageSection
 * @description Type definitions for page sections in the editor.
 */

import { PageNodeAttributes } from "./page";

type PageSectionType = "header" | "body" | "footer";

/**
 * Attributes for a page section node.
 */
export type PageSectionNodeAttributes = Pick<PageNodeAttributes, "paperSize" | "paperOrientation" | "pageMargins"> & {
    type: PageSectionType;
};

export default PageSectionType;
