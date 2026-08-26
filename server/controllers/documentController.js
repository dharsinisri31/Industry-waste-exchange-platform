const Transaction = require('../models/Transaction');
const Industry = require('../models/Industry');
const Notification = require('../models/Notification');

// Standard document checklist types for industrial waste exchanges
const STANDARD_DOC_TYPES = [
  'Quality Report',
  'Invoice',
  'Transport Document',
  'Weighment Slip',
  'Delivery Proof',
  'Recycling Certificate',
  'Compliance Document'
];

/**
 * @desc    Get all exchange documents for the authenticated company
 * @route   GET /api/documents
 * @access  Private (Buyer, Seller, or Admin)
 */
const getUserDocuments = async (req, res) => {
  try {
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin' || (req.user.roles && req.user.roles.includes('admin'));

    // Filter transactions: Admin sees all, Buyer/Seller sees ONLY their own exchanges
    const query = isAdmin 
      ? {} 
      : { $or: [{ buyer: userId }, { seller: userId }] };

    const transactions = await Transaction.find(query)
      .populate('seller', 'companyName name email')
      .populate('buyer', 'companyName name email')
      .populate('waste', 'name category quantity unit price')
      .sort({ updatedAt: -1 });

    if (!transactions || transactions.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        documents: [],
        totalExchanges: 0
      });
    }

    // Collect all user IDs to batch fetch company profiles
    const userIds = [];
    transactions.forEach(t => {
      if (t.seller?._id) userIds.push(t.seller._id);
      if (t.buyer?._id) userIds.push(t.buyer._id);
    });

    const industries = await Industry.find({ user: { $in: userIds } });
    const industryMap = {};
    industries.forEach(ind => {
      if (ind.user) {
        industryMap[ind.user.toString()] = ind;
      }
    });

    const flattenedDocs = [];

    transactions.forEach(t => {
      const isBuyer = t.buyer?._id ? t.buyer._id.equals(userId) : false;
      const isSeller = t.seller?._id ? t.seller._id.equals(userId) : false;

      const sellerName = industryMap[t.seller?._id?.toString()]?.companyName || t.seller?.companyName || t.seller?.name || 'Seller Facility';
      const buyerName = industryMap[t.buyer?._id?.toString()]?.companyName || t.buyer?.companyName || t.buyer?.name || 'Buyer Facility';
      
      const partnerCompany = isBuyer ? sellerName : buyerName;
      const roleInExchange = isBuyer ? 'Buyer' : (isSeller ? 'Seller' : 'Admin');
      const exchangeId = t.exchangeId || t.orderId || t._id.toString();
      const materialName = t.waste?.name ? `${t.waste.name} (${t.quantity} ${t.unit || 'kg'})` : `Material (${t.quantity} ${t.unit || 'kg'})`;

      if (Array.isArray(t.documents) && t.documents.length > 0) {
        t.documents.forEach(doc => {
          flattenedDocs.push({
            _id: doc._id,
            documentId: doc._id,
            exchangeId,
            transactionId: t._id,
            materialName,
            partnerCompany,
            roleInExchange,
            orderStatus: t.orderStatus || t.status,
            uploaderId: doc.uploadedBy,
            uploaderName: doc.uploaderName || (doc.uploadedBy?.equals(userId) ? 'You' : partnerCompany),
            isUploadedByMe: doc.uploadedBy ? doc.uploadedBy.equals(userId) : false,
            docType: doc.docType || 'Quality Report',
            fileName: doc.name || 'Document.pdf',
            fileUrl: doc.url || '/uploads/sample_manifest.pdf',
            status: doc.status || 'Uploaded',
            uploadedAt: doc.uploadedAt || t.createdAt,
            verifiedAt: doc.verifiedAt,
            verifiedBy: doc.verifiedBy,
            notes: doc.notes || ''
          });
        });
      }
    });

    return res.status(200).json({
      success: true,
      count: flattenedDocs.length,
      documents: flattenedDocs,
      totalExchanges: transactions.length
    });
  } catch (err) {
    console.error('Error fetching user documents:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve documents.' });
  }
};

