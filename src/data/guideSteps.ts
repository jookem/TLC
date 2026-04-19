export interface GuideStep {
  title: string
  icon: string
  body: string
  link?: string
  linkLabel?: string
}

export const teacherGuide: GuideStep[] = [
  {
    title: 'Welcome to NaruBase',
    icon: '👋',
    body: `This is your teacher dashboard — your home base every time you log in.

At a glance you can see:
• Your total active students
• Upcoming lessons count
• Pending booking requests from students
• A bar chart of lessons completed over the last 8 weeks

If a student's birthday is today, a celebration banner will appear here too.`,
    link: '/dashboard',
    linkLabel: 'Go to Dashboard',
  },
  {
    title: 'Adding & Managing Students',
    icon: '👥',
    body: `The Students page lists all your students, grouped by teacher.

To add a student you have two options:

1. Invite Code — Share your unique invite code with a student so they can sign up and automatically link to you. Find your code in Settings.

2. Placeholder Student — Create a profile yourself for students who won't use the app (e.g. young children). Go to Students → click "Add Student."

Students are organized in collapsible sections per teacher, so you can see at a glance which teacher owns each student.`,
    link: '/students',
    linkLabel: 'Go to Students',
  },
  {
    title: 'Student Profiles',
    icon: '📋',
    body: `Click any student's name to open their full profile.

The Profile tab lets you record:
• Birthday (auto-computes age, shows 🎂 on their birthday)
• Grade / school level and school name or occupation
• EIKEN grade, TOEIC, IELTS, TOEFL, self-assessed CEFR
• Hobbies, likes, dislikes
• Learning goals / dreams and private teacher notes

Students can also view their own profile information from their side of the app.`,
    link: '/students',
    linkLabel: 'Go to Students',
  },
  {
    title: 'Grammar Bank',
    icon: '📝',
    body: `Inside a student's profile, open the Grammar tab to manage their grammar cards.

• Add individual grammar points with example sentences, notes, and a Japanese translation.
• Assign cards to Grammar Decks to group related points (e.g. "Present Perfect," "Modal Verbs").
• Each card has a Mastery Level (New → Seen → Familiar → Mastered) tracked by spaced-repetition review.
• You can also add fill-in-the-blank versions of sentences that the student practices in review mode.

The student sees their due grammar cards on their dashboard with a "Review now" prompt.`,
    link: '/students',
    linkLabel: 'Go to Students',
  },
  {
    title: 'Vocabulary Bank',
    icon: '📚',
    body: `The Vocab tab in a student's profile lets you build their personal word list.

• Add words with a definition, example sentence, and an optional image.
• Organize words into Vocab Decks (e.g. "EIKEN 3級," "Food & Drink").
• Mastery levels work the same as grammar — spaced repetition drives review timing.
• Multiple quiz modes: flashcard flip, multiple choice, and typing the answer.

Students see overdue vocab cards highlighted on their home dashboard.`,
    link: '/students',
    linkLabel: 'Go to Students',
  },
  {
    title: 'Sentence Puzzles',
    icon: '🧩',
    body: `The Puzzles tab lets you build Japanese word-order puzzle decks for a student.

• Create a Puzzle Deck, then add sentences (English hints with a Japanese translation to unscramble).
• Use "🌐 Translate missing" to auto-translate all English hints into Japanese via the free MyMemory API.
• In the editor you can manually fix the Japanese translation and reorder the puzzle word pieces using ▲▼ buttons.
• Students play these in the Games section (Train Game) — dragging word tiles into the correct order.`,
    link: '/students',
    linkLabel: 'Go to Students',
  },
  {
    title: 'Setting Your Availability',
    icon: '🕐',
    body: `Go to Availability to set the times you are open for lessons.

• Recurring slots repeat every week on the same day and time (e.g. every Tuesday 15:00–19:00).
• One-off slots are available on a specific date only.

Students see your available slots when they go to Book a lesson. Slots that are already filled by an approved lesson are automatically hidden.

All times are displayed in each user's own timezone, so there's no confusion for international students.`,
    link: '/availability',
    linkLabel: 'Go to Availability',
  },
  {
    title: 'Calendar',
    icon: '📅',
    body: `The Calendar shows all scheduled lessons across all teachers in the school.

• Use the teacher toggle buttons at the top to show or hide each teacher's schedule. Each teacher gets a distinct color.
• Click any day to see the lessons in a detail panel.
• Pending booking requests from students appear in the right-hand panel — click "Review" to approve or decline.
• Approved bookings automatically create a lesson and send the student a notification.`,
    link: '/calendar',
    linkLabel: 'Go to Calendar',
  },
  {
    title: 'Scheduling & Logging Lessons',
    icon: '🗓️',
    body: `You can create lessons in two ways:

1. Approving a booking request on the Calendar page (student-initiated).
2. Manually from the Lessons page — select a student from the left sidebar, then click "+ Add Lesson."

When adding a lesson manually:
• Set a date, time, and duration.
• Choose lesson type (Trial / Regular / Intensive).
• Toggle "Group lesson" to add multiple students and give the group a name.
• You can log past lessons too — just set a date in the past and mark status as Completed.`,
    link: '/lessons',
    linkLabel: 'Go to Lessons',
  },
  {
    title: 'Lesson Notes',
    icon: '🗒️',
    body: `Click any lesson to open its detail page and add notes.

Lesson notes include:
• Summary — what was covered in the lesson
• Areas to Focus — things the student should work on
• Homework — assignment for next time

Toggle "Visible to student" to share the notes with the student. They'll see them on their Lessons page and their dashboard.

Notes also link to a student's lesson history so you can review progress over time.`,
    link: '/lessons',
    linkLabel: 'Go to Lessons',
  },
  {
    title: 'Student Goals',
    icon: '🎯',
    body: `In a student's profile, the Goals tab lets you set learning objectives.

• Create a goal with a title, description, and an optional target date.
• Add milestones (sub-tasks) and check them off as the student completes them.
• Goals with a target date show a countdown on the student's dashboard.
• The student sees a progress bar based on completed milestones.

Use goals to keep students motivated — e.g. "Pass EIKEN Grade 3 by July."`,
    link: '/students',
    linkLabel: 'Go to Students',
  },
  {
    title: 'Progress Snapshots',
    icon: '📊',
    body: `In a student's profile, the Progress tab lets you log periodic skill assessments.

Record scores (1–10) for:
• Speaking, Listening, Reading, Writing

Plus an overall CEFR level (A1 → C2) and free-form notes.

Snapshots are timestamped so you can track improvement over time. The student sees their latest snapshot as a skill bar chart on their home dashboard.

That covers everything on the teacher side! You're ready to get started. 🎉`,
    link: '/students',
    linkLabel: 'Go to Students',
  },
]

