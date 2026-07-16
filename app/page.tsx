"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Heart, Mic, Palette, Sparkles, Star, UserRound, Volume2 } from "lucide-react";

type KidWord = { word: string; emoji: string; image: string; color: string; sentence: string; upgrading?: boolean };
type WordSuggestion = KidWord & { score: number };
type CatalogItem = { word: string; searchTerms?: string[] };
const WORDS: KidWord[] = [
  { word: "Rabbit", emoji: "🐇", image: "/pictures/rabbit.webp", color: "#f8d9e4", sentence: "A rabbit hops in the meadow." },
  { word: "Lion", emoji: "🦁", image: "/pictures/lion.webp", color: "#ffe5a7", sentence: "A lion has a big, fluffy mane." },
  { word: "Elephant", emoji: "🐘", image: "/pictures/elephant.webp", color: "#dcd8fb", sentence: "An elephant has a long trunk." },
  { word: "Butterfly", emoji: "🦋", image: "/pictures/butterfly.webp", color: "#ded2f6", sentence: "A butterfly has colourful wings." },
  { word: "Apple", emoji: "🍎", image: "/pictures/apple.webp", color: "#ffd5cf", sentence: "An apple is a crunchy fruit." },
  { word: "Rainbow", emoji: "🌈", image: "/pictures/rainbow.webp", color: "#cfe9f7", sentence: "A rainbow has many bright colours." },
  { word: "Train", emoji: "🚂", image: "/pictures/train.webp", color: "#cce5f5", sentence: "A train travels along a track." },
  { word: "Flower", emoji: "🌻", image: "/pictures/flower.webp", color: "#ffedb8", sentence: "A flower grows toward the sunshine." },
];

const WAIT_MESSAGES = [
  "Mixing the happiest colours…",
  "Drawing friendly shapes…",
  "Adding a little sparkle…",
  "Almost ready for you!",
];

function normalizeWords(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

function editDistance(left: string, right: string) {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let diagonal = row[0];
    row[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const above = row[rightIndex];
      row[rightIndex] = left[leftIndex - 1] === right[rightIndex - 1]
        ? diagonal
        : Math.min(diagonal, above, row[rightIndex - 1]) + 1;
      diagonal = above;
    }
  }
  return row[right.length];
}

function similarity(left: string, right: string) {
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) return 0.94;
  return 1 - editDistance(left, right) / Math.max(left.length, right.length);
}

