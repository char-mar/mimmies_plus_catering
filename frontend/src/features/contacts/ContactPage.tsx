import { useState } from "react";
import type { FormEvent } from "react";
import { motion } from "motion/react";
import { CheckCircle2, MessageSquare, Send } from "lucide-react";

import {
  Alert,
  Button,
  Card,
  Input,
  Textarea,
} from "@/components/ui";
import { getErrorMessage } from "@/lib/errors";
import { EASE_OUT } from "@/lib/motion";
import { validateEmail, validateName } from "@/lib/validation";

import { useCreateContact } from "./hooks";

interface ContactFormState {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

type ContactFormErrors = Partial<Record<keyof ContactFormState, string>>;

const EMPTY_FORM: ContactFormState = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

const PHONE_PATTERN = /^\+?[0-9\s\-()]{7,30}$/;

function validate(form: ContactFormState): ContactFormErrors {
  const errors: ContactFormErrors = {};
  const nameError = validateName(form.name);

  if (nameError) {
    errors.name = nameError;
  }

  const emailError = validateEmail(form.email);

  if (emailError) {
    errors.email = emailError;
  }

  const phone = form.phone.trim();

  if (phone && !PHONE_PATTERN.test(phone)) {
    errors.phone = "Enter a valid phone number, for example 024 000 0000.";
  }

  if (form.subject.trim().length < 3) {
    errors.subject = "Add a short subject.";
  }

  if (form.message.trim().length < 10) {
    errors.message = "Please add a few more details to your message.";
  }

  return errors;
}

export function ContactPage() {
  const createContact = useCreateContact();
  const [form, setForm] = useState<ContactFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [sent, setSent] = useState(false);

  const update = (field: keyof ContactFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validate(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    createContact.mutate(
      {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        subject: form.subject.trim(),
        message: form.message.trim(),
      },
      {
        onSuccess: () => {
          setSent(true);
          setForm(EMPTY_FORM);
        },
      },
    );
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className="relative isolate overflow-hidden rounded-3xl bg-[#0b0a09] px-6 py-8 text-white sm:px-8 lg:px-10 lg:py-12"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-brand-600/25 blur-3xl"
          />
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/50">
            Get in touch
          </p>
          <h1 className="mt-4 font-serif text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
            Tell us about your event.
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/60">
            Planning a corporate lunch, an offshore crew rotation, or a family
            celebration? Share the details and our team will put together a
            tailored menu and quote.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-white/70">
            {[
              "Catering quotes for onshore and offshore teams",
              "Menu and dietary questions",
              "Delivery schedules and logistics support",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <CheckCircle2
                  className="mt-0.5 size-4 shrink-0 text-brand-400"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <p className="mt-10 text-xs leading-relaxed text-white/40">
            We usually reply within one business day. For urgent orders, place
            your order through the menu and note it for the kitchen.
          </p>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.08 }}
        >
          <Card className="p-6 sm:p-8">
            {sent ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <CheckCircle2 className="size-6" aria-hidden="true" />
                </span>
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-stone-900">
                    Message sent
                  </h2>
                  <p className="max-w-sm text-sm text-stone-500">
                    Thanks for reaching out. Our team will get back to you
                    within one business day.
                  </p>
                </div>
                <Button variant="secondary" onClick={() => setSent(false)}>
                  Send another message
                </Button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4" noValidate>
                <div className="flex items-center gap-2">
                  <MessageSquare
                    className="size-4 text-brand-600"
                    aria-hidden="true"
                  />
                  <h2 className="text-base font-semibold text-stone-900">
                    Send us a message
                  </h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Full name"
                    value={form.name}
                    maxLength={100}
                    autoComplete="name"
                    placeholder="Ama Mensah"
                    onChange={(event) => update("name", event.target.value)}
                    error={errors.name}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={form.email}
                    maxLength={255}
                    autoComplete="email"
                    placeholder="you@company.com"
                    onChange={(event) => update("email", event.target.value)}
                    error={errors.email}
                  />
                </div>

                <Input
                  label="Phone (optional)"
                  type="tel"
                  value={form.phone}
                  maxLength={30}
                  autoComplete="tel"
                  placeholder="024 000 0000"
                  onChange={(event) => update("phone", event.target.value)}
                  error={errors.phone}
                />

                <Input
                  label="Subject"
                  value={form.subject}
                  maxLength={150}
                  placeholder="Catering for a 40-person team lunch"
                  onChange={(event) => update("subject", event.target.value)}
                  error={errors.subject}
                />

                <Textarea
                  label="Message"
                  rows={5}
                  maxLength={3000}
                  value={form.message}
                  placeholder="Date, location, number of guests, dietary needs…"
                  onChange={(event) => update("message", event.target.value)}
                  error={errors.message}
                />

                {createContact.error ? (
                  <Alert tone="error">
                    {getErrorMessage(
                      createContact.error,
                      "Your message could not be sent. Please try again.",
                    )}
                  </Alert>
                ) : null}

                <Button
                  type="submit"
                  fullWidth
                  loading={createContact.isPending}
                  rightIcon={<Send className="size-4" aria-hidden="true" />}
                >
                  Send message
                </Button>
              </form>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
