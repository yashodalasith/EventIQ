import GlassPanel from "../components/common/GlassPanel";
import NeonButton from "../components/common/NeonButton";
import SectionHeader from "../components/common/SectionHeader";

export default function AuthPage() {
  return (
    <div className="grid-lines flex min-h-screen items-center justify-center px-4 py-6">
      <GlassPanel className="w-full max-w-xl p-6 sm:p-8">
        <SectionHeader
          title="Identity Gateway"
          subtitle="Secure sign in and onboarding for organizers and participants"
        />

        <form className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-base-text/80">Email</label>
            <input
              type="email"
              className="w-full rounded-xl border border-base-line bg-base-bg/70 px-3 py-2 text-base-text outline-none ring-accent-cyan/50 focus:ring"
              placeholder="pilot@eventiq.io"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-base-text/80">Password</label>
            <input
              type="password"
              className="w-full rounded-xl border border-base-line bg-base-bg/70 px-3 py-2 text-base-text outline-none ring-accent-cyan/50 focus:ring"
              placeholder="••••••••"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <NeonButton className="w-full">Login</NeonButton>
            <NeonButton className="w-full border-accent-amber/70 bg-accent-amber/15 text-accent-amber">
              Register
            </NeonButton>
          </div>
        </form>
      </GlassPanel>
    </div>
  );
}
