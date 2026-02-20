import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Alert } from "../components/Alert";
import { Card, CardBody } from "../components/Card";
import { useAppDispatch, useAppSelector } from "../store";
import { signIn, clearError } from "../store/authSlice";

export function SignInPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((s) => s.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await dispatch(signIn({ email, password }));
    if (signIn.fulfilled.match(result)) {
      navigate("/");
    }
  };

  return (
    <div className="page">
      <div className="hero" style={{ paddingBottom: 0 }}>
        <h1 className="hero__title">Sign in to Passly</h1>
        <p className="hero__subtitle">
          Access your immigration petition workspace.
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
                <label className="form-label" htmlFor="signin-email">
                  Email
                </label>
                <Input
                  id="signin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="signin-password">
                  Password
                </label>
                <Input
                  id="signin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "var(--text-sm)",
                }}
              >
                <Link to="/signup" style={{ color: "var(--primary)" }}>
                  Create an account
                </Link>
                <Link to="/forgot-password" style={{ color: "var(--primary)" }}>
                  Forgot password?
                </Link>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
