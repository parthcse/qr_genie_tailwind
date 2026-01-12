import DashboardLayout from "../../components/DashboardLayout";

export default function BillingPage() {
  return (
    <DashboardLayout
      title="Billing"
      description="View your plan, payment method and invoices."
    >
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 text-[11px]">
        <p className="mb-2 text-[11px] font-medium text-slate-800">
          Subscription
        </p>
        <p className="text-slate-600">
          You&apos;re currently on the <span className="font-medium">Free</span>{" "}
          plan. We&apos;ll integrate the $10/month Pro plan here using Stripe –
          with upgrade, cancel and invoice download options like in your
          reference screenshots.
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-[11px]">
        <p className="mb-2 text-[11px] font-medium text-slate-800">
          Billing history
        </p>
        <p className="text-slate-600">
          Once Stripe is connected, this section will show your payment history
          and invoice download buttons.
        </p>
      </div>
    </DashboardLayout>
  );
}
