import { Student } from '../../domain/entities/Student.js';
import { Session } from '../../domain/entities/Session.js';

export class MoonWalk {
  constructor(studentRepository, sessionRepository) {
    this.studentRepository = studentRepository;
    this.sessionRepository = sessionRepository;
  }

  /**
   * Execute a Moon Walk session.
   * Optionally, pair only the provided activeStudents.
   * @param {string} group 
   * @param {Array} [activeStudents] - Optional filtered list of students.
   * @returns {Promise<Object>} - { pairs }
   */
  async execute(group, activeStudents = null) {
    const students = activeStudents || await this.studentRepository.findByGroup(group);
    const pairs = this._pairStudents(students);

    const session = new Session({
      type: 'moon_walk',
      group,
      pairs,
      questions: [],
    });

    await this.sessionRepository.save(session);
    return { pairs };
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