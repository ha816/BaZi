"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { streamCompatibilityChat } from "@/lib/api";
import { parseStored, useStorageValue } from "@/lib/useStorageValue";
import type { CompatibilityInput } from "@/types/analysis";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function CompatibilityChatPage() {
  const router = useRouter();
  const rawInput = useStorageValue("kkachi_compat_input", "session");
  const rawNames = useStorageValue("kkachi_compat_names", "session");
  const input = useMemo(() => parseStored<CompatibilityInput>(rawInput), [rawInput]);
  const names = useMemo(() => parseStored<{ name1: string; name2: string }>(rawNames) ?? { name1: "", name2: "" }, [rawNames]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

    await streamCompatibilityChat(input, newHistory, (accumulated) => {
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
        <span className="text-lg">💞</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--color-ink)] truncate">
            사주까치 궁합 상담
          </p>
          {(names.name1 || names.name2) && (
            <p className="text-[10px] text-[var(--color-ink-faint)] truncate">
              {names.name1} ♥ {names.name2}
            </p>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
        {!input && (
          <p className="text-xs text-center text-[var(--color-ink-faint)] py-4">
            먼저 궁합 분석을 진행해주세요.
          </p>
        )}
        {input && messages.length === 0 && (
          <p className="text-xs text-center text-[var(--color-ink-faint)] py-4">
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
