import { HeadsUpSubmissionModel } from '../../infrastructure/database/mongoose/HeadsUpSubmissionModel.js';
import { HeadsUpAnalysis } from '../../application/use-cases/HeadsUpAnalysis.js';
import { StudentModel } from '../../infrastructure/database/mongoose/StudentModel.js';
import isNameMatch from '../../utils/isNameMatch.js';
export class HeadsUpController {
  constructor() {
    this.headsUpAnalysis = new HeadsUpAnalysis();
  }

  /**
   * Handle a heads-up message.
   * Analyzes the message; if valid, extracts student data using OpenAI and saves the submission.
   * @param {number} chatId - The chat ID.
   * @param {string} message - The heads-up message.
   * @returns {Promise<string>} - Feedback (either confirmation or error message).
   */
  async handleHeadsUp(chatId, message, telegram_id) {
    const analysisResult = await this.headsUpAnalysis.analyze(message);
    if (!analysisResult.valid) {
      return analysisResult.feedback;
    }
    
    // Use OpenAI to extract student's name and group.
    const { studentName, group } = await this.headsUpAnalysis.extractStudentData(message);

    if (!studentName || !group) {

      return "Invalid message format: student name or group is unknown. Please rewrite your headsup";
    }
    // Verify that the student belongs to the mentioned group using fuzzball
    const studentRecord = await StudentModel.findOne({ telegram_id });
    if (!studentRecord) {
      return `No student found with telegram id ${telegram_id}. Make sure you are registered on @coheadbot.`;
    }
    if (!isNameMatch(studentName, studentRecord.name)) {
      return `The student ${studentName} with telegram id ${telegram_id} is not registered or does not match our records. Please correct your information.`;
    }
    if (!isNameMatch(group, studentRecord.group)) {
      return `The group ${group} does not match the registered group for ${studentRecord.name}. Please verify your group information.`;
    }
    try {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const existingSubmission = await HeadsUpSubmissionModel.findOne({
      telegram_id,
      submittedAt: { $gte: tenMinutesAgo }
      });

      if (existingSubmission) {
      await HeadsUpSubmissionModel.updateOne(
        { _id: existingSubmission._id },
        { studentName:studentRecord.name, group, message, submittedAt: new Date() }
      );
      } else {
      await HeadsUpSubmissionModel.create({
        telegram_id,
        studentName:studentRecord.name,
        group,
        message,
        submittedAt: new Date(),
      });
      }
      return "";
    } catch (error) {
      console.error("Error saving submission:", error.message);
      return "Error saving heads-up submission.";
    }
  }

  /**
   * Retrieve all Heads-Up submissions for the current day.
   * @returns {Promise<Array>} - List of today's submissions.
   */
  async getTodaysSubmissions() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const submissions = await this.headsUpAnalysis.getSubmissionsByDate(today);
    return submissions;
  }
}


