/**
 * @file /src/constants/pageMargins.ts
 * @name PageMargins
 * @description Constants for page margins in the editor.
 */

import { CommonMarginName, MarginConfig, XMarginConfig } from "../types/page";

/**
 * Common margin configurations for different margin sizes.
 */
export const commonMarginConfigs: Record<CommonMarginName, MarginConfig> = {
    normal: { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 },
    narrow: { top: 12.7, right: 12.7, bottom: 12.7, left: 12.7 },
    moderate: { top: 25.4, right: 19.1, bottom: 25.4, left: 19.1 },
    wide: { top: 25.4, right: 50.8, bottom: 25.4, left: 50.8 },
};

/**
 * The common margin name for the default margin configuration.
 */
export const DEFAULT_PAGE_MARGIN_NAME: CommonMarginName = "normal";

/**
 * Standard margins are 1 inch or 25.4mm on all sides.
 */
export const DEFAULT_MARGIN_CONFIG: MarginConfig = commonMarginConfigs[DEFAULT_PAGE_MARGIN_NAME];

/**
 * Default x margin configuration.
 */
export const DEFAULT_X_MARGIN_CONFIG: XMarginConfig = {
    left: DEFAULT_MARGIN_CONFIG.left,
    right: DEFAULT_MARGIN_CONFIG.right,
};
