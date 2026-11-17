// Files from public/ (logos, artwork). The app may be served from a sub-path (GitHub Pages project
// site: /pwa/), so they are built from Vite's base URL instead of being written as "/brand/…".
export const asset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
