/**
 * @file /src/types/pageSection.ts
 * @name PageSection
 * @description Type definitions for bodys in the editor.
 */

import { MarginConfig } from "./page";

/**
 * Attributes for a body node.
 */
export type BodyNodeAttributes = {
    pageMargins: MarginConfig;
};
