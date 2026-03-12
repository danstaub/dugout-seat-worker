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

    let body = null;
    if (["POST", "PATCH"].includes(request.method)) {
      body = await request.text();
      init.body = body;
    }

    const airtableRes = await fetch(finalUrl, init);
    const data = await airtableRes.json();

    // Send confirmation email after successful POST
    if (request.method === "POST" && airtableRes.ok && data.records?.[0]) {
      const record = data.records[0];
      const sellerEmail = record.fields?.seller;
      const recordAirtableId = record.id;

      if (sellerEmail) {
        const deleteLink = `${SITE_URL}/?delete=${recordAirtableId}`;
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
  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f7f8fa;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f8fa;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
        <tr><td style="background:linear-gradient(160deg,#0a1628 0%,#13274F 100%);padding:32px 40px;text-align:center;">
          <div style="font-size:36px;margin-bottom:8px;">⚾</div>
          <div style="font-family:Georgia,serif;font-size:22px;color:#ffffff;font-weight:700;">Chop Shop Fan Exchange</div>
          <div style="font-size:13px;color:#8faab8;margin-top:4px;">Atlanta Braves Ticket Marketplace</div>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          <p style="font-size:18px;font-weight:700;color:#13274F;margin:0 0 16px;font-family:Georgia,serif;">Congrats on your Dugout Seat listing!</p>
          <p style="font-size:15px;color:#444;line-height:1.6;margin:0 0 24px;">If anyone is interested in your listing they'll reach out over email.</p>
