import { jsPDF } from 'jspdf';
import DatabaseService from './database';

class ProfessionalPdfGenerator {
  constructor() {
    // Page dimensions in mm (jsPDF uses mm by default)
    this.A4_WIDTH = 297; // A4 landscape width
    this.A4_HEIGHT = 210; // A4 landscape height
    
    // Margins in mm
    this.MARGIN_TOP = 15;
    this.MARGIN_BOTTOM = 15;
    this.MARGIN_LEFT = 10;
    this.MARGIN_RIGHT = 10;
    
    // Header/Footer heights in mm
    this.HEADER_HEIGHT = 40;
    this.FOOTER_HEIGHT = 15;
    
    // Generation column widths (percentages)
    this.GEN_WIDTHS = [0.28, 0.24, 0.24, 0.24];
    
    // Bird box dimensions in mm
    this.BIRD_BOX_HEIGHT = 45;
    this.BIRD_BOX_PADDING = 4;
    this.PHOTO_SIZE = 35;
    this.CORNER_RADIUS = 3;
    
    // Colors (RGB values)
    this.COLORS = {
      border: [0, 0, 0],
      background: [245, 245, 245],
      commonAncestor: [214, 40, 40],
      commonAncestorBg: [255, 229, 224],
      line: [85, 85, 85],
      text: [0, 0, 0],
      lightText: [102, 102, 102]
    };
    
    // Font sizes in points
    this.FONTS = {
      loftName: 20,
      slogan: 12,
      date: 10,
      birdName: 12,
      ringNumber: 11,
      details: 10,
      notes: 9,
      footer: 8
    };
  }

