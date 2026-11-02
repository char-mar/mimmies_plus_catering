import bcrypt from "bcrypt";

// 12 rounds keeps hashing expensive enough for offline attack resistance
// without adding noticeable latency to a single login.
const SALT_ROUNDS = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

// A dummy hash lets failed logins spend roughly the same time hashing as
// successful ones, so response timing does not reveal whether an email exists.
let dummyHashPromise: Promise<string> | undefined;

export function getDummyPasswordHash(): Promise<string> {
  dummyHashPromise ??= hashPassword("dummy-password-for-timing");
  return dummyHashPromise;
}
