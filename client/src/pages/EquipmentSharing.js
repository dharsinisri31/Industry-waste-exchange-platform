import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import Loader from '../components/Loader';
import {
  getEquipmentListings,
  createEquipmentListing,
  bookEquipment,
  getMyBookings,
  getEquipmentRecommendations,
  updateBookingStatus
} from '../services/equipmentAPI';
import { FiCpu, FiPlus, FiCalendar, FiMapPin, FiCheckCircle, FiClock, FiStar, FiFilter, FiCheck, FiX } from 'react-icons/fi';
import { formatINR } from '../utils/formatINR';

export default function EquipmentSharing() {
  const [equipmentList, setEquipmentList] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('marketplace'); // 'marketplace' | 'ai_recommend' | 'my_bookings'
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItemForBooking, setSelectedItemForBooking] = useState(null);
  
  // Form State - Add Equipment
  const [title, setTitle] = useState('');
  const [equipmentType, setEquipmentType] = useState('Hydraulic Press');
  const [description, setDescription] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [address, setAddress] = useState('Industrial Zone');
  const [city, setCity] = useState('Coimbatore');

  // Form State - Booking Modal
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  // AI Recommendation Filter
  const [recommendMaterial, setRecommendMaterial] = useState('Plastic');

  const categories = [
    'All',
    'Hydraulic Press',
    'Dual-Shaft Shredder',
    'Extruder & Pelletizer',
    'Ball Mill',
    'Pyrolysis Reactor',
    'Solvent Distillation Unit',
    'Other'
  ];

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const data = await getEquipmentListings({ category: selectedCategory });
      setEquipmentList(data);
    } catch (err) {
      console.error('Failed to fetch equipment listings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async (material = recommendMaterial) => {
    try {
      const data = await getEquipmentRecommendations({ material });
      setRecommendations(data);
    } catch (err) {
      console.error('Failed to fetch AI equipment recommendations:', err);
    }
  };

  const fetchBookings = async () => {
    try {
      const data = await getMyBookings();
      setMyBookings(data);
    } catch (err) {
      console.error('Failed to fetch user bookings:', err);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, [selectedCategory]);

  useEffect(() => {
    if (activeTab === 'ai_recommend') {
      fetchRecommendations(recommendMaterial);
    } else if (activeTab === 'my_bookings') {
      fetchBookings();
    }
  }, [activeTab, recommendMaterial]);

  const handleCreateEquipment = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('equipmentType', equipmentType);
      formData.append('description', description);
      formData.append('hourlyRate', hourlyRate);
      formData.append('dailyRate', dailyRate);
      formData.append('address', address);
      formData.append('city', city);

      await createEquipmentListing(formData);
      setShowAddModal(false);
      setTitle('');
      setDescription('');
      setHourlyRate('');
      setDailyRate('');
      fetchEquipment();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create equipment listing.');
    }
  };

  const handleOpenBookingModal = (item) => {
    setSelectedItemForBooking(item);
    setBookingError('');
    setBookingSuccess('');
    
    // Set default dates (tomorrow to day after tomorrow)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);

    setStartDate(tomorrow.toISOString().split('T')[0]);
    setEndDate(dayAfter.toISOString().split('T')[0]);
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!selectedItemForBooking) return;
    setBookingError('');
    setBookingSuccess('');
    setBookingLoading(true);

    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffHours = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60)));
      const totalPrice = diffHours <= 24 ? diffHours * selectedItemForBooking.hourlyRate : Math.ceil(diffHours / 24) * selectedItemForBooking.dailyRate;

      await bookEquipment(selectedItemForBooking._id, {
        startDate,
        endDate,
        totalPrice
      });

      setBookingSuccess('Booking request sent successfully! Awaiting owner confirmation.');
      setTimeout(() => {
        setSelectedItemForBooking(null);
        if (activeTab === 'my_bookings') fetchBookings();
      }, 1500);
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Failed to submit booking request.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId, status) => {
    try {
      await updateBookingStatus(bookingId, { status });
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update booking status.');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Industrial Equipment Sharing Hub</h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 font-medium">
              Share, rent, and monetize processing machinery (shredders, extruders, ball mills, presses) for circular waste transformation.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <FiPlus className="w-4 h-4" /> List Equipment
            </button>
          </div>
        </div>

        {/* Primary Tabs */}
        <div className="flex items-center gap-4 border-b border-gray-200 pb-1">
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`px-4 py-2 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
              activeTab === 'marketplace'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Machinery Marketplace
          </button>
          <button
            onClick={() => setActiveTab('ai_recommend')}
            className={`px-4 py-2 text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ai_recommend'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <FiStar className="text-amber-500 fill-amber-500" /> AI Equipment Matcher
          </button>
          <button
            onClick={() => setActiveTab('my_bookings')}
            className={`px-4 py-2 text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'my_bookings'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <FiCalendar /> My Bookings
          </button>
        </div>

        {/* TAB 1: MARKETPLACE */}
        {activeTab === 'marketplace' && (
          <div className="space-y-6">
            {/* Category Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-200">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {loading ? (
              <Loader />
            ) : equipmentList.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
                <FiCpu className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-900">No machinery listings found</h3>
                <p className="text-xs text-gray-500 mt-1">Be the first to list equipment or change your filter criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {equipmentList.map((item) => (
                  <div key={item._id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs hover:border-emerald-400 transition-all space-y-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {item.equipmentType}
                        </span>
                        <span className="text-[10px] font-extrabold text-emerald-700 flex items-center gap-1">
                          <FiCheckCircle className="w-3 h-3 text-emerald-600" /> {item.status || 'Available'}
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-gray-900">{item.title}</h3>
                      <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed font-medium">
                        {item.description}
                      </p>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-gray-100">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-semibold flex items-center gap-1"><FiMapPin className="text-emerald-600" /> Location:</span>
                        <span className="font-bold text-gray-900">{item.city}</span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-semibold">Rental Rates:</span>
                        <span className="font-mono font-extrabold text-emerald-800">
                          {formatINR(item.hourlyRate)}/hr &bull; {formatINR(item.dailyRate)}/day
                        </span>
                      </div>

                      <button
                        onClick={() => handleOpenBookingModal(item)}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                      >
                        <FiCalendar className="w-4 h-4" /> Book Machinery
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: AI RECOMMENDATIONS */}
        {activeTab === 'ai_recommend' && (
          <div className="space-y-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-base font-extrabold text-emerald-950 flex items-center gap-2">
                  <FiCpu className="text-emerald-700" /> AI Material-to-Machine Matcher
                </h3>
                <p className="text-xs text-emerald-800 mt-1">
                  Recommends optimal processing machinery (shredders, pelletizers, presses) tailored to your specific waste stream properties and geographic proximity.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-emerald-900">Select Waste Material:</label>
                <select
                  value={recommendMaterial}
                  onChange={(e) => setRecommendMaterial(e.target.value)}
                  className="px-3.5 py-2 rounded-xl bg-white border border-emerald-300 text-xs font-bold text-gray-900 shadow-2xs"
                >
                  <option value="Plastic">Plastic Scrap / Polyolefin</option>
                  <option value="PET">PET Bottles / Packaging</option>
                  <option value="HDPE">HDPE Containers</option>
                  <option value="Metal">Industrial Metal Machining</option>
                  <option value="Textile">Textile Scrap / Fabric</option>
                  <option value="FlyAsh">Fly Ash / Slag</option>
                  <option value="Chemical">Chemical Residue / Solvents</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendations.map((item) => (
                <div key={item._id} className="bg-white border-2 border-emerald-300 rounded-2xl p-6 shadow-xs relative flex flex-col justify-between space-y-4">
                  <div className="absolute top-4 right-4 bg-emerald-600 text-white px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider shadow-2xs">
                    {Math.round(item.compatibilityScore * 100)}% MATCH
                  </div>

                  <div className="space-y-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {item.equipmentType}
                    </span>
                    <h3 className="text-base font-extrabold text-gray-900 pr-16">{item.title}</h3>
                    <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed font-medium">
                      {item.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-gray-100">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-semibold flex items-center gap-1"><FiMapPin className="text-emerald-600" /> Distance:</span>
                      <span className="font-bold text-gray-900">{item.distanceKm} km away ({item.city})</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-semibold">Rates:</span>
                      <span className="font-mono font-extrabold text-emerald-800">
                        {formatINR(item.hourlyRate)}/hr &bull; {formatINR(item.dailyRate)}/day
                      </span>
                    </div>

                    <button
                      onClick={() => handleOpenBookingModal(item)}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                    >
                      <FiCalendar className="w-4 h-4" /> Book Match
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: MY BOOKINGS */}
        {activeTab === 'my_bookings' && (
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-gray-900">Your Equipment Rental & Booking Records</h3>

            {myBookings.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
                <FiCalendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-900">No active bookings found</h3>
                <p className="text-xs text-gray-500 mt-1">Rent machinery or manage incoming requests from other plants here.</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-700 border-b border-gray-200 font-extrabold uppercase tracking-wider">
                      <th className="p-4">Equipment</th>
                      <th className="p-4">Renter / Owner</th>
                      <th className="p-4">Dates</th>
                      <th className="p-4">Total Cost</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {myBookings.map((b) => (
                      <tr key={b._id} className="hover:bg-gray-50/80 transition-all">
                        <td className="p-4 font-bold text-gray-900">
                          {b.equipment?.title || 'Machinery'}
                          <div className="text-[10px] text-gray-500 font-normal">{b.equipment?.equipmentType}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-gray-800">{b.renter?.companyName || b.renter?.email}</div>
                        </td>
                        <td className="p-4 text-gray-700 font-mono text-[11px]">
                          {new Date(b.startDate).toLocaleDateString()} → {new Date(b.endDate).toLocaleDateString()}
                        </td>
                        <td className="p-4 font-mono font-extrabold text-emerald-700">
                          {formatINR(b.totalPrice)}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            b.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            b.status === 'rejected' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                            'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {b.status === 'pending' && (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleUpdateBookingStatus(b._id, 'approved')}
                                className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                                title="Approve Booking"
                              >
                                <FiCheck className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleUpdateBookingStatus(b._id, 'rejected')}
                                className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                                title="Reject Booking"
                              >
                                <FiX className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal 1: Add Equipment */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-gray-200 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-xl">
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <FiCpu className="text-emerald-600" /> List Industrial Equipment
              </h3>

              <form onSubmit={handleCreateEquipment} className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block mb-1">Equipment Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. 15 HP Dual-Shaft Shredder"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block mb-1">Machinery Category</label>
                    <select
                      value={equipmentType}
                      onChange={(e) => setEquipmentType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 bg-white font-medium cursor-pointer"
                    >
                      {categories.filter((c) => c !== 'All').map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block mb-1">City / Location</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block mb-1">Hourly Rate (₹)</label>
                    <input
                      type="number"
                      required
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      placeholder="e.g. 450"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block mb-1">Daily Rate (₹)</label>
                    <input
                      type="number"
                      required
                      value={dailyRate}
                      onChange={(e) => setDailyRate(e.target.value)}
                      placeholder="e.g. 3000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block mb-1">Description & Specs</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Specify capacity, power rating, and processing throughput..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 font-medium resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl transition-all cursor-pointer hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    Publish Equipment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 2: Book Equipment */}
        {selectedItemForBooking && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-gray-200 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-emerald-700 tracking-wider">Book Machinery</span>
                  <h3 className="text-base font-extrabold text-gray-900">{selectedItemForBooking.title}</h3>
                </div>
                <button onClick={() => setSelectedItemForBooking(null)} className="text-gray-400 hover:text-gray-600">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {bookingError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl">
                  {bookingError}
                </div>
              )}

              {bookingSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl">
                  {bookingSuccess}
                </div>
              )}

              <form onSubmit={handleConfirmBooking} className="space-y-4 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-mono text-xs text-gray-900"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-mono text-xs text-gray-900"
                  />
                </div>

                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 font-medium">Hourly Rate:</span>
                    <span className="font-mono font-bold">{formatINR(selectedItemForBooking.hourlyRate)}/hr</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 font-medium">Daily Rate:</span>
                    <span className="font-mono font-bold">{formatINR(selectedItemForBooking.dailyRate)}/day</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedItemForBooking(null)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-xs disabled:opacity-50"
                  >
                    {bookingLoading ? 'Submitting...' : 'Confirm Request'}
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
