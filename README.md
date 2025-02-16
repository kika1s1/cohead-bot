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

4. Create a [.env](http://_vscodecontentref_/1) file in the root directory of your project and add your Telegram bot token and MongoDB connection URI:

    ```env
    TELEGRAM_BOT_TOKEN=your_telegram_bot_token
    MONGODB_URI=your_mongodb_connection_uri
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

## Example Telegram Output

### Pair Programming Session

🚀 **Pair Programming Power Session: Let's Solve LeetCode Together!** 💡

**Student Pairings:**

- Abdulaziz & Isa
- Abdiwak & Amsalu
- Abdulbaset & Alem

**LeetCode Questions:**

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