import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import {
  User as UserIcon,
  LogOut,
  Settings,
  ChevronDown,
  Shield,
  Building,
  CheckCircle2,
  X,
} from 'lucide-react';

export const UserProfileDropdown: React.FC = () => {
  const { currentUser, userProfile, signOutUser, updateUserStore } = useAuth();
  const { dispatch } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Edit profile modal state
  const [name, setName] = useState(userProfile?.displayName || '');
  const [storeName, setStoreName] = useState(userProfile?.storeName || '');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.displayName);
      setStoreName(userProfile.storeName);
    }
  }, [userProfile]);

  if (!currentUser) return null;

  const initials = (userProfile?.displayName || currentUser.email || 'SM')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleSignOut = async () => {
    setDropdownOpen(false);
    try {
      await signOutUser();
      dispatch({
        type: 'ADD_TOAST',
        toast: {
          type: 'info',
          title: 'Signed Out',
          message: 'You have been safely signed out from StockFlow.',
        },
      });
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUserStore(name, storeName);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        setProfileModalOpen(false);
      }, 1200);
      dispatch({
        type: 'ADD_TOAST',
        toast: {
          type: 'success',
          title: 'Profile Updated',
          message: `Store manager profile saved.`,
        },
      });
    } catch (err: any) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 transition-colors shadow-xs"
        aria-label="User Profile"
      >
        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
          {initials}
        </div>
        <div className="hidden md:flex flex-col text-left">
          <span className="text-xs font-semibold text-slate-800 line-clamp-1 leading-tight">
            {userProfile?.displayName || 'Store Manager'}
          </span>
          <span className="text-[10px] text-slate-400 font-medium leading-tight">Store Manager</span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Header section with User Info */}
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-100">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {userProfile?.displayName || 'Store Manager'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-2 bg-slate-50 px-2 py-1 rounded-md text-[10px] text-slate-600 font-medium">
              <Shield className="w-3 h-3 text-indigo-600" />
              <span>Role: Store Manager</span>
            </div>
          </div>

          {/* Action Items */}
          <div className="p-1 space-y-0.5">
            <button
              onClick={() => {
                setDropdownOpen(false);
                setProfileModalOpen(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/60 rounded-xl transition-colors text-left"
            >
              <UserIcon className="w-4 h-4 text-slate-400" />
              <span>Manager Profile</span>
            </button>

            <button
              onClick={() => {
                setDropdownOpen(false);
                dispatch({ type: 'SET_ACTIVE_PAGE', page: 'settings' });
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/60 rounded-xl transition-colors text-left"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Store Settings</span>
            </button>
          </div>

          {/* Sign Out Action */}
          <div className="p-1 border-t border-slate-100 mt-1">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Sign Out Session</span>
            </button>
          </div>
        </div>
      )}

      {/* Edit Profile Dialog Modal */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Store Manager Profile</h3>
                  <p className="text-xs text-slate-500">Firebase Authenticated Identity</p>
                </div>
              </div>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Manager Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Store / Retail Outlet Name
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Authenticated Email (Read-Only)
                </label>
                <input
                  type="email"
                  disabled
                  value={currentUser.email || ''}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm text-slate-500 bg-slate-50 cursor-not-allowed"
                />
              </div>

              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs text-indigo-700 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Multi-User Isolated Tenant: ID <strong>{currentUser.uid.slice(0, 10)}...</strong></span>
              </div>

              {savedSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Profile updated successfully!</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
