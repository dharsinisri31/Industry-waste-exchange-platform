import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { apiGet, apiPatch } from '../services/api';

const ALL_STAGES = [
  'Generated',
  'Listed',
  'Inspected',
  'Verified',
  'Matched',
  'Requested',
  'Purchased',
  'Collected',
  'In Transit',
  'Received',
  'Processed',
  'Recycled',
  'Converted to Resource',
  'Completed'
];

const WasteJourneyTracker = () => {
  const { id } = useParams();
  const [journey, setJourney] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('Collected');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchJourney();
  }, [id]);

  const fetchJourney = async () => {
    try {
      setLoading(true);
      const data = await apiGet(`/api/waste/journey/${id || 'demo'}`);
      setJourney(data);
    } catch (err) {
      setJourney({
        passportId: `PASSPORT-${id || '8849-RES'}`,
        currentStatus: 'In Transit',
        timeline: [
          { status: 'Generated', timestamp: '2026-08-01T09:00:00Z', notes: 'Waste produced at manufacturing line' },
          { status: 'Listed', timestamp: '2026-08-01T10:30:00Z', notes: 'Listed on EcoLink Circular Exchange' },
          { status: 'Inspected', timestamp: '2026-08-01T11:00:00Z', notes: 'Material Inspection: Grade A PET' },
          { status: 'Verified', timestamp: '2026-08-02T14:00:00Z', notes: 'Lab report verified by SGS' },
          { status: 'Matched', timestamp: '2026-08-03T16:00:00Z', notes: 'Matched with EcoPlastics Inc' },
          { status: 'Purchased', timestamp: '2026-08-04T12:00:00Z', notes: 'PO #8849 Confirmed' },
          { status: 'In Transit', timestamp: '2026-08-05T08:15:00Z', notes: 'Dispatched via GreenLogistics EV Fleet' }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      await apiPatch(`/api/waste/journey/${id || 'demo'}/status`, { status: newStatus, notes });
      fetchJourney();
      setNotes('');
    } catch (err) {
      console.log(err.message);
    }
  };

  const currentIdx = journey ? ALL_STAGES.indexOf(journey.currentStatus) : 2;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Waste Resource Journey Lifecycle
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 font-medium">
            End-to-End Traceability & Provenance Timeline (14 Lifecycle Stages)
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500 text-xs font-semibold">Loading Waste Journey...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Lifecycle Timeline */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-6">
              <h3 className="text-sm font-extrabold text-gray-900 border-b border-gray-100 pb-3 flex items-center justify-between">
                <span>Lifecycle Progress</span>
                <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-mono font-bold">
                  Current: {journey.currentStatus}
                </span>
              </h3>

              {/* Progress Bar */}
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden border border-gray-200">
                <div
                  className="bg-emerald-600 h-3 transition-all duration-500"
                  style={{ width: `${Math.max(8, ((currentIdx + 1) / ALL_STAGES.length) * 100)}%` }}
                ></div>
              </div>

              {/* Vertical Timeline */}
              <div className="space-y-4 relative border-l-2 border-gray-200 ml-3 pl-6">
                {ALL_STAGES.map((stage, idx) => {
                  const isCompleted = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;
                  const matchedEvent = journey.timeline.find(t => t.status === stage);

                  return (
                    <div key={stage} className="relative group">
                      <div
                        className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 ${
                          isCurrent
                            ? 'bg-emerald-600 border-white ring-4 ring-emerald-500/20'
                            : isCompleted
                            ? 'bg-emerald-600 border-emerald-200'
                            : 'bg-gray-100 border-gray-300'
                        }`}
                      ></div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className={`text-xs font-extrabold ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                            {stage}
                          </h4>
                          {matchedEvent && (
                            <p className="text-xs text-gray-600 font-medium mt-0.5">{matchedEvent.notes}</p>
                          )}
                        </div>
                        {matchedEvent && (
                          <span className="text-[10px] text-gray-500 font-mono font-medium">
                            {new Date(matchedEvent.timestamp).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Update Lifecycle Stage */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4 h-fit">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
                Update Journey Stage
              </h3>
              <form onSubmit={handleUpdateStatus} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-700 block font-bold uppercase tracking-wider">New Stage</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full bg-white border border-gray-200 text-gray-900 text-xs rounded-xl p-2.5 font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {ALL_STAGES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-700 block font-bold uppercase tracking-wider">Log Notes / Details</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Weighbridge weight confirmed: 2,480 kg..."
                    rows="3"
                    className="w-full bg-white border border-gray-200 text-gray-900 text-xs rounded-xl p-2.5 font-medium focus:outline-none focus:border-emerald-500 resize-none"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-2xs transition cursor-pointer"
                >
                  Log New Event Stage
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default WasteJourneyTracker;
