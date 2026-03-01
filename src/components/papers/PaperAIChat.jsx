import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, Loader2, Bot, User } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import VoiceInput from "@/components/voice/VoiceInput";
import TextToSpeech from "@/components/voice/TextToSpeech";

const QUICK_PROMPTS = [
  { label: "Summarize Key Findings", prompt: "Please provide a comprehensive summary of the key findings from this research paper." },
  { label: "Methodology Overview", prompt: "Explain the research methodology used in this study in detail." },
  { label: "Research Gaps", prompt: "Based on this paper's content and findings, what are the potential research gaps and future research directions in PFAS research for South Africa?" },
  { label: "PFAS Compounds Analysis", prompt: "Provide detailed information about the PFAS compounds studied in this paper and their significance." },
  { label: "Environmental Impact", prompt: "What are the environmental and health implications of the findings from this research?" },
];

export default function PaperAIChat({ paper }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const buildPaperContext = () => {
    const hasFullContent = !!paper.markdown_content;

    const baseDetails = `Title: ${paper.title}
Authors: ${paper.authors?.join(", ")}
Publication Year: ${paper.publication_year}
Journal: ${paper.journal || "Not specified"}
DOI: ${paper.doi || "Not specified"}
Province: ${paper.province || "Not specified"}
Study Location: ${paper.study_location || "Not specified"}
Research Type: ${paper.research_type || "Not specified"}
PFAS Compounds Studied: ${paper.pfas_compounds?.join(", ") || "Not specified"}
Sample Matrix: ${paper.sample_matrix?.join(", ") || "Not specified"}
Institution: ${paper.institution || "Not specified"}
Keywords: ${paper.keywords?.join(", ") || "Not specified"}`;

    const contentSection = hasFullContent
      ? `\n\n--- FULL PAPER CONTENT (Markdown) ---\n${paper.markdown_content}`
      : `\n\nAbstract:\n${paper.abstract || "Not available"}\n\nKey Findings:\n${paper.key_findings || "Not available"}\n\nConcentrations Reported:\n${paper.concentrations_reported || "Not available"}`;

    return `You are an AI research assistant specialized in PFAS research, helping users understand a specific research paper.

Paper Details:
${baseDetails}${contentSection}

Your Capabilities:
1. Summarize the paper's key findings and methodology
2. Explain the significance of PFAS compounds studied
3. Identify potential research gaps and future research directions
4. Analyze environmental and health implications
5. Compare methodologies with standard PFAS research practices
6. Provide context about South African PFAS research landscape

Guidelines:
- Provide detailed, scientific explanations based on the paper's content
- When identifying research gaps, consider what's missing or what follow-up studies could explore
- For methodology questions, explain sampling, analysis techniques, and study design
- If information is not available in the paper details, clearly state that
- Be analytical and educational, helping researchers understand the broader context`;
  };

  const handleSend = async (message = input) => {
    if (!message.trim() || isLoading) return;

    const userMessage = { role: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${buildPaperContext()}

User Question: ${message}

Please provide a detailed, helpful response based on this specific research paper. Be comprehensive and analytical.`,
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt) => {
    setInput(prompt);
    handleSend(prompt);
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100/50 border-b border-teal-200">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-teal-600" />
          Ask AI About This Paper
        </CardTitle>
        <p className="text-sm text-slate-600 mt-1">
          Get detailed insights and answers about this specific research paper
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {/* Messages */}
        <div className="h-[400px] overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-4">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-teal-200 rounded-xl flex items-center justify-center mb-3">
                <Bot className="w-6 h-6 text-teal-600" />
              </div>
              <p className="text-sm text-slate-600 max-w-md text-center mb-4">
                I can help you analyze this paper. Try these quick actions:
              </p>
              <div className="grid grid-cols-1 gap-2 w-full max-w-md">
                {QUICK_PROMPTS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickPrompt(item.prompt)}
                    className="text-left px-4 py-2.5 bg-white border border-slate-200 rounded-lg hover:border-teal-500 hover:bg-teal-50/50 transition-all text-sm text-slate-700 font-medium"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, idx) => (
                <div key={idx} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-sm flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="max-w-[80%]">
                    <div className={`rounded-2xl px-4 py-2.5 ${
                      message.role === 'user' 
                        ? 'bg-slate-800 text-white' 
                        : 'bg-white border border-slate-200'
                    }`}>
                      {message.role === 'user' ? (
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      ) : (
                        <ReactMarkdown className="text-sm prose prose-sm prose-slate max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                          {message.content}
                        </ReactMarkdown>
                      )}
                    </div>
                    {message.role === 'assistant' && (
                      <div className="mt-1 flex justify-start">
                        <TextToSpeech text={message.content} />
                      </div>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-sm">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5">
                    <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-slate-200">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about methodology, findings, PFAS compounds..."
              className="resize-none"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isLoading}
            />
            <div className="flex flex-col gap-2">
              <VoiceInput 
                onTranscript={(text) => setInput(prev => prev + (prev ? ' ' : '') + text)}
                disabled={isLoading}
              />
              <Button 
                onClick={handleSend} 
                disabled={!input.trim() || isLoading}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}