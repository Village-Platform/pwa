import ReviewQueue from "./ReviewQueue.jsx";

export const routes = [{ path: "/review", element: <ReviewQueue />, guards: ["reviewer"] }];
