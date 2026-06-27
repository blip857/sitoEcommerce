---
name: strategy-validation-architect
description: Attiva questa skill quando il task richiede l'aggiunta, la modifica o il refactoring di regole di validazione input, logiche di controllo form o architetture transazionali di checkout.
tools:
  - Read
  - Glob
model: claude-sonnet
memory: project
isolation: true
version: "1.0.0"
registry_id: ecommerce-validation-policy
scope: project
priority: high
---

# SKILL: Strategy Pattern — Dynamic Validation Architecture
**Target:** Google Antigravity IDE (multi-model: Gemini, Claude, GPT-compatible)
**Format:** Agentic Skill — Markdown structured instruction set
**Version:** 1.0.0
**Error Mode:** Hybrid (fail-fast per field · accumulate across fields)
**Test Runner:** Vitest (`test/strategies/*.test.ts`)

---

## [CORE PURPOSE]

Questa Skill governa ogni intervento dell'agente AI sull'architettura di validazione.
Il suo scopo esclusivo è garantire che:

1. Ogni nuova regola di business entri come **modulo strategia atomico e indipendente**.
2. L'orchestrazione centrale (`validate.ts`, `buildPipeline.ts`) **non venga mai modificata** per aggiungere logica di business.
3. La composizione delle regole sia interamente **data-driven** (configurazione TypeScript `as const` → registry runtime), nel rispetto della Regola Zero SSoT del progetto.
4. Il **context window dell'agente** sia ridotto al minimo: ogni operazione coinvolge solo il file della strategia, il suo test, e il registry — mai il manager centrale.

---

## [ACTIVATION TRIGGERS]

Questa Skill si attiva automaticamente quando l'agente opera su uno dei seguenti path:

```
src/validation/strategies/**/*.ts
src/validation/registry.ts
src/config/validation.config.ts
test/strategies/**/*.test.ts
```

Si attiva anche su richieste in linguaggio naturale che contengono:
- "aggiungi una regola di validazione"
- "valida il campo X"
- "la password deve avere almeno N caratteri"
- "il campo X è obbligatorio"
- "accetta solo i valori Y o Z"
- qualsiasi altra specifica di vincolo su un dato di input

---

## [ARCHITETTURA DI RIFERIMENTO]

L'agente deve sempre ragionare all'interno di questa struttura. Non proporre alternative.

```
src/
  validation/
    validate.ts           ← READONLY — orchestratore puro, non toccare
    buildPipeline.ts      ← READONLY — factory data-driven, non toccare
    registry.ts           ← APPEND-ONLY — solo registrazioni di nuove strategie
    strategies/
      isEmail.ts          ← una strategia = un file
      minLength.ts
      isRequired.ts
      matchesRegex.ts
      inAllowedSet.ts
      allOf.ts            ← compositori logici
      anyOf.ts
      safeRun.ts          ← wrapper per eccezioni sync/async

  config/
    validation.config.ts  ← SSoT — configurazione as const, non JSON

test/
  strategies/
    isEmail.test.ts       ← un test = un file, specchia la strategia
    minLength.test.ts
```

### Contratto della strategia atomica

Ogni file in `strategies/` deve rispettare questo contratto e nulla di più.

**Tipi condivisi** — definiti una sola volta in `src/validation/types.ts`, importati da ogni strategia:

```ts
// src/validation/types.ts — READONLY
export type ValidationResult = {
  ok: boolean;
  code?: string;
  message?: string;
};

export type ValidationContext = {
  field: string;
  data: Record<string, unknown>;
  config?: Record<string, unknown>;
};

export type ValidationStrategy = (
  value: unknown,
  ctx: ValidationContext
) => ValidationResult | Promise<ValidationResult>;
```

**Firma della strategia atomica:**

```ts
// src/validation/strategies/[nomeFunzione].ts
import type { ValidationResult, ValidationContext } from '../types.ts';

export const nomeFunzione = (value: unknown, ctx: ValidationContext): ValidationResult => {
  // logica pura, nessun side-effect, nessun I/O diretto
};
```

**Strategie parametriche** (factory):

