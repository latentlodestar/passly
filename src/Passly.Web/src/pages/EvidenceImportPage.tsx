import { useCallback, useState } from "react";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Alert } from "../components/Alert";
import { ProgressBar } from "../components/Stepper";

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  status: "uploading" | "processing" | "done" | "error";
}

export function EvidenceImportPage() {
  const [files, setFiles] = useState<UploadedFile[]>([
    {
      id: "1",
      name: "WhatsApp Chat - Partner.txt",
      size: "2.4 MB",
      status: "done",
    },
    {
      id: "2",
      name: "WhatsApp Chat - Family Group.txt",
      size: "1.1 MB",
      status: "processing",
    },
  ]);
  const [dragActive, setDragActive] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const droppedFiles = Array.from(e.dataTransfer.files);
      const newFiles: UploadedFile[] = droppedFiles.map((f, i) => ({
        id: `new-${Date.now()}-${i}`,
        name: f.name,
        size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
        status: "uploading" as const,
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    },
    [],
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const statusBadge = (status: UploadedFile["status"]) => {
    switch (status) {
      case "done":
        return <Badge variant="success">Processed</Badge>;
      case "processing":
        return <Badge variant="warning">Processing</Badge>;
      case "uploading":
        return <Badge variant="neutral">Uploading</Badge>;
      case "error":
        return <Badge variant="danger">Error</Badge>;
    }
  };

  return (
    <div className="page">
      <div className="page-section">
        <div className="page-section__header">
          <div>
            <h2 className="page-section__title">Import evidence</h2>
            <p className="page-section__subtitle">
              Upload WhatsApp chat exports to analyze your communication
              timeline.
            </p>
          </div>
        </div>

        <Alert variant="info">
          To export a WhatsApp chat: open the chat &rarr; tap the contact name
          &rarr; Export Chat &rarr; Without Media. Upload the resulting .txt
          file here.
        </Alert>

        <div
          className={`upload-area ${dragActive ? "upload-area--active" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          aria-label="Upload area"
        >
          <div className="upload-area__icon">{"\u{1F4C1}"}</div>
          <div className="upload-area__title">
            Drop chat export files here
          </div>
          <div className="upload-area__subtitle">
            or click to browse. Accepts .txt and .zip files.
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="page-section">
          <div className="page-section__header">
            <h3 className="page-section__title">Uploaded files</h3>
            <span className="helper-text">
              {files.filter((f) => f.status === "done").length} of{" "}
              {files.length} processed
            </span>
          </div>

          <ProgressBar
            value={files.filter((f) => f.status === "done").length}
            max={files.length}
            variant={
              files.every((f) => f.status === "done") ? "success" : "primary"
            }
          />

          <div className="file-list">
            {files.map((file) => (
              <div key={file.id} className="file-item">
                <div className="file-item__icon">{"\u{1F4C4}"}</div>
                <div className="file-item__info">
                  <div className="file-item__name">{file.name}</div>
                  <div className="file-item__meta">{file.size}</div>
                </div>
                <div className="file-item__status">{statusBadge(file.status)}</div>
                <button
                  className="file-item__remove"
                  onClick={() => removeFile(file.id)}
                  aria-label={`Remove ${file.name}`}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)" }}>
            <Button variant="secondary">Add more files</Button>
            <Button
              disabled={!files.every((f) => f.status === "done")}
            >
              Continue to review
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
