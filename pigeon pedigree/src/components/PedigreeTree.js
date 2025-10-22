import React, { useState } from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';

const PedigreeTree = ({ pedigreeData, commonAncestors = [] }) => {
  const [selectedBird, setSelectedBird] = useState(null);

  if (!pedigreeData || !pedigreeData.bird) {
    return (
      <Box textAlign="center" py={4}>
        <Typography color="text.secondary">No pedigree data available</Typography>
      </Box>
    );
  }

  // Normalize common ancestor IDs to numbers for consistent comparison
  const normalizedCommonAncestors = commonAncestors.map(id => 
    typeof id === 'string' ? parseInt(id, 10) : id
  );

  const BirdBox = ({ bird, isCommon = false }) => {
    if (!bird) {
      return (
        <Paper
          elevation={1}
          sx={{
            p: 1.5,
            height: '100%',
            minHeight: 80,
            bgcolor: 'grey.100',
            border: '1px dashed',
            borderColor: 'grey.300'
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Unknown
          </Typography>
        </Paper>
      );
    }

    const displayName = (/^bird\s+\d+$/i.test((bird.name || '').trim()) ? '' : bird.name) || bird.ring_number || 'Unnamed';
    const isSelected = selectedBird === bird.id;

    return (
      <Paper
        elevation={2}
        onClick={() => setSelectedBird(bird.id)}
        sx={{
          p: 1.5,
          height: '100%',
          minHeight: 80,
          bgcolor: isCommon ? 'error.lighter' : 'background.paper',
          border: '2px solid',
          borderColor: isSelected
            ? 'primary.main'
            : isCommon
            ? 'error.main'
            : 'grey.300',
          '&:hover': {
            elevation: 4,
            borderColor: isSelected
              ? 'primary.dark'
              : isCommon
              ? 'error.dark'
              : 'primary.main'
          }
        }}
      >
        <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
          <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.85rem' }}>
            {displayName}
          </Typography>
        </Box>
        
        {bird.ring_number && (
          <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            {bird.ring_number}
          </Typography>
        )}
        
        {(bird.color || bird.breed) && (
          <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            {[bird.color, bird.breed].filter(Boolean).join(' / ')}
          </Typography>
        )}
        
        {bird.year && (
          <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            {bird.year}
          </Typography>
        )}
      </Paper>
    );
  };

  const mainBird = pedigreeData.bird;
  
  // Debug logging
  console.log('PedigreeTree - mainBird:', mainBird);
  console.log('PedigreeTree - mainBird.sire:', mainBird?.sire);
  console.log('PedigreeTree - mainBird.dam:', mainBird?.dam);
  
  // Keep null values to maintain proper positioning
  const generations = [
    [mainBird],
    [mainBird?.sire || null, mainBird?.dam || null],
    [
      mainBird?.sire?.sire || null,
      mainBird?.sire?.dam || null,
      mainBird?.dam?.sire || null,
      mainBird?.dam?.dam || null
    ],
    [
      mainBird?.sire?.sire?.sire || null,
      mainBird?.sire?.sire?.dam || null,
      mainBird?.sire?.dam?.sire || null,
      mainBird?.sire?.dam?.dam || null,
      mainBird?.dam?.sire?.sire || null,
      mainBird?.dam?.sire?.dam || null,
      mainBird?.dam?.dam?.sire || null,
      mainBird?.dam?.dam?.dam || null
    ],
    [
      mainBird?.sire?.sire?.sire?.sire || null,
      mainBird?.sire?.sire?.sire?.dam || null,
      mainBird?.sire?.sire?.dam?.sire || null,
      mainBird?.sire?.sire?.dam?.dam || null,
      mainBird?.sire?.dam?.sire?.sire || null,
      mainBird?.sire?.dam?.sire?.dam || null,
      mainBird?.sire?.dam?.dam?.sire || null,
      mainBird?.sire?.dam?.dam?.dam || null,
      mainBird?.dam?.sire?.sire?.sire || null,
      mainBird?.dam?.sire?.sire?.dam || null,
      mainBird?.dam?.sire?.dam?.sire || null,
      mainBird?.dam?.sire?.dam?.dam || null,
      mainBird?.dam?.dam?.sire?.sire || null,
      mainBird?.dam?.dam?.sire?.dam || null,
      mainBird?.dam?.dam?.dam?.sire || null,
      mainBird?.dam?.dam?.dam?.dam || null
    ]
  ];
  
  console.log('PedigreeTree - generations:', generations);

  return (
    <Box sx={{ overflowX: 'auto', pb: 2 }}>
      {/* Legend */}
      {normalizedCommonAncestors.length > 0 && (
        <Box mb={2} display="flex" alignItems="center" gap={1}>
          <Chip
            label="Common Ancestors"
            size="small"
            sx={{ bgcolor: 'error.lighter', borderColor: 'error.main', border: '2px solid' }}
          />
          <Typography variant="caption" color="text.secondary">
            {normalizedCommonAncestors.length} bird(s) appear multiple times in this pedigree
          </Typography>
        </Box>
      )}

      {/* Pedigree Grid */}
      <Box display="flex" gap={2} minWidth="max-content">
        {/* Generation 1 - Main Bird */}
        <Box sx={{ width: 250 }}>
          <Typography variant="caption" fontWeight="bold" display="block" mb={1} color="primary">
            Generation 1
          </Typography>
          <Box display="flex" flexDirection="column" justifyContent="center" height="calc(100% - 24px)">
            <BirdBox
              bird={generations[0][0]}
              isCommon={normalizedCommonAncestors.includes(typeof generations[0][0]?.id === 'string' ? parseInt(generations[0][0].id, 10) : generations[0][0]?.id)}
            />
          </Box>
        </Box>

        {/* Generation 2 - Parents */}
        <Box sx={{ width: 220 }}>
          <Typography variant="caption" fontWeight="bold" display="block" mb={1} color="primary">
            Generation 2
          </Typography>
          <Box display="flex" flexDirection="column" gap={2} height="calc(100% - 24px)">
            {[0, 1].map(i => (
              <BirdBox
                key={i}
                bird={generations[1][i]}
                isCommon={normalizedCommonAncestors.includes(typeof generations[1][i]?.id === 'string' ? parseInt(generations[1][i].id, 10) : generations[1][i]?.id)}
              />
            ))}
          </Box>
        </Box>

        {/* Generation 3 - Grandparents */}
        <Box sx={{ width: 200 }}>
          <Typography variant="caption" fontWeight="bold" display="block" mb={1 } color="primary">
            Generation 3
          </Typography>
          <Box display="flex" flexDirection="column" gap={1} height="calc(100% - 24px)">
            {[0, 1, 2, 3].map(i => (
              <BirdBox
                key={i}
                bird={generations[2][i]}
                isCommon={normalizedCommonAncestors.includes(typeof generations[2][i]?.id === 'string' ? parseInt(generations[2][i].id, 10) : generations[2][i]?.id)}
              />
            ))}
          </Box>
        </Box>

        {/* Generation 4 - Great-grandparents */}
        <Box sx={{ width: 170 }}>
          <Typography variant="caption" fontWeight="bold" display="block" mb={1} color="primary">
            Generation 4
          </Typography>
          <Box display="flex" flexDirection="column" gap={0.5} height="calc(100% - 24px)">
            {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
              <BirdBox
                key={i}
                bird={generations[3][i]}
                isCommon={normalizedCommonAncestors.includes(typeof generations[3][i]?.id === 'string' ? parseInt(generations[3][i].id, 10) : generations[3][i]?.id)}
              />
            ))}
          </Box>
        </Box>

        {/* Generation 5 - Great-great-grandparents */}
        <Box sx={{ width: 160 }}>
          <Typography variant="caption" fontWeight="bold" display="block" mb={1} color="primary">
            Generation 5
          </Typography>
          <Box display="flex" flexDirection="column" gap={0.25} height="calc(100% - 24px)">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(i => (
              <BirdBox
                key={i}
                bird={generations[4][i]}
                isCommon={normalizedCommonAncestors.includes(typeof generations[4][i]?.id === 'string' ? parseInt(generations[4][i].id, 10) : generations[4][i]?.id)}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default PedigreeTree;
