import pictureCatalog from "@/public/data/picture-catalog.json";

export type KidsCategory = {
  id: string;
  label: string;
  emoji: string;
  colour: string;
  description: string;
};

export const KIDS_CATEGORIES: KidsCategory[] = [
  { id: "first-words", label: "First Words", emoji: "👋", colour: "#ffe2a8", description: "Simple words and useful ideas" },
  { id: "people", label: "Family & People", emoji: "👨‍👩‍👧", colour: "#ffd8df", description: "Families, helpers and communities" },
  { id: "animals", label: "Animals", emoji: "🐾", colour: "#d8edca", description: "Pets, wildlife and tiny creatures" },
  { id: "food", label: "Food & Drinks", emoji: "🍎", colour: "#ffe3c2", description: "Fruit, meals and kitchen foods" },
  { id: "play", label: "Toys & Play", emoji: "🧸", colour: "#e6d9fa", description: "Games, sports, music and art" },
  { id: "home", label: "Home", emoji: "🏡", colour: "#d6ebfa", description: "Rooms and everyday belongings" },
  { id: "body-health", label: "Body & Health", emoji: "🩺", colour: "#d6f1e8", description: "Healthy bodies and caring helpers" },
  { id: "feelings", label: "Feelings", emoji: "😊", colour: "#ffe0ea", description: "Emotions and communication" },
  { id: "actions", label: "Actions", emoji: "🏃", colour: "#d8e8ff", description: "Things we do every day" },
  { id: "nature", label: "Nature & Space", emoji: "🌈", colour: "#d8f0f0", description: "Weather, Earth and the sky" },
  { id: "transport", label: "Transport", emoji: "🚂", colour: "#d9e4fa", description: "Vehicles and useful machines" },
  { id: "places", label: "Places Around Me", emoji: "🏫", colour: "#f2dfc6", description: "Community places to discover" },
  { id: "learning", label: "Learning Basics", emoji: "🔤", colour: "#fff0b8", description: "Shapes, colours and comparisons" },
  { id: "school", label: "School", emoji: "🎒", colour: "#dedcf8", description: "Classrooms, books and technology" },
  { id: "safety", label: "Safety", emoji: "🛟", colour: "#ffd9cf", description: "Safe choices and trusted helpers" },
  { id: "stories", label: "Stories & Culture", emoji: "🏰", colour: "#ead9f8", description: "Imagination and celebrations" },
  { id: "routines", label: "Daily Routines", emoji: "🛁", colour: "#d9edf8", description: "Helpful steps through the day" },
];

const CATEGORY_WORDS: Record<string, string[]> = {
  "first-words": "baby ball bell book bottle bowl bridge button clock egg feather flag fork gift glasses glove hat key leaf milk mirror paper pencil radio shoe spoon star table tent umbrella wheel window".split(" "),
  people: "actor architect baby baker builder carpenter child clown dancer dentist doctor explorer farmer firefighter gardener mechanic mother father sister brother grandmother grandfather nurse painter pilot police scientist singer teacher".split(" "),
  animals: "alligator ant badger bear bee beetle bird butterfly camel cat caterpillar chicken cow crab crocodile deer dinosaur dog dolphin donkey duck eagle elephant fish flamingo fox frog giraffe goat grasshopper hamster hedgehog hippo horse iguana jellyfish kangaroo kitten koala ladybug lamb lion llama monkey mouse octopus owl panda parrot peacock penguin pig pony puppy rabbit seal sheep snail squirrel tiger tortoise turtle whale zebra".split(" "),
  food: "apple avocado banana cake carrot cherry coconut cookie cupcake curry dhal grape hopper icecream kiribath lemon mango milkrice orange peach pear pineapple rice roti sandwich strawberry stringhopper sunflower watermelon".split(" "),
  play: "accordion badminton balloon basket blocks camera crayon crown doll drum fairy flute guitar kite mermaid orchestra piano picnic playground robot ruler skateboard soccerball swing trumpet unicorn violin xylophone".split(" "),
  home: "apartment apron bathroom bed blanket boots broom bucket candle chair chimney coat computer door envelope garden hammer home house jacket kettle kitchen lamp mailbox market mitten roof sweater toaster".split(" "),
  "body-health": "ambulance arm brush dentist doctor ear eye face finger foot hair hand head helmet hospital knee leg mouth nose nurse shoulder soap teeth tongue toothbrush towel".split(" "),
  feelings: "angry excited happy hungry ineedhelp uncomfortable iwantabreak ithurtshere no please sad scared thankyou thirsty tired yes".split(" "),
  actions: "brush build catch drink draw dress eat jump play pull push read run sit sleep throw wake walk wash write".split(" "),
  nature: "aquarium astronaut beach cave circle cloud comet coral earth farm flower forest hill island jungle lake meadow moon mountain mushroom ocean planet rainbow rectangle river seashell square sun tree triangle volcano waterfall windmill".split(" "),
  transport: "airplane ambulance anchor bicycle boat bus camper canoe car engine ferry helicopter rocket sailboat ship spaceship submarine taxi tractor train van".split(" "),
  places: "airport aquarium apartment barn beach castle classroom factory farm garden home hospital hotel house igloo island jungle library lighthouse market mosque museum ocean palace park playground postoffice restaurant school shop stadium station supermarket zoo".split(" "),
  learning: "calendar circle clock diamond map moon octagon pyramid rainbow rectangle square star sun triangle".split(" "),
  school: "backpack book calendar camera classroom computer crayon desk envelope library map paper pencil radio ruler school scientist telescope".split(" "),
  safety: "adult ambulance firefighter help helmet hospital lighthouse police safe stop unsafe".split(" "),
  stories: "birthday castle christmas crown deepavali eid fairy lantern mermaid newyear palace pirate pyramid ramadan robot rocket snowman superhero unicorn vesak".split(" "),
  routines: "bathtime bedtime mealtime morning playtime schooltime".split(" "),
};