export const studentGuide: GuideStep[] = [
  {
    title: 'Welcome to NaruBase',
    icon: '👋',
    body: `こんにちは！ This is your home dashboard.

Here you'll see:
• 今日の復習 — grammar and vocabulary cards due for review today
• Your next upcoming lesson with a Join button when the time comes
• Your active goal with a countdown to the target date
• Your study streak 🔥 — keep it going by studying every day!

Your progress and recent lesson notes are shown below.`,
    link: '/dashboard',
    linkLabel: 'Go to Dashboard',
  },
  {
    title: 'Booking a Lesson',
    icon: '📆',
    body: `Go to 予約 (Book) to request a lesson with your teacher.

Steps:
1. Select which teacher you'd like a lesson with.
2. Pick a date — available time slots will appear.
3. Choose a slot and add an optional note for your teacher.
4. Submit — your teacher will approve or suggest another time.

Once approved, the lesson will appear on your Lessons page and your dashboard. You'll receive a notification when your teacher responds.`,
    link: '/book',
    linkLabel: 'Go to Book',
  },
  {
    title: 'Your Lessons',
    icon: '📖',
    body: `The レッスン (Lessons) page shows all your lessons — upcoming and past.

Upcoming lessons show:
• Date and time (in your timezone)
• A "Join" button with the meeting link when provided by your teacher

Past lessons show:
• Teacher's lesson notes (summary, homework, areas to focus) if your teacher made them visible
• This is a great place to review what was covered and check your homework

Tap any lesson to open its full detail page.`,
    link: '/lessons',
    linkLabel: 'Go to Lessons',
  },
  {
    title: 'Your Goals',
    icon: '🎯',
    body: `The 目標 (Goals) page shows the learning objectives your teacher has set for you.

• Each goal has a title and an optional target date with a countdown.
• Milestones are sub-tasks — you can see how many have been completed.
• A progress bar shows how far along you are.

Goals are set by your teacher, so talk to them if you'd like to add or adjust a goal. Use the countdown to stay motivated and on track!`,
    link: '/goals',
    linkLabel: 'Go to Goals',
  },
  {
    title: 'Vocabulary Study',
    icon: '📚',
    body: `The 単語 (Vocab) page contains all the words your teacher has added for you.

• Words are organized into decks (e.g. "EIKEN 5級," "Food vocabulary").
• Each word has a mastery level: New → Seen → Familiar → Mastered.
• When cards are due for review, you'll see a badge number on the nav and a prompt on your dashboard.

Review modes:
• Flashcard — see the word, flip to check the answer
• Multiple choice — pick the correct meaning
• Type answer — type the word from memory

The app uses spaced repetition — words you struggle with come back sooner.`,
    link: '/vocabulary',
    linkLabel: 'Go to Vocabulary',
  },
  {
    title: 'Grammar Study',
    icon: '✏️',
    body: `The 文法 (Grammar) page contains grammar points your teacher has assigned.

• Cards show a grammar rule with an example sentence and Japanese translation.
• Mastery works the same as vocabulary — spaced repetition keeps due cards coming back.
• Some cards have a fill-in-the-blank mode where you type the missing word.

When grammar cards are due, a badge appears on the nav icon and a "Review now" button appears on your dashboard. Try to clear your due cards every day to build a strong streak 🔥`,
    link: '/grammar',
    linkLabel: 'Go to Grammar',
  },
  {
    title: 'Games — Word Puzzle (Train)',
    icon: '🧩',
    body: `The ゲーム (Games) page has fun ways to practice English.

The Train Game (word puzzle) shows you an English sentence as a hint, and scrambled Japanese word tiles below. Tap the tiles in the correct order to build the sentence.

• Your teacher creates puzzle decks for you (e.g. "EIKEN 5 Sentences").
• Choose a deck and tap "Start" to begin.
• You can see your score for each sentence after completing the deck.

This is great practice for understanding Japanese sentence structure!`,
    link: '/games',
    linkLabel: 'Go to Games',
  },
  {
    title: 'Games — Spelling',
    icon: '🔤',
    body: `The Spelling game tests your English spelling.

• A word is shown on screen — listen to the pronunciation, then type it correctly.
• You get three attempts before the answer is revealed.
• Words come from your vocabulary decks, so everything you practice is relevant to your lessons.

Tip: Use headphones for the best audio experience when playing the spelling game.`,
    link: '/games',
    linkLabel: 'Go to Games',
  },
  {
    title: 'Games — Karaoke Speaking',
    icon: '🎤',
    body: `The Karaoke game helps you practice speaking English aloud.

• A sentence appears on screen — read it out loud clearly.
• The app listens using your microphone and highlights each word as it hears you say it (yellow = matched ✅).
• After finishing, you get a score for each sentence and an overall percentage.

This works best in Chrome or Edge on desktop. Make sure to allow microphone access when prompted.

Sentences come from the grammar example sentences your teacher has added.`,
    link: '/games',
    linkLabel: 'Go to Games',
  },
  {
    title: 'Settings',
    icon: '⚙️',
    body: `Go to Settings (via your avatar menu at the top right) to customize your experience.

• Timezone — make sure this is set correctly so lesson times display accurately.
• Language — switch the app interface between Japanese and English.
• Notifications — turn email notifications on or off.
• Display name — set a nickname that your teacher will see.

That's everything! You're all set to make the most of NaruBase. 頑張ってください！ 🎉`,
    link: '/settings',
    linkLabel: 'Go to Settings',
  },
]
