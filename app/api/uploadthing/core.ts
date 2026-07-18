import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/auth";
import { logActivity } from "@/lib/activity";

/**
 * UploadThing file router. Auth-gated: only signed-in users can upload. Add new routes here per
 * domain need (documents, avatars, evidence). Cross-cutting — never reimplement uploads per
 * feature (extensibility contract #4).
 */
const f = createUploadthing();

export const ourFileRouter = {
  /** General document/image upload used by the demo entity + any slice needing attachments. */
  entityAttachment: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
    pdf: { maxFileSize: "8MB", maxFileCount: 1 },
    text: { maxFileSize: "1MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user) throw new UploadThingError("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await logActivity({
        actorId: metadata.userId,
        action: "upload",
        resource: "file",
        metadata: { url: file.ufsUrl, name: file.name, size: file.size },
      });
      return { url: file.ufsUrl, name: file.name };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
