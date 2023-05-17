import { Telegraf, session } from "telegraf";
import { message } from "telegraf/filters";
import config from "config";
import { code } from "telegraf/format";
import { ogg } from "./ogg.js";
import { openai } from "./openai.js";

const bot = new Telegraf(config.get("TELEGRAM_TOKEN"));

bot.use(session());

const INITIAL_SESSION = {
  messages: [],
};

bot.command("help", async (ctx) => {
  ctx.session = INITIAL_SESSION;
  await ctx.reply(
    " - Interact with the bot using text messages or by sending voice messages.\n - For text-based chat, simply type your message and press Enter.\n - To send a voice message, click the microphone icon in the Telegram chat input area and speak your message.\n - The bot will respond accordingly to your messages, providing engaging and human-like responses.\n - To start a new session, use the /new command.\n - For instructions, use the /help command."
  );
});

bot.command("new", async (ctx) => {
  ctx.session = INITIAL_SESSION;
  await ctx.reply("New session created. Waiting for your message...");
});

bot.command("start", async (ctx) => {
  ctx.session = INITIAL_SESSION;
  await ctx.reply(
    "Introducing  JT's GPT bot! 🤖✨\n📱 Send  messages to chat with the bot.\n💬 Get interactive and engaging responses.\n🤝 Enjoy a human-like conversation experience.\nGet started now! 🚀"
  );
});

bot.on(message("voice"), async (ctx) => {
  ctx.session ??= INITIAL_SESSION;
  try {
    const userId = String(ctx.message.from.id);

    // Add the user authorization validation
    if (userId !== "964403295") {
      await ctx.reply(
        "Sorry, you are not authorized to use this bot. hahah)) Get fucked"
      );
      return;
    }
    await ctx.reply(code("Awaiting server response..."));
    const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);

    const oggPath = await ogg.create(link.href, userId);
    const mp3Path = await ogg.toMp3(oggPath, userId);

    const text = await openai.transcription(mp3Path);
    await ctx.reply(code(`Provided response:  ${text}`));

    ctx.session.messages.push({ role: openai.roles.USER, content: text });
    const response = await openai.chat(ctx.session.messages);
    ctx.session.messages.push({
      role: openai.roles.ASSISTANT,
      content: response.content,
    });

    await ctx.reply(response.content);
  } catch (error) {
    console.log("Error while listening: ", error.message);
  }
});

//text version
bot.on(message("text"), async (ctx) => {
  ctx.session ??= INITIAL_SESSION;
  try {
    const userId = String(ctx.message.from.id);

    // Add the user authorization validation
    if (userId !== "964403295") {
      await ctx.reply(
        "Sorry, you are not authorized to use this bot. hahah)) Get fucked"
      );
      return;
    }
    await ctx.reply(code("Awaiting server response..."));
    ctx.session.messages.push({
      role: openai.roles.USER,
      content: ctx.message.text,
    });
    const response = await openai.chat(ctx.session.messages);
    ctx.session.messages.push({
      role: openai.roles.ASSISTANT,
      content: response.content,
    });

    await ctx.reply(response.content);
  } catch (error) {
    console.log("Error while listening: ", error.message);
  }
});
bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
