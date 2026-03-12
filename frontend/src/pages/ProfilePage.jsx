import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassPanel from "../components/common/GlassPanel";
import SectionHeader from "../components/common/SectionHeader";
import NeonButton from "../components/common/NeonButton";
import { useAuth } from "../context/AuthContext";
import {
  addAdminEmployeeId,
  listAdminEmployeeIds,
  revokeAdminEmployeeId,
} from "../lib/api";

const roleFieldMap = {
  participant: [
    ["institution", "Institution", "State University"],
    ["program", "Program", "Computer Science"],
    ["graduationYear", "Graduation Year", "2028"],
  ],
  organizer: [
    ["organization", "Organization", "EventIQ Labs"],
    ["phone", "Phone", "+91 98765 43210"],
    ["title", "Title", "Program Lead"],
  ],
  admin: [
    ["department", "Department", "Operations"],
    ["employeeId", "Employee ID", "ADM-1024"],
  ],
};

const formatDate = (value) => {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleString();
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, token, refreshProfile, updateAccount, deleteAccount } =
    useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addingEmployeeId, setAddingEmployeeId] = useState(false);
  const [loadingEmployeeIds, setLoadingEmployeeIds] = useState(false);
  const [revokingEmployeeId, setRevokingEmployeeId] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [adminAccessError, setAdminAccessError] = useState("");
  const [adminAccessSuccess, setAdminAccessSuccess] = useState("");
  const [allowedEmployeeIds, setAllowedEmployeeIds] = useState([]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "participant",
    password: "",
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
  const [deletePassword, setDeletePassword] = useState("");
  const [newEmployeeId, setNewEmployeeId] = useState("");

  const editableRoleFields = useMemo(
    () => roleFieldMap[form.role] || roleFieldMap.participant,
    [form.role],
  );

  useEffect(() => {
    if (!user) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      name: user.name || "",
      email: user.email || "",
      role: user.role || "participant",
      password: "",
      profile: {
        ...prev.profile,
        institution:
          user.role === "participant"
            ? user.profile?.institution || ""
            : prev.profile.institution,
        program:
          user.role === "participant"
            ? user.profile?.program || ""
            : prev.profile.program,
        graduationYear:
          user.role === "participant"
            ? String(user.profile?.graduationYear || "")
            : prev.profile.graduationYear,
        organization:
          user.role === "organizer"
            ? user.profile?.organization || ""
            : prev.profile.organization,
        phone:
          user.role === "organizer"
            ? user.profile?.phone || ""
            : prev.profile.phone,
        title:
          user.role === "organizer"
            ? user.profile?.title || ""
            : prev.profile.title,
        department:
          user.role === "admin"
            ? user.profile?.department || ""
            : prev.profile.department,
        employeeId:
          user.role === "admin"
            ? user.profile?.employeeId || ""
            : prev.profile.employeeId,
      },
    }));
  }, [user]);

  useEffect(() => {
    const loadAllowedEmployeeIds = async () => {
      if (user?.role !== "admin" || !token) {
        setAllowedEmployeeIds([]);
        return;
      }

      setLoadingEmployeeIds(true);
      try {
        const rows = await listAdminEmployeeIds(token);
        setAllowedEmployeeIds(rows || []);
      } catch (err) {
        setAdminAccessError(
          err?.message || "Failed to load employee allowlist",
        );
      } finally {
        setLoadingEmployeeIds(false);
      }
    };

    loadAllowedEmployeeIds();
  }, [token, user?.role]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setSuccess("");
    setError("");
    try {
      await refreshProfile();
      setSuccess("Profile refreshed");
    } catch (err) {
      setError(err?.message || "Failed to refresh profile");
    } finally {
      setRefreshing(false);
    }
  };

  const handleBasicChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        [name]: value,
      },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {};

      const currentName = user?.name || "";
      const nextName = form.name.trim();
      if (nextName && nextName !== currentName) {
        payload.name = nextName;
      }

      const currentEmail = (user?.email || "").toLowerCase();
      const nextEmail = form.email.trim().toLowerCase();
      if (nextEmail && nextEmail !== currentEmail) {
        payload.email = nextEmail;
      }

      const roleChanged = form.role !== user?.role;
      if (roleChanged) {
        payload.role = form.role;
      }

      const profile = editableRoleFields.reduce((acc, [key]) => {
        if (key === "graduationYear") {
          const parsed = Number.parseInt(String(form.profile[key] || ""), 10);
          acc[key] = Number.isFinite(parsed) ? parsed : null;
          return acc;
        }

        acc[key] = String(form.profile[key] || "").trim();
        return acc;
      }, {});

      const currentProfile = user?.profile || {};
      const profileChanged = editableRoleFields.some(([key]) => {
        const currentValue =
          key === "graduationYear"
            ? Number(currentProfile[key] || 0)
            : String(currentProfile[key] || "").trim();
        return profile[key] !== currentValue;
      });

      if (roleChanged || profileChanged) {
        payload.profile = profile;
      }

      if (form.password) {
        payload.password = form.password;
      }

      if (Object.keys(payload).length === 0) {
        setSuccess("No changes to save");
        return;
      }

      await updateAccount(payload);
      setForm((prev) => ({ ...prev, password: "" }));
      setSuccess("Profile updated successfully");
    } catch (err) {
      setError(err?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const password = deletePassword.trim();
    if (!password) {
      setDeleteError("Password is required");
      return;
    }

    setDeleting(true);
    setDeleteError("");
    setError("");
    setSuccess("");

    try {
      await deleteAccount({ password });
      navigate("/auth", { replace: true });
    } catch (err) {
      setDeleteError(err?.message || "Failed to delete account");
    } finally {
      setDeleting(false);
    }
  };

  const handleAddEmployeeId = async (event) => {
    event.preventDefault();

    const employeeId = newEmployeeId.trim().toUpperCase();
    if (!employeeId) {
      setAdminAccessError("Employee number is required");
      setAdminAccessSuccess("");
      return;
    }

    setAddingEmployeeId(true);
    setAdminAccessError("");
    setAdminAccessSuccess("");

    try {
      await addAdminEmployeeId(token, employeeId);
      setNewEmployeeId("");
      setAdminAccessSuccess("Employee number added to admin allowlist");
      const rows = await listAdminEmployeeIds(token);
      setAllowedEmployeeIds(rows || []);
    } catch (err) {
      setAdminAccessError(err?.message || "Failed to add employee number");
    } finally {
      setAddingEmployeeId(false);
    }
  };

  const handleRevokeEmployeeId = async (employeeId) => {
    setRevokingEmployeeId(employeeId);
    setAdminAccessError("");
    setAdminAccessSuccess("");

    try {
      await revokeAdminEmployeeId(token, employeeId);
      setAllowedEmployeeIds((current) =>
        current.filter((item) => item.employeeId !== employeeId),
      );
      setAdminAccessSuccess("Employee number removed from admin allowlist");
    } catch (err) {
      setAdminAccessError(err?.message || "Failed to remove employee number");
    } finally {
      setRevokingEmployeeId("");
    }
  };

  return (
    <section>
      <SectionHeader
        title="Profile"
        subtitle="Manage your account details, role profile fields, and account lifecycle controls from one place."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_1fr]">
        <GlassPanel className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-heading text-2xl text-slate-900">
              Account Details
            </h2>
            <NeonButton
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="min-w-[130px]"
            >
              {refreshing ? "Refreshing..." : "Refresh Profile"}
            </NeonButton>
          </div>

          {success ? (
            <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {success}
            </div>
          ) : null}

          {error ? (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <form
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
            onSubmit={handleSubmit}
          >
            <div>
              <label className="mb-1 block text-sm text-slate-600">Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleBasicChange}
                className="focus-field"
                required
                minLength={2}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-600">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleBasicChange}
                className="focus-field"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-600">Role</label>
              <select
                name="role"
                value={form.role}
                onChange={handleBasicChange}
                className="focus-field"
              >
                <option value="participant">Participant</option>
                <option value="organizer">Organizer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-600">
                New Password (optional)
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleBasicChange}
                className="focus-field"
                placeholder="Leave empty to keep current"
                minLength={8}
              />
            </div>

            {editableRoleFields.map(([key, label, placeholder]) => (
              <div key={key}>
                <label className="mb-1 block text-sm text-slate-600">
                  {label}
                </label>
                <input
                  name={key}
                  type={key === "graduationYear" ? "number" : "text"}
                  value={form.profile[key]}
                  onChange={handleProfileChange}
                  className="focus-field"
                  placeholder={placeholder}
                  required
                />
              </div>
            ))}

            <div className="sm:col-span-2 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <span>
                Joined {formatDate(user?.createdAt)} • Last login{" "}
                {formatDate(user?.lastLoginAt)}
              </span>
              <NeonButton
                type="submit"
                disabled={saving}
                className="min-w-[160px]"
              >
                {saving ? "Saving..." : "Save Changes"}
              </NeonButton>
            </div>
          </form>
        </GlassPanel>

        <GlassPanel className="p-5">
          <h2 className="font-heading text-2xl text-slate-900">Danger Zone</h2>
          <p className="mt-2 text-sm text-slate-500">
            Deleting your account revokes all active sessions and removes your
            identity record.
          </p>

          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <label className="mb-1 block text-sm font-medium text-red-800">
              Confirm password to delete account
            </label>
            <input
              type="password"
              value={deletePassword}
              onChange={(event) => setDeletePassword(event.target.value)}
              className="focus-field"
              placeholder="Enter your current password"
            />

            {deleteError ? (
              <div className="mt-3 rounded-md border border-red-300 bg-white px-3 py-2 text-sm text-red-700">
                {deleteError}
              </div>
            ) : null}

            <div className="mt-4">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || !deletePassword}
                className="w-full rounded-md border border-red-700 bg-red-700 px-3 py-2 font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? "Deleting account..." : "Delete My Account"}
              </button>
            </div>
          </div>
        </GlassPanel>

        {user?.role === "admin" ? (
          <GlassPanel className="p-5">
            <h2 className="font-heading text-2xl text-slate-900">
              Admin Access Control
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Add employee numbers that are allowed to register as admins.
              Duplicate entries are blocked automatically.
            </p>

            <form
              className="mt-4 flex flex-col gap-3"
              onSubmit={handleAddEmployeeId}
            >
              <div>
                <label className="mb-1 block text-sm text-slate-600">
                  New Employee ID
                </label>
                <input
                  value={newEmployeeId}
                  onChange={(event) => setNewEmployeeId(event.target.value)}
                  className="focus-field"
                  placeholder="ADM-2048"
                />
              </div>

              {adminAccessSuccess ? (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {adminAccessSuccess}
                </div>
              ) : null}

              {adminAccessError ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {adminAccessError}
                </div>
              ) : null}

              <div className="flex justify-end">
                <NeonButton type="submit" disabled={addingEmployeeId}>
                  {addingEmployeeId ? "Adding..." : "Add Employee ID"}
                </NeonButton>
              </div>
            </form>

            <div className="mt-5 border-t border-slate-200 pt-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Allowed Employee IDs
                </h3>
                <NeonButton
                  type="button"
                  variant="secondary"
                  onClick={async () => {
                    setLoadingEmployeeIds(true);
                    setAdminAccessError("");
                    try {
                      const rows = await listAdminEmployeeIds(token);
                      setAllowedEmployeeIds(rows || []);
                    } catch (err) {
                      setAdminAccessError(
                        err?.message || "Failed to load employee allowlist",
                      );
                    } finally {
                      setLoadingEmployeeIds(false);
                    }
                  }}
                  disabled={loadingEmployeeIds}
                >
                  {loadingEmployeeIds ? "Refreshing..." : "Refresh List"}
                </NeonButton>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-slate-600">
                    <tr>
                      <th className="px-3 py-2 font-medium">Employee ID</th>
                      <th className="px-3 py-2 font-medium">Source</th>
                      <th className="px-3 py-2 font-medium">Assigned</th>
                      <th className="px-3 py-2 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
                    {loadingEmployeeIds ? (
                      <tr>
                        <td className="px-3 py-3" colSpan={4}>
                          Loading employee allowlist...
                        </td>
                      </tr>
                    ) : !allowedEmployeeIds.length ? (
                      <tr>
                        <td className="px-3 py-3" colSpan={4}>
                          No employee IDs in the allowlist.
                        </td>
                      </tr>
                    ) : (
                      allowedEmployeeIds.map((item) => {
                        const isPredefined = item.source === "predefined";
                        const isAssigned = Boolean(item.assignedAdmin);
                        const revokeDisabled =
                          isPredefined ||
                          isAssigned ||
                          revokingEmployeeId === item.employeeId;

                        return (
                          <tr key={item.employeeId}>
                            <td className="px-3 py-3 font-medium text-slate-900">
                              {item.employeeId}
                            </td>
                            <td className="px-3 py-3 capitalize">
                              {item.source}
                            </td>
                            <td className="px-3 py-3">
                              {item.assignedAdmin
                                ? `${item.assignedAdmin.name} (${item.assignedAdmin.email})`
                                : "Not assigned"}
                            </td>
                            <td className="px-3 py-3">
                              <NeonButton
                                type="button"
                                variant="secondary"
                                onClick={() =>
                                  handleRevokeEmployeeId(item.employeeId)
                                }
                                disabled={revokeDisabled}
                              >
                                {revokingEmployeeId === item.employeeId
                                  ? "Removing..."
                                  : isPredefined
                                    ? "Managed In Env"
                                    : isAssigned
                                      ? "Assigned"
                                      : "Remove"}
                              </NeonButton>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </GlassPanel>
        ) : null}
      </div>

      <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        Role changes require complete role-specific profile fields. When role
        changes, active sessions are rotated for token claim safety.
      </div>
    </section>
  );
}
