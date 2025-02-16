export class Session {
    constructor({ type, group, pairs, questions }) {
      this.type = type;
      this.group = group;
      this.pairs = pairs;
      this.questions = questions;
    }
  }