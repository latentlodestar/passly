import { useGetStatusQuery } from "../api/api";
import { Card, CardHeader, CardBody } from "../components/Card";

export function StatusPage() {
  const { data: status, isLoading: statusLoading, error: statusError } = useGetStatusQuery();

  if (statusLoading) {
    return (
      <div className="page">
        <p>Loading...</p>
      </div>
    );
  }

  if (statusError) {
    return (
      <div className="page">
        <Card status="error">
          <CardHeader>Error</CardHeader>
          <CardBody>
            <p>{"status" in statusError ? `HTTP ${statusError.status}` : statusError.message}</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="page">

    </div>
  );
}
