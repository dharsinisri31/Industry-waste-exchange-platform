import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiLogOut, FiZap, FiUser, FiArrowRight 
} from 'react-icons/fi';

export default function Navbar() {
  const { user, profile, logout, isSellerMode, isBuyerMode, switchRole, canonicalRole } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isAdminUser = user?.role === 'admin' || user?.canonicalRole === 'ADMIN' || canonicalRole === 'ADMIN';

  return (
    <nav className={`sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#DDE7E2] transition-all duration-300 font-sans ${
      isScrolled ? 'h-14 shadow-md' : 'h-16 shadow-2xs'
    }`}>
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
        
        {/* Left: Brand Logo */}
        <Link to={user ? (isAdminUser ? '/admin/dashboard' : '/dashboard') : '/'} className="flex items-center gap-2.5 group shrink-0">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-[#009B6B] to-teal-600 text-white shadow-2xs group-hover:scale-105 transition-all">
            <FiZap className="w-5 h-5 fill-current" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-black tracking-tight text-[#12233F] group-hover:text-[#009B6B] transition-colors leading-none">
              Eco<span className="text-[#009B6B]">Link</span>
            </span>
            <span className="text-[9px] text-[#009B6B] tracking-wider uppercase font-extrabold block mt-0.5">
              INDUSTRIAL EXCHANGE
            </span>
          </div>
        </Link>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            /* Logged-In State */
            <div className="flex items-center gap-2.5">
              
              {/* Role Badge / Switcher - For Industry Users only */}
              {!isAdminUser ? (
                <div className="flex items-center p-1 bg-[#F6F8F7] rounded-xl border border-[#DDE7E2] text-xs">
                  <button
                    onClick={() => switchRole('seller')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                      isSellerMode
                        ? 'bg-[#009B6B] text-white shadow-2xs'
                        : 'text-[#12233F]/70 hover:text-[#12233F]'
                    }`}
                  >
                    Seller
                  </button>
                  <button
                    onClick={() => switchRole('buyer')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                      isBuyerMode
                        ? 'bg-teal-700 text-white shadow-2xs'
                        : 'text-[#12233F]/70 hover:text-[#12233F]'
                    }`}
                  >
                    Buyer
                  </button>
                </div>
              ) : (
                <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-[#EAF8F2] text-[#009B6B] border border-[#DDE7E2]">
                  Admin
                </span>
              )}

              {/* Profile Link */}
              <Link
                to={isAdminUser ? '/admin/profile' : '/profile'}
                className="p-2 rounded-xl bg-[#F6F8F7] hover:bg-gray-100 text-[#12233F] transition-all border border-[#DDE7E2]"
                title="Account Profile"
              >
                <FiUser className="w-4 h-4" />
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl bg-[#F6F8F7] hover:bg-red-50 hover:text-red-600 text-[#12233F] transition-all border border-[#DDE7E2] cursor-pointer"
                title="Sign Out"
              >
                <FiLogOut className="w-4 h-4" />
              </button>

            </div>
          ) : (
            /* Unauthenticated Visitor State: Simple Login | Register */
            <div className="flex items-center gap-2.5">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#12233F] hover:text-[#009B6B] hover:bg-[#F6F8F7] border border-[#DDE7E2] transition-all"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#009B6B] hover:bg-emerald-700 text-white shadow-2xs transition-all flex items-center gap-1.5"
              >
                <span>Register</span>
                <FiArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}

