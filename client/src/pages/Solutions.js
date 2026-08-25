import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
  FiLayers, FiCpu, FiTrendingUp, FiNavigation, 
  FiShield, FiGlobe, FiTool, FiCheckCircle, FiArrowRight 
} from 'react-icons/fi';

export default function Solutions() {
  return (
    <div className="min-h-screen bg-[#f8faf9] text-gray-900 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      <Navbar />

      {/* Hero Header */}
      <section className="bg-gradient-to-b from-emerald-50/70 via-white to-[#f8faf9] py-16 px-4 sm:px-6 border-b border-gray-200">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold uppercase tracking-wider">
            <span>Enterprise Solutions</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight">
            Comprehensive Solutions for Industrial Symbiosis
          </h1>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto font-medium">
            Bridging waste generators, secondary material consumers, and logistics infrastructure with enterprise-grade circular technology.
          </p>
        </div>
      </section>

      {/* 4 Core Solutions Grid */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full space-y-16">
        
        {/* Solution 1: Waste Generators */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center bg-white p-8 sm:p-10 rounded-3xl border border-gray-200 shadow-sm">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              <FiLayers className="w-3.5 h-3.5" />
              <span>For Waste Generators & Manufacturers</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Transform By-Product Liabilities into Revenue Streams
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
              Eliminate landfill disposal expenses while monetizing process waste. EcoLink provides automated material classification, dynamic market valuation, and direct access to verified circular buyers.
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs font-semibold text-gray-700">
              <li className="flex items-center gap-2"><FiCheckCircle className="text-emerald-600 shrink-0" /> Computer vision material grading</li>
              <li className="flex items-center gap-2"><FiCheckCircle className="text-emerald-600 shrink-0" /> Fair-value market regression models</li>
              <li className="flex items-center gap-2"><FiCheckCircle className="text-emerald-600 shrink-0" /> Inbound exchange negotiation portal</li>
              <li className="flex items-center gap-2"><FiCheckCircle className="text-emerald-600 shrink-0" /> Automated Scope 3 carbon savings</li>
            </ul>
            <div className="pt-2">
              <Link to="/signup" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all">
                <span>Start Listing By-Products</span>
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5 h-64 rounded-2xl overflow-hidden border border-gray-200 shadow-xs bg-gray-100">
            <img
              src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=700&q=80"
              alt="Industrial Manufacturing Facility"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Solution 2: Secondary Material Buyers & Recyclers */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center bg-white p-8 sm:p-10 rounded-3xl border border-gray-200 shadow-sm">
          <div className="lg:col-span-5 order-2 lg:order-1 h-64 rounded-2xl overflow-hidden border border-gray-200 shadow-xs bg-gray-100">
            <img
              src="https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=700&q=80"
              alt="Material Processing and Recycling"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="lg:col-span-7 order-1 lg:order-2 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200">
              <FiTrendingUp className="w-3.5 h-3.5" />
              <span>For Recyclers & Secondary Feedstock Buyers</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Secure Reliable, Cost-Effective Secondary Raw Materials
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
              Reduce dependency on virgin raw materials with high-purity, verified secondary feedstock. Post persistent material requirements and receive algorithmic match recommendations.
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs font-semibold text-gray-700">
              <li className="flex items-center gap-2"><FiCheckCircle className="text-teal-600 shrink-0" /> Multi-criteria geospatial filtering</li>
              <li className="flex items-center gap-2"><FiCheckCircle className="text-teal-600 shrink-0" /> Purity and contamination verification</li>
              <li className="flex items-center gap-2"><FiCheckCircle className="text-teal-600 shrink-0" /> Predictable recurring procurement streams</li>
              <li className="flex items-center gap-2"><FiCheckCircle className="text-teal-600 shrink-0" /> Verified chain-of-custody tracking</li>
            </ul>
            <div className="pt-2">
              <Link to="/marketplace" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition-all">
                <span>Explore Sourcing Opportunities</span>
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Solution 3: Equipment Sharing & Pre-Processing */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center bg-white p-8 sm:p-10 rounded-3xl border border-gray-200 shadow-sm">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              <FiTool className="w-3.5 h-3.5" />
              <span>Equipment Sharing & Pre-Processing Infrastructure</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              On-Demand Access to Heavy Industrial Processing Machinery
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
              Eliminate CapEx bottlenecks. Rent industrial shredders, extruders, ball mills, and compactors from regional facility partners to condition by-products before recycling.
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs font-semibold text-gray-700">
              <li className="flex items-center gap-2"><FiCheckCircle className="text-emerald-600 shrink-0" /> Hourly & daily equipment booking</li>
              <li className="flex items-center gap-2"><FiCheckCircle className="text-emerald-600 shrink-0" /> Waste-to-equipment compatibility engine</li>
              <li className="flex items-center gap-2"><FiCheckCircle className="text-emerald-600 shrink-0" /> Monetization of idle machine hours</li>
              <li className="flex items-center gap-2"><FiCheckCircle className="text-emerald-600 shrink-0" /> Verified maintenance & safety protocols</li>
            </ul>
            <div className="pt-2">
              <Link to="/signup" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all">
                <span>Access Equipment Hub</span>
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5 h-64 rounded-2xl overflow-hidden border border-gray-200 shadow-xs bg-gray-100">
            <img
              src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=700&q=80"
              alt="Industrial Processing Machinery"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Solution 4: Regulatory Compliance & ESG Governance */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center bg-white p-8 sm:p-10 rounded-3xl border border-gray-200 shadow-sm">
          <div className="lg:col-span-5 order-2 lg:order-1 h-64 rounded-2xl overflow-hidden border border-gray-200 shadow-xs bg-gray-100">
            <img
              src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=700&q=80"
              alt="Compliance Auditing and ESG Reporting"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="lg:col-span-7 order-1 lg:order-2 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200">
              <FiShield className="w-3.5 h-3.5" />
              <span>ESG Governance & Regulatory Compliance</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Audit-Ready Sustainability & Environmental Policy Compliance
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
              Navigate Ministry of Environment and Hazardous Waste management statutory guidelines with our RAG-grounded regulatory assistant and immutable digital resource passports.
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs font-semibold text-gray-700">
              <li className="flex items-center gap-2"><FiCheckCircle className="text-teal-600 shrink-0" /> Grounded regulatory policy assistant</li>
              <li className="flex items-center gap-2"><FiCheckCircle className="text-teal-600 shrink-0" /> QR-coded chain-of-custody passports</li>
              <li className="flex items-center gap-2"><FiCheckCircle className="text-teal-600 shrink-0" /> Certified net CO₂e emissions reduction</li>
              <li className="flex items-center gap-2"><FiCheckCircle className="text-teal-600 shrink-0" /> Hazardous waste rule adherence</li>
            </ul>
            <div className="pt-2">
              <Link to="/contact" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition-all">
                <span>Request ESG Consultation</span>
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

      </section>

      {/* Bottom CTA */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 rounded-3xl p-10 sm:p-14 text-white text-center space-y-6 shadow-xl">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Equip Your Facility with EcoLink Today
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm max-w-xl mx-auto font-medium">
            Contact our circular industrial engineers to assess your plant’s by-product exchange potential.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Link
              to="/signup"
              className="px-8 py-3.5 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 font-extrabold text-xs shadow-md transition-all"
            >
              Get Started Free
            </Link>
            <Link
              to="/contact"
              className="px-8 py-3.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-800 text-white font-extrabold text-xs border border-emerald-500 shadow-xs transition-all"
            >
              Schedule Platform Demo
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
