import { Node as PMNode } from '@tiptap/pm/model'
import { EditorState } from '@tiptap/pm/state'
import { EditorView } from '@tiptap/pm/view'

export interface TableMeasurement {
  rowHeights: number[]
  headerRowCount: number
  totalHeight: number
  breakPoints: number[]
  cumulativeHeights: number[]
}

interface TableSplitResult {
  tables: PMNode[]
  mapping: { from: number; to: number }[]
  groupId: string
  measurements: TableMeasurement[]
}

interface TableGroup {
  tables: PMNode[]
  originalTable: PMNode
  positions: number[]
}

export class TableHandler {
  private static instance: TableHandler
  private measurementCache: Map<string, TableMeasurement> = new Map()
  private tableGroups: Map<string, TableGroup> = new Map()
  private originalTableMeasurements = new Map<string, number[]>()

  static getInstance(): TableHandler {
    if (!this.instance) {
      this.instance = new TableHandler()
    }
    return this.instance
  }

  private getTableCacheKey(node: PMNode): string {
    // Include content size and JSON to ensure cache invalidation on content changes
    return `${node.type.name}-${node.content.size}-${JSON.stringify(node.toJSON())}`
  }

  measureTable(node: PMNode, pos: number, view: EditorView): TableMeasurement {
    const cacheKey = this.getTableCacheKey(node)
    const cached = this.measurementCache.get(cacheKey)
    if (cached) return cached
    const rows = node.content.content
    const rowHeights = this.measureRowHeights(rows, pos, view)
    const headerRowCount = this.getHeaderRowCount(node)

    // Calculate cumulative heights
    const cumulativeHeights = rowHeights.reduce((acc, height) => {
      const prev = acc[acc.length - 1] || 0
      acc.push(prev + height)
      return acc
    }, [] as number[])

    const measurement = {
      rowHeights,
      headerRowCount,
      totalHeight: cumulativeHeights[cumulativeHeights.length - 1] || 0,
      breakPoints: [],
      cumulativeHeights,
    }

    // Only cache if we have valid measurements
    if (measurement.totalHeight > 0) {
      this.measurementCache.set(cacheKey, measurement)
    }

    return measurement
  }

  private measureRowHeights(
    rows: PMNode[],
    pos: number,
    view: EditorView,
  ): number[] {
    const dom = view.nodeDOM(pos) as HTMLElement
    if (dom) {
      const trs = dom.querySelectorAll('tr')
      return rows.map((row, index) => {
        const { height } = trs[index].getBoundingClientRect()
        return height || row.nodeSize
      })
    }
    // Get the group ID from the first row's parent table
    const firstRow = rows[0]
    const table = firstRow.type.name === 'table' ? firstRow : firstRow.parent
    if (!table) {
      return rows.map((row) => row.nodeSize)
    }
  }

  private getHeaderRowCount(node: PMNode): number {
    return node.attrs.headerRows || 1
  }