/**
 * @desc    Get all company exchanges with their document checklist
 * @route   GET /api/documents/exchanges
 * @access  Private (Buyer, Seller, or Admin)
 */
const getUserExchangesWithChecklist = async (req, res) => {
  try {
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin' || (req.user.roles && req.user.roles.includes('admin'));

    const query = isAdmin 
      ? {} 
      : { $or: [{ buyer: userId }, { seller: userId }] };

    const transactions = await Transaction.find(query)
      .populate('seller', 'companyName name email')
      .populate('buyer', 'companyName name email')
      .populate('waste', 'name category quantity unit price')
      .sort({ updatedAt: -1 });

    if (!transactions || transactions.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        exchanges: []
      });
    }

    const userIds = [];
    transactions.forEach(t => {
      if (t.seller?._id) userIds.push(t.seller._id);
      if (t.buyer?._id) userIds.push(t.buyer._id);
    });

    const industries = await Industry.find({ user: { $in: userIds } });
    const industryMap = {};
    industries.forEach(ind => {
      if (ind.user) industryMap[ind.user.toString()] = ind;
    });

    const exchangeList = transactions.map(t => {
      const isBuyer = t.buyer?._id ? t.buyer._id.equals(userId) : false;
      const isSeller = t.seller?._id ? t.seller._id.equals(userId) : false;

      const sellerName = industryMap[t.seller?._id?.toString()]?.companyName || t.seller?.companyName || t.seller?.name || 'Seller Facility';
      const buyerName = industryMap[t.buyer?._id?.toString()]?.companyName || t.buyer?.companyName || t.buyer?.name || 'Buyer Facility';
      
      const partnerCompany = isBuyer ? sellerName : buyerName;
      const exchangeId = t.exchangeId || t.orderId || t._id.toString();

      // Build checklist status for standard required document types
      const uploadedDocs = Array.isArray(t.documents) ? t.documents : [];
      
      const checklist = STANDARD_DOC_TYPES.map(type => {
        const found = uploadedDocs.find(d => 
          (d.docType || '').toLowerCase() === type.toLowerCase() ||
          ((d.docType || '').toLowerCase().includes('quality') && type.toLowerCase().includes('quality'))
        );

        return {
          docType: type,
          isUploaded: !!found,
          status: found ? (found.status || 'Uploaded') : 'Pending',
          document: found ? {
            _id: found._id,
            fileName: found.name,
            fileUrl: found.url,
            uploadedAt: found.uploadedAt,
            uploaderName: found.uploaderName,
            status: found.status
          } : null
        };
      });

      return {
        _id: t._id,
        exchangeId,
        materialName: t.waste?.name || 'Industrial Secondary Material',
        category: t.waste?.category || 'General',
        quantity: t.quantity,
        unit: t.unit || 'kg',
        totalPrice: t.totalPrice,
        orderStatus: t.orderStatus || t.status,
        status: t.status,
        partnerCompany,
        roleInExchange: isBuyer ? 'Buyer' : (isSeller ? 'Seller' : 'Admin'),
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        uploadedDocumentsCount: uploadedDocs.length,
        documents: uploadedDocs,
        checklist
      };
    });

    return res.status(200).json({
      success: true,
      count: exchangeList.length,
      exchanges: exchangeList
    });
  } catch (err) {
    console.error('Error fetching exchange checklists:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve exchange checklists.' });
  }
};

/**
 * @desc    Upload document to an authorized exchange
 * @route   POST /api/documents/upload
 * @access  Private (Buyer, Seller, or Admin of that exchange)
 */
