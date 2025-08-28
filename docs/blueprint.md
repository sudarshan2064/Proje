# **App Name**: TriviArena

## Core Features:

- Login System: Allow users to sign in with Google or Email using Firebase Authentication.
- Lobby & Matchmaking: Enable players to create or join a game room with a limit of 2-6 players, showing active rooms from Firestore in real-time.
- Trivia Gameplay: Presents a trivia game where each round pulls random trivia questions from Firestore with a timer per question, allowing players to answer via multiple-choice UI.
- Scoring System: Implement a scoring system where correct answers earn +10 points and incorrect answers earn 0, with leaderboard updates displayed live using Firebase Realtime Database.
- AI-Powered Difficulty Adjustment: The AI tool analyzes player performance and trivia question difficulty to dynamically adjust question selection for a balanced and engaging experience.

## Style Guidelines:

- Primary color: Deep blue (#2962FF) to convey trust, intelligence, and focus, critical for a trivia game.
- Background color: Light gray (#F0F4F8), providing a neutral backdrop that ensures readability and reduces eye strain during gameplay.
- Accent color: Bright orange (#FF7733) to draw attention to key elements like timers and correct answer feedback, enhancing the user's focus.
- Font: 'Inter', a grotesque-style sans-serif suitable for headlines and body text.
- Use flat design icons for game controls and feedback to maintain a clean and modern interface.
- A mobile-friendly layout with clearly defined sections for the lobby, question display, and leaderboard to ensure usability on smaller screens.
- Subtle animations for transitions between questions and updates to the leaderboard to keep the user engaged without being distracting.