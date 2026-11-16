/**
 * MiniBank.Core - Domain Modelleri ve Veri Tipleri (Contracts)
 */

/**
 * @typedef {Object} User
 * @property {number|string} id
 * @property {string} username
 * @property {string} [identityNumber]
 * @property {string} role - 'Admin' | 'Customer'
 * @property {string} [token]
 * @property {string} [fullName]
 */

/**
 * @typedef {Object} Customer
 * @property {string} id
 * @property {string} customerNumber
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} identityNumber
 * @property {string} email
 * @property {string} phoneNumber
 * @property {string} [createdAt]
 */

/**
 * @typedef {Object} Account
 * @property {string} id
 * @property {string} customerId
 * @property {string} customerFullName
 * @property {string} iban
 * @property {number} balance
 * @property {string} currency - 'TRY' | 'USD' | 'EUR' | 'GBP' | 'XAU'
 * @property {string} [accountType] - 'Checking' | 'TimeDeposit'
 * @property {boolean} isActive
 * @property {string} [createdAt]
 */

/**
 * @typedef {Object} Transaction
 * @property {string} id
 * @property {string} accountId
 * @property {string} transactionType - 'deposit' | 'withdraw' | 'transfer'
 * @property {number} amount
 * @property {string} currency
 * @property {string} [description]
 * @property {string} [targetIban]
 * @property {string} [createdAt]
 */

/**
 * @typedef {Object} CurrencyRate
 * @property {string} code
 * @property {string} name
 * @property {number} buying
 * @property {number} selling
 * @property {number} [change]
 */

/**
 * @typedef {Object} FeatureCatalogItem
 * @property {string} key
 * @property {string} name
 * @property {string} description
 * @property {string} category
 * @property {boolean} defaultEnabled
 * @property {string} defaultCustomValueLabel
 */

/**
 * @typedef {Object} CustomerFeature
 * @property {string} featureKey
 * @property {string} name
 * @property {string} description
 * @property {string} category
 * @property {boolean} isEnabled
 * @property {string|null} [customValue]
 * @property {string} [updatedAt]
 * @property {string} [updatedBy]
 */

/**
 * @typedef {Object} AssistantRequest
 * @property {string} message
 * @property {string} [currentPage]
 */

/**
 * @typedef {Object} AssistantResponse
 * @property {string} reply
 * @property {string} action - 'NAVIGATE' | 'INFO' | 'SUGGESTION'
 * @property {string|null} [route]
 * @property {Object.<string, any>} [parameters]
 * @property {string[]} quickSuggestions
 */

export {};

