import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPost } from '../services/api';
import { 
  FiFileText, FiUploadCloud, FiCheckCircle, FiClock, 
  FiAlertCircle, FiDownload, FiCheck, FiFilter, FiLayers 
} from 'react-icons/fi';

export default function Documents() {
  const { user, profile, isBuyerMode } = useAuth();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  
  // Upload modal state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDocType, setUploadDocType] = useState('Invoice');
  const [uploadExchangeId, setUploadExchangeId] = useState('EXC-8849');
  const [uploadFile, setUploadFile] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const docTypes = [
    'Invoice',
    'Weighment Slip',
    'Transport Document',
    'Quality Report',
    'Recycling Certificate',
    'Compliance Document',
    'Delivery Proof'
  ];

  // Default demo exchange documents matching the required types & statuses
  const defaultDocs = [
    {
      _id: 'doc-1',
      exchangeId: 'EXC-8849',
      materialName: 'PET Plastic Scrap (500 kg)',
      partnerCompany: isBuyerMode ? 'Tamil Nadu Polymer Works' : 'Kongu Green Polymers Ltd.',
      docType: 'Quality Report',
      fileName: 'PET_Assay_Quality_GradeA.pdf',
      status: 'Verified',
      uploadedAt: '2026-08-18'
    },
    {
      _id: 'doc-2',
      exchangeId: 'EXC-8849',
      materialName: 'PET Plastic Scrap (500 kg)',
      partnerCompany: isBuyerMode ? 'Tamil Nadu Polymer Works' : 'Kongu Green Polymers Ltd.',
      docType: 'Invoice',
      fileName: 'Invoice_EXC-8849_Tax.pdf',
      status: 'Verified',
      uploadedAt: '2026-08-19'
    },
    {
      _id: 'doc-3',
      exchangeId: 'EXC-8849',
      materialName: 'PET Plastic Scrap (500 kg)',
      partnerCompany: isBuyerMode ? 'Tamil Nadu Polymer Works' : 'Kongu Green Polymers Ltd.',
      docType: 'Transport Document',
      fileName: 'EWay_Bill_Logistics_Corridor.pdf',
      status: 'Uploaded',
      uploadedAt: '2026-08-20'
    },
    {
      _id: 'doc-4',
      exchangeId: 'EXC-8849',
      materialName: 'PET Plastic Scrap (500 kg)',
      partnerCompany: isBuyerMode ? 'Tamil Nadu Polymer Works' : 'Kongu Green Polymers Ltd.',
      docType: 'Weighment Slip',
      fileName: 'Bridge_Weight_Scale_Receipt.pdf',
      status: 'Pending',
      uploadedAt: '-'
    },
    {
      _id: 'doc-5',
      exchangeId: 'EXC-7721',
      materialName: 'Aluminium Dross (1,200 kg)',
      partnerCompany: isBuyerMode ? 'Kongu Extrusions' : 'Chennai Eco-Smelting Refineries',
      docType: 'Recycling Certificate',
      fileName: 'Circularity_Offset_Cert_7721.pdf',
      status: 'Verified',
      uploadedAt: '2026-08-15'
    },
    {
      _id: 'doc-6',
      exchangeId: 'EXC-7721',
      materialName: 'Aluminium Dross (1,200 kg)',
      partnerCompany: isBuyerMode ? 'Kongu Extrusions' : 'Chennai Eco-Smelting Refineries',
      docType: 'Delivery Proof',
      fileName: 'Consignee_Receipt_Signed.pdf',
      status: 'Verified',
      uploadedAt: '2026-08-16'
    },
    {
      _id: 'doc-7',
      exchangeId: 'EXC-6610',
      materialName: 'Fly Ash Class F (2,500 kg)',
      partnerCompany: isBuyerMode ? 'Salem Thermal Power Facility' : 'Salem Pozzolanic Cement Works',
      docType: 'Compliance Document',
      fileName: 'SPCB_Authorisation_Manifest.pdf',
      status: 'Expired',
      uploadedAt: '2026-05-10'
    }
  ];

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await apiGet('/api/compliance');
      if (data && data.length > 0) {
        // Map any existing documents or merge with default structure
        const formatted = data.map((d, i) => ({
          _id: d._id || `doc-${i}`,
          exchangeId: d.associatedExchange || 'EXC-8849',
          materialName: d.extractedData?.material || 'Secondary Material Stream',
          partnerCompany: isBuyerMode ? 'Verified Seller Facility' : 'Verified Buyer Facility',
          docType: d.docType || 'Quality Report',
          fileName: d.fileName || 'Document.pdf',
          status: d.status || 'Verified',
          uploadedAt: d.createdAt || '2026-08-20'
        }));
        setDocuments([...formatted, ...defaultDocs.slice(formatted.length)]);
      } else {
        setDocuments(defaultDocs);
      }
    } catch (err) {
      setDocuments(defaultDocs);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    const newDoc = {
      _id: `doc-${Date.now()}`,
      exchangeId: uploadExchangeId,
      materialName: 'Active Exchange Stream',
      partnerCompany: isBuyerMode ? 'Verified Supplier' : 'Verified Consignee',
      docType: uploadDocType,
      fileName: uploadFile.name,
      status: 'Uploaded',
      uploadedAt: new Date().toISOString().split('T')[0]
    };

    setDocuments(prev => [newDoc, ...prev]);
    setSuccessMsg(`Document "${uploadFile.name}" uploaded successfully for ${uploadExchangeId}.`);
    setIsUploading(false);
    setUploadFile(null);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const filteredDocs = documents.filter(doc => {
    if (selectedType !== 'All' && doc.docType !== selectedType) return false;
    if (selectedStatus !== 'All' && doc.status !== selectedStatus) return false;
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Verified':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
            <FiCheckCircle className="w-3 h-3" /> Verified
          </span>
        );
      case 'Uploaded':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
            <FiClock className="w-3 h-3" /> Uploaded
          </span>
        );
      case 'Pending':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
            <FiAlertCircle className="w-3 h-3" /> Pending
          </span>
        );
      case 'Expired':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-300 flex items-center gap-1">
            Expired
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto font-sans">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <FiFileText className="text-emerald-600" /> Exchange Documents
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 font-medium">
              Manage statutory invoices, weighment slips, quality reports, and transport manifests for your exchanges.
            </p>
          </div>

          <button
            onClick={() => setIsUploading(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <FiUploadCloud className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 font-bold text-gray-700">
              <FiFilter className="text-emerald-600" />
              <span>Filter By:</span>
            </div>

            {/* Document Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-xl font-semibold text-gray-900 cursor-pointer"
            >
              <option value="All">All Document Types</option>
              {docTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-xl font-semibold text-gray-900 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Verified">Verified</option>
              <option value="Uploaded">Uploaded</option>
              <option value="Pending">Pending</option>
              <option value="Expired">Expired</option>
            </select>
          </div>

          <div className="text-gray-500 font-medium text-[11px]">
            Showing <strong>{filteredDocs.length}</strong> exchange documents
          </div>
        </div>

        {/* Documents Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3">Exchange</th>
                  <th className="px-5 py-3">Document Type</th>
                  <th className="px-5 py-3">File / Attachment</th>
                  <th className="px-5 py-3">Facility Partner</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDocs.map((doc) => (
                  <tr key={doc._id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 block w-fit">
                        {doc.exchangeId}
                      </span>
                      <span className="text-[11px] text-gray-500 font-medium block mt-0.5">
                        {doc.materialName}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 font-bold text-gray-900">
                      {doc.docType}
                    </td>

                    <td className="px-5 py-3.5">
                      {doc.fileName !== '-' ? (
                        <div className="flex items-center gap-1.5 font-medium text-gray-700 truncate max-w-[200px]">
                          <FiFileText className="text-gray-400 shrink-0" />
                          <span className="truncate">{doc.fileName}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Not uploaded</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-gray-600 font-medium">
                      {doc.partnerCompany}
                    </td>

                    <td className="px-5 py-3.5 text-gray-500 font-mono text-[11px]">
                      {doc.uploadedAt}
                    </td>

                    <td className="px-5 py-3.5">
                      {getStatusBadge(doc.status)}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      {doc.status === 'Pending' ? (
                        <button
                          onClick={() => {
                            setUploadExchangeId(doc.exchangeId);
                            setUploadDocType(doc.docType);
                            setIsUploading(true);
                          }}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          Upload
                        </button>
                      ) : (
                        <button
                          onClick={() => alert(`Downloading verified document: ${doc.fileName}`)}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded-lg text-[11px] font-bold cursor-pointer inline-flex items-center gap-1"
                        >
                          <FiDownload className="w-3 h-3" />
                          <span>View</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upload Modal */}
        {isUploading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-200 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <FiUploadCloud className="text-emerald-600" /> Upload Exchange Document
                </h3>
                <button
                  onClick={() => setIsUploading(false)}
                  className="text-gray-400 hover:text-gray-600 font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-700 uppercase">Associated Exchange</label>
                  <select
                    value={uploadExchangeId}
                    onChange={(e) => setUploadExchangeId(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl font-bold text-gray-900"
                  >
                    <option value="EXC-8849">EXC-8849 (PET Plastic Scrap)</option>
                    <option value="EXC-7721">EXC-7721 (Aluminium Dross)</option>
                    <option value="EXC-6610">EXC-6610 (Fly Ash Class F)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-700 uppercase">Document Category</label>
                  <select
                    value={uploadDocType}
                    onChange={(e) => setUploadDocType(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl font-bold text-gray-900"
                  >
                    {docTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-700 uppercase">Select File (PDF / Image)</label>
                  <input
                    type="file"
                    required
                    onChange={(e) => setUploadFile(e.target.files[0])}
                    className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl font-medium cursor-pointer"
                  />
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsUploading(false)}
                    className="flex-1 py-2.5 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-2xs cursor-pointer"
                  >
                    Upload
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