```ts
// src/validation/strategies/minLength.ts
import type { ValidationResult, ValidationContext } from '../types.ts';

export const minLength =
  (min: number) =>
  (value: unknown, ctx: ValidationContext): ValidationResult => {
    if (typeof value !== 'string')
      return { ok: false, code: 'type', message: 'Must be a string' };
    return value.length >= min
      ? { ok: true }
      : { ok: false, code: 'minLength', message: `Min length is ${min}` };
  };
```

### Orchestratore ibrido (fail-fast per campo, accumula tra campi)

```ts
// src/validation/validate.ts — READONLY, non modificare
import type { ValidationStrategy, ValidationResult } from './types.ts';
import { safeRun } from './strategies/safeRun.ts';

type Pipeline = Record<string, ValidationStrategy[]>;

export interface ValidationReport {
  ok: boolean;
  errors: Array<{ field: string } & Omit<ValidationResult, 'ok'>>;
}

export async function validate(
  data: Record<string, unknown>,
  pipeline: Pipeline
): Promise<ValidationReport> {
  const fieldErrors: Record<string, ValidationResult> = {};

  for (const [field, strategies] of Object.entries(pipeline)) {
    // fail-fast PER CAMPO: si ferma al primo errore del campo
    for (const strategy of strategies) {
      const res = await safeRun(strategy, data[field], { field, data });
      if (!res.ok) {
        fieldErrors[field] = res;
        break; // ← fail-fast sul singolo campo
      }
    }
    // continua sugli altri campi ← accumulo tra campi
  }

  const errors = Object.entries(fieldErrors).map(([field, { ok: _ok, ...rest }]) => ({
    field,
    ...rest,
  }));
  return { ok: errors.length === 0, errors };
}
```

### Registry — solo append

```ts
// src/validation/registry.ts — APPEND-ONLY
import type { ValidationStrategy } from './types.ts';
import { isEmail }    from './strategies/isEmail.ts';
import { minLength }  from './strategies/minLength.ts';
import { isRequired } from './strategies/isRequired.ts';
// ↑ aggiungi qui sotto, non sopra, non altrove

export const registry = Object.freeze({
  isEmail,
  minLength,
  isRequired,
  // ↑ aggiungi qui
} satisfies Record<string, ValidationStrategy | ((...args: unknown[]) => ValidationStrategy)>);
```

### Configurazione SSoT — `as const` TypeScript

I file `.json` sono **vietati** per la configurazione di validazione: non forniscono type-safety, non supportano autocompletamento e rompono il contratto SSoT del progetto. La sorgente unica di verità vive in `src/config/validation.config.ts`.

```ts
// src/config/validation.config.ts — SSoT, APPEND per nuovi campi
import type { ValidationConfig } from '../validation/types.ts';

export const validationConfig = Object.freeze({
  email: [
    { name: 'isRequired' },
    { name: 'isEmail' },
  ],
  password: [
    { name: 'isRequired' },
    { name: 'minLength', args: 12 },
  ],
} as const satisfies ValidationConfig);
```

Il tipo `ValidationConfig` che abilita il controllo strutturale:

```ts
// Aggiunta a src/validation/types.ts
export type StrategyRef =
  | { name: string; args?: never }
  | { name: string; args: number | string | readonly (number | string)[] };

export type ValidationConfig = Record<string, readonly StrategyRef[]>;
```

---

## [STRICT ENGINEERING RULES]

L'agente DEVE seguire queste regole senza eccezioni. Nessuna deroga è ammessa.

### R-01 — Una regola = un file strategia
Ogni nuova regola di validazione genera esattamente un file in `src/validation/strategies/`.
Non accorpare più regole nello stesso file.

### R-02 — Nessuna modifica al core manager
`validate.ts` e `buildPipeline.ts` sono READONLY per l'agente.
L'unica eccezione è un cambiamento esplicito al contratto di orchestrazione, approvato dall'utente.

### R-03 — Registry APPEND-ONLY
L'agente può solo aggiungere import e chiavi a `registry.ts`.
Non riorganizzare, non rimuovere, non rinominare chiavi esistenti.

### R-04 — Strategie pure, senza side-effect
Nessuna strategia chiama direttamente database, API, file system o stato globale.
Validazioni che richiedono I/O devono essere separate in un livello asincrono dedicato e wrappate con `safeRun.ts`.

