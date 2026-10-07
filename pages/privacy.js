import Link from "next/link";
import LegalPage from "@/components/layout/LegalPage";
import { SUPPORT_EMAIL } from "@/lib/site";

const sections = [
  {
    id: "who-we-are",
    heading: "Who we are",
    body: (
      <p>
        QR-Genie (qr-genie.co) is an online service for creating and managing QR codes. This policy explains what
        information we collect, why we collect it, and the choices you have. For any privacy question, email{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> or use our <Link href="/contact?topic=privacy">contact form</Link>.
      </p>
    ),
  },
  {
    id: "information-you-give-us",
    heading: "Information you give us",
    body: (
      <ul>
        <li><strong>Account details:</strong> your name, email address and password. Passwords are stored only as a secure hash, never in readable form.</li>
        <li><strong>Profile and billing details you choose to add:</strong> phone number, company, address and tax ID.</li>
        <li><strong>The content of your QR codes:</strong> destination links and anything else you enter, such as Wi-Fi network details, a WhatsApp number and message, an Instagram username or a logo image.</li>
        <li><strong>Messages you send us</strong> through the contact form or by email.</li>
      </ul>
    ),
  },
  {
    id: "scan-data",
    heading: "Information collected when a QR code is scanned",
    body: (
      <>
        <p>When someone scans one of your dynamic QR codes, we record:</p>
        <ul>
          <li>the time of the scan;</li>
          <li>the device type, operating system and browser, read from the browser&apos;s standard user agent;</li>
          <li>the referring page, if the browser sends one;</li>
          <li>an approximate location (country, region and city), looked up from the IP address on our own server.</li>
        </ul>
        <p>
          We don&apos;t store the scanner&apos;s IP address. We keep only a one-way hashed version, which lets us count unique
          scans without being able to recover the address. Static QR codes point straight to their destination, so their
          scans never reach us.
        </p>
      </>
    ),
  },
  {
    id: "payments",
    heading: "Payments",
    body: (
      <p>
        Payments are processed by Razorpay. Your card details go directly to Razorpay and never reach our servers. We keep
        only the references Razorpay gives us (customer, subscription and payment IDs) so we can manage your plan.
        Razorpay&apos;s own <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer">privacy policy</a> applies
        to the information they process.
      </p>
    ),
  },
  {
    id: "cookies",
    heading: "Cookies",
    body: (
      <p>
        We use one essential cookie to keep you signed in. It lasts up to 7 days and can&apos;t be read by scripts on the
        page. We don&apos;t use advertising or analytics cookies. When you open checkout, Razorpay&apos;s payment window may set
        its own cookies to process your payment.
      </p>
    ),
  },
  {
    id: "how-we-use-it",
    heading: "How we use your information",
    body: (
      <>
        <ul>
          <li>to run the service: create your QR codes, send scans to the right destination and show your analytics;</li>
          <li>to manage your free trial, subscription and payments;</li>
          <li>to send service emails, such as password resets and replies to your messages;</li>
          <li>to keep QR-Genie secure and prevent abuse, such as spam or malicious links;</li>
          <li>to meet our legal and accounting obligations.</li>
        </ul>
        <p>We don&apos;t sell your personal information, and we don&apos;t use it for advertising.</p>
      </>
    ),
  },
  {
    id: "service-providers",
    heading: "Service providers",
    body: (
      <>
        <p>We share information only with the providers we need to run QR-Genie, and only for that purpose:</p>
        <ul>
          <li><strong>Razorpay</strong>, to take payments;</li>
          <li><strong>Amazon Web Services</strong>, which hosts our servers and database and sends our emails;</li>
          <li><strong>Cloudflare Turnstile</strong>, to check that contact-form messages come from people rather than bots.</li>
        </ul>
        <p>We may also disclose information if the law requires it.</p>
      </>
    ),
  },
  {
    id: "retention",
    heading: "How long we keep it",
    body: (
      <>
        <p>
          We keep your account details, QR codes and scan history while your account is open. When you delete a QR code, it
          stops working and disappears from your dashboard; its scan history stays with your account so your analytics
          remain accurate.
        </p>
        <p>
          If you ask us to close your account, we delete your personal information, except records we must keep by law, such
          as payment and invoice records.
        </p>
      </>
    ),
  },
  {
    id: "your-rights",
    heading: "Your choices and rights",
    body: (
      <p>
        You can update most of your details yourself under My Account. To get a copy of your information, correct something
        you can&apos;t change yourself, or delete your account, <Link href="/contact?topic=privacy">contact us</Link>. We&apos;ll
        respond within 30 days.
      </p>
    ),
  },
  {
    id: "security",
    heading: "Security",
    body: (
      <p>
        We use encrypted connections (HTTPS), store passwords only as secure hashes, and limit access to our systems. No
        online service can be perfectly secure, but we work to protect your information and will tell you promptly if a
        breach affects you.
      </p>
    ),
  },
  {
    id: "children",
    heading: "Children",
    body: <p>QR-Genie is a tool for businesses and isn&apos;t intended for anyone under 16.</p>,
  },
  {
    id: "changes",
    heading: "Changes to this policy",
    body: (
      <p>
        If we change this policy, we&apos;ll update the date at the top of this page. For significant changes, we&apos;ll also
        let you know by email or with a notice on the site.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      path="/privacy"
      title="Privacy policy"
      description="What information QR-Genie collects, why, and the choices you have."
      intro="What information QR-Genie collects, why we collect it, and the choices you have."
      sections={sections}
    />
  );
}
