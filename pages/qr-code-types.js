import Link from "next/link";
import { FaArrowRight, FaChartLine, FaQrcode, FaSyncAlt, FaThLarge } from "react-icons/fa";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import SeoMeta from "@/components/layout/SeoMeta";
import PageBanner from "@/components/landing/PageBanner";
import { container, sectionSpacing, SectionHeading, FaqList } from "@/components/landing/LandingUi";
import { TYPE_PAGES } from "@/components/landing/landingPages";
import { qrTypeVisual } from "@/components/qr/qrTypeVisuals";
import { QR_TYPES, QR_TYPE_CATEGORIES } from "@/lib/qr/qrTypes";
import { TRIAL_DAYS } from "@/lib/billing/subscription";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { organizationSchema, breadcrumbSchema, faqPageSchema } from "@/lib/seo";

const PATH = "/qr-code-types";

// What each type is good for, in a sentence, and where people use it (the type list itself is lib/qr/qrTypes.js)
const BLURBS = {
  website: { text: "Opens any web page: your menu, shop, booking page or a PDF you host. Change the link after printing.", best: "Menus, flyers, packaging" },
  links: { text: "A mobile page we host, with your photo and a button for each of your links.", best: "Counters, business cards, creators" },
  wifi: { text: "Guests join your network straight from the camera, with no password to type.", best: "Cafés, hotels, offices" },
  whatsapp: { text: "Opens a WhatsApp chat with you, with an optional message ready to send.", best: "Orders, bookings, support" },
  instagram: { text: "Opens your Instagram profile, in the app when it's installed.", best: "Shops, restaurants, creators" },
  social: { text: "One page with all your social profiles, each with its own branded button.", best: "Brands, venues, influencers" },
  facebook: { text: "Opens your Facebook page, in the Facebook app when it's installed.", best: "Local businesses, events" },
  email: { text: "Opens a new email to you, with the subject and message already filled in.", best: "Bookings, enquiries, feedback" },
  sms: { text: "Opens a new text message to you, with your message ready to send.", best: "Offers, sign-ups, support" },
  phone: { text: "Offers to call your number straight from the camera.", best: "Shop windows, vans, flyers" },
  location: { text: "Opens your address or place in Google Maps, ready for directions.", best: "Events, shops, rentals" },
  business: { text: "Your business on one page: call, email, website, directions, opening hours and a Save contact button.", best: "Shops, salons, clinics, offices" },
  vcard: { text: "A digital business card: your photo, job and contact details, saved to the phone in one tap.", best: "Business cards, name badges, email signatures" },
  coupon: { text: "A discount with a code to copy in one tap, an end date, your terms and a button to use it.", best: "Shop windows, receipts, flyers" },
  menu: { text: "Your menu as a fast mobile page, with sections, dishes, prices and notes. Change it any time.", best: "Restaurants, cafés, bars, food trucks" },
  apps: { text: "Sends iPhone users to the App Store and Android users to Google Play, from one code.", best: "Packaging, posters, in-store displays" },
  video: { text: "Plays your YouTube or Vimeo video on a clean mobile page, with a button to learn more.", best: "Product demos, tours, events" },
  images: { text: "A photo gallery people can swipe through." },
  mp3: { text: "An audio player for a song, podcast or message." },
};

const KIND_LABELS = { redirect: "Dynamic", page: "Dynamic · hosted page", static: "Static" };

const released = QR_TYPES.filter((type) => type.released);
const upcoming = QR_TYPES.filter((type) => !type.released);

const faqs = [
  {
    question: "Which QR code type should I choose?",
    answer:
      "Pick the type that matches what people should do after scanning: open a page (Website), choose from several links (List of links), join your Wi-Fi, message you (WhatsApp) or follow you (Instagram, Facebook or Social media). If you're not sure, a Website or List of links code covers most needs.",
  },
  {
    question: "Which QR code types can I change after printing?",
    answer:
      "Every dynamic type: change where it points or edit its page from your dashboard, and every scan is counted. Wi-Fi, Email, SMS and Phone call codes are static: their details are printed into the code, so a change needs a new code.",
  },
  {
    question: "Are all QR code types included in every plan?",
    answer: `Yes. The ${TRIAL_DAYS}-day free trial and every paid plan include every type, with your own colours, logo and frame.`,
  },
  {
    question: "Can I change a code's type later?",
    answer: "No, the type is set when you create the code. You can create a code of another type at any time; the paid plans include unlimited codes.",
  },
  {
    question: "Do these QR codes work on every phone?",
    answer: "Yes. iPhone and Android cameras read QR codes without an extra app, and every page we host is made for small screens.",
  },
];

// The banner picture: the type icons as a calm tiled mosaic (decorative)
function TypeMosaic() {
  const tiles = QR_TYPES.slice(0, 9);
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="absolute h-72 w-72 rounded-full bg-indigo-300/25 blur-3xl" />
      <div className="relative grid grid-cols-3 gap-3 rounded-[2rem] bg-white/70 p-5 shadow-2xl shadow-indigo-900/10 ring-1 ring-slate-900/5 backdrop-blur">
        {tiles.map((type) => {
          const visual = qrTypeVisual(type.id);
          const Icon = visual.icon;
          return (
            <span key={type.id} className={`flex h-16 w-16 items-center justify-center rounded-2xl ring-1 ring-inset ring-black/5 ${visual.accent} ${type.released ? "" : "opacity-50"}`}>
              <Icon className="h-6 w-6" />
            </span>
          );
        })}
      </div>
    </div>
  );
}

