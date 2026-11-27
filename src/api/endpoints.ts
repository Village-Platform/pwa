import { catalog } from "./catalog";
import { account } from "./account";
import { notifications } from "./notifications";
import { owner } from "./owner";
import { plans } from "./plans";
import { config } from "./config";
import { topics } from "./topics";

// Every call the web app makes, one module per domain. Same endpoints, params and bodies as the
// Android AghourApi.kt and its repositories: nothing new on the server, so the shipped Android app
// and this app share one contract.
//
// To add endpoints: put them in the domain module (or a new `src/api/<domain>.js`) and spread it here.
export const Api = { ...catalog, ...account, ...notifications, ...owner, ...plans, ...config, ...topics };
