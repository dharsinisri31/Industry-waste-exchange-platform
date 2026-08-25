import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { 
  FiUploadCloud, FiSearch, FiCheckCircle, FiTruck, FiArrowRight, FiArrowDown 
} from 'react-icons/fi';

export default function HowItWorks() {
  const { user } = useAuth();

  const steps = [
    {
      num: '1',
      title: 'List Waste',
      desc: 'Seller uploads available industrial waste with quantity, quality, and location.',
      icon: FiUploadCloud
    },
    {
      num: '2',
      title: 'Find a Match',
      desc: 'The platform finds suitable buyers based on material compatibility and requirements.',
      icon: FiSearch
    },
    {
      num: '3',
      title: 'Exchange',
      desc: 'Buyer sends a request and seller accepts to establish the exchange agreement.',
      icon: FiCheckCircle
    },
    {
      num: '4',
      title: 'Deliver & Track',
      desc: 'Transport is planned and the exchange is completed with verifiable diversion records.',
      icon: FiTruck
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8faf9] text-gray-900 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      <Navbar />

      {/* Header */}
      <section className="bg-white py-16 px-4 sm:px-6 border-b border-gray-200">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight">
            How It Works
          </h1>
          <p className="text-gray-600 text-sm sm:text-base max-w-xl mx-auto font-medium">
            A simple 4-step workflow connecting industrial waste generators with secondary material buyers.
          </p>
        </div>
      </section>

      {/* 4-Step Linear Flow */}
      <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto w-full space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-2xs space-y-4 text-center md:text-left flex flex-col justify-between hover:border-emerald-300 transition-all">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 font-black text-base flex items-center justify-center border border-emerald-100 mx-auto md:mx-0">
                    {step.num}
                  </div>
                  <h3 className="text-base font-extrabold text-gray-900">{step.title}</h3>
                  <p className="text-xs text-gray-600 font-medium leading-relaxed">
                    {step.desc}
                  </p>
                </div>
                
                <div className="pt-3 border-t border-gray-100 flex justify-center md:justify-start">
                  <Icon className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Visual Workflow Diagram */}
        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-2xs space-y-6">
          <h2 className="text-lg font-black text-gray-900 text-center">
            Exchange Journey Flow
          </h2>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold text-center">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 w-full md:w-48">
              <span className="block font-black text-sm">1. Seller</span>
              <span className="text-[11px] text-gray-600 font-medium mt-0.5 block">Uploads Waste</span>
            </div>

            <div className="text-gray-400 font-bold text-lg hidden md:block">&rarr;</div>
            <div className="text-gray-400 font-bold text-lg md:hidden">&darr;</div>

            <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 w-full md:w-48">
              <span className="block font-black text-sm">2. Smart Match</span>
              <span className="text-[11px] text-gray-600 font-medium mt-0.5 block">Matches Buyers</span>
            </div>

            <div className="text-gray-400 font-bold text-lg hidden md:block">&rarr;</div>
            <div className="text-gray-400 font-bold text-lg md:hidden">&darr;</div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 w-full md:w-48">
              <span className="block font-black text-sm">3. Agreement</span>
              <span className="text-[11px] text-gray-600 font-medium mt-0.5 block">Request Accepted</span>
            </div>

            <div className="text-gray-400 font-bold text-lg hidden md:block">&rarr;</div>
            <div className="text-gray-400 font-bold text-lg md:hidden">&darr;</div>

            <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 w-full md:w-48">
              <span className="block font-black text-sm">4. Transport</span>
              <span className="text-[11px] text-gray-600 font-medium mt-0.5 block">Delivery & Diversion</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-4">
          <Link
            to={user ? "/marketplace" : "/register"}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-2xs transition-all"
          >
            <span>{user ? "Explore Marketplace" : "Get Started on EcoLink"}</span>
            <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

