import axios from 'axios';

export class LeetCodeAPI {
  /**
   * Expects an array of objects with the following properties:
   * {
   *   title: "Two Sum",
   *   link: "https://leetcode.com/problems/two-sum/description" // optional
   * }
   * If link is not provided, a default link is generated based on the title.
   */
  async fetchQuestions(questionDetails) {
    const questions = [];
    for (const question of questionDetails) {
      let { title, link } = question;
      // If link is not provided, generate one by "slugifying" the title.
      if (!link) {
        const slug = title.toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9\-]/g, '');
        link = `https://leetcode.com/problems/${slug}/`;
      }
      // Optionally you may perform additional validations with axios if needed.
      // For instance:
      // try {
      //   const response = await axios.get(link);
      //   // you could extract difficulty or other details here
      // } catch (err) {
      //   console.error(`Unable to fetch details for ${title} at ${link}`);
      // }
      
      questions.push({
        title,
        link,
        difficulty: "unknown",
      });
    }
    return questions;
  }
}