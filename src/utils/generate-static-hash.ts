import { hashElement } from "folder-hash";
import path from "path";
import memoize from "fast-memoize";

export const generateStaticHash = memoize(async function (): Promise<string> {
  const hash = await hashElement(path.join(__dirname, "..", "public"), {});
  return hash.hash;
});
