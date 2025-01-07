/**
 * @file /src/types/direction.ts
 * @name Direction
 * @description Defines types for directions
 */

import { NEGATIVE_SIGN, POSITIVE_SIGN } from "../constants/direction";

export type Sign = typeof POSITIVE_SIGN | typeof NEGATIVE_SIGN;
