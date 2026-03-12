const AIRTABLE_BASE = "https://api.airtable.com/v0/appgEacIYT6IJyCuZ/Dugout%20Backend";
const EO_API_KEY = "eo_5b19621fd4b7df3e3bd0af545487dfda0181225c957fe075f10c89f75dc75801";
const FROM_EMAIL = "dan@danstaub.com";
const SITE_URL = "https://danstaub.github.io/dugout-seat-worker";

export default {
  async fetch(request, env) {
    const token = env.AIRTABLE_TOKEN;

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    const url = new URL(request.url);
    const recordId = url.pathname.replace("/", "");
    const finalUrl = recordId
      ? `${AIRTABLE_BASE}/${recordId}${url.search}`
      : `${AIRTABLE_BASE}${url.search}`;

    const init = {
      method: request.method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };

    if (["POST", "PATCH"].includes(request.method)) {
      init.body = await request.text();
    }

    const airtableRes = await fetch(finalUrl, init);
    const data = await airtableRes.json();

    if (request.method === "POST" && airtableRes.ok && data.records && data.records[0]) {
      const record = data.records[0];
      const sellerEmail = record.fields && record.fields.seller;
      const recordId = record.id;
      if (sellerEmail) {
        const deleteLink = SITE_URL + "/?delete=" + recordId;
        await sendConfirmationEmail(sellerEmail, deleteLink);
      }
    }

    return new Response(JSON.stringify(data), {
      status: airtableRes.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  },
};

async function sendConfirmationEmail(toEmail, deleteLink) {
  const html = "<html><body style='font-family:Helvetica,Arial,sans-serif;background:#f7f8fa;margin:0;padding:40px 0;'>"
    + "<table width='100%' cellpadding='0' cellspacing='0'><tr><td align='center'>"
    + "<table width='560' cellpadding='0' cellspacing='0' style='background:#fff;border-radius:12px;overflow:hidden;'>"
    + "<tr><td style='background:#13274F;padding:32px 40px;text-align:center;'>"
    + "<div style='font-size:32px;margin-bottom:8px;'>&#9918;</div>"
    + "<div style='font-family:Georgia,serif;font-size:22px;color:#fff;font-weight:700;'>Chop Shop Fan Exchange</div>"
    + "<div style='font-size:13px;color:#8faab8;margin-top:4px;'>Atlanta Braves Ticket Marketplace</div>"
    + "</td></tr>"
    + "<tr><td style='padding:36px 40px;'>"
    + "<p style='font-size:18px;font-weight:700;color:#13274F;margin:0 0 16px;font-family:Georgia,serif;'>Congrats on your Dugout Seat listing!</p>"
    + "<p style='font-size:15px;color:#444;line-height:1.6;margin:0 0 24px;'>If anyone is interested in your listing they'll reach out over email.</p>"
    + "<p style='font-size:15px;color:#444;line-height:1.6;margin:0 0 20px;'>If you'd like to delete your listing you can do that in one click here:</p>"
    + "<table cellpadding='0' cellspacing='0' style='margin:0 0 28px;'><tr>"
    + "<td style='background:#CE1141;border-radius:7px;'>"
    + "<a href='" + deleteLink + "' style='display:inline-block;padding:13px 28px;font-size:14px;font-weight:600;color:#fff;text-decoration:none;'>Remove My Listing &rarr;</a>"
    + "</td></tr></table>"
    + "<p style='font-size:14px;color:#888;line-height:1.6;margin:0;'>Feel free to reply to this email if you have any questions.</p>"
    + "</td></tr>"
    + "<tr><td style='background:#f7f9fc;border-top:1px solid #e4e9f0;padding:20px 40px;text-align:center;'>"
    + "<p style='font-size:12px;color:#aaa;margin:0;'>Chop Shop Fan Exchange &middot; danstaub.github.io/dugout-seat-worker</p>"
    + "</td></tr>"
    + "</table></td></tr></table></body></html>";

  await fetch("https://emailoctopus.com/api/1.6/transactional/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: EO_API_KEY,
      to: [{ email_address: toEmail }],
      from: { email_address: FROM_EMAIL, name: "Chop Shop" },
      subject: "Your Braves ticket listing is live! ⚾",
      content: { html: html },
    }),
  });
}
