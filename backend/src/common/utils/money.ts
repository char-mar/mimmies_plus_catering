const MONEY_PATTERN = /^\d{1,10}(\.\d{1,2})?$/;

export function toMinorUnits(amount: string): number {
  if (!MONEY_PATTERN.test(amount)) {
    throw new Error(`Invalid money amount: ${amount}`);
  }

  const [whole = "0", fraction = ""] = amount.split(".");

  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

export function fromMinorUnits(minor: number): string {
  if (!Number.isInteger(minor) || minor < 0) {
    throw new Error(`Invalid minor unit amount: ${minor}`);
  }

  return (minor / 100).toFixed(2);
}
