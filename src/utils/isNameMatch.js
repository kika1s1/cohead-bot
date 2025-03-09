import * as fuzzball from 'fuzzball';

/**
 * Uses fuzzball to compare two names approximately.
 * Returns true if the fuzzy token_set_ratio is at least 85%.
 * @param {string} studentName - The student's official name.
 * @param {string} submissionName - The name provided in the heads-up.
 * @returns {boolean}
 */
function isNameMatch(studentName, submissionName) {
  const normalize = str => str.toLowerCase().trim();
  const nStudent = normalize(studentName);
  const nSubmission = normalize(submissionName);

  // Check fuzzy match using token_set_ratio
  const score = fuzzball.token_set_ratio(nStudent, nSubmission);
  return score >= 85;
}

export default isNameMatch