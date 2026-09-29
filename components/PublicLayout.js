import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import { useCurrentUser } from "../lib/useCurrentUser";

/**
 * Header + content + footer for public pages such as log in, contact and 404.
 * - session: { loading, user } when the page already fetched it; otherwise fetched here
 * - centered: vertically centre short content (auth cards); off for content pages, which then size
 *   themselves with the site container (mx-auto max-w-site px-4 sm:px-6 lg:px-8) to line up with the header
 */
export default function PublicLayout({ children, session, centered = true }) {
  const own = useCurrentUser({ enabled: !session });
  const { loading, user } = session || own;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <SiteHeader isAuthenticated={!!user} loading={loading} />
      <main
        className={`relative flex flex-1 flex-col overflow-hidden py-12 ${centered ? "justify-center sm:px-6 lg:px-8" : ""}`}
      >
        {children}
      </main>
      <SiteFooter isAuthenticated={!!user} />
    </div>
  );
}