const uploadDocument = async (req, res) => {
  try {
    const { exchangeId, docType, notes, name, fileName } = req.body;
    const userId = req.user._id;

    if (!exchangeId) {
      return res.status(400).json({ success: false, message: 'Exchange ID is required.' });
    }

    const transaction = await Transaction.findOne({
      $or: [
        { exchangeId: exchangeId },
        { orderId: exchangeId },
        ...(exchangeId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: exchangeId }] : [])
      ]
    }).populate('seller').populate('buyer').populate('waste');

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Exchange not found.' });
    }

    // Security check: Must be buyer, seller, or admin of this exchange
    const isBuyer = transaction.buyer?._id?.equals(userId) || transaction.buyer?.equals(userId);
    const isSeller = transaction.seller?._id?.equals(userId) || transaction.seller?.equals(userId);
    const isAdmin = req.user.role === 'admin' || (req.user.roles && req.user.roles.includes('admin'));

    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not an authorized participant in this exchange.'
      });
    }

    const docName = req.file 
      ? req.file.originalname 
      : (fileName || name || `${docType || 'Document'}_${Date.now()}.pdf`);

    const fileUrl = req.file 
      ? `/uploads/documents/${req.file.filename}` 
      : (req.body.fileUrl || '/uploads/sample_manifest.pdf');

    const uploaderName = req.user.companyName || req.user.name || (isBuyer ? 'Buyer Facility' : 'Seller Facility');

    const newDoc = {
      name: docName,
      docType: docType || 'Quality Report',
      url: fileUrl,
      uploadedBy: userId,
      uploaderName,
      uploadedAt: new Date(),
      status: 'Uploaded',
      notes: notes || `Submitted by ${uploaderName}.`
    };

    transaction.documents.push(newDoc);

    // Add to timeline
    transaction.timeline.push({
      stage: 'Documents',
      title: `${newDoc.docType} Uploaded`,
      description: `Document "${newDoc.name}" submitted by ${uploaderName}.`,
      timestamp: new Date(),
      locationName: 'Compliance Portal',
      actor: uploaderName
    });

    await transaction.save();

    // Send notification to counterparty
    const notifyRecipient = isBuyer ? transaction.seller?._id : transaction.buyer?._id;
    if (notifyRecipient) {
      await Notification.create({
        user: notifyRecipient,
        recipient: notifyRecipient,
        type: 'document',
        title: '📄 New Exchange Document Uploaded',
        message: `"${newDoc.name}" (${newDoc.docType}) was uploaded for Exchange #${transaction.exchangeId || transaction._id.toString().slice(-6)}.`,
        relatedEntity: 'Transaction',
        relatedEntityId: transaction._id.toString(),
        link: `/documents`
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Document uploaded and attached to exchange successfully.',
      document: newDoc,
      exchangeId: transaction.exchangeId || transaction._id
    });
  } catch (err) {
    console.error('Document upload error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to upload document.' });
  }
};

/**
 * @desc    Verify or reject a document in an exchange
 * @route   PATCH /api/documents/:exchangeId/:docId/verify
 * @access  Private (Admin or Counterparty)
 */
const verifyDocument = async (req, res) => {
  try {
    const { exchangeId, docId } = req.params;
    const { status, notes } = req.body; // 'Verified' or 'Rejected'
    const userId = req.user._id;

    const transaction = await Transaction.findOne({
      $or: [
        { exchangeId: exchangeId },
        { orderId: exchangeId },
        ...(exchangeId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: exchangeId }] : [])
      ]
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Exchange not found.' });
    }

    const isBuyer = transaction.buyer?.equals(userId);
    const isSeller = transaction.seller?.equals(userId);
    const isAdmin = req.user.role === 'admin' || (req.user.roles && req.user.roles.includes('admin'));

    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized action.' });
    }

    const doc = transaction.documents.id(docId) || transaction.documents.find(d => d._id.toString() === docId);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found in exchange.' });
    }

    doc.status = status || 'Verified';
    doc.verifiedBy = req.user.name || (isAdmin ? 'EcoLink Admin Compliance Team' : req.user.email);
    doc.verifiedAt = new Date();
    if (notes) doc.notes = notes;

    await transaction.save();

    return res.status(200).json({
      success: true,
      message: `Document status updated to ${doc.status}.`,
      document: doc
    });
  } catch (err) {
    console.error('Verify document error:', err);
    return res.status(500).json({ success: false, message: 'Failed to verify document.' });
  }
};

module.exports = {
  getUserDocuments,
  getUserExchangesWithChecklist,
  uploadDocument,
  verifyDocument
};
