export const processSteps = [
  { label: "Get started" },
  { label: "Import evidence" },
  { label: "Review & complete" },
];

const stepRouteMap: Record<string, string> = {
  GetStarted: "/submission/home",
  ImportEvidence: "/submission/evidence",
  ReviewComplete: "/submission/checklist",
};

const routeStepMap: Record<string, string> = {
  "/submission/home": "GetStarted",
  "/submission/evidence": "ImportEvidence",
  "/submission/checklist": "ReviewComplete",
};

const routeIndexMap: Record<string, number> = {
  "/submission/home": 0,
  "/submission/evidence": 1,
  "/submission/checklist": 2,
};

export function stepToRoute(step: string): string {
  return stepRouteMap[step] ?? "/submission/home";
}

export function routeToStep(route: string): string | undefined {
  return routeStepMap[route];
}

export function routeToStepIndex(route: string): number {
  return routeIndexMap[route] ?? 0;
}
