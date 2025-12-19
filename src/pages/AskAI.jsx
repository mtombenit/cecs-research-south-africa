import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Bot, Lightbulb, Loader2 } from "lucide-react";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";

const SUGGESTED_QUESTIONS = [
  "What PFAS compounds have been found in South African water sources?",
  "Which provinces have the most PFAS research?",
  "What are the main health concerns related to PFAS in South Africa?",
  "Summarize the key findings on PFAS in drinking water",
  "What treatment technologies have been studied for PFAS removal?",
];

export default function AskAI() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const { data: papers = [] } = useQuery({
    queryKey: ['papers'],
    queryFn: () => base44.entities.ResearchPaper.list('-publication_year', 100),
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const buildContext = () => {
    // Build a summary of the research database
    const summaries = papers.slice(0, 30).map(p => 
      `Title: ${p.title}
Authors: ${p.authors?.join(", ")}
Year: ${p.publication_year}
Province: ${p.province || "Not specified"}
Compounds: ${p.pfas_compounds?.join(", ") || "Not specified"}
Research Type: ${p.research_type || "Not specified"}
Key Findings: ${p.key_findings || p.abstract || "Not available"}
---`
    ).join("\n");

    return `You are a research assistant specialized in PFAS (Per- and Polyfluoroalkyl Substances) research in South Africa.

You have access to a database of ${papers.length} research papers on PFAS conducted in South Africa.

Here is a summary of the research database:
${summaries}

Guidelines:
- Answer questions based on the research data provided
- Cite specific papers when relevant
- If the information is not in the database, clearly state that
- Provide balanced, scientific responses
- Focus on South African context
- Be helpful and informative`;
  };

  const handleSendMessage = async (content) => {
    const userMessage = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `${buildContext()}

User Question: ${content}

Please provide a helpful, accurate response based on the South African PFAS research database.`,
    });

    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
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
                    <ChatMessage key={idx} message={message} />
                  ))}
                  {isLoading && (
                    <div className="flex gap-4">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Analyzing research data...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-200">
              <ChatInput 
                onSend={handleSendMessage} 
                isLoading={isLoading}
                placeholder="Ask about PFAS research in South Africa..."
              />
              <p className="text-xs text-slate-400 text-center mt-3">
                Responses are based on {papers.length} research papers in our database
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}