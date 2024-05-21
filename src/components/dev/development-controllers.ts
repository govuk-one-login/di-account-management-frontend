import { Request, Response } from "express";
import { readFileSync } from "fs";

const get = (obj: { [x: string]: any }, path: string, def: null) => {
  const fullPath = path
    .replace(/\[/g, ".")
    .replace(/]/g, "")
    .split(".")
    .filter(Boolean);

  return fullPath.every(everyFunc) ? obj : def;

  function everyFunc(step: string | number) {
    return !(step && (obj = obj[step]) === undefined);
  }
};

const findUniqueKeys = (object: any) => {
  const keys: string[] = [];
  const findKeys = (object: { [x: string]: any }, prevKey = "") => {
    Object.keys(object).forEach((key) => {
      const nestedKey = prevKey === "" ? key : `${prevKey}.${key}`;

      if (typeof object[key] !== "object") return keys.push(nestedKey);

      findKeys(object[key], nestedKey);
    });
  };
  findKeys(object);
  return keys;
};

export const missingTranslationsGet = async (
  req: Request,
  res: Response
): Promise<void> => {
  const en = JSON.parse(
    readFileSync("src/locales/en/translation.json").toString()
  );
  const cy = JSON.parse(
    readFileSync("src/locales/cy/translation.json").toString()
  );

  const keysEn = findUniqueKeys(en);
  const keysOnlyInEn = keysEn
    .map((key) => {
      const translation = get(cy, key, null);
      if (translation) {
        return null;
      }

      return {
        key,
        en: get(en, key, null),
      };
    })
    .filter((value) => value !== null)
    .map((value) => {
      return [
        {
          text: value.key,
        },
        {
          text: value.en,
        },
      ];
    });

  return res.render("dev/missing-translations.njk", {
    keysOnlyInEn,
  });
};
