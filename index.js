const { Telegraf, Scenes, session, Markup,  } = require("telegraf");
const bot = new Telegraf("7643827804:AAEGsdEbKAfPn5sTygDdsdlR52EwxkpqseI");
const groupChatId = "-1002714637390"; 
const { BaseScene, Stage } = Scenes;
const { message } = require("telegraf/filters");
const fs = require("fs");
// require("dotenv").config();

// n
// bot.on("message", (ctx) => {
//   console.log("Chat ID:", ctx.chat.id);
//   ctx.reply(`This group chat ID is: ${ctx.chat.id}`);
// });






// bot.action("continue_info", (ctx) => {
//   ctx.reply(
//     "Please provide the type of scam you were involved in. This will help us categorize your case and provide the most relevant assistance.",
//     Markup.inlineKeyboard([
//       [
//         Markup.button.callback("Cryptocurrency Scam", "cryptocurrency_scam"),
//         Markup.button.callback("Phishing or Identity Theft", "phishing_scam"),
//       ],

//       [
//         Markup.button.callback("Forex Trading Scam", "forex_scam"),
//         Markup.button.callback("Bank Transfer Fraud", "bank_transfer_scam"),
//       ],
//       Markup.button.callback("Romance/Relationship Scam", "romance_scam"),
//       Markup.button.callback("Other", "other_scam"),
//     ])
//   );
// });

// bot.launch((ctx) => {
//   console.log("Bot is running...");
// });
const storyScene = new BaseScene("storyScene");
storyScene.enter((ctx) =>
  ctx.reply(`📝 Briefly describe the scam incident: \n\n` +

    `Please tell us what happened in your own words. Include any names, conversations, or actions that led to the scam.`)
);
storyScene.on("text", (ctx) => {
  ctx.session.story = ctx.message.text;
  ctx.scene.enter("scamTypeScene");
});

const scamTypeScene = new BaseScene("scamTypeScene");
scamTypeScene.enter((ctx) =>
  ctx.reply(
    "📂 Select the scam Category:",
    Markup.keyboard([
      ["Crypto", "Bank Transfer"],
      ["Romance", "Forex"],
      ["Other"],
    ]).resize()
  )
);
scamTypeScene.on("text", (ctx) => {
  ctx.session.scamType = ctx.message.text;
  ctx.scene.enter("platformScene");
});

const platformScene = new BaseScene("platformScene");
platformScene.enter((ctx) =>
  ctx.reply(
    `🌐 On which platform did the scam take place? \n\n` +
      `For example: WhatsApp, Instagram, Telegram, Facebook, Email, Bank App, etc."`
  )
);
platformScene.on("text", (ctx) => {
  ctx.session.platform = ctx.message.text;
  ctx.scene.enter("amountScene");
});

const amountScene = new BaseScene("amountScene");
amountScene.enter((ctx) => ctx.reply("💰 How much did you lose?"));
amountScene.on("text", (ctx) => {
  ctx.session.amount = ctx.message.text;
  ctx.scene.enter("proofScene");
});

const proofScene = new BaseScene("proofScene");
proofScene.enter((ctx) => {
  ctx.reply(` 📸 Upload any proof you have: \n\n` +

   ` Kindly upload screenshots, payment receipts, account statements, or chat evidence to support your claim.`);
});