  async generatePedigree(bird, commonAncestors = [], settings = {}) {
    try {
      // Get full pedigree data
      const pedigreeData = await DatabaseService.getPedigree(bird.id, 4);
      
      // Create PDF document in landscape orientation
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      if (commonAncestors.length > 0) {
        doc.commonAncestorsFound = true;
      }

      // Calculate content area
      this.contentWidth = this.A4_WIDTH - this.MARGIN_LEFT - this.MARGIN_RIGHT;
      this.contentHeight = this.A4_HEIGHT - this.MARGIN_TOP - this.MARGIN_BOTTOM - this.HEADER_HEIGHT - this.FOOTER_HEIGHT;
      this.contentStartY = this.MARGIN_TOP + this.HEADER_HEIGHT;
      
      // Draw header
      this.drawHeader(doc, settings);
      
      // Draw pedigree grid
      this.drawPedigreeGrid(doc, pedigreeData, commonAncestors);
      
      // Draw footer
      this.drawFooter(doc, settings, commonAncestors.length > 0);
      
      return doc;
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  drawHeader(doc, settings) {
    const headerY = this.MARGIN_TOP;
    const headerHeight = this.HEADER_HEIGHT;
    
    // Draw logo placeholder (left side)
    if (settings.loftLogo) {
      const logoSize = 35; // 35mm square
      const logoX = this.MARGIN_LEFT;
      const logoY = headerY + (headerHeight - logoSize) / 2;
      
      // Draw logo placeholder rectangle
      doc.setDrawColor(...this.COLORS.border);
      doc.setLineWidth(0.5);
      doc.rect(logoX, logoY, logoSize, logoSize);
      
      // Add placeholder text
      doc.setTextColor(...this.COLORS.lightText);
      doc.setFontSize(8);
      doc.text('LOGO', logoX + logoSize/2, logoY + logoSize/2, { align: 'center' });
    }
    
    // Draw loft name and slogan (center)
    const centerX = this.A4_WIDTH / 2;
    let textY = headerY + 15;
    
    if (settings.loftName) {
      doc.setTextColor(...this.COLORS.text);
      doc.setFontSize(this.FONTS.loftName);
      doc.setFont('helvetica', 'bold');
      doc.text(settings.loftName.toUpperCase(), centerX, textY, { align: 'center' });
      textY += 12;
    }
    
    if (settings.loftSlogan) {
      doc.setTextColor(...this.COLORS.text);
      doc.setFontSize(this.FONTS.slogan);
      doc.setFont('helvetica', 'italic');
      doc.text(settings.loftSlogan, centerX, textY, { align: 'center' });
    }
    
    // Draw creation date (right side)
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    doc.setTextColor(...this.COLORS.lightText);
    doc.setFontSize(this.FONTS.date);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${currentDate}`, this.A4_WIDTH - this.MARGIN_RIGHT, headerY + 15, { align: 'right' });
  }

  async drawPedigreeGrid(doc, pedigreeData, commonAncestors) {
    // Calculate column positions and widths
    const columns = this.GEN_WIDTHS.map((width, index) => {
      const x = this.MARGIN_LEFT + this.contentWidth * this.GEN_WIDTHS.slice(0, index).reduce((sum, w) => sum + w, 0);
      const w = this.contentWidth * width;
      return { x, width: w };
    });
    
    // Organize birds by generation
    const generations = this.organizeBirdsByGeneration(pedigreeData);
    
    // Calculate bird positions for each generation
    const birdPositions = this.calculateBirdPositions(generations, columns);
    
    // Draw connection lines first (behind boxes)
    this.drawConnectionLines(doc, birdPositions, generations);
    
    // Draw bird boxes
    for (let gen = 0; gen < 4; gen++) {
      const birds = generations[gen] || [];
      const positions = birdPositions[gen] || [];
      
      for (let i = 0; i < birds.length; i++) {
        const bird = birds[i];
        const position = positions[i];
        
        if (bird && position) {
          await this.drawBirdBox(doc, bird, position, commonAncestors.includes(bird.id));
        }
      }
    }
    
    // Draw generation labels
    this.drawGenerationLabels(doc, columns);
  }

  organizeBirdsByGeneration(pedigreeData) {
    const generations = [[], [], [], []];
    if (!pedigreeData || !pedigreeData.bird) return generations;

    generations[0] = [pedigreeData.bird];
    generations[1] = [pedigreeData.bird.sire, pedigreeData.bird.dam];
    generations[2] = [];
    generations[1].forEach(parent => {
        if (parent) {
            generations[2].push(parent.sire);
            generations[2].push(parent.dam);
        } else {
            generations[2].push(null, null);
        }
    });

    generations[3] = [];
    generations[2].forEach(grandparent => {
        if (grandparent) {
            generations[3].push(grandparent.sire);
            generations[3].push(grandparent.dam);
        } else {
            generations[3].push(null, null);
        }
    });

    return generations;
}

  calculateBirdPositions(generations, columns) {
    const positions = [];
    
    for (let gen = 0; gen < 4; gen++) {
      const birds = generations[gen] || [];
      const column = columns[gen];
      const genPositions = [];
      
      if (birds.length === 0) {
        positions.push(genPositions);
        continue;
      }
      
      // Calculate vertical spacing
      const availableHeight = this.contentHeight;
      const totalBoxHeight = birds.length * this.BIRD_BOX_HEIGHT;
      const spacing = Math.max(10, (availableHeight - totalBoxHeight) / (birds.length + 1));
      
      // Position each bird
      for (let i = 0; i < birds.length; i++) {
        const y = this.contentStartY + spacing + i * (this.BIRD_BOX_HEIGHT + spacing);
        genPositions.push({
          x: column.x,
          y: y,
          width: column.width - 10, // Small margin between columns
          height: this.BIRD_BOX_HEIGHT
        });
      }
      
      positions.push(genPositions);
    }
    
    return positions;
  }

  drawConnectionLines(doc, birdPositions, generations) {
    doc.strokeColor(this.COLORS.line)
       .lineWidth(0.75);
    
    // Draw lines between generations
    for (let gen = 0; gen < 3; gen++) {
      const currentPositions = birdPositions[gen] || [];
      const nextPositions = birdPositions[gen + 1] || [];
      
      // Connect each bird to its parents
      currentPositions.forEach((childPos, childIndex) => {
        const bird = generations[gen][childIndex];
        if (!bird) return;
        
        // Find parent positions
        const parentIndices = this.getParentIndices(gen, childIndex);
        
        parentIndices.forEach(parentIndex => {
          const parentPos = nextPositions[parentIndex];
          if (parentPos) {
            // Draw horizontal line from child to parent
            const childCenterY = childPos.y + childPos.height / 2;
            const parentCenterY = parentPos.y + parentPos.height / 2;
            const childRightX = childPos.x + childPos.width;
            const parentLeftX = parentPos.x;
            
            // Horizontal line from child
            doc.moveTo(childRightX, childCenterY)
               .lineTo(childRightX + 15, childCenterY);
            
            // Vertical connector
            doc.moveTo(childRightX + 15, childCenterY)
               .lineTo(childRightX + 15, parentCenterY);
            
            // Horizontal line to parent
            doc.moveTo(childRightX + 15, parentCenterY)
               .lineTo(parentLeftX, parentCenterY);
            
            doc.stroke();
          }
        });
      });
    }
  }

  getParentIndices(generation, birdIndex) {
    // Calculate which birds in the next generation are parents of the current bird
    const indices = [];
    
    if (generation === 0) {
      // Main bird's parents are at indices 0 (sire) and 1 (dam)
      indices.push(0, 1);
    } else if (generation === 1) {
      // Each parent's parents
      if (birdIndex === 0) { // Sire
        indices.push(0, 1); // Sire's parents
      } else if (birdIndex === 1) { // Dam
        indices.push(2, 3); // Dam's parents
      }
    } else if (generation === 2) {
      // Each grandparent's parents
      indices.push(birdIndex * 2, birdIndex * 2 + 1);
    }
    
    return indices;
  }

  async drawBirdBox(doc, bird, position, isCommonAncestor = false) {
    const { x, y, width, height } = position;
    
    // Determine box styling
    const borderColor = isCommonAncestor ? this.COLORS.commonAncestor : this.COLORS.border;
    const borderWidth = isCommonAncestor ? 2 : 1;
    const fillColor = isCommonAncestor ? this.COLORS.commonAncestorBg : this.COLORS.background;
    
    // Draw rounded rectangle background
    doc.roundedRect(x, y, width, height, this.CORNER_RADIUS)
       .fillColor(fillColor)
       .fill()
       .strokeColor(borderColor)
       .lineWidth(borderWidth)
       .stroke();
    
    // Calculate content areas
    const contentX = x + this.BIRD_BOX_PADDING;
    const contentY = y + this.BIRD_BOX_PADDING;
    const contentWidth = width - (this.BIRD_BOX_PADDING * 2);
    
    // Draw photo frames (top section)
    const photoY = contentY;
    const photoSpacing = 5;
    const photoFrameWidth = (contentWidth - photoSpacing) / 2;
    const photoFrameHeight = Math.min(photoFrameWidth, this.PHOTO_SIZE);
    
    // Full body photo frame
    doc.rect(contentX, photoY, photoFrameWidth, photoFrameHeight)
       .strokeColor(this.COLORS.border)
       .lineWidth(0.5)
       .stroke();
    
    // Eye photo frame
    doc.rect(contentX + photoFrameWidth + photoSpacing, photoY, photoFrameWidth, photoFrameHeight)
       .strokeColor(this.COLORS.border)
       .lineWidth(0.5)
       .stroke();
    
    // Add photo placeholders
    doc.fontSize(8)
       .fillColor(this.COLORS.lightText)
       .font('Regular')
       .text('Full Body', contentX + 2, photoY + photoFrameHeight/2 - 4, {
         width: photoFrameWidth - 4,
         align: 'center'
       })
       .text('Eye', contentX + photoFrameWidth + photoSpacing + 2, photoY + photoFrameHeight/2 - 4, {
         width: photoFrameWidth - 4,
         align: 'center'
       });
    
    // Draw text information (middle section)
    let textY = photoY + photoFrameHeight + 10;
    
    // Bird name
    if (bird.name) {
      doc.fontSize(this.FONTS.birdName)
         .fillColor(this.COLORS.text)
         .font('Bold')
         .text(bird.name.toUpperCase(), contentX, textY, {
           width: contentWidth,
           align: 'left'
         });
      textY += 15;
    }
    
    // Ring number
    if (bird.ringNumber) {
      doc.fontSize(this.FONTS.ringNumber)
         .fillColor(this.COLORS.text)
         .font('Regular')
         .text(bird.ringNumber, contentX, textY, {
           width: contentWidth,
           align: 'left'
         });
      textY += 12;
    }
    
    // Color and breed
    const colorBreed = [bird.color, bird.breed].filter(Boolean).join(' / ');
    if (colorBreed) {
      doc.fontSize(this.FONTS.details)
         .fillColor(this.COLORS.text)
         .font('Regular')
         .text(colorBreed, contentX, textY, {
           width: contentWidth,
           align: 'left'
         });
      textY += 11;
    }
    
    // Year (display as 2-digit format)
    if (bird.hatchYear) {
      const shortYear = bird.hatchYear.toString().slice(-2); // Get last 2 digits
      doc.fontSize(this.FONTS.details)
         .fillColor(this.COLORS.text)
         .font('Italic')
         .text(shortYear, contentX, textY, {
           width: contentWidth,
           align: 'left'
         });
      textY += 11;
    }
    
    // Notes (bottom section)
    if (bird.notes && textY < y + height - this.BIRD_BOX_PADDING - 15) {
      const notesText = bird.notes.length > 50 ? bird.notes.substring(0, 47) + '...' : bird.notes;
      doc.fontSize(this.FONTS.notes)
         .fillColor(this.COLORS.lightText)
         .font('Italic')
         .text(notesText, contentX, textY, {
           width: contentWidth,
           align: 'left'
         });
    }
  }

  drawGenerationLabels(doc, columns) {
    const labelY = this.contentStartY - 20;
    
    const labels = ['Generation 1', 'Generation 2', 'Generation 3', 'Generation 4'];
    
    columns.forEach((column, index) => {
      doc.fontSize(10)
         .fillColor(this.COLORS.text)
         .font('Bold')
         .text(labels[index], column.x, labelY, {
           width: column.width,
           align: 'center'
         });
    });
  }

  drawFooter(doc, settings) {
    const footerY = this.A4_HEIGHT - this.MARGIN_BOTTOM - this.FOOTER_HEIGHT;
    
    // Copyright and breeder name (left)
    const copyrightText = settings.breederName ? 
      `© ${new Date().getFullYear()} ${settings.breederName}` : 
      `© ${new Date().getFullYear()}`;
    
    doc.fontSize(this.FONTS.footer)
       .fillColor(this.COLORS.lightText)
       .font('Regular')
       .text(copyrightText, this.MARGIN_LEFT, footerY, {
         width: this.contentWidth / 2,
         align: 'left'
       });
    
    // Generated with text (right)
    doc.text('Generated with Pigeon Pedigree Manager', this.MARGIN_LEFT + this.contentWidth / 2, footerY, {
      width: this.contentWidth / 2,
      align: 'right'
    });
    
    // Common ancestors legend
    if (doc.commonAncestorsFound) {
      doc.fontSize(this.FONTS.footer)
         .fillColor(this.COLORS.commonAncestor)
         .font('Regular')
         .text('■ Highlighted boxes indicate common ancestors', this.MARGIN_LEFT, footerY + 12, {
           width: this.contentWidth,
           align: 'center'
         });
    }
  }

  async exportToFile(bird, commonAncestors = [], settings = {}) {
    try {
      const doc = await this.generatePedigree(bird, commonAncestors, settings);
      
      // Create blob for download
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      
      return new Promise((resolve, reject) => {
        doc.on('end', () => {
          const blob = new Blob(chunks, { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          
          // Create download link
          const link = document.createElement('a');
          link.href = url;
          link.download = `${bird.name || 'Pedigree'}_${new Date().toISOString().split('T')[0]}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          URL.revokeObjectURL(url);
          resolve('PDF downloaded successfully');
        });
        
        doc.on('error', reject);
        doc.end();
      });
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
      throw error;
    }
  }
}

export default ProfessionalPdfGenerator;
