import { Node as PMNode, Schema } from "@tiptap/pm/model";
import { EditorView } from "@tiptap/pm/view";
import { TableGroup, TableMeasurement, TableSplitResult } from "../types/table";
import { TABLE_NODE_TYPE } from "../constants/table";

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
        const rows = node.content.content;
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
        const firstRow = rows[0];
        const table = firstRow.type.name === TABLE_NODE_TYPE ? firstRow : firstRow.parent;
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
        let mapping: { from: number; to: number }[] = [];

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
        let splitIndex = headerRowCount;
        let currentHeight = measurement.rowHeights.slice(0, headerRowCount).reduce((a, b) => a + b, 0);

        for (let i = headerRowCount; i < measurement.rowHeights.length; i++) {
            if (currentHeight + measurement.rowHeights[i] > availableHeight) {
                break;
            }
            currentHeight += measurement.rowHeights[i];
            splitIndex = i + 1;
        }

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
            totalHeight: measurement.rowHeights.slice(0, splitIndex).reduce((a, b) => a + b, 0),
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
                totalHeight: measurement.rowHeights.slice(splitIndex).reduce((a, b) => a + b, 0),
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
     * @returns The optimised tables, measurements, and updated mapping.
     */
    optimiseTables(tables: PMNode[], measurements: TableMeasurement[], schema: Schema, availableHeight: number, pageHeight: number) {
        const optimisedTables: PMNode[] = [];
        const optimisedMeasurements: TableMeasurement[] = [];

        tables.forEach((table, index) => {
            let isOptimised: boolean = false;
            const nextRowIndex = index + 1;
            const measurement = measurements[index];
            const tableHeight = measurement.totalHeight;
            const availableSpace = index === 0 ? availableHeight : pageHeight;

            // handle overflows
            if (measurement.totalHeight > availableSpace) {
                const rows = table.content.content;
                const rowsToMove: PMNode[] = [];
                const movedRowMeasurements: number[] = [];
                let totalSpaceTaken = 0;
                let rowsToRemove = 0;

                for (let i = rows.length - 1; i >= 0; i--) {
                    const rowHeight = measurement.rowHeights[i];

                    if (tableHeight - totalSpaceTaken <= availableSpace) break;

                    rowsToMove.unshift(rows[i]);
                    movedRowMeasurements.unshift(rowHeight);
                    totalSpaceTaken += rowHeight;
                    rowsToRemove++;
                }

                if (rowsToMove.length) {
                    isOptimised = true;
                    // Create new content for the current table
                    optimisedTables.push(schema.nodes.table.create({ ...table.attrs }, rows.slice(0, -rowsToMove.length)));
                    // add a new measurement for the adjusted table
                    optimisedMeasurements.push({
                        rowHeights: measurement.rowHeights.slice(0, -rowsToMove.length),
                        headerRowCount: 0,
                        totalHeight: measurement.totalHeight - totalSpaceTaken,
                        breakPoints: measurement.breakPoints,
                        cumulativeHeights: measurement.cumulativeHeights.slice(0, -rowsToMove.length),
                    });

                    if (tables[nextRowIndex]) {
                        const nextTable = tables[nextRowIndex];
                        const rows = [...rowsToMove, ...nextTable.content.content];
                        // replaces next child so this is repeated
                        tables[nextRowIndex] = schema.nodes.table.create({ ...nextTable.attrs }, rows);
                        measurements[nextRowIndex].rowHeights.unshift(...movedRowMeasurements);
                        measurements[nextRowIndex].totalHeight += totalSpaceTaken;
                    } else {
                        const newTable = schema.nodes.table.create({ ...table.attrs }, rowsToMove);
                        optimisedTables.push(newTable);
                        optimisedMeasurements.push({
                            ...measurement,
                            rowHeights: movedRowMeasurements,
                            totalHeight: movedRowMeasurements.reduce((sum, height) => sum + height, 0),
                        });
                    }
                }
            }

            if (measurement.totalHeight < availableSpace && tables[nextRowIndex]) {
                const availableHeight = availableSpace - measurement.totalHeight;
                const nextTable = tables[nextRowIndex];
                const nextTableMeasurements = measurements[nextRowIndex];
                const nextTableRows = nextTable.content.content;
                const rowsToMove: PMNode[] = [];
                const movedRowMeasurements: number[] = [];
                let totalSpaceTaken = 0;
                let rowsToAdd = 0;

                for (let i = 0; i < nextTableRows.length; i++) {
                    const rowHeight = nextTableMeasurements.rowHeights[i];
                    if (availableHeight - totalSpaceTaken <= rowHeight) break;

                    rowsToMove.push(nextTableRows[i]);
                    movedRowMeasurements.push(rowHeight);
                    totalSpaceTaken += rowHeight;
                    rowsToAdd++;
                }

                if (rowsToAdd) {
                    isOptimised = true;
                    // push current table optimised
                    const rows = [...table.content.content, ...rowsToMove];
                    optimisedTables.push(schema.nodes.table.create({ ...table.attrs }, rows));
                    optimisedMeasurements.push({
                        ...nextTableMeasurements,
                        totalHeight: measurement.totalHeight + totalSpaceTaken,
                        rowHeights: measurement.rowHeights.slice(0, rowsToAdd),
                        cumulativeHeights: [
                            ...measurement.cumulativeHeights,
                            ...nextTableMeasurements.cumulativeHeights.slice(0, rowsToAdd),
                        ],
                    });

                    // remove rows from next table
                    tables[nextRowIndex] = schema.nodes.table.create({ ...nextTable.attrs }, nextTableRows.slice(rowsToAdd));
                    measurements[nextRowIndex].rowHeights = measurements[nextRowIndex].rowHeights.slice(rowsToAdd);
                    measurements[nextRowIndex].cumulativeHeights = measurements[nextRowIndex].cumulativeHeights.slice(rowsToAdd);
                    measurements[nextRowIndex].totalHeight -= totalSpaceTaken;
                }
            }

            if (!isOptimised) {
                optimisedTables.push(table);
                optimisedMeasurements.push(measurement);
            }
        });

        return { tables: optimisedTables, measurements: optimisedMeasurements };
    }
    /**
     * Filter tables with content
     * @param tables The tables to filter
     * @returns The filtered tables
     */
    filterTablesWithContent(tables: PMNode[]): PMNode[] {
        return tables.filter(table => table?.type && table.type.name === TABLE_NODE_TYPE && table.content && table.content.content.length > 0);
    }
}
