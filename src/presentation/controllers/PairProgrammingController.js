import { PairProgramming } from '../../application/use-cases/PairProgramming.js';
import { bot } from '../../infrastructure/telegram/bot.js';
import { HeadsUpSubmissionModel } from '../../infrastructure/database/mongoose/HeadsUpSubmissionModel.js';
import isNameMatch from '../../utils/isNameMatch.js';

export class PairProgrammingController {
  constructor(studentRepository, sessionRepository, leetCodeAPI) {
    this.studentRepository = studentRepository;
    this.pairProgramming = new PairProgramming(studentRepository, sessionRepository, leetCodeAPI);
  }

  async execute(chatId, group, questionDetails, threadId) {
    // Get all students in the group.
    const students = await this.studentRepository.findByGroup(group);

    // Get today's heads-up submissions for this group.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const submissions = await HeadsUpSubmissionModel.find({
      group: group.toUpperCase(),
      submittedAt: { $gte: today },
      checkedOut: false,
    });

    // Filter out submissions where checkout is true.
    // const activeSubmissions = submissions.filter(submission => submission.checkOut !== true);
    // console.log("submission", submissions)
    const submissionStudentIds = submissions.map(sub => sub._id.toString());
    // Filter out students that match a heads-up submission approximately.
    const activeStudents = students.filter(student => {
      return !submissionStudentIds.includes(student._id.toString());
    });
    // Pass activeStudents to the use-case.
    const { pairs, questions } = await this.pairProgramming.execute(group, questionDetails, activeStudents);

    // Build pairing message.
    let message = `<b>Pair Programming Session</b>\n`;
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
        message += `- ${pair[0].name} (unpaired)\n`;
      }
    });

    message += `\n<b>Questions:</b>\n`;
    questions.forEach(question => {
      message += `- <a href="${question.link}">${question.title}</a>\n`;
    });

    bot.sendMessage(chatId, message, {
      parse_mode: 'HTML',
      message_thread_id: threadId,
    });
  }
}