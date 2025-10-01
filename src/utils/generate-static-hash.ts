import { hashElement } from "folder-hash";
import path from "node:path";
import memoize from "fast-memoize";
import { getStaticAssetsPath } from "../config";

export const generateStaticHash = memoize(async function (): Promise<string> {
  const hash = await hashElement(
    path.join(__dirname, getStaticAssetsPath()),
    {}
  );
  return hash.hash;
});
