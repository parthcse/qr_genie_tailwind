import Head from "next/head";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "../styles/globals.css";

// Downloaded at build time and served from our own domain, so the CSP needs no font hosts.
// Inter for text and UI, Plus Jakarta Sans for headings (tailwind.config.js: font-sans / font-display).
const inter = Inter({ subsets: ["latin"], display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], display: "swap" });

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png" />
        <link rel="shortcut icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon.png" />
      </Head>
      {/* On :root rather than a wrapper div, so menus and modals portaled into <body> get the fonts too */}
      <style jsx global>{`
        :root {
          --font-sans: ${inter.style.fontFamily};
          --font-display: ${jakarta.style.fontFamily};
        }
      `}</style>
      <Component {...pageProps} />
    </>
  );
}
