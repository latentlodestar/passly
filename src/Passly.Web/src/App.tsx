import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import { ThemeToggle } from "./components/ThemeToggle";
import { StatusFooter } from "./components/StatusFooter";
import { cn } from "./lib/cn";
import {StatusPage} from "./pages/StatusPage.tsx";

const navItems = [
  { to: "/home", label: "Home" },
  { to: "/admin", label: "Admin" },
] as const;

export default function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar__brand">Passly</div>
        <nav className="topbar__nav">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn("topbar__link", isActive && "topbar__link--active")
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <ThemeToggle />
      </header>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/status" replace />} />
          <Route path="/status" element={<StatusPage />} />
        </Routes>
      </main>
      <StatusFooter />
    </div>
  );
}
