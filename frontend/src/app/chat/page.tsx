"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { streamChat } from "@/lib/api";
import type { AnalysisInput } from "@/types/analysis";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [input, setInput] = useState<AnalysisInput | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setName(sessionStorage.getItem("kkachi_analysis_name") ?? "");
    const raw = sessionStorage.getItem("kkachi_analysis_input");
    if (raw) {
      try { setInput(JSON.parse(raw)); } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = draft.trim();
    if (!text || loading || !input) return;

    const userMsg: Message = { role: "user", content: text };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setDraft("");
    setLoading(true);

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages([...newHistory, assistantMsg]);

    await streamChat(input, name, newHistory, (accumulated) => {
      setMessages([...newHistory, { role: "assistant", content: accumulated }]);
    });

    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <main
      className="fixed inset-0 flex flex-col"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      <header
        className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border-light)]"
        style={{ backgroundColor: "var(--color-surface)" }}
      >
        <button
          onClick={() => router.back()}
          className="text-[var(--color-ink)] text-2xl leading-none w-8 h-8 flex items-center justify-center"
          aria-label="뒤로"
        >
          ←
        </button>
        <span className="text-lg">🐦</span>
        <span className="text-sm font-semibold text-[var(--color-ink)]">
          사주까치 상담
        </span>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
        {!input && (
          <p className="text-xs text-center text-[var(--color-ink-faint)] py-4">
            먼저 사주 분석을 진행해주세요.
          </p>
        )}
        {input && messages.length === 0 && (
          <p className="text-xs text-center text-[var(--color-ink-faint)] py-4">
            {name ? `${name}님의` : "나의"} 사주에 대해 무엇이든 물어보세요 🙂
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                m.role === "user"
                  ? "text-white rounded-br-sm"
                  : "text-[var(--color-ink)] rounded-bl-sm border border-[var(--color-border-light)]"
              }`}
              style={
                m.role === "user"
                  ? { backgroundColor: "var(--color-gold)" }
                  : { backgroundColor: "var(--color-surface)" }
              }
            >
              {m.role === "assistant" ? (
                m.content ? (
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                ) : (
                  <span className="animate-pulse text-[var(--color-ink-faint)]">●●●</span>
                )
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div
        className="flex items-end gap-2 px-3 py-3 border-t border-[var(--color-border-light)]"
        style={{ backgroundColor: "var(--color-surface)" }}
      >
        <textarea
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          placeholder="질문을 입력하세요 (Enter 전송)"
          disabled={loading || !input}
          className="flex-1 resize-none rounded-xl border border-[var(--color-border-light)] px-3 py-2 text-sm text-[var(--color-ink)] bg-[var(--color-bg)] outline-none focus:border-[var(--color-gold)] placeholder:text-[var(--color-ink-faint)] disabled:opacity-50"
          style={{ maxHeight: "120px" }}
        />
        <button
          onClick={send}
          disabled={!draft.trim() || loading || !input}
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white disabled:opacity-40"
          style={{ backgroundColor: "var(--color-gold)" }}
          aria-label="전송"
        >
          ↑
        </button>
      </div>
    </main>
  );
}
