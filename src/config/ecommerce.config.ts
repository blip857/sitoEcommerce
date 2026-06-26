/**
 * @file ecommerce.config.ts
 * @description Central SSoT registry for all country, currency, and phone data.
 *              Implements R-01, R-02, R-03 from the ssot-configuration-engineer rule.
 *              DO NOT declare country/currency/phone arrays in individual components.
 *              Import from this file instead.
 *
 * @version 1.0.0
 * @registry ecommerce-ssot-policy
 */

// ---------------------------------------------------------------------------
// INTERFACE — R-02: Strict TypeScript typing for every registry entry
// ---------------------------------------------------------------------------

/**
 * Represents a single country entry in the Ecommerce Registry.
 *
 * @property code           - ISO 3166-1 alpha-2 country code (e.g. "IT")
 * @property englishName    - PascalCase identifier used as HTML element suffix (e.g. "Italy")
 * @property name           - Display name in Italian (e.g. "Italia")
 * @property prefix         - International dialling prefix (e.g. "+39")
 * @property currencyCode   - ISO 4217 currency code (e.g. "EUR")
 * @property currencySymbol - Human-readable currency symbol (e.g. "€")
 * @property phoneDigits    - Tuple [minDigits, maxDigits] for phone validation
 */
export interface CountryConfig {
  readonly code: string;
  readonly englishName: string;
  readonly name: string;
  readonly prefix: string;
  readonly currencyCode: string;
  readonly currencySymbol: string;
  readonly phoneDigits: readonly [number, number];
}

// ---------------------------------------------------------------------------
// REGISTRY — R-03: Object.freeze + as const for full immutability
// ---------------------------------------------------------------------------

/**
 * ECOMMERCE_REGISTRY — Single Source of Truth for all country data.
 * Consumed by: navbar.astro (country picker), contatti.astro (phone prefix select).
 *
 * Anti-patterns prevented:
 *   AP-01 — No local arrays in individual components
 *   AP-02 — No duplicated hardcoded strings across files
 *   AP-03 — Runtime mutation is blocked by Object.freeze
 */
