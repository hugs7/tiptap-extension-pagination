/**
 * @file /src/types/pagination.ts
 * @name Pagination
 * @description Type definitions for pagination in the editor.
 */

import { NodeType } from "@tiptap/pm/model";
import { PageContentPixelDimensions, PageNodeAttributes } from "./page";
import { PageRegionNodeAttributesObject } from "./pageRegions";

/**
 * Collects nodes types used in pagination.
 */
export type PaginationNodeTypes = {
    pageNodeType: NodeType;
    headerFooterNodeType: NodeType;
    bodyNodeType: NodeType;
};

/**
 * Collects node attributes used in pagination.
 */
export type PaginationNodeAttributes = {
    pageNodeAttributes: PageNodeAttributes;
    pageRegionNodeAttributes: PageRegionNodeAttributesObject;
    bodyPixelDimensions: PageContentPixelDimensions;
};
