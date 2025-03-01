# Cohead Bot: Pair Students for  Programming, Moon Walk,  Traid Contest and Quickly review heads-up submissions

This Telegram bot is designed to help A2SV heads quickly pair students for **Pair Programming**, **Moon Walk**, and **Traid Contest** sessions. It also features an attendance summary  that allows heads to easily record and verify student attendance.

# Pair Programming and Moon Walk Telegram Bot

This Telegram bot is designed to pair students for **Pair Programming** and **Moon Walk** sessions at A2SV. The bot allows admins to create and manage pairings for each session, ensuring that students are paired equally and without repetition.

## Features

- **Pair Programming**:
  - Pair students together and assign them LeetCode problems to solve.
  - Admin selects the group and provides LeetCode question titles.
  - Students are paired randomly for each session, with no repetition.
  
- **Moon Walk**:
  - Pair students together and encourage them to converse in English to improve communication skills.
  - Admin selects the group, and the bot generates random student pairings.

- **Excused Command**:
  - Allows admins to quickly review heads-up submissions from specific groups (such as G61 or G63) for the current day.
  - Retrieves today's submissions, filters by group, extracts student names, builds a summary report, and sends the final report to the Telegram chat.

## Prerequisites

- Node.js installed (version 14 or higher recommended).
- Telegram bot token (You can obtain one by creating a bot through [BotFather](https://core.telegram.org/bots#botfather)).
- MongoDB database (for storing student data and pairings).

## Installation

1. Clone this repository to your local machine:

    ```bash
    git clone https://github.com/kika1s1/cohead-bot.git
    ```

2. Navigate to the project directory:

    ```bash
    cd cohead-bot
    ```

3. Install dependencies:

    ```bash
    npm install
    ```

4. Create a [.env](http://_vscodecontentref_/1) file in the root directory of your project and add your Telegram bot token, MongoDB connection URI, Gemini API key, OpenAI API key, and port:

    ```env
    TELEGRAM_BOT_TOKEN=your_telegram_bot_token
    MONGODB_URI=your_mongodb_connection_uri
    GEMINI_API_KEY=your_gemini_api_key
    OPENAI_API_KEY=your_openai_api_key
    PORT=3000
    ```

5. Start the bot:

    ```bash
    npm run dev
    ```

## Usage

### Pair Programming Session

1. The admin types `/pair_programming` in the Telegram chat.
2. The bot prompts the admin to select a group (e.g., G61).
3. The admin provides a list of LeetCode question titles (e.g., `Two Sum, Add Two Numbers, Zigzag Conversion`).
4. The bot fetches the LeetCode questions and pairs the students randomly.
5. The bot posts the pairing information and the LeetCode questions to the Telegram chat.

### Moon Walk Session

1. The admin types `/moon_walk` in the Telegram chat.
2. The bot prompts the admin to select a group (e.g., G61).
3. The bot pairs students randomly for a conversation session.
4. The bot shares the pairings in the Telegram chat along with instructions for the Moon Walk session.

### Excused Command

The `/excused` command allows admins to quickly review heads-up submissions from specific groups (such as G61 or G63) for the current day. When an admin sends the `/excused` command within a Telegram chat under a supported group topic, the bot:

1. **Retrieves Today's Submissions:**  
   It collects all the heads-up submissions recorded for the current day.

2. **Filters by Group:**  
   The bot filters the submissions to include only those made by students from the specified group (for example, G61 or G63).

3. **Extracts Student Names:**  
   It then extracts the names of the students who submitted a valid heads-up message.

4. **Builds a Summary Report:**  
   The bot compiles a summary that lists the names of all students from the group who wrote their heads-up message, and it also includes a total count of these submissions.

5. **Sends the Final Report:**  
   Finally, the bot posts the summary and the total count back to the Telegram chat, giving admins a quick snapshot of attendance and notifications for that day.

*Example Output:*

```
**Excused Submissions for G61:**
- Abdulaziz
- Isa
- Abdiwak

**Total Submissions:** 3
```

**Heads-Up submissions for G61 on 3/1/2025:**
- John Doe: I'm running late due to traffic.
- Jane Smith: I won't attend because of an appointment.

**Total Submissions:** 2

## Example Telegram Output

### Pair Programming Session

🚀 **Pair Programming Power Session: Let's Solve Questions Together!** 💡

**Student Pairings:**

- Abdulaziz & Isa
- Abdiwak & Amsalu
- Abdulbaset & Alem

**Questions:**

- [Two Sum](https://leetcode.com/problems/two-sum/) - Difficulty: unknown
- [Add Two Numbers](https://leetcode.com/problems/add-two-numbers/) - Difficulty: unknown
- [Zigzag Conversion](https://leetcode.com/problems/zigzag-conversion/) - Difficulty: unknown

### Moon Walk Session

🌟 **Moon Walk Session: Let’s Improve Communication Together!** 🗣️

**Student Pairings:**

- Abdulaziz & Isa
- Abdiwak & Amsalu
- Abdulbaset & Alem

**Instructions:**
Please go out with your partner and converse in English for 10-15 minutes. Focus on improving your communication and speaking skills. Enjoy the session!

## Contributing

If you'd like to contribute to this project, please fork the repository and submit a pull request. We welcome contributions to improve the functionality, add features, or fix bugs.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

- **Author**: Tamirat Kebede
- **GitHub**: [https://github.com/kika1s1](https://github.com/kika1s1)
- **Email**: tamiratkebede120@gmail.com