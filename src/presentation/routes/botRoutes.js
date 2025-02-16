import { bot } from "../../infrastructure/telegram/bot.js";
import { PairProgrammingController } from "../controllers/PairProgrammingController.js";
import { MoonWalkController } from "../controllers/MoonWalkController.js";
import { StudentRepository } from "../../domain/repositories/StudentRepository.js";
import { SessionRepository } from "../../domain/repositories/SessionRepository.js";
import { LeetCodeAPI } from "../../infrastructure/leetcode/LeetCodeAPI.js";

// Helper to check admin rights
async function isUserAdmin(chatId, userId) {
  try {
    const admins = await bot.getChatAdministrators(chatId);
    return admins.some(admin => admin.user.id === userId);
  } catch (err) {
    console.error("Failed to get chat admins:", err);
    return false;
  }
}

// Initialize dependencies
const studentRepository = new StudentRepository();
const sessionRepository = new SessionRepository();
const leetCodeAPI = new LeetCodeAPI();

// Inject dependencies into controllers
const pairProgrammingController = new PairProgrammingController(
  studentRepository,
  sessionRepository,
  leetCodeAPI
);
const moonWalkController = new MoonWalkController(studentRepository, sessionRepository);

// Helper: Build inline keyboard for groups G61 to G69 (3×3 grid)
const buildGroupKeyboard = (prefix) => [
  [
    { text: "G61", callback_data: `${prefix}_G61` },
    { text: "G62", callback_data: `${prefix}_G62` },
    { text: "G63", callback_data: `${prefix}_G63` },
  ],
  [
    { text: "G64", callback_data: `${prefix}_G64` },
    { text: "G65", callback_data: `${prefix}_G65` },
    { text: "G66", callback_data: `${prefix}_G66` },
  ],
  [
    { text: "G67", callback_data: `${prefix}_G67` },
    { text: "G68", callback_data: `${prefix}_G68` },
    { text: "G69", callback_data: `${prefix}_G69` },
  ],
];

// In-memory state to track pending pair programming group selections and instruction messages
const pendingPairProgramming = {};
const pendingInstructionMessages = {};

// Handle /pair_programming command
bot.onText(/\/pair_programming(?: .+)?/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const threadId = msg.message_thread_id; // capture the topic ID

  if (!(await isUserAdmin(chatId, userId))) {
    bot.deleteMessage(chatId, msg.message_id).catch(() => {});
    return;
  }
  bot.deleteMessage(chatId, msg.message_id).catch(() => {});

  const keyboard = buildGroupKeyboard("group");
  await bot.sendMessage(chatId, "Please select a group for Pair Programming:", {
    reply_markup: { inline_keyboard: keyboard },
    parse_mode: "HTML",
    message_thread_id: threadId,
  });
});

// Handle /moon_walk command
bot.onText(/\/moon_walk(?: (.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const threadId = msg.message_thread_id; // capture the topic ID

  if (!(await isUserAdmin(chatId, userId))) {
    bot.deleteMessage(chatId, msg.message_id).catch(() => {});
    return;
  }
  bot.deleteMessage(chatId, msg.message_id).catch(() => {});

  if (!match[1]) {
    const keyboard = buildGroupKeyboard("moon");
    await bot.sendMessage(chatId, "Please select a group for Moon Walk:", {
      reply_markup: { inline_keyboard: keyboard },
      parse_mode: "HTML",
      message_thread_id: threadId,
    });
    return;
  }

  const group = match[1].trim();
  if (!group) {
    await bot.sendMessage(chatId, 'Please provide the group. (Format: /moon_walk G61)', {
      parse_mode: 'HTML',
      message_thread_id: threadId,
    });
    return;
  }

  try {
    await moonWalkController.execute(chatId, group, threadId);
  } catch (error) {
    await bot.sendMessage(chatId, `Error: ${error.message}`, { message_thread_id: threadId });
  }
});

// Callback query handler for inline keyboard selections
bot.on("callback_query", async (callbackQuery) => {
  const { message, data, id, from } = callbackQuery;
  const chatId = message.chat.id;
  const threadId = message.message_thread_id; // capture the topic ID

  if (!(await isUserAdmin(chatId, from.id))) {
    await bot.deleteMessage(chatId, message.message_id).catch(() => {});
    return;
  }

  await bot.answerCallbackQuery(id);

  if (data.startsWith("group_")) {
    const group = data.split("_")[1];
    await bot.deleteMessage(chatId, message.message_id).catch(() => {});
    pendingPairProgramming[chatId] = group;
    const instructionMsg = await bot.sendMessage(
      chatId,
      `You selected group <b>${group}</b>.\nNow please provide the LeetCode question details in a comma-separated format, where each question is formatted as:\n\n<b>two sum, Add Two Numbers, Zigzag Conversion</b>`,
      {
        parse_mode: "HTML",
        message_thread_id: threadId,
      }
    );
    pendingInstructionMessages[chatId] = instructionMsg.message_id;
  } else if (data.startsWith("moon_")) {
    const group = data.split("_")[1];
    await bot.deleteMessage(chatId, message.message_id).catch(() => {});
    try {
      await moonWalkController.execute(chatId, group, threadId);
    } catch (error) {
      await bot.sendMessage(chatId, `Error: ${error.message}`, { message_thread_id: threadId });
    }
  }
});

// Listen for plain text messages to capture pending LeetCode question details for Pair Programming
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const threadId = msg.message_thread_id; // capture the topic ID

  if (!msg.text || msg.text.startsWith("/")) return;

  if (pendingPairProgramming[chatId]) {
    const group = pendingPairProgramming[chatId];
    delete pendingPairProgramming[chatId];

    const entries = msg.text.split(",");
    const questionDetails = entries
      .map(entry => {
        const title = entry.trim().replace(/[.,]$/, '');
        return { title };
      })
      .filter(q => q.title);

    try {
      await pairProgrammingController.execute(chatId, group, questionDetails, threadId);
      await bot.deleteMessage(chatId, msg.message_id).catch(() => {});
      if (pendingInstructionMessages[chatId]) {
        await bot.deleteMessage(chatId, pendingInstructionMessages[chatId]).catch(() => {});
        delete pendingInstructionMessages[chatId];
      }
    } catch (error) {
      await bot.sendMessage(chatId, `Error: ${error.message}`, { message_thread_id: threadId });
      await bot.deleteMessage(chatId, msg.message_id).catch(() => {});
      if (pendingInstructionMessages[chatId]) {
        await bot.deleteMessage(chatId, pendingInstructionMessages[chatId]).catch(() => {});
        delete pendingInstructionMessages[chatId];
      }
    }
  }
});