export const ECOMMERCE_REGISTRY: ReadonlyArray<CountryConfig> = Object.freeze([
  // --- Priority countries (shown first in UI) ---
  { code: "IT", englishName: "Italy",             name: "Italia",               prefix: "+39",  currencyCode: "EUR", currencySymbol: "€",    phoneDigits: [9,  10] },
  { code: "US", englishName: "UnitedStates",      name: "Stati Uniti",          prefix: "+1",   currencyCode: "USD", currencySymbol: "$",    phoneDigits: [10, 10] },
  { code: "GB", englishName: "UnitedKingdom",     name: "Regno Unito",          prefix: "+44",  currencyCode: "GBP", currencySymbol: "£",    phoneDigits: [10, 10] },
  { code: "FR", englishName: "France",            name: "Francia",              prefix: "+33",  currencyCode: "EUR", currencySymbol: "€",    phoneDigits: [9,  9]  },
  { code: "DE", englishName: "Germany",           name: "Germania",             prefix: "+49",  currencyCode: "EUR", currencySymbol: "€",    phoneDigits: [10, 11] },
  { code: "ES", englishName: "Spain",             name: "Spagna",               prefix: "+34",  currencyCode: "EUR", currencySymbol: "€",    phoneDigits: [9,  9]  },

  // --- Alphabetical world list ---
  { code: "AF", englishName: "Afghanistan",       name: "Afghanistan",          prefix: "+93",  currencyCode: "USD", currencySymbol: "$",    phoneDigits: [9,  9]  },
  { code: "AX", englishName: "AlandIslands",      name: "Isole \u00c5land",     prefix: "+358", currencyCode: "USD", currencySymbol: "$",    phoneDigits: [5,  12] },
  { code: "AL", englishName: "Albania",           name: "Albania",              prefix: "+355", currencyCode: "ALL", currencySymbol: "L",    phoneDigits: [9,  9]  },
  { code: "DZ", englishName: "Algeria",           name: "Algeria",              prefix: "+213", currencyCode: "DZD", currencySymbol: "\u062f.\u062c", phoneDigits: [9,  9]  },
  { code: "AD", englishName: "Andorra",           name: "Andorra",              prefix: "+376", currencyCode: "EUR", currencySymbol: "€",    phoneDigits: [6,  6]  },
  { code: "AO", englishName: "Angola",            name: "Angola",               prefix: "+244", currencyCode: "AOA", currencySymbol: "Kz",   phoneDigits: [9,  9]  },
  { code: "AI", englishName: "Anguilla",          name: "Anguilla",             prefix: "+1",   currencyCode: "XCD", currencySymbol: "$",    phoneDigits: [7,  7]  },
  { code: "AG", englishName: "AntiguaBarbuda",    name: "Antigua e Barbuda",    prefix: "+1",   currencyCode: "XCD", currencySymbol: "$",    phoneDigits: [7,  7]  },
  { code: "AR", englishName: "Argentina",         name: "Argentina",            prefix: "+54",  currencyCode: "ARS", currencySymbol: "$",    phoneDigits: [10, 10] },
  { code: "AM", englishName: "Armenia",           name: "Armenia",              prefix: "+374", currencyCode: "AMD", currencySymbol: "\u058f",phoneDigits: [8,  8]  },
  { code: "AW", englishName: "Aruba",             name: "Aruba",                prefix: "+297", currencyCode: "AWG", currencySymbol: "\u0192",phoneDigits: [7,  7]  },
  { code: "AU", englishName: "Australia",         name: "Australia",            prefix: "+61",  currencyCode: "AUD", currencySymbol: "$",    phoneDigits: [9,  9]  },
  { code: "AT", englishName: "Austria",           name: "Austria",              prefix: "+43",  currencyCode: "EUR", currencySymbol: "€",    phoneDigits: [4,  13] },
  { code: "AZ", englishName: "Azerbaijan",        name: "Azerbaijan",           prefix: "+994", currencyCode: "AZN", currencySymbol: "\u20bc",phoneDigits: [9,  9]  },
  { code: "BS", englishName: "Bahamas",           name: "Bahamas",              prefix: "+1",   currencyCode: "BSD", currencySymbol: "$",    phoneDigits: [7,  7]  },
  { code: "BH", englishName: "Bahrain",           name: "Bahrain",              prefix: "+973", currencyCode: "BHD", currencySymbol: ".\u062f.b", phoneDigits: [8,  8]  },
  { code: "BD", englishName: "Bangladesh",        name: "Bangladesh",           prefix: "+880", currencyCode: "BDT", currencySymbol: "\u09f3",phoneDigits: [10, 10] },
  { code: "BB", englishName: "Barbados",          name: "Barbados",             prefix: "+1",   currencyCode: "BBD", currencySymbol: "$",    phoneDigits: [7,  7]  },
  { code: "BY", englishName: "Belarus",           name: "Bielorussia",          prefix: "+375", currencyCode: "BYN", currencySymbol: "Br",   phoneDigits: [9,  9]  },
  { code: "BE", englishName: "Belgium",           name: "Belgio",               prefix: "+32",  currencyCode: "EUR", currencySymbol: "€",    phoneDigits: [9,  9]  },
  { code: "BZ", englishName: "Belize",            name: "Belize",               prefix: "+501", currencyCode: "BZD", currencySymbol: "Z$",   phoneDigits: [7,  7]  },
  { code: "BJ", englishName: "Benin",             name: "Benin",                prefix: "+229", currencyCode: "XOF", currencySymbol: "Fr",   phoneDigits: [8,  8]  },
  { code: "BM", englishName: "Bermuda",           name: "Bermuda",              prefix: "+1",   currencyCode: "BMD", currencySymbol: "$",    phoneDigits: [7,  7]  },
  { code: "BT", englishName: "Bhutan",            name: "Bhutan",               prefix: "+975", currencyCode: "BTN", currencySymbol: "Nu.",  phoneDigits: [8,  8]  },
  { code: "BO", englishName: "Bolivia",           name: "Bolivia",              prefix: "+591", currencyCode: "BOB", currencySymbol: "$b",   phoneDigits: [8,  8]  },
  { code: "BA", englishName: "BosniaHerzegovina", name: "Bosnia ed Erzegovina", prefix: "+387", currencyCode: "BAM", currencySymbol: "KM",   phoneDigits: [8,  9]  },
  { code: "CH", englishName: "Switzerland",       name: "Svizzera",             prefix: "+41",  currencyCode: "CHF", currencySymbol: "CHF",  phoneDigits: [9,  9]  },
  { code: "JP", englishName: "Japan",             name: "Giappone",             prefix: "+81",  currencyCode: "JPY", currencySymbol: "\u00a5",phoneDigits: [9,  10] },
] as const);
