// Google Tag Manager (container GTM-M2HW6QST): Google's standard snippet, loaded as a file from our own domain because
// the Content Security Policy blocks inline scripts (see next.config.js for the Google domains it allows).
// It runs only on the live site, and not on QR scan pages (our customers' visitors) or on pages whose address carries
// a one-time code (password reset, email confirmation), so those never reach Google.
(function (w, d, s, l, i) {
  if (w.location.hostname !== "qr-genie.co") return;
  if (/^\/(r\/|auth\/reset-password|auth\/verify-email)/.test(w.location.pathname)) return;
  w[l] = w[l] || [];
  w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
  var f = d.getElementsByTagName(s)[0],
    j = d.createElement(s),
    dl = l != "dataLayer" ? "&l=" + l : "";
  j.async = true;
  j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
  f.parentNode.insertBefore(j, f);
})(window, document, "script", "dataLayer", "GTM-M2HW6QST");
