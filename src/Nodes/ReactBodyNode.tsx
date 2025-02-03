import { NodeViewContent, NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import React, { useRef, useEffect } from "react";
import { calculateBodyDimensions } from "../utils/pageRegion/dimensions";
import { calculateShorthandMargins, calculateBodyMargins } from "../utils/nodes/body/attributes/pageMargins";
import { mm } from "../utils/units";
import { getPageNodeAndPosition } from "../utils/nodes/page/pagePosition";

/**
 * React component for rendering the Body node view with lazy loading
 * @param props - NodeViewProps containing node, editor, and other properties
 * @returns JSX.Element representing the body node view
 */
export function ReactBodyNode(props: NodeViewProps) {
    const { node, editor, getPos } = props;
    const containerRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = React.useState(false);
    const [lastKnownHeight, setLastKnownHeight] = React.useState(0);
    const contentRef = useRef<HTMLDivElement>(null);

    // Setup intersection observer for lazy loading
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
            },
            {
                root: null,
                rootMargin: '10px',
                threshold: 0.001
            }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            if (containerRef.current) {
                observer.unobserve(containerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const resizeObserver = new ResizeObserver((entries) => {
            if (isVisible && entries[0].contentRect.height !== lastKnownHeight) {
                setLastKnownHeight(entries[0].contentRect.height);
            }
        });

        if (contentRef.current) {
            resizeObserver.observe(contentRef.current);
        }

        return () => {
            if (contentRef.current) {
                resizeObserver.unobserve(contentRef.current);
            }
        };
    }, []);

    // Setup dimensions and styles
    useEffect(() => {
        if (!containerRef.current) return;

        const pos = getPos();
        const { node: pageNode } = getPageNodeAndPosition(editor.state.doc, pos);
        if (!pageNode) {
            throw new Error(`Page node not found from body node at position ${pos}`);
        }

        const { width, height } = calculateBodyDimensions(pageNode, node);
        const calculatedMargins = calculateBodyMargins(node);

        const container = containerRef.current;
        container.style.height = mm(height);
        container.style.width = mm(width);
        container.style.margin = calculateShorthandMargins(calculatedMargins);
        container.style.border = "1px solid #ccc";
        container.style.overflow = "hidden";
        container.style.position = "relative";
    }, [node, editor, getPos]);

    return (
        <NodeViewWrapper
            ref={containerRef}
            data-page-body="true"
            className="body-node"
            data-page-body-content={isVisible}
        >
            <div ref={contentRef} style={{ width: "100%", height: "100%", backgroundColor: isVisible ? "green" : "red", visibility: isVisible ? "visible" : "hidden"}}>
                 <NodeViewContent  />
            </div>
           
        </NodeViewWrapper>
    );
}