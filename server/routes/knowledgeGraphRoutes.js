const express = require('express');
const router = express.Router();
const { getKnowledgeGraph } = require('../controllers/knowledgeGraphController');

router.get('/', getKnowledgeGraph);

module.exports = router;