export default function Home() {
  const [selected, setSelected] = useState<KidWord>(WORDS[0]);
  const [galleryWords, setGalleryWords] = useState<KidWord[]>(WORDS);
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState("Tap and say a word");
  const [saved, setSaved] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("say-see-favourites") || "[]");
    } catch {
      return [];
    }
  });
  const [teacherVoice, setTeacherVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [suggestions, setSuggestions] = useState<WordSuggestion[]>([]);
  const [waitStage, setWaitStage] = useState(0);
  const upgradeTokenRef = useRef(0);
  const speechTokenRef = useRef(0);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js");

    const loadGallery = () => {
      const hour = Math.floor(Date.now() / 3_600_000);
      fetch(`/api/gallery?hour=${hour}`, { cache: "no-store" })
        .then((response) => response.ok ? response.json() : Promise.reject())
        .then((result: { pictures?: Array<{ word: string; image: string; sentence: string }> }) => {
          if (!result.pictures?.length) return;
          const colors = ["#f8d9e4", "#ffe5a7", "#dcd8fb", "#cfe9f7", "#ffedb8"];
          const pictures = result.pictures.map((item, index) => ({
            word: item.word,
            image: item.image,
            sentence: item.sentence,
            emoji: "",
            color: colors[index % colors.length],
          }));
          setGalleryWords(pictures);
          setSelected(pictures[hour % pictures.length]);
          setMessage("Tap and say a word");
        })
        .catch(() => undefined);
    };
    loadGallery();
    const galleryTimer = window.setInterval(loadGallery, 3_600_000);

    fetch("/data/picture-catalog.json")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((result: { items?: CatalogItem[] }) => setCatalog(result.items ?? []))
      .catch(() => undefined);

    let removeVoiceListener: () => void = () => undefined;
    if ("speechSynthesis" in window) {
      const chooseTeacherVoice = () => {
        const voices = speechSynthesis.getVoices().filter((voice) => voice.lang.toLowerCase().startsWith("en"));
        const preferredNames = [
          "ana", "ava", "aria", "jenny", "zira", "salli", "tessa", "karen",
          "google uk english female", "google us english female", "samantha", "female"
        ];
        const scored = voices
          .map((voice) => ({
            voice,
            score:
              (preferredNames.findIndex((name) => voice.name.toLowerCase().includes(name)) >= 0
                ? 100 - preferredNames.findIndex((name) => voice.name.toLowerCase().includes(name))
                : 0) +
              (voice.name.toLowerCase().includes("natural") ? 12 : 0) +
              (voice.lang.toLowerCase() === "en-gb" ? 10 : voice.lang.toLowerCase() === "en-us" ? 7 : 0) +
              (voice.localService ? 2 : 0),
          }))
          .sort((a, b) => b.score - a.score);
        setTeacherVoice(scored[0]?.voice ?? voices[0] ?? null);
      };
      chooseTeacherVoice();
      speechSynthesis.addEventListener("voiceschanged", chooseTeacherVoice);
      removeVoiceListener = () => speechSynthesis.removeEventListener("voiceschanged", chooseTeacherVoice);
    }
    return () => {
      window.clearInterval(galleryTimer);
      removeVoiceListener();
    };
  }, []);

  useEffect(() => {
    if (!generating) return;
    const timer = window.setInterval(() => {
      setWaitStage((stage) => (stage + 1) % WAIT_MESSAGES.length);
    }, 7_000);
    return () => window.clearInterval(timer);
  }, [generating]);

  const letters = useMemo(() => selected.word.toUpperCase().split(""), [selected]);

  function speak(text = selected.word, rate = 0.82) {
    if (!("speechSynthesis" in window)) return;
    const speechToken = ++speechTokenRef.current;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (teacherVoice) utterance.voice = teacherVoice;
    utterance.lang = teacherVoice?.lang || "en-US";
    utterance.rate = rate;
    utterance.pitch = 1.15;
    utterance.volume = 1;
    utterance.onstart = () => {
      if (speechTokenRef.current === speechToken) setSpeaking(true);
    };
    const finishSpeaking = () => {
      if (speechTokenRef.current === speechToken) setSpeaking(false);
    };
    utterance.onend = finishSpeaking;
    utterance.onerror = finishSpeaking;
    speechSynthesis.speak(utterance);
  }

  function speakLesson(item: KidWord, praise = "Wonderful!") {
    const spelling = item.word.toUpperCase().split("").join(". ");
    speak(`${praise} ${item.word}. ${spelling}. ${item.sentence}`, 0.78);
  }

  function watchForHighQuality(item: KidWord, token: number, attempt = 0) {
    if (attempt >= 20 || upgradeTokenRef.current !== token) return;
    window.setTimeout(async () => {
      if (upgradeTokenRef.current !== token) return;
      try {
        const response = await fetch(`/api/pictures?word=${encodeURIComponent(item.word)}`, { cache: "no-store" });
        const result = await response.json() as {
          image?: string;
          quality?: "preview" | "high";
        };
        if (response.ok && result.image && result.quality === "high") {
          const upgradedItem = { ...item, image: result.image, upgrading: false };
          setSelected(upgradedItem);
          setGalleryWords((current) => current.map((picture) =>
            picture.word.toLowerCase() === item.word.toLowerCase() ? upgradedItem : picture
          ));
          setMessage(`Your beautiful ${item.word} picture is ready!`);
          return;
        }
      } catch {
        // Keep the fast preview visible and quietly check again.
      }
      watchForHighQuality(item, token, attempt + 1);
    }, 12_000);
  }

  async function chooseWord(raw: string) {
    const requestToken = ++upgradeTokenRef.current;
    const cleaned = raw.toLowerCase().replace(/[^a-z ]/g, "").trim();
    const match = galleryWords.find((item) => cleaned.includes(item.word.toLowerCase()));
    if (match) {
      setSelected(match);
      setMessage(`Wonderful! You said ${match.word}.`);
      setTimeout(() => speakLesson(match, "Wonderful! You found"), 180);
      return;
    }

    setWaitStage(0);
    setGenerating(true);
    setMessage("Making your magical picture…");
    try {
      const response = await fetch("/api/pictures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: cleaned }),
      });
      const result = await response.json() as {
        word?: string;
        image?: string;
        sentence?: string;
        cached?: boolean;
        quality?: "preview" | "high";
        upgrading?: boolean;
        error?: string;
      };
      if (!response.ok || !result.word || !result.image || !result.sentence) {
        throw new Error(result.error || "Please try another friendly word!");
      }
      const item: KidWord = {
        word: result.word,
        image: result.image,
        sentence: result.sentence,
        emoji: "✨",
        color: "#dcd8fb",
        upgrading: result.upgrading,
      };
      setSelected(item);
      setGalleryWords((current) => current.some((picture) => picture.word.toLowerCase() === item.word.toLowerCase())
        ? current.map((picture) => picture.word.toLowerCase() === item.word.toLowerCase() ? item : picture)
        : [item, ...current]);
      setMessage(result.upgrading
        ? `Here’s your ${item.word}! Making it extra beautiful…`
        : result.cached ? `I found your saved ${item.word} picture!` : `Wonderful! Your ${item.word} picture is saved.`);
      setTimeout(() => speakLesson(item, result.cached ? "Look what I found!" : "Wonderful! You made"), 180);
      if (result.upgrading) watchForHighQuality(item, requestToken);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please try another friendly word!");
    } finally {
      setGenerating(false);
    }
  }

  function chooseSuggestion(item: KidWord) {
    setSuggestions([]);
    void chooseWord(item.word);
  }

  function handleSpeechResults(alternatives: string[]) {
    const heard = alternatives.map(normalizeWords).filter(Boolean);
    if (!heard.length) {
      setMessage("I didn’t hear that. Please try again!");
      return;
    }
    const ranked = galleryWords.map((item) => ({
      ...item,
      score: Math.max(...heard.map((phrase) => similarity(phrase, normalizeWords(item.word)))),
    })).sort((left, right) => right.score - left.score);
    const best = ranked[0];
    const exactCatalogWord = catalog.find((item) => {
      const terms = [item.word, ...(item.searchTerms ?? [])].map(normalizeWords);
      return heard.some((phrase) => terms.some((term) => phrase === term || phrase.includes(term)));
    });

    if (best?.score >= 0.97) {
      setSuggestions([]);
      void chooseWord(best.word);
      return;
    }
    if (exactCatalogWord && (!best || best.score < 0.88)) {
      setSuggestions([]);
      void chooseWord(exactCatalogWord.word);
      return;
    }
    const choices = ranked.filter((item) => item.score >= 0.48).slice(0, 3);
    if (choices.length) {
      setSuggestions(choices);
      setMessage("Did you mean one of these?");
      return;
    }
    setSuggestions([]);
    setMessage(`I heard “${heard[0]}”. Please say it once more.`);
  }

  function listen() {
    if (speaking || generating) return;
    type RecognitionResult = { length: number; [index: number]: { transcript: string; confidence: number } };
    type Recognition = { lang: string; interimResults: boolean; maxAlternatives: number; start: () => void; onresult: (e: { results: { [index: number]: RecognitionResult } }) => void; onerror: () => void; onend: () => void };
    const RecognitionClass = (window as typeof window & { webkitSpeechRecognition?: new () => Recognition }).webkitSpeechRecognition;
    if (!RecognitionClass) { setMessage("Voice works best in Chrome. Tap a word below!"); return; }
    const recognition = new RecognitionClass();
    recognition.lang = "en-GB";
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;
    recognition.onresult = (e) => {
      const result = e.results[0];
      handleSpeechResults(Array.from({ length: result.length }, (_, index) => result[index].transcript));
    };
    recognition.onerror = () => setMessage("I didn’t hear that. Please try again!");
    recognition.onend = () => setListening(false);
    setListening(true);
    setSuggestions([]);
    setMessage("I’m listening…");
    recognition.start();
  }

  function toggleSave() {
    const next = saved.includes(selected.word) ? saved.filter((word) => word !== selected.word) : [...saved, selected.word];
    setSaved(next);
    localStorage.setItem("say-see-favourites", JSON.stringify(next));
  }

  return (
    <>
      {generating && (
        <div className="magic-wait-backdrop" role="dialog" aria-modal="true" aria-label="Creating your picture">
          <div className="magic-wait-card">
            <div className="magic-art" aria-hidden="true">
              <span className="magic-sparkle sparkle-one"><Sparkles size={22} /></span>
              <span className="magic-sparkle sparkle-two"><Sparkles size={16} /></span>
              <div className="magic-palette"><Palette size={48} strokeWidth={2.2} /></div>
              <div className="magic-colours"><i /><i /><i /><i /></div>
            </div>
            <h2>Painting your picture!</h2>
            <p key={waitStage}>{WAIT_MESSAGES[waitStage]}</p>
            <div className="magic-progress" aria-hidden="true"><span /></div>
            <small>Please wait—your picture will pop up soon ✨</small>
          </div>
        </div>
      )}
      <main className="page-wrap" aria-hidden={generating || undefined}>
      <div className="app-shell">
        <header className="topbar">
          <button className="header-icon favourite-count" aria-label={`${saved.length} favourite words`}><Star size={22} /><span>{saved.length || ""}</span></button>
          <div className="brand"><h1><span>Say</span> <b>&amp;</b> <em>See</em></h1><p>Little words. Big imagination.</p></div>
          <button className="header-icon" aria-label="Grown-ups area"><UserRound size={22} /></button>
        </header>

        <section className="discovery-card" aria-live="polite">
          <div className="picture-frame" key={selected.word}>
            {/* Blob URLs are already optimized WebP files and are intentionally rendered directly. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selected.image} alt={`A friendly storybook ${selected.word.toLowerCase()}`} />
            <span className={`saved-picture ${selected.upgrading ? "upgrading" : ""}`}>
              {selected.upgrading ? <Sparkles size={12} /> : <Check size={12} strokeWidth={3} />}
              {selected.upgrading ? "Improving…" : "Saved"}
            </span>
          </div>

          <div className="word-heading">
            <button className="mini-action" onClick={() => speakLesson(selected, "Let’s learn")} aria-label={`Hear the ${selected.word} lesson`}><Volume2 size={21} /></button>
            <h2 className={selected.word.length >= 10 ? "extra-long" : selected.word.length >= 8 ? "long" : ""}>{selected.word}</h2>
            <button className={`mini-action heart ${saved.includes(selected.word) ? "active" : ""}`} onClick={toggleSave} aria-label="Save this word"><Heart size={21} fill={saved.includes(selected.word) ? "currentColor" : "none"} /></button>
          </div>

          <div className="letter-row" aria-label={`${selected.word} is spelled ${letters.join(" ")}`}>
            {letters.map((letter, index) => <button key={`${letter}-${index}`} onClick={() => speak(letter)} style={{ "--delay": `${index * 55}ms` } as React.CSSProperties}>{letter}</button>)}
          </div>
          <p className="sentence"><Sparkles size={15} /> {selected.sentence}</p>
        </section>

        <section className="voice-zone">
          {!listening && !generating && !speaking && !suggestions.length && (
            <div className="mic-halo">
              <button className="mic-button" onClick={listen} aria-label="Say a word"><Mic size={37} strokeWidth={2.4} /></button>
            </div>
          )}
          {listening && <div className="listening-bubbles" aria-label="Listening"><i /><i /><i /></div>}
          {!!suggestions.length && (
            <div className="speech-suggestions" role="group" aria-label="Did you mean">
              {suggestions.map((item) => (
                <button key={item.word} onClick={() => chooseSuggestion(item)}>
                  <span>
                    {/* Blob and bundled WebP thumbnails are rendered directly. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt="" />
                  </span>
                  <b>{item.word}</b>
                </button>
              ))}
              <button className="try-again" onClick={() => { setSuggestions([]); setMessage("Tap and say the word again"); }}>None of these</button>
            </div>
          )}
          <p>{message}</p>
        </section>

        <section className="word-picker">
          <div className="section-title"><h3>Pick another word</h3><span>Swipe to explore →</span></div>
          <div className="word-list">
            {galleryWords.map((item) => (
              <button key={item.word} disabled={generating} onClick={() => { if (generating) return; upgradeTokenRef.current += 1; setSelected(item); setMessage(`Great choice! ${item.word}`); setTimeout(() => speakLesson(item, "Great choice!"), 120); }} className={selected.word === item.word ? "active" : ""}>
                <span style={{ background: item.color }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt="" loading="lazy" />
                </span><b>{item.word}</b>
              </button>
            ))}
          </div>
        </section>
      </div>
      </main>
    </>
  );
}
