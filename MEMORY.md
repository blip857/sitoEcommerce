# MEMORY.md — SSoT State

## Registri Scoperti e Attivi
- **Ecommerce Config**: `src/config/ecommerce.config.ts` — ATTIVO (v1.0.0)
  - Esporta: `CountryConfig` (interface), `ECOMMERCE_REGISTRY` (ReadonlyArray, Object.freeze + as const)
  - Contiene: 35 paesi con code, englishName, name, prefix, currencyCode, currencySymbol, phoneDigits[min, max]
  - Registry ID: `ecommerce-ssot-policy`

## Debito Tecnico Residuo
- Nessuno. Tutti i debiti identificati sono stati risolti.

## Debito Tecnico Risolto
- [AP-01] ✅ Array locale `countries` rimosso da `src/components/navbar.astro` — migrato al registro centrale (2026-06-26)
- [AP-01] ✅ Array locale `countries` rimosso da `src/pages/contatti.astro` — migrato al registro centrale + aggiunta validazione dinamica `phoneDigits` (2026-06-26)

## Changelog
- 2026-06-26: Creato `src/config/ecommerce.config.ts` — SSoT centralizzata per paesi, valute e prefissi telefonici
- 2026-06-26: Refactoring `navbar.astro` — import ECOMMERCE_REGISTRY, rimosso array locale
- 2026-06-26: Refactoring `contatti.astro` — import ECOMMERCE_REGISTRY, rimosso array locale, aggiunto script validazione dinamica telefono