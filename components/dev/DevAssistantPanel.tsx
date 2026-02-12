import { useState, useEffect, useRef, useCallback } from "react";
import { Bot, MessageSquare, Plus, Clock, Send, ArrowLeft, Loader2, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

// Types
interface DevConversation {
  id: string;
  title: string;
  page_context: string;
  lesson_context: any;
  created_at: string;
  updated_at: string;
}

interface DevMessage {
  id?: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

interface QuickAction {
  label: string;
  prompt: string;
  component?: string;
}

interface DevAssistantContext {
  lesson: { id: string; name: string; kind: string };
  ex: { idx: string; type: string; q: string; a?: string };
  review?: boolean;
}

// Parse quick actions from AI response
function parseQuickActions(content: string): { cleanContent: string; actions: QuickAction[] } {
  const match = content.match(/```quickactions\n([\s\S]*?)```/);
  if (!match) return { cleanContent: content, actions: [] };

  try {
    const actions = JSON.parse(match[1]) as QuickAction[];
    const cleanContent = content.replace(/```quickactions\n[\s\S]*?```/, "").trim();
    return { cleanContent, actions };
  } catch {
    return { cleanContent: content, actions: [] };
  }
}

// Streaming chat helper
async function streamDevChat({
  messages,
  context,
  onDelta,
  onDone,
  onError,
}: {
  messages: { role: string; content: string }[];
  context?: DevAssistantContext;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}) {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dev-assistant`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, context }),
  });

  if (!resp.ok || !resp.body) {
    if (resp.status === 429) { onError("Rate limit – zkus to za chvíli"); return; }
    if (resp.status === 402) { onError("Došly kredity"); return; }
    onError("Chyba AI"); return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { onDone(); return; }
      try {
        const parsed = JSON.parse(json);
        const c = parsed.choices?.[0]?.delta?.content;
        if (c) onDelta(c);
      } catch { /* partial */ }
    }
  }
  onDone();
}

// Extract spec blocks (```...``` sections + ## TASK headers) for smart copy
function extractSpecContent(content: string): string {
  const { cleanContent } = parseQuickActions(content);
  
  // Extract all code blocks and structured spec sections
  const lines = cleanContent.split("\n");
  const specLines: string[] = [];
  let inCodeBlock = false;
  let inSpec = false;
  
  for (const line of lines) {
    if (line.startsWith("```") && !line.startsWith("```quickactions")) {
      inCodeBlock = !inCodeBlock;
      if (inCodeBlock && line.length > 3) {
        // Opening with language tag
        specLines.push(line);
      } else if (!inCodeBlock) {
        specLines.push(line);
        specLines.push("");
      } else {
        specLines.push(line);
      }
      continue;
    }
    
    if (inCodeBlock) {
      specLines.push(line);
      continue;
    }
    
    // Detect structured spec lines (## TASK, COMPONENT:, SUB-ELEMENTS, etc.)
    if (
      line.startsWith("## TASK:") ||
      line.startsWith("### ") ||
      line.startsWith("SCREEN:") ||
      line.startsWith("COMPONENT:") ||
      line.startsWith("PARENT:") ||
      line.startsWith("SIZE:") ||
      line.startsWith("POSITION:") ||
      line.startsWith("LAYOUT:") ||
      line.startsWith("PURPOSE:") ||
      line.startsWith("FLOW:") ||
      line.startsWith("EXERCISE:") ||
      line.startsWith("VISIBLE:") ||
      line.startsWith("CONDITIONAL:") ||
      line.match(/^[├└│─\[]/) ||
      line.match(/^\[[\dC]\]/) ||
      line.startsWith("- tap ") ||
      line.startsWith("- long-press ") ||
      line.startsWith("- ") && inSpec
    ) {
      inSpec = true;
      specLines.push(line);
    } else if (line.trim() === "" && inSpec) {
      specLines.push(line);
    } else {
      inSpec = false;
    }
  }
  
  const result = specLines.join("\n").trim();
  return result || cleanContent; // fallback to full content if no spec detected
}

// Copy button for assistant messages
function CopyMessageButton({ content }: { content: string }) {
  const [copied, setCopied] = useState<"spec" | "all" | null>(null);
  
  const handleCopy = async (mode: "spec" | "all") => {
    try {
      const text = mode === "spec" 
        ? extractSpecContent(content) 
        : parseQuickActions(content).cleanContent;
      await navigator.clipboard.writeText(text);
      setCopied(mode);
      setTimeout(() => setCopied(null), 2000);
    } catch { /* silent */ }
  };
  
  return (
    <div className="absolute -top-1 -right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
      <button
        onClick={() => handleCopy("spec")}
        className={cn(
          "w-7 h-7 rounded-l-lg flex items-center justify-center",
          "bg-muted border border-border shadow-sm",
          "hover:bg-primary/20 hover:border-primary/30 active:scale-90",
          copied === "spec" && "opacity-100 bg-primary/20 border-primary/30"
        )}
        title="Zkopírovat spec (pro AI)"
      >
        {copied === "spec" ? <Check className="w-3.5 h-3.5 text-primary" /> : <span className="text-[9px] font-bold text-muted-foreground">AI</span>}
      </button>
      <button
        onClick={() => handleCopy("all")}
        className={cn(
          "w-7 h-7 rounded-r-lg flex items-center justify-center",
          "bg-muted border border-border border-l-0 shadow-sm",
          "hover:bg-muted/80 active:scale-90",
          copied === "all" && "opacity-100 bg-primary/20 border-primary/30"
        )}
        title="Zkopírovat vše"
      >
        {copied === "all" ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>
    </div>
  );
}

// ============= Chat View =============
function ChatView({
  conversationId,
  context,
  onBack,
}: {
  conversationId: string;
  context: DevAssistantContext;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<DevMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load existing messages
  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase
        .from("dev_messages" as any)
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true }) as any);
      if (data && data.length > 0) {
        setMessages(data as DevMessage[]);
        // Parse quick actions from last assistant message
        const lastAssistant = [...data].reverse().find((m: any) => m.role === "assistant");
        if (lastAssistant) {
          const { actions } = parseQuickActions((lastAssistant as any).content);
          setQuickActions(actions);
        }
      } else {
        // Auto-send initial greeting
        handleSend("Ahoj, co mi řekneš o této obrazovce?");
      }
    };
    load();
  }, [conversationId]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const msgText = text || input.trim();
    if (!msgText || isStreaming) return;
    setInput("");
    setQuickActions([]);

    const userMsg: DevMessage = { conversation_id: conversationId, role: "user", content: msgText };
    setMessages((prev) => [...prev, userMsg]);

    // Save user message
    await (supabase.from("dev_messages" as any) as any).insert(userMsg);

    setIsStreaming(true);
    let assistantContent = "";

    const allMessages = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, { conversation_id: conversationId, role: "assistant", content: "" }]);

    await streamDevChat({
      messages: allMessages,
      context,
      onDelta: (chunk) => {
        assistantContent += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            conversation_id: conversationId,
            role: "assistant",
            content: assistantContent,
          };
          return updated;
        });
      },
      onDone: async () => {
        setIsStreaming(false);
        // Parse quick actions
        const { cleanContent, actions } = parseQuickActions(assistantContent);
        setQuickActions(actions);

        // Save assistant message (full content including quickactions block)
        await (supabase.from("dev_messages" as any) as any).insert({
          conversation_id: conversationId,
          role: "assistant",
          content: assistantContent,
        });

        // Update conversation title from first exchange
        if (messages.length === 0) {
          const title = msgText.substring(0, 80);
          await (supabase.from("dev_conversations" as any) as any).update({ title }).eq("id", conversationId);
        }
      },
      onError: (err) => {
        setIsStreaming(false);
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            conversation_id: conversationId,
            role: "assistant",
            content: `⚠️ ${err}`,
          };
          return updated;
        });
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Render message content (strip quickactions block)
  const renderContent = (content: string) => {
    const { cleanContent } = parseQuickActions(content);
    // Simple markdown-like rendering
    return cleanContent.split("\n").map((line, i) => {
      if (line.startsWith("### ")) return <h4 key={i} className="font-bold text-sm mt-3 mb-1">{line.slice(4)}</h4>;
      if (line.startsWith("## ")) return <h3 key={i} className="font-bold text-base mt-3 mb-1">{line.slice(3)}</h3>;
      if (line.startsWith("# ")) return <h2 key={i} className="font-bold text-lg mt-3 mb-1">{line.slice(2)}</h2>;
      if (line.startsWith("- ")) return <li key={i} className="ml-4 text-sm list-disc">{line.slice(2)}</li>;
      if (line.trim() === "") return <br key={i} />;
      // Bold
      const boldified = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return <p key={i} className="text-sm" dangerouslySetInnerHTML={{ __html: boldified }} />;
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2 shrink-0">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium truncate">
          {context.lesson.name} – {context.ex.type}
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => {
          const isAssistant = msg.role === "assistant";
          return (
            <div key={i} className={cn("flex", !isAssistant ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 relative group",
                  !isAssistant
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted/70 text-foreground rounded-bl-md"
                )}
              >
                {/* Copy button for assistant messages */}
                {isAssistant && msg.content && !isStreaming && (
                  <CopyMessageButton content={parseQuickActions(msg.content).cleanContent} />
                )}
                {isAssistant ? (
                  <div className="prose-sm">
                    {renderContent(msg.content)}
                    {isStreaming && i === messages.length - 1 && (
                      <span className="inline-block w-1.5 h-4 bg-foreground/50 animate-pulse ml-0.5 -mb-0.5" />
                    )}
                  </div>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
              </div>
            </div>
          );
        })}

        {/* Quick Actions - inside scroll, right after last message */}
        {quickActions.length > 0 && !isStreaming && (
          <div className="flex flex-wrap gap-2 pt-1 pb-2">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => handleSend(action.prompt)}
                onMouseEnter={() => {
                  if (action.component) {
                    const el = document.querySelector(`[data-component="${action.component}"]`);
                    if (el) {
                      el.classList.add("dev-highlight");
                    }
                  }
                }}
                onMouseLeave={() => {
                  if (action.component) {
                    const el = document.querySelector(`[data-component="${action.component}"]`);
                    if (el) {
                      el.classList.remove("dev-highlight");
                    }
                  }
                }}
                className={cn(
                  "px-3 py-2 rounded-xl text-xs font-medium",
                  "bg-primary/10 text-foreground border border-primary/20",
                  "hover:bg-primary/20 hover:border-primary/30 transition-all",
                  "active:scale-95"
                )}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Zeptej se na cokoliv…"
            rows={1}
            className={cn(
              "flex-1 resize-none rounded-xl px-4 py-3 text-sm",
              "bg-muted/50 border border-border",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
              "placeholder:text-muted-foreground",
              "max-h-32"
            )}
            style={{ minHeight: "44px" }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isStreaming}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
              "bg-primary text-primary-foreground",
              "hover:opacity-90 active:scale-95 transition-all",
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============= Home View (conversation list) =============
function HomeView({
  conversations,
  currentPage,
  onNewChat,
  onOpenConversation,
}: {
  conversations: DevConversation[];
  currentPage: string;
  onNewChat: () => void;
  onOpenConversation: (conv: DevConversation) => void;
}) {
  const formatTime = (dateStr: string) => {
    const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diffMin < 1) return "teď";
    if (diffMin < 60) return `${diffMin}m`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h`;
    return `${Math.floor(diffH / 24)}d`;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 pt-5 pb-3">
        <button
          onClick={onNewChat}
          className={cn(
            "w-full px-5 py-4 rounded-xl",
            "bg-primary/10 border border-primary/20 text-foreground",
            "hover:bg-primary/20 hover:border-primary/30 transition-all",
            "flex items-center gap-3 text-left"
          )}
        >
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Plus className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm">Nová konverzace</p>
            <p className="text-xs text-muted-foreground truncate">{currentPage}</p>
          </div>
        </button>
      </div>

      <div className="px-6 pb-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Historie</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {conversations.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Zatím žádné konverzace</div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onOpenConversation(conv)}
                className={cn(
                  "w-full px-3 py-3 rounded-lg text-left",
                  "hover:bg-muted/50 transition-colors",
                  "flex items-center gap-3"
                )}
              >
                <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{conv.title || "Bez názvu"}</p>
                  <p className="text-xs text-muted-foreground truncate">{conv.page_context}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(conv.updated_at)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============= Main Export =============
export interface DevAssistantProps {
  lessonId: string;
  lessonName: string;
  lessonKind: string;
  exerciseType: string;
  exerciseIndex: number;
  totalExercises: number;
  exerciseQuestion?: string;
  exerciseAnswer?: string;
  isReviewMode: boolean;
  visibleComponents?: string[];
}

export default function DevAssistantPanel({
  lessonId,
  lessonName,
  lessonKind,
  exerciseType,
  exerciseIndex,
  totalExercises,
  exerciseQuestion,
  exerciseAnswer,
  isReviewMode,
  visibleComponents = [],
}: DevAssistantProps) {
  const [open, setOpen] = useState(false);
  const [activeView, setActiveView] = useState<"home" | "chat">("home");
  const [conversations, setConversations] = useState<DevConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const currentPage = `/practice/${lessonKind}/${lessonName}`;

  const context: DevAssistantContext & { visibleComponents?: string[] } = {
    lesson: { id: lessonId, name: lessonName, kind: lessonKind },
    ex: {
      idx: `${exerciseIndex + 1}/${totalExercises}`,
      type: exerciseType,
      q: exerciseQuestion?.substring(0, 80) || "",
      a: exerciseAnswer?.substring(0, 50) || "",
    },
    review: isReviewMode || undefined,
    visibleComponents: visibleComponents.length > 0 ? visibleComponents : undefined,
  };

  useEffect(() => {
    if (!open) return;
    (supabase
      .from("dev_conversations" as any)
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(50) as any)
      .then(({ data }) => {
        if (data) setConversations(data as DevConversation[]);
      });
  }, [open]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setActiveView("home");
      setActiveConversationId(null);
    }
  };

  const handleNewChat = async () => {
    const { data } = await (supabase
      .from("dev_conversations" as any)
      .insert({
        title: `${lessonName} – ${exerciseType}`,
        page_context: currentPage,
        lesson_context: context,
      }) as any)
      .select()
      .single();
    if (data) {
      setConversations((prev) => [data as DevConversation, ...prev]);
      setActiveConversationId(data.id);
      setActiveView("chat");
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "absolute bottom-10 right-3 z-40 w-8 h-8 rounded-full flex items-center justify-center",
          "bg-muted/60 backdrop-blur-sm border border-border/50 text-muted-foreground",
          "hover:bg-muted hover:text-foreground transition-all duration-200",
          "active:scale-90"
        )}
        title="Dev Assistant"
      >
        <Bot className="w-3.5 h-3.5" />
      </button>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="right"
          className="w-[90vw] sm:w-[600px] md:w-[720px] lg:w-[800px] sm:max-w-[800px] flex flex-col p-0"
        >
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Bot className="w-4 h-4" />
              Dev Assistant
            </SheetTitle>
          </SheetHeader>

          {activeView === "home" && (
            <HomeView
              conversations={conversations}
              currentPage={currentPage}
              onNewChat={handleNewChat}
              onOpenConversation={(conv) => {
                setActiveConversationId(conv.id);
                setActiveView("chat");
              }}
            />
          )}

          {activeView === "chat" && activeConversationId && (
            <ChatView
              conversationId={activeConversationId}
              context={context}
              onBack={() => {
                setActiveView("home");
                setActiveConversationId(null);
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
