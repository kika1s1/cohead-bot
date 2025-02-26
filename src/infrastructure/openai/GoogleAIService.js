import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from '../../config/env.js';
// Initialize Gemini with your API key using the gemini-2.0-flash model.
const genAI = new GoogleGenerativeAI("AIzaSyASp8h_r31H2AkfpfjgQgluFTTEIqCjumI");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

/**
 * Analyze a heads-up message using Gemini.
 * @param {string} message - The heads-up message.
 * @returns {Promise<string>} - Feedback from Gemini.
 */
export async function analyzeHeadsUp(message) {
  const prompt = `
    Analyze the following heads-up message and provide feedback if it is vague or incomplete.
    The message should include:
    1. The student's full name.
    2. The group number (e.g., G61).
    3. A clear reason for absence or delay.
    4. Estimated arrival time (if late) if he/she can come.

    Message: "${message}"

    If the message is incomplete or vague, provide specific feedback. Otherwise, respond with "Valid".
  `;

  try {
    const result = await model.generateContent(prompt);
    // Return the generated feedback (trimmed)
    return result.response.text().trim();
  } catch (error) {
    console.error("Error calling Gemini:", error);
    throw new Error("Failed to analyze heads-up message using Gemini API");
  }
}

// Example usage (for testing purposes)
// const headsUpMessage = "Hey team, this is John Doe from G61. I won't be able to attend today's session because I have a doctor's appointment.";
// analyzeHeadsUp(headsUpMessage)
//   .then((feedback) => {
//     if (feedback === "Valid") {
//       console.log("The heads-up message is valid.");
//     } else {
//       console.log("Heads-Up Format Issue:\n", feedback);
//     }
//   })
//   .catch((error) => {
//     console.error("Error:", error.message);
//   });