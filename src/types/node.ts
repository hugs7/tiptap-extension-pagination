/**
 * @file /src/types/node.ts
 * @name Node
 * @description This file contains type definitions for nodes.
 */

import { Node as PMNode } from "@tiptap/pm/model";
import { AttributeConfig } from "./page";
import { Nullable } from "./record";

export type NodePosArray = Array<NodePos>;
export type NodePos = { node: PMNode; pos: number };
export type NullableNodePos = { node: Nullable<PMNode>; pos: number };

export type NodeAttributes<NA extends Record<string, any>> = {
    [K in keyof NA]: AttributeConfig<NA[K]>;
};

/**
 * From built in type of Tiptap. The (direct) child node of a parent node, if any,
 * along with its index and offset relative to the parent node.
 */
export type DirectChild = {
    node: Nullable<PMNode>;
    index: number;
    offset: number;
};
