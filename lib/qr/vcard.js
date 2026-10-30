/**
 * Builds a vCard 3.0 file (.vcf) for "Save contact" on Contact card and Business pages. Works on iPhone and Android.
 * Values come from cleaned content (lib/qr/qrContent.js); they're still escaped here, because a vCard is plain text
 * where a line break, ";" or "," would change the meaning of the line.
 */

// Escapes a value: backslash, line breaks, ";" and "," (RFC 2426)
const esc = (value) =>
  String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");

// Lines longer than 75 characters are folded: the rest continues on the next line after a space
function fold(line) {
  if (line.length <= 75) return line;
  const parts = [line.slice(0, 75)];
  for (let i = 75; i < line.length; i += 74) parts.push(` ${line.slice(i, i + 74)}`);
  return parts.join("\r\n");
}

/**
 * contact: { firstName, lastName, organization, jobTitle, phones: [{ type: "CELL" | "WORK", number }], email, website,
 * address, note, photo (data URL, PNG or JPEG only) }. Returns the file's text.
 */
export function buildVCard(contact) {
  const first = contact.firstName || "";
  const last = contact.lastName || "";
  const fullName = [first, last].filter(Boolean).join(" ") || contact.organization || "Contact";
  const lines = ["BEGIN:VCARD", "VERSION:3.0", `N:${esc(last)};${esc(first)};;;`, `FN:${esc(fullName)}`];
  if (contact.organization) lines.push(`ORG:${esc(contact.organization)}`);
  if (contact.jobTitle) lines.push(`TITLE:${esc(contact.jobTitle)}`);
  for (const phone of contact.phones || []) {
    if (phone?.number) lines.push(`TEL;TYPE=${phone.type === "WORK" ? "WORK" : "CELL"},VOICE:${esc(phone.number)}`);
  }
  if (contact.email) lines.push(`EMAIL;TYPE=INTERNET:${esc(contact.email)}`);
  if (contact.website) lines.push(`URL:${esc(contact.website)}`);
  if (contact.address) lines.push(`ADR;TYPE=WORK:;;${esc(contact.address)};;;;`);
  if (contact.note) lines.push(`NOTE:${esc(contact.note)}`);
  const photo = typeof contact.photo === "string" ? contact.photo.match(/^data:image\/(png|jpe?g);base64,([a-z0-9+/=]+)$/i) : null;
  if (photo) lines.push(`PHOTO;ENCODING=b;TYPE=${photo[1].toLowerCase() === "png" ? "PNG" : "JPEG"}:${photo[2]}`);
  lines.push("END:VCARD");
  return lines.map(fold).join("\r\n") + "\r\n";
}

/** A safe file name for the download, e.g. "Asha-Patel.vcf" */
export function vcardFileName(name) {
  const base = String(name || "contact")
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
  return `${base || "contact"}.vcf`;
}
