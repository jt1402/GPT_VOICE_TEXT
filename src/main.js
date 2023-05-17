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

bot.command("new", async (ctx) => {
  ctx.session = INITIAL_SESSION;
  await ctx.reply("Waiting for your voice or text message");
});

bot.command("start", async (ctx) => {
  ctx.session = INITIAL_SESSION;
  await ctx.reply("Waiting for your voice or text message");
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
    await ctx.reply(code("Waiting for the answer from server side..."));
    const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);

    const oggPath = await ogg.create(link.href, userId);
    const mp3Path = await ogg.toMp3(oggPath, userId);

    const text = await openai.transcription(mp3Path);
    await ctx.reply(code(`Your promt:  ${text}`));

    ctx.session.messages.push({ role: openai.roles.USER, content: text });
    const response = await openai.chat(ctx.session.messages);
    ctx.session.messages.push({
      role: openai.roles.ASSISTANT,
      content: response.content,
    });

    await ctx.reply(response.content);
  } catch (error) {
    console.log("Error while listening", error.message);
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
    await ctx.reply(code("Waiting for the answer from server side..."));
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
    console.log("Error while listening", error.message);
  }
});
bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
