import jsPDF from 'jspdf';
import DatabaseService from './database';

class TraditionalPdfGenerator {
  constructor() {
    // Page dimensions (A4 portrait)
    this.PAGE_WIDTH = 210;
    this.PAGE_HEIGHT = 297;
    this.MARGIN = 8; // reduced margin to maximize content area
    this.CONTENT_WIDTH = this.PAGE_WIDTH - (this.MARGIN * 2);
    this.CONTENT_HEIGHT = this.PAGE_HEIGHT - (this.MARGIN * 2);
    
    // Layout dimensions
    this.HEADER_HEIGHT = 0;  // no dedicated header box; we use a combined top panel
    this.MAIN_BIRD_HEIGHT = 50;  // Reduced from 80
    this.BIRD_BOX_HEIGHT = 30;  // Reduced from 35
    this.BIRD_BOX_WIDTH = 85;
    this.PHOTO_SIZE = 20;  // Reduced from 25
    
    // Colors (RGB arrays for jsPDF)
    this.COLORS = {
      black: [0, 0, 0],
      darkGray: [64, 64, 64],
      gray: [128, 128, 128],
      lightGray: [192, 192, 192],
      white: [255, 255, 255],
      blue: [0, 100, 200],
      lightBlue: [230, 240, 255]
    };
  }

