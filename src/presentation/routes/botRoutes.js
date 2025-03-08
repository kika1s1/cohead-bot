import { bot } from "../../infrastructure/telegram/bot.js";
import { PairProgrammingController } from "../controllers/PairProgrammingController.js";
import { MoonWalkController } from "../controllers/MoonWalkController.js";
import { HeadsUpController } from '../controllers/HeadsUpController.js';
import { GroupingController } from "../controllers/groupingController.js";
import { AbsenteeController } from "../controllers/AbsenteeController.js";
import { StudentRepository } from "../../domain/repositories/StudentRepository.js";
import { SessionRepository } from "../../domain/repositories/SessionRepository.js";
import { LeetCodeAPI } from "../../infrastructure/leetcode/LeetCodeAPI.js";
import getTopicName from "../../utils/getTopicName.js";
import isUserAdmin from "../../utils/isUserAdmin.js";
import { AttendeeController } from "../controllers/AttendeeController.js";

// Instantiate dependencies
const studentRepository = new StudentRepository();
const sessionRepository = new SessionRepository();
const leetCodeAPI = new LeetCodeAPI();

// Initialize controllers with all required dependencies
const headsUpController = new HeadsUpController();
const pairProgrammingController = new PairProgrammingController(studentRepository, sessionRepository, leetCodeAPI);
const moonWalkController = new MoonWalkController(studentRepository, sessionRepository);
const groupingController = new GroupingController();
const absenteeController = new AbsenteeController();
const attendeeController = new AttendeeController();

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
  // console.log(threadId)
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
  // console.log("Group:", group);
  
  if (!group || group === "Heads Up") {
    // Send error message, delete both command and error shortly after.
    const sentMessage = await bot.sendMessage(
      chatId,
      "This command cannot be used here check where you are! ",
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
    `Group ${group}: Please provide comma-separated questions links.\nExample:https://leetcode.com/problems/letter-tile-possibilities/description,https://leetcode.com/problems/two-sum/description`,
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
  // console.log(chatId, userId, threadId)
  
  if (!(await isUserAdmin(chatId, userId))) {
    await bot.deleteMessage(chatId, msg.message_id).catch(() => {});
    return;
  }
  // // Delete the original command message immediately.
  await bot.deleteMessage(chatId, msg.message_id).catch(() => {});
  // console.log(chatId, threadId)
  
  const group = await getTopicName(chatId, threadId);
  // console.log("Group:", group);
  console.log(group)
  if (!group || group === "Heads Up") {
    // Send error message, delete both command and error shortly after.
    const sentMessage = await bot.sendMessage(
      chatId,
      "This command cannot be used here check where you are! ",
      { message_thread_id: threadId }
    );
    await bot.deleteMessage(chatId, msg.message_id).catch(() => {});
    
    setTimeout(async () => {
      await bot.deleteMessage(chatId, sentMessage.message_id).catch(() => {});
    }, 1000);
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
  
  await bot.deleteMessage(chatId, msg.message_id).catch(() => {});
  if (!(await isUserAdmin(chatId, userId))) {
    await bot.deleteMessage(chatId, msg.message_id).catch(() => {});
    return;
  }

  const group = await getTopicName(chatId, threadId);
  if (!group || group === "Heads Up") {
    const sentMessage = await bot.sendMessage(
      chatId,
      "This command cannot be used here check where you are! ",
      { message_thread_id: threadId }
    );
    await bot.deleteMessage(chatId, msg.message_id).catch(() => {});
    setTimeout(async () => {
      await bot.deleteMessage(chatId, sentMessage.message_id).catch(() => {});
    }, 1000);
    return;
  }

  try {
    // Retrieve all Heads-Up submissions for the current day.
    const submissions = await headsUpController.getTodaysSubmissions();
    // Filter the submissions to include only those from this group.
    const filteredSubmissions = submissions.filter(
      (submission) => submission.group === group
    );

    // Separate into two arrays: excused (true) and unexcused (false).
    const excused = filteredSubmissions.filter((sub) => sub.isExcused);
    const unexcused = filteredSubmissions.filter((sub) => !sub.isExcused);

    // Format each group with an appropriate bullet icon and message.
    const excusedLines = excused.map(
      (sub) => `🟢 ${sub.studentName}: ${sub.message || "No reason provided"}`
    );
    const unexcusedLines = unexcused.map(
      (sub) => `🔴 ${sub.studentName}: ${sub.message || "No reason provided"}`
    );

    const formattedDate = new Date().toLocaleDateString();
    let summary = `Heads-Up submissions for ${group} on ${formattedDate}:\n\n`;

    if (excusedLines.length) {
      summary += `*Excused*:\n${excusedLines.join("\n")}\n\n`;
    }
    if (unexcusedLines.length) {
      summary += `*Unexcused*:\n${unexcusedLines.join("\n")}\n\n`;
    }
    
    // Final total count
    summary += `Total: ${filteredSubmissions.length}`;

    // Send the summary as a private message to the user (admin).
    await bot.sendMessage(userId, summary, { parse_mode: "Markdown" });
  } catch (error) {
    await bot.sendMessage(chatId, `Error: ${error.message}`, {
      message_thread_id: threadId,
    });
  }
});

/* === /Grouping Command Handler ===
   When the /grouping command is issued, the bot starts an interactive selection
   of active students (those who did not submit Heads Up) as potential group leaders.
*/
bot.onText(/\/grouping(?: .+)?/, async (msg) => {
  await groupingController.startGrouping(msg);
});

/* === /absentee Command Handler ===
   When the /absentee command is issued, the bot starts an interactive selection
   of active students (those who did not submit Heads Up) for marking absentees.
*/
bot.onText(/\/absentee(?: .+)?/, async (msg) => {
  await absenteeController.startAbsentee(msg);
});

/* === /attendee Command Handler ===
   When the /attendee command is issued, the bot starts an interactive selection
   of active students (those who did not submit Heads Up) for marking attendees.
*/
bot.onText(/\/attendee(?: .+)?/, async (msg) => {
  await attendeeController.startAttendee(msg);
});

// Callback query handler for inline keyboard actions in grouping, absentee, and attendee.
bot.on("callback_query", async (query) => {
  // Attendee toggling
  if (query.data.startsWith("att_toggle:") || query.data === "att_confirm") {
    await attendeeController.handleCallback(query);
  }

  // Absentee toggling
  if (query.data.startsWith("abs_toggle:") || query.data === "abs_confirm") {
    await absenteeController.handleCallback(query);
  }

  // Grouping toggling
  if (query.data.startsWith("toggle:") || query.data === "confirm") {
    await groupingController.handleCallback(query);
  }
});


