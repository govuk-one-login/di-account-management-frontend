import staticHash from "./static-hash.json" with { type: "json" };

export const generateStaticHash = async (): Promise<string> => {
  return staticHash.hash;
};
