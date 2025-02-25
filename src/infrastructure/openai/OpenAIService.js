import OpenAI from "openai";
import { OPENAI_API_KEY } from '../../config/env.js';

// Initialize OpenAI with your API key
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY, // Ensure your OPENAI_API_KEY is set in your environment/config file.
});

/**
 * Analyze a heads-up message using OpenAI GPT.
 * @param {string} message - The heads-up message.
 * @returns {Promise<string>} - Feedback from OpenAI GPT.
 */
export async function analyzeHeadsUp(message) {
  const prompt = `
    Analyze the following heads-up message and provide feedback if it is vague or incomplete.
    The message should include:
    1. The student's full name.
    2. The group number (e.g., G61).
    3. A clear reason for absence or delay.
    4. Estimated arrival time (if late).

    Message: "${message}"

    If the message is incomplete or vague, provide specific feedback. Otherwise, respond with "Valid".
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      store: true,
      messages: [
        { role: "system", content: "You are a helpful assistant that analyzes heads-up messages." },
        { role: "user", content: prompt },
      ],
    });
    // Return the generated feedback (trimmed)
    return completion.choices[0].message.content.trim();
  } catch (error) {
    // console.error("OpenAI API error:", error.message);
    throw new Error("Failed to analyze heads-up message using OpenAI API");
  }
}

// Example usage (for testing purposes)
// const headsUpMessage = "Hey team, this is John Doe from G61. I won't be able to attend today's session because I have a doctor's appointment.";
// analyzeHeadsUp(headsUpMessage)
//   .then((feedback) => {
//     if (feedback === "Valid") {
//       console.log("The heads-up message is valid.");
//     } else {
//       console.log("Heads-Up Format Inpm install punycodenpm install punycodessue:\n", feedback);
//     }
//   })
//   .catch((error) => {
//     console.error("Error:", error.message);
//   });