import { Student } from '../../domain/entities/Student.js';
import { Session } from '../../domain/entities/Session.js';

export class PairProgramming {
  constructor(studentRepository, sessionRepository, leetCodeAPI) {
    this.studentRepository = studentRepository;
    this.sessionRepository = sessionRepository;
    this.leetCodeAPI = leetCodeAPI;
  }

  async execute(group, questionNumbers) {
    const students = await this.studentRepository.findByGroup(group);
    const questions = await this.leetCodeAPI.fetchQuestions(questionNumbers);
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
    const shuffled = students.sort(() => 0.5 - Math.random());
    const pairs = [];
    for (let i = 0; i < shuffled.length; i += 2) {
      pairs.push([shuffled[i], shuffled[i + 1]]);
    }
    return pairs;
  }
}