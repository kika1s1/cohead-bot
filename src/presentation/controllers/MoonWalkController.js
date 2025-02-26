import { MoonWalk } from '../../application/use-cases/MoonWalk.js';
import { bot } from '../../infrastructure/telegram/bot.js';

export class MoonWalkController {
  constructor(studentRepository, sessionRepository) {
    this.moonWalk = new MoonWalk(studentRepository, sessionRepository);
  }

  async execute(chatId, group, threadId) {
    const { pairs } = await this.moonWalk.execute(group);

    let message = `<b>Moon Walk Session</b>\n`;
    message += `<b>Group:</b> ${group}\n\n`;
    message += `<b>Student Pairings:</b>\n`;
    pairs.forEach(pair => {
      if (pair[1]) {
        const name1 = pair[0].name.split(' ').slice(0, 2).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        const name2 = pair[1].name.split(' ').slice(0, 2).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        const maxLength = Math.max(name1.length, name2.length);
        const paddedName1 = name1.padEnd(maxLength, ' ');
        const paddedName2 = name2.padStart(maxLength, ' ');
        message += `${paddedName1} 🧑‍💻 ${paddedName2}\n`;
      } else {
        message += `${pair[0].name} (unpaired)\n`;
      }
    });
    message += `\n<b>Team:</b>\n`;
    message += `Step outside with your partner and engage in a 15 minute English conversation. Focus on enhancing your communication and speaking skills. Make the most of this opportunity to learn, share, and grow. Enjoy the session!`;

    bot.sendMessage(chatId, message, {
      parse_mode: 'HTML',
      message_thread_id: threadId, // ensure the bot replies in the correct topic
    });
  }
}