import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  Paper,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  GetApp as ExportIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import DatabaseService from '../services/database';
import PedigreeExporter from '../services/pedigreeExporter';
import PedigreeTree from '../components/PedigreeTree';

const PedigreeView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [bird, setBird] = useState(null);
  const [commonAncestors, setCommonAncestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMode, setViewMode] = useState('view'); // 'view' or 'download'
  const [pedigreeData, setPedigreeData] = useState(null);

  useEffect(() => {
    if (id) {
      loadBirdData();
    }
  }, [id]);

  useEffect(() => {
    // Check if auto-export is requested
    if (searchParams.get('export') === 'pdf' && bird && !exporting) {
      handleExportPDF();
    }
  }, [searchParams, bird, exporting]);

  const loadBirdData = async () => {
    try {
      const [birdData, ancestorIds, pedigree] = await Promise.all([
        DatabaseService.getBirdById(id),
        DatabaseService.findCommonAncestors(id),
        DatabaseService.getPedigree(id, 5)
      ]);
      
      setBird(birdData);
      setCommonAncestors(ancestorIds);
      setPedigreeData(pedigree);
    } catch (error) {
      console.error('Error loading bird data:', error);
      setError('Error loading bird data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!bird) return;

    setExporting(true);
    setError('');
    setSuccess('');
    
    try {
      const ancestorIds = await DatabaseService.findCommonAncestors(id);
      const result = await PedigreeExporter.exportToPDF(bird, ancestorIds);
      setSuccess('PDF downloaded successfully!');
      
      // If this was an auto-export, navigate back after a short delay
      if (searchParams.get('export') === 'pdf') {
        setTimeout(() => {
          navigate(-1);
        }, 2000);
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      setError('Error generating PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // No view functionality needed - this component only handles PDF downloads

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading bird data...</Typography>
      </Box>
    );
  }

  if (!bird) {
    return (
      <Box textAlign="center" py={8}>
        <Typography variant="h6" color="text.secondary">
          Bird not found
        </Typography>
        <Button onClick={() => navigate('/birds')} sx={{ mt: 2 }}>
          Back to Birds
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          variant="outlined"
        >
          Back
        </Button>
        
        <Box display="flex" alignItems="center" gap={2}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newMode) => newMode && setViewMode(newMode)}
            size="small"
          >
            <ToggleButton value="view">
              <ViewIcon sx={{ mr: 1 }} />
              View
            </ToggleButton>
            <ToggleButton value="download">
              <ExportIcon sx={{ mr: 1 }} />
              Download
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Bird Info */}
      <Box mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          {bird.name || bird.ring_number || 'Unnamed Bird'}
        </Typography>
        {bird.ring_number && (
          <Typography variant="body1" color="text.secondary">
            Ring Details: {bird.ring_number}
          </Typography>
        )}
      </Box>

      {/* Status Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* View Mode: Pedigree Tree */}
      {viewMode === 'view' && (
        <>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Preview Only:</strong> This is a simplified preview. The downloadable PDF will show complete details, full formatting, and professional layout.
            </Typography>
          </Alert>
          <Paper elevation={2} sx={{ p: 3 }}>
            <PedigreeTree pedigreeData={pedigreeData} commonAncestors={commonAncestors} />
          </Paper>
        </>
      )}

      {/* Download Mode: PDF Generation */}
      {viewMode === 'download' && (
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center', maxWidth: 600, mx: 'auto' }}>
          <Typography variant="h5" component="h2" fontWeight="bold" mb={2}>
            Generate Pedigree PDF
          </Typography>

          {/* Common Ancestors Info */}
          {commonAncestors.length > 0 && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Common Ancestors:</strong> {commonAncestors.length} bird(s) appear multiple times in this pedigree and will be highlighted in the PDF.
              </Typography>
            </Alert>
          )}

          {/* PDF Generation */}
          <Box mb={3}>
            <Typography variant="body1" color="text.secondary" mb={2}>
              This will generate a professional 4-generation pedigree PDF with:
            </Typography>
            <Box component="ul" sx={{ textAlign: 'left', pl: 2, mb: 2 }}>
              <Typography component="li" variant="body2">Professional layout with your loft branding</Typography>
              <Typography component="li" variant="body2">Bird photos and detailed information</Typography>
              <Typography component="li" variant="body2">Vector graphics and connection lines</Typography>
              <Typography component="li" variant="body2">Common ancestor highlighting</Typography>
              <Typography component="li" variant="body2">High-quality print-ready format</Typography>
            </Box>
          </Box>

          {/* Export Button */}
          <Button
            variant="contained"
            size="large"
            startIcon={exporting ? <CircularProgress size={20} color="inherit" /> : <ExportIcon />}
            onClick={handleExportPDF}
            disabled={exporting}
            sx={{ minWidth: 200 }}
          >
            {exporting ? 'Generating PDF...' : 'Download Pedigree PDF'}
          </Button>

          {exporting && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Please wait while we generate your professional pedigree document...
            </Typography>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default PedigreeView;
