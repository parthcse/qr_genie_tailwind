import Link from "next/link";
import LegalPage from "../components/LegalPage";
import { SUPPORT_EMAIL } from "../lib/site";

const sections = [
  {
    id: "agreement",
    heading: "Agreeing to these terms",
    body: (
      <p>
        These terms apply whenever you use QR-Genie (qr-genie.co). By creating an account or using the service, you agree to
        them and to our <Link href="/privacy">privacy policy</Link>. If you&apos;re using QR-Genie for a business, you agree on
        its behalf.
      </p>
    ),
  },
  {
    id: "the-service",
    heading: "The service",
    body: (
      <p>
        QR-Genie lets you create static and dynamic QR codes, change where a dynamic code points after it has been printed,
        pause codes, and see analytics for scans of your dynamic codes.
      </p>
    ),
  },
  {
    id: "your-account",
    heading: "Your account",
    body: (
      <ul>
        <li>You must be at least 18, or old enough to form a binding contract where you live.</li>
        <li>Keep your details accurate and your password private. You&apos;re responsible for activity on your account.</li>
        <li>Tell us straight away if you think someone else has accessed your account.</li>
      </ul>
    ),
  },
  {
    id: "free-trial",
    heading: "Free trial",
    body: (
      <p>
        New accounts get a 14-day free trial with up to 2 QR codes. No card is needed. When the trial ends, your QR codes are
        paused until you subscribe; subscribing switches them back on with the same links.
      </p>
    ),
  },
  {
    id: "subscription",
    heading: "Subscription and payment",
    body: (
      <>
        <p>
          The Basic Package is a monthly subscription, billed through Razorpay in Indian rupees or US dollars. The current
          price in each currency is shown on our pricing and billing pages, and the currency you choose at checkout is the
          one you&apos;re charged in. You pay when you subscribe, and the same amount is charged automatically every month on
          that date until you cancel.
        </p>
        <p>
          If a renewal payment fails, your QR codes keep working for 3 days while it&apos;s retried; after that they&apos;re paused
          until payment succeeds. If we change the price, we&apos;ll email you at least 30 days before it applies to you.
        </p>
      </>
    ),
  },
  {
    id: "delivery",
    heading: "Service delivery",
    body: (
      <p>
        QR-Genie is delivered online. Your plan is active as soon as your payment succeeds, and nothing is shipped to you.
      </p>
    ),
  },
  {
    id: "cancellation",
    heading: "Cancelling",
    body: (
      <p>
        You can cancel at any time by <Link href="/contact?topic=cancel">contacting us</Link>. Your plan stays active until
        the end of the period you&apos;ve paid for, and you won&apos;t be charged again. When it ends, your QR codes are paused.
      </p>
    ),
  },
  {
    id: "refunds",
    heading: "Refunds",
    body: (
      <p>
        Refunds are covered by our <Link href="/refund-policy">refund policy</Link>.
      </p>
    ),
  },
  {
    id: "acceptable-use",
    heading: "Acceptable use",
    body: (
      <>
        <p>Don&apos;t use QR-Genie to link to, host or promote:</p>
        <ul>
          <li>malware, phishing, scams or anything designed to deceive the people who scan your codes;</li>
          <li>illegal content, goods or services;</li>
          <li>content that infringes someone else&apos;s rights;</li>
          <li>spam.</li>
        </ul>
        <p>
          Don&apos;t try to disrupt, overload or gain unauthorised access to the service. We may pause or remove QR codes that
          break these rules, and close accounts for serious or repeated misuse.
        </p>
      </>
    ),
  },
  {
    id: "your-content",
    heading: "Your content",
    body: (
      <p>
        You own the links and content in your QR codes. You give us permission to store and process that content only as
        needed to run QR-Genie for you.
      </p>
    ),
  },
  {
    id: "availability",
    heading: "Availability",
    body: (
      <p>
        We work to keep QR-Genie running reliably, but we can&apos;t promise it will never be interrupted, for example during
        maintenance or problems with our providers.
      </p>
    ),
  },
  {
    id: "liability",
    heading: "Liability",
    body: (
      <p>
        QR-Genie is provided as it is. As far as the law allows, we aren&apos;t liable for indirect or consequential losses,
        such as lost profits, and our total liability to you is limited to the amount you paid us in the 12 months before
        the claim. Nothing in these terms limits rights you have that can&apos;t be limited by law.
      </p>
    ),
  },
  {
    id: "ending",
    heading: "Ending your account",
    body: (
      <p>
        You can stop using QR-Genie at any time and ask us to delete your account. We may suspend or close an account that
        breaks these terms, and will tell you why unless the law prevents us.
      </p>
    ),
  },
  {
    id: "changes",
    heading: "Changes to these terms",
    body: (
      <p>
        If we change these terms, we&apos;ll update the date at the top of this page and let you know about significant changes
        by email or with a notice on the site. Continuing to use QR-Genie after a change means you accept the new terms.
      </p>
    ),
  },
  {
    id: "law",
    heading: "Governing law",
    body: (
      <p>
        These terms are governed by the laws of India. Questions about them can be sent to{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      path="/terms"
      title="Terms of service"
      description="The terms that apply when you use QR-Genie, including trials, subscriptions, cancellation and acceptable use."
      intro="The rules for using QR-Genie, including the free trial, your subscription, cancelling and acceptable use."
      sections={sections}
    />
  );
}
