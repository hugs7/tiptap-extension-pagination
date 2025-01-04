/**
 * @file /src/utils/units.ts
 * @name Units
 * @description Utility functions for handling units of measurement.
 */

/**
 * Format a value as a millimetre string.
 * @param value - The value to format.
 * @returns {string} The value formatted as a millimetre string.
 * @example mm(10) // "10mm"
 */
export const mm = (value: number): string => {
    return `${value}mm`;
};
