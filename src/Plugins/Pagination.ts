/**
 * @file /src/Plugins/Pagination.ts
 * @name Pagination
 * @description Custom plugin for paginating the editor content.
 */

import { Plugin, PluginKey, EditorState } from "@tiptap/pm/state";
import { EditorView } from "@tiptap/pm/view";
import {
  buildNewDocument,
  collectContentNodes,
  mapCursorPosition,
  measureNodeHeights,
  paginationUpdateCursorPosition,
} from "../utils/pagination";
import { isNodeEmpty } from "../utils/node";
import { doesDocHavePageNodes } from "../utils/page";

const PaginationPlugin = new Plugin({
  key: new PluginKey("pagination"),
  view() {
    let isPaginating = false;

    return {
      update(view: EditorView, prevState: EditorState) {
        if (isPaginating) return;

        const { state, dispatch } = view;
        const { doc, schema } = state;
        const pageType = schema.nodes.page;

        if (!pageType) return;

        const docChanged = !doc.eq(prevState.doc);
        const initialLoad = isNodeEmpty(prevState.doc) && !isNodeEmpty(doc);
        const hasPageNodes = doesDocHavePageNodes(state);

        if (!docChanged && hasPageNodes && !initialLoad) return;

        isPaginating = true;

        try {
          const contentNodes = collectContentNodes(state);
          const nodeHeights = measureNodeHeights(view, contentNodes);

          // Record the cursor's old position
          const { selection } = state;
          const oldCursorPos = selection.from;

          const { newDoc, oldToNewPosMap } = buildNewDocument(
            state,
            contentNodes,
            nodeHeights,
            view
          );

          const tr = state.tr;
          // Compare the content of the documents
          if (!newDoc.content.eq(doc.content)) {
            tr.replaceWith(0, doc.content.size, newDoc.content);
            tr.setMeta("pagination", true);

            const newDocContentSize = newDoc.content.size;
            const newCursorPos = mapCursorPosition(
              contentNodes,
              oldCursorPos,
              oldToNewPosMap,
              newDocContentSize
            );
            paginationUpdateCursorPosition(tr, newCursorPos);
          }

          dispatch(tr);
        } catch (error) {
          console.error("Error updating page view. Details:", error);
        }

        // Reset paginating flag regardless of success or failure because we do not want to get
        // stuck out of this loop.
        isPaginating = false;
      },
    };
  },
});

export default PaginationPlugin;