import BlogListPage from "@/components/blog/BlogListPage";
import { blogListStaticProps, pageParam } from "@/lib/blog/wordpress";
import { BLOG_PATH } from "@/lib/blog/format";

// Each page is built the first time it's opened, then refreshed like /blog
export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export async function getStaticProps({ params }) {
  if (params.page === "1") return { redirect: { destination: BLOG_PATH, permanent: true } };
  const page = pageParam(params.page);
  if (!page) return { notFound: true };
  return blogListStaticProps({ page });
}

/** /blog/page/<n>: the next 12 articles, and so on */
export default function BlogListPageNumber({ list }) {
  return <BlogListPage list={list} />;
}
