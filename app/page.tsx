"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Check, Images, MessageCircle, Mic, Sparkles, Volume2 } from "lucide-react";

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

const CHOICE_PRAISE = [
  "Great choice!",
  "Lovely word!",
  "Well done!",
  "Nice one!",
  "What a fun word!",
  "Excellent pick!",
];

const TEACHER_STYLES = [
  { name: "Miss Lily", emoji: "👩🏻‍🏫", rate: 0.84, pitch: 1.18, colour: "#ff806f" },
  { name: "Miss Maya", emoji: "👩🏼‍🏫", rate: 0.76, pitch: 1.12, colour: "#9a82d5" },
  { name: "Miss Emma", emoji: "👩🏽‍🏫", rate: 0.88, pitch: 1.22, colour: "#efa82e" },
  { name: "Miss Sofia", emoji: "👩🏾‍🏫", rate: 0.78, pitch: 1.08, colour: "#5d9bd8" },
  { name: "Miss Aisha", emoji: "👩🏿‍🏫", rate: 0.72, pitch: 1.04, colour: "#65b99d" },
] as const;

function randomChoicePraise() {
  return CHOICE_PRAISE[Math.floor(Math.random() * CHOICE_PRAISE.length)];
}

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
  const [showStartup, setShowStartup] = useState(true);
  const [selected, setSelected] = useState<KidWord>(WORDS[0]);
  const [galleryWords, setGalleryWords] = useState<KidWord[]>(WORDS);
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState("Tap and say a word");
  const [teacherVoice, setTeacherVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [teacherProfile, setTeacherProfile] = useState(0);
  const [teacherPickerOpen, setTeacherPickerOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [activeLetter, setActiveLetter] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [suggestions, setSuggestions] = useState<WordSuggestion[]>([]);
  const [practiceWord, setPracticeWord] = useState<string | null>(null);
  const [waitStage, setWaitStage] = useState(0);
  const upgradeTokenRef = useRef(0);
  const speechTokenRef = useRef(0);
  const galleryRef = useRef<HTMLDivElement>(null);
  const wakeLockRef = useRef<{ release: () => Promise<void>; addEventListener: (type: "release", listener: () => void) => void } | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  async function requestWakeLock() {
    if (document.visibilityState !== "visible" || wakeLockRef.current) return;
    const wakeNavigator = navigator as Navigator & {
      wakeLock?: { request: (type: "screen") => Promise<{ release: () => Promise<void>; addEventListener: (type: "release", listener: () => void) => void }> };
    };
    try {
      const lock = await wakeNavigator.wakeLock?.request("screen");
      if (!lock) return;
      wakeLockRef.current = lock;
      lock.addEventListener("release", () => {
        if (wakeLockRef.current === lock) wakeLockRef.current = null;
      });
    } catch {
      // Some browsers or battery-saving modes do not provide Screen Wake Lock.
    }
  }

  function playListeningChime() {
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const context = audioContextRef.current ?? new AudioContextClass();
      audioContextRef.current = context;
      void context.resume();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime;
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(520, start);
      oscillator.frequency.exponentialRampToValueAtTime(660, start + 0.16);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.045, start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.21);
    } catch {
      // Listening still works if a browser blocks programmatic audio.
    }
  }

  useEffect(() => {
    const startupTimer = window.setTimeout(() => setShowStartup(false), 1_650);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js");

    const handleActivity = () => { void requestWakeLock(); };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void requestWakeLock();
    };
    window.addEventListener("pointerdown", handleActivity, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility);

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
        const sortedVoices = scored.map((item) => item.voice);
        const savedProfile = Math.min(
          TEACHER_STYLES.length - 1,
          Math.max(0, Number(localStorage.getItem("say-see-teacher-profile")) || 0),
        );
        const savedVoiceName = localStorage.getItem("say-see-teacher-voice");
        setAvailableVoices(sortedVoices);
        setTeacherProfile(savedProfile);
        setTeacherVoice(sortedVoices.find((voice) => voice.name === savedVoiceName) ?? sortedVoices[savedProfile % Math.max(sortedVoices.length, 1)] ?? sortedVoices[0] ?? null);
      };
      chooseTeacherVoice();
      speechSynthesis.addEventListener("voiceschanged", chooseTeacherVoice);
      removeVoiceListener = () => speechSynthesis.removeEventListener("voiceschanged", chooseTeacherVoice);
    }
    return () => {
      window.clearTimeout(startupTimer);
      window.clearInterval(galleryTimer);
      removeVoiceListener();
      window.removeEventListener("pointerdown", handleActivity);
      document.removeEventListener("visibilitychange", handleVisibility);
      void wakeLockRef.current?.release();
      wakeLockRef.current = null;
      void audioContextRef.current?.close();
      audioContextRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!generating) return;
    const timer = window.setInterval(() => {
      setWaitStage((stage) => (stage + 1) % WAIT_MESSAGES.length);
    }, 7_000);
    return () => window.clearInterval(timer);
  }, [generating]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const target = [...(galleryRef.current?.querySelectorAll<HTMLButtonElement>("button[data-word]") ?? [])]
        .find((button) => button.dataset.word === selected.word.toLowerCase());
      target?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }, 90);
    return () => window.clearTimeout(timer);
  }, [selected.word]);

  const letters = useMemo(() => selected.word.toUpperCase().split(""), [selected]);
  const teacherStyle = TEACHER_STYLES[teacherProfile];

  function speak(text = selected.word, rate = 0.82) {
    if (!("speechSynthesis" in window)) return;
    const speechToken = ++speechTokenRef.current;
    speechSynthesis.cancel();
    setActiveLetter(null);
    setSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    if (teacherVoice) utterance.voice = teacherVoice;
    utterance.lang = teacherVoice?.lang || "en-US";
    utterance.rate = Math.max(0.6, Math.min(1, rate * (teacherStyle.rate / 0.82)));
    utterance.pitch = teacherStyle.pitch;
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
    if (!("speechSynthesis" in window)) return;
    const speechToken = ++speechTokenRef.current;
    speechSynthesis.cancel();
    setSpeaking(true);
    setActiveLetter(null);

    const makeUtterance = (text: string, rate: number) => {
      const utterance = new SpeechSynthesisUtterance(text);
      if (teacherVoice) utterance.voice = teacherVoice;
      utterance.lang = teacherVoice?.lang || "en-US";
      utterance.rate = Math.max(0.6, Math.min(1, rate * (teacherStyle.rate / 0.82)));
      utterance.pitch = teacherStyle.pitch;
      utterance.volume = 1;
      return utterance;
    };
    const finishLesson = () => {
      if (speechTokenRef.current !== speechToken) return;
      setActiveLetter(null);
      setSpeaking(false);
      setPracticeWord(item.word);
      setMessage(`Now you try! Say “${item.word}”.`);
    };
    const lesson = [makeUtterance(`${praise} ${item.word}.`, 0.78)];
    item.word.toUpperCase().split("").forEach((letter, index) => {
      const utterance = makeUtterance(letter === " " ? "space" : letter, 0.68);
      utterance.onstart = () => {
        if (speechTokenRef.current === speechToken) setActiveLetter(index);
      };
      utterance.onerror = finishLesson;
      lesson.push(utterance);
    });
    const sentence = makeUtterance(`Now you try. Say ${item.word}.`, 0.78);
    sentence.onstart = () => {
      if (speechTokenRef.current !== speechToken) return;
      setActiveLetter(null);
      setPracticeWord(item.word);
      setMessage(`Now you try! Say “${item.word}”.`);
    };
    sentence.onend = () => {
      finishLesson();
      window.setTimeout(() => startListening(item.word), 300);
    };
    sentence.onerror = finishLesson;
    lesson.push(sentence);
    lesson.forEach((utterance) => speechSynthesis.speak(utterance));
  }

  function chooseTeacherProfile(index: number) {
    const style = TEACHER_STYLES[index];
    const voice = availableVoices[index % Math.max(availableVoices.length, 1)] ?? availableVoices[0] ?? null;
    setTeacherProfile(index);
    setTeacherVoice(voice);
    setTeacherPickerOpen(false);
    localStorage.setItem("say-see-teacher-profile", String(index));
    if (voice) localStorage.setItem("say-see-teacher-voice", voice.name);
    else localStorage.removeItem("say-see-teacher-voice");
    const speechToken = ++speechTokenRef.current;
    speechSynthesis.cancel();
    const preview = new SpeechSynthesisUtterance(`Hello! I’m ${style.name}. Let’s learn together.`);
    if (voice) preview.voice = voice;
    preview.lang = voice?.lang || "en-US";
    preview.rate = style.rate;
    preview.pitch = style.pitch;
    preview.onstart = () => setSpeaking(true);
    preview.onend = () => {
      if (speechTokenRef.current === speechToken) setSpeaking(false);
    };
    preview.onerror = preview.onend;
    speechSynthesis.speak(preview);
  }

  function watchForHighQuality(item: KidWord, token: number, attempt = 0) {
    if (attempt >= 20 || upgradeTokenRef.current !== token) return;
    window.setTimeout(async () => {
      if (upgradeTokenRef.current !== token) return;
      try {
        const response = await fetch(`/api/pictures?word=${encodeURIComponent(item.word)}`, { cache: "no-store" });
        const result = await response.json() as {
          image?: string;
          quality?: "low" | "preview" | "high";
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
    setPracticeWord(null);
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
        quality?: "low" | "preview" | "high";
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

  function handlePracticeResults(alternatives: string[], targetWord: string) {
    const expected = normalizeWords(targetWord);
    const heard = alternatives.map(normalizeWords).filter(Boolean);
    if (!heard.length) {
      setPracticeWord(null);
      setMessage("Tap the mic when you want another word.");
      return;
    }

    const bestScore = Math.max(...heard.map((phrase) => similarity(phrase, expected)));
    const saidExpectedWord = heard.some((phrase) =>
      phrase === expected || (` ${phrase} `).includes(` ${expected} `),
    );

    if (saidExpectedWord || bestScore >= 0.78) {
      setPracticeWord(null);
      setMessage("Excellent! Tap the mic for another word.");
      window.setTimeout(() => speak("Excellent!", 0.82), 180);
      return;
    }

    if (bestScore >= 0.48) {
      setPracticeWord(null);
      setMessage("Good try! Tap the mic when you want another word.");
      window.setTimeout(() => speak("Good try!", 0.82), 180);
      return;
    }

    setPracticeWord(null);
    setMessage("Nice try! Tap the mic when you want another word.");
    window.setTimeout(() => speak("Nice try!", 0.82), 180);
  }

  function startListening(practiceTarget?: string) {
    type RecognitionResult = { length: number; [index: number]: { transcript: string; confidence: number } };
    type Recognition = { lang: string; interimResults: boolean; maxAlternatives: number; start: () => void; stop: () => void; onresult: (e: { results: { [index: number]: RecognitionResult } }) => void; onerror: () => void; onend: () => void };
    const RecognitionClass = (window as typeof window & { webkitSpeechRecognition?: new () => Recognition }).webkitSpeechRecognition;
    if (!RecognitionClass) { setMessage("Voice works best in Chrome. Tap a word below!"); return; }
    const recognition = new RecognitionClass();
    recognition.lang = "en-GB";
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;
    let settled = false;
    let answerTimer: number | undefined;
    recognition.onresult = (e) => {
      if (settled) return;
      settled = true;
      if (answerTimer) window.clearTimeout(answerTimer);
      const result = e.results[0];
      const alternatives = Array.from({ length: result.length }, (_, index) => result[index].transcript);
      if (practiceTarget) handlePracticeResults(alternatives, practiceTarget);
      else handleSpeechResults(alternatives);
    };
    recognition.onerror = () => {
      if (answerTimer) window.clearTimeout(answerTimer);
      if (settled) return;
      settled = true;
      if (practiceTarget) {
        setPracticeWord(null);
        setMessage("Tap the mic when you want another word.");
      } else {
        setMessage("I didn’t hear that. Please try again!");
      }
    };
    recognition.onend = () => {
      if (answerTimer) window.clearTimeout(answerTimer);
      setListening(false);
    };
    setListening(true);
    setSuggestions([]);
    setMessage(practiceTarget ? `Your turn—say “${practiceTarget}”.` : "I’m listening…");
    playListeningChime();
    window.setTimeout(() => {
      try {
        recognition.start();
        if (practiceTarget) {
          answerTimer = window.setTimeout(() => {
            if (settled) return;
            settled = true;
            setPracticeWord(null);
            setListening(false);
            setMessage("Tap the mic when you want another word.");
            try { recognition.stop(); } catch { /* The microphone has already closed. */ }
          }, 5_000);
        }
      } catch {
        setListening(false);
        setMessage("Tap the microphone when you’re ready.");
      }
    }, 230);
  }

  function listen() {
    if (speaking || generating) return;
    startListening(practiceWord ?? undefined);
  }

  return (
    <>
      {showStartup && (
        <div className="startup-loader" role="status" aria-label="Opening Say and See">
          <div className="startup-sky" aria-hidden="true"><i /><i /><i /><i /></div>
          <div className="startup-brand">
            <div className="startup-icon-wrap" aria-hidden="true">
              <span className="startup-orbit"><i /><i /><i /></span>
              <div className="startup-icon">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/app-logo-3d.png" alt="" />
                <span className="startup-shine" />
              </div>
            </div>
            <div className="startup-name"><span>Say</span> <b>&amp;</b> <em>See</em></div>
            <p>Little words. Big imagination.</p>
            <div className="startup-progress" aria-hidden="true"><span /></div>
            <small>Ready to learn and smile</small>
          </div>
        </div>
      )}
      {generating && (
        <div className="magic-wait-backdrop" role="dialog" aria-modal="true" aria-label="Creating your picture">
          <div className="magic-wait-card">
            <div className="magic-art" aria-hidden="true">
              <span className="magic-sparkle sparkle-one"><Sparkles size={22} /></span>
              <span className="magic-sparkle sparkle-two"><Sparkles size={16} /></span>
              <div className="magic-logo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/app-logo-3d.png" alt="" />
              </div>
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
          <div className="brand"><h1><span>Say</span> <b>&amp;</b> <em>See</em></h1><p>Little words. Big imagination.</p></div>
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
            <div className="teacher-voice-control">
                <button className="teacher-voice-button" type="button" onClick={() => setTeacherPickerOpen((open) => !open)} aria-label={`Choose teacher voice. ${teacherStyle.name} is selected`} aria-expanded={teacherPickerOpen}>
                  <span aria-hidden="true">{teacherStyle.emoji}</span>
                </button>
                {teacherPickerOpen && (
                  <div className="teacher-picker" role="group" aria-label="Choose a teacher">
                    <strong>Choose your teacher</strong>
                    <div>
                      {TEACHER_STYLES.map((style, index) => (
                        <button key={style.name} type="button" className={teacherProfile === index ? "active" : ""} onClick={() => chooseTeacherProfile(index)} style={{ "--teacher-colour": style.colour } as React.CSSProperties}>
                          <span aria-hidden="true">{style.emoji}</span>
                          <b>{style.name}</b>
                        </button>
                      ))}
                    </div>
                    <small>Tap a teacher to hear her voice</small>
                  </div>
                )}
              </div>
          </div>

          <div className="letter-row" aria-label={`${selected.word} is spelled ${letters.join(" ")}`}>
            {letters.map((letter, index) => <button className={activeLetter === index ? "speaking" : ""} key={`${letter}-${index}`} onClick={() => speak(letter)} style={{ "--delay": `${index * 55}ms` } as React.CSSProperties}>{letter}</button>)}
          </div>
          <p className={`sentence ${practiceWord ? "practice-prompt" : ""}`}><Sparkles size={15} /> {practiceWord ? `Now you try! Say “${selected.word}”.` : selected.sentence}</p>
        </section>

        <section className="word-picker">
          <div className="section-title"><h3>Pick another word</h3><span>Swipe to explore →</span></div>
          <div className="word-list" ref={galleryRef}>
            {galleryWords.map((item) => (
              <button data-word={item.word.toLowerCase()} key={item.word} disabled={generating} onClick={() => { if (generating) return; const praise = randomChoicePraise(); upgradeTokenRef.current += 1; setPracticeWord(null); setSelected(item); setMessage(`${praise} ${item.word}`); setTimeout(() => speakLesson(item, praise), 120); }} className={selected.word === item.word ? "active" : ""}>
                <span style={{ background: item.color }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt="" loading="lazy" />
                </span><b>{item.word}</b>
              </button>
            ))}
          </div>
        </section>

        <section className="voice-zone" aria-label="Learning navigation">
          <button className="dock-item active" type="button" aria-label="Picture words"><Images size={20} /></button>
          <button className="dock-item" type="button" aria-label="Stories coming soon" disabled><BookOpen size={20} /></button>
          <div className="dock-center">
          {!listening && !generating && !speaking && !suggestions.length && (
            <div className="mic-halo">
              <button className="mic-button" onClick={listen} aria-label={practiceWord ? `Repeat ${practiceWord}` : "Say a word"}><Mic size={37} strokeWidth={2.4} /></button>
            </div>
          )}
          {listening && <div className="listening-bubbles" aria-label="Listening"><i /><i /><i /></div>}
          {speaking && (
            <div className="teacher-speaking" aria-label="Teacher is speaking">
              <Volume2 size={25} />
              <span><i /><i /><i /></span>
            </div>
          )}
          </div>
          <button className="dock-item" type="button" aria-label="Conversations coming soon" disabled><MessageCircle size={20} /></button>
          <button className="dock-item" type="button" aria-label="More lessons coming soon" disabled><Sparkles size={20} /></button>
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
          <p className="dock-message">{message}</p>
        </section>

      </div>
      </main>
    </>
  );
}
