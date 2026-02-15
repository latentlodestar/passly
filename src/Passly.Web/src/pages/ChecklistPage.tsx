import { useState } from "react";
import { Card, CardHeader, CardBody } from "../components/Card";
import { Badge } from "../components/Badge";
import { Alert } from "../components/Alert";
import { ProgressBar } from "../components/Stepper";
import { Tabs } from "../components/Tabs";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  status: "complete" | "missing" | "weak";
  category: "documents" | "evidence" | "forms";
}

const checklistItems: ChecklistItem[] = [
  {
    id: "1",
    label: "Marriage certificate",
    description: "Certified copy of your marriage certificate",
    status: "complete",
    category: "documents",
  },
  {
    id: "2",
    label: "Passport copies",
    description: "Clear copies of both petitioner and beneficiary passports",
    status: "complete",
    category: "documents",
  },
  {
    id: "3",
    label: "Passport-style photos",
    description: "2x2 inch photos meeting USCIS specifications",
    status: "missing",
    category: "documents",
  },
  {
    id: "4",
    label: "Communication history",
    description: "Chat logs, call records, or messaging history",
    status: "complete",
    category: "evidence",
  },
  {
    id: "5",
    label: "Joint financial records",
    description: "Bank statements, shared accounts, or joint bills",
    status: "weak",
    category: "evidence",
  },
  {
    id: "6",
    label: "Photos together",
    description: "Photos showing your relationship over time",
    status: "missing",
    category: "evidence",
  },
  {
    id: "7",
    label: "Travel records",
    description: "Flight itineraries, boarding passes, or hotel bookings",
    status: "weak",
    category: "evidence",
  },
  {
    id: "8",
    label: "Affidavits of support",
    description: "Sworn statements from friends or family",
    status: "missing",
    category: "evidence",
  },
  {
    id: "9",
    label: "I-130 petition",
    description: "Form I-130, Petition for Alien Relative",
    status: "complete",
    category: "forms",
  },
  {
    id: "10",
    label: "I-130A supplement",
    description: "Additional information about the beneficiary",
    status: "missing",
    category: "forms",
  },
];

type TabValue = "all" | "documents" | "evidence" | "forms";

const tabOptions: { value: TabValue; label: string }[] = [
  { value: "all", label: "All items" },
  { value: "documents", label: "Documents" },
  { value: "evidence", label: "Evidence" },
  { value: "forms", label: "Forms" },
];

function statusIcon(status: ChecklistItem["status"]) {
  switch (status) {
    case "complete":
      return "\u2713";
    case "weak":
      return "\u26A0";
    case "missing":
      return "\u25CB";
  }
}

function statusIconClass(status: ChecklistItem["status"]) {
  switch (status) {
    case "complete":
      return "checklist__icon--done";
    case "weak":
      return "checklist__icon--warning";
    case "missing":
      return "checklist__icon--missing";
  }
}

function statusBadge(status: ChecklistItem["status"]) {
  switch (status) {
    case "complete":
      return <Badge variant="success">Complete</Badge>;
    case "weak":
      return <Badge variant="warning">Needs more</Badge>;
    case "missing":
      return <Badge variant="danger">Missing</Badge>;
  }
}

export function ChecklistPage() {
  const [activeTab, setActiveTab] = useState<TabValue>("all");

  const filtered =
    activeTab === "all"
      ? checklistItems
      : checklistItems.filter((i) => i.category === activeTab);

  const completed = checklistItems.filter((i) => i.status === "complete").length;
  const total = checklistItems.length;
  const pct = Math.round((completed / total) * 100);

  const missingCount = checklistItems.filter((i) => i.status === "missing").length;
  const weakCount = checklistItems.filter((i) => i.status === "weak").length;

  return (
    <div className="page">
      <div className="page-section">
        <h2 className="page-section__title">Petition readiness</h2>

        <div className="readiness">
          <div className="readiness__score">{pct}%</div>
          <div className="readiness__label">Overall readiness</div>
          <ProgressBar
            value={completed}
            max={total}
            variant={pct >= 80 ? "success" : pct >= 50 ? "warning" : "danger"}
          />
        </div>
      </div>

      {(missingCount > 0 || weakCount > 0) && (
        <Alert variant="warning" title="Items need attention">
          {missingCount > 0 && (
            <span>
              {missingCount} item{missingCount !== 1 ? "s" : ""} missing.{" "}
            </span>
          )}
          {weakCount > 0 && (
            <span>
              {weakCount} item{weakCount !== 1 ? "s" : ""} could be
              strengthened.
            </span>
          )}
        </Alert>
      )}

      <div className="page-section">
        <Tabs value={activeTab} onChange={setActiveTab} tabs={tabOptions} />

        <Card>
          <CardHeader>
            <span>Checklist</span>
            <span className="helper-text">
              {filtered.filter((i) => i.status === "complete").length} /{" "}
              {filtered.length} complete
            </span>
          </CardHeader>
          <CardBody className="checklist" style={{ padding: 0 }}>
            {filtered.map((item) => (
              <div key={item.id} className="checklist__item">
                <span
                  className={`checklist__icon ${statusIconClass(item.status)}`}
                  aria-hidden="true"
                >
                  {statusIcon(item.status)}
                </span>
                <div
                  className={`checklist__text ${
                    item.status === "complete" ? "checklist__text--done" : ""
                  }`}
                >
                  <div style={{ fontWeight: 500 }}>{item.label}</div>
                  <div className="helper-text">{item.description}</div>
                </div>
                <div className="checklist__badge">
                  {statusBadge(item.status)}
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
