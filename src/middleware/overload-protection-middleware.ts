import overloadProtection from "overload-protection";

export const applyOverloadProtection = (isProduction: boolean) => {
  return overloadProtection("express", {
    production: isProduction,
    clientRetrySecs: 1,
    sampleInterval: 100,
    maxEventLoopDelay: 42,
    maxHeapUsedBytes: 0,
    maxRssBytes: 0,
    errorPropagationMode: false,
    logging: false,
    logStatsOnReq: false,
  });
};
