import { HeadsUpSubmissionModel } from '../../infrastructure/database/mongoose/HeadsUpSubmissionModel.js';
import { HeadsUpAnalysis } from '../../application/use-cases/HeadsUpAnalysis.js';
import { StudentModel } from '../../infrastructure/database/mongoose/StudentModel.js';
import * as fuzzball from 'fuzzball';

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
  async handleHeadsUp(chatId, message) {
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
    const studentCandidates = await StudentModel.find({ group: { $regex: group, $options: 'i' } });
    let studentRecord;
    for (const student of studentCandidates) {
      const nameScore = fuzzball.token_set_ratio(studentName, student.name);
      if (nameScore >= 80) { // threshold for a good fuzzy match
        studentRecord = student;
        break;
      }
    }
    if (!studentRecord) {
      return `The student ${studentName} is not registered under group ${group}. Please correct your information.`;
    }
    try {
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


