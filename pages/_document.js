import { Html, Head, Main, NextScript } from "next/document";

// data-scroll-behavior="smooth" tells Next.js to switch smooth scrolling off while it changes pages, so only
// links within a page (the header's section links, "Learn More", …) glide; the CSS is in styles/globals.css
export default function Document() {
  return (
    <Html lang="en" data-scroll-behavior="smooth">
      <Head>
        {/* Google Search Console ownership check */}
        <meta name="google-site-verification" content="KBSUGYYaVOX8J-k5lz48lTyS9urQWN1qTV9wGcqbFCo" />
        {/* Google Tag Manager, as early as possible; public/gtm-init.js explains where it runs */}
        <script async src="/gtm-init.js" />
      </Head>
      <body>
        {/* Google Tag Manager for visitors without JavaScript */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-M2HW6QST"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
