import { bot } from "../../infrastructure/telegram/bot.js";
import { PairProgrammingController } from "../controllers/PairProgrammingController.js";
import { MoonWalkController } from "../controllers/MoonWalkController.js";
import { HeadsUpController } from '../controllers/HeadsUpController.js';
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

// Instantiate dependencies
const studentRepository = new StudentRepository();
const sessionRepository = new SessionRepository();
const leetCodeAPI = new LeetCodeAPI();

// Initialize controllers with all required dependencies
const headsUpController = new HeadsUpController();
const pairProgrammingController = new PairProgrammingController(studentRepository, sessionRepository, leetCodeAPI);
const moonWalkController = new MoonWalkController(studentRepository, sessionRepository);

// Helper to get topic (group) name by thread ID using fixed mappings
async function getTopicName(chatId, threadId) {
  try {
    const mapping = {
      255: "G69",
      359: "Heads Up",
      281: "G61",
      518:"G68"
    };
    return mapping[threadId] || `G6(${threadId})`;
  } catch (err) {
    console.error("Failed to get topic name:", err);
    return null;
  }
}

// In-memory state for pending pair programming messages.
// Instead of storing just a group string, we store an object:
// { group: string, promptMsgId: number }
const pendingPairProgramming = {};

/* === Message Handler for Heads Up Analysis ===
   Only messages posted in the "Heads Up" thread (359) are analyzed.
*/
bot.on("message", async (msg) => {
  if (!msg.text) return;
  
  const chatId = msg.chat.id;
  const messageText = msg.text;
  const threadId = msg.message_thread_id;
  console.log(threadId)
  const topicName = await getTopicName(chatId, threadId);
  if (!topicName) return;
  
  // Heads Up messages are handled separately.
  if (topicName === "Heads Up") {
    try {
      const response = await headsUpController.handleHeadsUp(chatId, messageText);
      if (response) {
        await bot.sendMessage(chatId, response, {
          reply_to_message_id: msg.message_id,
          message_thread_id: threadId,
        });
      }
    } catch (error) {
      console.error("Heads Up handling error:", error.message);
    }
  }
  
  // Process pending pair programming question details.
  // We expect the admin’s reply (comma-separated links) to follow the command prompt.
  if (pendingPairProgramming[chatId]) {
    const pending = pendingPairProgramming[chatId];
    delete pendingPairProgramming[chatId];
    
    // Delete the admin's details message (current msg) and the earlier prompt message.
    await Promise.all([
      bot.deleteMessage(chatId, msg.message_id).catch(() => {}),
      bot.deleteMessage(chatId, pending.promptMsgId).catch(() => {})
    ]);
    
    // Split the incoming message by commas into an array of links.
    const links = messageText.split(",").map(link => link.trim()).filter(link => link);
    
    try {
      // Fetch questions, generating titles from the links.
      const questions = await leetCodeAPI.fetchQuestions(links);
      // Process pair programming pairing with the questions.
      await pairProgrammingController.execute(chatId, pending.group, questions, threadId);
    } catch (error) {
      await bot.sendMessage(chatId, `Error: ${error.message}`, {
        message_thread_id: threadId,
      });
    }
  }
});

/* === /pair_programming Command Handler ===
   Restricted to admins. The bot uses the thread ID mapping to determine the group.
   If the command is used in the Heads Up topic, an error message is sent then deleted.
*/
bot.onText(/\/pair_programming(?: .+)?/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const threadId = msg.message_thread_id;
  
  if (!(await isUserAdmin(chatId, userId))) {
    await bot.deleteMessage(chatId, msg.message_id).catch(() => {});
    return;
  }
  
  const group = await getTopicName(chatId, threadId);
  console.log("Group:", group);
  
  if (!group || group === "Heads Up") {
    // Send error message, delete both command and error shortly after.
    const sentMessage = await bot.sendMessage(
      chatId,
      "This command cannot be used in the Heads Up topic.",
      { message_thread_id: threadId }
    );
    await bot.deleteMessage(chatId, msg.message_id).catch(() => {});
    
    setTimeout(async () => {
      await bot.deleteMessage(chatId, sentMessage.message_id).catch(() => {});
    }, 500);
    return;
  }
  
  // Delete the admin's command message.
  await bot.deleteMessage(chatId, msg.message_id).catch(() => {});
  
  // Prompt admin for LeetCode question details (links separated by commas).
  const promptMsg = await bot.sendMessage(
    chatId,
    `Group ${group}: Please provide the LeetCode question details as comma-separated links.\nExample:`,
    {
      parse_mode: "HTML",
      message_thread_id: threadId,
    }
  );
  
  // Save the pending state including the group and the prompt message ID.
  pendingPairProgramming[chatId] = { group, promptMsgId: promptMsg.message_id };
});

/* === /moon_walk Command Handler ===
   Restricted to admins. The bot uses the thread ID mapping to determine the group.
*/
bot.onText(/\/moon_walk(?: .+)?/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const threadId = msg.message_thread_id;
  
  if (!(await isUserAdmin(chatId, userId))) {
    await bot.deleteMessage(chatId, msg.message_id).catch(() => {});
    return;
  }
  // Delete the original command message immediately.
  await bot.deleteMessage(chatId, msg.message_id).catch(() => {});
  
  const group = await getTopicName(chatId, threadId);
  if (!group || group === "Heads Up") {
    await bot.sendMessage(chatId, "This command cannot be used in the Heads Up topic.", {
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


/* === /excused Command Handler ===
  Restricted to admins. The bot uses the thread ID mapping to determine the group.
*/
bot.onText(/\/excused(?: .+)?/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const threadId = msg.message_thread_id;

  if (!(await isUserAdmin(chatId, userId))) {
   await bot.deleteMessage(chatId, msg.message_id).catch(() => {});
   return;
  }
  await bot.deleteMessage(chatId, msg.message_id).catch(() => {});

  const group = await getTopicName(chatId, threadId);
  if (!group || !["G61", "G63", "G68", "G69"].includes(group)) {
    await bot.sendMessage(userId, "This command can only be used in G61 or G63 topics.");
    await bot.deleteMessage(chatId, msg.message_id).catch(() => {});
    return;
  }

  try {
   // Retrieve all Heads-Up submissions for the current day.
   const submissions = await headsUpController.getTodaysSubmissions();

   // Filter the submissions to include only students from the specified group.
   const filteredSubmissions = submissions.filter(submission => submission.group === group);

   // Extract the names of the students who submitted their Heads-Up responses.
   const studentNames = filteredSubmissions.map(submission => submission.studentName);

   // Compile a summary, listing the names of students from that group who wrote a Heads-Up.
  const formattedDate = new Date().toLocaleDateString();
  const summary = `Heads-Up submissions for ${group} on ${formattedDate}:\n` + studentNames.join("\n");

   // Send the summary and the final count of the total number of students from that group who submitted their Heads-Up for the day.
  await bot.sendMessage(userId, `${summary}\n\nTotal: ${studentNames.length}`);
  } catch (error) {
   await bot.sendMessage(chatId, `Error: ${error.message}`, { message_thread_id: threadId });
  }
});
