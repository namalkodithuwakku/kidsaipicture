type ExpandedSentence = {
  id: string;
  category: string;
  sentence: string;
  hint: string;
};

const sentenceSets = [
  {
    category: "People & Actions",
    starts: ["We", "My friends and I", "The children", "My classmates", "My family and I", "My neighbours", "The students", "My cousins and I", "My parents and I", "My team"],
    ends: ["read together after lunch.", "play safely in the garden.", "help one another every day.", "listen carefully to the teacher.", "share our things politely.", "walk slowly across the road.", "learn new English words.", "clean the room together.", "wait patiently in a line.", "welcome new people kindly."],
  },
  {
    category: "Places & Travel",
    starts: ["I am", "We are", "My family is", "Our class is", "My friend is", "The bus is", "My parents are", "The visitors are", "Our group is", "The children are"],
    ends: ["going to the library.", "waiting near the station.", "travelling to the city.", "walking towards the park.", "visiting the museum today.", "looking for the correct gate.", "returning home this evening.", "meeting beside the entrance.", "taking a train tomorrow.", "stopping at the supermarket."],
  },
  {
    category: "Descriptions",
    starts: ["The little house is", "This blue bag is", "The garden looks", "My new book is", "The classroom feels", "That mountain is", "The warm soup is", "Our neighbourhood is", "The evening sky is", "This soft blanket is"],
    ends: ["very clean and bright.", "beautiful in the morning.", "comfortable and welcoming.", "small but very useful.", "quiet and peaceful today.", "colourful and interesting.", "easy for me to carry.", "full of wonderful details.", "ready for everyone to enjoy.", "different from the old one."],
  },
  {
    category: "Requests & Help",
    starts: ["Could you please", "Would you please", "Can you kindly", "Please help me", "Please show me how to", "Could someone", "May I ask you to", "Would you mind helping me", "Please tell me how to", "Can we work together to"],
    ends: ["open this door?", "find the correct page?", "carry this small bag?", "read this sentence slowly?", "explain the next step?", "call a trusted adult?", "check my answer?", "show me the right direction?", "repeat that word?", "finish this safely?"],
  },
  {
    category: "Past Events",
    starts: ["Yesterday, I", "Last night, we", "This morning, I", "After school, we", "Last weekend, my family", "Earlier today, my friend", "During the lesson, I", "At the park, we", "Before dinner, I", "On our journey, we"],
    ends: ["learned something useful.", "met a friendly person.", "finished the work carefully.", "visited a beautiful place.", "helped someone who needed us.", "played a safe and enjoyable game.", "read an interesting story.", "asked an important question.", "found the thing we needed.", "practised speaking English."],
  },
  {
    category: "Future Plans",
    starts: ["Tomorrow, I will", "Next week, we will", "This evening, I will", "After lunch, we will", "On Saturday, my family will", "Soon, my friend will", "Later today, I will", "During the holiday, we will", "Before bedtime, I will", "Next month, our class will"],
    ends: ["practise these new words.", "visit a helpful friend.", "complete the next lesson.", "prepare everything we need.", "travel to a new place.", "read another English story.", "help with the household work.", "learn how to do this safely.", "share the idea with everyone.", "try the activity again."],
  },
  {
    category: "Likes & Choices",
    starts: ["I enjoy", "We really like", "My friend enjoys", "Our family likes", "The children enjoy", "My classmates like", "My sister enjoys", "My brother likes", "My parents enjoy", "Our teacher likes"],
    ends: ["reading stories together.", "learning about other cultures.", "walking in the fresh air.", "trying healthy new foods.", "listening to gentle music.", "drawing colourful pictures.", "visiting quiet natural places.", "playing friendly team games.", "helping people in our community.", "practising useful English phrases."],
  },
  {
    category: "Health & Safety",
    starts: ["To stay healthy, we", "When crossing the road, we", "Before eating, we", "When we feel unwell, we", "Near the water, we", "During an emergency, we", "When using tools, we", "To protect our teeth, we", "When the weather is hot, we", "Before going outside, we"],
    ends: ["ask a trusted adult for help.", "wash our hands carefully.", "look and listen before moving.", "drink enough clean water.", "follow the safety instructions.", "tell someone how we feel.", "wear the correct protection.", "keep a safe distance.", "remain calm and speak clearly.", "make a sensible choice."],
  },
  {
    category: "Time & Weather",
    starts: ["Early in the morning,", "At midday,", "In the afternoon,", "Before sunset,", "During the night,", "When it is raining,", "On a sunny day,", "When the wind is strong,", "During the cool season,", "After the rain stops,"],
    ends: ["the air feels fresh and cool.", "we can see clouds in the sky.", "the sunlight becomes warm and bright.", "we take an umbrella with us.", "the streets may become wet.", "we choose suitable clothes.", "the stars begin to appear.", "people plan their activities carefully.", "the plants look green and healthy.", "we check the time before leaving."],
  },
] as const;

