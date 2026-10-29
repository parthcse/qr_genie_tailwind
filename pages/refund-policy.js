import Link from "next/link";
import LegalPage from "@/components/layout/LegalPage";
import { TRIAL_DAYS } from "@/lib/billing/subscription";

const sections = [
  {
    id: "free-trial",
    heading: "Free trial",
    body: <p>The {TRIAL_DAYS}-day free trial doesn&apos;t take a payment, so there&apos;s nothing to refund.</p>,
  },
  {
    id: "free-days",
    heading: "Cancelling during your free days",
    body: (
      <p>
        If you choose a plan during your free trial, you pay when you subscribe, but your paid months only start when your
        free days end. If you cancel before then with <strong>Cancel subscription</strong> on the Billing page, we cancel
        the plan straight away and refund your payment in full automatically; you don&apos;t need to ask. Your free days carry
        on until they end.
      </p>
    ),
  },
  {
    id: "after-start",
    heading: "Cancelling after your paid months start",
    body: (
      <>
        <p>
          Cancelling stops the next renewal. Your plan stays active until the end of the period you&apos;ve paid for, and you
          won&apos;t be charged again. We don&apos;t refund the rest of a period that has already started.
        </p>
        <p>
          For example, if you cancel 2 months into a 6-month plan, you keep every feature for the remaining 4 months, and the
          plan then ends without renewing.
        </p>
      </>
    ),
  },
  {
    id: "mistakes",
    heading: "Charged by mistake",
    body: (
      <p>
        If you were charged twice, or charged for a renewal after you cancelled, we refund the extra payment in full.
      </p>
    ),
  },
  {
    id: "how-to-ask",
    heading: "How to ask for a refund",
    body: (
      <>
        <p>
          For a payment charged by mistake, send us a message using the <Link href="/contact?topic=refund">contact form</Link>{" "}
          with the topic “Refund request”. To help us find your payment quickly, include:
        </p>
        <ul>
          <li>the email address you signed up with;</li>
          <li>the payment ID from your payment confirmation or receipt, if you have it.</li>
        </ul>
      </>
    ),
  },
  {
    id: "timing",
    heading: "When you'll get your money",
    body: (
      <p>
        Refunds go back to the card, UPI account or bank account you paid with, through Razorpay. Once a refund is issued, it
        usually reaches your account within 5–7 working days, depending on your bank.
      </p>
    ),
  },
  {
    id: "after-refund",
    heading: "What happens to your QR codes",
    body: (
      <p>
        When a plan ends, your QR codes are paused rather than deleted, so if you subscribe again later they work straight
        away with the same links. After a refund during your free days, your codes keep working until the free days end. See
        our <Link href="/terms">terms of service</Link> for more about cancelling.
      </p>
    ),
  },
];

export default function RefundPolicyPage() {
  return (
    <LegalPage
      path="/refund-policy"
      title="Refund policy"
      description="When and how you can get a refund for your QR-Genie subscription."
      intro="When you can get your money back for a QR-Genie subscription, and how to ask."
      sections={sections}
    />
  );
}
