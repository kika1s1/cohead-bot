import { bot } from "../infrastructure/telegram/bot.js";
// Helper to check admin rights.
async function isUserAdmin(chatId, userId) {
  try {
    const admins = await bot.getChatAdministrators(chatId);
    return admins.some(admin => admin.user.id === userId);
  } catch (err) {
    console.error("Failed to get chat admins:", err);
    return false;
  }
}

export default isUserAdmin;