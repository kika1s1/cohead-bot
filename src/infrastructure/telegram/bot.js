import TelegramBot from 'node-telegram-bot-api';
import { TELEGRAM_BOT_TOKEN } from '../../config/env.js';

export const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
console.log("Bot has been started successfully");