import Link from "next/link";
import LegalPage from "../components/LegalPage";

const sections = [
  {
    id: "free-trial",
    heading: "Free trial",
    body: <p>The 14-day free trial doesn&apos;t take a payment, so there&apos;s nothing to refund.</p>,
  },
  {
    id: "unused-days",
    heading: "Cancelling partway through a month",
    body: (
      <>
        <p>
          If you cancel partway through a billing month, we&apos;ll refund the days you haven&apos;t used when you ask for it.
        </p>
        <p>
          For example, if you cancel 10 days into a 30-day month, we refund the remaining 20 days: about two-thirds of that
          month&apos;s payment.
        </p>
      </>
    ),
  },
  {
    id: "mistakes",
    heading: "Charged by mistake",
    body: (
      <p>
        If you were charged twice, or charged after you cancelled, we refund the extra payment in full.
      </p>
    ),
  },
  {
    id: "how-to-ask",
    heading: "How to ask for a refund",
    body: (
      <>
        <p>
          Send us a message using the <Link href="/contact?topic=refund">contact form</Link> with the topic “Refund request”. To
          help us find your payment quickly, include:
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
        Refunds go back to the card you paid with, through Razorpay. Once we&apos;ve approved a refund, it usually reaches your
        account within 5–7 working days, depending on your bank.
      </p>
    ),
  },
  {
    id: "after-refund",
    heading: "What happens to your QR codes",
    body: (
      <p>
        A refund ends your subscription. Your QR codes are paused rather than deleted, so if you subscribe again later they
        work straight away with the same links. See our <Link href="/terms">terms of service</Link> for more about
        cancelling.
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
