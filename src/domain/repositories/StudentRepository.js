import { StudentModel } from '../../infrastructure/database/mongoose/StudentModel.js';

export class StudentRepository {
  /**
   * Find students by group.
   * @param {string} group - The group name (e.g., G61, G62).
   * @returns {Promise<Array>} - A list of students in the group.
   */
  async findByGroup(group) {
    try {
      const students = await StudentModel.find({ group });
      return students;
    } catch (error) {
      throw new Error(`Error finding students by group: ${error.message}`);
    }
  }

  /**
   * Add a new student to the database.
   * @param {Object} studentData - The student data (name and group).
   * @returns {Promise<Object>} - The created student.
   */
  async addStudent(studentData) {
    try {
      const student = new StudentModel(studentData);
      await student.save();
      return student;
    } catch (error) {
      throw new Error(`Error adding student: ${error.message}`);
    }
  }

  /**
   * Delete a student by ID.
   * @param {string} studentId - The ID of the student to delete.
   * @returns {Promise<Object>} - The deleted student.
   */
  async deleteStudent(studentId) {
    try {
      const student = await StudentModel.findByIdAndDelete(studentId);
      return student;
    } catch (error) {
      throw new Error(`Error deleting student: ${error.message}`);
    }
  }
}