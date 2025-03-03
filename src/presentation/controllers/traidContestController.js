import { bot } from "../../infrastructure/telegram/bot.js";
import { HeadsUpSubmissionModel } from "../../infrastructure/database/mongoose/HeadsUpSubmissionModel.js";
import { StudentRepository } from "../../domain/repositories/StudentRepository.js";
import { TraidContest } from "../../application/use-cases/TraidContest.js";
import * as  fuzzball from "fuzzball";
import { SessionRepository } from "../../domain/repositories/SessionRepository.js";

// Fuzzy comparer using fuzzball with a threshold of 85%.
function isNameMatch(officialName, providedName) {
  const normalize = str => str.toLowerCase().trim();
  const nOfficial = normalize(officialName);
  const nProvided = normalize(providedName);
  const score = fuzzball.token_set_ratio(nOfficial, nProvided);
  return score >= 85;
}

// Helper to get the group (topic) name from the thread ID.
async function getTopicName(chatId, threadId) {
  const mapping = {
    281: "G61",
    1010: "G62",
    1015: "G63",
    1021: "G64",
    1048: "G65",
    1057: "G66",
    1080: "G67",
    518: "G68",
    255: "G69",
    359: "Heads Up",
  };
  return mapping[threadId] || `Unknown Group`;
}

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

export class TraidContestController {
  constructor() {
    this.studentRepository = new StudentRepository();
    this.sessionRepository = new SessionRepository();
    this.traidContestUseCase = new TraidContest(this.studentRepository, this.sessionRepository);
  }

  /**
   * Handles the /traid_contest command.
   * Expects leader names (comma-separated) as argument via popkeyboard.
   * Filters out students who submitted Heads Up and then pairs 2 students with 1 leader.
   */
  async handleCommand(msg, match) {
    const chatId = msg.chat.id;
    const threadId = msg.message_thread_id;
    const userId = msg.from.id;
    
    if (!(await isUserAdmin(chatId, userId))) {
      await bot.deleteMessage(chatId, msg.message_id).catch(() => {});
      return;
    }
    // Delete the admin's command message.
    await bot.deleteMessage(chatId, msg.message_id).catch(() => {});
    
    const group = await getTopicName(chatId, threadId);
    if (group === "Heads Up" || group === "Unknown Group") {
      await bot.sendMessage(chatId, "This command cannot be used in this topic.", { message_thread_id: threadId });
      return;
    }
    
    // Ensure leader names are provided.
    const leaderArg = match && match[1] ? match[1].trim() : null;
    if (!leaderArg) {
      await bot.sendMessage(chatId, "Please provide leader names (comma separated). Usage: /traid_contest tamirat kebede, abdi esayas, ...", { message_thread_id: threadId });
      return;
    }
    // Split leader names.
    const leaderNames = leaderArg.split(",").map(name => name.trim());
    
    try {
      // Fetch all students in the group.
      const students = await this.studentRepository.findByGroup(group);
      
      // Get today's Heads-Up submissions for the group.
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const submissions = await HeadsUpSubmissionModel.find({
        group: group.toUpperCase(),
        submittedAt: { $gte: today }
      });
      const submissionNames = submissions.map(sub => sub.studentName);
      
      // Filter out students who submitted Heads Up.
      const activeStudents = students.filter(student =>
        !submissionNames.some(subName => isNameMatch(student.name, subName))
      );
      
      // Find chosen leaders among active students using fuzzy matching.
      const chosenLeaders = [];
      leaderNames.forEach(lname => {
        const leader = activeStudents.find(student => isNameMatch(student.name, lname));
        if (leader && !chosenLeaders.some(l => l._id.equals(leader._id))) {
          chosenLeaders.push(leader);
        }
      });
      if (chosenLeaders.length === 0) {
        await bot.sendMessage(chatId, "No valid group leaders found among active students.", { message_thread_id: threadId });
        return;
      }
      
      // Remove the chosen leaders from the active pool.
      const remainingStudents = activeStudents.filter(student =>
        !chosenLeaders.some(leader => leader._id.equals(student._id))
      );
      
      // Execute the traid contest use-case.
      const groups = await this.traidContestUseCase.execute(group, chosenLeaders, remainingStudents);
      
      // Build the response message.
      let responseMessage = `<b>Grouping for ${group}</b>\n\n`;
      groups.forEach((grp, index) => {
        responseMessage += `<b>Group ${index + 1}:</b>\n`;
        grp.forEach(member => {
          if (chosenLeaders.some(leader => leader._id.equals(member._id))) {
            responseMessage += `⭐ ${member.name}\n`;
          } else {
            responseMessage += `${member.name}\n`;
          }
        });
        responseMessage += `\n`;
      });
      
      await bot.sendMessage(chatId, responseMessage, { parse_mode: 'HTML', message_thread_id: threadId });
    } catch (error) {
      console.error("Traid contest error:", error.message);
      await bot.sendMessage(chatId, `Error: ${error.message}`, { message_thread_id: threadId });
    }
  }
}

