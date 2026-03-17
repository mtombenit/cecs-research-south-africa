import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Bot, Lightbulb, Loader2, FileText, X, ChevronDown, Trash2, Search, Zap, BarChart2 } from "lucide-react";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import AgentStepsDisplay from "@/components/ai/AgentStepsDisplay.jsx";

const SUGGESTED_QUESTIONS = [
  "What PFAS compounds have been found in South African water sources?",
  "Which provinces have the most PFAS research?",
  "What are the main health concerns related to PFAS in South Africa?",
  "Summarize the key findings on PFAS in drinking water",
  "What treatment technologies have been studied for PFAS removal?",
];

const STORAGE_KEY = 'askAI_messages';

export default function AskAI() {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPapers, setSelectedPapers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [agentSteps, setAgentSteps] = useState([]);
  const [lastStrategy, setLastStrategy] = useState(null);
  const messagesEndRef = useRef(null);

  // Persist messages to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const { data: papers = [] } = useQuery({
    queryKey: ['papers'],
    queryFn: () => base44.entities.ResearchPaper.list('-publication_year', 500),
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  const togglePaperSelection = (paperId) => {
    setSelectedPapers(prev => 
      prev.includes(paperId) 
        ? prev.filter(id => id !== paperId)
        : [...prev, paperId]
    );
  };

  const clearSelection = () => {
    setSelectedPapers([]);
  };

  const clearChat = () => {
    setMessages([]);
    setAgentSteps([]);
    setLastStrategy(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const deleteMessagePair = (index) => {
    // Delete the AI message and the user message before it
    setMessages(prev => prev.filter((_, i) => i !== index && i !== index - 1));
  };

  const filteredPapers = papers.filter(paper => 
    paper.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    paper.authors?.some(a => a.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSendMessage = async (content) => {
    const userMessage = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setAgentSteps([]);
    setLastStrategy(null);

    const conversationHistory = messages.slice(-6).map(m => ({
      role: m.role,
      content: m.content
    }));

    const response = await base44.functions.invoke('agenticRAG', {
      user_query: content,
      conversation_history: conversationHistory,
      selected_paper_ids: selectedPapers,
      max_iterations: 3
    });

    const data = response.data;
    if (data.agent_steps) setAgentSteps(data.agent_steps);
    if (data.strategy) setLastStrategy(data.strategy);

    const answerContent = data.answer || data.error || 'I was unable to generate a response. Please try again.';
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: answerContent,
      strategy: data.strategy,
      retrieved_count: data.retrieved_count
    }]);
    setIsLoading(false);
  };

  const handleSuggestedQuestion = (question) => {
    handleSendMessage(question);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg shadow-teal-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">AI Research Assistant</h1>
          </div>
          <p className="text-slate-600">
            Ask questions about PFAS research in South Africa and get AI-powered answers based on our database
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Document Selection */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap flex-1">
            <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <FileText className="w-4 h-4" />
                {selectedPapers.length > 0 
                  ? `${selectedPapers.length} paper(s) selected` 
                  : 'Select papers to analyze'}
                <ChevronDown className="w-4 h-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
              <div className="p-3 border-b">
                <Input
                  placeholder="Search papers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9"
                />
              </div>
              <ScrollArea className="h-[400px]">
                <div className="p-2 space-y-1">
                  {filteredPapers.map(paper => (
                    <div
                      key={paper.id}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                      onClick={() => togglePaperSelection(paper.id)}
                    >
                      <Checkbox
                        checked={selectedPapers.includes(paper.id)}
                        onCheckedChange={() => togglePaperSelection(paper.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 line-clamp-2">
                          {paper.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {paper.authors?.[0]} {paper.authors?.length > 1 && `+${paper.authors.length - 1} more`} • {paper.publication_year}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              {selectedPapers.length > 0 && (
                <div className="p-3 border-t bg-slate-50 flex justify-between items-center">
                  <span className="text-sm text-slate-600">{selectedPapers.length} selected</span>
                  <Button variant="ghost" size="sm" onClick={clearSelection}>
                    Clear all
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          {selectedPapers.length > 0 && (
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              {selectedPapers.slice(0, 2).map(paperId => {
                const paper = papers.find(p => p.id === paperId);
                return paper ? (
                  <Badge key={paperId} variant="secondary" className="max-w-[300px]">
                    <span className="truncate">{paper.title}</span>
                    <button
                      onClick={() => togglePaperSelection(paperId)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ) : null;
              })}
              {selectedPapers.length > 2 && (
                <Badge variant="secondary">
                  +{selectedPapers.length - 2} more
                </Badge>
              )}
            </div>
          )}
          </div>

          {messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearChat}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Chat
            </Button>
          )}
        </div>

        {/* Chat Container */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {/* Messages Area */}
            <div className="h-[500px] overflow-y-auto p-6 space-y-6 bg-slate-50/50">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-teal-200 rounded-2xl flex items-center justify-center mb-4">
                    <Bot className="w-8 h-8 text-teal-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    How can I help you today?
                  </h3>
                  <p className="text-slate-500 text-sm mb-6 max-w-md">
                    I can answer questions about PFAS research conducted in South Africa, 
                    including compounds studied, locations, findings, and more.
                  </p>
                  
                  {/* Suggested Questions */}
                  <div className="w-full max-w-lg">
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-3 flex items-center justify-center gap-2">
                      <Lightbulb className="w-3.5 h-3.5" />
                      Suggested Questions
                    </p>
                    <div className="space-y-2">
                      {SUGGESTED_QUESTIONS.map((question, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestedQuestion(question)}
                          className="w-full text-left p-3 bg-white rounded-xl border border-slate-200 text-sm text-slate-700 hover:border-teal-500 hover:bg-teal-50/50 transition-all duration-200"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message, idx) => (
                    <ChatMessage 
                      key={idx} 
                      message={message}
                      onDelete={message.role === 'assistant' ? () => deleteMessagePair(idx) : null}
                    />
                  ))}
                  {isLoading && (
                    <div className="flex gap-4">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm max-w-[80%]">
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                          <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                          <span className="text-sm font-medium text-teal-700">Agentic hybrid search running...</span>
                        </div>
                        {agentSteps.length > 0 && (
                          <AgentStepsDisplay steps={agentSteps} isLive />
                        )}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Strategy Badge */}
            {lastStrategy && !isLoading && (
              <div className="px-4 py-2 bg-teal-50 border-t border-teal-100 flex items-center gap-3 text-xs text-teal-700 flex-wrap">
                <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {lastStrategy.search_intent}</span>
                <span className="flex items-center gap-1"><Search className="w-3 h-3" /> {Math.round(lastStrategy.keyword_weight * 100)}% keyword / {Math.round(lastStrategy.semantic_weight * 100)}% semantic</span>
                <span className="flex items-center gap-1"><BarChart2 className="w-3 h-3" /> {lastStrategy.iterations} iteration(s)</span>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-200">
              <ChatInput 
                onSend={handleSendMessage} 
                isLoading={isLoading}
                placeholder="Ask about PFAS / CEC research in South Africa..."
              />
              <p className="text-xs text-slate-400 text-center mt-3">
                {selectedPapers.length > 0 
                  ? `Agentic hybrid search across ${selectedPapers.length} selected paper(s)`
                  : `Agentic hybrid search across ${papers.length} research papers`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}