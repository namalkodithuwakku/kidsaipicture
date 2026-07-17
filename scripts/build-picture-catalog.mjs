import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { expansionCollections } from "./catalog-expansion.mjs";

const TARGET_ITEMS = 3000;
const BUNDLE_SIZE = 20;

const collections = [
  ["first-words", "First Words", 1, `apple|baby|ball|bed|book|bottle|box|boy|car|cat|chair|child|cup|daddy|dog|door|drink|eat|girl|go|hello|home|house|juice|milk|mommy|more|no|please|shoe|sit|sleep|spoon|stop|sun|table|thank you|toy|water|yes`],
  ["communication", "Communication", 1, `again|all done|come here|excuse me|goodbye|good morning|good night|help me|here|I am sorry|I can do it|I do not know|I like it|I love you|I need help|I need the toilet|I want a break|I want that|later|listen|look|maybe|mine|not now|okay|over there|quiet|say it again|show me|speak slowly|that one|this one|wait|watch me|welcome|what|where|who|why|you are welcome`],
  ["family", "Family & Relationships", 1, `aunt|brother|cousin|daughter|family|father|friend|grandfather|grandmother|grandparents|guardian|husband|mother|neighbour|older brother|older sister|parent|parents|partner|pet|sibling|sister|son|stepfather|stepmother|toddler|twin|uncle|wife|younger brother|younger sister|classmate|best friend|caregiver|grandchild|newborn|relative|roommate|visitor|wedding`],
  ["people-jobs", "People & Jobs", 2, `artist|baker|barber|builder|bus driver|cashier|chef|cleaner|coach|dentist|doctor|farmer|firefighter|fisher|gardener|hairdresser|librarian|lifeguard|mail carrier|mechanic|musician|nurse|office worker|painter|paramedic|photographer|pilot|police officer|scientist|shopkeeper|singer|soldier|teacher|train driver|veterinarian|waiter|waitress|carpenter|electrician|plumber`],
  ["pets-farm", "Pets & Farm Animals", 1, `alpaca|bee|buffalo|bull|calf|camel|chick|chicken|cow|donkey|duck|duckling|ferret|foal|goat|goose|guinea pig|hamster|hen|horse|kitten|lamb|llama|mouse|mule|parrot|pig|piglet|pony|puppy|rabbit|ram|rat|rooster|sheep|turkey|turtle|yak|goldfish|budgie`],
  ["wild-animals", "Wild Animals", 1, `alligator|anteater|antelope|armadillo|baboon|badger|bat|bear|beaver|bison|boar|cheetah|chimpanzee|crocodile|deer|elephant|fox|giraffe|gorilla|hedgehog|hippopotamus|hyena|jaguar|kangaroo|koala|leopard|lion|monkey|moose|orangutan|otter|panda|polar bear|raccoon|rhinoceros|sloth|squirrel|tiger|wolf|zebra`],
  ["birds", "Birds", 1, `albatross|blackbird|bluebird|canary|cardinal|cockatoo|crow|cuckoo|dove|eagle|emu|falcon|flamingo|hornbill|hummingbird|kingfisher|kiwi bird|macaw|magpie|myna bird|nightingale|ostrich|owl|peacock|pelican|penguin|pigeon|quail|raven|robin|seagull|sparrow|stork|swan|toucan|vulture|woodpecker|crane|heron|weaver bird`],
  ["sea-life", "Sea Life", 1, `angelfish|blue whale|clownfish|coral|crab|dolphin|eel|flying fish|great white shark|jellyfish|lobster|manatee|manta ray|narwhal|octopus|oyster|pufferfish|salmon|sardine|sea anemone|sea lion|sea turtle|seahorse|seal|shark|shrimp|squid|starfish|stingray|swordfish|tuna|walrus|whale|whale shark|hermit crab|sea urchin|mussel|clam|orca|seashell`],
  ["insects-dinosaurs", "Insects & Dinosaurs", 2, `ant|beetle|butterfly|caterpillar|centipede|cockroach|cricket|dragonfly|earthworm|firefly|flea|fly|grasshopper|ladybird|mantis|millipede|mosquito|moth|scorpion|snail|spider|stick insect|termite|wasp|brachiosaurus|diplodocus|pterodactyl|stegosaurus|triceratops|tyrannosaurus rex|velociraptor|ankylosaurus|spinosaurus|iguanodon|parasaurolophus|allosaurus|mosasaurus|prehistoric egg|dinosaur footprint|dinosaur skeleton`],
  ["fruits", "Fruits", 1, `apricot|avocado|banana|blackberry|blueberry|breadfruit|cantaloupe|cherry|coconut|cranberry|custard apple|date fruit|dragon fruit|durian|fig|gooseberry|grapefruit|grapes|guava|jackfruit|kiwi fruit|lemon|lime|lychee|mango|mangosteen|nectarine|orange|papaya|passion fruit|peach|pear|pineapple|plum|pomegranate|raspberry|star fruit|strawberry|tangerine|watermelon`],
  ["vegetables", "Vegetables", 1, `artichoke|asparagus|beetroot|bell pepper|bitter gourd|bok choy|broccoli|brussels sprouts|cabbage|carrot|cassava|cauliflower|celery|chilli pepper|corn|cucumber|eggplant|garlic|green bean|green peas|kale|leek|lettuce|mushroom|okra|onion|plantain|potato|pumpkin|radish|red cabbage|spinach|spring onion|sweet potato|tomato|turnip|yam|zucchini|drumstick vegetable|snake gourd`],
  ["meals-food", "Meals & Food", 1, `bread|breakfast|burger|butter|cheese|chicken curry|coconut roti|curry|dhal curry|dinner|egg|fish curry|fried rice|hoppers|hot dog|kottu|lunch|noodles|omelette|pancake|pasta|pizza|rice|rice and curry|roast chicken|roti|salad|sandwich|sausage|soup|string hoppers|sushi|taco|toast|yogurt|biryani|milk rice|pol sambol|chickpea curry|wrap`],
  ["drinks-desserts", "Drinks & Desserts", 1, `birthday cake|brownie|cake|candy|caramel|chocolate|cocoa|cookie|cupcake|doughnut|fruit juice|fruit salad|ginger tea|ice cream|ice lolly|jelly|lemonade|milkshake|muffin|pudding|smoothie|soft drink|tea|vanilla ice cream|waffle|water bottle|coconut water|herbal tea|hot chocolate|lassi|rice pudding|custard|fruit tart|honey|jam|marshmallow|pie|sorbet|sprinkles|toffee`],
  ["toys-play", "Toys & Play", 1, `action figure|balloon|blocks|board game|bubble wand|building bricks|card game|doll|dollhouse|drum toy|finger puppet|frisbee|hula hoop|jigsaw puzzle|jump rope|kite|marbles|play dough|puppet|rattle|remote control car|rocking horse|sandbox|scooter|skipping rope|slide|slinky|spinning top|swing|teddy bear|toy airplane|toy boat|toy dinosaur|toy robot|toy train|trampoline|water gun|yo-yo|seesaw|playhouse`],
  ["sports-music-art", "Sports, Music & Art", 2, `badminton|baseball|basketball|bat and ball|bowling|boxing gloves|cricket bat|cricket ball|cycling|football|golf|gymnastics|hockey|karate|rugby ball|running race|skateboard|skating|swimming|table tennis|tennis|volleyball|xylophone|guitar|piano|violin|flute|trumpet|tambourine|microphone|paintbrush|paint palette|crayon|colour pencil|drawing paper|glue stick|scissors|sticker|clay|origami`],
  ["home-furniture", "Home & Furniture", 1, `apartment|balcony|bathroom|bedroom|blanket|bookshelf|carpet|ceiling|clock|couch|curtain|cushion|dining room|drawer|fan|floor|front door|garage|garden|gate|kitchen|lamp|living room|mattress|mirror|pillow|roof|shelf|sofa|stairs|stool|television|toilet|wall|wardrobe|window|desk|armchair|bunk bed|doormat`],
  ["household-items", "Household Items", 1, `air conditioner|alarm clock|basket|bath mat|broom|bucket|camera|candle|coat hanger|comb|computer|dustbin|flashlight|flower pot|fridge|hair dryer|iron|key|laptop|light bulb|mop|phone|plug|remote control|rope|soap|speaker|telephone|tissue box|toothbrush|toothpaste|towel|umbrella|vacuum cleaner|washing machine|watering can|wheelbarrow|doorbell|extension cord|laundry basket`],
  ["kitchen-items", "Kitchen Items", 1, `apron|baking tray|blender|bowl|can opener|chopping board|coffee mug|colander|cooking pot|corkscrew|dishwasher|fork|frying pan|grater|kettle|knife|ladle|lunch box|measuring cup|microwave|mixing bowl|napkin|oven|plate|rolling pin|saucepan|sieve|spatula|stove|teapot|tin opener|tongs|tray|whisk|wooden spoon|rice cooker|water jug|glass|dish rack|kitchen sink`],
  ["clothes-belongings", "Clothes & Belongings", 1, `backpack|belt|blouse|boots|cap|coat|dress|earrings|gloves|handbag|hat|jacket|jeans|necklace|pajamas|pocket|raincoat|sandals|scarf|school bag|shirt|shorts|skirt|slippers|socks|sunglasses|sweater|swimsuit|tie|trousers|T-shirt|uniform|watch|wallet|zipper|hairband|bracelet|helmet|sun hat|wellington boots`],
  ["body-health", "Body & Health", 1, `ankle|arm|back|blood|body|bone|brain|cheek|chest|chin|ear|elbow|eye|eyebrow|eyelash|finger|foot|hair|hand|head|heart|heel|knee|leg|lips|mouth|neck|nose|shoulder|skin|stomach|teeth|thumb|toe|tongue|wrist|bandage|medicine|stethoscope|thermometer`],
  ["feelings-needs", "Feelings & Needs", 1, `afraid|angry|bored|brave|calm|cold|confused|curious|disappointed|embarrassed|excited|fine|frustrated|happy|hot|hungry|hurt|jealous|lonely|loved|nervous|proud|sad|safe|scared|shy|sick|sleepy|surprised|thirsty|tired|uncomfortable|worried|kind|silly|grumpy|relaxed|upset|gentle|strong`],
  ["actions", "Actions", 1, `ask|bite|blow|break|brush|build|carry|catch|clap|climb|close|cook|crawl|cut|dance|dig|draw|drive|drop|fall|feed|give|hide|hold|hug|jump|kick|laugh|open|paint|pull|push|read|ride|run|sing|throw|walk|wash|write`],
  ["routines", "Daily Routines", 1, `wake up|get out of bed|make the bed|use the toilet|wash hands|wash face|take a shower|take a bath|brush teeth|comb hair|get dressed|put on shoes|eat breakfast|pack school bag|go to school|enter classroom|morning circle|study|eat a snack|play outside|eat lunch|come home|change clothes|do homework|help at home|tidy toys|watch television|family time|eat dinner|clear the table|take medicine|put on pajamas|read a bedtime story|turn off the light|go to sleep|water plants|feed the pet|wash dishes|fold clothes|take out rubbish`],
  ["nature-weather", "Nature, Weather & Space", 1, `beach|branch|cloud|desert|flower|forest|grass|hill|island|lake|leaf|lightning|moon|mountain|ocean|pond|rain|rainbow|river|rock|sand|sea|sky|snow|storm|sunshine|summer|thunder|tree|waterfall|wave|wind|autumn|Earth|Jupiter|Mars|planet|rocket|space|star`],
  ["transport-places", "Transport & Places", 1, `airplane|airport|ambulance|bicycle|boat|bridge|bulldozer|bus|bus stop|canoe|church|cinema|city|excavator|farm|fire engine|helicopter|hospital|hotel|library|lorry|market|motorcycle|park|playground|police car|restaurant|road|school|ship|shop|supermarket|taxi|tractor|traffic light|train|train station|van|zoo|temple`],
  ["learning-safety", "Learning & Safety", 2, `alphabet|circle|colour|counting|diamond shape|eight|emergency exit|five|four|green|help sign|hexagon|letter|nine|number|one|orange colour|oval|pentagon|purple|rectangle|red|road crossing|seven|shape|six|square|star shape|stop sign|three|triangle|two|zero|blue|brown|black|white|pink|grey|call an adult`]
];