### R-05 — Wrapper obbligatorio per async e eccezioni
Qualsiasi strategia che può lanciare eccezioni o restituire una Promise deve passare attraverso `safeRun`:

```ts
// src/validation/strategies/safeRun.ts
import type { ValidationStrategy, ValidationResult, ValidationContext } from '../types.ts';

export async function safeRun(
  strategy: ValidationStrategy,
  value: unknown,
  ctx: ValidationContext
): Promise<ValidationResult> {
  try {
    const res = await Promise.resolve(strategy(value, ctx));
    return res ?? { ok: false, code: 'null_result', message: 'Strategy returned null' };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return { ok: false, code: 'exception', message };
  }
}
```

### R-06 — Test obbligatorio per ogni strategia
Ogni nuovo file in `strategies/` richiede un file speculare in `test/strategies/`.
Il file di test deve coprire almeno: caso valido, caso invalido, tipo errato.

```ts
// test/strategies/minLength.test.ts
import { describe, it, expect } from 'vitest';
import { minLength } from '../../src/validation/strategies/minLength.ts';

describe('minLength', () => {
  const validate = minLength(8);

  it('accetta una stringa lunga a sufficienza', () => {
    expect(validate('password123', { field: 'password', data: {} })).toEqual({ ok: true });
  });

  it('rifiuta una stringa troppo corta', () => {
    expect(validate('abc', { field: 'password', data: {} })).toMatchObject({ ok: false, code: 'minLength' });
  });

  it('rifiuta input non-stringa', () => {
    expect(validate(null, { field: 'password', data: {} })).toMatchObject({ ok: false, code: 'type' });
  });
});
```

### R-07 — Normalizzazione dell'input nella strategia
Ogni strategia deve gestire esplicitamente `null`, `undefined`, stringa vuota.
Non assumere che il valore sia già pulito.

### R-08 — `src/config/validation.config.ts` come unica fonte di verità
Le regole attive per ogni campo vivono **esclusivamente** in `src/config/validation.config.ts`, esportate come costanti immutabili `as const`.
L'agente non deve creare file `.json` di configurazione, non deve duplicare la configurazione in altri file, non deve usare costanti hardcoded nel codice.

### R-09 — Composizione tramite compositori logici
Per regole "campo valido SE condizione A E condizione B" o "accetta A O B":

```ts
// src/validation/strategies/allOf.ts
import type { ValidationStrategy, ValidationResult, ValidationContext } from '../types.ts';
import { safeRun } from './safeRun.ts';

export const allOf =
  (...strategies: ValidationStrategy[]) =>
  async (value: unknown, ctx: ValidationContext): Promise<ValidationResult> => {
    for (const s of strategies) {
      const res = await safeRun(s, value, ctx);
      if (!res.ok) return res; // fail-fast interno al compositore
    }
    return { ok: true };
  };

// src/validation/strategies/anyOf.ts
import type { ValidationStrategy, ValidationResult, ValidationContext } from '../types.ts';
import { safeRun } from './safeRun.ts';

export const anyOf =
  (...strategies: ValidationStrategy[]) =>
  async (value: unknown, ctx: ValidationContext): Promise<ValidationResult> => {
    const results = await Promise.all(strategies.map((s) => safeRun(s, value, ctx)));
    return results.some((r) => r.ok)
      ? { ok: true }
      : { ok: false, code: 'anyOf', errors: results } as ValidationResult;
  };
```

### R-10 — Dipendenze tra campi nel contesto
Le validazioni cross-field (es. `endDate > startDate`) usano `ctx.data`:

```ts
// src/validation/strategies/isAfterField.ts
import type { ValidationResult, ValidationContext } from '../types.ts';

export const isAfterField =
  (otherField: string) =>
  (value: unknown, ctx: ValidationContext): ValidationResult => {
    const other = ctx.data[otherField];
    if (!value || !other) return { ok: false, code: 'missing', message: 'Date missing' };
    return new Date(value as string) > new Date(other as string)
      ? { ok: true }
      : { ok: false, code: 'order', message: `Must be after ${otherField}` };
  };
```

---

## [NEGATIVE CONSTRAINTS — AI ANTI-PATTERNS DA BLOCCARE]

Questi pattern sono **vietati**. Se l'agente li genera, la risposta è da rigenerare.

