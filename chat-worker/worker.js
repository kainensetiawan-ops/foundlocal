// FoundLocal AI chat brain — Cloudflare Worker.
// Holds the Groq key server-side (never in the browser), proxies to a free Llama model,
// answers any question about FoundLocal, and nudges toward a free-preview lead.
const SYSTEM = `You are the friendly assistant for FoundLocal — a studio that builds modern, cinematic websites for LOCAL businesses and gets them found on Google and AI search (like ChatGPT). Everything is done-for-you.

PACKAGES:
- Starter $80: one-page cinematic site, mobile + desktop, an enquiry form to their inbox, delivered in 3 days.
- Get Found $150 (most popular): everything in Starter + up to 5 sections + Google Business setup + on-page SEO so they actually rank, delivered in 5 days.
- Full Presence $280: everything in Get Found + AI/ChatGPT visibility + lead capture + reviews + priority.
Add-ons: rush 48h +$40, extra page +$25, Google Business setup +$35.

HOW IT WORKS: the client just tells us their business name, what they do, and their area; we design and write everything (no calls, no jargon); we get them found on Google; customers reach them via an enquiry form that lands in their inbox.

STYLE: warm, concise, plain English, lightly enthusiastic. Keep answers SHORT (1-3 sentences).
GOAL: answer their question, then naturally invite them to claim a FREE website preview by sharing their name, business, and email.
RULES: Only discuss FoundLocal and its web/SEO services. If asked anything off-topic, gently steer back. Never invent facts beyond the above — if unsure, offer the free preview. Never mention you are an AI model or name the provider.`;

export default {
  async fetch(req, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method !== 'POST') return new Response('FoundLocal chat brain', { headers: cors });
    try {
      const body = await req.json();
      const msgs = Array.isArray(body.messages) ? body.messages : [];
      // guard: last 8 turns, cap each message length
      const hist = msgs.slice(-8).map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: String(m.content || '').slice(0, 600),
      }));
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 220,
          temperature: 0.6,
          messages: [{ role: 'system', content: SYSTEM }, ...hist],
        }),
      });
      const j = await r.json();
      const reply = j?.choices?.[0]?.message?.content?.trim()
        || "Happy to help! Want a free website preview? Just share your name, business, and email.";
      return new Response(JSON.stringify({ reply }), { headers: { ...cors, 'Content-Type': 'application/json' } });
    } catch (e) {
      return new Response(JSON.stringify({ reply: "Sorry, quick hiccup — mind rephrasing? Or share your name, business & email and I'll send a free preview." }), { headers: { ...cors, 'Content-Type': 'application/json' } });
    }
  },
};
