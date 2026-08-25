import React, { useState, useEffect } from 'react';
import API from '../../services/authAPI';
import AdminLayout from '../../layouts/AdminLayout';
import Loader from '../../components/Loader';
import { 
  FiFileText, FiRefreshCw, FiCheckCircle, FiSearch, 
  FiSend, FiHelpCircle, FiShield, FiBookOpen 
} from 'react-icons/fi';

export default function AdminKnowledge() {
  const [loading, setLoading] = useState(true);
  const [reindexing, setReindexing] = useState(false);
  const [knowledgeData, setKnowledgeData] = useState(null);
  const [testQuery, setTestQuery] = useState('');
  const [testAnswer, setTestAnswer] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [notification, setNotification] = useState('');

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 5000);
  };

  const fetchKnowledgeStatus = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/knowledge-base');
      setKnowledgeData(res.data);
    } catch (err) {
      console.warn('Failed to load knowledge status:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledgeStatus();
  }, []);

  const handleReindex = async () => {
    try {
      setReindexing(true);
      const res = await API.post('/admin/knowledge-base/reindex');
      showNotification(res.data.message || 'Regulatory knowledge store re-indexed successfully.');
      fetchKnowledgeStatus();
    } catch (err) {
      alert('Failed to re-index knowledge repository.');
    } finally {
      setReindexing(false);
    }
  };

  const handleTestQuery = async (e) => {
    e.preventDefault();
    if (!testQuery) return;

    try {
      setQueryLoading(true);
      const res = await API.post('/chatbot/query', { query: testQuery });
      setTestAnswer(res.data);
    } catch (err) {
      alert(err.message || 'Failed to query knowledge assistant.');
    } finally {
      setQueryLoading(false);
    }
  };

  const regulatoryDocuments = [
    {
      name: 'Hazardous and Other Wastes (Management & Transboundary Movement) Rules',
      source: 'Ministry of Environment, Forest & Climate Change (MoEFCC)',
      category: 'Hazardous Waste',
      status: 'Indexed & Grounded',
      version: '2016 (Amended 2024)',
      filename: 'hazardous_waste_rules.pdf'
    },
    {
      name: 'Plastic Waste Management (PWM) & EPR Guidelines',
      source: 'Central Pollution Control Board (CPCB)',
      category: 'Polymers & EPR',
      status: 'Indexed & Grounded',
      version: '2022 Mandate',
      filename: 'plastic_waste_management.pdf'
    },
    {
      name: 'Fly Ash Utilization Notification for Coal/Lignite Thermal Power Plants',
      source: 'Gazette of India / MoEFCC',
      category: 'Thermal Ash & Minerals',
      status: 'Indexed & Grounded',
      version: '2021 Notification',
      filename: 'fly_ash_notification.pdf'
    },
    {
      name: 'Solid Waste Management Rules & Circular Sourcing Framework',
      source: 'CPCB & Industrial Advisory',
      category: 'Solid Waste',
      status: 'Indexed & Grounded',
      version: '2016 Guidelines',
      filename: 'solid_waste_management.pdf'
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-8 font-sans">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Knowledge & Policies
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1">
              Manage regulatory documents, platform policies and the knowledge used by the platform assistant.
            </p>
          </div>

          <button
            onClick={handleReindex}
            disabled={reindexing}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${reindexing ? 'animate-spin' : ''}`} />
            <span>{reindexing ? 'Re-indexing Documents...' : 'Re-index Knowledge Base'}</span>
          </button>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Section 1: Regulatory Policy Documents */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <div>
              <h2 className="text-base font-extrabold text-gray-900">Regulatory Policy Documents</h2>
              <p className="text-xs text-gray-500 font-medium">Authoritative statutory documents indexed for compliance verification.</p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {regulatoryDocuments.length} Documents Active
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">Issuing Authority</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Statutory Version</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {regulatoryDocuments.map((doc, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="py-3.5 px-4 font-bold text-gray-900 flex items-center gap-2">
                      <FiFileText className="text-emerald-700 shrink-0 w-4 h-4" />
                      <span>{doc.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">{doc.source}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800">
                        {doc.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 font-mono text-[11px]">{doc.version}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 flex items-center gap-1 w-fit">
                        <FiCheckCircle className="w-3 h-3" /> {doc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Interactive Policy Assistant Testing */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="pb-2 border-b border-gray-100">
            <h2 className="text-base font-extrabold text-gray-900">Test Knowledge Assistant</h2>
            <p className="text-xs text-gray-500 font-medium">Verify how the platform assistant responds to statutory policy questions using the grounded repository.</p>
          </div>

          <form onSubmit={handleTestQuery} className="flex gap-3">
            <input
              type="text"
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              placeholder="e.g. What are the manifest requirements for transporting chemical sludge?"
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-600 font-medium"
            />
            <button
              type="submit"
              disabled={queryLoading}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {queryLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              ) : (
                <>
                  <FiSend className="w-3.5 h-3.5" />
                  <span>Test Query</span>
                </>
              )}
            </button>
          </form>

          {testAnswer && (
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs space-y-2">
              <span className="font-extrabold text-gray-900 block">Assistant Grounded Response:</span>
              <p className="text-gray-700 leading-relaxed font-medium">
                {testAnswer.answer || testAnswer.response || JSON.stringify(testAnswer)}
              </p>
              {testAnswer.sources && (
                <div className="pt-2 border-t border-gray-200 text-[11px] text-gray-500">
                  <span>Cited Statutory Document: <strong>{testAnswer.sources.join(', ')}</strong></span>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}
