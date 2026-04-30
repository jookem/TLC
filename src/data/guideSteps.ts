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
    body: `The Students page lists all your students.

To add a student you have two options:

1. Invite Code — Share your unique invite code with a student so they can sign up and automatically link to you. Find your code in Settings.

2. Placeholder Student — Create a profile yourself for students who won't use the app (e.g. young children). Go to Students → click "Add Student."

New accounts require approval before they can log in. If you don't receive the approval email, go to your Supabase dashboard and set the user's approval_status to "approved" in the profiles table.`,
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
    title: 'Lesson Materials — Tabs',
    icon: '🗂️',
    body: `On a student's profile page, all teaching materials are organised into four tabs:

• Vocabulary Decks — word lists for that student
• Grammar Decks — grammar lesson slides and quiz questions
• Train Puzzles — sentence word-order puzzle decks
• Eiken Picture Bank — picture description cards

The same four managers are also available globally (without a student context) under the Lesson Materials page in the main navigation — useful for managing deck content before assigning it to students.

Decks in all four tabs can be organised into collapsible folders using the folder icon.`,
    link: '/materials',
    linkLabel: 'Go to Lesson Materials',
  },
  {
    title: 'Grammar Decks — Lesson Slides',
    icon: '📝',
    body: `Grammar decks now have two tabs: Lesson Slides and Quiz Questions.

Start with Lesson Slides:
1. Type a grammar point (e.g. "Causative Verbs," "Present Perfect") into the input and click ✦ Generate slides.
2. The AI creates a set of lesson slides — title, explanation, example sentences with grammar highlighted in [brackets], and a Japanese note.
3. You can edit, reorder (▲▼), or delete slides. Add more grammar points to the same deck the same way.

Lesson slides are shown to the student as a step-by-step lesson before quiz practice begins.`,
    link: '/materials',
    linkLabel: 'Go to Lesson Materials',
  },
  {
    title: 'Grammar Decks — Quiz Questions',
    icon: '🧠',
    body: `Once you have lesson slides, switch to the Quiz Questions tab.

Click ✦ Generate questions — the AI reads your slides and creates fill-in-the-blank questions automatically:
• The blank always targets the grammar point (never a random noun or preposition).
• Multi-word answers use one blank per word (e.g. "has / lived" → two blanks).
• Each question includes three grammatically broken distractors for multiple-choice practice.
• Questions are grouped by grammar category.

The flashcard Pattern screen shows the Japanese equivalent inside each blank as a hint, so students can see the grammatical form they're learning.

Use the checkboxes to bulk-select and delete questions if you want to regenerate them.`,
    link: '/materials',
    linkLabel: 'Go to Lesson Materials',
  },
  {
    title: 'Vocabulary Decks',
    icon: '📚',
    body: `The Vocabulary tab lets you build word lists for a student.

• Add words with a Japanese definition, English definition, example sentence, reading, and an optional image.
• Organise words into Vocab Decks and group decks into folders.
• Import from Anki (.apkg files) to bulk-add words from an existing deck.
• Mastery levels (New → Seen → Familiar → Mastered) drive spaced-repetition review timing.
• Multiple quiz modes: flashcard flip, multiple choice, and typing the answer.

Use the checkboxes to bulk-select and delete words from any deck.`,
    link: '/materials',
    linkLabel: 'Go to Lesson Materials',
  },
  {
    title: 'Train Puzzle Decks',
    icon: '🧩',
    body: `Puzzle decks let students practice Japanese word order in the Train Game.

Generate puzzles automatically from existing decks:
• From a Grammar Deck — sentences are built from the quiz questions (blanks filled in), using the stored Japanese translation.
• From a Vocabulary Deck — sentences come from word example sentences, auto-translated if needed.

Or add sentences manually and edit the Japanese translation and word-piece order directly in the editor.

Students play the Train Game by tapping scrambled word tiles into the correct order. Use the checkboxes to bulk-delete puzzles when regenerating.`,
    link: '/materials',
    linkLabel: 'Go to Lesson Materials',
  },
  {
    title: 'Eiken Picture Bank',
    icon: '🖼️',
    body: `The Eiken Picture Bank stores images used for EIKEN picture description practice.

• Upload images and tag them with a level (3級, 準2級, 2級…) and category.
• Students can practice describing each image out loud — the image is shown full-screen in the Games section.
• Add a model answer to each image so students can compare their description.

This is especially useful for EIKEN students preparing for the secondary interview.`,
    link: '/materials',
    linkLabel: 'Go to Lesson Materials',
  },
  {
    title: 'Setting Your Availability',
    icon: '🕐',
    body: `Go to Availability to set the times you are open for lessons.

• Recurring slots repeat every week on the same day and time (e.g. every Tuesday 15:00–19:00).
• One-off slots are available on a specific date only.

Students see your available slots when they go to Book a lesson. Slots already filled by an approved lesson are automatically hidden.

All times are displayed in each user's own timezone, so there's no confusion for international students.`,
    link: '/availability',
    linkLabel: 'Go to Availability',
  },
  {
    title: 'Calendar',
    icon: '📅',
    body: `The Calendar shows all scheduled lessons across all teachers in the school.

• Use the teacher toggle buttons at the top to show or hide each teacher's schedule. Each teacher gets a distinct colour.
• Click any day to see the lessons in a detail panel.
• Click any lesson to view its notes inline — no need to navigate away.
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

You can also view lesson notes directly from the Calendar by clicking on a lesson day — no need to navigate to the Lessons page.`,
    link: '/lessons',
    linkLabel: 'Go to Lessons',
  },
  {
    title: 'Student Goals & Progress',
    icon: '🎯',
    body: `On a student's profile you'll find two useful sections:

Goals — set learning objectives with a title, description, and optional target date. Goals with a target date show a countdown on the student's dashboard. The student sees a progress bar based on completed milestones.

Progress Snapshots — log periodic skill assessments with scores (1–10) for Speaking, Listening, Reading, and Writing, plus an overall CEFR level. Snapshots are plotted on a line chart so you can track improvement over time.

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

• Words are organised into decks (e.g. "EIKEN 5級," "Food vocabulary").
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
    title: 'Grammar Study — Lesson & Pattern',
    icon: '✏️',
    body: `The 文法 (Grammar) page contains grammar decks your teacher has assigned.

Each deck has two study modes:

Lesson — step-by-step slides explaining the grammar rule with highlighted examples and a Japanese note. Read through these first to understand the pattern.

Pattern — flashcard practice using fill-in-the-blank sentences. The Japanese equivalent of the missing word(s) is shown inside the blank as a hint. Tap "Show Explanation" to reveal the answer and choose how well you knew it.

Mastery levels (New → Seen → Familiar → Mastered) drive spaced repetition — cards you struggle with come back sooner. Clear your due cards every day to build a study streak 🔥`,
    link: '/grammar',
    linkLabel: 'Go to Grammar',
  },
  {
    title: 'Games — Word Puzzle (Train)',
    icon: '🧩',
    body: `The ゲーム (Games) page has fun ways to practice English.

The Train Game (word puzzle) shows you a Japanese sentence as a prompt, and scrambled English word tiles below. Tap the tiles in the correct order to build the sentence.

• Your teacher creates puzzle decks for you (e.g. "Causative Verbs," "EIKEN 5 Sentences").
• Choose a deck and tap "Start" to begin.
• You can see your score for each sentence after completing the deck.

Puzzles are often generated directly from your grammar lessons, so you'll recognise the sentences!`,
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
    body: `Go to Settings (via your avatar menu at the top right) to customise your experience.

• Timezone — make sure this is set correctly so lesson times display accurately.
• Language — switch the app interface between Japanese and English.
• Notifications — turn email notifications on or off.
• Display name — set a nickname that your teacher will see.

That's everything! You're all set to make the most of NaruBase. 頑張ってください！ 🎉`,
    link: '/settings',
    linkLabel: 'Go to Settings',
  },
]
