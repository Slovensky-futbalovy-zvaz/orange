const ECOMAIL_API_URL = "https://api2.ecomailapp.cz/transactional/send-message";
const ECOMAIL_API_KEY = process.env.ECOMAIL_API_KEY!;
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@domena.sk";
const FROM_NAME = process.env.FROM_NAME || "Orange Fakturácia";
const APP_URL = process.env.APP_URL || "http://localhost:3000";

async function sendEmail(
  toEmail: string,
  toName: string,
  subject: string,
  html: string
) {
  const response = await fetch(ECOMAIL_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      key: ECOMAIL_API_KEY,
    },
    body: JSON.stringify({
      message: {
        subject,
        from_name: FROM_NAME,
        from_email: FROM_EMAIL,
        reply_to: process.env.REPLY_TO_EMAIL || FROM_EMAIL,
        html,
        text: html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
        to: [{ email: toEmail, name: toName }],
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Ecomail API chyba ${response.status}: ${body}`);
  }

  return response.json();
}

/** Pošle magic link na prihlásenie */
export async function sendMagicLink(
  toEmail: string,
  firstName: string,
  token: string
) {
  const link = `${APP_URL}/auth/verify?token=${token}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #fff;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:24px;">
        <div style="width:32px; height:32px; background:#f97316; border-radius:8px; display:flex; align-items:center; justify-content:center;">
          <span style="color:#fff; font-size:16px; font-weight:bold;">O</span>
        </div>
        <span style="font-weight:600; font-size:15px; color:#111;">Orange Fakturácia</span>
      </div>
      <h2 style="color:#111; font-size:20px; margin-bottom:8px;">Prihlásenie do systému</h2>
      <p style="color:#555; font-size:15px; line-height:1.5;">Ahoj <strong>${firstName}</strong>,<br>
      kliknite na tlačidlo nižšie pre prihlásenie. Odkaz je platný <strong>15 minút</strong>.</p>
      <a href="${link}"
         style="display:inline-block; margin-top:20px; padding:12px 28px; background:#f97316; color:#fff;
                border-radius:8px; text-decoration:none; font-weight:600; font-size:15px;">
        Prihlásiť sa
      </a>
      <p style="color:#999; font-size:13px; margin-top:24px;">
        Ak ste o prihlásenie nežiadali, tento email ignorujte.<br>
        <a href="${link}" style="color:#f97316;">${link}</a>
      </p>
    </div>`;

  return sendEmail(toEmail, firstName, "Prihlásenie do Orange Fakturácia", html);
}

/** Pošle aktivačný link prvému správcovi */
export async function sendAdminActivation(
  toEmail: string,
  firstName: string,
  token: string
) {
  const link = `${APP_URL}/auth/verify?token=${token}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #fff;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:24px;">
        <div style="width:32px; height:32px; background:#f97316; border-radius:8px; display:flex; align-items:center; justify-content:center;">
          <span style="color:#fff; font-size:16px; font-weight:bold;">O</span>
        </div>
        <span style="font-weight:600; font-size:15px; color:#111;">Orange Fakturácia</span>
      </div>
      <h2 style="color:#111; font-size:20px; margin-bottom:8px;">Aktivácia správcovského konta</h2>
      <p style="color:#555; font-size:15px; line-height:1.5;">Ahoj <strong>${firstName}</strong>,<br>
      kliknite na tlačidlo nižšie pre aktiváciu Vášho správcovského konta.
      Odkaz je platný <strong>24 hodín</strong>.</p>
      <a href="${link}"
         style="display:inline-block; margin-top:20px; padding:12px 28px; background:#f97316; color:#fff;
                border-radius:8px; text-decoration:none; font-weight:600; font-size:15px;">
        Aktivovať konto
      </a>
      <p style="color:#999; font-size:13px; margin-top:24px;">
        <a href="${link}" style="color:#f97316;">${link}</a>
      </p>
    </div>`;

  return sendEmail(
    toEmail,
    firstName,
    "Aktivácia správcovského konta — Orange Fakturácia",
    html
  );
}

/** Pošle pozvánku novému používateľovi */
export async function sendInvitation(
  toEmail: string,
  firstName: string,
  token: string,
  inviterName: string,
  companies: string[]
) {
  const link = `${APP_URL}/auth/verify?token=${token}`;
  const companiesText =
    companies.length > 0
      ? `Budete mať prístup k spoločnostiam: <strong>${companies.join(", ")}</strong>.`
      : "";
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #fff;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:24px;">
        <div style="width:32px; height:32px; background:#f97316; border-radius:8px; display:flex; align-items:center; justify-content:center;">
          <span style="color:#fff; font-size:16px; font-weight:bold;">O</span>
        </div>
        <span style="font-weight:600; font-size:15px; color:#111;">Orange Fakturácia</span>
      </div>
      <h2 style="color:#111; font-size:20px; margin-bottom:8px;">Pozvánka do systému Orange Fakturácia</h2>
      <p style="color:#555; font-size:15px; line-height:1.5;">Ahoj <strong>${firstName}</strong>,<br>
      <strong>${inviterName}</strong> Vás pozýva do systému Orange Fakturácia.
      ${companiesText}<br><br>
      Kliknite na tlačidlo nižšie pre aktiváciu konta. Odkaz je platný <strong>7 dní</strong>.</p>
      <a href="${link}"
         style="display:inline-block; margin-top:20px; padding:12px 28px; background:#f97316; color:#fff;
                border-radius:8px; text-decoration:none; font-weight:600; font-size:15px;">
        Aktivovať konto
      </a>
      <p style="color:#999; font-size:13px; margin-top:24px;">
        <a href="${link}" style="color:#f97316;">${link}</a>
      </p>
    </div>`;

  return sendEmail(
    toEmail,
    firstName,
    `Pozvánka do Orange Fakturácia od ${inviterName}`,
    html
  );
}
