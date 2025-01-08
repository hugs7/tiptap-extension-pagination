/**
 * @file /src/utils/object.ts
 * @name Object
 * @description Utility functions for object manipulation.
 */

/**
 * Determines if a string needs to be JSON parsed.
 * @param value - The value to check.
 * @returns {boolean} True if the value needs to be parsed, false otherwise.
 */
const needsParsing = (value: any): boolean => {
    if (typeof value !== "string" || value.trim() === "") {
        return false; // Exclude non-strings or empty strings
    }

    // Normalize to avoid trailing/leading spaces affecting checks
    const normalized = value.trim();

    // Check for JSON-like structures
    return (
        normalized.startsWith("{") || // Object
        normalized.startsWith("[") || // Array
        normalized.startsWith('"') || // Quoted string
        normalized.startsWith("'") || // Single-quoted string
        normalized.startsWith("`") || // Template string
        normalized === "null" || // Null value
        normalized === "true" || // Boolean true
        normalized === "false" || // Boolean false
        !isNaN(normalized as any) // Numeric strings like "123" or "0.5"
    );
};

/**
 * Wrap JSON.parse. Checks if the value needs to be parsed before attempting to parse it.
 * Handles errors by returning the original value if it cannot be parsed.
 * @param value - The value to parse.
 * @returns - The parsed value or the original value if it does not need to be parsed.
 */
export const wrapJSONParse = (value: any): any => {
    if (!needsParsing(value)) {
        return value;
    }

    try {
        return JSON.parse(value);
    } catch (e) {
        return value;
    }
};
