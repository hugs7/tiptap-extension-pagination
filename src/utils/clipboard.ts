/**
 * @file /src/utils/clipboard.ts
 * @name Clipboard
 * @description Utility functions for clipboard operations.
 */

import { DOMSerializer, Fragment, Node as PMNode, Schema } from "@tiptap/pm/model";

/**
 * Constructs a clipboard serialiser that serialises only the children of the nodes of the specified schema.
 * @param schema - The schema to use for serialisation.
 * @returns {DOMSerializer} The constructed clipboard serialiser.
 */
export const constructChildOnlyClipboardSerialiser = (schema: Schema, isNode: (node: PMNode) => boolean): DOMSerializer => {
    // Extend DOMSerializer to override serializeFragment
    const clipboardSerialiser = Object.create(DOMSerializer.fromSchema(schema));

    // Override serializeFragment
    clipboardSerialiser.serializeFragment = (fragment: Fragment, options = {}, target = document.createDocumentFragment()) => {
        const serializer = DOMSerializer.fromSchema(schema);

        fragment.forEach((node) => {
            if (isNode(node)) {
                // Serialize only the children of the page node
                serializer.serializeFragment(node.content, options, target);
            } else {
                // Serialize non-page nodes directly
                serializer.serializeNode(node, options);
            }
        });

        return target;
    };

    return clipboardSerialiser;
};
