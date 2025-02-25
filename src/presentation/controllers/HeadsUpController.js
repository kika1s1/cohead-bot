import { HeadsUpSubmissionModel } from '../../infrastructure/database/mongoose/HeadsUpSubmissionModel.js';
import { HeadsUpAnalysis } from '../../application/use-cases/HeadsUpAnalysis.js';

export class HeadsUpController {
  constructor() {
    this.headsUpAnalysis = new HeadsUpAnalysis();
  }

  /**
   * Handle a heads-up message.
   * Analyzes the message; if valid, extracts student data and saves the submission.
   * @param {number} chatId - The chat ID.
   * @param {string} message - The heads-up message.
   * @returns {Promise<string>} - Feedback (either confirmation or error message).
   */
  async handleHeadsUp(chatId, message) {
    const analysisResult = await this.headsUpAnalysis.analyze(message);
    if (!analysisResult.valid) {
      // Return analysis feedback if not valid.
      return analysisResult.feedback;
    }
    
    // Extract student's name and group from the message.
    // This is a simple example; adjust the regex as per your message format.
    const nameMatch = message.match(/this is\s+([a-z\s]+)\s+from/i);
    const groupMatch = message.match(/from\s+(G\d{2})/i);
    
    const studentName = nameMatch ? nameMatch[1].trim() : null;
    const group = groupMatch ? groupMatch[1].toUpperCase() : null;

    if (!studentName || !group) {
      return "Invalid message format: student name or group is unknown.";
    }
    
    try {
      // Save the valid heads-up submission to the database.
      await HeadsUpSubmissionModel.create({
        studentName,
        group,
        message,
        submittedAt: new Date(),
      });
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


