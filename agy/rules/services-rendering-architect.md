---
name: services-rendering-architect
description: Attiva questa skill quando il task richiede l'integrazione di API/Fetch esterne, la creazione di servizi, il rendering di liste di dati (DDR) o l'uso di componenti interattivi lato client (Astro Islands).
tools:
  - Read
  - Glob
model: claude-sonnet
memory: project
isolation: true
version: "1.0.0"
registry_id: ecommerce-services-rendering-policy
scope: project
priority: high
---

# SKILL: Services & Dynamic Rendering Architecture (Facade, DDR, Islands)
**Target:** Google Antigravity IDE (multi-model: Gemini, Claude, GPT-compatible)
**Format:** Agentic Skill — Markdown structured instruction set
**Version:** 1.0.0

---

## [CORE PURPOSE]

Questa Skill governa la comunicazione con l'esterno (API/SDK) e l'ottimizzazione del rendering client/server in Astro.
Il suo scopo esclusivo è garantire che:
1. **Nessun `fetch` o SDK transazionale** viva dentro i componenti visivi (Facade Pattern).
2. **Nessun briciolo di JavaScript inutile** venga inviato al browser (Astro Islands Architecture).
3. **I template HTML siano guidati da strutture dati pulite** e non da switch o if-else nidificati (Data-Driven Rendering).

---

## [ACTIVATION TRIGGERS]

Questa Skill si attiva automaticamente sui seguenti path:

src/services//*.ts
src/components//.astro
src/islands//.astro
src/pages//*.astro

O su richieste in linguaggio naturale come: "fai una fetch da...", "integra le API di...", "rendi questo componente interattivo", "mappa questa lista di prodotti".

---

## [ARCHITETTURA DI RIFERIMENTO]

L'agente deve strutturare l'interazione tra servizi e viste seguendo questo flusso unidirezionale:

[API / SDK Esterni]
│
▼
src/services/.service.ts      ← [FACADE] Isola l'I/O, normalizza i tipi in uscita
│
▼
src/components/.container.astro ← [CONTAINER] Invoca il servizio a server-time
│
▼
src/components/.presenter.astro ← [DDR] Riceve i dati normalizzati e cicla sul markup
│ (se serve interattività client)
▼
src/islands/.island.astro       ← [ASTRO ISLANDS] Idratazione client controllata  


---

## [STRICT ENGINEERING RULES]

### R-01 — Facade Pattern per l'I/O (Scudo API)
Tutte le chiamate HTTP, GraphQL o istanziazioni di SDK esterni (es. tracciamento spedizioni, Stripe, CMS) devono vivere dentro `src/services/[nome].service.ts`. 
* I componenti Astro non conoscono gli endpoint, gli header o i token di autenticazione.
* Il servizio deve catturare gli errori a monte e restituire sempre un tipo standard normalizzato (niente dati grezzi "raw" dell'API sparsi nel frontend).

```ts
// src/services/tracking.service.ts
import type { TrackingInfo } from '../types/tracking.ts';

export const TrackingService = {
  async getOrderShipment(orderId: string): Promise<{ data: TrackingInfo | null; error: string | null }> {
    try {
      const res = await fetch(`[https://api.shipper.com/v1/track/$](https://api.shipper.com/v1/track/$){orderId}`, {
        headers: { Authorization: `Bearer ${import.meta.env.SHIPPER_API_KEY}` }
      });
      if (!res.ok) throw new Error('Shipment data fetch failed');
      const raw = await res.json();
      
      // Normalizzazione dei dati per l'e-commerce
      return {
        data: { id: raw.tracking_number, status: raw.current_status, eta: raw.estimated_delivery },
        error: null
      };
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : 'Unknown network error' };
    }
  }
};
R-02 — Astro Islands (Static-First & Idratazione Giustificata)Astro genera HTML statico di default. L'uso di un'isola client interattiva (.island.astro o componenti Svelte/Vue/React se integrati) deve essere ridotto al minimo indispensabile.  Regola di Idratazione: Quando l'agente usa una direttiva client (es: client:load, client:visible), deve inserire un commento di una riga nel frontmatter del file ospitante per giustificarne la scelta tecnica.Le parti statiche (intestazioni, descrizioni legali, card informative) devono rimanere fuori dall'isola.  

Snippet di codice
---
// src/components/TrackingTracker.container.astro
import { TrackingStatusIsland } from '../islands/TrackingStatus.island.astro'; //
// JUSTIFICATION: client:visible usato perché il grafico interattivo dello stato è sotto la piega della pagina.
---
<div class="bg-white p-6">
  <h2>Stato della Spedizione</h2> <!-- Statico -->
  <TrackingStatusIsland client:visible data="{shipmentData}"/> <!-- Isola client -->
</div>


R-03 — Data-Driven Rendering (DDR)I template grafici dei Presenter non devono contenere logica decisionale complessa o manipolazioni di stringhe. L'agente deve trasformare i dati nel blocco TypeScript (frontmatter) per generare array di oggetti pronti da ciclare con .map().  No ai blocchi if/else condizionali massicci nell'HTML. Usa mappe di configurazione o dizionari di rendering definiti in cima.


---
// src/components/TrackingSteps.presenter.astro (CORRETTO - DDR)
interface Props {
  currentStatus: 'processed' | 'shipped' | 'delivered';
}
const { currentStatus } = Astro.props;

// Dizionario degli stati per evitare switch nidificati nell'HTML
const STATUS_MAP = {
  processed: { label: 'In Elaborazione', color: 'bg-yellow-500' },
  shipped: { label: 'Spedito', color: 'bg-blue-500' },
  delivered: { label: 'Consegnato', color: 'bg-green-500' }
} as const;

const activeStep = STATUS_MAP[currentStatus] || STATUS_MAP.processed;
---
<div class="flex items-center gap-4">
  <div class={`h-4 w-4 rounded-full ${activeStep.color}`}></div>
  <p class="text-sm font-medium">{activeStep.label}</p>
</div>