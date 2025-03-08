import { Session } from '../../domain/entities/Session.js';

// Grouping 
export class Grouping {
  constructor(studentRepository, sessionRepository) {
    this.studentRepository = studentRepository;
    this.sessionRepository = sessionRepository;
  }

  /**
   * Execute a grouping students .
   * It expects an array of leader objects and an array of remaining active students.
   * For each leader, it assigns exactly 2 students to form a triad.
   * @param {string} group - The group identifier (e.g. "G61").
   * @param {Array<Object>} leaders - Array of chosen leader student objects.
   * @param {Array<Object>} remainingStudents - Active students who did not submit Heads Up.
   * @returns {Promise<Array>} - An array of groups (each group is an array of 3 student objects).
   */
  async execute(group, leaders, remainingStudents) {
    // Make sure there are enough remaining students to pair 2 per leader.
    if (remainingStudents.length < leaders.length * 2) {
      throw new Error("Not enough active students to form complete grouping with the specified leaders.");
    }
    // Shuffle the remaining students.
    const shuffled = remainingStudents.sort(() => Math.random() - 0.5);
    const groups = [];
    let i = 0;
    while (shuffled.length > 0) {
      const leader = leaders[i % leaders.length];
      let group = groups.find(g => g[0].id === leader.id);
      if (!group) {
        group = [leader];
        groups.push(group);
      }
      group.push(shuffled.shift());
      i++;
    }
    // Save the session (using SessionModel via sessionRepository).
    const session = new Session({
      type: 'group',
      group,
      pairs: groups, // Using the same field to store groups.
      questions: [],
    });
    await this.sessionRepository.save(session);
    return groups;
  }
}