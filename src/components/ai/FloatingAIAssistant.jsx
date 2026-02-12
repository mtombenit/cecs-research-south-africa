import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sparkles, X, Send, Loader2, ChevronDown, Database } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

export default function FloatingAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const { data: papers = [] } = useQuery({
    queryKey: ['papers-ai'],
    queryFn: () => base44.entities.ResearchPaper.list('-publication_year'),
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Prepare database context
      const dbContext = `
You are an expert AI research assistant with deep knowledge of Contaminants of Emerging Concern (CECs), PFAS, and environmental chemistry. You have access to ${papers.length} research publications from South Africa.

DATABASE SUMMARY:
- Total Publications: ${papers.length}
- Provinces covered: ${[...new Set(papers.map(p => p.province).filter(Boolean))].join(', ')}
- Research types: ${[...new Set(papers.map(p => p.research_type).filter(Boolean))].join(', ')}
- Years: ${Math.min(...papers.map(p => p.publication_year).filter(Boolean))} - ${Math.max(...papers.map(p => p.publication_year).filter(Boolean))}
- Total unique compounds studied: ${[...new Set(papers.flatMap(p => p.pfas_compounds || []))].length}

COMPLETE DATABASE RECORDS:
${papers.slice(0, 100).map((p, i) => `
[${i + 1}] ${p.title} (${p.publication_year})
- Authors: ${p.authors?.join(', ') || 'N/A'}
- Province: ${p.province || 'N/A'}
- Research Type: ${p.research_type || 'N/A'}
- Compounds: ${p.pfas_compounds?.join(', ') || 'N/A'}
- Sample Matrix: ${p.sample_matrix?.join(', ') || 'N/A'}
- Key Findings: ${p.key_findings || 'N/A'}
- Abstract: ${p.abstract?.substring(0, 300) || 'N/A'}...
`).join('\n')}

${papers.length > 100 ? `\nNote: Showing first 100 papers. Additional ${papers.length - 100} papers available in database covering similar topics and regions.` : ''}

USER QUESTION: ${input}

INSTRUCTIONS:
- Provide deep, data-driven insights based ONLY on the actual database records above
- Cite specific papers by title when making claims
- Provide statistics, trends, and patterns from the data
- If data is insufficient, clearly state limitations
- Be precise and scholarly in your analysis
- Highlight geographical patterns, temporal trends, and compound-specific findings
- Compare findings across provinces, research types, or time periods when relevant
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: dbContext,
      });

      const aiMessage = { role: "assistant", content: response };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = { 
        role: "assistant", 
        content: "I apologize, but I encountered an error processing your request. Please try again." 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="h-16 w-16 rounded-full shadow-2xl bg-gradient-to-br from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 group"
            >
              <Sparkles className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
            </Button>
            <div className="absolute -top-12 right-0 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Ask AI Research Assistant
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Interface */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-6 right-6 z-50 w-[95vw] sm:w-[450px] h-[600px] max-h-[80vh]"
          >
            <Card className="h-full flex flex-col shadow-2xl border-slate-200">
              {/* Header */}
              <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-4 rounded-t-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">AI Research Assistant</h3>
                    <p className="text-xs text-teal-100 flex items-center gap-1">
                      <Database className="w-3 h-3" />
                      {papers.length} publications loaded
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-teal-100 rounded-2xl flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-teal-600" />
                    </div>
                    <h4 className="font-semibold text-slate-900 mb-2">Expert AI Research Assistant</h4>
                    <p className="text-sm text-slate-600 mb-4 max-w-xs mx-auto">
                      Ask me about trends, patterns, or specific findings from {papers.length} South African CECs publications.
                    </p>
                    <div className="space-y-2 text-left max-w-xs mx-auto">
                      <button
                        onClick={() => setInput("What are the main findings about PFAS in Gauteng?")}
                        className="w-full text-sm p-3 bg-white rounded-lg hover:bg-teal-50 text-slate-700 text-left border border-slate-200"
                      >
                        What are the main findings about PFAS in Gauteng?
                      </button>
                      <button
                        onClick={() => setInput("Compare wastewater contamination across provinces")}
                        className="w-full text-sm p-3 bg-white rounded-lg hover:bg-teal-50 text-slate-700 text-left border border-slate-200"
                      >
                        Compare wastewater contamination across provinces
                      </button>
                      <button
                        onClick={() => setInput("What temporal trends exist in CEC research?")}
                        className="w-full text-sm p-3 bg-white rounded-lg hover:bg-teal-50 text-slate-700 text-left border border-slate-200"
                      >
                        What temporal trends exist in CEC research?
                      </button>
                    </div>
                  </div>
                )}
                
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-teal-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-800'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <ReactMarkdown
                          className="prose prose-sm max-w-none prose-slate [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                            ul: ({ children }) => <ul className="my-2 ml-4 list-disc">{children}</ul>,
                            ol: ({ children }) => <ol className="my-2 ml-4 list-decimal">{children}</ol>,
                            li: ({ children }) => <li className="mb-1">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      ) : (
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Analyzing database...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-slate-200 bg-white rounded-b-lg">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about the research data..."
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}