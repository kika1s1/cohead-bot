import { bot } from "../../infrastructure/telegram/bot.js";
import { StudentRepository } from "../../domain/repositories/StudentRepository.js";
import { HeadsUpSubmissionModel } from "../../infrastructure/database/mongoose/HeadsUpSubmissionModel.js";
import getTopicName from "../../utils/getTopicName.js";
import isUserAdmin from "../../utils/isUserAdmin.js";
import * as fuzzball from "fuzzball";

function isNameMatch(officialName, providedName) {
  const normalize = (str) => str.toLowerCase().trim();
  return fuzzball.token_set_ratio(normalize(officialName), normalize(providedName)) >= 85;
}

export class AbsenteeController {
  constructor() {
    this.studentRepository = new StudentRepository();
    // In-memory pending absentee state keyed by chat id.
    // Structure: { [chatId]: { group, threadId, adminId, activeStudents, selected: Set(), messageId } }
    this.pendingAbsentees = {};
  }

  /**
   * Starts the absentee marking process.
   * Fetches active students (those who did NOT submit Heads Up) and sends an inline keyboard
   * for the admin to toggle absentee selection.
   */
  async startAbsentee(msg) {
    const chatId = msg.chat.id;
    const threadId = msg.message_thread_id;
    const userId = msg.from.id; // store admin's userId

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

    // Fetch all students of the group.
    const students = await this.studentRepository.findByGroup(group);
    // Fetch today's Heads Up submissions.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const submissions = await HeadsUpSubmissionModel.find({
      group: group.toUpperCase(),
      submittedAt: { $gte: today }
    });
    const submittedNames = submissions.map(sub => sub.studentName);
    // Active students: those who did not submit a Heads Up.
    const activeStudents = students.filter(student =>
      !submittedNames.some(name => isNameMatch(student.name, name))
    );

    // Save pending state including admin's userId.
    this.pendingAbsentees[chatId] = {
      group,
      threadId,
      adminId: userId,
      activeStudents,
      selected: new Set(), // will store student _id strings marked as absent
      messageId: null,
    };

    const keyboard = this._buildKeyboard(
      this.pendingAbsentees[chatId].activeStudents,
      this.pendingAbsentees[chatId].selected
    );
    const sentMsg = await bot.sendMessage(
      chatId,
      `Select absent student(s) for ${group} by tapping on their name. When done, press <b>Confirm</b>.`,
      {
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: keyboard },
        message_thread_id: threadId,
      }
    );
    this.pendingAbsentees[chatId].messageId = sentMsg.message_id;
  }

  _buildKeyboard(activeStudents, selectedSet) {
    const buttons = activeStudents.map(student => {
      const text = selectedSet.has(String(student._id))
        ? `🔴 ${student.name}` // marked as absent
        : student.name;
      return [
        {
          text,
          callback_data: `abs_toggle:${student._id}`,
        }
      ];
    });
    // Add a confirm button.
    buttons.push([
      {
        text: "Confirm",
        callback_data: "abs_confirm",
      }
    ]);
    return buttons;
  }

  /**
   * Handles callback queries for absentee inline keyboard.
   */
  async handleCallback(query) {
    const data = query.data;
    const chatId = query.message.chat.id;
    const pending = this.pendingAbsentees[chatId];
    if (!pending) return;

    // Only the admin who started /absentee can interact
    if (query.from.id !== pending.adminId) {
      await bot.answerCallbackQuery(query.id, {
        text: "Unauthorized.",
        show_alert: true
      });
      return;
    }

    if (data.startsWith("abs_toggle:")) {
      const studentId = data.split(":")[1];
      if (pending.selected.has(studentId)) {
        pending.selected.delete(studentId);
      } else {
        pending.selected.add(studentId);
      }
      const keyboard = this._buildKeyboard(
        pending.activeStudents,
        pending.selected
      );
      await bot.editMessageReplyMarkup(
        { inline_keyboard: keyboard },
        {
          chat_id: chatId,
          message_id: pending.messageId,
          message_thread_id: pending.threadId,
        }
      );
      await bot.answerCallbackQuery(query.id);
    } else if (data === "abs_confirm") {
      await bot.answerCallbackQuery(query.id, { text: "Absentees confirmed" });
      // Delete the inline keyboard message.
      await bot.deleteMessage(chatId, pending.messageId).catch(() => {});
      await this.confirmAbsentee(chatId, pending.threadId);
      delete this.pendingAbsentees[chatId];
    }
  }

  /**
   * Once absentees are confirmed, creates Heads Up submission records for each
   * selected student with a message indicating that they did not write any Heads Up
   * and sets isExcused to false.
   * Then, sends a summary message listing the absent students.
   */
  async confirmAbsentee(chatId, threadId) {
    const pending = this.pendingAbsentees[chatId];
    if (!pending) return;
    const { group, activeStudents, selected, adminId } = pending;
    const absentStudents = activeStudents.filter(student =>
      selected.has(String(student._id))
    );

    if (absentStudents.length === 0) {
      const sentMsg = await bot.sendMessage(
        chatId,
        "No absentees were selected.",
        { message_thread_id: threadId }
      );
      setTimeout(async () => {
        await bot.deleteMessage(chatId, sentMsg.message_id).catch(() => {});
      }, 2000);
      return;
    }

    // For each absent student, create a Heads Up submission record that marks them as not excused.
    for (const student of absentStudents) {
      await HeadsUpSubmissionModel.create({
        studentName: student.name,
        group: group.toUpperCase(),
        message: "did not write any headsup",
        isExcused: false,
      });
    }

    // Build summary message.
    let summary = `<b>Absentees for ${group}</b>\n\n`;
    absentStudents.forEach(student => {
      summary += `🔴 ${student.name}\n`;
    });
    // Send the summary message to the admin (using adminId instead of chatId).
    await bot.sendMessage(adminId, summary, {
      parse_mode: "HTML"
    });
  }
}