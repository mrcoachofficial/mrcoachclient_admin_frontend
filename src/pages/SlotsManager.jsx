import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Clock, Trash2, Plus, Users, ShieldAlert } from 'lucide-react';

export default function SlotsManager() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('06:00 AM');
  const [capacity, setCapacity] = useState(1);
  const [serviceName, setServiceName] = useState('General');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      const response = await axios.get(`${window.API_BASE_URL}/api/admin/slots`);
      setSlots(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching slots:', error);
      setLoading(false);
    }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    if (!date || !time) return;
    setSubmitting(true);

    try {
      await axios.post(`${window.API_BASE_URL}/api/admin/slots`, {
        date,
        time,
        capacity: Number(capacity),
        serviceName
      });
      setDate('');
      fetchSlots();
    } catch (error) {
      console.error('Error creating slot:', error);
      alert('Failed to create slot');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = async (id) => {
    if (!window.confirm('Are you sure you want to delete this slot?')) return;

    try {
      await axios.delete(`${window.API_BASE_URL}/api/admin/slots/${id}`);
      fetchSlots();
    } catch (error) {
      console.error('Error deleting slot:', error);
      alert('Failed to delete slot');
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-textMain mb-1">Slots Manager</h1>
        <p className="text-textMuted text-sm">Configure and manage active booking schedules for the mobile app.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Creation Form */}
        <div className="glass rounded-2xl p-6 h-fit border border-borderLine/50">
          <h2 className="text-lg font-semibold text-textMain mb-6 flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" /> Create New Slot
          </h2>
          <form onSubmit={handleCreateSlot} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-textMuted mb-1.5 ml-1">Select Date</label>
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                required
                className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50 focus:bg-surfaceLight transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-textMuted mb-1.5 ml-1">Select Time</label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50 focus:bg-surfaceLight transition-colors"
              >
                {[
                  '12:00 AM', '01:00 AM', '02:00 AM', '03:00 AM', '04:00 AM', '05:00 AM',
                  '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
                  '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
                  '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM'
                ].map(t => (
                  <option key={t} value={t} className="bg-surface text-textMain">{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-textMuted mb-1.5 ml-1">Service Type</label>
              <select
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                required
                className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50 focus:bg-surfaceLight transition-colors"
              >
                {['General', 'Fitness', 'Physio', 'Sports', 'Yoga', 'Therapy', 'Nutrition'].map(s => (
                  <option key={s} value={s} className="bg-surface text-textMain">{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-textMuted mb-1.5 ml-1">Capacity (Max bookings)</label>
              <input 
                type="number" 
                value={capacity} 
                onChange={(e) => setCapacity(e.target.value)} 
                min="1"
                required
                className="w-full bg-surfaceLight/50 border border-borderLine text-textMain text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50 focus:bg-surfaceLight transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary hover:bg-primaryHover text-[#09090B] font-bold rounded-xl py-3 mt-4 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Slot'}
            </button>
          </form>
        </div>

        {/* Slots List */}
        <div className="lg:col-span-2 glass rounded-2xl p-6 border border-borderLine/50">
          <h2 className="text-lg font-semibold text-textMain mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> Active Schedule Slots
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-borderLine/50 text-textMuted text-xs font-semibold uppercase">
                  <th className="pb-3 pl-2">Date</th>
                  <th className="pb-3">Time</th>
                  <th className="pb-3">Service</th>
                  <th className="pb-3">Capacity</th>
                  <th className="pb-3 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderLine/50 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-textMuted">Loading active slots...</td>
                  </tr>
                ) : slots.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-textMuted">No slots configured. Create one to begin.</td>
                  </tr>
                ) : (
                  slots.map((slot) => (
                    <tr key={slot._id} className="hover:bg-surfaceLight/30 transition-colors">
                      <td className="py-4 pl-2 font-medium text-textMain">{new Date(slot.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                      <td className="py-4 text-textMain flex items-center gap-1">
                        <Clock className="w-4 h-4 text-primary" /> {slot.time}
                      </td>
                      <td className="py-4 text-textMuted">
                        <span className="px-2 py-0.5 border border-borderLine rounded text-xs">
                          {slot.serviceName}
                        </span>
                      </td>
                      <td className="py-4 text-textMuted">
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1 text-textMain font-medium">
                            <Users className="w-4 h-4 text-primary" /> 
                            {slot.bookings?.length || 0} / {((slot.bookings?.length || 0) + slot.capacity)} Booked
                          </span>
                          {slot.bookings && slot.bookings.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {slot.bookings.map((b) => (
                                <span 
                                  key={b._id} 
                                  className="text-[10px] bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded"
                                  title={`${b.userName} - ${b.userEmail}`}
                                >
                                  {b.userName} ({b.mobileNumber})
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 text-right pr-2">
                        <button 
                          onClick={() => handleDeleteSlot(slot._id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg text-textMuted hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
