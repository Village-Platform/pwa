import Explore from "./Explore.jsx";
import Firm from "./Firm.jsx";
import FirmForm from "./FirmForm.jsx";
import MyFirms from "./MyFirms.jsx";

export const routes = [
  { path: "/explore", element: <Explore />, tab: true },
  { path: "/firms/:id", element: <Firm /> },
  // Owners manage their firms (the server reviews new and edited ones).
  { path: "/my-firms", element: <MyFirms />, guards: ["user"] },
  { path: "/firms/new", element: <FirmForm />, guards: ["user"] },
  { path: "/firms/:id/edit", element: <FirmForm />, guards: ["user"] },
];
