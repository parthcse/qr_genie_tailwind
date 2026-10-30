import BlogListPage from "@/components/blog/BlogListPage";
import { blogListStaticProps } from "@/lib/blog/wordpress";

// Each topic's page is built the first time it's opened, then refreshed like /blog; an unknown topic is "not found"
export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export async function getStaticProps({ params }) {
  return blogListStaticProps({ page: 1, category: params.category });
}

/** /blog/category/<slug>: the newest 12 articles on one topic (a WordPress category) */
export default function BlogCategoryPage({ list }) {
  return <BlogListPage list={list} />;
}
