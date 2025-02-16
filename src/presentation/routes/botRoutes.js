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

// Handle /pair_programming command: always prompt for group selection
bot.onText(/\/pair_programming(?: .+)?/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  // If sender is not an admin, delete the command and exit.
  if (!(await isUserAdmin(chatId, userId))) {
    bot.deleteMessage(chatId, msg.message_id).catch(() => {});
    return;
  }

  // Delete the admin's command message
  bot.deleteMessage(chatId, msg.message_id).catch(() => {});

  // Always prompt group selection (ignore any parameters)
  const keyboard = buildGroupKeyboard("group");
  await bot.sendMessage(
    chatId,
    "Please select a group for Pair Programming:",
    { reply_markup: { inline_keyboard: keyboard }, parse_mode: "HTML" }
  );
});

// Handle /moon_walk command (optional parameters)
bot.onText(/\/moon_walk(?: (.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  // If sender is not an admin, delete their command message and exit.
  if (!(await isUserAdmin(chatId, userId))) {
    bot.deleteMessage(chatId, msg.message_id).catch(() => {});
    return;
  }

  // Delete the admin's command message
  bot.deleteMessage(chatId, msg.message_id).catch(() => {});

  // If no parameters provided, prompt group selection
  if (!match[1]) {
    const keyboard = buildGroupKeyboard("moon");
    await bot.sendMessage(
      chatId,
      "Please select a group for Moon Walk:",
      {
        reply_markup: { inline_keyboard: keyboard },
        parse_mode: "HTML",
      }
    );
    return;
  }

  // If parameter provided, expect a simple group (e.g., "G61")
  const group = match[1].trim();
  if (!group) {
    await bot.sendMessage(chatId, 'Please provide the group. (Format: /moon_walk G61)', { parse_mode: 'HTML' });
    return;
  }

  try {
    await moonWalkController.execute(chatId, group);
  } catch (error) {
    await bot.sendMessage(chatId, `Error: ${error.message}`);
  }
});

// Callback query handler for inline keyboard selections
bot.on("callback_query", async (callbackQuery) => {
  const { message, data, id, from } = callbackQuery;
  const chatId = message.chat.id;

  // If sender is not an admin, delete the callback message and exit.
  if (!(await isUserAdmin(chatId, from.id))) {
    await bot.deleteMessage(chatId, message.message_id).catch(() => {});
    return;
  }

  await bot.answerCallbackQuery(id);

  if (data.startsWith("group_")) {
    // For pair programming, store the selected group.
    const group = data.split("_")[1];
    await bot.deleteMessage(chatId, message.message_id).catch(() => {});
    pendingPairProgramming[chatId] = group;
    // Send the instruction message and store its message id.
    const instructionMsg = await bot.sendMessage(
      chatId,
      `You selected group <b>${group}</b>.\nNow please provide the LeetCode question details in a comma-separated format, where each question is formatted as:\n\n<b>two sum, Add Two Numbers, Zigzag Conversion</b>`,
      { parse_mode: "HTML" }
    );
    pendingInstructionMessages[chatId] = instructionMsg.message_id;
  } else if (data.startsWith("moon_")) {
    // For moon walk, execute immediately.
    const group = data.split("_")[1];
    await bot.deleteMessage(chatId, message.message_id).catch(() => {});
    try {
      await moonWalkController.execute(chatId, group);
    } catch (error) {
      await bot.sendMessage(chatId, `Error: ${error.message}`);
    }
  }
});

// Listen for plain text messages to capture pending LeetCode question details for Pair Programming
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  // Skip commands and non-text messages.
  if (!msg.text || msg.text.startsWith("/")) return;

  if (pendingPairProgramming[chatId]) {
    const group = pendingPairProgramming[chatId];
    delete pendingPairProgramming[chatId];

    // Split input by commas; each entry is expected to be a question title.
    const entries = msg.text.split(",");
    const questionDetails = entries
      .map(entry => {
        const title = entry.trim().replace(/[.,]$/, '');
        return { title };
      })
      .filter(q => q.title);

    try {
      // Execute pair programming; expect that the controller sends the final pairing message.
      await pairProgrammingController.execute(chatId, group, questionDetails);
      // Delete the admin's message containing the question details.
      await bot.deleteMessage(chatId, msg.message_id).catch(() => {});
      // Delete the instructional message that was sent after group selection.
      if (pendingInstructionMessages[chatId]) {
        await bot.deleteMessage(chatId, pendingInstructionMessages[chatId]).catch(() => {});
        delete pendingInstructionMessages[chatId];
      }
    } catch (error) {
      await bot.sendMessage(chatId, `Error: ${error.message}`);
      // On error, delete both the input and instruction messages.
      await bot.deleteMessage(chatId, msg.message_id).catch(() => {});
      if (pendingInstructionMessages[chatId]) {
        await bot.deleteMessage(chatId, pendingInstructionMessages[chatId]).catch(() => {});
        delete pendingInstructionMessages[chatId];
      }
    }
  }
});