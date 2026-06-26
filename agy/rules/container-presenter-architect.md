---
name: container-presenter-architect
version: 1.1.0
description: >
  Impone la separazione rigorosa Container (logica/dati) vs Presenter (puro markup)
  nell'architettura Astro + TypeScript + Tailwind con SSoT centralizzato.
  Blocca gli anti-pattern LLM più frequenti e ottimizza il consumo di Context Window
  nelle sessioni agy/Claude Sonnet isolando le superfici di modifica.
activationGlobs:
  - "src/components/**/*.astro"
  - "src/features/**/*.astro"
  - "src/layouts/**/*.astro"
  - "src/islands/**/*.astro"
  - "src/scripts/**/*.ts"
  - "src/config/**/*.ts"
  - "src/pages/**/*.astro"
alwaysApply: false
---

# SKILL: CONTAINER / PRESENTER ARCHITECT
## Stack: Astro · TypeScript · Tailwind CSS · SSoT · agy/Claude Sonnet

---

## [CORE PURPOSE]

Questa skill ha un unico obiettivo operativo: **impedire la creazione di componenti
monolitici** che mescolano logica di business, orchestrazione dei dati e markup visivo
nello stesso scope sintattico.

In Astro, la separazione non è tra due file distinti (come in React), ma tra **zone
architetturali precise** all'interno del singolo file `.astro` e tra moduli TypeScript
dedicati per la logica client-side. Ogni violazione di questi confini aumenta il
"Context Window Tax" delle sessioni agy: l'agente è costretto a rileggere e ri-analizzare
superfici semantiche irrilevanti per il task corrente.

**Regola zero**: una modifica di stile non deve mai toccare la logica. Una modifica di
business logic non deve mai toccare il markup. Se una modifica tocca entrambi, il
componente è mal progettato.

---

## [ACTIVATION TRIGGERS]

Questa skill si attiva automaticamente quando agy lavora su:

```
src/components/**/*.astro      → componenti UI riusabili
src/features/**/*.astro        → componenti feature-specifici con orchestrazione dati
src/layouts/**/*.astro         → layout con composizione di sezioni
src/islands/**/*.astro         → isole idratate lato client (client:load / client:visible)
src/scripts/**/*.ts            → moduli logica client-side isolata (Vanilla TS)
src/config/**/*.ts             → registri SSoT centralizzati (immutabili, as const)
src/pages/**/*.astro           → pagine: zone di massima responsabilità Container
```

**Non attivare questa skill su:**
```
src/styles/**            → CSS puro, nessuna logica
public/**                → asset statici
astro.config.mjs         → configurazione build, non architettura runtime
```

---

## [MAPPA DELLE ZONE ARCHITETTURALI IN ASTRO]

In Astro, la separazione avviene per **zone di file**, non per file separati:

```
┌─────────────────────────────────────────────────────────┐
│  file.astro                                             │
│                                                         │
│  ---                           ← ZONA CONTAINER        │
│  // Frontmatter: TypeScript server-side                 │
│  // ✅ Import da src/config/   (SSoT reads)            │
│  // ✅ Fetch/load dati         (build-time)             │
│  // ✅ Trasformazione props    (mapping, validazione)   │
│  // ✅ Logica condizionale     (guard, redirect)        │
│  // ❌ Mai JSX/HTML qui       (appartiene al template)  │
│  ---                                                    │
│                                                         │
│  <!-- ZONA PRESENTER -->                                │
│  <!-- Solo markup HTML + classi Tailwind + {props} -->  │
│  <!-- ❌ Mai logica di business qui -->                 │
│  <!-- ❌ Mai import di config/store/servizi -->         │
│                                                         │
│  <script>                      ← ZONA ISLAND BINDING   │
│  // Solo: querySelector + addEventListener              │
│  // ❌ MAI logica business inline                       │
│  // ✅ Importa da src/scripts/*.ts se serve logica      │
│  </script>                                              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  src/scripts/[feature].logic.ts  ← MODULO LOGICA       │
│  // Funzioni pure, handler, validatori                  │
│  // ✅ Nessuna dipendenza dal DOM al top level          │
│  // ✅ Esportazioni named, mai default export           │
│  // ✅ as const per lookup tables e config locali       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  src/config/[domain].config.ts   ← SSoT REGISTRY       │
│  // Unica fonte di verità per dati, label, costanti     │
│  // ✅ Immutabile: export const X = { ... } as const    │
│  // ✅ Interfacce TypeScript esportate accanto ai dati  │
│  // ❌ Nessuna logica condizionale o side-effect        │
└─────────────────────────────────────────────────────────┘
```

