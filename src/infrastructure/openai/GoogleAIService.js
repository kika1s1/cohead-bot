import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from '../../config/env.js';
// Initialize Gemini with your API key using the gemini-2.0-flash model.
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

/**
 * Analyze a heads-up message using Gemini.
 * @param {string} message - The heads-up message.
 * @returns {Promise<string>} - Feedback from Gemini.
 */
export async function analyzeHeadsUp(message) {
    const prompt = `
    Analyze the following heads-up message and determine if it is valid.
    A valid heads-up message must include:
      1. The student's full name.
      2. The group number (e.g., G61, G64, etc.). group start with G and followed by two numbers from 61-69 only example from G68 means a person is from Group 68
      3. A reason for absence or delay should reasable and valid so that they can't make the class.
      4. tolerate spelling error and puncation error if it is minor and understandable 
    If any of these elements are missing, provide  polite specific correction for students with  short sentence less than three lines of  feedback indicating what is missing from the above three only.
    Otherwise, respond with "Valid" only.

    Message: "${message}"
  `;
  try {
    const result = await model.generateContent(prompt);
    // Return the generated feedback (trimmed)
    return result.response.text().trim();
  } catch (error) {
    console.error("Error calling Gemini:");
    throw new Error("Failed to analyze heads-up message using Gemini API");
  }
}

// Example usage (for testing purposes)
// const headsUpMessage = "My name is Tamirat Kebede from G68 i won't come because i am sick"
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