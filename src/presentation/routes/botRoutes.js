import { bot } from "../../infrastructure/telegram/bot.js";
import { PairProgrammingController } from "../controllers/PairProgrammingController.js";
import { MoonWalkController } from "../controllers/MoonWalkController.js";
import { HeadsUpController } from '../controllers/HeadsUpController.js';
import { GroupingController } from "../controllers/GroupingController.js";
import { AbsenteeController } from "../controllers/AbsenteeController.js";
import { AttendeeController } from "../controllers/AttendeeController.js";
import { AttendanceController } from "../controllers/AttendanceController.js";
import { StudentRepository } from "../../domain/repositories/StudentRepository.js";
import { SessionRepository } from "../../domain/repositories/SessionRepository.js";
import { RegistrationController } from "../controllers/RegistrationController.js";
import { LeetCodeAPI } from "../../infrastructure/leetcode/LeetCodeAPI.js";
import isUserAdmin from "../../utils/isUserAdmin.js";
import getTopicName from "../../utils/getTopicName.js";
// Instantiate dependencies
const studentRepository = new StudentRepository();
const sessionRepository = new SessionRepository();

// Initialize leetcode api
const leetCodeAPI = new LeetCodeAPI();

// Initialize controllers with all required dependencies
const headsUpController = new HeadsUpController();
const pairProgrammingController = new PairProgrammingController(studentRepository, sessionRepository, leetCodeAPI);
const moonWalkController = new MoonWalkController(studentRepository, sessionRepository);
const groupingController = new GroupingController();
const absenteeController = new AbsenteeController();
const attendeeController = new AttendeeController();
const attendanceController = new AttendanceController();
const registrationController = new RegistrationController();



const pendingPairProgramming = {};

/* === Message Handler for Heads Up Analysis ===
   Only messages posted in the "Heads Up" thread (359) are analyzed.
*/
// Handle new messages
bot.on("message", async (msg) => {
  await processMessage(msg);
});

// Handle edited messages
bot.on("edited_message", async (msg) => {
  await processMessage(msg);
});

// Common function to process both new and edited messages
async function processMessage(msg) {
  if (!msg.text) return;

  const chatId = msg.chat.id;
  const messageText = msg.text;
  const threadId = msg.message_thread_id;
  const topicName = await getTopicName(chatId, threadId);
  if (!topicName) return;

  if (messageText.startsWith("/")) {
    return;
  }

  // Heads Up messages are handled separately.
  if (topicName === "Heads Up") {
    try {
      const telegram_id = msg.from?.id;
      const response = await headsUpController.handleHeadsUp(chatId, messageText, telegram_id);
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
    // Verify that the sender is an admin.
    if (!(await isUserAdmin(chatId, msg.from.id))) {
      // Not authorized: delete the message and notify.
      await bot.deleteMessage(chatId, msg.message_id).catch(() => {});
      const sent = await bot.sendMessage(chatId, "Unauthorized action.", {
        message_thread_id: msg.message_thread_id,
      }).catch(() => {});
      setTimeout(() => {
        bot.deleteMessage(chatId, sent.message_id).catch(() => {});
      }, 5000);
      return;
    }

    const pending = pendingPairProgramming[chatId];
    delete pendingPairProgramming[chatId];

    // Delete both the current reply and the earlier prompt message.
    await Promise.all([
      bot.deleteMessage(chatId, msg.message_id).catch(() => {}),
      bot.deleteMessage(chatId, pending.promptMsgId).catch(() => {}),
    ]);

    // Split the incoming message by commas into an array of links.
    const links = messageText.split(",").map((link) => link.trim()).filter((link) => link);

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
}
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

    // Format each group with an appropriate bullet icon, submission time, and message.
    const excusedLines = excused.map(
      (sub) =>
      `🟢 [${new Date(sub.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}] ${sub.studentName}: ${sub.message || "No reason provided"}`
    );
    const unexcusedLines = unexcused.map(
      (sub) =>
      `🔴 [${new Date(sub.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}]${sub.studentName}: ${sub.message || "No reason provided"}`
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

// /start command handler to display a "Register" button.
bot.onText(/\/start(?: .+)?/, async (msg) => {
    await registrationController.startRegistration(msg);
});

// Registration command handler.
bot.onText(/\/register(?: .+)?/, async (msg) => {
  await registrationController.startRegistration(msg);
});

// Other command handlers...
bot.onText(/\/attendance(?: .+)?/, async (msg) => {
  await attendanceController.startAttendance(msg);
});

// Callback query handler for inline keyboard actions in grouping, absentee, and attendee.
bot.on("callback_query", async (query) => {
  if (query.data.startsWith("reg_")) {
    await registrationController.handleCallback(query);
    return;
  }

  // Attendance toggling and confirmation.
  if (query.data.startsWith("attd_toggle:") || query.data === "attd_confirm") {
    await attendanceController.handleCallback(query);
    return;
  }

  // Attendee toggling
  if (query.data.startsWith("att_toggle:") || query.data === "att_confirm") {
    await attendeeController.handleCallback(query);
    return;
  }

  // Absentee toggling
  if (query.data.startsWith("abs_toggle:") || query.data === "abs_confirm") {
    await absenteeController.handleCallback(query);
    return;
  }

  // Grouping toggling
  if (query.data.startsWith("toggle:") || query.data === "confirm") {
    await groupingController.handleCallback(query);
    return;
  }
});



