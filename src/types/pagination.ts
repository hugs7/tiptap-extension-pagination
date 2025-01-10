/**
 * @file /src/types/pagination.ts
 * @name Pagination
 * @description Type definitions for pagination in the editor.
 */

import { NodeType } from "@tiptap/pm/model";

/**
 * Collects nodes types used in pagination.
 */
export type PaginationNodeTypes = {
    pageNodeType: NodeType;
    headerFooterNodeType: NodeType;
    bodyNodeType: NodeType;
};
