import { jsPDF } from 'jspdf';
import DatabaseService from './database';

class BrowserPdfGenerator {
  constructor() {
    // Page dimensions in mm (A4 landscape)
    this.PAGE_WIDTH = 297;
    this.PAGE_HEIGHT = 210;
    
    // Margins in mm
    this.MARGIN = 15;
    
    // Content area
    this.CONTENT_WIDTH = this.PAGE_WIDTH - (this.MARGIN * 2);
    this.CONTENT_HEIGHT = this.PAGE_HEIGHT - (this.MARGIN * 2);
    
    // Generation column widths
    this.GEN_WIDTHS = [0.28, 0.24, 0.24, 0.24];
    
    // Bird box dimensions
    this.BOX_HEIGHT = 40;
    this.BOX_PADDING = 3;
    
    // Colors (RGB arrays for jsPDF)
    this.COLORS = {
      black: [0, 0, 0],
      gray: [128, 128, 128],
      lightGray: [200, 200, 200],
      red: [214, 40, 40],
      lightRed: [255, 229, 224]
    };
  }

  async generatePedigree(bird, commonAncestors = [], settings = {}) {
    try {
      // Get full pedigree data
      const pedigreeData = await DatabaseService.getPedigree(bird.id, 4);
      
      // Create PDF document
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Draw content
      this.drawHeader(doc, settings, bird);
      this.drawPedigreeGrid(doc, pedigreeData, commonAncestors);
      this.drawFooter(doc, settings, commonAncestors.length > 0);
      
      return doc;
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  drawHeader(doc, settings, bird) {
    // Set title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.COLORS.black);
    
    const title = `Pedigree: ${bird.name}`;
    doc.text(title, this.PAGE_WIDTH / 2, 25, { align: 'center' });
    
    // Loft name if available
    if (settings.loftName) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text(settings.loftName, this.PAGE_WIDTH / 2, 35, { align: 'center' });
    }
    
    // Date
    const currentDate = new Date().toLocaleDateString();
    doc.setFontSize(10);
    doc.setTextColor(...this.COLORS.gray);
    doc.text(`Generated: ${currentDate}`, this.PAGE_WIDTH - this.MARGIN, 25, { align: 'right' });
    
    // Draw separator line
    doc.setDrawColor(...this.COLORS.lightGray);
    doc.setLineWidth(0.5);
    doc.line(this.MARGIN, 45, this.PAGE_WIDTH - this.MARGIN, 45);
  }

  drawPedigreeGrid(doc, pedigreeData, commonAncestors) {
    if (!pedigreeData || !pedigreeData.bird) return;

    // Organize birds by generation
    const generations = this.organizeBirdsByGeneration(pedigreeData);
    
    // Calculate positions
    const startY = 55;
    const gridHeight = this.PAGE_HEIGHT - startY - 30; // Leave space for footer
    
    // Draw generation labels
    let currentX = this.MARGIN;
    for (let gen = 0; gen < 4; gen++) {
      const colWidth = this.CONTENT_WIDTH * this.GEN_WIDTHS[gen];
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...this.COLORS.black);
      doc.text(`Generation ${gen + 1}`, currentX + colWidth/2, startY - 5, { align: 'center' });
      
      currentX += colWidth;
    }
    
    // Draw birds
    this.drawGenerationBirds(doc, generations, startY, gridHeight, commonAncestors);
    
    // Draw connection lines
    this.drawConnectionLines(doc, generations, startY, gridHeight);
  }

  organizeBirdsByGeneration(pedigreeData) {
    const generations = [[], [], [], []];
    
    // Generation 1: Main bird
    generations[0] = [pedigreeData.bird];
    
    // Generation 2: Parents
    if (pedigreeData.sire) generations[1].push(pedigreeData.sire);
    if (pedigreeData.dam) generations[1].push(pedigreeData.dam);
    
    // Generation 3: Grandparents
    if (pedigreeData.sire?.sire) generations[2].push(pedigreeData.sire.sire);
    if (pedigreeData.sire?.dam) generations[2].push(pedigreeData.sire.dam);
    if (pedigreeData.dam?.sire) generations[2].push(pedigreeData.dam.sire);
    if (pedigreeData.dam?.dam) generations[2].push(pedigreeData.dam.dam);
    
    // Generation 4: Great-grandparents
    const gen3Birds = generations[2];
    gen3Birds.forEach(bird => {
      if (bird?.sire) generations[3].push(bird.sire);
      if (bird?.dam) generations[3].push(bird.dam);
    });
    
    return generations;
  }

  drawGenerationBirds(doc, generations, startY, gridHeight, commonAncestors) {
    let currentX = this.MARGIN;
    
    for (let gen = 0; gen < 4; gen++) {
      const birds = generations[gen] || [];
      const colWidth = this.CONTENT_WIDTH * this.GEN_WIDTHS[gen];
      
      if (birds.length > 0) {
        const spacing = gridHeight / Math.max(birds.length, 1);
        
        birds.forEach((bird, index) => {
          if (bird) {
            const boxY = startY + (index * spacing);
            const isCommon = commonAncestors.includes(bird.id);
            this.drawBirdBox(doc, bird, currentX, boxY, colWidth - 5, this.BOX_HEIGHT, isCommon);
          }
        });
      }
      
      currentX += colWidth;
    }
  }