const SPOKEN_PHRASES: Record<string, string> = {
  "thank you": "thankyou",
  "i need help": "ineedhelp",
  "i want a break": "iwantabreak",
  "it hurts here": "ithurtshere",
};

const DISPLAY_LABELS: Record<string, string> = {
  thankyou: "Thank You",
  ineedhelp: "I Need Help",
  iwantabreak: "I Want a Break",
  ithurtshere: "It Hurts Here",
  postoffice: "Post Office",
  soccerball: "Soccer Ball",
  stringhopper: "String Hopper",
  milkrice: "Milk Rice",
  newyear: "New Year",
};

const wordCategory = new Map<string, string>();
for (const [category, words] of Object.entries(CATEGORY_WORDS)) {
  for (const word of words) if (!wordCategory.has(word)) wordCategory.set(word, category);
}

type CatalogWord = { id: string; word: string; category: string; searchTerms?: string[] };
const catalogWords = (pictureCatalog.items as CatalogWord[]);
const catalogById = new Map(catalogWords.map((item) => [item.id, item]));
const catalogTerms = catalogWords.flatMap((item) =>
  [item.word, item.id.replaceAll("-", " "), ...(item.searchTerms ?? [])]
    .map((term) => [term.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim(), item.id] as const),
).sort((left, right) => right[0].length - left[0].length);

export const SAFE_KIDS_WORDS = new Set(catalogWords.map((item) => item.id));

export function categoryForWord(word: string) {
  return catalogById.get(word.toLowerCase())?.category ?? wordCategory.get(word.toLowerCase()) ?? "first-words";
}

export function categoryDetails(categoryId: string) {
  return KIDS_CATEGORIES.find((category) => category.id === categoryId) ?? KIDS_CATEGORIES[0];
}

export function normaliseKidsWord(raw: unknown) {
  if (typeof raw !== "string") return "";
  const cleaned = raw.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  for (const [phrase, slug] of Object.entries(SPOKEN_PHRASES)) {
    if (cleaned.includes(phrase)) return slug;
  }
  const exact = catalogTerms.find(([term]) => term === cleaned);
  if (exact) return exact[1];
  const contained = catalogTerms.find(([term]) =>
    term.length >= 3 && (` ${cleaned} `).includes(` ${term} `),
  );
  return contained?.[1] ?? "";
}

export function labelForWord(word: string) {
  const slug = word.toLowerCase();
  const catalogLabel = catalogById.get(slug)?.word;
  return DISPLAY_LABELS[slug] ?? catalogLabel?.replace(/\b\w/g, (letter) => letter.toUpperCase()) ?? slug.charAt(0).toUpperCase() + slug.slice(1);
}
