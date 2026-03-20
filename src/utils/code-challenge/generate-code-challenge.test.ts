import { describe, it, expect } from "vitest";
import generateCodeChallenge from "./generate-code-challenge.js";

describe("generateCodeChallenge", () => {
  const codeVerifiers = [
    "x0r_xZoro.9EfLr1De5kco1OhvHiIzL~9LLhB5WG6ta",
    "qlZAY7UJLl1K~9AYBztG6zwN26G9qb-NNHpgShRhe4CCYVAbFY",
    "QtYPmRTysFxjs9OB2iwEkAfP4cHz4-kCE8LXTw8IIcFVdlnFTbF-MRB2hi5Q8P5A",
    "l8g7AzQf-I~xGlDCZL63I~NzV0M94jHhUOWvvxTktod.ycu8R2e3BQb75pmnS_nKsiEXPYrqlLaJFf1w",
    "FjtOOH_bpJlYmMJUlW1zm8fL.7vh~kpNvDTScZHN1qwDVB25AX0GRj89xgLtjTdoK-S._aP6Is43A0bQteIy74BurExnCfPiq1G-",
    "z-2fD09t76hzgYCViGAfRXQIFwRR~AUS~l.LSrqc.PyNmkoAJEX3WrqMhEo5IS.y9bM31dAxa8-H4pI6e_Df7C5jljzNU6YmsJ6IHMjP~f~HGZTsOdzKua1uNgvynBKZ",
  ];

  it("generates the same code challenge as OAuth's computation method", async () => {
    const expectedCodeChallenges = [
      "xs4MNMHF3lh5lRHrElyQCkh8MwTrlufV-FyN8LH2TXw",
      "y8jduFhTnG-TlEo0FqKAQWGxuOvvSLgJILylQnnSUKQ",
      "BalGOLl1If_dRlS0Rdjcs6NY2BVCGg5h08L0lqZ0XsU",
      "Hr9R68E1dc40vjMs2uUfQWOTrdgEWer86iDLPdPqlMI",
      "3B0ygq2bLqUmVbgYJMCJPnkVCcghDNOhdAEslcq3QeI",
      "C201RY73-dL-userEi59lK0cpfEeVJUuRWGHqzX_ef0",
    ];

    for (let x = 0; x < codeVerifiers.length; x++) {
      const result = await generateCodeChallenge(codeVerifiers[x]);
      expect(result).toEqual(expectedCodeChallenges[x]);
    }
  });
});