export const EXPANDED_SENTENCE_CATEGORIES = sentenceSets.map((set) => set.category);

export const EXPANDED_SENTENCES: ExpandedSentence[] = sentenceSets.flatMap((set, setIndex) =>
  set.starts.flatMap((start, startIndex) =>
    set.ends.map((end, endIndex) => ({
      id: `expanded-sentence-${setIndex + 1}-${startIndex + 1}-${endIndex + 1}`,
      category: set.category,
      sentence: `${start} ${end}`,
      hint: `Practise this useful ${set.category.toLowerCase()} sentence in a real situation.`,
    })),
  ),
);

type ExpandedConversation = {
  id: string;
  category: string;
  title: string;
  situation: string;
  lines: Array<{ speaker: "A" | "B"; text: string }>;
};

const conversationTopics: Record<string, string[]> = {
  "Meeting People": ["new neighbour", "new classmate", "visitor", "team member", "shop assistant", "tour guide", "family friend", "new colleague", "sports coach", "community helper"],
  "At Home": ["lost key", "evening meal", "household chore", "visitor arriving", "missing book", "family plan", "bedtime routine", "garden work", "telephone call", "weekend activity"],
  "At School": ["homework question", "new lesson", "library book", "class project", "school event", "missing pencil", "sports practice", "science activity", "group assignment", "teacher meeting"],
  "Food": ["breakfast", "restaurant order", "healthy snack", "family dinner", "new fruit", "lunch choice", "hot drink", "grocery list", "food allergy", "picnic meal"],
  "Shopping": ["shirt", "pair of shoes", "school bag", "birthday gift", "train ticket", "phone charger", "fresh vegetables", "medicine", "book", "household item"],
  "Travel": ["bus journey", "train platform", "airport gate", "hotel check-in", "taxi ride", "museum visit", "lost direction", "travel ticket", "luggage problem", "day trip"],
  "Health": ["headache", "small cut", "dentist visit", "tired feeling", "doctor appointment", "stomach ache", "healthy exercise", "medicine instruction", "eye check", "rest and recovery"],
  "Telephone": ["calling a friend", "booking an appointment", "leaving a message", "wrong number", "poor connection", "confirming a time", "asking for information", "calling a hotel", "following up", "emergency call"],
  "Work": ["morning meeting", "new task", "deadline", "customer question", "team project", "email follow-up", "work schedule", "training session", "completed report", "request for help"],
  "Emergencies": ["lost child", "fire alarm", "unsafe object", "road accident", "water danger", "medical emergency", "missing family member", "broken glass", "stranger concern", "severe weather"],
};

const conversationOpeners = [
  "Excuse me.", "Hello.", "Good morning.", "May I ask a question?", "Could you help me, please?",
] as const;

const conversationFactory: Record<string, (topic: string, opener: string) => [string, string, string]> = {
  "Meeting People": (topic, opener) => [`${opener} Are you the ${topic}?`, "Yes, I am. It is nice to meet you.", "It is nice to meet you too."],
  "At Home": (topic, opener) => [`${opener} Can we talk about the ${topic}?`, "Of course. What would you like to do?", "Let us make a simple plan together."],
  "At School": (topic, opener) => [`${opener} I need help with the ${topic}.`, "I can help you understand it.", "Thank you. Please show me the first step."],
  "Food": (topic, opener) => [`${opener} May I ask about the ${topic}?`, "Certainly. What would you like to know?", "Please tell me which choice is best for me."],
  "Shopping": (topic, opener) => [`${opener} I am looking for a ${topic}.`, "I can show you where it is.", "Thank you. I would also like to know the price."],
  "Travel": (topic, opener) => [`${opener} I need information about the ${topic}.`, "Certainly. Let me check that for you.", "Thank you. Please tell me what to do next."],
  "Health": (topic, opener) => [`${opener} I need advice about a ${topic}.`, "Please tell me how you are feeling.", "I will explain clearly and ask for help if needed."],
  "Telephone": (topic, opener) => [`${opener} I am ${topic}.`, "Thank you for calling. How may I help?", "I would like to explain what I need."],
  "Work": (topic, opener) => [`${opener} Can we discuss the ${topic}?`, "Yes. Let us review it together.", "Great. I will explain my progress first."],
  "Emergencies": (topic, opener) => [`${opener} There is a ${topic}.`, "Stay calm. I will contact the correct helper.", "Thank you. I will remain in a safe place."],
};

const expandedConversations: ExpandedConversation[] = Object.entries(conversationTopics).flatMap(
  ([category, topics], categoryIndex) =>
    topics.flatMap((topic, topicIndex) =>
      conversationOpeners.map((opener, openerIndex) => {
        const lines = conversationFactory[category](topic, opener);
        return {
          id: `expanded-conversation-${categoryIndex + 1}-${topicIndex + 1}-${openerIndex + 1}`,
          category,
          title: `${topic.replace(/\b\w/g, (letter) => letter.toUpperCase())} ${openerIndex + 1}`,
          situation: `Practising a useful conversation about ${topic}`,
          lines: [
            { speaker: "A" as const, text: lines[0] },
            { speaker: "B" as const, text: lines[1] },
            { speaker: "A" as const, text: lines[2] },
          ],
        };
      }),
    ),
);