---

## [STRICT ENGINEERING RULES]

### R-01 · FRONTMATTER = UNICA ZONA DI ORCHESTRAZIONE

Il blocco `---` in un file `.astro` è la **zona Container**. È l'unico posto dove:
- Si importano e si leggono i registri SSoT (`src/config/*.config.ts`)
- Si eseguono `fetch()` o `Astro.glob()` o `getCollection()` a build-time
- Si mappano e si trasformano i dati in props semplici da passare al template
- Si applicano guard, redirect (`Astro.redirect()`), o condizioni di rendering

```typescript
---
// ✅ CORRETTO - Frontmatter come Container
import { ECOMMERCE_CONFIG } from '@/config/ecommerce.config'
import type { ProductCardProps } from '@/types/product.types'

const { productId } = Astro.props
const product = ECOMMERCE_CONFIG.products.find(p => p.id === productId)

if (!product) {
  return Astro.redirect('/404')
}

const cardProps: ProductCardProps = {
  name: product.name,
  price: product.price,
  imageAlt: `Foto di ${product.name}`,
  isAvailable: product.stock > 0,
}
---
<!-- Template usa solo cardProps - nessuna logica qui -->
<article class="rounded-lg border p-4">
  <h3 class="text-lg font-semibold">{cardProps.name}</h3>
  <p class="text-primary-600">€{cardProps.price.toFixed(2)}</p>
  {cardProps.isAvailable
    ? <span class="text-green-600">Disponibile</span>
    : <span class="text-red-500">Esaurito</span>
  }
</article>
```

---

### R-02 · TEMPLATE = ZONA PRESENTER PURA

Il template HTML di un file `.astro` (sotto i `---`) accetta **solo** variabili già
preparate dal frontmatter. Non contiene:
- Import di moduli o config
- Logica di trasformazione dati
- Calcoli inline (moltiplicazioni di prezzo, formattazioni date, ecc.)
- Accesso diretto a `Astro.props` non già normalizzato

```astro
---
// Frontmatter ha già preparato tutto
const { items, totalCount, isEmpty } = await buildCartSummaryProps(Astro.props)
---

<!-- ✅ CORRETTO - Template puramente dichiarativo -->
{isEmpty
  ? <p class="text-gray-400">Il carrello è vuoto.</p>
  : <ul>{items.map(item => <li>{item.label} × {item.qty}</li>)}</ul>
}
<p class="font-bold">Totale: {totalCount} articoli</p>
```

---

### R-03 · SSoT FIRST — ZERO VALORI HARDCODED NEI COMPONENTI

Nessun valore di business (prezzi, label, URL, soglie, configurazioni) viene scritto
inline nel template o nel frontmatter di un componente. Ogni dato proviene da
`src/config/*.config.ts`.

```typescript
// ✅ src/config/ecommerce.config.ts
export const ECOMMERCE_CONFIG = {
  shipping: {
    freeThreshold: 49.90,
    standardCost: 4.90,
    label: 'Spedizione gratuita sopra €49,90',
  },
  currency: {
    symbol: '€',
    locale: 'it-IT',
  },
} as const

export type EcommerceConfig = typeof ECOMMERCE_CONFIG
```

```astro
---
// ✅ Componente legge dal SSoT, non hardcoda
import { ECOMMERCE_CONFIG } from '@/config/ecommerce.config'
const { freeThreshold, label } = ECOMMERCE_CONFIG.shipping
---
<p class="text-sm text-gray-500">{label}</p>
```

---

### R-04 · SCRIPT TAG = SOLO THIN BINDING

Il tag `<script>` in un componente `.astro` contiene **esclusivamente** event binding
e query DOM minimali. Tutta la logica reale vive in `src/scripts/*.logic.ts`.

```astro
<!-- ✅ CORRETTO -->
<script>
  import { initContactFormValidation } from '@/scripts/contact-form.logic'

  document.addEventListener('astro:page-load', () => {
    const form = document.querySelector<HTMLFormElement>('#contact-form')
    if (form) initContactFormValidation(form)
  })
</script>
```

