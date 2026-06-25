export function convertPageQueryStringToNumber(
  str: string
): number | undefined {
  if (!/^\d+$/.test(str)) {
    return;
  }

  const num = Number.parseInt(str, 10);

  if (Number.isNaN(num) || num <= 0) {
    return;
  }
  return num;
}
