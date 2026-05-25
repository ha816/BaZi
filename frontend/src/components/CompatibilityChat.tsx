"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { streamCompatibilityChat } from "@/lib/api";
import type { CompatibilityInput } from "@/types/analysis";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  input: CompatibilityInput;
  name1: string;
  name2: string;
}

export default function CompatibilityChat({ input, name1, name2 }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;

    const userMsg: Message = { role: "user", content };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setDraft("");
    setLoading(true);

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages([...newHistory, assistantMsg]);

    await streamCompatibilityChat(input, newHistory, (accumulated) => {
      setMessages([...newHistory, { role: "assistant", content: accumulated }]);
    });

    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(draft);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-24 right-4 z-[60] w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl"
        style={{ backgroundColor: "var(--color-gold)", color: "#fff" }}
        aria-label="궁합 상담"
      >
        💞
      </button>

      {open && (
        <div
          className="fixed bottom-44 right-4 z-[60] w-[min(360px,calc(100vw-2rem))] max-h-[70vh] flex flex-col rounded-2xl shadow-2xl border border-[var(--color-border-light)] overflow-hidden"
          style={{ backgroundColor: "var(--color-bg)" }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-light)]"
            style={{ backgroundColor: "var(--color-surface)" }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg">💞</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--color-ink)] truncate">
                  사주까치 궁합 상담
                </p>
                <p className="text-[10px] text-[var(--color-ink-faint)] truncate">
                  {name1} ♥ {name2}
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] text-lg leading-none"
            >
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
            {messages.length === 0 && (
              <p className="text-xs text-center text-[var(--color-ink-faint)] py-2">
                두 분의 관계에 대해 까치에게 물어보세요 🐦
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
              disabled={loading}
              className="flex-1 resize-none rounded-xl border border-[var(--color-border-light)] px-3 py-2 text-sm text-[var(--color-ink)] bg-[var(--color-bg)] outline-none focus:border-[var(--color-gold)] placeholder:text-[var(--color-ink-faint)] disabled:opacity-50"
              style={{ maxHeight: "80px" }}
            />
            <button
              onClick={() => send(draft)}
              disabled={!draft.trim() || loading}
              className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white disabled:opacity-40"
              style={{ backgroundColor: "var(--color-gold)" }}
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  );
}