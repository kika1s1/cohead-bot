import { MoonWalk } from '../../application/use-cases/MoonWalk.js';
import { bot } from '../../infrastructure/telegram/bot.js';
import { HeadsUpSubmissionModel } from '../../infrastructure/database/mongoose/HeadsUpSubmissionModel.js';
import * as fuzzball from 'fuzzball';

/**
 * Uses fuzzball to compare two names approximately.
 * Returns true if the fuzzy token_set_ratio score is at least 85%.
 * @param {string} studentName - The official student name.
 * @param {string} submissionName - The name provided in the heads-up.
 * @returns {boolean}
 */
function isNameMatch(studentName, submissionName) {
  const normalize = str => str.toLowerCase().trim();
  const nStudent = normalize(studentName);
  const nSubmission = normalize(submissionName);

  const score = fuzzball.token_set_ratio(nStudent, nSubmission);
  return score >= 85;
}

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
      submittedAt: { $gte: today }
    });
    const submissionNames = submissions.map(sub => sub.studentName);

    // Filter out students that match a heads-up submission approximately.
    const activeStudents = students.filter(student => {
      return !submissionNames.some(subName => isNameMatch(student.name, subName));
    });

    // Pass activeStudents to the use-case.
    const { pairs } = await this.moonWalk.execute(group, activeStudents);

    // Build pairing message.
    let message = `<b>Moon Walk Session</b>\n`;
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
        message += `${paddedName1} 🧑‍💻 ${paddedName2}\n`;
      } else {
        message += `${pair[0].name} (unpaired)\n`;
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