import { Node as PMNode, Schema } from "@tiptap/pm/model";
import { EditorView } from "@tiptap/pm/view";
import { TableGroup, TableMapping, TableMeasurement, TableSplitResult } from "../types/table";
import { TABLE_NODE_TYPE } from "../constants/table";
import { sumArray } from "./math";
import { NodePosArray } from "../types/node";

export class TableHandler {
    private static instance: TableHandler;
    private measurementCache: Map<string, TableMeasurement> = new Map();
    private tableGroups: Map<string, TableGroup> = new Map();

    /**
     * Get the singleton instance of the TableHandler.
     * @returns The singleton instance of the TableHandler.
     */
    static getInstance(): TableHandler {
        if (!this.instance) {
            this.instance = new TableHandler();
        }
        return this.instance;
    }

    /**
     * Get a cache key for a table node.
     * @param node The table node.
     * @returns The cache key as a string.
     */
    private getTableCacheKey(node: PMNode): string {
        return `${node.type.name}-${node.content.size}-${JSON.stringify(node.toJSON())}`;
    }

    /**
     * Measure the height of a table.
     * @param node The table node.
     * @param pos The position of the table in the document.
     * @param view The editor view.
     * @returns The measurement of the table.
     */
    measureTable(node: PMNode, pos: number, view: EditorView): TableMeasurement {
        const cacheKey = this.getTableCacheKey(node);
        const cached = this.measurementCache.get(cacheKey);
        if (cached) return cached;
        const rows = node.content.content as PMNode[];
        const rowHeights = this.measureRowHeights(rows, pos, view);
        const headerRowCount = this.getHeaderRowCount(node);

        // Calculate cumulative heights
        const cumulativeHeights = rowHeights.reduce((acc, height) => {
            const prev = acc[acc.length - 1] ?? 0;
            acc.push(prev + height);
            return acc;
        }, [] as number[]);

        const measurement = {
            rowHeights,
            headerRowCount,
            totalHeight: cumulativeHeights[cumulativeHeights.length - 1] ?? 0,
            breakPoints: [],
            cumulativeHeights,
        };

        // Only cache if we have valid measurements
        if (measurement.totalHeight > 0) {
            this.measurementCache.set(cacheKey, measurement);
        }

        return measurement;
    }

    /**
     * Measures the heights of rows in a table.
     * @param rows The rows to measure.
     * @param pos The position of the table in the document.
     * @param view The editor view.
     * @returns An array of row heights.
     */
    private measureRowHeights(rows: PMNode[], pos: number, view: EditorView): number[] {
        const dom = view.nodeDOM(pos) as HTMLElement;
        if (dom) {
            const trs = dom.querySelectorAll("tr");
            return rows.map((row, index) => {
                const { height } = trs[index].getBoundingClientRect();
                return height || row.nodeSize;
            });
        }
        // Fallback to using nodeSize if DOM is not available
        const firstRow = rows?.[0];
        //@ts-ignore
        const table = firstRow?.type.name === TABLE_NODE_TYPE ? firstRow : firstRow?.parent;
        if (!table) {
            return rows.map((row) => row.nodeSize);
        }
        // If table exists but DOM is not available, use nodeSize
        return rows.map((row) => row.nodeSize);
    }

