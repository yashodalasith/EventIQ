import GlassPanel from "../components/common/GlassPanel";
import SectionHeader from "../components/common/SectionHeader";

export default function RegistrationsPage() {
  return (
    <section>
      <SectionHeader title="My Registrations" subtitle="Track enrolled events and attendance states" />
      <GlassPanel className="p-5">
        <p className="text-sm text-base-text/75">
          Registration cards and QR attendance flows will be integrated in the next iteration.
        </p>
      </GlassPanel>
    </section>
  );
}
