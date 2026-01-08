import { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

export default function AuthorNetwork({ papers }) {
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  
  const { authorStats, collaborations } = useMemo(() => {
    const authorPapers = {};
    const coAuthors = {};
    
    papers.forEach(paper => {
      if (paper.authors && paper.authors.length > 0) {
        paper.authors.forEach(author => {
          if (!authorPapers[author]) {
            authorPapers[author] = [];
            coAuthors[author] = new Set();
          }
          authorPapers[author].push(paper);
          
          // Track co-authors
          paper.authors.forEach(otherAuthor => {
            if (author !== otherAuthor) {
              coAuthors[author].add(otherAuthor);
            }
          });
        });
      }
    });
    
    const stats = Object.entries(authorPapers)
      .map(([author, papers]) => ({
        author,
        paperCount: papers.length,
        collaborators: coAuthors[author].size,
        papers
      }))
      .sort((a, b) => b.paperCount - a.paperCount)
      .slice(0, 20);
    
    return { 
      authorStats: stats,
      collaborations: coAuthors
    };
  }, [papers]);

  if (authorStats.length === 0) {
    return null;
  }

  const handleAuthorClick = (authorData) => {
    setSelectedAuthor(selectedAuthor?.author === authorData.author ? null : authorData);
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="w-5 h-5 text-teal-600" />
          Author Collaboration Network
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {authorStats.map((authorData) => (
              <button
                key={authorData.author}
                onClick={() => handleAuthorClick(authorData)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  selectedAuthor?.author === authorData.author
                    ? 'border-teal-600 bg-teal-50'
                    : 'border-slate-200 hover:border-teal-300 bg-white'
                }`}
              >
                <p className="font-medium text-sm text-slate-900 truncate" title={authorData.author}>
                  {authorData.author}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-600">
                  <span>{authorData.paperCount} paper{authorData.paperCount !== 1 ? 's' : ''}</span>
                  <span>•</span>
                  <span>{authorData.collaborators} collaborator{authorData.collaborators !== 1 ? 's' : ''}</span>
                </div>
              </button>
            ))}
          </div>

          {selectedAuthor && (
            <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="font-semibold text-slate-900 mb-3">
                {selectedAuthor.author}'s Network
              </h4>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase mb-2">Publications</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedAuthor.papers.slice(0, 5).map((paper, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {paper.publication_year}
                      </Badge>
                    ))}
                    {selectedAuthor.papers.length > 5 && (
                      <Badge variant="secondary" className="text-xs">
                        +{selectedAuthor.papers.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
                
                {selectedAuthor.collaborators > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase mb-2">
                      Collaborators ({selectedAuthor.collaborators})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(collaborations[selectedAuthor.author])
                        .slice(0, 8)
                        .map((collaborator, idx) => (
                          <Badge key={idx} className="bg-teal-100 text-teal-800 text-xs">
                            {collaborator}
                          </Badge>
                        ))}
                      {selectedAuthor.collaborators > 8 && (
                        <Badge className="bg-teal-100 text-teal-800 text-xs">
                          +{selectedAuthor.collaborators - 8} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}