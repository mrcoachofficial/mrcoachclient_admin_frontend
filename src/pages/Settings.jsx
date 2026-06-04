import { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings as SettingsIcon, Shield, Lock, Bell, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Settings() {
  const [name, setName] = useState('Super Admin');
  const [email, setEmail] = useState('admin@mrcoach.in');
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState({ success: null, message: '' });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // App Config States
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [sendNotifications, setSendNotifications] = useState(true);
  const [rewardsEnabled, setRewardsEnabled] = useState(true);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const response = await axios.get(`${window.API_BASE_URL}/api/admin/config`);
      setMaintenanceMode(response.data.maintenanceMode);
      setSendNotifications(response.data.sendNotifications);
      setRewardsEnabled(response.data.rewardsEnabled);
    } catch (error) {
      console.error('Error fetching system configurations:', error);
    }
  };

  const handleToggleConfig = async (key, currentValue) => {
    const newValue = !currentValue;
    if (key === 'maintenanceMode') {
      setMaintenanceMode(newValue);
    } else if (key === 'rewardsEnabled') {
      setRewardsEnabled(newValue);
    } else {
      setSendNotifications(newValue);
    }

    try {
      await axios.put(`${window.API_BASE_URL}/api/admin/config`, {
        key,
        value: newValue
      });
    } catch (error) {
      console.error(`Error updating configuration ${key}:`, error);
      // Revert if failed
      if (key === 'maintenanceMode') {
        setMaintenanceMode(currentValue);
      } else if (key === 'rewardsEnabled') {
        setRewardsEnabled(currentValue);
      } else {
        setSendNotifications(currentValue);
      }
      alert('Failed to save configuration change');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordStatus({ success: null, message: '' });

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ success: false, message: 'New passwords do not match' });
      return;
    }

    setUpdatingPassword(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`${window.API_BASE_URL}/api/admin/change-password`, {
        currentPassword,
        newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPasswordStatus({ success: true, message: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordStatus({
        success: false,
        message: error.response?.data?.message || 'Failed to update password'
      });
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-textMain mb-1">Admin Settings</h1>
        <p className="text-textMuted text-sm">Configure system preferences and update security profiles.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation Sidebar inside Settings */}
        <div className="glass rounded-2xl p-4 border border-borderLine/50 h-fit space-y-1">
          <button className="w-full text-left px-4 py-3 rounded-xl bg-primary/10 text-primary font-semibold text-sm flex items-center gap-3">
            <Shield className="w-4 h-4" /> Account & Security
          </button>
          <button className="w-full text-left px-4 py-3 rounded-xl text-textMuted hover:bg-surfaceLight/50 hover:text-textMain font-medium text-sm flex items-center gap-3 transition-colors">
            <Bell className="w-4 h-4" /> Notifications
          </button>
          <button className="w-full text-left px-4 py-3 rounded-xl text-textMuted hover:bg-surfaceLight/50 hover:text-textMain font-medium text-sm flex items-center gap-3 transition-colors">
            <SettingsIcon className="w-4 h-4" /> App Configurations
          </button>
        </div>

        {/* Configurations Panel */}
        <div className="md:col-span-2 space-y-8">
          {/* Account Profile Details */}
          <div className="glass rounded-2xl p-6 border border-borderLine/50">
            <h2 className="text-lg font-bold text-textMain mb-6 flex items-center gap-2 border-b border-borderLine/50 pb-3">
              Admin Profile
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-textMuted mb-1.5 ml-1">Administrator Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50" 
                />
              </div>
              <div>
                <label className="block text-xs text-textMuted mb-1.5 ml-1">Support Email</label>
                <input 
                  type="email" 
                  value={email} 
                  disabled
                  className="w-full bg-surfaceLight/20 border border-borderLine text-textMuted/70 text-sm rounded-xl py-3 px-4 cursor-not-allowed" 
                />
              </div>
            </div>
          </div>

          {/* Password Security Form */}
          <div className="glass rounded-2xl p-6 border border-borderLine/50">
            <h2 className="text-lg font-bold text-textMain mb-6 flex items-center gap-2 border-b border-borderLine/50 pb-3">
              <Lock className="w-5 h-5 text-primary" /> Update Password
            </h2>

            {passwordStatus.message && (
              <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm border ${
                passwordStatus.success 
                  ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                {passwordStatus.success ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                {passwordStatus.message}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs text-textMuted mb-1.5 ml-1">Current Password</label>
                <input 
                  type="password" 
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)} 
                  required
                  placeholder="••••••••"
                  className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50" 
                />
              </div>
              <div>
                <label className="block text-xs text-textMuted mb-1.5 ml-1">New Password</label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required
                  placeholder="••••••••"
                  className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50" 
                />
              </div>
              <div>
                <label className="block text-xs text-textMuted mb-1.5 ml-1">Confirm New Password</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required
                  placeholder="••••••••"
                  className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50" 
                />
              </div>

              <button
                type="submit"
                disabled={updatingPassword}
                className="bg-primary hover:bg-primaryHover text-[#09090B] font-bold rounded-xl px-6 py-3 mt-2 transition-all disabled:opacity-50"
              >
                {updatingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

          {/* App config (System preferences) */}
          <div className="glass rounded-2xl p-6 border border-borderLine/50">
            <h2 className="text-lg font-bold text-textMain mb-6 flex items-center gap-2 border-b border-borderLine/50 pb-3">
              System Configurations
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-textMain text-sm">Maintenance Mode</h3>
                  <p className="text-xs text-textMuted">Temporarily disable booking and client portals for backend upgrades.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={maintenanceMode} 
                    onChange={() => handleToggleConfig('maintenanceMode', maintenanceMode)} 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-surfaceLight peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-textMuted after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-checked:after:bg-[#09090B]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between border-t border-borderLine/50 pt-4">
                <div>
                  <h3 className="font-semibold text-textMain text-sm">System Audit Notifications</h3>
                  <p className="text-xs text-textMuted">Send automated notification logs to Admin support email on new lead generation.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={sendNotifications} 
                    onChange={() => handleToggleConfig('sendNotifications', sendNotifications)} 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-surfaceLight peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-textMuted after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-checked:after:bg-[#09090B]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between border-t border-borderLine/50 pt-4">
                <div>
                  <h3 className="font-semibold text-textMain text-sm">Booking Rewards (Scratch Cards)</h3>
                  <p className="text-xs text-textMuted">Enable users to win scratch card rewards of ₹100 on successful booking.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={rewardsEnabled} 
                    onChange={() => handleToggleConfig('rewardsEnabled', rewardsEnabled)} 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-surfaceLight peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-textMuted after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-checked:after:bg-[#09090B]"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
