import React, { useState, useRef, useEffect } from 'react';
import { useExplorerStore } from '@/stores/explorer';
import { useNavigatorStore } from '@/stores/navigator';
import { api } from '@/services/api';
import { MessageSquare, Send, X, ArrowUpRight, Terminal } from 'lucide-react';
import type { ChatMessage, NavigatorAction } from '@/types/navigator';

export function NavigatorPanel() {
  const chatOpen = useNavigatorStore((s) => s.chatOpen);
  const toggleChat = useNavigatorStore((s) => s.toggleChat);
  const chatHistory = useNavigatorStore((s) => s.chatHistory);
  const addMessage = useNavigatorStore((s) => s.addMessage);
  const isLoading = useNavigatorStore((s) => s.isLoading);
  const setLoading = useNavigatorStore((s) => s.setLoading);
  const aiAvailable = useNavigatorStore((s) => s.aiAvailable);
  const setAIAvailable = useNavigatorStore((s) => s.setAIAvailable);

  const graph = useExplorerStore((s) => s.graph);
  const analysisId = useExplorerStore((s) => s.analysisId);
  const selectNode = useExplorerStore((s) => s.selectNode);
  const highlightNodes = useExplorerStore((s) => s.highlightNodes);
  const highlightEdges = useExplorerStore((s) => s.highlightEdges);
  const isolateCluster = useExplorerStore((s) => s.isolateCluster);
  const nodeById = useExplorerStore((s) => s.nodeById);

  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Check if AI is available on mount
  useEffect(() => {
    const checkAI = async () => {
      try {
        const status = await api.navigatorStatus();
        setAIAvailable(status.available);
      } catch {
        setAIAvailable(false);
      }
    };
    checkAI();
  }, [setAIAvailable]);

  // Scroll chat messages to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, chatOpen]);

  // Execute AI action targets inside 3D space
  const executeAction = (action: NavigatorAction) => {
    const nodeMap = nodeById;

    switch (action.type) {
      case 'focusNodes':
        if (action.nodeIds && action.nodeIds[0]) {
          const first = nodeMap.get(action.nodeIds[0]);
          if (first) selectNode(first);
        }
        break;
      case 'highlightEdges':
        if (action.edgeKeys) {
          highlightEdges(action.edgeKeys);
        }
        break;
      case 'openInspector':
        if (action.nodeIds && action.nodeIds[0]) {
          const node = nodeMap.get(action.nodeIds[0]);
          if (node) selectNode(node);
        }
        break;
      case 'isolateCluster':
        if (action.nodeIds && action.nodeIds[0]) {
          const node = nodeMap.get(action.nodeIds[0]);
          if (node) isolateCluster(folderOf(node.id));
        }
        break;
      case 'showImpactPath':
        if (action.nodeIds) {
          highlightNodes(action.nodeIds);
        }
        break;
      default:
        break;
    }
  };

  const folderOf = (path: string) => {
    const idx = path.lastIndexOf('/');
    return idx === -1 ? '/' : path.slice(0, idx);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const query = input.trim();
    setInput('');

    const userMsg: ChatMessage = {
      role: 'user',
      content: query,
      timestamp: Date.now(),
    };
    addMessage(userMsg);

    setLoading(true);
    try {
      const formattedHistory = chatHistory.map((h) => ({
        role: h.role,
        content: h.content,
      }));

      // If demo universe, we don't have an active analysisId, use 'demo'
      const activeId = analysisId || 'demo';

      const response = await api.queryNavigator(activeId, query, formattedHistory);

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: response.content,
        actions: response.actions,
        referencedFiles: response.referencedFiles,
        timestamp: Date.now(),
      };
      addMessage(assistantMsg);

      // Trigger first action immediately if present
      if (response.actions && response.actions.length > 0) {
        executeAction(response.actions[0]!);
      }
    } catch (err: any) {
      console.error(err);
      addMessage({
        role: 'assistant',
        content: `ERR: ${err.message || 'AI Navigator request failed.'}`,
        timestamp: Date.now(),
      });
    } finally {
      setLoading(false);
    }
  };

  if (!chatOpen) {
    return (
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <button
          onClick={toggleChat}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent-primary/10 hover:bg-accent-primary/20 border border-accent-primary/40 text-primary rounded font-mono text-xs tracking-wider transition-colors"
        >
          <MessageSquare size={13} className="text-accent-primary" />
          <span>AI Navigator</span>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-xl px-4 pointer-events-auto animate-slide-up">
      <div className="technical-panel rounded shadow-technical p-4 font-mono text-xs text-secondary bg-surface-raised/95">
        <div className="flex justify-between items-center border-b border-primary/5 pb-2 mb-3">
          <div className="flex items-center gap-1.5 text-accent-secondary font-medium tracking-wider">
            <Terminal size={13} />
            <span>AI SPATIAL NAVIGATOR</span>
          </div>
          <button
            onClick={toggleChat}
            className="text-secondary/60 hover:text-primary transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Message logs */}
        <div
          ref={scrollRef}
          className="h-48 overflow-y-auto mb-3 space-y-3 bg-void border border-primary/5 rounded p-3"
        >
          {chatHistory.length === 0 ? (
            <div className="text-center py-10 text-secondary/40 text-[10px]">
              {aiAvailable === false ? (
                <span className="text-danger font-semibold uppercase">
                  Navigator offline (requires server GEMINI_API_KEY)
                </span>
              ) : (
                <span>Ask the Navigator e.g. "Take me to auth modules" or "Explain server/index.ts"</span>
              )}
            </div>
          ) : (
            chatHistory.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded px-3 py-2 leading-relaxed ${msg.role === 'user' ? 'bg-accent-primary/10 border border-accent-primary/20 text-primary' : 'bg-surface-secondary/60 border border-primary/5 text-secondary'}`}
                >
                  <div>{msg.content}</div>

                  {/* Actions buttons */}
                  {msg.actions && msg.actions.map((action, j) => (
                    <button
                      key={j}
                      onClick={() => executeAction(action)}
                      className="mt-2 flex items-center gap-1 text-[9px] text-accent-selected border border-accent-selected/30 px-2 py-0.5 rounded hover:bg-accent-selected/10 transition-all"
                    >
                      <ArrowUpRight size={10} />
                      {action.message}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex items-center gap-2 text-accent-selected animate-pulse text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-selected animate-ping" />
              <span>Analyzing codebase structure...</span>
            </div>
          )}
        </div>

        {/* Input box */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder={aiAvailable === false ? 'Navigator Offline...' : 'Ask about this architecture...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading || aiAvailable === false}
            className="flex-1 px-3 py-2 bg-void border border-primary/10 focus:border-accent-selected/50 text-primary rounded font-mono text-xs outline-none transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || aiAvailable === false}
            className="px-4 py-2 bg-accent-primary/15 hover:bg-accent-primary/25 border border-accent-primary/30 text-primary rounded font-mono text-xs transition-colors disabled:opacity-50"
          >
            <Send size={12} />
          </button>
        </form>
      </div>
    </div>
  );
}
export default NavigatorPanel;

