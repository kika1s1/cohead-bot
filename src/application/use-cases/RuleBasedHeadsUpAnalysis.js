export class RuleBasedHeadsUpAnalysis {
    /**
     * Analyze a heads-up message using rule-based logic.
     * @param {string} message - The heads-up message.
     * @returns {Object} - Analysis result (valid: boolean, feedback: string).
     */
    analyze(message) {
      const requiredFields = [
        { keyword: 'hey team', description: 'Start with "Hey team"' },
        { keyword: 'this is', description: 'Include "this is" followed by your full name' },
        { keyword: 'from g', description: 'Include your group number (e.g., G61)' },
        { keyword: 'because', description: 'Provide a clear reason for absence or delay' },
      ];
  
      const missingFields = requiredFields.filter((field) => !message.toLowerCase().includes(field.keyword));
  
      if (missingFields.length > 0) {
        const feedback = `⚠️ Heads-Up Format Issue:\n${missingFields
          .map((field) => `- ${field.description}`)
          .join('\n')}\n\nPlease  edit your heads up.`;
        return { valid: false, feedback };
      }
  
      return { valid: true, feedback: null };
    }
  }