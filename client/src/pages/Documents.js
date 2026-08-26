import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPost } from '../services/api';
import Loader from '../components/Loader';
import { 
  FiFileText, FiUploadCloud, FiCheckCircle, FiClock, 
  FiAlertCircle, FiDownload, FiCheck, FiFilter, FiLayers, 
  FiFolder, FiPlus, FiArrowRight, FiEye, FiExternalLink, FiX, FiShield
} from 'react-icons/fi';

export default function Documents() {
  const { user, profile, isBuyerMode, isBuyerOnly, isSellerOnly } = useAuth();

  const [documents, setDocuments] = useState([]);
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'checklist'
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  
  // Upload modal state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadExchangeId, setUploadExchangeId] = useState('');
  const [uploadDocType, setUploadDocType] = useState('Quality Report');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadNotes, setUploadNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Document preview modal state
  const [previewDoc, setPreviewDoc] = useState(null);

  const docTypes = [
    'Quality Report',
    'Invoice',
    'Transport Document',
    'Weighment Slip',
    'Delivery Proof',
    'Recycling Certificate',
    'Compliance Document'
  ];

  const fetchDocumentData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [docsRes, exchangesRes] = await Promise.all([
        apiGet('/api/documents').catch(() => ({ documents: [] })),
        apiGet('/api/documents/exchanges').catch(() => ({ exchanges: [] }))
      ]);

      const docsList = Array.isArray(docsRes) ? docsRes : (docsRes?.documents || []);
      const exList = Array.isArray(exchangesRes) ? exchangesRes : (exchangesRes?.exchanges || []);

      setDocuments(docsList);
      setExchanges(exList);

      if (exList.length > 0 && !uploadExchangeId) {
        setUploadExchangeId(exList[0].exchangeId || exList[0]._id);
      }
    } catch (err) {
      console.warn('Failed to load documents:', err.message);
      setDocuments([]);
      setExchanges([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentData();
  }, []);

  const handleOpenUpload = (exchangeId = '', docType = 'Quality Report') => {
    if (exchangeId) {
      setUploadExchangeId(exchangeId);
    } else if (exchanges.length > 0) {
      setUploadExchangeId(exchanges[0].exchangeId || exchanges[0]._id);
    }
    setUploadDocType(docType);
    setUploadNotes('');
    setUploadFile(null);
    setIsUploading(true);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadExchangeId) {
      alert('Please select an associated exchange.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('exchangeId', uploadExchangeId);
      formData.append('docType', uploadDocType);
      formData.append('notes', uploadNotes);
      if (uploadFile) {
        formData.append('document', uploadFile);
      } else {
        formData.append('name', `${uploadDocType.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
      }

      await apiPost('/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccessMsg(`Document "${uploadFile ? uploadFile.name : uploadDocType}" uploaded successfully.`);
      setIsUploading(false);
      setUploadFile(null);
      setUploadNotes('');
      setTimeout(() => setSuccessMsg(''), 5000);
      
      // Refresh documents
      await fetchDocumentData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to upload document.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDocs = documents.filter(doc => {
    if (selectedType !== 'All' && doc.docType !== selectedType) return false;
    if (selectedStatus !== 'All' && doc.status !== selectedStatus) return false;
    return true;
  });

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'verified') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
          <FiCheckCircle className="w-3 h-3 text-emerald-600" /> Verified
        </span>
      );
    }
    if (s === 'uploaded' || s === 'under review') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300 inline-flex items-center gap-1">
          <FiClock className="w-3 h-3 text-blue-600" /> Uploaded
        </span>
      );
    }
    if (s === 'pending') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
          <FiAlertCircle className="w-3 h-3 text-amber-600" /> Pending
        </span>
      );
    }
    if (s === 'rejected' || s === 'expired') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-300 inline-flex items-center gap-1">
          <FiAlertCircle className="w-3 h-3 text-red-600" /> {status}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-800">
        {status || 'Unknown'}
      </span>
    );
  };

  const isBuyer = isBuyerOnly || isBuyerMode;

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

          <div className="flex items-center gap-3 shrink-0">
            {exchanges.length > 0 && (
              <button
                onClick={() => handleOpenUpload()}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <FiUploadCloud className="w-4 h-4" />
                <span>Upload Document</span>
              </button>
            )}
          </div>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs">
            <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-300 text-red-900 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs">
            <FiAlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader />
          </div>
        ) : exchanges.length === 0 ? (
          /* ========================================================================= */
          /* EMPTY STATE: User has 0 exchanges and 0 documents                         */
          /* ========================================================================= */
          <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-12 sm:p-16 text-center space-y-5 shadow-xs">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-100 shadow-2xs">
              <FiFolder className="w-8 h-8" />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h2 className="text-xl font-black text-gray-900 tracking-tight">
                No documents yet
              </h2>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">
                Documents related to your exchanges will appear here. Once you initiate or participate in an industrial waste exchange, quality reports, weighment slips, and invoices will be automatically catalogued.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {isBuyer ? (
                <Link
                  to="/post-requirement"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>Create Material Requirement</span>
                </Link>
              ) : (
                <Link
                  to="/upload-waste"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>List New Waste</span>
                </Link>
              )}

              <Link
                to="/marketplace"
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs transition-all border border-gray-200"
              >
                Browse Marketplace
              </Link>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* POPULATED STATE: User has active exchanges or documents                   */
          /* ========================================================================= */
          <div className="space-y-6">
            
            {/* View Switcher Tabs */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('list')}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    activeTab === 'list'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Documents ({documents.length})
                </button>
                <button
                  onClick={() => setActiveTab('checklist')}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'checklist'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FiLayers className="w-3.5 h-3.5" />
                  <span>Exchange Checklists ({exchanges.length})</span>
                </button>
              </div>

              <div className="text-[11px] font-bold text-gray-500">
                Connected Exchanges: <strong className="text-emerald-800">{exchanges.length}</strong>
              </div>
            </div>

            {/* TAB 1: ALL DOCUMENTS TABLE */}
            {activeTab === 'list' && (
              <div className="space-y-4">
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
                      <option value="Rejected">Rejected</option>
                      <option value="Expired">Expired</option>
                    </select>
                  </div>

                  <div className="text-gray-500 font-medium text-[11px]">
                    Showing <strong>{filteredDocs.length}</strong> documents
                  </div>
                </div>

                {/* Table */}
                {filteredDocs.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-3">
                    <FiFileText className="w-8 h-8 text-gray-400 mx-auto" />
                    <div className="space-y-1">
                      <strong className="text-xs text-gray-800 block">No documents matching the selected filters</strong>
                      <p className="text-[11px] text-gray-500">You can upload missing statutory documents using the "Upload Document" button.</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="px-5 py-3">Exchange</th>
                            <th className="px-5 py-3">Document Type</th>
                            <th className="px-5 py-3">File Name</th>
                            <th className="px-5 py-3">Facility Partner</th>
                            <th className="px-5 py-3">Date</th>
                            <th className="px-5 py-3">Status</th>
                            <th className="px-5 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredDocs.map((doc) => (
                            <tr key={doc._id || doc.documentId} className="hover:bg-gray-50/80 transition-colors">
                              <td className="px-5 py-3.5">
                                <Link 
                                  to={`/exchange/${doc.exchangeId || doc.transactionId}`}
                                  className="font-mono font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 block w-fit"
                                >
                                  #{doc.exchangeId}
                                </Link>
                                <span className="text-[11px] text-gray-500 font-medium block mt-0.5">
                                  {doc.materialName}
                                </span>
                              </td>

                              <td className="px-5 py-3.5 font-bold text-gray-900">
                                {doc.docType}
                              </td>

                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-1.5 font-medium text-gray-700 truncate max-w-[220px]">
                                  <FiFileText className="text-gray-400 shrink-0" />
                                  <span className="truncate">{doc.fileName}</span>
                                </div>
                              </td>

                              <td className="px-5 py-3.5 text-gray-600 font-medium">
                                <div>{doc.partnerCompany}</div>
                                <span className="text-[10px] text-gray-400">Role: {doc.roleInExchange}</span>
                              </td>

                              <td className="px-5 py-3.5 text-gray-500 font-mono text-[11px]">
                                {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-IN') : '-'}
                              </td>

                              <td className="px-5 py-3.5">
                                {getStatusBadge(doc.status)}
                              </td>

                              <td className="px-5 py-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setPreviewDoc(doc)}
                                    className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded-lg text-[11px] font-bold cursor-pointer inline-flex items-center gap-1"
                                  >
                                    <FiEye className="w-3 h-3 text-gray-600" />
                                    <span>View</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: EXCHANGE DOCUMENT CHECKLISTS */}
            {activeTab === 'checklist' && (
              <div className="space-y-6">
                {exchanges.map((ex) => (
                  <div key={ex._id || ex.exchangeId} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-gray-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-emerald-900 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                            Exchange #{ex.exchangeId}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-teal-100 text-teal-900 uppercase">
                            {ex.orderStatus || ex.status}
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-gray-900 mt-1">
                          {ex.materialName} &bull; {ex.quantity} {ex.unit}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium">
                          Partner Facility: <strong className="text-gray-800">{ex.partnerCompany}</strong> &bull; Your Role: <strong className="text-emerald-800">{ex.roleInExchange}</strong>
                        </p>
                      </div>

                      <Link
                        to={`/exchange/${ex.exchangeId || ex._id}`}
                        className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1"
                      >
                        <span>View Full Exchange Hub</span>
                        <FiArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    {/* Document Checklist Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {ex.checklist.map((item) => (
                        <div 
                          key={item.docType}
                          className={`p-3.5 rounded-2xl border text-xs flex flex-col justify-between space-y-2.5 transition-all ${
                            item.isUploaded 
                              ? 'bg-emerald-50/40 border-emerald-200' 
                              : 'bg-gray-50/70 border-gray-200'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-1">
                            <span className="font-extrabold text-gray-900 text-xs">
                              {item.docType}
                            </span>
                            {getStatusBadge(item.status)}
                          </div>

                          {item.isUploaded && item.document ? (
                            <div className="space-y-1 text-[11px] text-gray-600">
                              <div className="truncate font-medium flex items-center gap-1">
                                <FiFileText className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span className="truncate">{item.document.fileName}</span>
                              </div>
                              <span className="text-[10px] text-gray-400 block">
                                {new Date(item.document.uploadedAt).toLocaleDateString('en-IN')}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-gray-400 italic">
                              Document not yet uploaded
                            </span>
                          )}

                          <div className="pt-1 border-t border-gray-200/60 flex justify-end">
                            {item.isUploaded && item.document ? (
                              <button
                                onClick={() => setPreviewDoc({
                                  ...item.document,
                                  exchangeId: ex.exchangeId,
                                  materialName: ex.materialName,
                                  partnerCompany: ex.partnerCompany,
                                  roleInExchange: ex.roleInExchange,
                                  docType: item.docType
                                })}
                                className="px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 rounded-lg text-[11px] font-bold cursor-pointer inline-flex items-center gap-1"
                              >
                                <FiEye className="w-3 h-3" /> View
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenUpload(ex.exchangeId, item.docType)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-extrabold cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                              >
                                <FiUploadCloud className="w-3 h-3" /> Upload
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* UPLOAD DOCUMENT MODAL                                                     */}
        {/* ========================================================================= */}
        {isUploading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-200 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <FiUploadCloud className="text-emerald-600" /> Upload Exchange Document
                </h3>
                <button
                  onClick={() => setIsUploading(false)}
                  className="text-gray-400 hover:text-gray-600 font-bold text-sm cursor-pointer p-1"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-3.5 text-xs">
                {/* Exchange selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-700 uppercase">Associated Exchange</label>
                  <select
                    value={uploadExchangeId}
                    onChange={(e) => setUploadExchangeId(e.target.value)}
                    required
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl font-bold text-gray-900 cursor-pointer"
                  >
                    {exchanges.map(ex => (
                      <option key={ex._id || ex.exchangeId} value={ex.exchangeId || ex._id}>
                        Exchange #{ex.exchangeId} &bull; {ex.materialName} ({ex.partnerCompany})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Document type selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-700 uppercase">Document Type</label>
                  <select
                    value={uploadDocType}
                    onChange={(e) => setUploadDocType(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl font-bold text-gray-900 cursor-pointer"
                  >
                    {docTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* File picker */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-700 uppercase">Select File (PDF, DOC, PNG, JPG)</label>
                  <input
                    type="file"
                    onChange={(e) => setUploadFile(e.target.files[0])}
                    className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl font-medium cursor-pointer"
                  />
                  <p className="text-[10px] text-gray-400">Max size 25MB. PDF, DOCX, JPG supported.</p>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-700 uppercase">Notes / Assay Summary</label>
                  <textarea
                    rows={2}
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                    placeholder="e.g. Chemical purity assay certified by NABL laboratory."
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsUploading(false)}
                    className="flex-1 py-2.5 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {submitting ? (
                      <span>Uploading...</span>
                    ) : (
                      <>
                        <FiUploadCloud className="w-4 h-4" />
                        <span>Upload File</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* DOCUMENT PREVIEW MODAL                                                    */}
        {/* ========================================================================= */}
        {previewDoc && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-200 space-y-4">
              <div className="flex justify-between items-start pb-2 border-b border-gray-100">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-gray-500">Document Details</span>
                  <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2 mt-0.5">
                    <FiFileText className="text-emerald-600" />
                    <span>{previewDoc.fileName}</span>
                  </h3>
                </div>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="text-gray-400 hover:text-gray-600 font-bold text-sm cursor-pointer p-1"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-400 block">Document Type</span>
                    <strong className="text-gray-900 text-xs">{previewDoc.docType}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-400 block">Verification Status</span>
                    <div className="mt-0.5">{getStatusBadge(previewDoc.status)}</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-400 block">Exchange Reference</span>
                    <strong className="text-emerald-800 text-xs font-mono">#{previewDoc.exchangeId}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-400 block">Uploaded At</span>
                    <strong className="text-gray-900 text-xs">
                      {previewDoc.uploadedAt ? new Date(previewDoc.uploadedAt).toLocaleDateString('en-IN') : 'Just now'}
                    </strong>
                  </div>
                </div>

                {previewDoc.notes && (
                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 text-emerald-950 text-xs">
                    <strong className="block text-[10px] uppercase font-bold text-emerald-800">Assay / Compliance Note:</strong>
                    <p className="mt-0.5">{previewDoc.notes}</p>
                  </div>
                )}

                {previewDoc.verifiedBy && (
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-blue-950 text-xs flex items-center gap-2">
                    <FiShield className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Verified by <strong>{previewDoc.verifiedBy}</strong> on {new Date(previewDoc.verifiedAt || Date.now()).toLocaleDateString('en-IN')}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 cursor-pointer text-xs"
                >
                  Close
                </button>
                <a
                  href={previewDoc.fileUrl || '/uploads/sample_manifest.pdf'}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-2xs text-xs flex items-center justify-center gap-1.5 cursor-pointer text-center"
                >
                  <FiExternalLink className="w-3.5 h-3.5" />
                  <span>Open Document File</span>
                </a>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
