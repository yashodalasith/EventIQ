import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassPanel from "../components/common/GlassPanel";
import NeonButton from "../components/common/NeonButton";
import SectionHeader from "../components/common/SectionHeader";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "participant",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const onChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      if (mode === "login") {
        await signIn({ email: form.email, password: form.password });
      } else {
        await signUp({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
        });
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <GlassPanel className="w-full max-w-5xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
          <div className="border-b border-slate-200 bg-slate-50 p-6 lg:border-b-0 lg:border-r lg:p-8">
            <SectionHeader
              title="Welcome To EventIQ"
              subtitle="A professional command center for event operations, registrations, and cross-service workflows."
            />
            <div className="space-y-3 text-sm text-slate-600">
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                Secure login with JWT and role-based access control
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                Organizer workflows for event creation and publication
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                Live integration with event-service APIs through gateway
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                Built for 2-developer, fast delivery project model
              </div>
            </div>
          </div>

          <div className="p-6 lg:p-8">
            <div className="mb-5 flex items-center gap-2 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold ${mode === "login" ? "bg-white shadow-sm" : "text-slate-500"}`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold ${mode === "register" ? "bg-white shadow-sm" : "text-slate-500"}`}
              >
                Register
              </button>
            </div>

            <form className="space-y-4" onSubmit={onSubmit}>
              {mode === "register" ? (
                <div>
                  <label className="mb-1 block text-sm text-slate-600">
                    Name
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    type="text"
                    className="focus-field"
                    placeholder="Alex Johnson"
                    required
                  />
                </div>
              ) : null}

              <div>
                <label className="mb-1 block text-sm text-slate-600">
                  Email
                </label>
                <input
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  type="email"
                  className="focus-field"
                  placeholder="alex@eventiq.com"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-600">
                  Password
                </label>
                <input
                  name="password"
                  value={form.password}
                  onChange={onChange}
                  type="password"
                  className="focus-field"
                  placeholder="minimum 8 characters"
                  required
                  minLength={8}
                />
              </div>

              {mode === "register" ? (
                <div>
                  <label className="mb-1 block text-sm text-slate-600">
                    Role
                  </label>
                  <select
                    name="role"
                    value={form.role}
                    onChange={onChange}
                    className="focus-field"
                  >
                    <option value="participant">Participant</option>
                    <option value="organizer">Organizer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              ) : null}

              {error ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <NeonButton
                type="submit"
                className="w-full"
                disabled={submitting}
              >
                {submitting
                  ? "Please wait..."
                  : mode === "login"
                    ? "Sign In"
                    : "Create Account"}
              </NeonButton>
            </form>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
