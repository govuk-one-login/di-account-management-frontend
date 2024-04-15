const readFileSync = require("fs").readFileSync;

const get = (obj, path, def) => {
  const fullPath = path
    .replace(/\[/g, ".")
    .replace(/]/g, "")
    .split(".")
    .filter(Boolean);

  return fullPath.every(everyFunc) ? obj : def;

  function everyFunc(step) {
    return !(step && (obj = obj[step]) === undefined);
  }
};

const findUniqueKeys = (object) => {
  const keys = [];
  const findKeys = (object, prevKey = "") => {
    Object.keys(object).forEach((key) => {
      const nestedKey = prevKey === "" ? key : `${prevKey}.${key}`;

      if (typeof object[key] !== "object") return keys.push(nestedKey);

      findKeys(object[key], nestedKey);
    });
  };
  findKeys(object);
  return keys;
};

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
    return `<li><strong>${value.key}</strong><pre>${value.en}</pre></li>`;
  });

console.log(`<html><body><ul>${keysOnlyInEn.join("\n")}</ul></body></html>`);