    private getHeaderRowCount(node: PMNode): number {
        return node.attrs.headerRows || 0;
    }
    /**
     * Manages table pagination by handling table splitting and positioning
     * @param node The table node to manage
     * @param oldPos The original position of the table
     * @param view The editor view
     * @param schema The document schema
     * @param contentNodes Array of content nodes
     * @param availableHeight Available height on current page
     * @param pageContentHeight Total height of a page
     * @param i Current index in contentNodes array
     * @returns Object containing processed tables, measurements, oldPoses, and the updated index
     */
    manageTable(
        node: PMNode,
        oldPos: number,
        view: EditorView,
        schema: Schema,
        contentNodes: NodePosArray,
        availableHeight: number,
        pageContentHeight: number,
        i: number
    ): { tables: PMNode[]; measurements: TableMeasurement[]; oldPoses: number[]; newIndex: number } {
        let tables: PMNode[] = [];
        let measurements: TableMeasurement[] = [];
        const oldPoses: number[] = [];

        if (!node.attrs.groupId) {
            const measurement = this.measureTable(node, oldPos, view);
            const { tables: optimisedTables, measurements: optimisedMeasurements } = this.splitTableAtHeight(
                node,
                availableHeight,
                measurement,
                schema,
                pageContentHeight
            );
            tables = this.filterTablesWithContent(optimisedTables);
            measurements = optimisedMeasurements.slice(0, tables.length);
            oldPoses.push(oldPos);
            return { tables, measurements, oldPoses, newIndex: i };
        } else {
            const groupTables = contentNodes.filter(
                (n) => n.node.type.name === TABLE_NODE_TYPE && n.node.attrs.groupId === node.attrs.groupId
            );
            const groupMeasurements = groupTables.map((t) => this.measureTable(t.node, t.pos, view));
            groupTables.forEach((t) => {
                oldPoses.push(t.pos);
            });
            const { tables: optimisedTables, measurements: optimisedMeasurements } = this.optimiseTables(
                groupTables.map((t) => t.node),
                groupMeasurements,
                schema,
                availableHeight,
                pageContentHeight
            );
            tables = this.filterTablesWithContent(optimisedTables);
            measurements = optimisedMeasurements.slice(0, tables.length);
            return { tables, measurements, oldPoses, newIndex: i + groupTables.length - 1 };
        }
    }
    /**
     * Determines the index at which to split a table based on available height.
     * @param measurement The measurement details of the table.
     * @param headerRowCount The number of header rows in the table.
     * @param availableHeight The available height for the table on the current page.
     * @returns The index at which to split the table.
     */
    private getSplitIndex(measurement: TableMeasurement, headerRowCount: number, availableHeight: number): [number, number] {
        let splitIndex = headerRowCount;
        let currentHeight = sumArray(measurement.rowHeights.slice(0, headerRowCount));

        for (let i = headerRowCount; i < measurement.rowHeights.length; i++) {
            if (currentHeight + measurement.rowHeights[i] > availableHeight) {
                break;
            }
            currentHeight += measurement.rowHeights[i];
            splitIndex = i + 1;
        }
        return [splitIndex, currentHeight];
    }

    /**
     * Split a table at a given height.
     * @param tableNode The table node to split.
     * @param availableHeight The available height for the table.
     * @param measurement The measurement of the table.
     * @param schema The schema of the document.
     * @param pageHeight The height of the page.
     * @returns The split result containing the tables, measurements, and mapping.
     */
    splitTableAtHeight(
        tableNode: PMNode,
        availableHeight: number,
        measurement: TableMeasurement,
        schema: Schema,
        pageHeight: number
    ): TableSplitResult {
        const rows = tableNode.content.content;
        const headerRowCount = this.getHeaderRowCount(tableNode);
        const tables: PMNode[] = [];
        const measurements: TableMeasurement[] = [];
        let mapping: TableMapping[] = [];

        const groupId = `table-group-${Date.now()}`;

        // If table fits in available height, return as is with groupId
        if (measurement.totalHeight <= availableHeight) {
            const table = schema.nodes.table.create(
                {
                    ...tableNode.attrs,
                    groupId,
                },
                tableNode.content
            );
            return {
                tables: [table],
                mapping: [],
                groupId,
                measurements: [measurement],
            };
        }

        // Find split point for current page
        const [splitIndex, currentHeight] = this.getSplitIndex(measurement, headerRowCount, availableHeight);

        // Create first table with header rows
        const firstTableRows = rows.slice(0, splitIndex);
        const firstTable = schema.nodes.table.create(
            {
                ...tableNode.attrs,
                groupId,
            },
            firstTableRows
        );
        tables.push(firstTable);
        measurements.push({
            headerRowCount: 0,
            breakPoints: [],
            rowHeights: measurement.rowHeights.slice(0, splitIndex),
            cumulativeHeights: measurement.cumulativeHeights.slice(0, splitIndex),
            totalHeight: sumArray(measurement.rowHeights.slice(0, splitIndex)),
        });

        // Handle remaining rows
        if (splitIndex < rows.length) {
            const remainingRows = rows.slice(splitIndex);
            const remainingTable = schema.nodes.table.create(
                {
                    ...tableNode.attrs,
                    groupId,
                },
                remainingRows
            );

            // Calculate remaining table measurement
            const remainingMeasurement = {
                ...measurement,
                rowHeights: measurement.rowHeights.slice(splitIndex),
                cumulativeHeights: measurement.cumulativeHeights.slice(splitIndex).map((h) => h - currentHeight),
                totalHeight: sumArray(measurement.rowHeights.slice(splitIndex)),
            };

            // Recursively split remaining table if needed
            if (remainingMeasurement.totalHeight > pageHeight) {
                const result = this.splitTableAtHeight(remainingTable, pageHeight, remainingMeasurement, schema, pageHeight);

                // Adjust mapping for the offset caused by the first table
                const firstTableSize = firstTable.nodeSize;
                const adjustedMapping = result.mapping.map(({ from, to }) => ({
                    from: from + splitIndex,
                    to: to + firstTableSize,
                }));

                tables.push(...result.tables);
                measurements.push(...result.measurements);
                mapping = [...mapping, ...adjustedMapping];
            } else {
                measurements.push(remainingMeasurement);
                tables.push(remainingTable);
            }
        }

        // Store or update table group
        const originalTable = tableNode.attrs.groupId
            ? this.tableGroups.get(tableNode.attrs.groupId)?.originalTable || tableNode
            : tableNode;

        this.tableGroups.set(groupId, {
            tables,
            originalTable,
            positions: [], // Positions will be updated in buildNewDocument
        });

        return { tables, mapping, groupId, measurements };
    }

