// src/app/api/uploadthing/route.ts
import { createRouteHandler } from "uploadthing/next"; // CHANGED: Correct import
import { ourFileRouter } from "./core";

// Export routes for Next App Router
export const { GET, POST } = createRouteHandler({ // CHANGED: Correct function name
  router: ourFileRouter,
});