  splitTableAtHeight(
    node: PMNode,
    availableHeight: number,
    measurement: TableMeasurement,
    schema: EditorState['schema'],
    pageHeight: number,
  ): TableSplitResult {
    const rows = node.content.content
    const headerRowCount = this.getHeaderRowCount(node)
    const tables: PMNode[] = []
    const measurements: TableMeasurement[] = []
    let mapping: { from: number; to: number }[] = []

    // Check if table is already part of a group
    const groupId = `table-group-${Date.now()}`

    // If table fits in available height, return as is with groupId
    if (measurement.totalHeight <= availableHeight) {
      const table = schema.nodes.table.create(
        {
          ...node.attrs,
          groupId,
        },
        node.content,
      )
      return {
        tables: [table],
        mapping: [],
        groupId,
        measurements: [measurement],
      }
    }

    // Find split point for current page
    let splitIndex = headerRowCount
    let currentHeight = measurement.rowHeights
      .slice(0, headerRowCount)
      .reduce((a, b) => a + b, 0)

    for (let i = headerRowCount; i < measurement.rowHeights.length; i++) {
      if (currentHeight + measurement.rowHeights[i] > availableHeight) {
        break
      }
      currentHeight += measurement.rowHeights[i]
      splitIndex = i + 1
    }

    // Create first table with header rows
    const firstTableRows = rows.slice(0, splitIndex)
    const firstTable = schema.nodes.table.create(
      {
        ...node.attrs,
        groupId,
      },
      firstTableRows,
    )
    tables.push(firstTable)
    measurements.push({
      headerRowCount: 0,
      breakPoints: [],
      rowHeights: measurement.rowHeights.slice(0, splitIndex),
      cumulativeHeights: measurement.cumulativeHeights.slice(0, splitIndex),
      totalHeight: measurement.rowHeights
        .slice(0, splitIndex)
        .reduce((a, b) => a + b, 0),
    })

    // Handle remaining rows
    if (splitIndex < rows.length) {
      const remainingRows = rows.slice(splitIndex)
      const remainingTable = schema.nodes.table.create(
        {
          ...node.attrs,
          groupId,
        },
        remainingRows,
      )

      // Calculate remaining table measurement
      const remainingMeasurement = {
        ...measurement,
        rowHeights: measurement.rowHeights.slice(splitIndex),
        cumulativeHeights: measurement.cumulativeHeights
          .slice(splitIndex)
          .map((h) => h - currentHeight),
        totalHeight: measurement.rowHeights
          .slice(splitIndex)
          .reduce((a, b) => a + b, 0),
      }

      // Recursively split remaining table if needed
      if (remainingMeasurement.totalHeight > pageHeight) {
        const result = this.splitTableAtHeight(
          remainingTable,
          pageHeight,
          remainingMeasurement,
          schema,
          pageHeight,
        )

        // Adjust mapping for the offset caused by the first table
        const firstTableSize = firstTable.nodeSize
        const adjustedMapping = result.mapping.map(({ from, to }) => ({
          from: from + splitIndex,
          to: to + firstTableSize,
        }))

        tables.push(...result.tables)
        measurements.push(...result.measurements)
        mapping = [...mapping, ...adjustedMapping]
      } else {
        measurements.push(remainingMeasurement)
        tables.push(remainingTable)
      }
    }

    // Store or update table group
    const originalTable = node.attrs.groupId
      ? this.tableGroups.get(node.attrs.groupId)?.originalTable || node
      : node

    this.tableGroups.set(groupId, {
      tables,
      originalTable,
      positions: [], // Positions will be updated in buildNewDocument
    })

    return { tables, mapping, groupId, measurements }
  }

