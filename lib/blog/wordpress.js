// The blog's articles, written in WordPress and read over its GraphQL API (the WPGraphQL plugin). Server only: used
// by the blog pages' getStaticProps and the sitemap. Everything returned is plain JSON for page props.
import { cleanPostHtml, decodeEntities, excerptText, plainText, readingMinutes, shortDescription } from "./postHtml";
import { postPath } from "./format";

export const WORDPRESS_GRAPHQL_URL = process.env.WORDPRESS_GRAPHQL_URL || "https://qrgenie.icecubedev.com/graphql";
const WORDPRESS_ORIGIN = new URL(WORDPRESS_GRAPHQL_URL).origin;

// How often a blog page checks WordPress for changes (seconds): a new or edited post shows within about 5 minutes
export const BLOG_REVALIDATE_SECONDS = 300;

/** True while `next build` runs (a deploy), when an unreachable WordPress must not stop the release */
export const isBuildPhase = () => process.env.NEXT_PHASE === "phase-production-build";

async function wpQuery(query, variables = {}) {
  const response = await fetch(WORDPRESS_GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`WordPress answered ${response.status}`);
  const json = await response.json();
  if (json.errors?.length) throw new Error(json.errors.map((error) => error.message).join("; "));
  return json.data;
}

/**
 * Yoast's fields (seo { … }) exist only while WordPress has the "WPGraphQL Yoast SEO Addon" plugin. Ask with them,
 * and without them when GraphQL doesn't know them, so the blog works either way (titles and descriptions then come
 * from the post itself).
 */
async function queryWithSeo(buildQuery, seoFields, variables) {
  try {
    return await wpQuery(buildQuery(seoFields), variables);
  } catch (error) {
    if (!/Cannot query field/.test(error.message)) throw error;
    return wpQuery(buildQuery(""), variables);
  }
}

// Up to 2,000 posts, 100 per request (WPGraphQL's largest page)
async function allPages(fetchPage) {
  const nodes = [];
  let after = null;
  for (let page = 0; page < 20; page += 1) {
    const connection = await fetchPage(after);
    nodes.push(...connection.nodes);
    if (!connection.pageInfo?.hasNextPage) break;
    after = connection.pageInfo.endCursor;
  }
  return nodes;
}

const CARD_FIELDS = `
  databaseId slug title date dateGmt modifiedGmt excerpt content
  categories { nodes { databaseId name slug } }
  author { node { name slug firstName lastName } }
  featuredImage { node { sourceUrl altText srcSet mediaDetails { width height } } }
`;

// Not Yoast's "noindex": the WordPress site is hidden from search engines as a whole (so articles aren't indexed twice),
// which makes Yoast report every post as noindex. A post that shouldn't be found stays a draft or private instead.
const POST_SEO_FIELDS = "seo { title metaDesc opengraphImage { sourceUrl altText mediaDetails { width height } } }";

/**
 * The author's public name: WordPress's display name, or the first and last name while the display name is still the
 * login ("admin", WordPress's default). The team's own account ("QR Genie Team", or no name at all) shows as
 * "QR-Genie Team", spelled like the brand, with the QR-Genie mark.
 */
function authorFrom(node) {
  const display = decodeEntities(node?.name).trim();
  const fullName = decodeEntities([node?.firstName, node?.lastName].filter(Boolean).join(" ")).trim();
  const isLogin = !display || display.toLowerCase() === "admin" || display === node?.slug;
  const name = isLogin ? fullName || (display.toLowerCase() === "admin" ? "" : display) : display;
  if (!name || /^qr[\s-]?genie(\s+team)?$/i.test(name)) return { name: "QR-Genie Team", team: true };
  return { name, team: false };
}

function imageFrom(node) {
  if (!node?.sourceUrl) return null;
  return {
    src: node.sourceUrl,
    srcSet: node.srcSet || null,
    alt: decodeEntities(node.altText),
    width: node.mediaDetails?.width || null,
    height: node.mediaDetails?.height || null,
  };
}

// WordPress's GMT times come without a zone
const gmtToIso = (value) => (value ? `${value.replace(" ", "T")}Z` : null);

