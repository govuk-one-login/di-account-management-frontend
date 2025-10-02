import { hash } from "./static-hash.json";

export const generateStaticHash = async (): Promise<string> => {
  return hash;
};
