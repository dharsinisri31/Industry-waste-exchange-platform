import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
  FiGlobe, FiUsers, FiRefreshCw, FiTruck, FiArrowRight 
} from 'react-icons/fi';

export default function About() {
  const pillars = [
    {
      title: 'Circular Economy',
      desc: 'Transitioning industrial ecosystems from linear disposal to closed-loop resource reuse.',
      icon: FiRefreshCw
    },
    {
      title: 'Industrial Collaboration',
      desc: 'Enabling verified manufacturing plants to exchange materials securely and transparently.',
      icon: FiUsers
    },
    {
      title: 'Resource Recovery',
      desc: 'Diverting manufacturing by-products into productive secondary raw material streams.',
      icon: FiGlobe
    },
    {
      title: 'Sustainable Logistics',
      desc: 'Optimizing transport routes to minimize freight costs and transit-induced emissions.',
      icon: FiTruck
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8faf9] text-gray-900 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      <Navbar />

      {/* Header & Core Text */}
      <section className="bg-white py-16 px-4 sm:px-6 border-b border-gray-200">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight">
            About EcoLink
          </h1>
          <p className="text-gray-700 text-base sm:text-lg max-w-2xl mx-auto font-medium leading-relaxed">
            EcoLink is a prototype industrial resource exchange platform designed to help industries reuse waste materials by connecting suppliers with potential buyers.
          </p>
        </div>
      </section>

      {/* 4 Core Focus Areas */}
      <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto w-full space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-1">
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
            Key Focus Areas
          </h2>
          <p className="text-gray-600 text-xs font-medium">
            Core principles guiding the EcoLink exchange model.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {pillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="p-6 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3 hover:border-emerald-300 transition-all">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold text-gray-900">{item.title}</h3>
                <p className="text-xs text-gray-600 font-medium leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center pt-4">
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-2xs transition-all"
          >
            <span>Explore Secondary Materials</span>
            <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

