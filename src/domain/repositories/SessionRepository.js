import { SessionModel } from '../../infrastructure/database/mongoose/SessionModel.js';

export class SessionRepository {
  /**
   * Save a session to the database.
   * @param {Object} sessionData - The session data (type, group, pairs, questions).
   * @returns {Promise<Object>} - The saved session.
   */
  async save(sessionData) {
    try {
      const session = new SessionModel(sessionData);
      await session.save();
      return session;
    } catch (error) {
      throw new Error(`Error saving session: ${error.message}`);
    }
  }

  /**
   * Find sessions by group.
   * @param {string} group - The group name (e.g., G61, G62).
   * @returns {Promise<Array>} - A list of sessions for the group.
   */
  async findByGroup(group) {
    try {
      const sessions = await SessionModel.find({ group }).populate('pairs');
      return sessions;
    } catch (error) {
      throw new Error(`Error finding sessions by group: ${error.message}`);
    }
  }

  /**
   * Delete a session by ID.
   * @param {string} sessionId - The ID of the session to delete.
   * @returns {Promise<Object>} - The deleted session.
   */
  async deleteSession(sessionId) {
    try {
      const session = await SessionModel.findByIdAndDelete(sessionId);
      return session;
    } catch (error) {
      throw new Error(`Error deleting session: ${error.message}`);
    }
  }
}