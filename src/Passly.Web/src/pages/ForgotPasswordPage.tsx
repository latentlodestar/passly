import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Alert } from "../components/Alert";
import { Card, CardBody } from "../components/Card";
import { forgotPassword, confirmForgotPassword } from "../auth/cognito";

export function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<"request" | "confirm">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleRequestCode = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await forgotPassword(email);
      setStep("confirm");
      setSuccessMessage("A verification code has been sent to your email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await confirmForgotPassword(email, code, newPassword);
      navigate("/signin");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reset password.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="hero" style={{ paddingBottom: 0 }}>
        <h1 className="hero__title">Reset your password</h1>
        <p className="hero__subtitle">
          {step === "request"
            ? "Enter your email to receive a password reset code."
            : "Enter the code and your new password."}
        </p>
      </div>
      <div style={{ maxWidth: "400px", width: "100%", margin: "0 auto" }}>
        <Card>
          <CardBody>
            {step === "request" ? (
              <form
                onSubmit={handleRequestCode}
                style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}
              >
                {error && (
                  <Alert variant="danger" onDismiss={() => setError(null)}>
                    {error}
                  </Alert>
                )}
                <div className="form-field">
                  <label className="form-label" htmlFor="forgot-email">
                    Email
                  </label>
                  <Input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Sending code..." : "Send reset code"}
                </Button>
                <div style={{ fontSize: "var(--text-sm)", textAlign: "center" }}>
                  <Link to="/signin" style={{ color: "var(--primary)" }}>
                    Back to sign in
                  </Link>
                </div>
              </form>
            ) : (
              <form
                onSubmit={handleResetPassword}
                style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}
              >
                {error && (
                  <Alert variant="danger" onDismiss={() => setError(null)}>
                    {error}
                  </Alert>
                )}
                {successMessage && (
                  <Alert variant="success">{successMessage}</Alert>
                )}
                <div className="form-field">
                  <label className="form-label" htmlFor="reset-code">
                    Verification code
                  </label>
                  <Input
                    id="reset-code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    required
                    autoComplete="one-time-code"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label" htmlFor="reset-password">
                    New password
                  </label>
                  <Input
                    id="reset-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    autoComplete="new-password"
                  />
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Resetting..." : "Reset password"}
                </Button>
                <div style={{ fontSize: "var(--text-sm)", textAlign: "center" }}>
                  <Link to="/signin" style={{ color: "var(--primary)" }}>
                    Back to sign in
                  </Link>
                </div>
              </form>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
