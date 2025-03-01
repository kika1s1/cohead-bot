import { analyzeHeadsUp } from '../../infrastructure/openai/GoogleAIService.js';
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
   * Use OpenAI to extract student data from the heads-up message.
   * @param {string} message - The complete heads-up message.
   * @returns {Promise<Object>} - An object with studentName, group, and message.
   */
  async extractStudentData(message) {
    // Craft a prompt asking OpenAI to extract the data.
    const prompt = `
You are an assistant that extracts structured student data from a message.
Extract the student's full name, group, and the complete message.
The message format is freeform. Return the result strictly in JSON format with keys:
"studentName" and "group".
If extraction fails, return null for those keys.
Example response:
{
  "studentName": "John Doe",
  "group": "G61"
}

Message: "${message}"
`;

    try {
      // Call OpenAI (adjust parameters as needed)
      const response = await analyzeHeadsUp(prompt); // reuse analyzeHeadsUp or use another OpenAI API call

      // Sanitize response: remove markdown formatting, if present.
      let sanitized = response.trim();
      if (sanitized.startsWith("```")) {
        // Remove starting backticks and language identifier, if any.
        sanitized = sanitized.replace(/^```[a-z]*\n/, "");
        // Remove trailing backticks.
        sanitized = sanitized.replace(/```$/, "").trim();
      }
      
      // Use regex to capture the JSON object (from the first "{" to the last "}")
      const jsonMatch = sanitized.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON object found in response");
      }
      const jsonString = jsonMatch[0];
      console.log(jsonString);
      
      // Parse the JSON string.
      const result = JSON.parse(jsonString);
      return {
        studentName: result.studentName || null,
        group: result.group ? result.group.toUpperCase() : null,
        message // include the full original message if needed
      };
    } catch (error) {
      console.error("Error extracting student data:", error.message);
      return { studentName: null, group: null, message };
    }
  }

  /**
   * Get submissions by date.
   * @param {Date} date - The date to filter submissions.
   * @returns {Promise<Array>} - List of submissions for the given date.
   */
  async getSubmissionsByDate(date) {
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