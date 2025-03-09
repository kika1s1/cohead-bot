# Cohead Bot

Cohead Bot is a Telegram bot aimed at helping A2SV heads quickly manage student sessions including pairing for pair programming, moon walk sessions, grouping students under designated leaders, as well as tracking attendance via heads-up submissions. The bot uses interactive inline keyboards for admin commands and integrates with external services such as LeetCode and OpenAI/Gemini APIs.

## Features

- **Pair Programming Session**
  - **Description:** Pairs students together and assigns them LeetCode problems.
  - **Workflow:**
    1. Admin issues the `/pair_programming` command.
    2. The bot prompts for the group and then asks for a comma-separated list of LeetCode question links.
    3. Questions are fetched and used to randomly pair students.
    4. The pairing information and questions are sent to the Telegram chat.

- **Moon Walk Session**
  - **Description:** Randomly pairs students to facilitate a 15-minute English conversation.
  - **Workflow:**
    1. Admin issues the `/moon_walk` command.
    2. The bot determines the group and filters out students who submitted heads-up.
    3. The bot sends a pairing message along with instructions for the session.

- **Grouping Students**
  - **Description:** Groups the remaining active students under designated group leaders.
  - **Workflow:**
    1. Admin issues the `/grouping` command.
    2. An inline keyboard is presented with a list of active students (those who did not submit a heads-up).
    3. The admin toggles selection to designate group leader(s) and confirms.
    4. The bot removes the leaders from the active pool and groups the remaining students evenly (using round-robin distribution).
    5. The grouping result is posted to the chat with leader(s) highlighted.

- **Excused Command**
  - **Description:** Reviews today’s heads-up submissions for the specified group.
  - **Workflow:**
    1. Admin issues the `/excused` command in a group chat (not in Heads Up topic).
    2. The bot retrieves all submissions for the current day.
    3. Submissions are split into two categories:
       - **Excused (🟢):** Submissions with `isExcused = true`.
       - **Unexcused (🔴):** Submissions with `isExcused = false`.
    4. A summary report, including the total count, is sent privately to the admin.

- **Absentee Command**
  - **Description:** Marks students as absent if they did not write a heads-up.
  - **Workflow:**
    1. Admin issues the `/absentee` command.
    2. The bot determines the group and fetches active students (those missing heads-up submissions).
    3. An inline keyboard is presented showing student names. Toggled buttons are marked with a red icon (🔴) to indicate absence.
    4. Upon confirmation, for each selected student a Heads-Up submission is created with the message “did not write any headsup” and `isExcused` is set to false.
    5. A summary of absentees is sent to the admin (privately).

- **Attendee Command**
  - **Description:** Displays all students marked absent (via Heads-Up submissions with `isExcused = false`) and allows the admin to toggle their status back to present.
  - **Workflow:**
    1. Admin issues the `/attendee` command.
    2. The bot looks up all records for the current group with `isExcused = false`.
    3. An inline keyboard is shown with each absent student represented by a red icon (🔴). Toggling marks them present (displayed with a green check ✅).
    4. After confirmation the DB is updated (setting the selected submission’s `isExcused` to true or deleting the absentee record) and a summary of who was marked present is sent privately to the admin.

## Technical Overview

- **Technologies & Libraries:**
  - **Node.js** for server-side runtime.
  - **node-telegram-bot-api** for interacting with Telegram.
  - **MongoDB** with **Mongoose** for data persistence.
  - **Express** for a simple status API endpoint.
  - **Fuzzball** for fuzzy string matching (helpful for filtering heads-up submissions).
  - **External APIs:**  
    - **LeetCodeAPI** for fetching coding questions.
    - **Google Generative AI / OpenAI API** for analyzing heads-up messages.
    
- **Modular & Class-based Design:**
  - Use cases (such as grouping, pair programming, and moon walk) are encapsulated as classes.
  - Controllers (such as HeadsUpController, GroupingController, AbsenteeController, and AttendeeController) manage command handling and inline keyboard interactions.
  - Security is enforced by verifying that only the admin who issued a command can interact with the inline keyboard (using the admin’s user ID stored in the pending state).

