/**
 * JSDoc type references for QR and scan entities.
 * Use via @typedef in other files or IDE type hints.
 *
 * @typedef {'ACTIVE'|'PAUSED'|'DELETED'} QrStatus
 * @typedef {'STATIC'|'DYNAMIC'} LinkType
 *
 * @typedef {Object} QrCodeMeta
 * @property {string} id
 * @property {string} slug
 * @property {string} [name]
 * @property {string} type
 * @property {QrStatus} status
 * @property {LinkType} linkType
 * @property {string} targetUrl
 * @property {string|null} [pausedMessage]
 * @property {number} [scanCount]
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 *
 * @typedef {Object} QrAnalytics
 * @property {number} totalScans
 * @property {number} uniqueScans
 * @property {string|null} [lastScanAt]
 * @property {{ date: string, count: number }[]} daily
 * @property {{ country: string, count: number }[]} countryStats
 * @property {{ device: string, count: number }[]} deviceStats
 */
