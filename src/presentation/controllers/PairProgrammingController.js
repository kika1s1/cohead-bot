import { PairProgramming } from '../../application/use-cases/PairProgramming.js';
import { bot } from '../../infrastructure/telegram/bot.js';

export class PairProgrammingController {
  constructor(studentRepository, sessionRepository, leetCodeAPI) {
    this.studentRepository = studentRepository;
    this.pairProgramming = new PairProgramming(studentRepository, sessionRepository, leetCodeAPI);
  }

  async execute(chatId, group, questionDetails, threadId) {
    const students = await this.studentRepository.findByGroup(group);
    const { pairs, questions } = await this.pairProgramming.execute(group, questionDetails);

    let message = `<b>Pair Programming Session</b>\n`;
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
        message += `- ${pair[0].name} (unpaired)\n`;
      }
    });
    message += `\n<b>Questions:</b>\n`;
    questions.forEach(question => {
      message += `- <a href="${question.link}">${question.title}</a>\n`;
    });

    bot.sendMessage(chatId, message, {
      parse_mode: 'HTML',
      message_thread_id: threadId, // ensure the bot replies in the correct topic
    });
  }
}