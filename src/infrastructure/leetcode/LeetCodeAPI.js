import axios from 'axios';

export class LeetCodeAPI {
  /**
   * Accepts either an array of strings (links separated by comma) or an array of objects:
   * Example string input:
   * [
   *   "https://leetcode.com/problems/letter-tile-possibilities/description",
   *   "https://leetcode.com/problems/two-sum/description"
   * ]
   *
   * Example object input:
   * [
   *   { title: "", link: "https://leetcode.com/problems/letter-tile-possibilities/description" },
   *   { title: "", link: "https://leetcode.com/problems/two-sum/description" }
   * ]
   *
   * If link is provided and title is empty, a title is generated from the link.
   * If link is missing, a default link is generated based on the title.
   */
  async fetchQuestions(questionDetails) {
    // If questionDetails is an array of strings, transform each into an object with a link property.
    if (
      Array.isArray(questionDetails) &&
      questionDetails.length > 0 &&
      typeof questionDetails[0] === "string"
    ) {
      questionDetails = questionDetails.map(link => ({ link }));
    }
    
    const questions = [];
    for (const question of questionDetails) {
      let { title, link } = question;
      
      // If a link is provided but title is missing, attempt to create a title from the link.
      if (link && (!title || title.trim() === "")) {
        // Expecting URL pattern: "/problems/<slug>/"
        const match = link.match(/problems\/([^\/]+)(?:\/|$)/);
        if (match && match[1]) {
          title = match[1]
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
        } else {
          title = "Codeforce";
        }
      }
      
      // If link is not provided, generate a link using a slugified version of the title.
      if (!link) {
        const slug = title.toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9\-]/g, '');
        link = `https://leetcode.com/problems/${slug}/`;
      }


      
      questions.push({
        title,
        link,
      });
    }
    return questions;
  }
}