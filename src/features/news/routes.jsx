import News from "./News.jsx";
import Article from "./Article.jsx";
import MyArticles from "./MyArticles.jsx";
import ArticleForm from "./ArticleForm.jsx";

export const routes = [
  { path: "/news", element: <News />, tab: true },
  { path: "/news/:id", element: <Article /> },
  { path: "/my-articles", element: <MyArticles />, guards: ["user"] },
  { path: "/articles/new", element: <ArticleForm />, guards: ["user"] },
  { path: "/articles/:id/edit", element: <ArticleForm />, guards: ["user"] },
];
