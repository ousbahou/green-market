import dotenv from "dotenv";
import nodemailer from "nodemailer";

// Charge .env et écrase d'éventuelles valeurs vides de l'environnement local (utile si $Env:SMTP_HOST="" a été défini)
dotenv.config({ override: true });

// Normalise les variables : trim pour éviter les espaces et quotes parasites
const env = Object.fromEntries(
  Object.entries(process.env).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v])
);

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE,
  MAIL_FROM,
  MAIL_DEFAULT_TO,
} = env;

const isEmail = (value) => {
  if (typeof value !== "string") return false;
  const v = value.trim();
  // Validation simple : quelquechose@quelquechose
  return v.length > 3 && v.includes("@") && !v.includes(" ");
};

const isConfigured = () =>
  SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && MAIL_FROM;

const transporter = isConfigured()
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: SMTP_SECURE === "true" || SMTP_SECURE === true,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

export const sendMail = async ({ to, subject, text, html }) => {
  if (!isConfigured() || !transporter) {
    console.log("Mailer non configuré : email ignoré (renseignez SMTP_* et MAIL_FROM)");
    return { skipped: true };
  }

  const candidates = [to, MAIL_DEFAULT_TO, SMTP_USER].filter(Boolean).map((v) => String(v).trim());
  const recipient = candidates.find((v) => isEmail(v));
  console.log(`[mailer] candidates=${JSON.stringify(candidates)} recipient='${recipient || ""}'`);

  if (!recipient) {
    console.log("Aucun destinataire valide (to/MAIL_DEFAULT_TO/SMTP_USER), email ignoré");
    return { skipped: true };
  }

  const info = await transporter.sendMail({ from: MAIL_FROM, to: recipient, subject, text, html });
  return { messageId: info.messageId, to: recipient };
};
