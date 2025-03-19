import { bot } from "../../infrastructure/telegram/bot.js";
import { StudentModel } from "../../infrastructure/database/mongoose/StudentModel.js";

export class RegistrationController {
  constructor() {
    // Pending registration state keyed by telegram user id.
    this.pendingRegistration = {};
    this.schools = {
      ASTU: { groups: ["G68", "G69"] },
      AASTU: { groups: ["G65", "G66", "G67"] },
      AIT: { groups: ["G61", "G62", "G63", "G64"] }
    };
    // Bind the method to maintain context.
    this.startRegistration = this.startRegistration.bind(this);
  }

  // Optionally delete every text message sent by the user during registration.
  async handleUserText(msg) {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    if (this.pendingRegistration[msg.from.id]) {
      try {
        await bot.deleteMessage(chatId, messageId);
      } catch (error) {
        console.error("Failed to delete user message:", error);
      }
    }
  }

  // Accept either a message or a callback query.
  async startRegistration(source) {
    // If source is a callback query, delete its message (i.e. the register button message) immediately.
    const chatId = source.message ? source.message.chat.id : source.chat.id;
    const userId = source.from.id;
    if (source.message && source.message.message_id) {
      try {
        await bot.deleteMessage(chatId, source.message.message_id);
      } catch (error) {
        console.error("Error deleting register button message:", error);
      }
    }

    // Check if already registered before returning any register button.
    const existingRegistration = await StudentModel.findOne({
      telegram_id: String(userId),
      isRegistered: true
    });
    if (existingRegistration) {
      await bot.sendMessage(chatId, "You are already registered.");
      return;
    }

    // Initialize pending registration state keyed by userId.
    this.pendingRegistration[userId] = {
      chatId,
      step: "school", // Current stage: school → group → selectName → confirm.
      selectedSchool: null,
      selectedGroup: null,
      candidates: [],
      selectedStudentId: null,
      messageId: null
    };

    // Build school selection inline keyboard.
    const keyboard = Object.keys(this.schools).map(school => [{
      text: school,
      callback_data: `reg_school:${school}`
    }]);

    const sentMsg = await bot.sendMessage(
      chatId,
      "Please select your school:",
      { reply_markup: { inline_keyboard: keyboard } }
    );
    this.pendingRegistration[userId].messageId = sentMsg.message_id;
  }

  async handleCallback(query) {
    const data = query.data;
    const userId = query.from.id;
    const pending = this.pendingRegistration[userId];
    // console.log("pending:", pending);
    // console.log("userId:", userId);
    // console.log("this.pendingRegistration:", this.pendingRegistration);
    if (!pending) return;

    // Ensure that only the originating user can interact.
    if (query.message.chat.id !== pending.chatId) {
      await bot.answerCallbackQuery(query.id, {
        text: "Unauthorized.",
        show_alert: true
      });
      return;
    }

    // Helper to delete the old inline message.
    const deleteOldMessage = async () => {
      if (pending.messageId) {
        try {
          await bot.deleteMessage(pending.chatId, pending.messageId);
        } catch (error) {
          console.error("Error deleting inline message:", error);
        }
      }
    };

    // SCHOOL SELECTION STEP
    if (data.startsWith("reg_school:") && pending.step === "school") {
      const school = data.split(":")[1];
      if (!this.schools[school]) {
        await bot.answerCallbackQuery(query.id, { text: "Invalid school selected." });
        return;
      }
      pending.selectedSchool = school;
      pending.step = "group";
      // Delete the initial "select your school" message immediately after click.
      await deleteOldMessage();

      // Build group selection inline keyboard.
      const groups = this.schools[school].groups;
      const keyboard = groups.map(group => [{
        text: group,
        callback_data: `reg_group:${group}`
      }]);
      const sentMsg = await bot.sendMessage(
        pending.chatId,
        `You selected ${school}.\nNow select your group:`,
        { reply_markup: { inline_keyboard: keyboard } }
      );
      pending.messageId = sentMsg.message_id;
      await bot.answerCallbackQuery(query.id);
      return;
    }

    // GROUP SELECTION STEP
    if (data.startsWith("reg_group:") && pending.step === "group") {
      const group = data.split(":")[1];
      if (!this.schools[pending.selectedSchool].groups.includes(group)) {
        await bot.answerCallbackQuery(query.id, { text: "Invalid group selected." });
        return;
      }
      pending.selectedGroup = group;
      pending.step = "selectName";
      await deleteOldMessage();

      // Fetch candidate student records (not yet registered) for the selected school and group.
      const candidates = await StudentModel.find({
        school: pending.selectedSchool,
        group: group,
        isRegistered: false
      });
      if (!candidates || candidates.length === 0) {
        await bot.sendMessage(pending.chatId, "No registration candidates found for your selection.");
        delete this.pendingRegistration[userId];
        return;
      }
      pending.candidates = candidates;
      const keyboard = candidates.map(candidate => [{
        text: candidate.name,
        callback_data: `reg_name:${candidate._id}`
      }]);
      const sentMsg = await bot.sendMessage(
        pending.chatId,
        `Selected School: ${pending.selectedSchool}\nSelected Group: ${group}\nNow select your name:`,
        { reply_markup: { inline_keyboard: keyboard } }
      );
      pending.messageId = sentMsg.message_id;
      await bot.answerCallbackQuery(query.id);
      return;
    }

    // NAME SELECTION STEP
    if (data.startsWith("reg_name:") && pending.step === "selectName") {
      const studentId = data.split(":")[1];
      const candidate = pending.candidates.find(s => s._id.toString() === studentId);
      if (!candidate) {
        await bot.answerCallbackQuery(query.id, { text: "Invalid candidate selected." });
        return;
      }
      pending.selectedStudentId = studentId;
      pending.step = "confirm";
      await deleteOldMessage();

      const confirmationText = `Please confirm registration:\nSchool: ${pending.selectedSchool}\nGroup: ${pending.selectedGroup}\nName: ${candidate.name}\n\nPress Confirm to complete registration.`;
      const keyboard = [[{
        text: "Confirm",
        callback_data: "reg_confirm"
      }]];
      const sentMsg = await bot.sendMessage(
        pending.chatId,
        confirmationText,
        { reply_markup: { inline_keyboard: keyboard } }
      );
      pending.messageId = sentMsg.message_id;
      await bot.answerCallbackQuery(query.id);
      return;
    }

    // CONFIRMATION STEP
    if (data === "reg_confirm" && pending.step === "confirm") {
      await deleteOldMessage();
      try {
        await StudentModel.findByIdAndUpdate(pending.selectedStudentId, {
          telegram_id: String(userId),
          isRegistered: true
        });
        // Final confirmation message. This step deletes all intermediate state.
        await bot.sendMessage(pending.chatId, "Registration complete. Thank you!");
      } catch (error) {
        await bot.sendMessage(pending.chatId, "Registration failed. Please try again later.");
      }
      // Delete the entire pending state to remove all intermediate selections.
      delete this.pendingRegistration[userId];
      await bot.answerCallbackQuery(query.id);
      return;
    }
  }
}