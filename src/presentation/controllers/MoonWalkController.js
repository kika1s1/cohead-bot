import { MoonWalk } from '../../application/use-cases/MoonWalk.js';
import { bot } from '../../infrastructure/telegram/bot.js';
import { HeadsUpSubmissionModel } from '../../infrastructure/database/mongoose/HeadsUpSubmissionModel.js';
import isNameMatch from '../../utils/isNameMatch.js';

export class MoonWalkController {
  constructor(studentRepository, sessionRepository) {
    this.moonWalk = new MoonWalk(studentRepository, sessionRepository);
  }

  async execute(chatId, group, threadId) {
    // Get all students in the group.
    const students = await this.moonWalk.studentRepository.findByGroup(group);

    // Get today's heads-up submissions for this group.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const submissions = await HeadsUpSubmissionModel.find({
      group: group.toUpperCase(),
      submittedAt: { $gte: today },
      checkOut:false,
    });
    // console.log("submission", submissions)
    const submissionStudentIds = submissions.map(sub => sub._id.toString());
    // Filter out students that match a heads-up submission approximately.
    const activeStudents = students.filter(student => {
      return !submissionStudentIds.includes(student._id.toString());
    });
    

    // Pass activeStudents to the use-case.
    const { pairs } = await this.moonWalk.execute(group, activeStudents);

    // Build pairing message.
    let message = `total students: ${activeStudents.length}\n`;
    message += `<b>Moon Walk Session</b>\n`;
    message += `<b>Group:</b> ${group}\n\n`;
    message += `<b>Student Pairings:</b>\n`;
    pairs.forEach(pair => {
      if (pair[1]) {
        const name1 = pair[0].name.split(' ').slice(0, 2)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        const name2 = pair[1].name.split(' ').slice(0, 2)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        const maxLength = Math.max(name1.length, name2.length);
        const paddedName1 = name1.padEnd(maxLength, ' ');
        const paddedName2 = name2.padStart(maxLength, ' ');
        message += `${paddedName1} 🧑‍💻 ${paddedName2} \n`;
      } else {
        message += `🧑‍💻 ${pair[0].name}`;
      }
    });
    message += `\n<b>Team:</b>\n`;
    message += `Step outside with your partner and engage in a 15 minute English conversation. Focus on enhancing your communication and speaking skills. Make the most of this opportunity to learn, share, and grow. Enjoy the session!`;
    bot.sendMessage(chatId, message, {
      parse_mode: 'HTML',
      message_thread_id: threadId,
    });
  }
}