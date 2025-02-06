function redact(jsonString: string, fieldsToRedact: string[]): string {
  const jsonObject = JSON.parse(jsonString);

  function redact(obj: any) {
    for (const key in obj) {
      if (typeof obj[key] === "object") {
        redact(obj[key]);
      } else if (fieldsToRedact.includes(key)) {
        obj[key] = "REDACTED";
      }
    }
  }

  redact(jsonObject);
  return JSON.stringify(jsonObject);
}

export { redact };
