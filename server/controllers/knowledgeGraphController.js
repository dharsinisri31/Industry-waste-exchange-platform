const KnowledgeGraph = require('../models/KnowledgeGraph');

const getKnowledgeGraph = async (req, res) => {
  try {
    let relations = await KnowledgeGraph.find();
    if (!relations || relations.length === 0) {
      // Return default industrial circular graph nodes & edges
      return res.status(200).json({
        nodes: [
          { id: 'ind_1', label: 'Thermal Power Plant', type: 'Industry' },
          { id: 'waste_1', label: 'Fly Ash Scrap', type: 'Waste' },
          { id: 'mat_1', label: 'Silico-Aluminous Mineral', type: 'Material' },
          { id: 'ind_2', label: 'Cement Manufacturing Plant', type: 'Industry' },
          { id: 'res_1', label: 'Green Pozzolanic Cement', type: 'Resource' },
          { id: 'ind_3', label: 'Petrochemical Industry', type: 'Industry' },
          { id: 'waste_2', label: 'PET Industrial Scrap', type: 'Waste' },
          { id: 'mat_2', label: 'Polyethylene Terephthalate', type: 'Material' },
          { id: 'ind_4', label: 'Textile Fiber Plant', type: 'Industry' }
        ],
        edges: [
          { source: 'ind_1', target: 'waste_1', label: 'produces' },
          { source: 'waste_1', target: 'mat_1', label: 'contains' },
          { source: 'mat_1', target: 'ind_2', label: 'can_be_used_by' },
          { source: 'ind_2', target: 'res_1', label: 'can_be_processed_into' },
          { source: 'ind_3', target: 'waste_2', label: 'produces' },
          { source: 'waste_2', target: 'mat_2', label: 'contains' },
          { source: 'mat_2', target: 'ind_4', label: 'can_be_used_by' }
        ]
      });
    }

    return res.status(200).json(relations);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getKnowledgeGraph
};