### ❌ AP-01 — Switch/if-else nel manager centrale
```ts
// VIETATO — non generare mai questo pattern
export function validateField(name: string, value: unknown) {
  switch (name) {
    case 'email': /* ... */ break;
    case 'password': /* ... */ break;
    // cresce senza limite → distrugge il pattern
  }
}
```
**Correzione:** crea una nuova strategia in `strategies/`, registrala nel registry, aggiungila a `validation.config.ts`.

### ❌ AP-02 — If-else escalation nelle strategie esistenti
```ts
// VIETATO — non aggiungere logica a file esistenti
export const isEmail = (value: unknown, ctx: ValidationContext): ValidationResult => {
  if (someNewCondition) { /* nuova regola aggiunta qui → sbagliato */ }
  // ...
};
```
**Correzione:** crea una nuova strategia separata e componila con `allOf`.

### ❌ AP-03 — I/O sincrono senza timeout nel flusso principale
```ts
// VIETATO
export const isVATValid = (value: unknown, ctx: ValidationContext): ValidationResult => {
  const res = syncHttpCall(`/api/vat/${value}`); // blocca il thread, nessun timeout
  return { ok: res.valid };
};
```
**Correzione:** rendi la strategia `async`, wrappala con `safeRun`, aggiungi `AbortController` con timeout.

### ❌ AP-04 — Ritorno `true` silenzioso su errore
```ts
// VIETATO
export const isEmail = (value: unknown): ValidationResult => {
  try { /* ... */ }
  catch { return { ok: true }; } // nasconde l'errore → debug impossibile
};
```
**Correzione:** usa `safeRun` che garantisce `{ ok: false, code: 'exception', message }`.

### ❌ AP-05 — Modifica dello stato globale nelle strategie
```ts
// VIETATO
const globalErrorStore: string[] = [];
export const isEmail = (value: unknown): ValidationResult => {
  if (!valid) globalErrorStore.push('email invalid'); // side-effect → non testabile
  return { ok: valid };
};
```
**Correzione:** ritorna solo `{ ok, code, message }`. L'aggregazione è responsabilità di `validate.ts`.

### ❌ AP-06 — Regole duplicate in più file
```ts
// VIETATO — stesso pattern regex in tre file diversi
// isEmail.ts: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// userValidator.ts: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// formValidator.ts: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
```
**Correzione:** una sola strategia `isEmail.ts`, importata ovunque tramite registry.

### ❌ AP-07 — Configurazioni "magiche" inline
```ts
// VIETATO — costanti di validazione sepolte nel codice
const MIN_PASSWORD_LENGTH = 12; // hardcoded nel manager
```
**Correzione:** il valore va in `src/config/validation.config.ts` come `args: 12`.

### ❌ AP-08 — Regex precompilata a ogni invocazione
```ts
// VIETATO — costoso in loop
export const matchesRegex =
  (pattern: string) =>
  (value: unknown): ValidationResult => {
    return { ok: new RegExp(pattern).test(String(value)), code: 'pattern', message: 'Invalid format' };
    // ricrea la regex a ogni chiamata
  };
```
**Correzione:**
```ts
// CORRETTO — precompila nella closure esterna
export const matchesRegex =
  (pattern: string) => {
    const re = new RegExp(pattern); // precompila una volta sola
    return (value: unknown): ValidationResult => ({
      ok: re.test(String(value)),
      code: 'pattern',
      message: 'Invalid format',
    });
  };
```

---

## [TOKEN COST OPTIMIZATION — RAZIONALE]

L'architettura atomica non è solo un principio di design: è una strategia di ottimizzazione del context window dell'agente.

| Scenario | File letti dall'agente | Token consumati |
|---|---|---|
| Manager monolitico — modifica 1 regola | `validator.ts` (500+ righe) + test suite globale | ~4.000–8.000 |
| Architettura atomica — modifica 1 regola | `strategies/isEmail.ts` + `test/strategies/isEmail.test.ts` + `registry.ts` | ~200–400 |

**Principio operativo per l'agente:**
Quando viene richiesta una modifica a una singola regola di validazione, caricare **solo e soltanto**:
1. Il file della strategia da modificare (o creare).
2. Il file di test corrispondente.
3. `registry.ts` (solo se la strategia è nuova).
4. `src/config/validation.config.ts` (solo se la pipeline del campo cambia).

