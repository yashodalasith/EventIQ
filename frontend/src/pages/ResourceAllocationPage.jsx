import { useEffect, useMemo, useState } from "react";
import GlassPanel from "../components/common/GlassPanel";
import NeonButton from "../components/common/NeonButton";
import SectionHeader from "../components/common/SectionHeader";
import { useAuth } from "../context/AuthContext";
import {
  createAllocation,
  createResource,
  getResourceSummary,
  listAllocations,
  listEvents,
  listMyEvents,
  listResources,
  releaseAllocation,
} from "../lib/api";

const statusClasses = {
  ALLOCATED: "bg-emerald-100 text-emerald-700",
  RELEASED: "bg-slate-200 text-slate-700",
  CANCELLED: "bg-rose-100 text-rose-700",
};

export default function ResourceAllocationPage() {
  const { token, user } = useAuth();
  const role = user?.role || "participant";
  const canManageAllocations = role === "admin" || role === "organizer";
  const canCreateResources = role === "admin";

  const [resources, setResources] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState({
    total_resources: 0,
    active_resources: 0,
    open_allocations: 0,
  });

  const [resourceFilters, setResourceFilters] = useState({
    resource_type: "",
    location: "",
    available_only: true,
  });
  const [allocationFilters, setAllocationFilters] = useState({
    event_id: "",
    status: "ALLOCATED",
  });

  const [resourceForm, setResourceForm] = useState({
    name: "",
    resource_type: "",
    location: "",
    description: "",
    total_quantity: "1",
  });
  const [allocationForm, setAllocationForm] = useState({
    event_id: "",
    resource_id: "",
    quantity: "1",
    starts_at: "",
    ends_at: "",
    notes: "",
  });

  const [loadingResources, setLoadingResources] = useState(true);
  const [loadingAllocations, setLoadingAllocations] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [creatingResource, setCreatingResource] = useState(false);
  const [creatingAllocation, setCreatingAllocation] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadResources = async () => {
    setLoadingResources(true);
    setError("");
    try {
      const data = await listResources(token, {
        resource_type: resourceFilters.resource_type || undefined,
        location: resourceFilters.location || undefined,
        available_only: resourceFilters.available_only ? true : undefined,
      });
      setResources(data || []);
    } catch (err) {
      setError(err.message || "Failed to load resources");
    } finally {
      setLoadingResources(false);
    }
  };

  const loadSummary = async () => {
    if (!canManageAllocations) {
      return;
    }
    setLoadingSummary(true);
    try {
      const data = await getResourceSummary(token);
      setSummary(data || summary);
    } catch (err) {
      setError(err.message || "Failed to load resource summary");
    } finally {
      setLoadingSummary(false);
    }
  };

  const loadEvents = async () => {
    if (!canManageAllocations) {
      return;
    }

    try {
      const eventRows =
        role === "admin" ? await listEvents(token) : await listMyEvents(token);
      const nextEvents = eventRows || [];
      setEvents(nextEvents);

      if (!allocationForm.event_id && nextEvents.length) {
        setAllocationForm((current) => ({
          ...current,
          event_id: nextEvents[0].id,
        }));
      }
      if (!allocationFilters.event_id && nextEvents.length) {
        setAllocationFilters((current) => ({
          ...current,
          event_id: role === "organizer" ? nextEvents[0].id : current.event_id,
        }));
      }
    } catch (err) {
      setError(err.message || "Failed to load events for allocation");
    }
  };

  const loadAllocations = async () => {
    if (!canManageAllocations) {
      return;
    }

    if (role === "organizer" && !allocationFilters.event_id) {
      setAllocations([]);
      return;
    }

    setLoadingAllocations(true);
    try {
      const data = await listAllocations(token, {
        event_id: allocationFilters.event_id || undefined,
        status: allocationFilters.status || undefined,
      });
      setAllocations(data || []);
    } catch (err) {
      setError(err.message || "Failed to load allocations");
    } finally {
      setLoadingAllocations(false);
    }
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    loadResources();
    loadSummary();
    loadEvents();
  }, [token, role]);

  useEffect(() => {
    if (!token || !canManageAllocations) {
      return;
    }
    loadAllocations();
  }, [token, canManageAllocations, role, allocationFilters.event_id, allocationFilters.status]);

  const inventoryStats = useMemo(() => {
    const total = resources.length;
    const active = resources.filter((resource) => resource.is_active).length;
    const available = resources.filter(
      (resource) => resource.available_quantity > 0,
    ).length;
    return { total, active, available };
  }, [resources]);

  const onResourceFilterChange = (name, value) => {
    setResourceFilters((current) => ({ ...current, [name]: value }));
  };

  const onCreateResource = async (event) => {
    event.preventDefault();
    setCreatingResource(true);
    setError("");
    setMessage("");

    try {
      await createResource(token, {
        ...resourceForm,
        total_quantity: Number(resourceForm.total_quantity),
      });
      setMessage("Resource added successfully");
      setResourceForm({
        name: "",
        resource_type: "",
        location: "",
        description: "",
        total_quantity: "1",
      });
      await Promise.all([loadResources(), loadSummary()]);
    } catch (err) {
      setError(err.message || "Failed to create resource");
    } finally {
      setCreatingResource(false);
    }
  };

  const onCreateAllocation = async (event) => {
    event.preventDefault();
    setCreatingAllocation(true);
    setError("");
    setMessage("");

    try {
      await createAllocation(token, {
        event_id: allocationForm.event_id,
        resource_id: Number(allocationForm.resource_id),
        quantity: Number(allocationForm.quantity),
        starts_at: new Date(allocationForm.starts_at).toISOString(),
        ends_at: new Date(allocationForm.ends_at).toISOString(),
        notes: allocationForm.notes || undefined,
      });
      setMessage("Resource allocated successfully");
      setAllocationForm((current) => ({
        ...current,
        resource_id: "",
        quantity: "1",
        starts_at: "",
        ends_at: "",
        notes: "",
      }));
      await Promise.all([loadResources(), loadAllocations(), loadSummary()]);
    } catch (err) {
      setError(err.message || "Failed to allocate resource");
    } finally {
      setCreatingAllocation(false);
    }
  };

  const onReleaseAllocation = async (allocationId) => {
    setError("");
    setMessage("");

    const reason = window.prompt("Optional reason for release:", "") || "";
    try {
      await releaseAllocation(token, allocationId, reason);
      setMessage("Allocation released successfully");
      await Promise.all([loadResources(), loadAllocations(), loadSummary()]);
    } catch (err) {
      setError(err.message || "Failed to release allocation");
    }
  };

  return (
    <section>
      <SectionHeader
        title="Resource Allocation"
        subtitle="Manage halls, equipment, and scheduling windows for events with live inventory and allocation tracking."
      />

      {error ? (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <GlassPanel className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Inventory Items
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {inventoryStats.total}
          </p>
        </GlassPanel>
        <GlassPanel className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Active Resources
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {inventoryStats.active}
          </p>
        </GlassPanel>
        <GlassPanel className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Available Now
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {inventoryStats.available}
          </p>
        </GlassPanel>
        <GlassPanel className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Open Allocations
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {loadingSummary ? "..." : summary.open_allocations}
          </p>
        </GlassPanel>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <GlassPanel className="overflow-hidden xl:col-span-7">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Inventory Directory
              </p>
              <h2 className="mt-1 font-heading text-2xl text-slate-900">
                Resource catalog
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                className="focus-field min-w-40"
                placeholder="Type (projector)"
                value={resourceFilters.resource_type}
                onChange={(event) =>
                  onResourceFilterChange("resource_type", event.target.value)
                }
              />
              <input
                className="focus-field min-w-40"
                placeholder="Location (Hall A)"
                value={resourceFilters.location}
                onChange={(event) =>
                  onResourceFilterChange("location", event.target.value)
                }
              />
              <label className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={resourceFilters.available_only}
                  onChange={(event) =>
                    onResourceFilterChange("available_only", event.target.checked)
                  }
                />
                Available only
              </label>
              <NeonButton variant="secondary" onClick={loadResources}>
                Apply
              </NeonButton>
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            {loadingResources ? (
              <div className="p-4 text-sm text-slate-500">Loading resources...</div>
            ) : null}

            {!loadingResources && !resources.length ? (
              <div className="p-4 text-sm text-slate-500">
                No resources match the current filters.
              </div>
            ) : null}

            {!loadingResources
              ? resources.map((resource) => (
                  <div
                    key={resource.id}
                    className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center"
                  >
                    <div>
                      <p className="text-base font-semibold text-slate-900">
                        {resource.name}
                      </p>
                      <p className="subtle-text mt-1">
                        {resource.resource_type} • {resource.location}
                      </p>
                      {resource.description ? (
                        <p className="mt-1 text-sm text-slate-600">
                          {resource.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="status-chip bg-slate-100 text-slate-700">
                        Total {resource.total_quantity}
                      </span>
                      <span className="status-chip bg-emerald-100 text-emerald-700">
                        Available {resource.available_quantity}
                      </span>
                      <span
                        className={`status-chip ${resource.is_active ? "bg-blue-100 text-blue-700" : "bg-rose-100 text-rose-700"}`}
                      >
                        {resource.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                ))
              : null}
          </div>
        </GlassPanel>

        <div className="grid gap-4 xl:col-span-5">
          {canCreateResources ? (
            <GlassPanel className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Admin Action
              </p>
              <h2 className="mt-2 font-heading text-2xl text-slate-900">
                Add resource
              </h2>

              <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={onCreateResource}>
                <input
                  className="focus-field sm:col-span-2"
                  placeholder="Resource name"
                  value={resourceForm.name}
                  onChange={(event) =>
                    setResourceForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  required
                />
                <input
                  className="focus-field"
                  placeholder="Type"
                  value={resourceForm.resource_type}
                  onChange={(event) =>
                    setResourceForm((current) => ({
                      ...current,
                      resource_type: event.target.value,
                    }))
                  }
                  required
                />
                <input
                  className="focus-field"
                  placeholder="Location"
                  value={resourceForm.location}
                  onChange={(event) =>
                    setResourceForm((current) => ({
                      ...current,
                      location: event.target.value,
                    }))
                  }
                  required
                />
                <input
                  className="focus-field"
                  type="number"
                  min={1}
                  placeholder="Total quantity"
                  value={resourceForm.total_quantity}
                  onChange={(event) =>
                    setResourceForm((current) => ({
                      ...current,
                      total_quantity: event.target.value,
                    }))
                  }
                  required
                />
                <textarea
                  className="focus-field min-h-24 resize-none sm:col-span-2"
                  placeholder="Description"
                  value={resourceForm.description}
                  onChange={(event) =>
                    setResourceForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
                <NeonButton
                  className="sm:col-span-2"
                  type="submit"
                  disabled={creatingResource}
                >
                  {creatingResource ? "Saving..." : "Create Resource"}
                </NeonButton>
              </form>
            </GlassPanel>
          ) : null}

          <GlassPanel className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Allocation Workflow
            </p>
            <h2 className="mt-2 font-heading text-2xl text-slate-900">
              Assign resource
            </h2>

            {!canManageAllocations ? (
              <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-700">
                Participants can browse inventory. Allocation actions are available
                to organizer and admin accounts.
              </p>
            ) : (
              <form className="mt-4 grid gap-3" onSubmit={onCreateAllocation}>
                <select
                  className="focus-field"
                  value={allocationForm.event_id}
                  onChange={(event) =>
                    setAllocationForm((current) => ({
                      ...current,
                      event_id: event.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Select event</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title}
                    </option>
                  ))}
                </select>

                <select
                  className="focus-field"
                  value={allocationForm.resource_id}
                  onChange={(event) =>
                    setAllocationForm((current) => ({
                      ...current,
                      resource_id: event.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Select resource</option>
                  {resources
                    .filter((resource) => resource.is_active)
                    .map((resource) => (
                      <option key={resource.id} value={resource.id}>
                        {resource.name} ({resource.location})
                      </option>
                    ))}
                </select>

                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    className="focus-field"
                    type="number"
                    min={1}
                    value={allocationForm.quantity}
                    onChange={(event) =>
                      setAllocationForm((current) => ({
                        ...current,
                        quantity: event.target.value,
                      }))
                    }
                    placeholder="Quantity"
                    required
                  />
                  <select
                    className="focus-field"
                    value={allocationFilters.status}
                    onChange={(event) =>
                      setAllocationFilters((current) => ({
                        ...current,
                        status: event.target.value,
                      }))
                    }
                  >
                    <option value="ALLOCATED">Allocated</option>
                    <option value="RELEASED">Released</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="">All statuses</option>
                  </select>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    className="focus-field"
                    type="datetime-local"
                    value={allocationForm.starts_at}
                    onChange={(event) =>
                      setAllocationForm((current) => ({
                        ...current,
                        starts_at: event.target.value,
                      }))
                    }
                    required
                  />
                  <input
                    className="focus-field"
                    type="datetime-local"
                    value={allocationForm.ends_at}
                    onChange={(event) =>
                      setAllocationForm((current) => ({
                        ...current,
                        ends_at: event.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <textarea
                  className="focus-field min-h-24 resize-none"
                  placeholder="Notes"
                  value={allocationForm.notes}
                  onChange={(event) =>
                    setAllocationForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />

                <div className="flex flex-wrap gap-2">
                  <NeonButton type="submit" disabled={creatingAllocation}>
                    {creatingAllocation ? "Allocating..." : "Allocate Resource"}
                  </NeonButton>
                  <NeonButton
                    variant="secondary"
                    type="button"
                    onClick={loadAllocations}
                    disabled={loadingAllocations}
                  >
                    Refresh Allocations
                  </NeonButton>
                </div>
              </form>
            )}
          </GlassPanel>
        </div>
      </div>

      <GlassPanel className="mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Allocation Ledger
            </p>
            <h2 className="mt-1 font-heading text-2xl text-slate-900">
              Resource schedule history
            </h2>
          </div>

          {canManageAllocations ? (
            <div className="flex flex-wrap gap-2">
              <select
                className="focus-field min-w-48"
                value={allocationFilters.event_id}
                onChange={(event) =>
                  setAllocationFilters((current) => ({
                    ...current,
                    event_id: event.target.value,
                  }))
                }
              >
                <option value="">{role === "organizer" ? "Select your event" : "All events"}</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        <div className="divide-y divide-slate-200">
          {loadingAllocations ? (
            <div className="p-4 text-sm text-slate-500">Loading allocations...</div>
          ) : null}

          {!loadingAllocations && !allocations.length ? (
            <div className="p-4 text-sm text-slate-500">
              {canManageAllocations
                ? "No allocations found for the selected filters."
                : "Sign in as organizer/admin to view allocation records."}
            </div>
          ) : null}

          {!loadingAllocations
            ? allocations.map((allocation) => (
                <article
                  key={allocation.id}
                  className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center"
                >
                  <div>
                    <p className="text-base font-semibold text-slate-900">
                      {allocation.resource_name} • {allocation.location}
                    </p>
                    <p className="subtle-text mt-1">
                      Event {allocation.event_id} • {allocation.quantity} units
                    </p>
                    <p className="subtle-text mt-1">
                      {new Date(allocation.starts_at).toLocaleString()} to{" "}
                      {new Date(allocation.ends_at).toLocaleString()}
                    </p>
                    {allocation.notes ? (
                      <p className="mt-1 text-sm text-slate-600">{allocation.notes}</p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`status-chip ${statusClasses[allocation.status] || "bg-slate-100 text-slate-700"}`}
                    >
                      {allocation.status}
                    </span>
                    {allocation.status === "ALLOCATED" && canManageAllocations ? (
                      <NeonButton
                        variant="secondary"
                        onClick={() => onReleaseAllocation(allocation.id)}
                      >
                        Release
                      </NeonButton>
                    ) : null}
                  </div>
                </article>
              ))
            : null}
        </div>
      </GlassPanel>
    </section>
  );
}