export const EXPANDED_CONVERSATIONS = expandedConversations.slice(0, 476);

type ExpandedEveryday = {
  id: string;
  category: string;
  title: string;
  phrase: string;
  meaning: string;
  example: string;
};

const everydayTopics: Record<string, string[]> = {
  "Speak Naturally": ["your day", "your family", "your studies", "your work", "the weather", "a new place", "a shared activity", "a recent event", "a future plan", "a favourite hobby", "a useful idea"],
  "Questions": ["a new word", "the next step", "a difficult idea", "the correct answer", "an unfamiliar place", "a person’s name", "the meeting time", "a price", "a safety rule", "a travel plan", "a daily task"],
  "Directions": ["the station", "the hospital", "the supermarket", "the school", "the airport", "the hotel", "the nearest bank", "the bus stop", "the town centre", "the library", "the restaurant"],
  "Time & Plans": ["tomorrow morning", "this afternoon", "Friday evening", "the weekend", "next week", "the school holiday", "lunchtime", "after work", "before dinner", "next month", "the meeting day"],
  "Travel": ["a bus ticket", "a train seat", "a hotel room", "the check-in desk", "a taxi", "a local map", "a travel bag", "the correct gate", "a restaurant booking", "a day tour", "the return journey"],
  "Work & Study": ["today’s task", "the class project", "an email", "the report", "the meeting", "the homework", "the training", "the deadline", "the customer request", "the presentation", "the next lesson"],
  "Opinions": ["this idea", "the first option", "the new plan", "the shorter route", "the blue design", "the morning time", "the healthy choice", "the team decision", "the book", "the film", "the proposed solution"],
  "Problems": ["my order", "the payment", "the booking", "the internet connection", "the broken item", "the wrong direction", "the delayed bus", "the missing bag", "the unclear instruction", "the unsafe situation", "the incorrect information"],
};

const everydayActions = [
  "ask politely about", "explain clearly", "check the details of", "request help with", "confirm",
  "talk naturally about", "make a decision about", "follow up on", "prepare for", "solve a problem with", "learn more about",
] as const;

const everydayFactory: Record<string, (topic: string, action: string) => Omit<ExpandedEveryday, "id" | "category">> = {
  "Speak Naturally": (topic, action) => ({ title: `Talking About ${topic}`, phrase: `I would like to ${action} ${topic}.`, meaning: `Use this to begin a natural conversation about ${topic}.`, example: `Hello, I would like to ${action} ${topic}.` }),
  "Questions": (topic, action) => ({ title: `Question About ${topic}`, phrase: `Could I ${action} ${topic}?`, meaning: `Ask a clear and polite question about ${topic}.`, example: `Excuse me, could I ${action} ${topic}?` }),
  "Directions": (topic, action) => ({ title: `Finding ${topic}`, phrase: `Could you help me find ${topic}?`, meaning: `Ask someone for directions to ${topic}.`, example: `Excuse me, could you help me find ${topic}?` }),
  "Time & Plans": (topic, action) => ({ title: `Planning ${topic}`, phrase: `Can we ${action} our plan for ${topic}?`, meaning: `Discuss and confirm a plan for ${topic}.`, example: `Before we leave, can we ${action} our plan for ${topic}?` }),
  "Travel": (topic, action) => ({ title: `Travel: ${topic}`, phrase: `I need to ${action} ${topic}.`, meaning: `Handle a common travel need involving ${topic}.`, example: `Good morning. I need to ${action} ${topic}.` }),
  "Work & Study": (topic, action) => ({ title: `Working On ${topic}`, phrase: `I am ready to ${action} ${topic}.`, meaning: `Communicate clearly about ${topic} at work or school.`, example: `I have some time now, so I am ready to ${action} ${topic}.` }),
  "Opinions": (topic) => ({ title: `An Opinion About ${topic}`, phrase: `In my opinion, ${topic} is worth considering.`, meaning: `Share a respectful opinion about ${topic}.`, example: `In my opinion, ${topic} is worth considering because it may help us.` }),
  "Problems": (topic, action) => ({ title: `Problem With ${topic}`, phrase: `Could you help me ${action} ${topic}?`, meaning: `Calmly request help with ${topic}.`, example: `There seems to be a problem. Could you help me ${action} ${topic}?` }),
};

export const EXPANDED_EVERYDAY: ExpandedEveryday[] = Object.entries(everydayTopics).flatMap(
  ([category, topics], categoryIndex) =>
    topics.flatMap((topic, topicIndex) =>
      everydayActions.map((action, actionIndex) => ({
        id: `expanded-everyday-${categoryIndex + 1}-${topicIndex + 1}-${actionIndex + 1}`,
        category,
        ...everydayFactory[category](topic, action),
      })),
    ),
);
