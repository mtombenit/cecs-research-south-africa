import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { useState } from "react";
import jsPDF from "jspdf";

export default function ExportArticleListPDF({ papers }) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = () => {
    setIsExporting(true);
    
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;
      const margin = 15;
      const lineHeight = 6;
      let yPosition = 20;

      // Title
      pdf.setFontSize(18);
      pdf.setFont(undefined, "bold");
      pdf.text("South African CECs Research Articles", margin, yPosition);
      yPosition += 10;

      // Subtitle
      pdf.setFontSize(10);
      pdf.setFont(undefined, "normal");
      pdf.text(`Complete list of ${papers.length} research papers`, margin, yPosition);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPosition + 5);
      yPosition += 15;

      // Group papers by year
      const groupedPapers = papers.reduce((acc, paper, index) => {
        const year = paper.publication_year || 'Unknown';
        if (!acc[year]) {
          acc[year] = [];
        }
        acc[year].push({ ...paper, globalIndex: index });
        return acc;
      }, {});

      const sortedYears = Object.keys(groupedPapers).sort((a, b) => {
        if (a === 'Unknown') return 1;
        if (b === 'Unknown') return -1;
        return a - b;
      });

      // Iterate through years and papers
      sortedYears.forEach((year, yearIndex) => {
        // Check if we need a new page for year header
        if (yPosition > pdf.internal.pageSize.height - 30) {
          pdf.addPage();
          yPosition = 20;
        }

        // Year header
        pdf.setFontSize(14);
        pdf.setFont(undefined, "bold");
        pdf.setTextColor(20, 184, 166); // teal-600
        pdf.text(year.toString(), margin, yPosition);
        yPosition += 8;

        // Draw line under year
        pdf.setDrawColor(204, 204, 204);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 6;

        groupedPapers[year].forEach((paper) => {
          // Check if we need a new page
          if (yPosition > pdf.internal.pageSize.height - 40) {
            pdf.addPage();
            yPosition = 20;
          }

          // Paper number
          pdf.setFontSize(9);
          pdf.setFont(undefined, "normal");
          pdf.setTextColor(100, 100, 100);
          pdf.text(`${paper.globalIndex + 1}.`, margin, yPosition);

          // Paper title
          pdf.setFontSize(10);
          pdf.setFont(undefined, "bold");
          pdf.setTextColor(20, 83, 109); // teal-700
          const titleLines = pdf.splitTextToSize(paper.title, pageWidth - margin * 2 - 10);
          pdf.text(titleLines, margin + 10, yPosition);
          yPosition += titleLines.length * lineHeight;

          // Authors
          if (paper.authors && paper.authors.length > 0) {
            pdf.setFontSize(9);
            pdf.setFont(undefined, "normal");
            pdf.setTextColor(80, 80, 80);
            const authorsText = paper.authors.join(', ');
            const authorLines = pdf.splitTextToSize(authorsText, pageWidth - margin * 2 - 10);
            pdf.text(authorLines, margin + 10, yPosition);
            yPosition += authorLines.length * 4;
          }

          // Journal
          if (paper.journal) {
            pdf.setFontSize(8);
            pdf.setTextColor(120, 120, 120);
            const journalLines = pdf.splitTextToSize(paper.journal, pageWidth - margin * 2 - 10);
            pdf.text(journalLines, margin + 10, yPosition);
            yPosition += journalLines.length * 4;
          }

          yPosition += 4; // Space between papers
        });

        yPosition += 4; // Extra space between years
      });

      // Save the PDF
      pdf.save(`SA-CECs-Research-Articles-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={exportToPDF}
      disabled={isExporting || !papers || papers.length === 0}
      className="bg-teal-600 hover:bg-teal-700"
    >
      {isExporting ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Generating PDF...
        </>
      ) : (
        <>
          <FileDown className="w-4 h-4 mr-2" />
          Export to PDF
        </>
      )}
    </Button>
  );
}