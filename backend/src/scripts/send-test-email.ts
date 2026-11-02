import { env } from "../config/env";
import { mailService } from "../common/services/mail.service";

const recipient = process.argv[2]?.trim();

function describeSmtpUser(): string {
  if (env.SMTP_USER) {
    return env.SMTP_USER;
  }

  return env.SMTP_HOST?.toLowerCase().includes("resend.com")
    ? "resend (derived)"
    : "(not set)";
}

async function main(): Promise<void> {
  console.info(`SMTP host: ${env.SMTP_HOST ?? "(not configured)"}`);
  console.info(`SMTP port: ${env.SMTP_PORT}`);
  console.info(`SMTP user: ${describeSmtpUser()}`);
  console.info(`From: ${env.MAIL_FROM}`);

  if (!mailService.isConfigured()) {
    throw new Error("SMTP_HOST and SMTP_PASSWORD must be set in .env.");
  }

  await mailService.verifyConnection();
  console.info("SMTP connection and authentication succeeded.");

  if (!recipient) {
    console.info("No recipient given; connection verified only.");
    console.info(
      "Send a test message with: npm run mail:test -- you@example.com",
    );
    return;
  }

  await mailService.send({
    to: recipient,
    subject: "Mimmies Plus SMTP test",
    text: "This is a test message from the Mimmies Plus backend. If you received it, Resend SMTP is working.",
    html: "<p>This is a test message from the Mimmies Plus backend.</p><p>If you received it, Resend SMTP is working.</p>",
  });

  console.info(`Test email sent to ${recipient}.`);
}

main().catch((error: unknown) => {
  console.error(
    "Mail check failed:",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
