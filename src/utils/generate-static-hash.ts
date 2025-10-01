import { hashElement } from "folder-hash";
import path from "path";

export async function generateStaticHash(): Promise<string> {
  const hash = await hashElement(path.join(__dirname, "..", "public"), {});
  return hash.hash;
}
