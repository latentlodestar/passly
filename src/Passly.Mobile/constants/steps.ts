export const processSteps = [
  { label: 'Import evidence' },
  { label: 'Review' },
  { label: 'Summary' },
];

const stepRouteMap: Record<string, string> = {
  GetStarted: '/',
  ImportEvidence: '/evidence',
  ReviewComplete: '/checklist',
};

const routeStepMap: Record<string, string> = {
  '/evidence': 'ImportEvidence',
  '/checklist': 'ReviewComplete',
  '/submit': 'ReviewComplete',
};

export function stepToRoute(step: string): string {
  return stepRouteMap[step] ?? '/evidence';
}

export function routeToStep(route: string): string | undefined {
  return routeStepMap[route];
}
