// Numbers that show results ("40%", "10 to 20x", "100K+", "10,000+") get
// picked out of the bullets so they stand out when someone skims.
// Plain numbers like "CS 445" or "Java 8" are left alone on purpose.
export const IMPACT = /(\d[\d,.]*(?:\s?to\s?\d[\d,.]*)?\s?(?:%|x\b|K\+|TB\+|\+))/

export function splitImpact(text: string): { text: string; hit: boolean }[] {
  return text
    .split(new RegExp(IMPACT.source, 'g'))
    .filter((part) => part !== '')
    .map((part) => ({ text: part, hit: IMPACT.test(part) && part.match(IMPACT)?.[0] === part }))
}