/** A post as the blog's cards show it */
function cardFrom(node) {
  return {
    id: node.databaseId,
    slug: node.slug,
    title: decodeEntities(node.title) || "Untitled",
    excerpt: excerptText(node.excerpt),
    date: String(node.date || "").slice(0, 10),
    publishedAt: gmtToIso(node.dateGmt),
    updatedAt: gmtToIso(node.modifiedGmt),
    // "Uncategorized" is WordPress's default bucket, not a topic worth showing
    categories: (node.categories?.nodes || [])
      .filter((category) => category.slug !== "uncategorized")
      .map((category) => ({ id: category.databaseId, name: decodeEntities(category.name), slug: category.slug })),
    author: authorFrom(node.author?.node),
    image: imageFrom(node.featuredImage?.node),
    readingMinutes: readingMinutes(node.content),
  };
}

/** Every published post, newest first, as cards */
export async function getBlogPosts() {
  const nodes = await allPages(async (after) => {
    const data = await wpQuery(
      `query BlogPosts($after: String) {
        posts(first: 100, after: $after, where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }) {
          pageInfo { hasNextPage endCursor }
          nodes { ${CARD_FIELDS} }
        }
      }`,
      { after }
    );
    return data.posts;
  });
  return nodes.map(cardFrom);
}

// Yoast's title ends with the WordPress site's name ("Post title - QR Genie"); the site's own pages end in "| QR-Genie"
function pageTitle(yoastTitle, title) {
  const base = decodeEntities(yoastTitle).replace(/\s*[-–—|·•:]\s*QR[\s-]?Genie\s*$/i, "").trim() || title;
  return `${base} | QR-Genie`;
}

/**
 * One published post with its cleaned HTML (lib/blog/postHtml.js), headings, tags and search text, or null. lead: the
 * excerpt to show under the title, only when one was written for the post. seo: Yoast's title and description when
 * they're set, otherwise the post's title and excerpt; image: Yoast's social image, else the featured image.
 */
export async function getBlogPost(slug) {
  const data = await queryWithSeo(
    (seo) => `query BlogPost($slug: ID!) {
      post(id: $slug, idType: SLUG) { ${CARD_FIELDS} status tags { nodes { name slug } } ${seo} }
    }`,
    POST_SEO_FIELDS,
    { slug }
  );
  const node = data.post;
  if (!node || node.status !== "publish") return null;

  const card = cardFrom(node);
  const { html, headings } = cleanPostHtml(node.content, WORDPRESS_ORIGIN);
  const yoast = node.seo || {};
  // Without a written excerpt WordPress uses the post's opening words, which the article starts with anyway (compared
  // as plain words, since WordPress joins them with single spaces)
  const words = (text) => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim().slice(0, 120);
  const lead = card.excerpt && !words(plainText(node.content)).startsWith(words(card.excerpt)) ? card.excerpt : "";
  return {
    ...card,
    lead,
    html,
    headings,
    tags: (node.tags?.nodes || []).map((tag) => ({ name: decodeEntities(tag.name), slug: tag.slug })),
    seo: {
      title: pageTitle(yoast.title, card.title),
      description: shortDescription(decodeEntities(yoast.metaDesc).trim() || card.excerpt),
      image: imageFrom(yoast.opengraphImage) || card.image,
    },
  };
}

/** Up to 4 other posts to read next (one row of cards): same category first, then the newest */
export async function getRelatedPosts(post) {
  const data = await wpQuery(
    `query BlogRelated($categories: [ID], $exclude: [ID]) {
      sameCategory: posts(first: 4, where: { categoryIn: $categories, notIn: $exclude }) { nodes { ${CARD_FIELDS} } }
      latest: posts(first: 5, where: { notIn: $exclude }) { nodes { ${CARD_FIELDS} } }
    }`,
    { categories: post.categories.map((category) => String(category.id)), exclude: [String(post.id)] }
  );
  const sameCategory = post.categories.length ? data.sameCategory.nodes : [];
  const seen = new Set();
  return [...sameCategory, ...data.latest.nodes]
    .filter((node) => !seen.has(node.databaseId) && seen.add(node.databaseId))
    .slice(0, 4)
    .map(cardFrom);
}

/** For /sitemap.xml: [{ path, updatedAt }] of every published post */
export async function getBlogSitemapEntries() {
  const nodes = await allPages(async (after) => {
    const data = await wpQuery(
      `query BlogSitemap($after: String) {
        posts(first: 100, after: $after, where: { status: PUBLISH }) {
          pageInfo { hasNextPage endCursor }
          nodes { slug modifiedGmt }
        }
      }`,
      { after }
    );
    return data.posts;
  });
  return nodes.map((node) => ({ path: postPath(node.slug), updatedAt: gmtToIso(node.modifiedGmt) }));
}
