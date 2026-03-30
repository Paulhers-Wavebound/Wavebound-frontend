import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const BRAND_BLUE: [number, number, number] = [56, 128, 230];
const DARK_BG: [number, number, number] = [10, 10, 15];
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 20;

export function AdminPdfExport() {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const [{ default: jsPDF }, html2canvas] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const dateStr = format(new Date(), 'MMMM d, yyyy');
      const fileName = `Wavebound-Report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;

      const addPageBackground = () => {
        pdf.setFillColor(...DARK_BG);
        pdf.rect(0, 0, PAGE_W, PAGE_H, 'F');
      };

      const addWatermark = () => {
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(60);
        pdf.setGState(new (pdf as any).GState({ opacity: 0.03 }));
        pdf.text('WAVEBOUND', PAGE_W / 2, PAGE_H / 2, { align: 'center', angle: 45 });
        pdf.setGState(new (pdf as any).GState({ opacity: 1 }));
      };

      const addFooter = () => {
        pdf.setFontSize(7);
        pdf.setTextColor(120, 120, 130);
        pdf.text(`Generated ${dateStr} · Wavebound Confidential`, PAGE_W / 2, PAGE_H - 8, { align: 'center' });
      };

      const addPageExtras = () => {
        addWatermark();
        addFooter();
      };

      // ── Cover page ──
      addPageBackground();
      pdf.setTextColor(...BRAND_BLUE);
      pdf.setFontSize(36);
      pdf.text('WAVEBOUND', PAGE_W / 2, 100, { align: 'center' });
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.text('User Activity & Growth Report', PAGE_W / 2, 120, { align: 'center' });
      pdf.setFontSize(12);
      pdf.setTextColor(160, 160, 170);
      pdf.text(dateStr, PAGE_W / 2, 135, { align: 'center' });
      pdf.setFontSize(9);
      pdf.text('Confidential — For Investors & Partners', PAGE_W / 2, 148, { align: 'center' });
      addFooter();

      // ── Capture dashboard sections ──
      const sections = document.querySelectorAll('[data-pdf-section]');
      
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i] as HTMLElement;
        const title = section.getAttribute('data-pdf-section') || '';
        
        pdf.addPage();
        addPageBackground();
        addPageExtras();

        // Section title
        pdf.setTextColor(...BRAND_BLUE);
        pdf.setFontSize(14);
        pdf.text(title, MARGIN, MARGIN + 5);

        // Capture the section
        try {
          const canvas = await html2canvas.default(section, {
            backgroundColor: null,
            scale: 2,
            logging: false,
            useCORS: true,
          });
          
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = PAGE_W - MARGIN * 2;
          const imgHeight = (canvas.height / canvas.width) * imgWidth;
          const maxHeight = PAGE_H - MARGIN * 2 - 20;
          const finalHeight = Math.min(imgHeight, maxHeight);
          
          pdf.addImage(imgData, 'PNG', MARGIN, MARGIN + 12, imgWidth, finalHeight);
        } catch (e) {
          pdf.setTextColor(160, 160, 170);
          pdf.setFontSize(10);
          pdf.text('Could not capture this section', MARGIN, MARGIN + 25);
        }
      }

      pdf.save(fileName);
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
      {exporting ? (
        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
      ) : (
        <FileDown className="w-4 h-4 mr-1.5" />
      )}
      {exporting ? 'Exporting...' : 'Export PDF'}
    </Button>
  );
}