    /**
     * Function to optimise a group of split tables by checking the length of the table and moving the rows between tables.
     * @param tables The table(s) in a group which need to be checked.
     * @param measurements The measurements of each table
     * @param schema The schema of the document.
     * @param availableHeight The available height in the current page
     * @param pageHeight The height of a page.
     * @returns The optimised tables and measurements.
     */
    optimiseTables(tables: PMNode[], measurements: TableMeasurement[], schema: Schema, availableHeight: number, pageHeight: number) {
        const optimisedTables: PMNode[] = [];
        const optimisedMeasurements: TableMeasurement[] = [];

        tables.forEach((table, index) => {
            const measurement = measurements[index];
            const availableSpace = index === 0 ? availableHeight : pageHeight;

            if (measurement.totalHeight > availableSpace) {
                const result = this.handleOverflow(table, measurement, tables[index + 1], measurements[index + 1], schema, availableSpace);
                optimisedTables.push(...result.tables);
                optimisedMeasurements.push(...result.measurements);
            } else if (measurement.totalHeight < availableSpace && tables[index + 1]) {
                const result = this.handleUnderflow(table, measurement, tables[index + 1], measurements[index + 1], schema, availableSpace);
                optimisedTables.push(result.table);
                optimisedMeasurements.push(result.measurement);
            } else {
                optimisedTables.push(table);
                optimisedMeasurements.push(measurement);
            }
        });

        return { tables: optimisedTables, measurements: optimisedMeasurements };
    }

