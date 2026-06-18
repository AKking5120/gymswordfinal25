import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, ArrowUp } from "lucide-react";
import { api } from "@/lib/api";

const WELCOME_MSG = {
  role: "assistant",
  content:
    "Welcome to GymSword. I'm your personal GymSword AI Assistant. I can help you discover products, find the perfect fit, track orders, and answer questions about GymSword.",
};

const SUGGESTIONS = [
  "Track my order",
  "Find the perfect fit",
  "Shipping & returns",
  "Membership benefits",
  "Talk to support",
];

const BTN_SIZE = "w-14 h-14";
const BTN_CLASS = `${BTN_SIZE} rounded-full bg-black text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all duration-200`;
const BTN_ANIMATE = "animate-in fade-in slide-in-from-bottom-4 duration-300";

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showTop, setShowTop] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const send = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput("");
    setShowSuggestions(false);

    const updated = [...messages, { role: "user", content: userMsg }];
    setMessages(updated);
    setLoading(true);

    try {
      const conv = updated.map((m) => ({ role: m.role, content: m.content }));
      const { data } = await api.post("/chat", { message: userMsg, conversation: conv });
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const [expandedMsgs, setExpandedMsgs] = useState({});

  const toggleExpand = (idx) => {
    setExpandedMsgs((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const truncate = (text, maxLen = 300) => {
    if (text.length <= maxLen) return text;
    return text.substring(0, maxLen) + "...";
  };

  const handleSuggestion = (text) => {
    send(text);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* Floating button group */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-center gap-4">
        {/* Chat button — always visible unless chat window is open */}
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className={`${BTN_CLASS} ${BTN_ANIMATE}`}
            aria-label="Chat with GymSword AI"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
        )}

        {/* Back to top — always stacked below chat */}
        {showTop && (
          <button
            onClick={scrollToTop}
            className={`${BTN_CLASS} ${BTN_ANIMATE}`}
            title="Back to top"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-[100] w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-10rem)] bg-white rounded-2xl shadow-2xl border border-black/5 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-black px-5 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold tracking-tight">GymSword AI</p>
                <p className="text-white/50 text-[11px]">Concierge</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white/70" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-hide bg-neutral-50/50">
            {messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              const isExpanded = expandedMsgs[idx];

              return (
                <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div className="flex gap-2 max-w-[85%]">
                    {!isUser && (
                      <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center shrink-0 mt-1">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        isUser
                          ? "bg-black text-white rounded-br-md"
                          : "bg-white border border-black/5 text-neutral-800 rounded-bl-md shadow-sm"
                      }`}
                    >
                      {isExpanded ? msg.content : truncate(msg.content)}
                      {msg.content.length > 300 && !isUser && (
                        <button
                          onClick={() => toggleExpand(idx)}
                          className="block mt-1 text-xs text-neutral-400 hover:text-neutral-600"
                        >
                          {isExpanded ? "Show less" : "Read more"}
                        </button>
                      )}
                    </div>
                    {isUser && (
                      <div className="w-7 h-7 rounded-full bg-neutral-200 flex items-center justify-center shrink-0 mt-1">
                        <User className="w-3.5 h-3.5 text-neutral-600" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-2 max-w-[85%]">
                  <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-white border border-black/5 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showSuggestions && messages.length === 1 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSuggestion(s)}
                    className="text-xs px-3 py-1.5 rounded-full border border-black/10 bg-white text-neutral-600 hover:bg-neutral-100 hover:border-neutral-300 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-black/5 px-4 py-3 bg-white shrink-0">
            <div className="flex items-center gap-2 bg-neutral-100 rounded-xl px-3 py-1.5">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Type your message..."
                className="flex-1 bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                className="w-8 h-8 rounded-full bg-black flex items-center justify-center disabled:opacity-30 hover:bg-neutral-800 transition-colors shrink-0"
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
