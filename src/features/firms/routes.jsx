import Explore from "./Explore.jsx";
import Firm from "./Firm.jsx";
import FirmForm from "./FirmForm.jsx";
import { Navigate, useParams } from "react-router-dom";
import MyFirms from "./MyFirms.jsx";

// A shared /categories/12 link opens the directory filtered by that category.
function CategoryRedirect() {
  const { id } = useParams();
  return <Navigate to={`/explore?category=${encodeURIComponent(id)}`} replace />;
}

export const routes = [
  { path: "/explore", element: <Explore />, tab: true },
  { path: "/firms/:id", element: <Firm /> },
  { path: "/categories/:id", element: <CategoryRedirect /> },
  // Owners manage their firms (the server reviews new and edited ones).
  { path: "/my-firms", element: <MyFirms />, guards: ["user"] },
  { path: "/firms/new", element: <FirmForm />, guards: ["user"] },
  { path: "/firms/:id/edit", element: <FirmForm />, guards: ["user"] },
];
