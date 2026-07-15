"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Heart, Mic, Palette, Sparkles, Star, UserRound, Volume2 } from "lucide-react";

type KidWord = { word: string; emoji: string; image: string; color: string; sentence: string; upgrading?: boolean };
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

export default function Home() {
  const [selected, setSelected] = useState<KidWord>(WORDS[0]);
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
  const [generating, setGenerating] = useState(false);
  const [waitStage, setWaitStage] = useState(0);
  const upgradeTokenRef = useRef(0);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js");

    if ("speechSynthesis" in window) {
      const chooseTeacherVoice = () => {
        const voices = speechSynthesis.getVoices().filter((voice) => voice.lang.toLowerCase().startsWith("en"));
        const preferredNames = [
          "samantha", "ava", "aria", "jenny", "zira", "susan", "serena",
          "google uk english female", "google us english", "female"
        ];
        const scored = voices
          .map((voice) => ({
            voice,
            score:
              (preferredNames.findIndex((name) => voice.name.toLowerCase().includes(name)) >= 0
                ? 100 - preferredNames.findIndex((name) => voice.name.toLowerCase().includes(name))
                : 0) +
              (voice.lang.toLowerCase() === "en-us" ? 8 : 0) +
              (voice.localService ? 2 : 0),
          }))
          .sort((a, b) => b.score - a.score);
        setTeacherVoice(scored[0]?.voice ?? voices[0] ?? null);
      };
      chooseTeacherVoice();
      speechSynthesis.addEventListener("voiceschanged", chooseTeacherVoice);
      return () => speechSynthesis.removeEventListener("voiceschanged", chooseTeacherVoice);
    }
  }, []);

  useEffect(() => {
    if (!generating) return;
    const timer = window.setInterval(() => {
      setWaitStage((stage) => (stage + 1) % WAIT_MESSAGES.length);
    }, 7_000);
    return () => window.clearInterval(timer);
  }, [generating]);

  const letters = useMemo(() => selected.word.toUpperCase().split(""), [selected]);

  function speak(text = selected.word, rate = 0.76) {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (teacherVoice) utterance.voice = teacherVoice;
    utterance.lang = teacherVoice?.lang || "en-US";
    utterance.rate = rate;
    utterance.pitch = 1.04;
    utterance.volume = 1;
    speechSynthesis.speak(utterance);
  }

  function speakLesson(item: KidWord, praise = "Wonderful!") {
    const spelling = item.word.toUpperCase().split("").join(". ");
    speak(`${praise} ${item.word}. ${spelling}. ${item.sentence}`, 0.72);
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
          setSelected({ ...item, image: result.image, upgrading: false });
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
    const match = WORDS.find((item) => cleaned.includes(item.word.toLowerCase()));
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

  function listen() {
    type Recognition = { lang: string; interimResults: boolean; start: () => void; onresult: (e: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void; onerror: () => void; onend: () => void };
    const RecognitionClass = (window as typeof window & { webkitSpeechRecognition?: new () => Recognition }).webkitSpeechRecognition;
    if (!RecognitionClass) { setMessage("Voice works best in Chrome. Tap a word below!"); return; }
    const recognition = new RecognitionClass();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onresult = (e) => chooseWord(e.results[0][0].transcript);
    recognition.onerror = () => setMessage("I didn’t hear that. Please try again!");
    recognition.onend = () => setListening(false);
    setListening(true);
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
          <div className={`mic-halo ${listening ? "listening" : ""} ${generating ? "creating" : ""}`}>
            <button className="mic-button" onClick={listen} disabled={generating} aria-label="Say a word"><Mic size={37} strokeWidth={2.4} /></button>
          </div>
          <p>{message}</p>
        </section>

        <section className="word-picker">
          <div className="section-title"><h3>Pick another word</h3><span>Swipe to explore →</span></div>
          <div className="word-list">
            {WORDS.map((item) => (
              <button key={item.word} disabled={generating} onClick={() => { if (generating) return; upgradeTokenRef.current += 1; setSelected(item); setMessage(`Great choice! ${item.word}`); setTimeout(() => speakLesson(item, "Great choice!"), 120); }} className={selected.word === item.word ? "active" : ""}>
                <span style={{ background: item.color }}>{item.emoji}</span><b>{item.word}</b>
              </button>
            ))}
          </div>
        </section>
      </div>
      </main>
    </>
  );
}