// Lower-priority terms removed to keep the library focused at exactly 1,000 words
// without dropping an entire learning collection.
const excludedWords = new Set([
  "partner", "roommate", "wedding", "office worker", "soldier", "fisher",
  "yak", "budgie", "boar", "moose", "albatross", "weaver bird",
  "flying fish", "sardine", "mussel", "flea", "cockroach", "prehistoric egg",
  "gooseberry", "nectarine", "artichoke", "brussels sprouts", "tin opener",
  "corkscrew", "cocoa", "sorbet", "slinky", "marbles", "bat and ball",
  "boxing gloves", "coat hanger", "extension cord", "baking tray",
  "wellington boots", "heel", "jealous", "bite", "fold clothes", "autumn",
  "relative"
]);

const slugify = (value) => value
  .toLowerCase()
  .replace(/&/g, " and ")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

const items = [];
for (const [category, categoryTitle, level, words] of collections) {
  const entries = words.split("|").map((word) => word.trim()).filter(Boolean)
    .filter((word) => !excludedWords.has(word));
  for (const word of entries) {
    const id = slugify(word);
    const bundle = `pack-${String(Math.floor(items.length / BUNDLE_SIZE) + 1).padStart(2, "0")}`;
    items.push({
      id,
      word,
      category,
      categoryTitle,
      level,
      bundle,
      image: `/pictures/${category}/${id}.webp`,
      speech: word,
      searchTerms: [...new Set([word.toLowerCase(), id.replaceAll("-", " ")])]
    });
  }
}

