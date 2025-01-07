/**
 * @file /src/types/node.ts
 * @name Node
 * @description This file contains type definitions for nodes.
 */

import { Node as PMNode } from "@tiptap/pm/model";
import { AttributeConfig } from "./page";

export type NodePosArray = Array<NodePos>;
export type NodePos = { node: PMNode; pos: number };

export type NodeAttributes<NA extends Record<string, any>> = {
    [K in keyof NA]: AttributeConfig<NA[K]>;
};
