# Cohead Bot: Pair Students for Pair Programming, Moon Walk, and Grouping Students with a Leader for triad contest  & Quickly Review Heads-Up Submissions of students and etc.

This Telegram bot is designed to help A2SV heads quickly pair students for **Pair Programming** and **Moon Walk** sessions, and to group students under a designated leader. The grouping functionality assigns one leader (provided by an admin via a pop-up keyboard) to each group, pairing exactly two additional students with the leader. It also features an attendance summary that allows heads to easily record and verify student attendance.

## Features

- **Pair Programming**:
  - Pair students together and assign them LeetCode problems to solve.
  - Admin selects the group and provides LeetCode question titles.
  - Students are paired randomly for each session, with no repetition.
  
- **Moon Walk**:
  - Pair students together and encourage them to converse in English to improve communication skills.
  - Admin selects the group, and the bot generates random student pairings.

- **Grouping Students**:
  - Admins designate one or more leaders (via a pop-up keyboard) using the `/grouping` command.
  - The bot filters out students who have submitted a heads-up message.
  - It then groups the remaining active students into each group consists of one leader.
  - The designated leader is responsible for their group's coordination and performance.

- **Excused Command**:
  - Allows admins to quickly review heads-up submissions from specific groups (such as G61, G2, G3, ... G69) for the current day.
  - Retrieves today's submissions, filters by group, extracts student names, builds a summary report, and sends the final report to the Telegram chat.

## Prerequisites

- Node.js installed (version 14 or higher recommended).
- Telegram bot token (You can obtain one by creating a bot through [BotFather](https://core.telegram.org/bots#botfather)).
- MongoDB database (for storing student data, pairings, and groupings).

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
3. The admin provides a list of LeetCode question links comma separated (e.g., `https://leetcode.com/problems/letter-tile-possibilities/description,https://leetcode.com/problems/two-sum/description)`).
4. The bot fetches the LeetCode questions and pairs the students randomly.
5. The bot posts the pairing information and the LeetCode questions to the Telegram chat.

### Moon Walk Session

1. The admin types `/moon_walk` in the Telegram chat.
2. The bot pairs students randomly for a conversation session.
3. The bot shares the pairings in the Telegram chat along with instructions for the Moon Walk session.

### Grouping Students

1. The admin types `/grouping` in the Telegram chat and, via the pop-up keyboard, provides one or more leader names.
2. The bot retrieves all students in the selected group and filters out those who submitted a heads-up and those are absent.
3. The bot groups the remaining active students into  each group consists of one designated leader.
4. The bot then posts the grouping result to the Telegram chat, highlighting the leader in each group.

### Excused Command

The `/excused` command allows admins to quickly review heads-up submissions from specific groups for the current day. When an admin sends `/excused` in a supported group topic, the bot:

1. **Retrieves Today's Submissions:**  
   It collects all heads-up submissions recorded for the current day.

2. **Filters by Group:**  
   The bot filters the submissions to include only those from the specified group.

3. **Extracts Student Names:**  
   It extracts the names of students who submitted a valid heads-up message.

4. **Builds a Summary Report:**  
   The bot compiles and sends a summary report, listing all names and the total count.

## Contributing

If you'd like to contribute to this project, please fork the repository and submit a pull request. We welcome contributions to improve functionality, add features, or fix bugs.

## License

This project is licensed under the MIT License – see the LICENSE file for details.

## Contact

- **Author**: Tamirat Kebede
- **GitHub**: [https://github.com/kika1s1](https://github.com/kika1s1)
- **Email**: tamiratkebede120@gmail.com