// Preserve the original 1,000 entries and their order, then append reviewed
// expansion terms until the catalog reaches exactly 3,000 unique IDs.
const existingIds = new Set(items.map((item) => item.id));
const expansionQueues = expansionCollections.map(([category, categoryTitle, level, words]) => ({
  category,
  categoryTitle,
  level,
  entries: words.split("|").map((word) => word.trim()).filter(Boolean),
  index: 0
}));

while (items.length < TARGET_ITEMS) {
  let addedThisRound = 0;
  for (const queue of expansionQueues) {
    while (queue.index < queue.entries.length) {
      const word = queue.entries[queue.index++];
      const id = slugify(word);
      if (!id || existingIds.has(id)) continue;
      existingIds.add(id);
      const bundle = `pack-${String(Math.floor(items.length / BUNDLE_SIZE) + 1).padStart(2, "0")}`;
      items.push({
        id,
        word,
        category: queue.category,
        categoryTitle: queue.categoryTitle,
        level: queue.level,
        bundle,
        image: `/pictures/${queue.category}/${id}.webp`,
        speech: word,
        searchTerms: [...new Set([word.toLowerCase(), id.replaceAll("-", " ")])]
      });
      addedThisRound += 1;
      break;
    }
    if (items.length >= TARGET_ITEMS) break;
  }
  if (!addedThisRound) break;
}

