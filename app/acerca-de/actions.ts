"use server";

import { Resend } from "resend";
import type { ContactInput, ContactResult } from "@/lib/types";

const MAX_MSG = 2000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendContact(input: ContactInput): Promise<ContactResult> {
  const name = String(input?.name ?? "").trim();
  const email = String(input?.email ?? "").trim();
  const msg = String(input?.msg ?? "").trim();

  if (!name || !email || !msg || !EMAIL_RE.test(email) || msg.length > MAX_MSG) {
    return { ok: false, error: "invalid" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !from || !to) {
    return { ok: false, error: "send_failed" };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject: `Contacto Arcade Vault — ${name}`,
      text: `Nombre: ${name}\nEmail: ${email}\n\nMensaje:\n${msg}`,
    });
    if (error) return { ok: false, error: "send_failed" };
    return { ok: true };
  } catch {
    return { ok: false, error: "send_failed" };
  }
}
