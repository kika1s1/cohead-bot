import { Student } from '../../domain/entities/Student.js';
import { Session } from '../../domain/entities/Session.js';

export class PairProgramming {
  constructor(studentRepository, sessionRepository, leetCodeAPI) {
    this.studentRepository = studentRepository;
    this.sessionRepository = sessionRepository;
    this.leetCodeAPI = leetCodeAPI;
  }

  /**
   * Execute a pair programming session.
   * If an activeStudents array is provided, pair those; otherwise, fetch all students for the group.
   * @param {string} group 
   * @param {Array} questionNumbers 
   * @param {Array} [activeStudents] - Optional filtered list of students.
   * @returns {Promise<Object>} - { pairs, questions }
   */
  async execute(group, questionDetails, activeStudents = null) {
    const students = activeStudents || await this.studentRepository.findByGroup(group);
    const questions = await this.leetCodeAPI.fetchQuestions(questionDetails);
    const pairs = this._pairStudents(students);

    const session = new Session({
      type: 'pair_programming',
      group,
      pairs,
      questions,
    });

    await this.sessionRepository.save(session);
    return { pairs, questions };
  }

  _pairStudents(students) {
    // Shuffle the array randomly.
    const shuffled = students.sort(() => 0.5 - Math.random());
    const pairs = [];
    for (let i = 0; i < shuffled.length; i += 2) {
      pairs.push([shuffled[i], shuffled[i + 1]]);
    }
    return pairs;
  }
}