const duplicateIds = [...new Set(items.filter((item, index) =>
  items.findIndex((candidate) => candidate.id === item.id) !== index
).map((item) => item.id))];

if (items.length !== TARGET_ITEMS) throw new Error(`Catalog contains ${items.length} entries; expected ${TARGET_ITEMS}.`);
if (duplicateIds.length) throw new Error(`Duplicate IDs: ${duplicateIds.join(", ")}`);

const activeCollections = [...collections, ...expansionCollections]
  .filter(([id]) => items.some((item) => item.category === id));

const catalog = {
  version: 2,
  title: "Say and See — 3,000 Safe Visual Words",
  description: "A source-informed, curated and child-safe visual English vocabulary for young and early-stage learners.",
  sourceNote: "Original selection informed by Cambridge Young Learners and English Vocabulary Profile learning domains, British Council LearnEnglish Kids topics, and Stanford Wordbank child-language research; not an official reproduction or endorsement.",
  totalItems: items.length,
  totalCategories: activeCollections.length,
  imageFormat: "webp",
  imageSize: "1024x1024",
  collections: activeCollections.map(([id, title, level]) => ({
    id,
    title,
    level,
    itemCount: items.filter((item) => item.category === id).length
  })),
  bundles: Array.from({ length: Math.ceil(items.length / BUNDLE_SIZE) }, (_, index) => {
    const id = `pack-${String(index + 1).padStart(2, "0")}`;
    const bundleItems = items.filter((item) => item.bundle === id);
    return {
      id,
      itemCount: bundleItems.length,
      firstWord: bundleItems[0].word,
      lastWord: bundleItems.at(-1).word
    };
  }),
  items
};

const outputDirectory = path.resolve("public/data");
await mkdir(outputDirectory, { recursive: true });
await writeFile(
  path.join(outputDirectory, "picture-catalog.json"),
  `${JSON.stringify(catalog, null, 2)}\n`,
  "utf8"
);

console.log(`Created ${items.length} unique words across ${activeCollections.length} collections.`);
