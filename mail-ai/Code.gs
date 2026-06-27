// FoundLocal — AI email responder (Google Apps Script, runs inside your Gmail, free).
// Reads new customer emails, asks the FoundLocal brain to write a reply, saves it as a DRAFT
// for you to approve. Flip AUTO_SEND to true once you trust it and it will send by itself.

const BRAIN = 'https://foundlocal-chat.foundlocal.workers.dev'; // the free AI brain we deployed
const PROCESSED = 'AI-Drafted';   // label so the same email isn't handled twice
const AUTO_SEND = false;          // false = save a Draft for your approval | true = send automatically

function processInbox() {
  const label = GmailApp.getUserLabelByName(PROCESSED) || GmailApp.createLabel(PROCESSED);
  const threads = GmailApp.search('is:unread in:inbox -label:' + PROCESSED + ' -from:formsubmit.co -from:noreply', 0, 8);
  for (let i = 0; i < threads.length; i++) {
    const th = threads[i];
    const msgs = th.getMessages();
    const last = msgs[msgs.length - 1];
    const from = last.getFrom();
    // skip robots / notifications — only reply to real people
    if (/no-?reply|notification|mailer-daemon|formsubmit|github|@google|calendar|invoice/i.test(from)) { th.addLabel(label); continue; }
    const body = last.getPlainBody().slice(0, 1500);
    const reply = brainReply(body);
    if (!reply) continue;
    if (AUTO_SEND) last.reply(reply);
    else th.createDraftReply(reply);
    th.addLabel(label);
  }
}

function brainReply(text) {
  try {
    const res = UrlFetchApp.fetch(BRAIN, {
      method: 'post',
      contentType: 'application/json',
      muteHttpExceptions: true,
      payload: JSON.stringify({
        messages: [{
          role: 'user',
          content: 'Write a warm, professional email reply (2-5 short sentences, sign off as "FoundLocal") to this customer enquiry. If they seem interested, invite them to reply with their business name and what they do for a free preview.\n\nTheir message:\n' + text,
        }],
      }),
    });
    return JSON.parse(res.getContentText()).reply;
  } catch (e) {
    return null;
  }
}
