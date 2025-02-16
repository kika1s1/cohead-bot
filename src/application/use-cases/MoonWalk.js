import { Student } from '../../domain/entities/Student.js';
import { Session } from '../../domain/entities/Session.js';

export class MoonWalk {
  constructor(studentRepository, sessionRepository) {
    this.studentRepository = studentRepository;
    this.sessionRepository = sessionRepository;
  }

  async execute(group) {
    const students = await this.studentRepository.findByGroup(group);
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
    const shuffled = students.sort(() => 0.5 - Math.random());
    const pairs = [];
    for (let i = 0; i < shuffled.length; i += 2) {
      pairs.push([shuffled[i], shuffled[i + 1]]);
    }
    return pairs;
  }
}