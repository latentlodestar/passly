export const processSteps = [
  { label: 'Import' },
  { label: 'Analyze' },
  { label: 'Evidence Ready' },
  { label: 'Review' },
  { label: 'Attest & Checkout' },
];

const stepRouteMap: Record<string, string> = {
  GetStarted: '/tutorial',
  ImportEvidence: '/evidence',
  AnalyzingChats: '/evidence',
  EvidenceReady: '/evidence-ready',
  ReviewComplete: '/checklist',
  AttestCheckout: '/attestation',
};

const routeStepMap: Record<string, string> = {
  '/tutorial': 'GetStarted',
  '/evidence': 'ImportEvidence',
  '/analyzing': 'AnalyzingChats',
  '/evidence-ready': 'EvidenceReady',
  '/checklist': 'ReviewComplete',
  '/attestation': 'AttestCheckout',
};

/** Maps a server step name to a processSteps index (0-based). */
const stepIndexMap: Record<string, number> = {
  GetStarted: 0,
  ImportEvidence: 0,
  AnalyzingChats: 1,
  EvidenceReady: 2,
  ReviewComplete: 3,
  AttestCheckout: 4,
};

export function stepToIndex(step: string): number {
  return stepIndexMap[step] ?? 0;
}

export function stepToRoute(step: string | null | undefined): string {
  if (!step) return '/tutorial';
  return stepRouteMap[step] ?? '/tutorial';
}

export function routeToStep(route: string): string | undefined {
  return routeStepMap[route];
}

const indexRouteMap: Record<number, string> = {
  0: '/evidence',
  1: '/analyzing',
  2: '/evidence-ready',
  3: '/checklist',
  4: '/attestation',
};

/** Maps a 0-based step index to its screen route. */
export function indexToRoute(index: number): string | undefined {
  return indexRouteMap[index];
}
