import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/authAPI';
import { useAuth } from '../context/AuthContext';
import { normalizeRole, ROLES } from '../utils/roleUtils';
import { formatINR } from '../utils/formatINR';
import { 
  FiCheckCircle, FiClock, FiTruck, FiPackage, 
  FiDollarSign, FiShield, FiAlertTriangle, FiArrowRight, 
  FiStar, FiFileText, FiMapPin, FiUser, FiCalendar, FiCheck 
} from 'react-icons/fi';

const ORDER_LIFECYCLE_STAGES = [
  { key: 'Order Placed', label: 'Order Placed', desc: 'Order created by buyer' },
  { key: 'Payment Confirmed', label: 'Payment Confirmed', desc: 'Escrow settlement verified' },
  { key: 'Seller Accepted', label: 'Seller Accepted', desc: 'Producer confirmed order' },
  { key: 'Waste Prepared', label: 'Waste Prepared', desc: 'Packaging & assay ready' },
  { key: 'Pickup Scheduled', label: 'Pickup Scheduled', desc: 'Carrier vehicle assigned' },
  { key: 'In Transit', label: 'In Transit', desc: 'Freight on highway route' },
  { key: 'Delivered', label: 'Delivered', desc: 'Arrived at buyer weighbridge' },
  { key: 'Completed', label: 'Completed', desc: 'Custody & ESG verified' }
];

