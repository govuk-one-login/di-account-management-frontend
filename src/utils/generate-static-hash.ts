import { hash } from "./static-hash.js";

export const generateStaticHash = async (): Promise<string> => {
  return hash;
};