proofScene.on("message", async (ctx) => {
  try {
    const sessionData = ctx.session;

    const caseId =
      sessionData.caseId || Math.floor(100000 + Math.random() * 900000);
    const username = ctx.from.username || "No username";
    const userId = ctx.from.id;
    const story = sessionData.story;
    const scamType = sessionData.scamType;
    const platform = sessionData.platform;
    const amount = sessionData.amount;
    const date = new Date().toLocaleString();

    const caption =
      `🚨 <b>New Scam Report</b> 🚨\n` +
      `🆔 <b>Case ID:</b> ${caseId}\n` +
      `👤 <b>User:</b> @${username}\n` +
      `🧾 <b>User ID:</b> ${userId}\n` +
      `📖 <b>Story:</b> ${story}\n` +
      `🎭 <b>Scam Type:</b> ${scamType}\n` +
      `📱 <b>Platform:</b> ${platform}\n` +
      `💰 <b>Amount Lost:</b> ${amount}\n` +
      `🕒 <b>Date:</b> ${date}`;

    if (ctx.message.photo) {
      const photo = ctx.message.photo[ctx.message.photo.length - 1].file_id;
      await ctx.telegram.sendPhoto(groupChatId, photo, {
        caption,
        parse_mode: "HTML",
      });
    } else if (ctx.message.document) {
      const doc = ctx.message.document.file_id;
      await ctx.telegram.sendDocument(groupChatId, doc, {
        caption,
        parse_mode: "HTML",
      });
    } else {
      await ctx.telegram.sendMessage(groupChatId, caption, {
        parse_mode: "HTML",
      });
    }

    ctx.session.caseId = caseId;

    await ctx.reply("✅ Your report has been submitted successfully! \n\n" +
      `Your case ID is *${caseId}*. Please keep this for your records.\n` +
      "We will review your case and get back to you as soon as possible.",
      { parse_mode: "Markdown" });
    await ctx.scene.leave();
  } catch (err) {
    console.error("❌ Failed to forward report:", err);
    await ctx.reply(
      "❌ There was an error submitting your report. Please try again /start."
    );
  }
});






const stage = new Stage([
  storyScene,
  scamTypeScene,
  platformScene,
  amountScene,
  proofScene,
]);

bot.use(session());
bot.use(stage.middleware());

bot.start((ctx) => {
  if (!ctx.from.username) {
    return ctx.reply(
      `⚠️ You need to set a *Telegram username* in your profile before using this bot.\n\n` +
        `Go to *Telegram Settings* → *Edit Profile* → *Username*.\nOnce you've done that, come back and tap /start again.`,
      { parse_mode: "Markdown" }
    );
  }

  ctx.reply(
    `Welcome, ${ctx.from.first_name}! 👋\n\n` +
      "This bot is designed to assist you in recovering lost funds from scams. Please follow the prompts to provide the necessary information.",
    Markup.keyboard([
      ["Start Recovery"],
      ["Track My Case"],
      ["Contact Agent"],
    ]).resize()
  );
});

bot.hears("Start Recovery", (ctx) => ctx.scene.enter("storyScene"));

bot.hears("Track My Case", (ctx) => {
  if (ctx.session.caseId) {
    ctx.reply(
      `🧾 Your case ID is *${ctx.session.caseId}*\nPlease hold on while we investigate.`,
      { parse_mode: "Markdown" }
    );
  } else {
    ctx.reply("❗ You don’t have any active case in this session.");
  }
});

bot.hears("Contact Agent", (ctx) => {
  ctx.reply("👨‍💼 You can contact an agent at: @YourAgentUsername");
});

bot.command("track_case", (ctx) => {
  if (ctx.session.caseId) {
    ctx.reply(
      `🧾 Your case ID is *${ctx.session.caseId}*.\nPlease hold on while we process your report.`,
      `contact_agent`,
      { parse_mode: "Markdown" }

    );
  } else {
    ctx.reply("❗ You don’t have any active case in this session.");
  }
});

bot.launch(() => {
  
});

// bot.start((ctx) => {
//   const username = ctx.from.username;

//   if (!username) {
//     return ctx.reply(
//       `⚠️ You need to set a *Telegram username* in your profile before using this bot.\n\n` +
//         `Go to *Telegram Settings* → *Edit Profile* → *Username*.\nOnce you've done that, come back and tap /start again.`,
//       { parse_mode: "Markdown" }
//     );
//   }
//   ctx.reply(
//     `Welcome, ${ctx.from.first_name}! 👋\n\n` +
//       "This bot is designed to assist you in recovering lost funds from scams. Please follow the prompts to provide the necessary information.",
//     Markup.inlineKeyboard([
//       Markup.button.callback("Get Started", "start_recovery"),
//     ])
//   );
// });