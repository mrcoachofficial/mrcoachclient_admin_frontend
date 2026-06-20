import { useState, useEffect } from 'react';
import { Gift, Search, PlusCircle, CheckCircle, Clock, Trash2, ShieldAlert, Play, Pause, Users, Calendar } from 'lucide-react';
import axios from 'axios';
import clsx from 'clsx';

export default function RewardsCMS() {
  const [activeTab, setActiveTab] = useState('campaigns'); // 'campaigns' or 'challenges'
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rewardsEnabled, setRewardsEnabled] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Cashback Campaigns Form states
  const [campaignType, setCampaignType] = useState('global');
  const [targetEmail, setTargetEmail] = useState('');
  const [rewardAmount, setRewardAmount] = useState(100);
  const [title, setTitle] = useState('₹100 Cashback');
  const [subTitle, setSubTitle] = useState('Cashback');
  const [condition, setCondition] = useState('On next booking');
  const [theme, setTheme] = useState('gold');
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [minBookingAmount, setMinBookingAmount] = useState(0);
  const [usageLimit, setUsageLimit] = useState(1);

  const [formStatus, setFormStatus] = useState({ success: null, message: '' });
  const [submitting, setSubmitting] = useState(false);

  // Challenges states
  const [challenges, setChallenges] = useState([]);
  const [challengeTitle, setChallengeTitle] = useState('');
  const [challengeType, setChallengeType] = useState('Weekly');
  const [challengeActivity, setChallengeActivity] = useState('Walking');
  const [challengeTarget, setChallengeTarget] = useState(15);
  const [challengeReward, setChallengeReward] = useState(100);
  const [editingChallengeId, setEditingChallengeId] = useState(null);

  useEffect(() => {
    fetchCampaigns();
    fetchConfigs();
    fetchChallenges();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${window.API_BASE_URL}/api/rewards/admin/campaigns`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCampaigns(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setLoading(false);
    }
  };

  const fetchConfigs = async () => {
    try {
      const response = await axios.get(`${window.API_BASE_URL}/api/admin/config`);
      setRewardsEnabled(response.data.rewardsEnabled);
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const fetchChallenges = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${window.API_BASE_URL}/api/rewards/admin/challenges`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChallenges(response.data);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    setFormStatus({ success: null, message: '' });
    setSubmitting(true);

    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${window.API_BASE_URL}/api/rewards/admin/campaigns`, {
        title,
        subTitle,
        rewardAmount: Number(rewardAmount),
        theme,
        condition,
        expiryDate,
        campaignType,
        targetEmail: campaignType === 'single' ? targetEmail : '',
        minBookingAmount: Number(minBookingAmount),
        usageLimit: Number(usageLimit)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFormStatus({ success: true, message: 'Reward campaign successfully launched!' });
      setTargetEmail('');
      fetchCampaigns();
    } catch (error) {
      setFormStatus({
        success: false,
        message: error.response?.data?.message || 'Failed to launch reward campaign'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      await axios.put(`${window.API_BASE_URL}/api/rewards/admin/campaigns/${id}/status`, {
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCampaigns();
    } catch (error) {
      console.error('Error toggling campaign status:', error);
    }
  };

  const handleDeleteCampaign = async (id) => {
    if (!window.confirm('Are you sure you want to delete this campaign? Associated scratch cards will be deleted.')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${window.API_BASE_URL}/api/rewards/admin/campaigns/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  };

  // Challenges Handlers
  const handleSaveChallenge = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const payload = {
        title: challengeTitle,
        type: challengeType,
        activityType: challengeActivity,
        target: Number(challengeTarget),
        rewardCoins: Number(challengeReward)
      };

      if (editingChallengeId) {
        await axios.put(`${window.API_BASE_URL}/api/rewards/admin/challenges/${editingChallengeId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${window.API_BASE_URL}/api/rewards/admin/challenges`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setChallengeTitle('');
      setEditingChallengeId(null);
      fetchChallenges();
    } catch (error) {
      console.error('Error saving challenge:', error);
    }
  };

  const handleEditChallengeClick = (ch) => {
    setEditingChallengeId(ch._id);
    setChallengeTitle(ch.title);
    setChallengeType(ch.type);
    setChallengeActivity(ch.activityType);
    setChallengeTarget(ch.target);
    setChallengeReward(ch.rewardCoins);
  };

  const handleDeleteChallenge = async (id) => {
    if (!window.confirm('Are you sure you want to delete this challenge? User progress data will be removed.')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${window.API_BASE_URL}/api/rewards/admin/challenges/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchChallenges();
    } catch (error) {
      console.error('Error deleting challenge:', error);
    }
  };

  const handleToggleChallengeActive = async (ch) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`${window.API_BASE_URL}/api/rewards/admin/challenges/${ch._id}`, {
        isActive: !ch.isActive
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchChallenges();
    } catch (error) {
      console.error('Error toggling challenge active status:', error);
    }
  };

  const filteredCampaigns = campaigns.filter(c => {
    const search = searchTerm.toLowerCase();
    return (
      c.title?.toLowerCase().includes(search) ||
      c.subTitle?.toLowerCase().includes(search) ||
      c.condition?.toLowerCase().includes(search) ||
      c.campaignType?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-textMain mb-1">Rewards & Challenges CMS</h1>
          <p className="text-textMuted text-sm">Configure marketing cashback campaigns, coin balances, and fit challenges.</p>
        </div>
        <div className={clsx(
          "flex items-center gap-2 px-4 py-2 rounded-xl border text-sm",
          rewardsEnabled 
            ? "bg-green-500/10 border-green-500/20 text-green-400" 
            : "bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
        )}>
          <Gift className="w-4 h-4" />
          <span>Rewards System: <strong>{rewardsEnabled ? 'ACTIVE' : 'DISABLED'}</strong></span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-6 border-b border-borderLine mb-8">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={clsx(
            "pb-3 text-sm font-bold border-b-2 transition-all px-2",
            activeTab === 'campaigns'
              ? "border-primary text-primary"
              : "border-transparent text-textMuted hover:text-textMain"
          )}
        >
          Cashback Campaigns
        </button>
        <button
          onClick={() => setActiveTab('challenges')}
          className={clsx(
            "pb-3 text-sm font-bold border-b-2 transition-all px-2",
            activeTab === 'challenges'
              ? "border-primary text-primary"
              : "border-transparent text-textMuted hover:text-textMain"
          )}
        >
          Weekly & Monthly Challenges
        </button>
      </div>

      {activeTab === 'campaigns' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Form */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass rounded-2xl p-6 border border-borderLine/50">
              <h2 className="text-lg font-bold text-textMain mb-6 flex items-center gap-2 border-b border-borderLine/50 pb-3">
                <PlusCircle className="w-5 h-5 text-primary" /> Create Reward Campaign
              </h2>

              {formStatus.message && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm border ${
                  formStatus.success 
                    ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                  {formStatus.success ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <ShieldAlert className="w-5 h-5 flex-shrink-0" />}
                  <span className="leading-normal">{formStatus.message}</span>
                </div>
              )}

              <form onSubmit={handleCreateCampaign} className="space-y-4">
                <div>
                  <label className="block text-xs text-textMuted mb-1.5 ml-1">Campaign Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCampaignType('global')}
                      className={clsx(
                        "py-2 px-3 text-xs font-semibold rounded-xl border transition-all",
                        campaignType === 'global'
                          ? "bg-primary border-primary text-[#09090B]"
                          : "bg-surfaceLight/30 border-borderLine text-textMuted hover:text-textMain"
                      )}
                    >
                      Global Campaign
                    </button>
                    <button
                      type="button"
                      onClick={() => setCampaignType('single')}
                      className={clsx(
                        "py-2 px-3 text-xs font-semibold rounded-xl border transition-all",
                        campaignType === 'single'
                          ? "bg-primary border-primary text-[#09090B]"
                          : "bg-surfaceLight/30 border-borderLine text-textMuted hover:text-textMain"
                      )}
                    >
                      Single User Reward
                    </button>
                  </div>
                </div>

                {campaignType === 'single' && (
                  <div>
                    <label className="block text-xs text-textMuted mb-1.5 ml-1">Target User Email</label>
                    <input 
                      type="email" 
                      value={targetEmail}
                      onChange={(e) => setTargetEmail(e.target.value)}
                      placeholder="user@example.com"
                      required
                      className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50" 
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-textMuted mb-1.5 ml-1">Cash Value (₹)</label>
                    <input 
                      type="number" 
                      value={rewardAmount}
                      onChange={(e) => {
                        setRewardAmount(e.target.value);
                        setTitle(`₹${e.target.value} Cashback`);
                      }}
                      min="1"
                      required
                      className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-textMuted mb-1.5 ml-1">Theme (Color)</label>
                    <select 
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50"
                    >
                      <option value="gold" className="bg-surface text-textMain">Gold (Default)</option>
                      <option value="blue" className="bg-surface text-textMain">Blue</option>
                      <option value="green" className="bg-surface text-textMain">Green</option>
                      <option value="purple" className="bg-surface text-textMain">Purple</option>
                      <option value="red" className="bg-surface text-textMain">Red</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-textMuted mb-1.5 ml-1">Card Main Title</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="₹100 Cashback"
                    required
                    className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-textMuted mb-1.5 ml-1">Card Subtitle</label>
                    <input 
                      type="text" 
                      value={subTitle}
                      onChange={(e) => setSubTitle(e.target.value)}
                      placeholder="Cashback"
                      required
                      className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-textMuted mb-1.5 ml-1">Expiry Date</label>
                    <input 
                      type="date" 
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      required
                      className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-textMuted mb-1.5 ml-1">Min Booking (₹)</label>
                    <input 
                      type="number" 
                      value={minBookingAmount}
                      onChange={(e) => setMinBookingAmount(e.target.value)}
                      min="0"
                      required
                      className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-textMuted mb-1.5 ml-1">Usage Limit</label>
                    <input 
                      type="number" 
                      value={usageLimit}
                      onChange={(e) => setUsageLimit(e.target.value)}
                      min="1"
                      required
                      className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-textMuted mb-1.5 ml-1">Condition Description</label>
                  <input 
                    type="text" 
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    placeholder="On next booking"
                    required
                    className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50" 
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary hover:bg-primaryHover text-[#09090B] font-bold rounded-xl py-3.5 mt-2 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? 'Launching...' : 'Launch Campaign'}
                </button>
              </form>
            </div>
          </div>

          {/* List of campaigns */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass rounded-2xl overflow-hidden border border-borderLine/50">
              {/* Toolbar */}
              <div className="flex items-center justify-between p-4 border-b border-borderLine bg-surfaceLight/30">
                <h3 className="font-bold text-textMain text-md">Active Campaigns</h3>
                <div className="relative w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
                  <input 
                    type="text" 
                    placeholder="Search campaigns..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-surface border border-borderLine rounded-lg py-2 pl-9 pr-4 text-sm text-textMain placeholder:text-textMuted focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-borderLine bg-surfaceLight/20 text-textMuted text-xs uppercase tracking-wider">
                      <th className="p-4 font-medium">Campaign / Offer</th>
                      <th className="p-4 font-medium">Target & Expiry</th>
                      <th className="p-4 font-medium">Analytics</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borderLine/50 text-sm">
                    {loading ? (
                      <tr><td colSpan="5" className="p-8 text-center text-textMuted">Loading campaigns...</td></tr>
                    ) : filteredCampaigns.length === 0 ? (
                      <tr><td colSpan="5" className="p-8 text-center text-textMuted">No campaigns found.</td></tr>
                    ) : filteredCampaigns.map((c) => (
                      <tr key={c._id} className="hover:bg-surfaceLight/30 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-textMain">{c.title}</p>
                          <p className="text-xs text-textMuted">{c.subTitle}</p>
                          <p className="text-[11px] text-primary mt-1">{c.condition}</p>
                        </td>
                        <td className="p-4">
                          <span className={clsx(
                            "inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold border",
                            c.campaignType === 'global' 
                              ? "bg-blue-500/10 border-blue-500/20 text-blue-400" 
                              : "bg-purple-500/10 border-purple-500/20 text-purple-400"
                          )}>
                            {c.campaignType === 'global' ? 'Global Campaign' : `Single: ${c.targetEmail}`}
                          </span>
                          <div className="flex items-center gap-1 text-[11px] text-textMuted mt-2">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Exp: {new Date(c.expiryDate).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="p-4 text-xs space-y-1">
                          <div className="flex justify-between w-36">
                            <span className="text-textMuted">Reached:</span>
                            <span className="font-bold text-textMain">{c.totalReached}</span>
                          </div>
                          <div className="flex justify-between w-36">
                            <span className="text-textMuted">Redeemed:</span>
                            <span className="font-bold text-green-400">{c.redeemedCount}</span>
                          </div>
                          <div className="flex justify-between w-36 border-t border-borderLine/30 pt-1">
                            <span className="text-textMuted">Remaining:</span>
                            <span className="font-bold text-yellow-500">{c.remainingUsers}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          {c.isExpired ? (
                            <span className="inline-flex items-center gap-1 text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full text-xs font-semibold border border-red-500/20">
                              Expired
                            </span>
                          ) : c.status === 'active' ? (
                            <span className="inline-flex items-center gap-1 text-green-400 bg-green-500/10 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-green-500/20">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-yellow-500/20">
                              Paused
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {!c.isExpired && (
                              <button
                                onClick={() => handleToggleStatus(c._id, c.status)}
                                title={c.status === 'active' ? 'Pause Campaign' : 'Resume Campaign'}
                                className={clsx(
                                  "p-2 rounded-lg border transition-all",
                                  c.status === 'active' 
                                    ? "bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/20 text-yellow-500" 
                                    : "bg-green-500/10 hover:bg-green-500/20 border-green-500/20 text-green-400"
                                )}
                              >
                                {c.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteCampaign(c._id)}
                              title="Delete Campaign"
                              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create/Edit Challenge Form */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass rounded-2xl p-6 border border-borderLine/50">
              <h2 className="text-lg font-bold text-textMain mb-6 flex items-center gap-2 border-b border-borderLine/50 pb-3">
                <PlusCircle className="w-5 h-5 text-primary" /> {editingChallengeId ? 'Edit Challenge' : 'Create Challenge'}
              </h2>

              <form onSubmit={handleSaveChallenge} className="space-y-4">
                <div>
                  <label className="block text-xs text-textMuted mb-1.5 ml-1">Challenge Title</label>
                  <input 
                    type="text" 
                    value={challengeTitle}
                    onChange={(e) => setChallengeTitle(e.target.value)}
                    placeholder="e.g. Weekly Walking Challenge"
                    required
                    className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-textMuted mb-1.5 ml-1">Frequency</label>
                    <select 
                      value={challengeType}
                      onChange={(e) => {
                        setChallengeType(e.target.value);
                        if (e.target.value === 'Weekly') {
                          setChallengeTarget(15);
                          setChallengeReward(100);
                        } else {
                          setChallengeTarget(60);
                          setChallengeReward(500);
                        }
                      }}
                      className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50"
                    >
                      <option value="Weekly" className="bg-surface text-textMain">Weekly</option>
                      <option value="Monthly" className="bg-surface text-textMain">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-textMuted mb-1.5 ml-1">Activity Type</label>
                    <select 
                      value={challengeActivity}
                      onChange={(e) => setChallengeActivity(e.target.value)}
                      className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50"
                    >
                      <option value="Walking" className="bg-surface text-textMain">Walking</option>
                      <option value="Running" className="bg-surface text-textMain">Running</option>
                      <option value="Cycling" className="bg-surface text-textMain">Cycling</option>
                      <option value="Other" className="bg-surface text-textMain">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-textMuted mb-1.5 ml-1">Target (km)</label>
                    <input 
                      type="number" 
                      value={challengeTarget}
                      onChange={(e) => setChallengeTarget(e.target.value)}
                      min="1"
                      required
                      className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-textMuted mb-1.5 ml-1">Reward (Coins)</label>
                    <input 
                      type="number" 
                      value={challengeReward}
                      onChange={(e) => setChallengeReward(e.target.value)}
                      min="1"
                      required
                      className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50" 
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primaryHover text-[#09090B] font-bold rounded-xl py-3 transition-all flex items-center justify-center gap-2"
                  >
                    {editingChallengeId ? 'Update Challenge' : 'Create Challenge'}
                  </button>
                  {editingChallengeId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingChallengeId(null);
                        setChallengeTitle('');
                        setChallengeType('Weekly');
                        setChallengeActivity('Walking');
                        setChallengeTarget(15);
                        setChallengeReward(100);
                      }}
                      className="bg-surfaceLight border border-borderLine hover:bg-surfaceLight/75 text-textMain font-bold rounded-xl py-3 px-4 transition-all"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* List of Challenges */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass rounded-2xl overflow-hidden border border-borderLine/50">
              <div className="flex items-center justify-between p-4 border-b border-borderLine bg-surfaceLight/30">
                <h3 className="font-bold text-textMain text-md">Active Challenges</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-borderLine bg-surfaceLight/20 text-textMuted text-xs uppercase tracking-wider">
                      <th className="p-4 font-medium">Challenge Title</th>
                      <th className="p-4 font-medium">Type</th>
                      <th className="p-4 font-medium">Target</th>
                      <th className="p-4 font-medium">Reward</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borderLine/50 text-sm">
                    {challenges.length === 0 ? (
                      <tr><td colSpan="6" className="p-8 text-center text-textMuted">No challenges configured.</td></tr>
                    ) : challenges.map((ch) => (
                      <tr key={ch._id} className="hover:bg-surfaceLight/30 transition-colors">
                        <td className="p-4 font-bold text-textMain">{ch.title}</td>
                        <td className="p-4">
                          <span className={clsx(
                            "inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold border",
                            ch.type === 'Weekly' 
                              ? "bg-blue-500/10 border-blue-500/20 text-blue-400" 
                              : "bg-purple-500/10 border-purple-500/20 text-purple-400"
                          )}>
                            {ch.type}
                          </span>
                        </td>
                        <td className="p-4 text-textMain font-semibold">{ch.target} km ({ch.activityType})</td>
                        <td className="p-4 text-yellow-500 font-bold">{ch.rewardCoins} Coins</td>
                        <td className="p-4">
                          <span className={clsx(
                            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                            ch.isActive 
                              ? "text-green-400 bg-green-500/10 border-green-500/20" 
                              : "text-yellow-500 bg-yellow-500/10 border-yellow-500/20"
                          )}>
                            {ch.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleToggleChallengeActive(ch)}
                              title={ch.isActive ? 'Disable Challenge' : 'Enable Challenge'}
                              className={clsx(
                                "p-2 rounded-lg border transition-all",
                                ch.isActive 
                                  ? "bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/20 text-yellow-500" 
                                  : "bg-green-500/10 hover:bg-green-500/20 border-green-500/20 text-green-400"
                              )}
                            >
                              {ch.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleEditChallengeClick(ch)}
                              title="Edit Challenge"
                              className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 transition-all"
                            >
                              <PlusCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteChallenge(ch._id)}
                              title="Delete Challenge"
                              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