- **Inline Keyboard Interaction:**
  - Interactive inline keyboards are used for commands such as `/grouping`, `/absentee`, and `/attendee`.
  - Each inline button toggle is protected so that only the initiating admin can interact with it.
  - Upon confirmation, the inline messages are deleted and appropriate changes are persisted in the database.

## Project Structure

```
cohead-bot/
├── config/
│   └── env.js                // Environment configuration and secrets
├── domain/
│   ├── entities/
│   │   ├── Session.js        // Session entity (for grouping, pairing, etc.)
│   │   └── Student.js        // Student entity
│   └── repositories/
│       ├── StudentRepository.js  // Student data access logic
│       └── SessionRepository.js  // Session data access logic
├── infrastructure/
│   ├── database/
│   │   ├── mongoose/
│   │   │   ├── StudentModel.js
│   │   │   ├── SessionModel.js
│   │   │   └── HeadsUpSubmissionModel.js
│   ├── openai/
│   │   └── GoogleAIService.js // AI service for heads-up message analysis
│   ├── leetcode/
│   │   └── LeetCodeAPI.js     // Interacts with LeetCode API
│   └── telegram/
│       └── bot.js             // Initializes Telegram bot via node-telegram-bot-api
├── presentation/
│   ├── controllers/
│   │   ├── PairProgrammingController.js
│   │   ├── MoonWalkController.js
│   │   ├── HeadsUpController.js
│   │   ├── GroupingController.js
│   │   ├── AbsenteeController.js
│   │   └── AttendeeController.js
│   └── routes/
│       └── botRoutes.js       // Telegram command routing
├── application/
│   ├── use-cases/
│   │   ├── PairProgramming.js
│   │   ├── MoonWalk.js
│   │   ├── Grouping.js
│   │   └── HeadsUpAnalysis.js
├── seeder/
│   └── studentSeeder.js       // Seed (or delete) student data in MongoDB
├── .env                       // Environment variables (ignored by Git)
├── index.js                   // Main entry point: connects to MongoDB and imports routes
├── package.json               // Project metadata and dependencies
└── README.md                  // Project documentation (this file)
```

## Installation

1. **Clone the Repository:**
    ```bash
    git clone https://github.com/kika1s1/cohead-bot.git
    cd cohead-bot
    ```

2. **Install Dependencies:**
    ```bash
    npm install
    ```

3. **Environment Configuration:**
    - Create an `.env` file in the root directory with the following keys:
      ```env
      TELEGRAM_BOT_TOKEN=your_telegram_bot_token
      MONGODB_URI=your_mongodb_connection_uri
      GEMINI_API_KEY=your_gemini_api_key
      OPENAI_API_KEY=your_openai_api_key
      PORT=3000
      ```

4. **Seed the Database (Optional):**
    - To seed student data:
      ```bash
      npm run seed
      ```
    - To delete all seeded data:
      ```bash
      npm run delete
      ```

5. **Start the Bot:**
    ```bash
    npm run dev
    ```

## Usage

After starting the bot, admins can use the following commands in Telegram:

- **/pair_programming**  
  Initiates a pair programming session by asking for LeetCode question links and pairing available students.

- **/moon_walk**  
  Creates random student pairings for a moon walk session focused on conversational practice.

- **/grouping**  
  Displays an inline keyboard of active students (those who did not submit a heads-up).  
  The admin selects the designated group leader(s) before confirming the grouping.

- **/excused**  
  Retrieves today's heads-up submissions for a group and groups them by:
  - **Excused (🟢)**
  - **Unexcused (🔴)**  
  The summary is sent privately to the admin.

- **/absentee**  
  Lists active students (those missing heads-up submissions) using an inline keyboard so the admin can mark them as absent.  
  Confirming creates a heads-up record with `isExcused` set to false and sends a summary to the admin.

- **/attendee**  
  Displays the list of absent students (with `isExcused = false`) and lets the admin toggle them to present using an inline keyboard.  
  Confirming updates the database (marking selected students as present) and sends a summary privately.

_All inline keyboard interactions are secured so that only the admin who initiated the command may interact._

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request to add features, improve functionality, or fix bugs.

## License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.

## Contact

- **Author:** Tamirat Kebede  
- **GitHub:** [https://github.com/kika1s1](https://github.com/kika1s1)  
- **Email:** tamiratkebede120@gmail.com