import DatabaseService from './database';
import TraditionalPdfGenerator from './traditionalPdfGenerator';

class PedigreeExporter {
  static async exportToPDF(bird, commonAncestors = [], duplicateColors = new Map()) {
    try {
      // Get user settings for PDF generation
      const settings = await DatabaseService.getSettings();
      
      // Use traditional PDF generator that matches classic pedigree style
      const pdfGenerator = new TraditionalPdfGenerator();
      return await pdfGenerator.exportToFile(bird, commonAncestors, {
        loftName: settings.loftName || 'YOUR LOFT NAME',
        loftSlogan: settings.loftSlogan || 'The home of champion racing pigeons',
        loftPhone: settings.loftPhone || '',
        loftEmail: settings.loftEmail || '',
        breederName: settings.breederName || '',
        ...settings,
        duplicateColors // Pass the color mapping to the PDF generator
      });

    } catch (error) {
      console.error('Error exporting PDF:', error);
      throw error;
    }
  }
}

export default PedigreeExporter;
