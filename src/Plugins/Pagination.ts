/**
 * @file /src/Plugins/Pagination.ts
 * @name Pagination
 * @description Custom plugin for paginating the editor content.
 */

import { Plugin, PluginKey, EditorState } from "@tiptap/pm/state";
import { EditorView } from "@tiptap/pm/view";
import { renderPageView } from "../utils/pagination";
import { isNodeEmpty } from "../utils/node";
import { doesDocHavePageNodes } from "../utils/nodes/page/page";

const PaginationPlugin = new Plugin({
    key: new PluginKey("pagination"),
    view() {
        let isPaginating = false;

        return {
            update(view: EditorView, prevState: EditorState) {
                if (isPaginating) return;

                const { state } = view;
                const { doc, schema } = state;
                const pageType = schema.nodes.page;

                if (!pageType) return;

                const docChanged = !doc.eq(prevState.doc);
                const initialLoad = isNodeEmpty(prevState.doc) && !isNodeEmpty(doc);
                const hasPageNodes = doesDocHavePageNodes(state);

                if (!docChanged && hasPageNodes && !initialLoad) return;

                isPaginating = true;

                renderPageView(view);

                // Reset paginating flag regardless of success or failure because we do not want to get
                // stuck out of this loop.
                isPaginating = false;
            },
        };
    },
});

export default PaginationPlugin;
