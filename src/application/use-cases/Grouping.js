import { Session } from '../../domain/entities/Session.js';

export class Grouping {
  constructor(studentRepository, sessionRepository) {
    this.studentRepository = studentRepository;
    this.sessionRepository = sessionRepository;
  }

  /**
   * Execute student grouping.
   * It distributes all remaining active students among the chosen leaders using round-robin.
   * Each group will start with the leader followed by the assigned students.
   * @param {string} group - The group identifier (e.g. "G61").
   * @param {Array<Object>} leaders - Array of chosen leader student objects.
   * @param {Array<Object>} remainingStudents - Active students who did not submit Heads Up, minus the leaders.
   * @returns {Promise<Array>} - An array of groups (each group is an array of student objects).
   */
  async execute(group, leaders, remainingStudents) {
    // Initialize groups: each group starts with its leader.
    const groups = leaders.map(leader => [leader]);
    // Shuffle remaining students.
    const shuffled = remainingStudents.sort(() => Math.random() - 0.5);
    // Distribute all remaining students among the groups using round-robin.
    for (let i = 0; i < shuffled.length; i++) {
      groups[i % groups.length].push(shuffled[i]);
    }
    // Save the session.
    const session = new Session({
      type: 'grouping',
      group,
      pairs: groups, // storing groups in the "pairs" field.
      questions: [],
    });
    await this.sessionRepository.save(session);
    return groups;
  }
}
