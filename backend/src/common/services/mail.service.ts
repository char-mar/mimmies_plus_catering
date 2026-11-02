import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

import { env } from "../../config/env";

const APP_NAME = "Mimmies Plus";
const RESEND_HOST_FRAGMENT = "resend.com";
const RESEND_SMTP_USER = "resend";

// Resend (and some other providers) use a fixed SMTP username. Allow the env
// var to override it, but do not force every provider to set one.
function getSmtpUser(): string | undefined {
  if (env.SMTP_USER) {
    return env.SMTP_USER;
  }

  return env.SMTP_HOST?.toLowerCase().includes(RESEND_HOST_FRAGMENT)
    ? RESEND_SMTP_USER
    : undefined;
}

function isSecureConnection(): boolean {
  // Resend uses 465 for implicit TLS and 587 for STARTTLS.
  return env.SMTP_SECURE || env.SMTP_PORT === 465;
}

export interface OutboundEmail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

function buildLink(pathname: string, token: string): string {
  const base = env.FRONTEND_URL.replace(/\/+$/, "");
  return `${base}${pathname}?token=${encodeURIComponent(token)}`;
}

function layout(title: string, body: string, action: string): string {
  return `<!doctype html>
<html>
  <body style="font-family: Arial, sans-serif; color: #222; line-height: 1.5;">
    <h2 style="margin-bottom: 8px;">${title}</h2>
    <p>${body}</p>
    <p>${action}</p>
    <p style="color: #666; font-size: 13px;">If you did not request this, you can safely ignore this email.</p>
  </body>
</html>`;
}

export class MailService {
  private transporter?: Transporter;
  private outbox: OutboundEmail[] = [];

  private getTransporter(): Transporter | undefined {
    if (!env.SMTP_HOST) {
      return undefined;
    }

    const smtpUser = getSmtpUser();

    this.transporter ??= nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: isSecureConnection(),
      ...(smtpUser && env.SMTP_PASSWORD
        ? { auth: { user: smtpUser, pass: env.SMTP_PASSWORD } }
        : {}),
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });

    return this.transporter;
  }

  isConfigured(): boolean {
    return Boolean(env.SMTP_HOST && env.SMTP_PASSWORD);
  }

  async verifyConnection(): Promise<void> {
    const transporter = this.getTransporter();

    if (!transporter) {
      throw new Error(
        "SMTP is not configured. Set SMTP_HOST, SMTP_PORT and SMTP_PASSWORD.",
      );
    }

    await transporter.verify();
  }

  async send(message: OutboundEmail): Promise<void> {
    if (env.NODE_ENV === "test") {
      this.outbox.push(message);
      return;
    }

    const transporter = this.getTransporter();

    if (!transporter) {
      if (env.NODE_ENV === "production") {
        throw new Error(
          "SMTP_HOST is not configured; transactional email cannot be sent.",
        );
      }

      // Development convenience: surface the link without an SMTP server.
      console.info(
        `[mail:dev] To: ${message.to}\nSubject: ${message.subject}\n${message.text}`,
      );
      return;
    }

    const info = await transporter.sendMail({
      from: env.MAIL_FROM,
      ...message,
    });

    console.info(
      `[mail] Sent "${message.subject}" to ${message.to} (${info.messageId})`,
    );
  }

  async sendEmailVerification(
    to: string,
    name: string,
    token: string,
  ): Promise<void> {
    const link = buildLink("/verify-email", token);

    await this.send({
      to,
      subject: `Verify your ${APP_NAME} email address`,
      text: `Hi ${name},\n\nConfirm your email address to finish setting up your ${APP_NAME} account:\n${link}\n\nThis link expires in ${env.EMAIL_VERIFICATION_TTL_HOURS} hours.`,
      html: layout(
        "Verify your email address",
        `Hi ${name}, confirm your email address to finish setting up your ${APP_NAME} account.`,
        `<a href="${link}">Verify email</a><br /><span style="color:#666;font-size:13px;">This link expires in ${env.EMAIL_VERIFICATION_TTL_HOURS} hours.</span>`,
      ),
    });
  }

  async sendPasswordReset(
    to: string,
    name: string,
    token: string,
  ): Promise<void> {
    const link = buildLink("/reset-password", token);

    await this.send({
      to,
      subject: `Reset your ${APP_NAME} password`,
      text: `Hi ${name},\n\nUse the link below to choose a new password:\n${link}\n\nThis link expires in ${env.PASSWORD_RESET_TTL_MINUTES} minutes.`,
      html: layout(
        "Reset your password",
        `Hi ${name}, use the link below to choose a new password.`,
        `<a href="${link}">Reset password</a><br /><span style="color:#666;font-size:13px;">This link expires in ${env.PASSWORD_RESET_TTL_MINUTES} minutes.</span>`,
      ),
    });
  }

  // Only populated in the test environment so integration tests can follow
  // the emailed links without an SMTP server.
  getOutbox(): readonly OutboundEmail[] {
    return this.outbox;
  }

  clearOutbox(): void {
    this.outbox.length = 0;
  }
}

export const mailService = new MailService();
