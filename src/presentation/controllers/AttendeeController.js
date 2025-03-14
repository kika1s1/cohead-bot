import { bot } from "../../infrastructure/telegram/bot.js";
import { HeadsUpSubmissionModel } from "../../infrastructure/database/mongoose/HeadsUpSubmissionModel.js";
import isUserAdmin from "../../utils/isUserAdmin.js";
import getTopicName from "../../utils/getTopicName.js";

/**
 * The AttendeeController allows admins to see all students
 * who are marked absent (HeadsUpSubmission with isExcused = false)
 * and toggle them back to present (isExcused = true).
 */
export class AttendeeController {
  constructor() {
    // In-memory pending attendee state keyed by chat id
    // { [chatId]: { group, threadId, adminId, absentDocs: [], selected: Set(), messageId } }
    this.pendingAttendee = {};
  }

  /**
   * startAttendee(msg):
   * 1. Checks admin rights.
   * 2. Retrieves the current group and fetches all absentees (HeadsUpSubmission with isExcused = false).
   * 3. Displays an inline keyboard letting the admin toggle those absentees to present.
   */
  async startAttendee(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const threadId = msg.message_thread_id;

    if (!(await isUserAdmin(chatId, userId))) {
      await bot.deleteMessage(chatId, msg.message_id).catch(() => {});
      return;
    }
    // Delete the admin's command message
    await bot.deleteMessage(chatId, msg.message_id).catch(() => {});

    const group = await getTopicName(chatId, threadId);
    if (!group || group === "Heads Up") {
      const sent = await bot.sendMessage(
        chatId,
        "This command cannot be used here. Check your topic.",
        {
          message_thread_id: threadId,
        }
      );
      // Optionally delete the error message after 2 seconds
      setTimeout(async () => {
        await bot.deleteMessage(chatId, sent.message_id).catch(() => {});
      }, 2000);
      return;
    }
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Fetch all records for this group
    const absentDocs = await HeadsUpSubmissionModel.find({
      group: group.toUpperCase(),
      submittedAt: { $gte: startOfToday, $lte: endOfToday }
    }).sort({ submittedAt: -1 });

    if (!absentDocs.length) {
      const sent= await bot.sendMessage(chatId, `No absentees found for ${group}.`, {
        message_thread_id: threadId,
      });
      // Optionally delete the error message after 2 seconds
      setTimeout(async () => {
        await bot.deleteMessage(chatId, sent.message_id).catch(() => {});
      }, 2000);
      return;
    }

    // Save the pending state
    this.pendingAttendee[chatId] = {
      group,
      threadId,
      adminId: userId,
      absentDocs, // the docs in the DB
      selected: new Set(), // track toggles
      messageId: null,
    };

    // Build inline keyboard
    const keyboard = this._buildKeyboard(
      absentDocs,
      this.pendingAttendee[chatId].selected
    );
    const sentMsg = await bot.sendMessage(
      chatId,
      `Select who to mark *present* in ${group}. Toggle with a tap, then press <b>Confirm</b>.`,
      {
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: keyboard },
        message_thread_id: threadId,
      }
    );
    this.pendingAttendee[chatId].messageId = sentMsg.message_id;
  }

  /**
   * Builds an inline keyboard for toggling absent students to present.
   */
  _buildKeyboard(absentDocs, selectedSet) {
    // Each row is a single student
    const buttons = absentDocs.map((doc) => {
      const text = selectedSet.has(String(doc._id))
        ? `✅ ${doc.studentName}`
        : `🔴 ${doc.studentName}`;
      return [
        {
          text,
          callback_data: `att_toggle:${doc._id}`,
        },
      ];
    });
    // Add a confirm button at the bottom
    buttons.push([
      {
        text: "Confirm",
        callback_data: "att_confirm",
      },
    ]);
    return buttons;
  }

  /**
   * handleCallback(query):
   * - If toggling, add/remove from "selected" set
   * - If confirm, update the DB records for all selected doc._id -> isExcused = true
   */
  async handleCallback(query) {
    const data = query.data;
    const chatId = query.message.chat.id;
    const pending = this.pendingAttendee[chatId];
    if (!pending) return;

    // Only the admin who started /attendee can interact
    if (query.from.id !== pending.adminId) {
      await bot.answerCallbackQuery(query.id, {
        text: "Unauthorized.",
        show_alert: true,
      });
      return;
    }

    if (data.startsWith("att_toggle:")) {
      const docId = data.split(":")[1];
      if (pending.selected.has(docId)) {
        pending.selected.delete(docId);
      } else {
        pending.selected.add(docId);
      }
      const keyboard = this._buildKeyboard(
        pending.absentDocs,
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
    } else if (data === "att_confirm") {
      await bot.answerCallbackQuery(query.id, { text: "Updating..." });

      // Delete the inline keyboard message in the group chat
      await bot.deleteMessage(chatId, pending.messageId).catch(() => {});

      // Then mark selected absentees as present
      await this.confirmAttendee(chatId);
      delete this.pendingAttendee[chatId];
    }
  }

  /**
   * confirmAttendee(chatId):
   * Marks all selected doc IDs as excused=true in DB
   * then sends a summary of who was marked present.
   */
  async confirmAttendee(chatId) {
    const pending = this.pendingAttendee[chatId];
    if (!pending) return;
    const { group, threadId, absentDocs, selected } = pending;

    // Filter out the doc objects that were selected
    const toUpdate = absentDocs.filter((doc) => selected.has(String(doc._id)));

    if (!toUpdate.length) {
      await bot.sendMessage(chatId, "No changes were made.", {
        message_thread_id: threadId,
      });
      return;
    }

    // Update each doc in the DB, marking them as excused and checkout true
    for (const doc of toUpdate) {
      await HeadsUpSubmissionModel.updateOne(
      { _id: doc._id },
      { isExcused: true, checkOut: true }
      );
    }

    // Build a summary
    let summary = `<b>Now Present in ${group}:</b>\n\n`;
    toUpdate.forEach((doc) => {
      summary += `✅ ${doc.studentName}\n`;
    });
    await bot.sendMessage(pending.adminId, summary, {
      parse_mode: "HTML",
    });
  }
}