export default function OrderTracker({ 
  order, 
  onStatusUpdated, 
  onOpenReviewModal, 
  onOpenDisputeModal,
  onOpenInvoiceModal 
}) {
  const { user, profile, activeRole } = useAuth();
  const currentRole = normalizeRole(user, profile, activeRole);
  const isAdmin = currentRole === ROLES.ADMIN;

  const [updating, setUpdating] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!order) return null;

  const currentStatusRaw = order.orderStatus || order.status || 'Order Placed';
  
  // Normalize current stage to find active index
  const getActiveStageIndex = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('place')) return 0;
    if (s.includes('pay') || s === 'accepted_paid') return 1;
    if (s === 'seller accepted' || s === 'accepted') return 2;
    if (s.includes('prepar')) return 3;
    if (s.includes('schedul') || s.includes('route_plan')) return 4;
    if (s.includes('transit') || s.includes('shipped')) return 5;
    if (s.includes('deliver') || s.includes('received')) return 6;
    if (s.includes('complet') || s.includes('processed')) return 7;
    return 0;
  };

  const activeIndex = getActiveStageIndex(currentStatusRaw);
  const isCancelled = (currentStatusRaw || '').toLowerCase().includes('cancel');
  const isDisputed = (currentStatusRaw || '').toLowerCase().includes('dispute');

  const isBuyer = order.buyer?._id === user?._id || order.buyer === user?._id;
  const isSeller = order.seller?._id === user?._id || order.seller === user?._id;

  const handleUpdateStatus = async (newStatus, noteText = '') => {
    try {
      setUpdating(true);
      setErrorMsg('');
      await API.patch(`/traceability/exchanges/${order.exchangeId || order._id}/order-status`, {
        orderStatus: newStatus,
        note: noteText || `Order moved to ${newStatus}.`
      });
      setShowStatusModal(false);
      setStatusNote('');
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  const getStageTimestamp = (stageKey) => {
    if (!order.statusHistory || order.statusHistory.length === 0) return null;
    const item = order.statusHistory.find(h => (h.status || '').toLowerCase() === stageKey.toLowerCase());
    return item ? new Date(item.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : null;
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-8 font-sans">
      
      {/* Tracker Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              Live Order Lifecycle Tracker
            </span>
            {isDisputed && (
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                Under Dispute Mediation
              </span>
            )}
            {isCancelled && (
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-100 text-red-900 border border-red-300">
                Cancelled
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            Order #{order.exchangeId || order.orderId || order._id?.toString().slice(-6)}
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Current Stage: <span className="font-extrabold text-emerald-800">{currentStatusRaw}</span>
          </p>
        </div>

        {/* Top Action Buttons according to State */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View/Download Invoice button if Paid */}
          {((order.paymentStatus || '').toLowerCase() === 'paid' || activeIndex >= 1) && (
            <button
              onClick={onOpenInvoiceModal}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <FiFileText className="w-4 h-4 text-emerald-600" />
              <span>Invoice / Receipt</span>
            </button>
          )}

          {/* Unpaid Order: Pay Now Shortcut for Buyer */}
          {(isBuyer || !isSeller) && (order.paymentStatus || '').toLowerCase() !== 'paid' && !isCancelled && (
            <Link
              to={`/payment/${order.exchangeId || order._id}`}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FiDollarSign className="w-4 h-4" />
              <span>Proceed to Payment</span>
            </Link>
          )}
        </div>
      </div>

      {/* Error Notice */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <FiAlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* VISUAL 8-STAGE PROGRESS STEPPER */}
      <div className="space-y-4">
        <div className="hidden md:grid grid-cols-8 gap-2 relative">
          {/* Connector Line behind steps */}
          <div className="absolute top-4 left-6 right-6 h-1 bg-gray-200 -z-0">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(100, (activeIndex / 7) * 100)}%` }}
            />
          </div>

          {ORDER_LIFECYCLE_STAGES.map((stage, idx) => {
            const isDone = idx <= activeIndex && !isCancelled;
            const isCurrent = idx === activeIndex && !isCancelled;
            const timeLabel = getStageTimestamp(stage.key);

            return (
              <div key={stage.key} className="flex flex-col items-center text-center relative z-10 space-y-2">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs transition-all shadow-xs ${
                    isCurrent
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 scale-110'
                      : isDone
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white text-gray-400 border-2 border-gray-200'
                  }`}
                >
                  {isDone ? <FiCheck className="w-4 h-4 stroke-[3]" /> : idx + 1}
                </div>

                <div className="space-y-0.5">
                  <span className={`text-[11px] font-bold block leading-tight ${isCurrent ? 'text-emerald-900 font-black' : isDone ? 'text-gray-900' : 'text-gray-400'}`}>
                    {stage.label}
                  </span>
                  {timeLabel && (
                    <span className="text-[9px] text-gray-400 font-medium block">
                      {timeLabel}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Vertical Stepper */}
        <div className="md:hidden space-y-3">
          {ORDER_LIFECYCLE_STAGES.map((stage, idx) => {
            const isDone = idx <= activeIndex && !isCancelled;
            const isCurrent = idx === activeIndex && !isCancelled;
            const timeLabel = getStageTimestamp(stage.key);

            return (
              <div key={stage.key} className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                  isCurrent ? 'bg-emerald-600 text-white ring-2 ring-emerald-200' : isDone ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {isDone ? <FiCheck className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                </div>
                <div className="space-y-0.5 pt-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${isCurrent ? 'text-emerald-900 font-black' : 'text-gray-800'}`}>{stage.label}</span>
                    {timeLabel && <span className="text-[10px] text-gray-400">({timeLabel})</span>}
                  </div>
                  <p className="text-[11px] text-gray-500">{stage.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DISPATCH & LOGISTICS INFO CARD */}
      <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 block">
            Carrier & Vehicle
          </span>
          <p className="font-extrabold text-gray-900">{order.logistics?.carrierName || 'GreenFreight Express Logistics'}</p>
          <p className="text-gray-500 text-[11px]">Vehicle: <span className="font-mono font-bold text-gray-700">{order.logistics?.vehicleNumber || 'TN-38-EX-8842'}</span></p>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 block">
            Assigned Driver
          </span>
          <p className="font-extrabold text-gray-900">{order.logistics?.driverName || 'R. Soundararajan'}</p>
          <p className="text-gray-500 text-[11px]">Contact: {order.logistics?.driverPhone || '+91 98401 22345'}</p>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 block">
            Transit Waypoint / ETA
          </span>
          <p className="font-extrabold text-emerald-800 flex items-center gap-1">
            <FiMapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>{order.logistics?.currentLocation?.address || 'NH-48 Industrial Corridor'}</span>
          </p>
          <p className="text-gray-500 text-[11px]">Distance: {order.distanceKm || 45} km &bull; ETA ~4.5 hrs</p>
        </div>
      </div>

      {/* INTERACTIVE ROLE ACTION CONTROLS */}
      <div className="p-6 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <FiShield className="text-emerald-700 w-4 h-4" /> Available Workflow Actions
          </h3>
          <span className="text-[11px] font-bold text-gray-500">
            Role: <span className="text-emerald-800 uppercase">{currentRole}</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          
          {/* SELLER ACTION BUTTONS */}
          {(isSeller || isAdmin) && (
            <>
              {activeIndex <= 1 && !isCancelled && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus('Seller Accepted', 'Order accepted and allocated to manufacturing schedule.')}
                    disabled={updating}
                    className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Accept Request
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('Cancelled', 'Seller declined the exchange request.')}
                    disabled={updating}
                    className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-extrabold text-xs rounded-xl border border-red-200 transition-colors cursor-pointer"
                  >
                    Reject Request
                  </button>
                </div>
              )}

              {activeIndex === 2 && (
                <button
                  onClick={() => handleUpdateStatus('Waste Prepared', 'Material analyzed, packaging certified, and staged for dispatch.')}
                  disabled={updating}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Mark Waste Prepared
                </button>
              )}

              {activeIndex === 3 && (
                <button
                  onClick={() => handleUpdateStatus('Pickup Scheduled', 'Logistics partner assigned and pickup window confirmed.')}
                  disabled={updating}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Schedule Freight Pickup
                </button>
              )}

              {activeIndex === 4 && (
                <button
                  onClick={() => handleUpdateStatus('In Transit', 'Shipment dispatched from facility on highway route.')}
                  disabled={updating}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Dispatch / Mark In Transit
                </button>
              )}

              {activeIndex === 5 && (
                <button
                  onClick={() => handleUpdateStatus('Delivered', 'Vehicle arrived and unloaded at recipient weighbridge.')}
                  disabled={updating}
                  className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Mark Delivered to Buyer
                </button>
              )}
            </>
          )}

          {/* BUYER ACTION BUTTONS */}
          {(isBuyer || isAdmin) && (
            <>
              {activeIndex === 6 && (
                <button
                  onClick={() => handleUpdateStatus('Completed', 'Buyer verified material weight and confirmed complete receipt.')}
                  disabled={updating}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Confirm Completion & Finalize Custody
                </button>
              )}

              {/* Review button available once delivered or completed */}
              {activeIndex >= 6 && (
                <button
                  onClick={onOpenReviewModal}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <FiStar className="w-4 h-4" />
                  <span>Rate Transaction & Seller</span>
                </button>
              )}

              {/* Dispute button available after receipt */}
              {activeIndex >= 5 && !isDisputed && (
                <button
                  onClick={onOpenDisputeModal}
                  className="px-4 py-2.5 bg-white hover:bg-red-50 text-red-700 font-extrabold text-xs rounded-xl border border-red-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <FiAlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Raise Quality Dispute</span>
                </button>
              )}
            </>
          )}

          {/* ADMIN OVERRIDE CONTROLS */}
          {isAdmin && (
            <div className="flex items-center gap-2 pt-2 sm:pt-0">
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800"
              >
                <option value="">Admin Override Status...</option>
                {ORDER_LIFECYCLE_STAGES.map(s => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
                <option value="Cancelled">Cancelled</option>
                <option value="Disputed">Disputed</option>
              </select>

              {targetStatus && (
                <button
                  onClick={() => handleUpdateStatus(targetStatus, 'Administrative status adjustment.')}
                  disabled={updating}
                  className="px-3 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Apply
                </button>
              )}
            </div>
          )}

        </div>
      </div>

      {/* STATUS TIMELINE HISTORY */}
      {order.statusHistory && order.statusHistory.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-2">
            <FiClock className="w-4 h-4 text-emerald-600" /> Audit Log & Status History
          </h4>
          <div className="space-y-2">
            {order.statusHistory.map((item, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-2xl border border-gray-200 text-xs flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                <div>
                  <span className="font-extrabold text-gray-900">{item.status}</span>
                  <span className="text-gray-500 font-medium ml-2">{item.note || item.title}</span>
                </div>
                <div className="text-[11px] text-gray-400 shrink-0 font-medium">
                  {new Date(item.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} &bull; {item.actor || 'System'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
