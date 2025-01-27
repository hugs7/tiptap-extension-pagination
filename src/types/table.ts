import { Node as PMNode } from '@tiptap/pm/model' 

/**
 * A type definition for a table measurement.
 */
export type TableMeasurement = {
  rowHeights: number[];
  headerRowCount: number;
  totalHeight: number;
  breakPoints: number[];
  cumulativeHeights: number[];
}

/**
 * A type definition for a table split result.
 */
export type TableSplitResult = {
  tables: PMNode[];
  mapping: TableMapping[];
  groupId: string;
  measurements: TableMeasurement[];
}

/**
 * A type definition for a table group.
 */
export type TableGroup = {
  tables: PMNode[];
  originalTable: PMNode;
  positions: number[];
}

export type TableMapping = {
    from: number; 
    to: number;
}