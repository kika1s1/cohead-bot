import { bot } from "../../infrastructure/telegram/bot.js";
import { StudentRepository } from "../../domain/repositories/StudentRepository.js";
import { StudentModel } from "../../infrastructure/database/mongoose/StudentModel.js";

export class RegistrationController {
    constructor() {
        this.studentRepository = new StudentRepository();
        // In-memory pending registration state keyed by telegram user id.
        // Structure: {
        //    [userId]: {
        //       chatId, step, selectedSchool, selectedGroup, candidates (if any),
        //       selectedStudentId, messageId (current inline message)
        //    }
        // }
        this.pendingRegistration = {};
        // Define valid options.
        this.schools = {
            ASTU: { groups: ["G68", "G69"] },
            AASTU: { groups: ["G65", "G66", "G67"] },
            AIT: { groups: ["G61", "G62", "G63", "G64"] }
        };
    }

    // Delete every text message sent by user during registration.
    async handleUserText(msg) {
        const chatId = msg.chat.id;
        const messageId = msg.message_id;
        if (this.pendingRegistration[msg.from.id]) {
            try {
                await bot.deleteMessage(chatId, messageId);
            } catch (error) {
                // Handle error silently if unable to delete.
                console.error("Failed to delete user message:", error);
            }
        }
    }

    async startRegistration(msg) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        
        // Delete the user's command message.
        try {
            await bot.deleteMessage(chatId, msg.message_id);
        } catch (error) {
            console.error("Error deleting command message:", error);
        }
        
        // Check if already registered.
        const existingRegistration = await StudentModel.findOne({ telegram_id: String(userId), isRegistered: true });
        if (existingRegistration) {
            await bot.sendMessage(chatId, "You are already registered.");
            return;
        }
        this.pendingRegistration[userId] = {
            chatId,
            step: "school",
            selectedSchool: null,
            selectedGroup: null,
            candidates: [],
            selectedStudentId: null,
            messageId: null
        };

        // Show school selection inline keyboard.
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
        if (!pending) return;

        // Ensure that only the same user can interact.
        if (query.from.id !== userId) {
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
            await deleteOldMessage();
            // Build group inline keyboard.
            const groups = this.schools[school].groups;
            const keyboard = groups.map(group => [{
                text: group,
                callback_data: `reg_group:${group}`
            }]);
            // Send new message with keyboard.
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
            // Fetch candidate student records.
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
                    telegram_id: String(query.from.id),
                    isRegistered: true
                });
                await bot.sendMessage(pending.chatId, "Registration complete. Thank you!");
            } catch (error) {
                await bot.sendMessage(pending.chatId, "Registration failed. Please try again later.");
            }
            delete this.pendingRegistration[userId];
            await bot.answerCallbackQuery(query.id);
            return;
        }
    }
}