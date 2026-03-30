import type { RegExpMatcher } from "obscenity";
import * as v from "valibot";
import { MetricUnit } from "@aws-lambda-powertools/metrics";
import type { Request } from "express";

const iconDataUriPattern = /^data:image\/.+/;

let obscenityMatcher: RegExpMatcher | undefined;

const passkeysConvenienceMetadataSchema = v.pipeAsync(
  v.recordAsync(
    v.string(),
    v.pipeAsync(
      v.objectAsync({
        name: v.string(),
        icon_dark: v.nullish(v.pipe(v.string(), v.regex(iconDataUriPattern))),
        icon_light: v.nullish(v.pipe(v.string(), v.regex(iconDataUriPattern))),
      }),
      v.checkAsync(async (input) => {
        if (!obscenityMatcher) {
          const obscenity = await import("obscenity");
          obscenityMatcher = new obscenity.RegExpMatcher({
            ...obscenity.englishDataset.build(),
            ...obscenity.englishRecommendedTransformers,
          });
        }
        return !obscenityMatcher.hasMatch(input.name);
      }, "The name field contains an obscenity")
    )
  ),
  v.check(
    (input) => Object.keys(input).length > 0,
    "Must contain at least one entry"
  )
);

let convenienceMetadata:
  | v.InferOutput<typeof passkeysConvenienceMetadataSchema>
  | undefined;

export const getAllPasskeyConvenienceMetadata = async () => {
  if (convenienceMetadata) {
    return convenienceMetadata;
  }

  const metadata = await import(
    "../../../submodules/passkey-authenticator-aaguids/combined_aaguid.json",
    { with: { type: "json" } }
  );

  const parseResult = await v.safeParseAsync(
    passkeysConvenienceMetadataSchema,
    metadata.default
  );

  if (!parseResult.success) {
    // eslint-disable-next-line no-console
    console.error(parseResult.issues);
    throw new Error("Failed to parse passkey convenience metadata");
  }

  convenienceMetadata = parseResult.output;

  return convenienceMetadata;
};

export const getPasskeyConvenienceMetadataByAaguid = async (
  req: Request,
  aaguid: string
) => {
  const allMetadata = await getAllPasskeyConvenienceMetadata();

  if (!allMetadata[aaguid]) {
    req.metrics?.addMetadata("PasskeyAaguid", aaguid);
    req.metrics?.addMetric(
      "AaguidNotFoundInPasskeysConvenienceMetadata",
      MetricUnit.Count,
      1
    );
    req.log.warn("AaguidNotFoundInPasskeysConvenienceMetadata", {
      aaguid,
    });
  }

  return allMetadata[aaguid];
};