  /**
   * For each table in a group
   * - compare against maxHeight (table 0 against available height, the rest aginast page heigt)
   * - if the table overflows.
   * -- then
   * -- calculate overflow rows
   * --- if next table exists
   * ---- then move to next table
   * --- else
   * ---- create new table
   * -- else if table underflows and next table
   * --- get max fit rows in underflow from next table
   * --- add to current table
   * @param tables
   * @param measurements
   * @param schema
   * @param availableHeight
   * @param pageHeight
   * @returns
   */
  optimiseTables(
    tables: PMNode[],
    measurements: TableMeasurement[],
    schema: EditorState['schema'],
    availableHeight: number,
    pageHeight: number,
  ) {
    const optimisedTables: PMNode[] = []
    const optimisedMeasurements: TableMeasurement[] = []

    tables.forEach((table, index) => {
      let optimised = false
      const rows = table.content.content
      const measurement = measurements[index]
      const tableHeight = measurement.totalHeight
      const availableSpace = index === 0 ? availableHeight : pageHeight

      // handle overflows
      if (measurement.totalHeight > availableSpace) {
        const maxFitSpace = availableSpace - tableHeight
        const rows = table.content.content
        const rowsToMove: PMNode[] = []
        const movedRowMeasurements: number[] = []
        let totalSpaceTaken = 0
        let rowsToRemove = 0
        for (let i = rows.length - 1; i >= 0; i--) {
          const rowHeight = measurement.rowHeights[i]
          if (tableHeight - totalSpaceTaken <= availableSpace) break

          rowsToMove.unshift(rows[i])
          movedRowMeasurements.unshift(rowHeight)
          totalSpaceTaken += rowHeight
          rowsToRemove++
        }
        if (rowsToMove.length) {
          optimised = true
          // Create new content for the current table
          optimisedTables.push(
            schema.nodes.table.create(
              { ...table.attrs },
              rows.slice(0, -rowsToMove.length),
            ),
          )
          // add a new measurement for the adjusted table
          optimisedMeasurements.push({
            rowHeights: measurement.rowHeights.slice(0, -rowsToMove.length),
            headerRowCount: 0,
            totalHeight: measurement.totalHeight - totalSpaceTaken,
            breakPoints: measurement.breakPoints,
            cumulativeHeights: measurement.cumulativeHeights.slice(
              0,
              -rowsToMove.length,
            ),
          })

          if (tables[index + 1]) {
            const nextTable = tables[index + 1]
            const rows = [...rowsToMove, ...nextTable.content.content]
            // replaces next child so this is repeated
            tables[index + 1] = schema.nodes.table.create(
              { ...nextTable.attrs },
              rows,
            )
            measurements[index + 1].rowHeights.unshift(...movedRowMeasurements)
            measurements[index + 1].totalHeight += totalSpaceTaken
          } else {
            const newTable = schema.nodes.table.create(
              { ...table.attrs },
              rowsToMove,
            )
            optimisedTables.push(newTable)
            optimisedMeasurements.push({
              ...measurement,
              rowHeights: movedRowMeasurements,
              totalHeight: movedRowMeasurements.reduce(
                (sum, height) => sum + height,
                0,
              ),
            })
          }
        }
      }
      if (measurement.totalHeight < availableSpace && tables[index + 1]) {
        const availableHeight = availableSpace - measurement.totalHeight
        const nextTable = tables[index + 1]
        const nextTableMeasurements = measurements[index + 1]
        const nextTableRows = nextTable.content.content
        const rowsToMove: PMNode[] = []
        const movedRowMeasurements: number[] = []
        let totalSpaceTaken = 0
        let rowsToAdd = 0
        for (let i = 0; i < nextTableRows.length; i++) {
          const rowHeight = nextTableMeasurements.rowHeights[i]
          if (availableHeight - totalSpaceTaken <= rowHeight) break

          rowsToMove.push(nextTableRows[i])
          movedRowMeasurements.push(rowHeight)
          totalSpaceTaken += rowHeight
          rowsToAdd++
        }
        if (rowsToAdd) {
          optimised = true
          // push current table optimised
          const rows = [...table.content.content, ...rowsToMove]
          optimisedTables.push(
            schema.nodes.table.create({ ...table.attrs }, rows),
          )
          optimisedMeasurements.push({
            ...nextTableMeasurements,
            totalHeight: measurement.totalHeight + totalSpaceTaken,
            rowHeights: measurement.rowHeights.slice(0, rowsToAdd),
            cumulativeHeights: [
              ...measurement.cumulativeHeights,
              ...nextTableMeasurements.cumulativeHeights.slice(0, rowsToAdd),
            ],
          })

          // remove rows from next table
          tables[index + 1] = schema.nodes.table.create(
            { ...nextTable.attrs },
            nextTableRows.slice(rowsToAdd),
          )
          measurements[index + 1].rowHeights =
            measurements[index + 1].rowHeights.slice(rowsToAdd)
          measurements[index + 1].cumulativeHeights =
            measurements[index + 1].cumulativeHeights.slice(rowsToAdd)
          measurements[index + 1].totalHeight -= totalSpaceTaken
        }
      }

      if (!optimised) {
        optimisedTables.push(table)
        optimisedMeasurements.push(measurement)
      }
    })

    return { tables: optimisedTables, measurements: optimisedMeasurements }
  }
}
