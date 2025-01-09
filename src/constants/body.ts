/**
 * @file /src/constants/body.ts
 * @name Body
 * @description Constants for body node in the editor.
 */

import { NodeAttributes } from "../types/node";
import { BodyNodeAttributes } from "../types/body";
import { DEFAULT_PAGE_MARGIN_CONFIG } from "./pageMargins";

export const BODY_NODE_NAME = "body" as const;

/**
 * Lookup keys for body node attributes.
 */
export const BODY_NODE_ATTR_KEYS = {} as const;

/**
 * The default body node attributes.
 */
export const BODY_DEFAULT_ATTRIBUTES: BodyNodeAttributes = {
    pageMargins: DEFAULT_PAGE_MARGIN_CONFIG,
};

/**
 * The body node attributes.
 */
export const BODY_ATTRIBUTES: NodeAttributes<BodyNodeAttributes> = {
    pageMargins: { default: DEFAULT_PAGE_MARGIN_CONFIG },
};
