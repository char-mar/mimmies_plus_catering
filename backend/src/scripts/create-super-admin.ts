import { hashPassword } from "../common/utils/password";
import { userService } from "../service/user.service";

const MIN_PASSWORD_LENGTH = 10;
const MAX_PASSWORD_LENGTH = 72;

async function main(): Promise<void> {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const name = process.env.SUPER_ADMIN_NAME?.trim() || "Super Admin";

  if (!email || !password) {
    console.error(
      "Usage: SUPER_ADMIN_EMAIL=... SUPER_ADMIN_PASSWORD=... [SUPER_ADMIN_NAME=...] npm run create:super-admin",
    );
    process.exitCode = 1;
    return;
  }

  if (
    password.length < MIN_PASSWORD_LENGTH ||
    password.length > MAX_PASSWORD_LENGTH
  ) {
    console.error(
      `SUPER_ADMIN_PASSWORD must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.`,
    );
    process.exitCode = 1;
    return;
  }

  if (await userService.emailExists(email)) {
    console.error("A user with this email already exists.");
    process.exitCode = 1;
    return;
  }

  const user = await userService.createUser({
    name,
    email,
    passwordHash: await hashPassword(password),
    role: "SUPER_ADMIN",
  });

  console.log(`Created SUPER_ADMIN ${user.email} (${user.id}).`);
}

main().catch((error: unknown) => {
  console.error("Failed to create super admin:", error);
  process.exitCode = 1;
});
