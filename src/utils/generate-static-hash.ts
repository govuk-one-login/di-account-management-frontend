import { hashElement } from "folder-hash";
import path from "node:path";
import memoize from "fast-memoize";

export const generateStaticHash = memoize(async function (
  folder?: string
): Promise<string> {
  const hash = await hashElement(
    folder
      ? path.join(__dirname, folder)
      : path.join(__dirname, "..", "public"),
    {}
  );
  return hash.hash;
});
