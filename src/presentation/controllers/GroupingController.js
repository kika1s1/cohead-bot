import { bot } from "../../infrastructure/telegram/bot.js";
import { HeadsUpSubmissionModel } from "../../infrastructure/database/mongoose/HeadsUpSubmissionModel.js";
import { StudentRepository } from "../../domain/repositories/StudentRepository.js";
import { Grouping } from "../../application/use-cases/Grouping.js";
import { SessionRepository } from "../../domain/repositories/SessionRepository.js";
import getTopicName from "../../utils/getTopicName.js";
import isUserAdmin from "../../utils/isUserAdmin.js";
import isNameMatch from "../../utils/isNameMatch.js";
export class GroupingController {
  constructor() {
    this.studentRepository = new StudentRepository();
    this.sessionRepository = new SessionRepository();
    this.groupingUseCase = new Grouping(this.studentRepository, this.sessionRepository);
    // In-memory pending grouping state keyed by chat id.
    // Structure: { [chatId]: { group, threadId, activeStudents, selected: Set(), messageId } }
    this.pendingGroupings = {};
  }

  /**
   * Starts the grouping process.
   * Fetches active students (those who did not submit Heads Up) and sends an inline keyboard
   * for the admin to toggle leader selection.
   */
  async startGrouping(msg) {
    const chatId = msg.chat.id;
    const threadId = msg.message_thread_id;
    const userId = msg.from.id;
    
    // Check admin rights.
    if (!(await isUserAdmin(chatId, userId))) {
      await bot.deleteMessage(chatId, msg.message_id).catch(() => {});
      return;
    }
    // Delete the admin's command message.
    await bot.deleteMessage(chatId, msg.message_id).catch(() => {});
    
    const group = await getTopicName(chatId, threadId);
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
    // Save adminId here:
    this.pendingGroupings[chatId] = {
      group,
      threadId,
      adminId: userId,   // <-- store the issuing admin’s userId
      activeStudents: [],
      selected: new Set(),
      messageId: null,
    };

    // Fetch all students in the group.
    const students = await this.studentRepository.findByGroup(group);
    // Fetch today's Heads-Up submissions.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const submissions = await HeadsUpSubmissionModel.find({
      group: group.toUpperCase(),
      submittedAt: { $gte: today },
      checkOut:false
    });
    const submissionNames = submissions.map((sub) => sub.studentName);
    // Filter out students who submitted Heads Up.
    const activeStudents = students.filter((student) => {
      return !submissionNames.some((subName) => isNameMatch(student.name, subName));
    });
    
    // Save pending grouping state.
    this.pendingGroupings[chatId] = {
      group,
      threadId,
      adminId: userId,
      activeStudents,
      selected: new Set(), // will store student _id strings for potential leaders
      messageId: null,
    };

    // Send inline keyboard message to let admin select leaders.
    const keyboard = this._buildKeyboard(this.pendingGroupings[chatId].activeStudents, this.pendingGroupings[chatId].selected);
    const sentMsg = await bot.sendMessage(
      chatId,
      `Select group leader(s) for ${group} by tapping on their name. When done, press <b>Confirm</b>.`,
      {
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: keyboard },
        message_thread_id: threadId,
      }
    );
    // Save the message id to update later.
    this.pendingGroupings[chatId].messageId = sentMsg.message_id;
  }

  // Build inline keyboard where each button represents an active student.
  _buildKeyboard(activeStudents, selectedSet) {
    // Build an array of buttons (each row one button).
    const buttons = activeStudents.map((student) => {
      const text = selectedSet.has(String(student._id))
        ? `✅ ${student.name}`
        : student.name;
      return [
        {
          text,
          callback_data: `toggle:${student._id}`,
        },
      ];
    });
    // Add a confirm button in a separate row.
    buttons.push([
      {
        text: "Confirm",
        callback_data: "confirm",
      },
    ]);
    return buttons;
  }

  /**
   * Handles callback queries from the inline keyboard for grouping.
   * Toggles selection or confirms leader selection.
   */
  async handleCallback(query) {
    const data = query.data;
    const chatId = query.message.chat.id;
    const pending = this.pendingGroupings[chatId];
    if (!pending) return; // No pending grouping in this chat.
    // Only the admin who started /grouping can interact
    
    if (query.from.id !== pending.adminId) {
      await bot.answerCallbackQuery(query.id, {
        text: "Unauthorized.",
        show_alert: true,
      });
      return;
    }
    
    if (data.startsWith("toggle:")) {
      const studentId = data.split(":")[1];
      // Toggle selection.
      if (pending.selected.has(studentId)) {
        pending.selected.delete(studentId);
      } else {
        pending.selected.add(studentId);
      }
      // Update the inline keyboard.
      const keyboard = this._buildKeyboard(pending.activeStudents, pending.selected);
      await bot.editMessageReplyMarkup(
        { inline_keyboard: keyboard },
        { chat_id: chatId, message_id: pending.messageId, message_thread_id: pending.threadId }
      );
      await bot.answerCallbackQuery(query.id);
    } else if (data === "confirm") {
      // Confirm selection.
      await bot.answerCallbackQuery(query.id, { text: "Leaders confirmed" });
      // Delete the inline keyboard message.
      await bot.deleteMessage(chatId, pending.messageId).catch(() => {});
      // Proceed with grouping.
      await this.confirmGrouping(chatId, pending.threadId);
      // Remove pending state.
      delete this.pendingGroupings[chatId];
    }
  }

  /**
   * Once leaders are confirmed, performs grouping:
   * Takes the selected leaders, removes them from active students,
   * and distributes all remaining active students among the selected leaders.
   * Sends the grouping result.
   */
  async confirmGrouping(chatId, threadId) {
    const pending = this.pendingGroupings[chatId];
    if (!pending) return;
    const { group, activeStudents, selected } = pending;
    // Get chosen leaders from activeStudents whose _id is in "selected".
    const chosenLeaders = activeStudents.filter((student) =>
      selected.has(String(student._id))
    );
    if (chosenLeaders.length === 0) {
      await bot.sendMessage(chatId, "No group leaders were selected.", { message_thread_id: threadId });
      return;
    }
    // Remove chosen leaders from activeStudents.
    const remainingStudents = activeStudents.filter(
      (student) => !selected.has(String(student._id))
    );
    // Execute grouping use-case: distribute all remaining students evenly among the chosen leaders.
    const groups = await this.groupingUseCase.execute(group, chosenLeaders, remainingStudents);
    // Build response message.
    let responseMessage = `<b>Grouping for ${group}</b>\n\n`;
    groups.forEach((grp, index) => {
      responseMessage += `<b>Group ${index + 1}:</b>\n`;
      grp.forEach((member) => {
        if (chosenLeaders.some((leader) => leader._id.equals(member._id))) {
          responseMessage += `${member.name}\n`;
        } else {
          responseMessage += `${member.name}\n`;
        }
      });
      responseMessage += `\n`;
    });
    await bot.sendMessage(chatId, responseMessage, { parse_mode: "HTML", message_thread_id: threadId });
  }
}