```typescript
// ✅ src/scripts/contact-form.logic.ts
export function initContactFormValidation(form: HTMLFormElement): void {
  form.addEventListener('submit', handleSubmit)
}

function handleSubmit(event: SubmitEvent): void {
  event.preventDefault()
  const data = new FormData(event.currentTarget as HTMLFormElement)
  // Tutta la logica di validazione vive qui, non nel tag <script>
}
```

---

### R-05 · CONVENZIONI DI NAMING OBBLIGATORIE

```
src/
├── components/
│   ├── ProductCard.astro           → Presenter puro (solo props + markup)
│   └── CartSummary.astro           → Presenter puro
│
├── features/
│   ├── ProductCard.container.astro → Container: fetch SSoT → props → <ProductCard>
│   └── CartSummary.container.astro → Container: stato carrello → <CartSummary>
│
├── islands/
│   └── ContactForm.island.astro    → Island idratata (client:load), thin binding only
│
├── scripts/
│   ├── contact-form.logic.ts       → Logica validazione/submission Vanilla TS
│   └── cart.logic.ts               → Logica carrello client-side
│
└── config/
    ├── ecommerce.config.ts         → SSoT prodotti, prezzi, soglie
    └── site.config.ts              → SSoT metadati, navigazione, label globali
```

**Regola di naming**: se un `.astro` legge dal SSoT, fa fetch o orchestra più componenti
figli → deve chiamarsi `*.container.astro`. Se riceve solo props e renderizza → `*.astro`.

---

### R-06 · INTERFACCE TYPESCRIPT ESPLICITE PER OGNI PROPS CONTRACT

Ogni componente Presenter definisce ed esporta la propria interfaccia Props. Nessun `any`.
Nessuna prop opzionale senza valore di default o `undefined` esplicito.

```typescript
// ✅ Interfaccia esplicita, esportata, co-locata con il componente
export interface ProductCardProps {
  name: string
  price: number
  imageAlt: string
  isAvailable: boolean
  badgeLabel?: string  // esplicito: può essere undefined
}
```

---

### R-07 · ISOLE ASTRO — IDRATAZIONE MINIMA E MOTIVATA

Ogni componente con direttiva `client:*` deve avere nel frontmatter un commento
che giustifica l'idratazione e specifica la strategia scelta:

```astro
---
// 🏝️ ISLAND: client:visible
// Motivo: il form contatti non è above-the-fold, si idrata solo quando visibile.
// Dipendenze client: src/scripts/contact-form.logic.ts
---
```

Strategie ammesse:
- `client:load` → interazione critica above-the-fold
- `client:idle` → interazione non critica, idrata quando il browser è idle
- `client:visible` → componente below-the-fold
- `client:only="..."` → componente che richiede APIs browser-only (es. localStorage)

---

## [NEGATIVE CONSTRAINTS — AI ANTI-PATTERNS DA BLOCCARE]

Le seguenti istruzioni sono **divieti assoluti**. Se agy genera codice che viola uno
di questi vincoli, il codice va rifiutato e rigenerato specificando la regola violata.

---

### ❌ AP-01 — NO FETCH O AWAIT NEL TEMPLATE

```astro
<!-- ❌ VIETATO ASSOLUTO -->
<ul>
  {(await fetch('/api/products').then(r => r.json())).map(p => (
    <li>{p.name}</li>
  ))}
</ul>
```

**Correzione**: il fetch va nel frontmatter (`---`), il template riceve dati già pronti.

---

### ❌ AP-02 — NO IMPORT DI CONFIG/STORE DENTRO IL TEMPLATE

```astro
<!-- ❌ VIETATO -->
<p>{ECOMMERCE_CONFIG.shipping.label}</p>
<script>
  import { ECOMMERCE_CONFIG } from '@/config/ecommerce.config'
  // ❌ Il config SSoT non va importato nel tag <script>: è server-side only
</script>
```

**Correzione**: le config SSoT vengono lette solo nel frontmatter e passate come prop
al template. Il tag `<script>` importa solo da `src/scripts/*.ts`.

---

### ❌ AP-03 — NO LOGICA DI TRASFORMAZIONE INLINE NEL TEMPLATE

```astro
<!-- ❌ VIETATO: calcoli e logica inline -->
<p>€{(product.price * (1 - product.discount / 100)).toFixed(2)}</p>
<p>{product.name.charAt(0).toUpperCase() + product.name.slice(1).toLowerCase()}</p>
```

**Correzione**: tutte le trasformazioni vanno nel frontmatter come variabili locali.

---

### ❌ AP-04 — NO VALORI HARDCODED NEI COMPONENTI

