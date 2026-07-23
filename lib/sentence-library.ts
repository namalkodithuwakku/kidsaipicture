export type SentenceLesson = {
  id: string;
  category: string;
  categoryEmoji: string;
  sentence: string;
  scene: string;
  hint: string;
};

const groups = [
  {
    category: "Greetings",
    emoji: "👋",
    lessons: [
      ["Hello, how are you?", "👋😊", "A friendly way to greet someone."],
      ["Good morning!", "🌅🙂", "Say this when the day begins."],
      ["Good afternoon!", "☀️🙂", "Say this after midday."],
      ["Good evening!", "🌇🙂", "Say this later in the day."],
      ["Good night!", "🌙😴", "Say this before bedtime."],
      ["Nice to meet you.", "🤝😊", "Say this when meeting someone new."],
      ["My name is Maya.", "🙋‍♀️✨", "Use your own name when you practise."],
      ["What is your name?", "❓🙂", "Ask someone to introduce themselves."],
      ["How was your day?", "🌤️💬", "Ask someone about their day."],
      ["See you tomorrow!", "👋📅", "A friendly way to say goodbye."],
    ],
  },
  {
    category: "Polite Words",
    emoji: "💛",
    lessons: [
      ["Please help me.", "🙏🤝", "A polite way to ask for help."],
      ["Thank you very much.", "💐😊", "Show that you are grateful."],
      ["You are welcome.", "🤗✨", "Reply when someone thanks you."],
      ["Excuse me, please.", "🙋💬", "Use this to get attention politely."],
      ["I am sorry.", "💛🙏", "Say this after making a mistake."],
      ["May I come in?", "🚪🙂", "Ask permission before entering."],
      ["May I sit here?", "🪑❓", "Ask before taking a seat."],
      ["Could you say that again?", "🔁👂", "Ask someone to repeat their words."],
      ["Please speak slowly.", "🐢💬", "Ask for slower speech."],
      ["That is very kind.", "🌟🤗", "Praise a kind action."],
    ],
  },
  {
    category: "Family",
    emoji: "🏡",
    lessons: [
      ["This is my family.", "👨‍👩‍👧‍👦🏡", "Introduce your family."],
      ["I love my mother.", "👩❤️", "Talk about someone you love."],
      ["My father is at home.", "👨🏡", "Say where your father is."],
      ["I have one sister.", "👧☝️", "Talk about your sister."],
      ["I have two brothers.", "👦👦", "Talk about your brothers."],
      ["The baby is sleeping.", "👶💤", "Describe what the baby is doing."],
      ["Grandma tells good stories.", "👵📖", "Talk about your grandmother."],
      ["Grandpa walks with me.", "👴🚶", "Talk about your grandfather."],
      ["We eat dinner together.", "👨‍👩‍👧‍👦🍽️", "Describe a family routine."],
      ["Our home is full of love.", "🏡💞", "A warm sentence about home."],
    ],
  },
  {
    category: "Food & Drink",
    emoji: "🍎",
    lessons: [
      ["I am hungry.", "😋🍽️", "Say this when you need food."],
      ["I am thirsty.", "🥤💧", "Say this when you need a drink."],
      ["Can I have some water?", "💧🥛", "Ask politely for water."],
      ["I like this apple.", "🍎👍", "Say which food you like."],
      ["The banana is yellow.", "🍌💛", "Describe the banana."],
      ["This soup is hot.", "🥣♨️", "Be careful with hot food."],
      ["My tea is warm.", "☕🙂", "Describe your drink."],
      ["We eat rice for lunch.", "🍚☀️", "Talk about lunchtime."],
      ["Please pass the spoon.", "🥄🙏", "Ask for something at the table."],
      ["The cake tastes delicious.", "🎂😋", "Describe tasty food."],
    ],
  },
  {
    category: "Home",
    emoji: "🛋️",
    lessons: [
      ["This is my bedroom.", "🛏️🏡", "Name a room in your home."],
      ["The book is on the table.", "📖🪵", "Say where the book is."],
      ["Please open the door.", "🚪➡️", "Ask someone to open it."],
      ["Please close the window.", "🪟⬅️", "Ask someone to close it."],
      ["My shoes are under the bed.", "👟🛏️", "Say where your shoes are."],
      ["The cup is in the kitchen.", "☕🍳", "Say where the cup is."],
      ["I am cleaning my room.", "🧹✨", "Describe what you are doing."],
      ["The light is very bright.", "💡✨", "Describe the light."],
      ["Let us water the plants.", "🪴💧", "Suggest a helpful activity."],
      ["It is time for bed.", "🛏️🌙", "A sentence for bedtime."],
    ],
  },
  {
    category: "School",
    emoji: "🎒",
    lessons: [
      ["I am going to school.", "🎒🏫", "Talk about where you are going."],
      ["This is my teacher.", "👩‍🏫📚", "Introduce your teacher."],
      ["Where is my book?", "📖❓", "Ask where something is."],
      ["I have a blue pencil.", "✏️🔵", "Describe your pencil."],
      ["Please write your name.", "✍️📄", "A common classroom instruction."],
      ["Let us read together.", "📖👫", "Invite someone to read."],
      ["I can count to ten.", "🔢🔟", "Talk about what you can do."],
      ["The answer is correct.", "✅📝", "Say that an answer is right."],
      ["I need help with this.", "🙋📘", "Ask for classroom help."],
      ["School is fun today.", "🏫🎉", "Describe a happy school day."],
    ],
  },
  {
    category: "Feelings",
    emoji: "😊",
    lessons: [
      ["I feel happy today.", "😊☀️", "Tell someone how you feel."],
      ["I am a little sad.", "😔💙", "Share a sad feeling."],
      ["I feel very excited!", "🤩🎉", "Share an excited feeling."],
      ["I am scared of the dark.", "😟🌙", "Talk about something frightening."],
      ["I feel tired now.", "🥱💤", "Say when you need rest."],
      ["I am angry about that.", "😠💬", "Name an angry feeling calmly."],
      ["I need a quiet break.", "🧘🌿", "Ask for time to feel calm."],
      ["That makes me laugh.", "😂✨", "Describe something funny."],
      ["I am proud of myself.", "🌟😊", "Celebrate your effort."],
      ["I feel better now.", "🙂💚", "Say that your feeling improved."],
    ],
  },
  {
    category: "Daily Routines",
    emoji: "⏰",
    lessons: [
      ["I wake up in the morning.", "⏰🌅", "Describe the start of your day."],
      ["I brush my teeth.", "🪥😁", "Talk about a healthy routine."],
      ["I wash my face.", "🧼💦", "Describe getting ready."],
      ["I put on my clothes.", "👕👖", "Describe getting dressed."],
      ["I eat breakfast every day.", "🥣🌞", "Talk about breakfast."],
      ["I walk to the bus.", "🚶🚌", "Describe part of your journey."],
      ["I play after school.", "⚽🏫", "Talk about playtime."],
      ["I do my homework.", "✏️📚", "Describe an evening task."],
      ["I take a warm bath.", "🛁🫧", "Describe a hygiene routine."],
      ["I sleep at night.", "😴🌙", "Describe the end of your day."],
    ],
  },
  {
    category: "Around Me",
    emoji: "🌍",
    lessons: [
      ["The sun is shining.", "☀️✨", "Describe sunny weather."],
      ["It is raining outside.", "🌧️☔", "Describe rainy weather."],
      ["The sky is blue.", "🌤️🔵", "Describe the sky."],
      ["The tree is very tall.", "🌳⬆️", "Describe the size of a tree."],
      ["A bird is in the garden.", "🐦🌷", "Say what you can see."],
      ["The bus is coming.", "🚌➡️", "Talk about approaching transport."],
      ["We are going to the park.", "👨‍👩‍👧‍👦🌳", "Talk about your destination."],
      ["The shop is over there.", "🏪👉", "Point out a nearby place."],
      ["I can see the moon.", "👀🌙", "Talk about something you see."],
      ["It is a beautiful day.", "🌈🌞", "Describe a lovely day."],
    ],
  },
  {
    category: "Useful Questions",
    emoji: "❓",
    lessons: [
      ["What is this?", "👉❓", "Ask the name of an object."],
      ["Where are you going?", "🚶❓", "Ask about a destination."],
      ["When will you come back?", "⏰↩️", "Ask about someone returning."],
      ["Who is your teacher?", "👩‍🏫❓", "Ask about a person."],
      ["Why are you laughing?", "😂❓", "Ask for a reason."],
      ["How do I do this?", "🧩❓", "Ask for instructions."],
      ["Can you help me?", "🤝❓", "Ask someone for help."],
      ["May I use this?", "✋❓", "Ask permission to use something."],
      ["Which one do you like?", "👈👉❓", "Ask someone to choose."],
      ["What time is it?", "🕐❓", "Ask for the current time."],
    ],
  },
] as const;

export const SENTENCE_CATEGORIES = groups.map((group) => ({
  name: group.category,
  emoji: group.emoji,
}));

export const SENTENCE_LESSONS: SentenceLesson[] = groups.flatMap((group) =>
  group.lessons.map(([sentence, scene, hint], index) => ({
    id: `${group.category.toLowerCase().replaceAll(" ", "-").replaceAll("&", "and")}-${index + 1}`,
    category: group.category,
    categoryEmoji: group.emoji,
    sentence,
    scene,
    hint,
  })),
);