    /**
     * Function to handle the overflow of a table by moving rows between tables.
     * @param table The table to handle.
     * @param measurement The measurement of the table.
     * @param nextTable The next table in the group.
     * @param nextMeasurement The measurement of the next table.
     * @param schema The schema of the document.
     * @param availableSpace The available space in the current page.
     * @returns The optimised table and measurement.
     */
    private handleOverflow(
        table: PMNode,
        measurement: TableMeasurement,
        nextTable: PMNode | undefined,
        nextMeasurement: TableMeasurement | undefined,
        schema: Schema,
        availableSpace: number
    ) {
        const rows = table.content.content;
        const rowsToMove: PMNode[] = [];
        const movedRowMeasurements: number[] = [];
        let totalSpaceTaken = 0;

        for (let i = rows.length - 1; i >= 0; i--) {
            if (measurement.totalHeight - totalSpaceTaken <= availableSpace) break;
            rowsToMove.unshift(rows[i]);
            movedRowMeasurements.unshift(measurement.rowHeights[i]);
            totalSpaceTaken += measurement.rowHeights[i];
        }

        const optimisedTable = schema.nodes.table.create({ ...table.attrs }, rows.slice(0, -rowsToMove.length));
        const optimisedMeasurement: TableMeasurement = {
            rowHeights: measurement.rowHeights.slice(0, -rowsToMove.length),
            headerRowCount: 0,
            totalHeight: measurement.totalHeight - totalSpaceTaken,
            breakPoints: measurement.breakPoints,
            cumulativeHeights: measurement.cumulativeHeights.slice(0, -rowsToMove.length),
        };

        if (nextTable) {
            const updatedNextTable = schema.nodes.table.create({ ...nextTable.attrs }, [...rowsToMove, ...nextTable.content.content]);
            const updatedNextMeasurement = {
                ...nextMeasurement!,
                rowHeights: [...movedRowMeasurements, ...nextMeasurement!.rowHeights],
                totalHeight: nextMeasurement!.totalHeight + totalSpaceTaken,
            };
            return { tables: [optimisedTable, updatedNextTable], measurements: [optimisedMeasurement, updatedNextMeasurement] };
        } else {
            const newTable = schema.nodes.table.create({ ...table.attrs }, rowsToMove);
            const newMeasurement: TableMeasurement = {
                ...measurement,
                rowHeights: movedRowMeasurements,
                totalHeight: movedRowMeasurements.reduce((sum, height) => sum + height, 0),
            };
            return { tables: [optimisedTable, newTable], measurements: [optimisedMeasurement, newMeasurement] };
        }
    }

    /**
     * Function to handle the underflow of a table by moving rows between tables.
     * @param table The table to handle.
     * @param measurement The measurement of the table.
     * @param nextTable The next table in the group.
     * @param nextMeasurement The measurement of the next table.
     * @param schema The schema of the document.
     * @param availableSpace The available space in the current page.
     * @returns The optimised table and measurement.
     */
    private handleUnderflow(
        table: PMNode,
        measurement: TableMeasurement,
        nextTable: PMNode,
        nextMeasurement: TableMeasurement,
        schema: Schema,
        availableSpace: number
    ) {
        const availableHeight = availableSpace - measurement.totalHeight;
        const nextTableRows = nextTable.content.content;
        const rowsToMove: PMNode[] = [];
        const movedRowMeasurements: number[] = [];
        let totalSpaceTaken = 0;

        for (let i = 0; i < nextTableRows.length; i++) {
            if (availableHeight - totalSpaceTaken <= nextMeasurement.rowHeights[i]) break;
            rowsToMove.push(nextTableRows[i]);
            movedRowMeasurements.push(nextMeasurement.rowHeights[i]);
            totalSpaceTaken += nextMeasurement.rowHeights[i];
        }

        const optimisedTable = schema.nodes.table.create({ ...table.attrs }, [...table.content.content, ...rowsToMove]);
        const optimisedMeasurement: TableMeasurement = {
            ...measurement,
            totalHeight: measurement.totalHeight + totalSpaceTaken,
            rowHeights: [...measurement.rowHeights, ...movedRowMeasurements],
            cumulativeHeights: [...measurement.cumulativeHeights, ...nextMeasurement.cumulativeHeights.slice(0, rowsToMove.length)],
        };

        return { table: optimisedTable, measurement: optimisedMeasurement };
    }
    /**
     * Filter tables with content
     * @param tables The tables to filter
     * @returns The filtered tables
     */
    filterTablesWithContent(tables: PMNode[]): PMNode[] {
        return tables.filter(
            (table) => table?.type && table.type.name === TABLE_NODE_TYPE && table.content && table.content.content.length > 0
        );
    }

    /**
     * Calculate new base position
     * @param cumulativeNewDocPos Current cumulutive position
     * @param currentPageContent Page content
     * @returns
     */
    calculateNewBasePosition(cumulativeNewDocPos: number, currentPageContent: PMNode[]) {
        return cumulativeNewDocPos + currentPageContent.slice(0, -1).reduce((sum, n) => sum + n.nodeSize, 0);
    }
}
