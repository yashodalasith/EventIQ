import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassPanel from "../components/common/GlassPanel";
import NeonButton from "../components/common/NeonButton";
import SectionHeader from "../components/common/SectionHeader";
import { useAuth } from "../context/AuthContext";

const roleOptions = [
  {
    value: "participant",
    label: "Participant",
    description: "Register for events and manage your attendance details.",
    accent: "bg-emerald-100 text-emerald-700",
  },
  {
    value: "organizer",
    label: "Organizer",
    description: "Create events, publish schedules, and run communications.",
    accent: "bg-blue-100 text-blue-700",
  },
  {
    value: "admin",
    label: "Admin",
    description:
      "Oversee platform operations and coordinate service workflows.",
    accent: "bg-violet-100 text-violet-700",
  },
];

const profileFieldsByRole = {
  participant: [
    {
      name: "institution",
      label: "Institution",
      placeholder: "State University",
    },
    { name: "program", label: "Program", placeholder: "Computer Science" },
    {
      name: "graduationYear",
      label: "Graduation Year",
      placeholder: "2027",
      type: "number",
    },
  ],
  organizer: [
    {
      name: "organization",
      label: "Organization",
      placeholder: "EventIQ Labs",
    },
    { name: "phone", label: "Phone", placeholder: "+91 98765 43210" },
    { name: "title", label: "Title", placeholder: "Program Lead" },
  ],
  admin: [
    { name: "department", label: "Department", placeholder: "Operations" },
    { name: "employeeId", label: "Employee ID", placeholder: "ADM-1024" },
  ],
};