Non caricare mai `validate.ts` o `buildPipeline.ts` per operazioni di business logic.

---

## [WORKFLOW OPERATIVO — CHECKLIST PER L'AGENTE]

Quando l'utente richiede una nuova regola di validazione, esegui nell'ordine:

```
[ ] 1. Crea `src/validation/strategies/[nomeRegola].ts`
        - Importa i tipi da `../types.ts`
        - Firma contrattuale: (value: unknown, ctx: ValidationContext) => ValidationResult
        - Nessun side-effect, nessun I/O diretto
        - Gestisci null/undefined/tipo errato esplicitamente

[ ] 2. Crea `test/strategies/[nomeRegola].test.ts`
        - Caso valido ✓
        - Caso invalido ✓
        - Tipo errato ✓
        - Edge case specifico del dominio ✓
        - Passa sempre ctx completo: { field, data: {} }

[ ] 3. Aggiungi l'import e la chiave in `src/validation/registry.ts`
        - Solo append, mai riorganizzare

[ ] 4. Aggiorna `src/config/validation.config.ts`
        - Aggiungi la regola al campo corretto con eventuali args
        - Mantieni `as const` e `Object.freeze`

[ ] 5. STOP — non toccare validate.ts, buildPipeline.ts, o altre strategie esistenti
```

---

## [ESEMPIO COMPLETO — AGGIUNTA DI UNA NUOVA REGOLA]

**Richiesta utente:** "Il campo `username` deve contenere solo lettere, numeri e underscore."

**Output atteso dall'agente:**

```ts
// src/validation/strategies/isAlphanumericUnderscore.ts
import type { ValidationResult, ValidationContext } from '../types.ts';

const PATTERN = /^[a-zA-Z0-9_]+$/; // precompilato fuori dalla funzione

export const isAlphanumericUnderscore = (
  value: unknown,
  ctx: ValidationContext
): ValidationResult => {
  if (value === null || value === undefined || value === '')
    return { ok: false, code: 'required', message: 'Field is required' };
  if (typeof value !== 'string')
    return { ok: false, code: 'type', message: 'Must be a string' };
  return PATTERN.test(value)
    ? { ok: true }
    : { ok: false, code: 'pattern', message: 'Only letters, numbers, and underscores allowed' };
};
```

```ts
// test/strategies/isAlphanumericUnderscore.test.ts
import { describe, it, expect } from 'vitest';
import { isAlphanumericUnderscore } from '../../src/validation/strategies/isAlphanumericUnderscore.ts';

const ctx = { field: 'username', data: {} };

describe('isAlphanumericUnderscore', () => {
  it('accetta username valido', () => {
    expect(isAlphanumericUnderscore('user_123', ctx)).toEqual({ ok: true });
  });
  it('rifiuta spazi e caratteri speciali', () => {
    expect(isAlphanumericUnderscore('user name!', ctx)).toMatchObject({ ok: false, code: 'pattern' });
  });
  it('rifiuta stringa vuota', () => {
    expect(isAlphanumericUnderscore('', ctx)).toMatchObject({ ok: false, code: 'required' });
  });
  it('rifiuta null', () => {
    expect(isAlphanumericUnderscore(null, ctx)).toMatchObject({ ok: false, code: 'required' });
  });
  it('rifiuta input numerico', () => {
    expect(isAlphanumericUnderscore(42, ctx)).toMatchObject({ ok: false, code: 'type' });
  });
});
```

```ts
// src/validation/registry.ts — solo questa riga aggiunta
import { isAlphanumericUnderscore } from './strategies/isAlphanumericUnderscore.ts';
// ...
export const registry = Object.freeze({
  // ... esistenti invariati ...
  isAlphanumericUnderscore, // ← unica aggiunta
});
```

```ts
// src/config/validation.config.ts — campo aggiunto
export const validationConfig = Object.freeze({
  // ... esistenti invariati ...
  username: [
    { name: 'isRequired' },
    { name: 'isAlphanumericUnderscore' },
  ],
} as const);
```

**File NON toccati:** `validate.ts`, `buildPipeline.ts`, qualsiasi altra strategia esistente.
