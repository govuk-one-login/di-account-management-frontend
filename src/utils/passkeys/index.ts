import { getPasskeyConvenienceMetadataByAaguid } from "../passkeysConvenienceMetadata/index.js";
import { Request } from "express";

interface Passkey {
  credential: string;
  id: string;
  aaguid: string;
  isAttested: boolean;
  signCount: number;
  transports: string[];
  isBackUpEligible: boolean;
  isBackedUp: boolean;
  createdAt: string;
  lastUsedAt?: string;
}

interface PrettyPasskey {
  name: string;
  lastUsedAt?: string;
  createdAt: string;
  id: string;
}

export async function formatPasskeysForRender(
  req: Request,
  passkeys: Passkey[]
): Promise<PrettyPasskey[]> {
  const sortedLastUsed = passkeys
    .filter((passkey) => Object.hasOwnProperty.call(passkey, "lastUsedAt"))
    .sort((a, b) => {
      const timeA = new Date(a.lastUsedAt).getTime();
      const timeB = new Date(b.lastUsedAt).getTime();
      return timeB - timeA;
    });
  const sortedCreatedAt = passkeys
    .filter(
      (passkey) =>
        !Object.hasOwnProperty.call(passkey, "lastUsedAt") &&
        Object.hasOwnProperty.call(passkey, "createdAt")
    )
    .sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeB - timeA;
    });

  const sortedPasskeys = [...sortedLastUsed, ...sortedCreatedAt];

  const formatDate = (lang: string, string?: string): string => {
    if (!string) return "";

    return new Intl.DateTimeFormat(lang === "cy" ? "cy" : "en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(string));
  };

  const formattedPasskeys = await Promise.all(
    sortedPasskeys.map(async (passkey) => {
      const metadata = await getPasskeyConvenienceMetadataByAaguid(
        req,
        passkey.aaguid
      );
      return {
        id: passkey.id,
        name: metadata?.name,
        createdAt: formatDate(req.language, passkey.createdAt),
        lastUsedAt:
          passkey.lastUsedAt && formatDate(req.language, passkey.lastUsedAt),
      };
    })
  );
  return formattedPasskeys;
}
