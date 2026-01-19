import DashboardLayout from "../../components/DashboardLayout";

export default function AccountPage() {
  return (
    <DashboardLayout
      title="My Account"
      description="Manage your personal details, password and billing information."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-[11px]">
          <p className="mb-2 text-[11px] font-medium text-slate-800">
            Personal information rer
          </p>
          {/* TODO: wire to real user info */}
          <p className="text-slate-600">
            In the  few next step we&apos;ll pull your profile data from the API and
            allow updating name, email, etc.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-[11px]">
          <p className="mb-2 text-[11px] font-medium text-slate-800">
            Password & security
          </p>
          <p className="text-slate-600">
            You&apos;ll be able to change your password and manage account
            security here.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
