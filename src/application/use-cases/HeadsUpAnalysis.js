import { analyzeHeadsUp } from '../../infrastructure/openai/OpenAIService.js';
import { RuleBasedHeadsUpAnalysis } from './RuleBasedHeadsUpAnalysis.js';
import { HeadsUpSubmissionModel } from '../../infrastructure/database/mongoose/HeadsUpSubmissionModel.js';

export class HeadsUpAnalysis {
  constructor() {
    this.ruleBasedAnalysis = new RuleBasedHeadsUpAnalysis();
  }

  /**
   * Analyze a heads-up message.
   * @param {string} message - The heads-up message.
   * @returns {Promise<Object>} - Analysis result (valid: boolean, feedback: string).
   */
  async analyze(message) {
    try {
      // Try OpenAI API first
      const feedback = await analyzeHeadsUp(message);
      if (feedback === 'Valid') {
        return { valid: true, feedback: null };
      }
      return { valid: false, feedback };
    } catch (error) {
      // Fallback to rule-based logic if OpenAI API fails
      return this.ruleBasedAnalysis.analyze(message);
    }
  }
  /**
   * Get submissions by date.
   * @param {Date} date - The date to filter submissions.
   * @returns {Promise<Array>} - List of submissions for the given date.
   */
  async getSubmissionsByDate(date) {
    // Set the start and end of the day
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    try {
      const submissions = await HeadsUpSubmissionModel.find({
        submittedAt: { $gte: start, $lte: end }
      });
      return submissions;
    } catch (error) {
      console.error("Error fetching submissions by date:", error.message);
      return [];
    }
  }
}