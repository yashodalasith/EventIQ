import GlassPanel from "../components/common/GlassPanel";
import NeonButton from "../components/common/NeonButton";
import SectionHeader from "../components/common/SectionHeader";

export default function AuthPage() {
  return (
    <div className="grid-lines flex min-h-screen items-center justify-center px-4 py-6">
      <GlassPanel className="w-full max-w-6xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="border-b border-base-line/60 bg-base-bg/40 p-6 lg:border-b-0 lg:border-r lg:p-8">
            <SectionHeader
              title="Identity Gateway"
              subtitle="Secure sign in and onboarding for organizers and participants"
            />
            <div className="space-y-3 text-sm text-base-text/80">
              <div className="rounded-xl border border-base-line bg-base-bg/55 p-3">
                JWT-secured session management
              </div>
              <div className="rounded-xl border border-base-line bg-base-bg/55 p-3">
                Role-based access for admin, organizer, participant
              </div>
              <div className="rounded-xl border border-base-line bg-base-bg/55 p-3">
                Unified access across all EventIQ microservices
              </div>
            </div>
          </div>

          <div className="p-6 lg:p-8">
            <p className="font-heading text-lg text-accent-cyan">Sign In</p>
            <form className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm text-base-text/80">
                  Email
                </label>
                <input
                  type="email"
                  className="focus-field"
                  placeholder="pilot@eventiq.io"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-base-text/80">
                  Password
                </label>
                <input
                  type="password"
                  className="focus-field"
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
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