function TypeCard({ type, createHref }) {
  const visual = qrTypeVisual(type.id);
  const Icon = visual.icon;
  const blurb = BLURBS[type.id] || { text: type.description };
  const page = TYPE_PAGES[type.id];
  return (
    <li className="group flex flex-col rounded-3xl bg-white p-6 ring-1 ring-slate-200 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-900/5 hover:ring-indigo-200 motion-reduce:transform-none">
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-12 w-12 flex-none items-center justify-center rounded-2xl ring-1 ring-inset ring-black/5 ${visual.accent}`}>
          <Icon className="h-5 w-5" />
        </span>
        <span className="flex flex-wrap justify-end gap-1.5">
          {type.isNew && (
            <span className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">New</span>
          )}
          <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200">{KIND_LABELS[type.kind]}</span>
        </span>
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold text-slate-900">{type.label}</h3>
      <p className="mt-1.5 flex-1 text-[15px] leading-relaxed text-slate-600">{blurb.text}</p>
      {blurb.best && (
        <p className="mt-3 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">Great for:</span> {blurb.best}
        </p>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link
          href={createHref(type.id)}
          className="btn-shine inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold !text-white shadow-md shadow-indigo-600/20 transition hover:from-indigo-700 hover:to-purple-700"
        >
          Create
          <FaArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" />
        </Link>
        {page && (
          <Link href={page.path} className="text-sm font-semibold !text-indigo-700 transition-colors hover:!text-purple-700">
            Learn more
          </Link>
        )}
      </div>
    </li>
  );
}

/** /qr-code-types: every QR code type, grouped, with what it's for and a button to create one (lib/qr/qrTypes.js) */
export default function QrCodeTypesPage() {
  const { loading, user } = useCurrentUser();
  const createHref = (id) => (user ? `/dashboard/create-qr?type=${id}` : "/auth/register");

  const description = `Compare every QR code type: websites, link pages, Wi-Fi, WhatsApp, social media and more. Edit dynamic codes after printing. Free for ${TRIAL_DAYS} days.`;
  const structuredData = [
    organizationSchema,
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "QR code types", path: PATH },
    ]),
    faqPageSchema(faqs),
  ];
  const groups = QR_TYPE_CATEGORIES.map((category) => ({ ...category, types: released.filter((type) => type.category === category.id) })).filter(
    (group) => group.types.length > 0
  );

  return (
    <div className="min-h-screen bg-white">
      <SeoMeta title="All QR Code Types: Links, Wi-Fi, Social and More | QR-Genie" description={description} path={PATH} jsonLd={structuredData} />
      <SiteHeader isAuthenticated={!!user} loading={loading} />

      <main>
        <PageBanner
          eyebrow={{ icon: FaThLarge, label: "QR code types" }}
          title="QR Code"
          highlight="Types"
          subtitle="The right code for every job"
          summary={`${released.length} types to choose from, each with your own colours and logo. More are on the way.`}
          crumbs={[{ name: "QR code types", path: PATH }]}
          visual={<TypeMosaic />}
          visualClassName="hidden lg:block"
        />

        {groups.map((group, index) => (
          <section key={group.id} className={`${index % 2 ? "bg-slate-50/70" : "bg-white"} py-14 sm:py-20`} aria-labelledby={`group-${group.id}`}>
            <div className={container}>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 id={`group-${group.id}`} className="font-display text-2xl font-bold tracking-[-0.015em] text-slate-900 sm:text-3xl">
                  {group.label}
                </h2>
                <p className="text-sm text-slate-500">
                  {group.types.length} {group.types.length === 1 ? "type" : "types"}
                </p>
              </div>
              <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {group.types.map((type) => (
                  <TypeCard key={type.id} type={type} createHref={createHref} />
                ))}
              </ul>
            </div>
          </section>
        ))}

        {upcoming.length > 0 && (
          <section className="border-t border-slate-100 bg-white py-14 sm:py-16" aria-labelledby="coming-soon">
            <div className={container}>
              <h2 id="coming-soon" className="font-display text-xl font-bold text-slate-900">
                Coming soon
              </h2>
              <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {upcoming.map((type) => {
                  const visual = qrTypeVisual(type.id);
                  const Icon = visual.icon;
                  return (
                    <li key={type.id} className="flex min-w-0 items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4">
                      <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl opacity-70 ${visual.accent}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-700">{type.label}</span>
                        <span className="block truncate text-xs text-slate-500">{BLURBS[type.id]?.text || type.description}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        )}

        {/* Dynamic or static, in two cards */}
        <section className={`relative isolate overflow-hidden bg-slate-50 ${sectionSpacing}`}>
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgb(224_231_255/0.8),transparent)]" aria-hidden="true" />
          <div className={container}>
            <SectionHeading eyebrow="Dynamic or static" title="Two ways a QR code can work" description="Every type tells you which it is when you create it." />
            <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-2">
              <div className="rounded-3xl bg-white p-7 ring-1 ring-slate-200">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <FaSyncAlt className="h-4 w-4" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-slate-900">Dynamic</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-slate-600">
                  The code holds a short link. Change where it goes or edit its page after printing, pause it, and see every scan with{" "}
                  <FaChartLine className="inline h-3 w-3 -translate-y-px text-indigo-500" aria-hidden="true" /> analytics.
                </p>
              </div>
              <div className="rounded-3xl bg-white p-7 ring-1 ring-slate-200">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                  <FaQrcode className="h-4 w-4" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-slate-900">Static</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-slate-600">
                  The content is printed into the code itself, so it works with no internet page in between. It can't be changed or tracked
                  later. Wi-Fi, Email, SMS and Phone call codes are always static.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className={`bg-white pb-4 pt-16 sm:pt-24 lg:pt-28`}>
          <div className={container}>
            <SectionHeading eyebrow="FAQ" title="Questions about QR code types" />
            <FaqList faqs={faqs} />
          </div>
        </section>
      </main>

      <SiteFooter showCta isAuthenticated={!!user} />
    </div>
  );
}
