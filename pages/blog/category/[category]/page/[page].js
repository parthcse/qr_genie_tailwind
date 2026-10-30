import BlogListPage from "@/components/blog/BlogListPage";
import { blogListStaticProps, pageParam } from "@/lib/blog/wordpress";
import { categoryPath } from "@/lib/blog/format";

export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export async function getStaticProps({ params }) {
  if (params.page === "1") return { redirect: { destination: categoryPath(params.category), permanent: true } };
  const page = pageParam(params.page);
  if (!page) return { notFound: true };
  return blogListStaticProps({ page, category: params.category });
}

/** /blog/category/<slug>/page/<n>: further pages of one topic */
export default function BlogCategoryPageNumber({ list }) {
  return <BlogListPage list={list} />;
}
