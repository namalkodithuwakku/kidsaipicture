export type ConversationLesson = {
  id: string;
  category: string;
  scene: string;
  title: string;
  situation: string;
  lines: Array<{ speaker: "A" | "B"; text: string }>;
};

export const CONVERSATION_CATEGORIES = [
  "Meeting People", "At Home", "At School", "Food", "Shopping",
  "Travel", "Health", "Telephone", "Work", "Emergencies",
] as const;

const raw: Array<[string, string, string, string, string, string, string]> = [
  ["Meeting People", "👋", "A New Friend", "Meeting someone for the first time", "Hello! My name is Sam.", "Hi Sam. I am Maya.", "It is nice to meet you."],
  ["Meeting People", "😊", "How Are You?", "Checking how someone feels", "Hello! How are you today?", "I am very well, thank you.", "I am happy to hear that."],
  ["Meeting People", "🌍", "Where Are You From?", "Learning about another person", "Where are you from?", "I am from Sri Lanka.", "What a beautiful country!"],
  ["At Home", "🏡", "Helping at Home", "Offering to help your family", "Can I help you?", "Yes, please set the table.", "I will do it now."],
  ["At Home", "🔎", "Finding a Book", "Looking for something at home", "Where is my book?", "It is beside the bed.", "Thank you. I found it."],
  ["At Home", "🌙", "Bedtime", "Getting ready to sleep", "Are you ready for bed?", "Yes, I brushed my teeth.", "Good night. Sleep well."],
  ["At School", "📚", "In the Classroom", "Asking your teacher for help", "May I ask a question?", "Yes, what do you need?", "Please explain this word."],
  ["At School", "✏️", "Borrowing a Pencil", "Asking a classmate politely", "May I borrow your pencil?", "Of course. Here you are.", "Thank you. I will return it."],
  ["At School", "🏫", "After School", "Making a plan with a friend", "What are you doing after school?", "I am going to the park.", "May I come with you?"],
  ["Food", "🍽️", "At the Table", "Asking for food politely", "Would you like some rice?", "Yes, please. Just a little.", "Here you are. Enjoy!"],
  ["Food", "🥤", "Ordering a Drink", "Choosing something to drink", "What would you like to drink?", "May I have some water?", "Certainly. I will bring it."],
  ["Food", "🍎", "Favourite Food", "Talking about food you enjoy", "What is your favourite fruit?", "My favourite fruit is mango.", "I like mango too."],
  ["Shopping", "🛍️", "Buying a Shirt", "Asking about a price", "How much is this shirt?", "It is fifteen dollars.", "May I try it on?"],
  ["Shopping", "🥖", "At the Grocery Shop", "Finding something in a shop", "Excuse me, where is the bread?", "It is on the next shelf.", "Thank you for your help."],
  ["Travel", "🚌", "Waiting for the Bus", "Checking a bus route", "Does this bus go to town?", "Yes, it stops near the market.", "Please tell me when we arrive."],
  ["Travel", "✈️", "At the Airport", "Finding the correct place", "Where is the check-in desk?", "It is straight ahead.", "Thank you. Have a good day."],
  ["Health", "🤒", "Feeling Unwell", "Explaining how you feel", "What is the matter?", "My head hurts and I feel tired.", "You should rest and drink water."],
  ["Health", "🩹", "A Small Injury", "Asking an adult for help", "I hurt my knee.", "Let me take a look.", "Please help me clean it."],
  ["Telephone", "📞", "Making a Call", "Asking to speak to someone", "Hello. May I speak to Maya?", "This is Maya speaking.", "Hello Maya. How are you?"],
  ["Telephone", "🔁", "A Bad Connection", "Handling an unclear phone call", "I cannot hear you clearly.", "I will speak more slowly.", "Thank you. Please say that again."],
  ["Work", "💼", "Meeting a Colleague", "Introducing yourself at work", "Hello, I am new here.", "Welcome! My name is David.", "I am pleased to meet you."],
  ["Work", "🗓️", "Planning a Meeting", "Choosing a meeting time", "Are you free tomorrow morning?", "Yes, I am free at ten.", "Great. Let us meet then."],
  ["Emergencies", "🛑", "Asking for Help", "Getting help in a safe way", "Excuse me, I need help.", "What happened?", "I cannot find my family."],
  ["Emergencies", "🚑", "Calling an Adult", "Responding to an unsafe situation", "Please stop. This is not safe.", "Let us call an adult.", "Yes, we should get help now."],
];

export const CONVERSATION_LESSONS: ConversationLesson[] = raw.map(
  ([category, scene, title, situation, first, second, third], index) => ({
    id: `conversation-${index + 1}`,
    category,
    scene,
    title,
    situation,
    lines: [
      { speaker: "A", text: first },
      { speaker: "B", text: second },
      { speaker: "A", text: third },
    ],
  }),
);
