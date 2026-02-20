import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Alert } from "../components/Alert";
import { Card, CardBody } from "../components/Card";
import { useAppDispatch, useAppSelector } from "../store";
import { confirmSignUp, clearError } from "../store/authSlice";

export function ConfirmSignUpPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((s) => s.auth);
  const [searchParams] = useSearchParams();
  const emailFromParams = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(emailFromParams);
  const [code, setCode] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await dispatch(confirmSignUp({ email, code }));
    if (confirmSignUp.fulfilled.match(result)) {
      navigate("/signin");
    }
  };

  return (
    <div className="page">
      <div className="hero" style={{ paddingBottom: 0 }}>
        <h1 className="hero__title">Verify your email</h1>
        <p className="hero__subtitle">
          Enter the verification code sent to your email address.
        </p>
      </div>
      <div style={{ maxWidth: "400px", width: "100%", margin: "0 auto" }}>
        <Card>
          <CardBody>
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}
            >
              {error && (
                <Alert variant="danger" onDismiss={() => dispatch(clearError())}>
                  {error}
                </Alert>
              )}
              <div className="form-field">
                <label className="form-label" htmlFor="confirm-email">
                  Email
                </label>
                <Input
                  id="confirm-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="confirm-code">
                  Verification code
                </label>
                <Input
                  id="confirm-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  required
                  autoComplete="one-time-code"
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Verify email"}
              </Button>
              <div style={{ fontSize: "var(--text-sm)", textAlign: "center" }}>
                <Link to="/signin" style={{ color: "var(--primary)" }}>
                  Back to sign in
                </Link>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
