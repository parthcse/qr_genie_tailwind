import { Html, Head, Main, NextScript } from "next/document";

// data-scroll-behavior="smooth" tells Next.js to switch smooth scrolling off while it changes pages, so only
// links within a page (the header's section links, "Learn More", …) glide; the CSS is in styles/globals.css
export default function Document() {
  return (
    <Html lang="en" data-scroll-behavior="smooth">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
