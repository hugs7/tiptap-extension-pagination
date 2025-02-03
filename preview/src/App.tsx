/**
 * @file /src/Tiptap/Editor.tsx
 * @name Editor
 * @description Example Tiptap editor with pagination plugin.
 */

import React, { useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Pagination, { PageNode, HeaderFooterNode, BodyNode } from "../../";


export const App: React.FC = () => {
    // ====== Prop Destructuring ======

    // ====== Constants ======

    const extensions = [StarterKit, Pagination, PageNode, HeaderFooterNode, BodyNode];

    // ====== State Variables ======

    // ====== Refs ======

    // ====== Memo Hooks ======

    // ====== Effect Hooks ======

    // ====== Hooks ======
    const [content, setContent] = useState("");

    const editor = useEditor({
        extensions,
        content,
        onUpdate({ editor }) {
            const editorContent = editor.getHTML();
            handleChange(editorContent);
        },
        editable: true,
        onSelectionUpdate({ editor }) {
            const { state } = editor;
            const { selection } = state;
            const { $from, $to } = selection;
            console.log("Selection updated", $from.pos, $to.pos);
        },
    });

    // ====== Functions ======

    // ====== Event Handlers ======

    /**
     * Handles change in text.
     * @param value - new text value
     * @returns {void}
     */
    const handleChange = (value: string): void => {
        setContent(value);
    };

    // ====== Render Helpers ======

    // ====== Render ======

    return (
        <div style={{ width: "100%", height: "100%", color: "black" }}>
            <EditorContent editor={editor} />
        </div>
    );
};