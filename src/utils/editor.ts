/**
 * @file /src/utils/editor.ts
 * @name Editor
 * @description Utility functions for the Tiptap editor.
 */

import { Editor } from "@tiptap/core";
import { EditorState } from "@tiptap/pm/state";

/**
 * Get the editor state from the context.
 * @param context - The current editor instance or editor state.
 * @returns {EditorState} The editor state.
 */
export const getStateFromContext = (context: Editor | EditorState): EditorState => {
    return context instanceof Editor ? context.state : context;
};
