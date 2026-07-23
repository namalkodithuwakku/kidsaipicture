export type EverydayLesson = {
  id: string;
  category: string;
  scene: string;
  title: string;
  phrase: string;
  meaning: string;
  example: string;
};

export const EVERYDAY_CATEGORIES = [
  "Speak Naturally", "Questions", "Directions", "Time & Plans",
  "Travel", "Work & Study", "Opinions", "Problems",
] as const;

const raw: Array<[string, string, string, string, string, string]> = [
  ["Speak Naturally", "🙂", "Starting a Chat", "How is everything going?", "Ask someone how life is going.", "How is everything going at school?"],
  ["Speak Naturally", "👍", "Showing Agreement", "That sounds like a good idea.", "Say that you agree with a suggestion.", "Let us walk. That sounds like a good idea."],
  ["Speak Naturally", "🤔", "Thinking First", "Let me think about it.", "Ask for time before deciding.", "Let me think about it and tell you tomorrow."],
  ["Speak Naturally", "✨", "Giving Praise", "You did a wonderful job.", "Praise someone for good work.", "Your drawing is beautiful. You did a wonderful job."],
  ["Questions", "❓", "Asking for Meaning", "What does this word mean?", "Ask someone to explain a word.", "What does the word journey mean?"],
  ["Questions", "🔁", "Checking Understanding", "Could you explain that again?", "Politely ask for another explanation.", "I am not sure. Could you explain that again?"],
  ["Questions", "🗣️", "Learning Pronunciation", "How do you pronounce this?", "Ask how a word should sound.", "How do you pronounce this name?"],
  ["Questions", "💡", "Asking for an Example", "Can you give me an example?", "Ask for an example to understand better.", "Can you give me an example of a polite request?"],
  ["Directions", "🗺️", "Finding a Place", "How can I get to the station?", "Ask for directions to a place.", "Excuse me, how can I get to the station?"],
  ["Directions", "➡️", "Giving Directions", "Go straight and turn right.", "Give two simple direction steps.", "Go straight and turn right at the bank."],
  ["Directions", "📍", "Checking Distance", "Is it far from here?", "Ask whether a place is far away.", "Is the hospital far from here?"],
  ["Directions", "🚶", "Confirming the Way", "Am I going the right way?", "Check that your direction is correct.", "Excuse me, am I going the right way?"],
  ["Time & Plans", "🕐", "Checking the Time", "What time should we meet?", "Ask for a meeting time.", "What time should we meet tomorrow?"],
  ["Time & Plans", "📅", "Making a Plan", "Are you available this weekend?", "Ask whether someone is free.", "Are you available this weekend for lunch?"],
  ["Time & Plans", "⏳", "Running Late", "I will be there in ten minutes.", "Explain when you will arrive.", "I am running late, but I will be there in ten minutes."],
  ["Time & Plans", "🔄", "Changing a Plan", "Can we meet another day?", "Politely ask to change a plan.", "I am busy today. Can we meet another day?"],
  ["Travel", "🎫", "Buying a Ticket", "I would like a ticket to Kandy.", "Clearly request a travel ticket.", "Good morning. I would like a ticket to Kandy."],
  ["Travel", "🏨", "At a Hotel", "I have a reservation under my name.", "Tell hotel staff about your booking.", "Hello, I have a reservation under my name."],
  ["Travel", "🧳", "Lost Luggage", "My bag has not arrived yet.", "Explain a luggage problem.", "Excuse me, my bag has not arrived yet."],
  ["Travel", "📸", "Asking for a Photo", "Could you take a photo for us?", "Politely ask someone to take a picture.", "Excuse me, could you take a photo for us?"],
  ["Work & Study", "📝", "Clarifying a Task", "What should I do first?", "Ask which task has priority.", "I understand the project. What should I do first?"],
  ["Work & Study", "🤝", "Offering Support", "Would you like me to help?", "Offer help in a polite way.", "You look busy. Would you like me to help?"],
  ["Work & Study", "📧", "Following Up", "I am checking on my previous message.", "Politely follow up on communication.", "Hello, I am checking on my previous message."],
  ["Work & Study", "✅", "Finishing Work", "I have completed the task.", "Clearly report that work is finished.", "I have completed the task and checked it twice."],
  ["Opinions", "💭", "Sharing a View", "In my opinion, this is better.", "Introduce your personal opinion.", "In my opinion, this route is better."],
  ["Opinions", "⚖️", "Agreeing Partly", "I understand, but I see it differently.", "Disagree in a respectful way.", "I understand your point, but I see it differently."],
  ["Opinions", "⭐", "Stating a Preference", "I would prefer the first option.", "Politely say which choice you prefer.", "Both are good, but I would prefer the first option."],
  ["Opinions", "🧠", "Giving a Reason", "I chose it because it is simpler.", "Support your choice with a reason.", "I chose this plan because it is simpler."],
  ["Problems", "⚠️", "Reporting a Problem", "There seems to be a problem.", "Introduce a problem calmly.", "Excuse me, there seems to be a problem with my order."],
  ["Problems", "🛠️", "Requesting a Fix", "Could you please check this?", "Politely ask someone to investigate.", "This is not working. Could you please check this?"],
  ["Problems", "🚫", "Setting a Boundary", "I am not comfortable with that.", "Clearly and politely state a boundary.", "Thank you, but I am not comfortable with that."],
  ["Problems", "🆘", "Getting Urgent Help", "Please call someone who can help.", "Request help from the right person.", "This is urgent. Please call someone who can help."],
];

export const EVERYDAY_LESSONS: EverydayLesson[] = raw.map(
  ([category, scene, title, phrase, meaning, example], index) => ({
    id: `everyday-${index + 1}`,
    category,
    scene,
    title,
    phrase,
    meaning,
    example,
  }),
);
