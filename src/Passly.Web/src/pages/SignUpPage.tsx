import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Alert } from "../components/Alert";
import { Card, CardBody } from "../components/Card";
import { useAppDispatch, useAppSelector } from "../store";
import { signUp, clearError } from "../store/authSlice";

export function SignUpPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((s) => s.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }

    const result = await dispatch(signUp({ email, password }));
    if (signUp.fulfilled.match(result)) {
      navigate(`/confirm-signup?email=${encodeURIComponent(email)}`);
    }
  };

  const displayError = localError ?? error;

  return (
    <div className="page">
      <div className="hero" style={{ paddingBottom: 0 }}>
        <h1 className="hero__title">Create your account</h1>
        <p className="hero__subtitle">
          Get started with Passly to prepare your immigration petition.
        </p>
      </div>
      <div style={{ maxWidth: "400px", width: "100%", margin: "0 auto" }}>
        <Card>
          <CardBody>
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}
            >
              {displayError && (
                <Alert
                  variant="danger"
                  onDismiss={() => {
                    setLocalError(null);
                    dispatch(clearError());
                  }}
                >
                  {displayError}
                </Alert>
              )}
              <div className="form-field">
                <label className="form-label" htmlFor="signup-email">
                  Email
                </label>
                <Input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="signup-password">
                  Password
                </label>
                <Input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  autoComplete="new-password"
                />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="signup-confirm">
                  Confirm password
                </label>
                <Input
                  id="signup-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
              <div style={{ fontSize: "var(--text-sm)", textAlign: "center" }}>
                Already have an account?{" "}
                <Link to="/signin" style={{ color: "var(--primary)" }}>
                  Sign in
                </Link>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
