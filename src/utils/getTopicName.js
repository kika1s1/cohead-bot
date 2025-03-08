// Helper to get the group (topic) name from the thread ID.
async function getTopicName(chatId, threadId) {
    const mapping = {
      281: "G61",
      1010: "G62",
      1015: "G63",
      1021: "G64",
      1048: "G65",
      1057: "G66",
      1080: "G67",
      518: "G68",
      255: "G69",
      359: "Heads Up",
    };
    return mapping[threadId] || false;
  }

export default getTopicName;