```astro
<!-- ❌ VIETATO: valori business hardcoded -->
<p>Spedizione gratuita sopra €49,90</p>
<span class="text-red-500">Sconto del 15% sui prodotti selezionati</span>
```

**Correzione**: ogni valore di business proviene da `src/config/*.config.ts`.

---

### ❌ AP-05 — NO LOGICA DI BUSINESS NEL TAG `<script>`

```astro
<!-- ❌ VIETATO: logica complessa inline nel tag script -->
<script>
  const form = document.querySelector('#contact-form')
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(e.target))
    // Validazione inline di 40 righe...
    // Chiamata fetch inline...
    // Gestione errori inline...
  })
</script>
```

**Correzione**: creare `src/scripts/[feature].logic.ts` e importare la funzione
già testabile e isolata.

---

### ❌ AP-06 — NO COMPONENTI PRESENTER CHE ACCETTANO `Astro.props` NON NORMALIZZATO

```astro
---
// ❌ VIETATO: il Presenter fa il lavoro del Container
const { userId } = Astro.props
const user = await getUser(userId)  // fetch dentro un Presenter!
---
```

**Correzione**: creare `UserProfile.container.astro` che fa il fetch e passa a
`UserProfile.astro` solo le props già mappate.

---

### ❌ AP-07 — NO EXPORT DEFAULT MANCANTE O ANONIMO NEI MODULI TS

```typescript
// ❌ VIETATO: export default di funzione anonima (non tracciabile, non testabile)
export default (form: HTMLFormElement) => { /* ... */ }

// ❌ VIETATO: nessun export (modulo inutilizzabile)
function initForm() { /* ... */ }
```

**Correzione**: named exports espliciti, sempre.

---

### ❌ AP-08 — NO DUPLICAZIONE DI CLASSI TAILWIND TRA VARIANTI

```astro
<!-- ❌ VIETATO: copia-incolla di classi con una sola variazione -->
{isActive
  ? <button class="px-4 py-2 bg-primary-600 text-white rounded-md font-semibold">OK</button>
  : <button class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md font-semibold">OK</button>
}
```

**Correzione**: usare variabili CSS (classi dinamiche) o `class:list`:

```astro
<button class:list={[
  'px-4 py-2 rounded-md font-semibold',
  isActive ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
]}>
  OK
</button>
```

---

## [TOKEN COST OPTIMIZATION — GUIDA ALL'USO CON agy]

La separazione Container/Presenter riduce il "Context Window Tax" nelle sessioni
agy in modo diretto e misurabile:

### Task di stile (UI change)
→ agy legge **solo** `*.astro` template zone + classi Tailwind
→ **ignora** frontmatter, config, scripts
→ riduzione stimata del contesto: 60–70%

### Task di business logic (config change)
→ agy legge **solo** `src/config/*.config.ts` + `*.container.astro`
→ **ignora** template, classi, markup
→ riduzione stimata del contesto: 50–65%

### Task di test
→ Presenters: agy genera test con fixture di props pure, nessun mock di fetch/store
→ Container: agy genera test con mock di config e funzioni di fetch isolate
→ I due task non si contaminano mai

### Istruzione operativa per agy

Quando istruisci agy su un task, specifica esplicitamente la zona:

```
# [ZONA: PRESENTER ONLY]
Modifica solo il template HTML di ProductCard.astro.
Non toccare il frontmatter. Non toccare src/config/.

# [ZONA: CONFIG SSoT]
Aggiorna solo src/config/ecommerce.config.ts.
Non toccare i componenti .astro.

# [ZONA: LOGICA CLIENT]
Aggiorna solo src/scripts/contact-form.logic.ts.
Non toccare il tag <script> del componente .astro.
```

---

## [RIFERIMENTI REALI]

- RTK Query docs (pattern adapter/selector): https://redux-toolkit.js.org/rtk-query/overview
- use-context-selector (granular subscriptions): https://github.com/dai-shi/use-context-selector
- Awesome CursorRules (TypeScript/React rules reference): https://github.com/PatrickJS/awesome-cursorrules
- Astro Islands Architecture: https://docs.astro.build/en/concepts/islands/
- Astro Content Collections (SSoT per content): https://docs.astro.build/en/guides/content-collections/

---
*Skill generata da agy/Claude Sonnet · Versione 1.1.0 · Stack: Astro + TypeScript + Tailwind + SSoT*
*Path: .agy/rules/container-presenter-architect.md*
