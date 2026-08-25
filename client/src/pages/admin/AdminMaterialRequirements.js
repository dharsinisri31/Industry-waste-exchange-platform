import React, { useState, useEffect, useMemo } from 'react';
import API from '../../services/authAPI';
import AdminLayout from '../../layouts/AdminLayout';
import Loader from '../../components/Loader';
import { formatINR } from '../../utils/formatINR';
import { 
  FiLayers, FiSearch, FiCheckCircle, 
  FiEye, FiCheck, FiSlash, FiX, FiMapPin, FiCalendar, FiDollarSign 
} from 'react-icons/fi';

export default function AdminMaterialRequirements() {
  const [loading, setLoading] = useState(true);
  const [requirements, setRequirements] = useState([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [materialFilter, setMaterialFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modals & States
  const [viewRequirement, setViewRequirement] = useState(null);
  const [notification, setNotification] = useState('');

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/buyer-requirements');
      setRequirements(res.data || []);
    } catch (err) {
      console.warn('Failed to load material requirements:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await API.patch(`/admin/buyer-requirements/${id}/status`, { status: newStatus });
      showNotification(`Requirement marked as "${newStatus}".`);
      await fetchRequirements();
      if (viewRequirement && viewRequirement._id === id) {
        setViewRequirement(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert(err.message || 'Failed to update requirement status.');
    }
  };

  const filteredRequirements = useMemo(() => {
    return requirements.filter(req => {
      // 1. Search Query (Buyer Name or Material)
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches = 
          (req.material || '').toLowerCase().includes(q) ||
          (req.buyer?.companyName || '').toLowerCase().includes(q) ||
          (req.city || '').toLowerCase().includes(q);
        if (!matches) return false;
      }

      // 2. Material Filter
      if (materialFilter !== 'All') {
        const m = (req.material || '').toLowerCase();
        if (!m.includes(materialFilter.toLowerCase())) return false;
      }

      // 3. Location Filter
      if (locationFilter !== 'All') {
        const loc = (req.city || '').toLowerCase();
        if (!loc.includes(locationFilter.toLowerCase())) return false;
      }

      // 4. Status Filter
      if (statusFilter !== 'All') {
        const s = (req.status || 'active').toLowerCase();
        if (s !== statusFilter.toLowerCase()) return false;
      }

      return true;
    });
  }, [requirements, searchQuery, materialFilter, locationFilter, statusFilter]);

  return (
    <AdminLayout>
      <div className="space-y-6 font-sans">
        
        {/* Header (No refresh button per rule) */}
        <div className="bg-white p-6 rounded-3xl border border-[#DDE7E2] shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#12233F] tracking-tight">
              Material Requirements
            </h1>
            <p className="text-xs text-[#5F6B7A] font-medium mt-1">
              Monitor industrial buyer procurement needs, verify demand specs, and manage requirement statuses.
            </p>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="p-4 bg-[#EAF8F2] border border-[#009B6B]/40 text-[#009B6B] rounded-2xl text-xs font-bold flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 text-[#009B6B] shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="bg-white p-5 rounded-3xl border border-[#DDE7E2] shadow-2xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#009B6B] pointer-events-none">
                <FiSearch className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search material or buyer facility..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#DDE7E2] text-xs text-[#12233F] placeholder-gray-400 focus:outline-none focus:border-[#009B6B] focus:ring-1 focus:ring-[#009B6B] font-medium bg-[#F6F8F7]"
              />
            </div>

            {/* Material Filter */}
            <div>
              <select
                value={materialFilter}
                onChange={(e) => setMaterialFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#DDE7E2] text-xs text-[#12233F] focus:outline-none focus:border-[#009B6B] font-bold bg-[#F6F8F7] cursor-pointer"
              >
                <option value="All">Material: All</option>
                <option value="Plastic">Plastic / Polymer</option>
                <option value="Metal">Metal / Scrap</option>
                <option value="Paper">Paper / Cardboard</option>
                <option value="Textile">Textile Waste</option>
                <option value="Glass">Glass Cullet</option>
                <option value="Fly Ash">Fly Ash</option>
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#DDE7E2] text-xs text-[#12233F] focus:outline-none focus:border-[#009B6B] font-bold bg-[#F6F8F7] cursor-pointer"
              >
                <option value="All">Location: All</option>
                <option value="Coimbatore">Coimbatore</option>
                <option value="Tiruppur">Tiruppur</option>
                <option value="Erode">Erode</option>
                <option value="Salem">Salem</option>
                <option value="Chennai">Chennai</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#DDE7E2] text-xs text-[#12233F] focus:outline-none focus:border-[#009B6B] font-bold bg-[#F6F8F7] cursor-pointer"
              >
                <option value="All">Status: All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="fulfilled">Fulfilled</option>
              </select>
            </div>

          </div>
        </div>

        {/* Requirements Table */}
        <div className="bg-white rounded-3xl border border-[#DDE7E2] shadow-2xs overflow-hidden">
          {loading ? (
            <div className="py-20 flex justify-center">
              <Loader />
            </div>
          ) : filteredRequirements.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#F6F8F7] border-b border-[#DDE7E2] text-[11px] font-extrabold text-[#5F6B7A] uppercase tracking-wider">
                    <th className="py-4 px-4">Required Material</th>
                    <th className="py-4 px-4">Procuring Buyer</th>
                    <th className="py-4 px-4">Quantity Spec</th>
                    <th className="py-4 px-4">Max Target Price</th>
                    <th className="py-4 px-4">Location</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE7E2]/60 font-medium text-[#12233F]">
                  {filteredRequirements.map((req) => {
                    const isActive = (req.status || 'active').toLowerCase() === 'active';

                    return (
                      <tr key={req._id} className="hover:bg-[#F6F8F7]/80 transition-colors">
                        <td className="py-4 px-4 font-extrabold text-[#12233F]">
                          {req.material}
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-bold text-[#12233F]">{req.buyer?.companyName || req.buyer?.email || 'Recycling Plant'}</div>
                          <div className="text-[11px] text-[#5F6B7A] font-mono">{req.buyer?.email || 'N/A'}</div>
                        </td>
                        <td className="py-4 px-4 font-bold text-[#12233F]">
                          {req.quantity} {req.unit || 'kg'} / {req.frequency || 'month'}
                        </td>
                        <td className="py-4 px-4 font-extrabold text-[#009B6B]">
                          {req.maxPrice ? `₹${req.maxPrice} / ${req.unit || 'kg'}` : 'Negotiable'}
                        </td>
                        <td className="py-4 px-4 text-[#5F6B7A]">
                          {req.city || 'Regional Hub'}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            isActive 
                              ? 'bg-[#EAF8F2] text-[#009B6B] border border-[#009B6B]/30' 
                              : 'bg-gray-100 text-gray-700 border border-gray-300'
                          }`}>
                            {isActive ? 'Active' : (req.status || 'Inactive')}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {/* VIEW BUTTON */}
                          <button
                            onClick={() => setViewRequirement(req)}
                            className="px-2.5 py-1.5 rounded-xl bg-[#F6F8F7] hover:bg-[#EAF8F2] text-[#12233F] hover:text-[#009B6B] font-bold text-xs transition-all border border-[#DDE7E2] cursor-pointer inline-flex items-center gap-1"
                            title="View Requirement"
                          >
                            <FiEye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>

                          {/* ACTIVATE / DEACTIVATE BUTTON */}
                          {isActive ? (
                            <button
                              onClick={() => handleUpdateStatus(req._id, 'inactive')}
                              className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-all border border-gray-300 cursor-pointer inline-flex items-center gap-1"
                              title="Deactivate Requirement"
                            >
                              <FiSlash className="w-3.5 h-3.5 text-gray-500" />
                              <span>Deactivate</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(req._id, 'active')}
                              className="px-3 py-1.5 rounded-xl bg-[#009B6B] hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer inline-flex items-center gap-1"
                              title="Activate Requirement"
                            >
                              <FiCheck className="w-3.5 h-3.5" />
                              <span>Activate</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-[#5F6B7A] space-y-2">
              <FiLayers className="w-8 h-8 mx-auto text-gray-300" />
              <p className="font-bold text-[#12233F]">No material requirements match active filters.</p>
              <p>Try adjusting your search criteria, material stream, or status filter.</p>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* VIEW REQUIREMENT MODAL */}
        {/* ------------------------------------------------------------- */}
        {viewRequirement && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-[#DDE7E2] shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
              
              <div className="flex justify-between items-start border-b border-[#DDE7E2] pb-4">
                <div>
                  <h2 className="text-xl font-black text-[#12233F]">{viewRequirement.material}</h2>
                  <span className="text-xs text-[#009B6B] font-extrabold uppercase mt-0.5 block">
                    Buyer Procurement Specification
                  </span>
                </div>
                <button
                  onClick={() => setViewRequirement(null)}
                  className="p-2 rounded-xl bg-[#F6F8F7] hover:bg-gray-200 text-[#12233F] cursor-pointer"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-[#F6F8F7] rounded-2xl space-y-1">
                  <span className="font-extrabold text-[#5F6B7A] uppercase tracking-wider text-[10px]">Buyer Facility</span>
                  <div className="font-bold text-[#12233F]">{viewRequirement.buyer?.companyName || 'Industrial Facility'}</div>
                </div>

                <div className="p-3 bg-[#F6F8F7] rounded-2xl space-y-1">
                  <span className="font-extrabold text-[#5F6B7A] uppercase tracking-wider text-[10px]">Quantity Needed</span>
                  <div className="font-bold text-[#12233F]">{viewRequirement.quantity} {viewRequirement.unit || 'kg'} / {viewRequirement.frequency || 'month'}</div>
                </div>

                <div className="p-3 bg-[#F6F8F7] rounded-2xl space-y-1">
                  <span className="font-extrabold text-[#5F6B7A] uppercase tracking-wider text-[10px]">Max Price Ceiling</span>
                  <div className="font-extrabold text-[#009B6B]">{viewRequirement.maxPrice ? `₹${viewRequirement.maxPrice} / ${viewRequirement.unit || 'kg'}` : 'Negotiable'}</div>
                </div>

                <div className="p-3 bg-[#F6F8F7] rounded-2xl space-y-1">
                  <span className="font-extrabold text-[#5F6B7A] uppercase tracking-wider text-[10px]">Destination Hub</span>
                  <div className="font-bold text-[#12233F]">{viewRequirement.city || 'Regional Hub'}, {viewRequirement.address || ''}</div>
                </div>
              </div>

              {viewRequirement.description && (
                <div className="p-3 bg-[#F6F8F7] rounded-2xl space-y-1 text-xs">
                  <span className="font-extrabold text-[#5F6B7A] uppercase tracking-wider text-[10px]">Technical Specifications</span>
                  <p className="text-[#12233F] font-medium leading-relaxed">{viewRequirement.description}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-[#DDE7E2]">
                <button
                  onClick={() => setViewRequirement(null)}
                  className="px-6 py-2.5 rounded-xl bg-[#12233F] hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