  // Combined top panel with loft branding, compact subject details, and larger notes
  drawTopPanel(doc, bird, settings) {
    const x = this.MARGIN;
    const y = this.MARGIN;
    const w = this.CONTENT_WIDTH;
    const h = 30; // compact height to leave room for pedigree

    // Panel border
    doc.setDrawColor(...this.COLORS.black);
    doc.setLineWidth(0.5);
    doc.rect(x, y, w, h);

    const pad = 3;
    // Loft name centered on first line
    const loftName = (settings?.loftName || '').toString();
    if (loftName) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...this.COLORS.black);
      doc.text(loftName.toUpperCase(), x + w / 2, y + pad + 5, { align: 'center' });
    }
    if (settings?.loftSlogan) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(...this.COLORS.darkGray);
      doc.text(settings.loftSlogan, x + w / 2, y + pad + 10, { align: 'center' });
    }

    // Split inner area horizontally: left details (35%), right notes (65%)
    const innerTop = y + 13;
    const innerH = h - (innerTop - y) - pad;
    const detailsW = Math.floor(w * 0.35);
    const notesW = w - detailsW - pad; // pad as gutter between

    // Vertical divider centered in the gutter
    const dividerX = x + detailsW + pad / 2;
    doc.setDrawColor(...this.COLORS.lightGray);
    doc.setLineWidth(0.3);
    doc.line(dividerX, innerTop, dividerX, y + h - pad);
    doc.setDrawColor(...this.COLORS.black);
    doc.setLineWidth(0.5);

    // Subject details (compact)
    let tx = x + pad;
    let ty = innerTop + 3;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    // Get year from date_of_birth or year field
    let year = null;
    if (bird.date_of_birth) {
      const d = new Date(bird.date_of_birth);
      if (!isNaN(d.getTime())) year = d.getFullYear();
    }
    if (year == null && typeof bird.year !== 'undefined') year = bird.year;
    
    // Format ring number with year if available (year in 2-digit format)
    const shortYear = year ? String(year).slice(-2) : '';
    const ring = bird.ring_number ? `${bird.ring_number}${shortYear ? ' ' + shortYear : ''}` : '';
    const color = bird.color ? `Color: ${bird.color}` : null;
    const sex = bird.sex ? `Sex: ${bird.sex === 'male' ? 'Cock' : bird.sex === 'female' ? 'Hen' : bird.sex}` : null;
    const breed = bird.breed ? `Strain: ${bird.breed}` : null;
    
    const parts = [color, sex, breed].filter(Boolean);
    
    // Draw ring number with year (bold)
    if (ring) { 
      doc.setFont('helvetica', 'bold'); 
      doc.text(ring, tx, ty); 
      ty += 5; 
      doc.setFont('helvetica', 'normal'); 
    };
    
    // Draw other details
    if (parts.length) { 
      doc.text(parts.join(' | '), tx, ty); 
      ty += 5; 
    }
    // Contact line
    let contact = '';
    if (settings?.loftPhone) contact += `Tel: ${settings.loftPhone}`;
    if (settings?.loftEmail) contact += (contact ? ' | ' : '') + `eMail: ${settings.loftEmail}`;
    if (contact) { doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...this.COLORS.darkGray); doc.text(contact, tx, ty); }

    // Notes area (larger)
    const notesText = (settings?.notes || bird?.notes || '').toString();
    if (notesText) {
      const nx = x + detailsW + pad; // start of right-side notes area
      const ny = innerTop + 2;
      const maxWidth = notesW - pad;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...this.COLORS.darkGray);
      const wrapped = doc.splitTextToSize(notesText, maxWidth);
      doc.text(wrapped, nx, ny);
    }

    return h;
  }

  drawSubjectCard(doc, x, y, w, h, bird) {
    // Border
    doc.setDrawColor(...this.COLORS.black);
    doc.setLineWidth(0.5);
    doc.rect(x, y, w, h);

    // Left: identity lines
    const pad = 3;
    let tx = x + pad;
    let ty = y + pad + 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...this.COLORS.black);
    const idline = `(${bird.ring_number || ''})`;
    doc.text(idline, tx, ty);
    ty += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const color = bird.color ? `Color: ${bird.color}` : null;
    const sex = bird.sex ? `Sex: ${bird.sex === 'male' ? 'Cock' : bird.sex === 'female' ? 'Hen' : bird.sex}` : null;
    const breed = bird.breed ? `Strain: ${bird.breed}` : null;
    const parts = [color, sex, breed].filter(Boolean);
    if (parts.length) doc.text(parts.join(' | '), tx, ty);
  }

  async generatePedigree(bird, commonAncestors = [], settings = {}) {
    try {
      // Get full pedigree data
      const pedigreeData = await DatabaseService.getPedigree(bird.id, 5);

      // Create PDF document in portrait orientation
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      // Draw content
      const topPanelH = this.drawTopPanel(doc, bird, settings);
      this.drawGridLayout(doc, bird, pedigreeData, settings, commonAncestors, topPanelH);
      this.drawFooter(doc, settings);

      return doc;
    } catch (error) {
      console.error('Error generating traditional PDF:', error);
      throw error;
    }
  }

  drawHeader(doc, settings) {
    // Header border
    doc.setDrawColor(...this.COLORS.black);
    doc.setLineWidth(1);
    doc.rect(this.MARGIN, this.MARGIN, this.CONTENT_WIDTH, this.HEADER_HEIGHT);
    
    // Loft name (smaller, centered)
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.COLORS.black);
    const loftName = settings.loftName || 'YOUR LOFT NAME';
    doc.text(loftName.toUpperCase(), this.PAGE_WIDTH / 2, this.MARGIN + 8, { align: 'center' });
    
    // Tagline/slogan (smaller)
    if (settings.loftSlogan) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(settings.loftSlogan, this.PAGE_WIDTH / 2, this.MARGIN + 14, { align: 'center' });
    }
    
    // Contact information (compact)
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...this.COLORS.darkGray);
    
    let contactText = '';
    if (settings.loftPhone) contactText += `Tel: ${settings.loftPhone}`;
    if (settings.loftEmail) {
      if (contactText) contactText += ' | ';
      contactText += `eMail: ${settings.loftEmail}`;
    }
    if (contactText) {
      doc.text(contactText, this.PAGE_WIDTH / 2, this.MARGIN + 20, { align: 'center' });
    }
  }

  // Grid layout to match screenshot: 4 columns with hierarchical rows
  drawGridLayout(doc, bird, pedigreeData, settings, commonAncestors = [], topPanelH = 0) {
    console.log('=== PDF Generation Debug ===');
    console.log('commonAncestors received:', commonAncestors);
    console.log('commonAncestors types:', commonAncestors.map(id => typeof id));
    console.log('Main bird ID:', bird.id, 'type:', typeof bird.id);
    console.log('Duplicate colors:', settings.duplicateColors);
    console.log('=== PDF Generation Debug ===');
    console.log('commonAncestors received:', commonAncestors);
    console.log('commonAncestors types:', commonAncestors.map(id => typeof id));
    console.log('Main bird ID:', bird.id, 'type:', typeof bird.id);
    const startY = this.MARGIN; // header removed; top panel already drawn
    const gutter = 1;

    // Grid starts below the combined top panel
    const gridTop = startY + topPanelH + gutter;
    const footerReserve = 15;
    const gridHeight = this.PAGE_HEIGHT - gridTop - footerReserve;

    // Columns for parents->grandparents->great-grandparents (28/24/24/24)
    const totalGutters = gutter * 3;
    const widthNoGutters = this.CONTENT_WIDTH - totalGutters;
    const colW = [
      Math.round(widthNoGutters * 0.28),
      Math.round(widthNoGutters * 0.24),
      Math.round(widthNoGutters * 0.24),
      widthNoGutters - Math.round(widthNoGutters * 0.28) - Math.round(widthNoGutters * 0.24) - Math.round(widthNoGutters * 0.24)
    ];
    const colX = [
      this.MARGIN,
      this.MARGIN + colW[0] + gutter,
      this.MARGIN + colW[0] + gutter + colW[1] + gutter,
      this.MARGIN + colW[0] + gutter + colW[1] + gutter + colW[2] + gutter
    ];

    // Row heights: 2,4,8 blocks
    const h2 = gridHeight / 2;
    const h4 = gridHeight / 4;
    const h8 = gridHeight / 8;

    const sire = pedigreeData?.bird?.sire || null;
    const dam = pedigreeData?.bird?.dam || null;

    // Col 1: Parents
    this.drawPedigreeBox(doc, colX[0], gridTop, colW[0], h2, sire, null, commonAncestors, false, 1, settings);
    this.drawPedigreeBox(doc, colX[0], gridTop + h2, colW[0], h2, dam, null, commonAncestors, false, 1, settings);

    // Col 2: Grandparents
    const pgf = sire?.sire || null; // paternal grandfather
    const pgm = sire?.dam || null;  // paternal grandmother
    const mgf = dam?.sire || null;  // maternal grandfather
    const mgm = dam?.dam || null;   // maternal grandmother
    this.drawPedigreeBox(doc, colX[1], gridTop, colW[1], h4, pgf, null, commonAncestors, false, 2, settings);
    this.drawPedigreeBox(doc, colX[1], gridTop + h4, colW[1], h4, pgm, null, commonAncestors, false, 2, settings);
    this.drawPedigreeBox(doc, colX[1], gridTop + h4 * 2, colW[1], h4, mgf, null, commonAncestors, false, 2, settings);
    this.drawPedigreeBox(doc, colX[1], gridTop + h4 * 3, colW[1], h4, mgm, null, commonAncestors, false, 2, settings);

    // Col 3: Great-grandparents
    const gg = [
      pgf?.sire || null, pgf?.dam || null,
      pgm?.sire || null, pgm?.dam || null,
      mgf?.sire || null, mgf?.dam || null,
      mgm?.sire || null, mgm?.dam || null
    ];
    for (let i = 0; i < 8; i++) {
      const y = gridTop + h8 * i;
      this.drawPedigreeBox(doc, colX[2], y, colW[2], h8, gg[i] || null, null, commonAncestors, false, 3, settings);
    }

    // Col 4: Optionally extend to 5th generation if available (draw as 'No data' if missing)
    const ggg = gg.flatMap(b => [b?.sire || null, b?.dam || null]); // 16 entries
    const h16 = gridHeight / 16;
    for (let i = 0; i < 16; i++) {
      const y = gridTop + h16 * i;
      this.drawPedigreeBox(doc, colX[3], y, colW[3], h16, ggg[i] || null, null, commonAncestors, true, 4, settings);
    }
  }

  // Draw a single pedigree box (or 'No data') with colored header strip
  drawPedigreeBox(doc, x, y, w, h, bird, headerColorRGB = null, commonAncestors = [], isLastGeneration = false, generation = 1, settings = {}) {
    // Header strip
    const headerH = 6;
    if (bird) {
      // Draw the border first (behind everything)
      doc.setDrawColor(...this.COLORS.black);
      doc.setLineWidth(0.4);
      doc.rect(x, y, w, h);
      // Normalize IDs to numbers for comparison
      const birdId = typeof bird.id === 'string' ? parseInt(bird.id, 10) : bird.id;
      const normalizedAncestors = commonAncestors.map(id => typeof id === 'string' ? parseInt(id, 10) : id);
      const isCommonAncestor = birdId && normalizedAncestors.includes(birdId);
      
      // Get the highlight color from the duplicateColors map if available
      let headerColor = headerColorRGB || [235, 235, 235];
      
      if (isCommonAncestor) {
        // Check if we have a specific color for this duplicate group
        const duplicateInfo = settings.duplicateColors?.get(birdId);
        if (duplicateInfo) {
          // Extract RGB values from the color string (e.g., 'rgb(255,200,200)')
          const rgbMatch = duplicateInfo.color.match(/\d+/g);
          if (rgbMatch && rgbMatch.length >= 3) {
            headerColor = [
              parseInt(rgbMatch[0]),
              parseInt(rgbMatch[1]),
              parseInt(rgbMatch[2])
            ];
          } else {
            // Fallback to light green if color parsing fails
            headerColor = [144, 238, 144];
          }
          console.log(`Highlighting duplicate bird: ${bird.ring_number || bird.name} (ID: ${birdId}) with color`, headerColor);
        } else {
          // Fallback to light green if no specific color is set
          headerColor = [144, 238, 144];
        }
      }
      
      // Apply the header color (after border)
      doc.setFillColor(...headerColor);
      doc.rect(x, y, w, headerH, 'F');
      
      // Redraw the border on top of the filled area
      doc.setDrawColor(...this.COLORS.black);
      doc.setLineWidth(0.4);
      doc.rect(x, y, w, headerH);

      // Header text: Ring (left) and Year (right)
      let ring = bird.ring_number || '';
      let year = null;
      if (bird.date_of_birth) {
        const d = new Date(bird.date_of_birth);
        if (!isNaN(d.getTime())) year = d.getFullYear();
      }
      if (year == null && typeof bird.year !== 'undefined') year = bird.year;
      
      doc.setTextColor(...this.COLORS.black);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8); // Slightly smaller font for better fit
      
      // Format ring number to ensure space between letters and numbers
      if (ring) {
        // Add space between letters and numbers if not already present
        const match = ring.match(/^([A-Za-z]+)([0-9].*)$/);
        if (match && !ring.includes(' ')) {
          ring = `${match[1]} ${match[2]}`;
        }
        
        // Draw ring number (left-aligned)
        doc.text(ring, x + 2, y + headerH - 1.5);
      }
      
      // Draw year (right-aligned)
      if (year != null) {
        const shortYear = String(year).slice(-2);
        doc.text(shortYear, x + w - 4, y + headerH - 1.5, { align: 'right' });
      }
    } else {
      doc.setFillColor(...this.COLORS.lightGray);
      doc.rect(x, y, w, h, 'F');
      return;
    }

    // Text padding - keeping horizontal padding reduced, restoring vertical padding
    const pad = 2; // Horizontal padding (reduced from 4 to 2)
    const vpad = 4; // Vertical padding (restored to original value)
    let tx = x + pad;
    let ty = y + headerH + vpad; // Restored vertical padding

    doc.setTextColor(...this.COLORS.black);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    // Bird name (if available)
    if (bird.name) {
      doc.setFont('helvetica', 'bold');
      doc.text(bird.name, tx, ty, { maxWidth: w - pad * 2 });
      ty += 4;
      doc.setFont('helvetica', 'normal');
    }

    // Breed and Color for all generations
    const textWidth = w - (pad * 2); // Keep reduced horizontal padding
    if (bird.breed) { doc.text(`Strain: ${bird.breed}`, tx, ty, { maxWidth: textWidth }); ty += 4; } // Restored vertical spacing
    if (generation <= 2 && bird.color) { doc.text(`Color: ${bird.color}`, tx, ty, { maxWidth: textWidth }); ty += 4; } // Restored vertical spacing


    // Notes (wrap, with better space utilization)
    if (bird.notes && bird.notes.trim()) {
      const maxWidth = w - (pad * 2);
      const lineHeight = 3.0; // Further reduced line height to fit more text
      
      // Calculate available space - using the full height of the box
      // Reduced bottom padding from 2 to 1 to utilize more space
      const availableHeight = (y + h) - ty - 1;
      // Add 0.5 to maxLines to be more aggressive about fitting content
      const maxLines = Math.max(1, Math.ceil(availableHeight / lineHeight - 0.2));
      
      // Split text into lines that fit the width
      let lines = doc.splitTextToSize(bird.notes, maxWidth);
      
      // Set text style
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...this.COLORS.darkGray);
      
      // Draw as many complete lines as possible
      const linesToDraw = lines.slice(0, maxLines);
      
      // If we have more lines than can fit, process the last line
      if (lines.length > maxLines) {
        // Get the last line that will be displayed
        const lastLine = linesToDraw[maxLines - 1];
        const remainingText = lines.slice(maxLines).join(' ');
        const ellipsis = '...';
        
        // Try to append as much remaining text as possible to the last line
        let extendedLine = lastLine;
        let testLine = lastLine + ' ' + remainingText;
        
        // Find how much of the remaining text we can add
        while (testLine.length > lastLine.length) {
          if (doc.getTextWidth(testLine + ellipsis) <= maxWidth) {
            extendedLine = testLine + ellipsis;
            break;
          }
          testLine = testLine.slice(0, -1);
        }
        
        // If we couldn't add any text, just add ellipsis to the last line
        if (extendedLine === lastLine) {
          let truncated = lastLine;
          while (doc.getTextWidth(truncated + ellipsis) > maxWidth && truncated.length > 0) {
            truncated = truncated.slice(0, -1);
          }
          if (truncated.length > 0) {
            linesToDraw[maxLines - 1] = truncated + ellipsis;
          }
        } else {
          linesToDraw[maxLines - 1] = extendedLine;
        }
      }
      
      // Draw all lines that fit
      doc.text(linesToDraw, tx, ty, { maxWidth, lineHeight });
    }
  }

  drawNotesPanel(doc, x, y, w, h, text) {
    // Border
    doc.setDrawColor(...this.COLORS.black);
    doc.setLineWidth(0.4);
    doc.rect(x, y, w, h);

    // Title
    const pad = 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...this.COLORS.black);
    doc.text('Notes:', x + pad, y + pad + 2);

    // Content
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...this.COLORS.darkGray);
    const lines = doc.splitTextToSize(text, w - pad * 2);
    doc.text(lines, x + pad, y + pad + 8);
  }

  drawEmptyBirdBox(doc, x, y, label) {
    // Draw box border
    doc.setDrawColor(...this.COLORS.lightGray);
    doc.setLineWidth(0.5);
    doc.rect(x, y, this.BIRD_BOX_WIDTH, this.BIRD_BOX_HEIGHT);
    
    // Photo area (left side)
    const photoX = x + 2;
    const photoY = y + 2;
    doc.setFillColor(...this.COLORS.lightGray);
    doc.rect(photoX, photoY, this.PHOTO_SIZE, this.PHOTO_SIZE, 'F');
    
    // Empty bird label
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...this.COLORS.darkGray);
    const infoX = x + this.PHOTO_SIZE + 5;
    const infoY = y + this.BIRD_BOX_HEIGHT / 2 + 2;
    doc.text(label, infoX, infoY);
  }

  drawFooter(doc, settings) {
    const footerY = this.PAGE_HEIGHT - 10;
    
    // Footer line
    doc.setDrawColor(...this.COLORS.lightGray);
    doc.setLineWidth(0.5);
    doc.line(this.MARGIN, footerY - 5, this.PAGE_WIDTH - this.MARGIN, footerY - 5);
    
    // Left side - Copyright
    doc.setFontSize(8);
    doc.setTextColor(...this.COLORS.gray);
    doc.setFont('helvetica', 'normal');
    
    const copyright = settings.breederName ? 
      `Produced by ${settings.breederName}` : 
      'Produced by Pigeon Pedigree Manager';
    
    doc.text(copyright, this.MARGIN, footerY);
    
    // Right side - Loft name
    const rightText = `For: ${settings.loftName || 'YOUR LOFT'}`;
    doc.text(rightText, this.PAGE_WIDTH - this.MARGIN, footerY, { align: 'right' });
    
    // Center - Generation info
    const centerText = `www.YourPigeonLoft.com`;
    doc.text(centerText, this.PAGE_WIDTH / 2, footerY, { align: 'center' });
  }

  async exportToFile(bird, commonAncestors = [], settings = {}) {
    try {
      const doc = await this.generatePedigree(bird, commonAncestors, settings);
      
      // Generate filename
      const filename = `Pedigree_${bird.ring_number || bird.name || 'Unknown'}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Download the PDF
      doc.save(filename);
      
      return 'Traditional pedigree PDF downloaded successfully';
      
    } catch (error) {
      console.error('Error exporting traditional PDF:', error);
      throw error;
    }
  }
}

export default TraditionalPdfGenerator;
