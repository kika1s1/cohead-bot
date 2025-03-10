import { bot } from "../../infrastructure/telegram/bot.js";
import { StudentRepository } from "../../domain/repositories/StudentRepository.js";
import { HeadsUpSubmissionModel } from "../../infrastructure/database/mongoose/HeadsUpSubmissionModel.js";
import getTopicName from "../../utils/getTopicName.js";
import isUserAdmin from "../../utils/isUserAdmin.js";

export class AttendanceController {
  constructor() {
    this.studentRepository = new StudentRepository();
    // In-memory state: { [chatId]: { group, threadId, adminId, students, selected: Set(), messageId } }
    this.pendingAttendance = {};
  }

  /**
   * /attendance command handler.
   * Fetches all students in the current group and sends an inline keyboard
   * where each student can be toggled (selected/unselected). Only the initiating admin can interact.
   */
  async startAttendance(msg) {
    const chatId = msg.chat.id;
    const threadId = msg.message_thread_id;
    const adminId = msg.from.id;

    // Verify that the sender is an admin.
    if (!(await isUserAdmin(chatId, adminId))) {
      await bot.deleteMessage(chatId, msg.message_id).catch(() => {});
      return;
    }
    await bot.deleteMessage(chatId, msg.message_id).catch(() => {});

    const group = await getTopicName(chatId, threadId);
    if (!group || group === "Heads Up") {
      const errMsg = await bot.sendMessage(
        chatId,
        "This command cannot be used here. Check your topic.",
        { message_thread_id: threadId }
      );
      setTimeout(async () => {
        await bot.deleteMessage(chatId, errMsg.message_id).catch(() => {});
      }, 1000);
      return;
    }

    // Fetch all students in the specified group.
    const students = await this.studentRepository.findByGroup(group);

    // Save pending state.
    this.pendingAttendance[chatId] = {
      group,
      threadId,
      adminId,
      students,
      selected: new Set(), // holds student IDs as strings
      messageId: null
    };

    const keyboard = this._buildKeyboard(students, this.pendingAttendance[chatId].selected);
    const sentMsg = await bot.sendMessage(
      chatId,
      `Select student(s) to view detailed Heads-Up submissions:\nTap to toggle selection (✅ = selected) then press <b>Confirm</b>.`,
      {
        reply_markup: { inline_keyboard: keyboard },
        message_thread_id: threadId,
        parse_mode: "HTML"
      }
    );
    this.pendingAttendance[chatId].messageId = sentMsg.message_id;
  }

  /**
   * Build an inline keyboard for attendance.
   * Each student's button is prefixed with a checkmark (✅) if selected.
   * Adds a "Confirm" button at the bottom.
   */
  _buildKeyboard(students, selectedSet) {
    const buttons = students.map(student => {
      const studentId = student._id.toString();
      const text = selectedSet.has(studentId) ? `✅ ${student.name}` : student.name;
      return [{
        text,
        callback_data: `attd_toggle:${studentId}`
      }];
    });
    // Append a confirm button.
    buttons.push([{
      text: "Confirm",
      callback_data: "attd_confirm"
    }]);
    return buttons;
  }

  /**
   * Handles callback queries for the attendance inline keyboard.
   * - On "attd_toggle:<studentId>" it toggles selection.
   * - On "attd_confirm", it deletes the inline keyboard and
   *   retrieves and sends detailed Heads-Up submissions (sorted newest first)
   *   for all selected students to the admin privately.
   */
  async handleCallback(query) {
    const data = query.data;
    const chatId = query.message.chat.id;
    const pending = this.pendingAttendance[chatId];
    if (!pending) return;

    // Ensure only the admin who initiated the command can interact.
    if (query.from.id !== pending.adminId) {
      await bot.answerCallbackQuery(query.id, {
        text: "Unauthorized.",
        show_alert: true
      });
      return;
    }

    if (data.startsWith("attd_toggle:")) {
      const studentId = data.split(":")[1].trim();
      if (pending.selected.has(studentId)) {
        pending.selected.delete(studentId);
      } else {
        pending.selected.add(studentId);
      }
      const keyboard = this._buildKeyboard(pending.students, pending.selected);
      await bot.editMessageReplyMarkup(
        { inline_keyboard: keyboard },
        { chat_id: chatId, message_id: pending.messageId, message_thread_id: pending.threadId }
      );
      await bot.answerCallbackQuery(query.id);
    } else if (data === "attd_confirm") {
      await bot.answerCallbackQuery(query.id, { text: "Processing..." });
      // Delete the inline keyboard message.
      await bot.deleteMessage(chatId, pending.messageId).catch(() => {});

      // Filter selected students.
      const selectedStudents = pending.students.filter(s => pending.selected.has(s._id.toString()));
      let overallResponse = "";
      for (const student of selectedStudents) {
        // Retrieve Heads-Up submissions for the student (case-insensitive) in descending order.
        const submissions = await HeadsUpSubmissionModel.find({
          telegram_id: student.telegram_id
        }).sort({ submittedAt: -1 });

        let responseMessage = `<b>Attendance details for ${student.name}</b>\n\n`;
        if (!submissions.length) {
          responseMessage += "No Heads-Up submissions found.\n\n";
        } else {
          submissions.forEach(sub => {
            const dateStr = new Date(sub.submittedAt).toLocaleString();
            responseMessage += `<b>Date:</b> ${dateStr}\n<b>Message:</b> ${sub.message}\n<b>Excused:</b> ${sub.isExcused ? "Yes" : "No"}\n\n`;
          });
        }
        overallResponse += responseMessage + "\n";
      }
      // Send the combined response privately to the admin.
      await bot.sendMessage(pending.adminId, overallResponse, { parse_mode: "HTML" });
      // Clear pending state.
      delete this.pendingAttendance[chatId];
    }
  }
}