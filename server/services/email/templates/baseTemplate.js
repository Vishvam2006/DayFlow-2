const LOGO_PLACEHOLDER = "https://placehold.co/160x40?text=DayFlow+HRMS";

export function buildEmailLayout({
  title,
  previewText,
  eyebrow = "DayFlow HRMS",
  heading,
  intro,
  bodyHtml,
  cta,
  footerNote = "This is an automated transactional email from DayFlow HRMS.",
}) {
  const ctaHtml = cta?.href && cta?.label
    ? `
      <div style="margin: 28px 0;">
        <a
          href="${cta.href}"
          style="display:inline-block;padding:12px 18px;border-radius:10px;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;"
        >
          ${cta.label}
        </a>
      </div>
    `
    : "";

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
      </head>
      <body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,Arial,sans-serif;color:#0f172a;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
          ${previewText || title}
        </div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:32px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;">
                <tr>
                  <td style="padding:28px 28px 20px;background:linear-gradient(135deg,#eff6ff 0%,#f8fafc 100%);border-bottom:1px solid #e2e8f0;">
                    <img src="${LOGO_PLACEHOLDER}" alt="DayFlow HRMS" width="160" height="40" style="display:block;border:0;outline:none;text-decoration:none;" />
                    <p style="margin:18px 0 8px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#475569;">
                      ${eyebrow}
                    </p>
                    <h1 style="margin:0;font-size:28px;line-height:1.2;color:#0f172a;">
                      ${heading}
                    </h1>
                    ${intro ? `<p style="margin:12px 0 0;font-size:15px;line-height:1.7;color:#475569;">${intro}</p>` : ""}
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px;">
                    ${bodyHtml}
                    ${ctaHtml}
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 28px 28px;border-top:1px solid #e2e8f0;background:#f8fafc;">
                    <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">${footerNote}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}
