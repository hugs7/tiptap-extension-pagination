/**
 * @file /src/utils/math.ts
 * @name Math
 * @description Utility functions for mathematical operations.
 */

/**
 * Checks if a value is within a specified range inclusive of the bounds.
 * @param value - The value to check.
 * @param min - The minimum value of the range.
 * @param max - The maximum value of the range.
 * @returns True if the value is within the range, false otherwise.
 */
export const inRange = (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max;
};

/**
 * Calculates the hypotenuse of a right triangle given the lengths of the other two sides.
 * @param a - The length of side A.
 * @param b - The length of side B.
 * @returns The length of the hypotenuse.
 */
export const pythagoreanTheorem = (a: number, b: number): number => {
    return Math.sqrt(a ** 2 + b ** 2);
};

/**
 * Calculates the sum of an array of numbers.
 * @param array - The array of numbers.
 * @returns The sum of the numbers in the array.
 */
export const sumArray = (array: number[]): number => {
    return array.reduce((a, b) => a + b, 0);
};
