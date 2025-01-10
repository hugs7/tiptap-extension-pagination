/**
 * @file /src/utils/nodes/body/bodyPosition.ts
 * @name BodyPosition
 * @description Utility functions for the body position node.
 */

import { Node as PMNode, ResolvedPos } from "@tiptap/pm/model";
import { Nullable } from "../../../types/record";
import { isBodyNode } from "./body";
import { BODY_NODE_NAME } from "../../../constants/body";
import { getParentNodePosOfType } from "../node";

/**
 * Get the body node (parent of the current node) position.
 * @param doc - The document node.
 * @param pos - The resolved position in the document or the absolute position of the node.
 * @returns {number} The position of the body node.
 */
export const getThisBodyNodePosition = (doc: PMNode, pos: ResolvedPos | number): number => {
    return getParentNodePosOfType(doc, pos, BODY_NODE_NAME).pos;
};

/**
 * Get the body node position and the body node itself.
 * @param doc - The document node.
 * @param pos - The resolved position in the document or the absolute position of the node.
 * @returns {bodyPos: number, bodyNode: Node} The position and the node of the body.
 */
export const getBodyNodeAndPosition = (doc: PMNode, pos: ResolvedPos | number): { bodyPos: number; bodyNode: Nullable<PMNode> } => {
    if (typeof pos === "number") {
        return getBodyNodeAndPosition(doc, doc.resolve(pos));
    }

    const bodyPos = getThisBodyNodePosition(doc, pos);
    const bodyNode = doc.nodeAt(bodyPos);
    if (!isBodyNode(bodyNode)) {
        console.warn("No body node found");
        return { bodyPos: -1, bodyNode };
    }

    return { bodyPos, bodyNode };
};

/**
 * Get the start of the body position.
 * @param doc - The document node.
 * @param pos - The resolved position in the document or the absolute position of the node.
 * @returns {number} The start position of the body.
 */
export const getStartOfBodyPosition = (doc: PMNode, pos: ResolvedPos | number): number => {
    if (typeof pos === "number") {
        return getStartOfBodyPosition(doc, doc.resolve(pos));
    }

    const { bodyPos } = getBodyNodeAndPosition(doc, pos);

    return bodyPos;
};

/**
 * Get the end of the body position.
 * @param doc - The document node.
 * @param pos - The resolved position in the document or the absolute position of the node.
 * @returns {number} The end position of the body.
 */
export const getEndOfBodyPosition = (doc: PMNode, pos: ResolvedPos | number): number => {
    if (typeof pos === "number") {
        return getEndOfBodyPosition(doc, doc.resolve(pos));
    }

    const { bodyPos, bodyNode } = getBodyNodeAndPosition(doc, pos);
    if (!bodyNode) {
        return bodyPos;
    }

    return bodyPos + bodyNode.content.size;
};