export default function AuthPage() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "participant",
    profile: {
      institution: "",
      program: "",
      graduationYear: "",
      organization: "",
      phone: "",
      title: "",
      department: "",
      employeeId: "",
    },
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [errorItems, setErrorItems] = useState([]);
  const [invalidFields, setInvalidFields] = useState([]);

  const selectedRole = useMemo(
    () => roleOptions.find((option) => option.value === form.role),
    [form.role],
  );

  const activeProfileFields = profileFieldsByRole[form.role] || [];

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setInvalidFields((prev) => prev.filter((item) => item !== name));
  };

  const onProfileChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        [name]: value,
      },
    }));
    setInvalidFields((prev) => prev.filter((item) => item !== name));
  };

  const fieldClassName = (name) =>
    `focus-field ${invalidFields.includes(name) ? "!border-red-400 !bg-red-50 focus:!border-red-500 focus:!ring-red-200" : ""}`;

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setErrorItems([]);
    setInvalidFields([]);

    try {
      if (mode === "login") {
        await signIn({ email: form.email, password: form.password });
      } else {
        if (form.password !== form.confirmPassword) {
          throw new Error("Passwords do not match");
        }

        const profile = activeProfileFields.reduce((result, field) => {
          result[field.name] =
            field.type === "number"
              ? Number(form.profile[field.name])
              : form.profile[field.name];
          return result;
        }, {});

        await signUp({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          profile,
        });
      }
      navigate("/dashboard");
    } catch (err) {
      const items = Array.isArray(err?.validationErrors)
        ? err.validationErrors
        : [];
      const fields = Array.from(
        new Set(
          items.map((item) => item.split(":")[0]?.trim()).filter(Boolean),
        ),
      );
      setInvalidFields(fields);
      setErrorItems(items);
      setError(err?.message || "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <GlassPanel className="w-full max-w-6xl overflow-hidden shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_1fr]">
          <div className="border-b border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] p-6 xl:border-b-0 xl:border-r xl:p-10">
            <SectionHeader
              title="Identity For Every Role"
              subtitle="Sign in to create events, manage registrations, coordinate resources, and keep every participant informed from one platform."
            />
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border border-blue-100 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                  What You Can Do
                </p>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    Organizers can create events, publish schedules, and monitor
                    registrations in one place
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    Participants can discover events, register quickly, and keep
                    track of their upcoming sessions
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    Admins can oversee platform activity and coordinate event,
                    resource, and notification workflows
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
                  Platform Highlights
                </p>
                <div className="mt-4 space-y-3">
                  {roleOptions.map((option) => (
                    <div
                      key={option.value}
                      className="rounded-xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold">{option.label}</p>
                        <span className={`status-chip ${option.accent}`}>
                          {option.label}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-300">
                        {option.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div
            className={`p-6 xl:p-10 ${mode === "login" ? "flex items-center" : ""}`}
          >
            <div className="w-full">
              <div className="mb-6 flex justify-center">
                <div className="flex h-14 w-full max-w-sm items-center justify-center gap-2 rounded-xl bg-slate-100 p-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setError("");
                      setErrorItems([]);
                      setInvalidFields([]);
                    }}
                    className={`flex h-full w-36 items-center justify-center rounded-lg px-3 text-center text-sm font-semibold ${mode === "login" ? "bg-white shadow-sm" : "text-slate-500"}`}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("register");
                      setError("");
                      setErrorItems([]);
                      setInvalidFields([]);
                    }}
                    className={`flex h-full w-36 items-center justify-center rounded-lg px-3 text-center text-sm font-semibold ${mode === "register" ? "bg-white shadow-sm" : "text-slate-500"}`}
                  >
                    Register
                  </button>
                </div>
              </div>

              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                    {mode === "login" ? "Session Access" : "Role-based Signup"}
                  </p>
                  <h2 className="mt-2 font-heading text-3xl text-slate-900">
                    {mode === "login" ? "Welcome back" : "Create your account"}
                  </h2>
                </div>
                {mode === "register" ? (
                  <span
                    className={`status-chip ${selectedRole?.accent || "bg-slate-100 text-slate-700"}`}
                  >
                    {selectedRole?.label}
                  </span>
                ) : null}
              </div>

              <form className="space-y-4" onSubmit={onSubmit}>
                {mode === "register" ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-sm text-slate-600">
                        Name
                      </label>
                      <input
                        name="name"
                        value={form.name}
                        onChange={onChange}
                        type="text"
                        className={fieldClassName("name")}
                        placeholder="Alex Johnson"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1 block text-sm text-slate-600">
                        Email
                      </label>
                      <input
                        name="email"
                        value={form.email}
                        onChange={onChange}
                        type="email"
                        className={fieldClassName("email")}
                        placeholder="alex@eventiq.com"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1 block text-sm text-slate-600">
                        Role
                      </label>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {roleOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                              setForm((current) => ({
                                ...current,
                                role: option.value,
                              }))
                            }
                            className={`rounded-2xl border p-4 text-left transition ${form.role === option.value ? "border-blue-600 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"}`}
                          >
                            <span className={`status-chip ${option.accent}`}>
                              {option.label}
                            </span>
                            <p className="mt-3 text-sm text-slate-600">
                              {option.description}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {activeProfileFields.map((field) => (
                      <div key={field.name}>
                        <label className="mb-1 block text-sm text-slate-600">
                          {field.label}
                        </label>
                        <input
                          name={field.name}
                          value={form.profile[field.name]}
                          onChange={onProfileChange}
                          type={field.type || "text"}
                          className={fieldClassName(field.name)}
                          placeholder={field.placeholder}
                          required
                        />
                      </div>
                    ))}

                    <div>
                      <label className="mb-1 block text-sm text-slate-600">
                        Password
                      </label>
                      <input
                        name="password"
                        value={form.password}
                        onChange={onChange}
                        type="password"
                        className={fieldClassName("password")}
                        placeholder="minimum 8 characters"
                        required
                        minLength={8}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm text-slate-600">
                        Confirm Password
                      </label>
                      <input
                        name="confirmPassword"
                        value={form.confirmPassword}
                        onChange={onChange}
                        type="password"
                        className={fieldClassName("confirmPassword")}
                        placeholder="re-enter password"
                        required
                      />
                    </div>
                  </div>
                ) : null}

                {mode === "login" ? (
                  <div>
                    <label className="mb-1 block text-sm text-slate-600">
                      Email
                    </label>
                    <input
                      name="email"
                      value={form.email}
                      onChange={onChange}
                      type="email"
                      className={fieldClassName("email")}
                      placeholder="alex@eventiq.com"
                      required
                    />
                  </div>
                ) : null}

                {mode === "login" ? (
                  <div>
                    <label className="mb-1 block text-sm text-slate-600">
                      Password
                    </label>
                    <input
                      name="password"
                      value={form.password}
                      onChange={onChange}
                      type="password"
                      className={fieldClassName("password")}
                      placeholder="minimum 8 characters"
                      required
                      minLength={8}
                    />
                  </div>
                ) : null}

                {error ? (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    <p>{error}</p>
                    {errorItems.length > 0 &&
                    !(errorItems.length === 1 && errorItems[0] === error) ? (
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        {errorItems.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
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

                <p className="text-center text-sm text-slate-500">
                  {mode === "login"
                    ? "Sign in to continue managing your events, registrations, and notifications."
                    : "Choose the role that matches how you will use EventIQ, and we will collect the right onboarding details."}
                </p>
              </form>
            </div>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