  drawBirdBox(doc, bird, x, y, width, height, isCommonAncestor = false) {
    // Draw box background and border
    if (isCommonAncestor) {
      doc.setFillColor(...this.COLORS.lightRed);
      doc.setDrawColor(...this.COLORS.red);
      doc.setLineWidth(1);
    } else {
      doc.setFillColor(245, 245, 245);
      doc.setDrawColor(...this.COLORS.lightGray);
      doc.setLineWidth(0.5);
    }
    
    doc.rect(x, y, width, height, 'FD'); // Fill and Draw
    
    // Add bird information
    let textY = y + 5;
    const textX = x + this.BOX_PADDING;
    const textWidth = width - (this.BOX_PADDING * 2);
    
    // Bird name
    if (bird.name) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...this.COLORS.black);
      doc.text(bird.name.toUpperCase(), textX, textY, { maxWidth: textWidth });
      textY += 6;
    }
    
    // Ring number
    if (bird.ring_number) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Ring: ${bird.ring_number}`, textX, textY, { maxWidth: textWidth });
      textY += 5;
    }
    
    // Color and breed
    const details = [bird.color, bird.breed].filter(Boolean).join(' / ');
    if (details) {
      doc.setFontSize(8);
      doc.setTextColor(...this.COLORS.gray);
      doc.text(details, textX, textY, { maxWidth: textWidth });
      textY += 4;
    }
    
    // Year (display as 2-digit format)
    if (bird.year || bird.hatch_year) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      const fullYear = bird.year || bird.hatch_year;
      const shortYear = fullYear.toString().slice(-2); // Get last 2 digits
      doc.text(shortYear, textX, textY, { maxWidth: textWidth });
    }
  }

  drawConnectionLines(doc, generations, startY, gridHeight) {
    doc.setDrawColor(...this.COLORS.gray);
    doc.setLineWidth(0.5);
    
    let currentX = this.MARGIN;
    
    for (let gen = 0; gen < 3; gen++) {
      const currentBirds = generations[gen] || [];
      const nextBirds = generations[gen + 1] || [];
      
      const currentColWidth = this.CONTENT_WIDTH * this.GEN_WIDTHS[gen];
      const nextColWidth = this.CONTENT_WIDTH * this.GEN_WIDTHS[gen + 1];
      
      if (currentBirds.length > 0 && nextBirds.length > 0) {
        const currentSpacing = gridHeight / Math.max(currentBirds.length, 1);
        const nextSpacing = gridHeight / Math.max(nextBirds.length, 1);
        
        // Draw lines from each bird to its parents
        currentBirds.forEach((bird, birdIndex) => {
          if (bird) {
            const birdY = startY + (birdIndex * currentSpacing) + this.BOX_HEIGHT / 2;
            const birdRightX = currentX + currentColWidth - 5;
            
            // Calculate parent indices based on generation and position
            const parentIndices = this.getParentIndices(gen, birdIndex);
            
            parentIndices.forEach(parentIndex => {
              if (parentIndex < nextBirds.length && nextBirds[parentIndex]) {
                const parentY = startY + (parentIndex * nextSpacing) + this.BOX_HEIGHT / 2;
                const parentLeftX = currentX + currentColWidth;
                
                // Draw horizontal line from bird
                doc.line(birdRightX, birdY, birdRightX + 5, birdY);
                // Draw line to parent
                doc.line(birdRightX + 5, birdY, parentLeftX, parentY);
              }
            });
          }
        });
      }
      
      currentX += currentColWidth;
    }
  }

  getParentIndices(generation, birdIndex) {
    if (generation === 0) {
      // Main bird's parents are at indices 0 (sire) and 1 (dam)
      return [0, 1];
    } else if (generation === 1) {
      // Each parent's parents
      return birdIndex === 0 ? [0, 1] : [2, 3];
    } else if (generation === 2) {
      // Each grandparent's parents
      return [birdIndex * 2, birdIndex * 2 + 1];
    }
    return [];
  }

  drawFooter(doc, settings, hasCommonAncestors) {
    const footerY = this.PAGE_HEIGHT - 15;
    
    // Copyright
    doc.setFontSize(8);
    doc.setTextColor(...this.COLORS.gray);
    doc.setFont('helvetica', 'normal');
    
    const copyright = settings.breederName ? 
      `© ${new Date().getFullYear()} ${settings.breederName}` : 
      `© ${new Date().getFullYear()}`;
    
    doc.text(copyright, this.MARGIN, footerY);
    
    // Generated with
    doc.text('Generated with Pigeon Pedigree Manager', this.PAGE_WIDTH - this.MARGIN, footerY, { align: 'right' });
    
    // Common ancestors legend
    if (hasCommonAncestors) {
      doc.setTextColor(...this.COLORS.red);
      doc.text('■ Red boxes indicate common ancestors', this.PAGE_WIDTH / 2, footerY, { align: 'center' });
    }
  }

  async exportToFile(bird, commonAncestors = [], settings = {}) {
    try {
      const doc = await this.generatePedigree(bird, commonAncestors, settings);
      
      // Generate filename
      const filename = `${bird.name || 'Pedigree'}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Download the PDF
      doc.save(filename);
      
      return 'PDF downloaded successfully';
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
      throw error;
    }
  }
}

export default BrowserPdfGenerator;
