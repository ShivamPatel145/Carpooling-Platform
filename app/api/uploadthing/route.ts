import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

/** UploadThing route handler. Token comes from UPLOADTHING_TOKEN. */
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
