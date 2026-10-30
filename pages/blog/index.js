import BlogListPage from "@/components/blog/BlogListPage";
import { blogListStaticProps } from "@/lib/blog/wordpress";

// Built during the deploy, then refreshed from WordPress every few minutes (see blogListStaticProps)
export async function getStaticProps() {
  return blogListStaticProps({ page: 1 });
}

/** /blog: the newest 12 articles, with topic links and page numbers (components/blog/BlogListPage.js) */
export default function BlogPage({ list }) {
  return <BlogListPage list={list} />;
}
