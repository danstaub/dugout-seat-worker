const AIRTABLE_TOKEN = "pat9AL6u8CtLWETd6.b33c842bf09ea31161bf376759838ed2cb307734d769dcd82c946d3a6a38a0e1";
const AIRTABLE_BASE = "https://api.airtable.com/v0/appgEacIYT6IJyCuZ/Dugout%20Backend";

export default {
  async fetch(request) {
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
    const finalUrl = recordId ? `${AIRTABLE_BASE}/${recordId}${url.search}` : `${AIRTABLE_BASE}${url.search}`;

    const init = {
      method: request.method,
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        "Content-Type": "application/json",
      },
    };

    if (["POST", "PATCH"].includes(request.method)) {
      init.body = await request.text();
    }

    const airtableRes = await fetch(finalUrl, init);
    const data = await airtableRes.text();

    return new Response(data, {
      status: airtableRes.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  },
};
