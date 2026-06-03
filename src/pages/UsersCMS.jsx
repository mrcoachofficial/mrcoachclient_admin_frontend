import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, Filter, RefreshCw, User, X, Download, Upload, 
  Eye, Pencil, Trash2, Calendar, MapPin, Phone, Mail, Award, Users, AlertTriangle, Check
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function UsersCMS() {
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [district, setDistrict] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewTab, setViewTab] = useState('bookings'); // 'bookings' or 'referrals'

  const [editUser, setEditUser] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    alternatePhone: '',
    serviceType: '',
    area: '',
    district: '',
    state: '',
    pincode: '',
    address: '',
    gender: '',
    startPlan: '',
    availableDays: [],
    sourceWebsite: ''
  });

  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);

  // Fetch users with filters
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (district) params.district = district;
      if (stateFilter) params.state = stateFilter;
      if (serviceType) params.serviceType = serviceType;

      const response = await axios.get('http://localhost:5000/api/admin/users', { params });
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  // Fetch all users to extract registered districts and states
  const fetchAllUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/users');
      setAllUsers(response.data);
    } catch (error) {
      console.error('Error fetching all users:', error);
    }
  };

  const refreshData = () => {
    fetchUsers();
    fetchAllUsers();
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [district, stateFilter, serviceType]);

  const clearFilters = () => {
    setDistrict('');
    setStateFilter('');
    setServiceType('');
  };

  const uniqueDistricts = [...new Set(allUsers.map(u => u.district?.trim()).filter(Boolean))].sort();
  const uniqueStates = [...new Set(allUsers.map(u => u.state?.trim()).filter(Boolean))].sort();

  // Export users to Excel
  const handleExport = () => {
    if (users.length === 0) {
      setStatusMessage({
        type: 'error',
        title: 'Export Failed',
        desc: 'No user records available to export.'
      });
      return;
    }

    const exportData = users.map(u => ({
      'User Name': u.name || '',
      'Registered Email': u.email || '',
      'VERIFIED Login Mobile Number': u.phoneNumber || 'N/A',
      Gender: u.gender || '',
      Location: formatLocation(u),
      'Service Type': u.serviceType || '',
      'Preferred Start Date': u.startPlan ? new Date(u.startPlan).toLocaleDateString() : '',
      'Availability Days': u.availableDays ? u.availableDays.join(', ') : '',
      'Heard From': u.sourceWebsite || '',
      'Registration Date': u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clients');
    XLSX.writeFile(workbook, `MrCoach_Clients_${new Date().toISOString().split('T')[0]}.xlsx`);

    setStatusMessage({
      type: 'success',
      title: 'Export Successful',
      desc: `Successfully exported ${users.length} clients to Excel.`
    });
  };

  // Export verified phone numbers from backend API
  const handleExportVerifiedPhones = async () => {
    try {
      setStatusMessage({
        type: 'success',
        title: 'Exporting...',
        desc: 'Generating and downloading verified phone numbers...'
      });
      
      const response = await axios.get('http://localhost:5000/api/admin/users/export-verified-phones', {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `verified_phone_numbers_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setStatusMessage({
        type: 'success',
        title: 'Export Successful',
        desc: 'Successfully downloaded verified phone numbers.'
      });
    } catch (error) {
      console.error('Error exporting phone numbers:', error);
      setStatusMessage({
        type: 'error',
        title: 'Export Failed',
        desc: 'Failed to download verified phone numbers.'
      });
    }
  };


  // Import users from Excel
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws);

        if (rawData.length === 0) {
          setStatusMessage({
            type: 'error',
            title: 'Import Failed',
            desc: 'The selected Excel file has no rows.'
          });
          return;
        }

        const parseLocation = (locationStr) => {
          if (!locationStr) return {};
          const parts = locationStr.split(',');
          const area = parts[0] ? parts[0].trim() : '';
          let district = '';
          let state = '';
          let pincode = '';
          
          if (parts[1]) {
            const rest = parts[1].split('-');
            district = rest[0] ? rest[0].trim() : '';
            if (rest[1]) {
              pincode = rest[1].trim();
            }
          }
          if (parts[2]) {
            const rest = parts[2].split('-');
            state = rest[0] ? rest[0].trim() : '';
            if (rest[1]) {
              pincode = rest[1].trim();
            }
          }
          return { area, district, state, pincode };
        };

        const formattedData = rawData.map(row => {
          const loc = row.Location ? parseLocation(row.Location) : {};
          return {
            name: row['User Name'] || row.Name || row.name || '',
            email: row['Registered Email'] || row.Email || row.email || '',
            gender: row.Gender || row.gender || '',
            age: row.Age || row.age || undefined,
            dateOfBirth: row['Date of Birth'] || row.dateOfBirth || '',
            phoneNumber: row['VERIFIED Login Mobile Number'] || row['Mobile Number'] || row.phoneNumber || '',
            area: loc.area || row.Area || row.area || '',
            district: loc.district || row.District || row.district || '',
            state: loc.state || row.State || row.state || '',
            pincode: loc.pincode || row.Pincode || row.pincode || '',
            address: row.Address || row.address || '',
            serviceType: row['Service Type'] || row.serviceType || '',
            preferredLanguage: row['Preferred Language'] || row.preferredLanguage || '',
            emergencyContact: row['Emergency Contact'] || row.emergencyContact || '',
            fitnessGoal: row['Fitness Goal'] || row.fitnessGoal || '',
            startPlan: row['Preferred Start Date'] || row.startPlan || '',
            availableDays: row['Availability Days'] ? row['Availability Days'].split(',').map(s => s.trim()).filter(Boolean) : (row.availableDays || []),
            sourceWebsite: row['Heard From'] || row.sourceWebsite || '',
          };
        });

        const response = await axios.post('http://localhost:5000/api/admin/users/import', formattedData);
        
        setStatusMessage({
          type: 'success',
          title: 'Import Processed',
          desc: `Successfully imported: Created ${response.data.createdCount} new users, updated ${response.data.updatedCount} existing users.`
        });
        
        refreshData();
      } catch (error) {
        console.error('Excel processing error:', error);
        setStatusMessage({
          type: 'error',
          title: 'Import Failed',
          desc: error.response?.data?.message || 'Failed to process Excel file. Ensure it contains Name and Email columns.'
        });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null;
  };

  // View Detailed Profile Modal
  const handleViewDetails = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/admin/users/${userId}/detail`);
      setSelectedUserDetail(response.data);
      setViewTab('bookings');
      setViewModalOpen(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
      setStatusMessage({
        type: 'error',
        title: 'Error',
        desc: 'Could not fetch detailed profile from database.'
      });
    }
  };

  // Edit User Details
  const handleOpenEdit = (user) => {
    setEditUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      alternatePhone: user.alternatePhone || '',
      serviceType: user.serviceType || '',
      area: user.area || '',
      district: user.district || '',
      state: user.state || '',
      pincode: user.pincode || '',
      address: user.address || '',
      gender: user.gender || '',
      startPlan: user.startPlan ? new Date(user.startPlan).toISOString().split('T')[0] : '',
      availableDays: user.availableDays || [],
      sourceWebsite: user.sourceWebsite || ''
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/admin/users/${editUser._id}`, editForm);
      setEditModalOpen(false);
      refreshData();
      setStatusMessage({
        type: 'success',
        title: 'Update Successful',
        desc: `Successfully updated profile details for ${editForm.name}.`
      });
    } catch (error) {
      console.error('Error updating user:', error);
      setStatusMessage({
        type: 'error',
        title: 'Update Failed',
        desc: error.response?.data?.message || 'Failed to update user profile.'
      });
    }
  };

  // Delete (Soft Delete) User
  const handleDeleteUser = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/admin/users/${deleteConfirmUser._id}`);
      setDeleteConfirmUser(null);
      refreshData();
      setStatusMessage({
        type: 'success',
        title: 'User Deleted',
        desc: 'User soft-deleted successfully. Booking history remains intact.'
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      setStatusMessage({
        type: 'error',
        title: 'Deletion Failed',
        desc: error.response?.data?.message || 'Failed to delete user.'
      });
    }
  };

  // Frontend filtering by search query (supports name, email, phone, location)
  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const name = user.name?.toLowerCase() || '';
    const email = user.email?.toLowerCase() || '';
    const phone = (user.phoneNumber || user.alternatePhone || '').toLowerCase();
    
    const area = user.area?.toLowerCase() || '';
    const district = user.district?.toLowerCase() || '';
    const state = user.state?.toLowerCase() || '';
    const pincode = user.pincode || '';
    const location = `${area} ${district} ${state} ${pincode}`.toLowerCase();

    return name.includes(term) || email.includes(term) || phone.includes(term) || location.includes(term);
  });

  const formatLocation = (user) => {
    const parts = [];
    if (user.area) parts.push(user.area);
    if (user.district) parts.push(user.district);
    if (user.state) parts.push(user.state);
    
    let base = parts.join(', ');
    if (user.pincode) {
      base += ` - ${user.pincode}`;
    }
    return base || 'Location Not Set';
  };

  return (
    <div className="p-8">
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-textMain mb-1">Users CMS</h1>
          <p className="text-textMuted text-sm">View, edit, and manage registered client profile records.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="file"
            id="excel-import"
            accept=".xlsx, .xls"
            onChange={handleImport}
            className="hidden"
          />
          <label
            htmlFor="excel-import"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-600 rounded-xl cursor-pointer transition-all text-sm font-medium"
          >
            <Upload className="w-4 h-4" />
            Import Excel
          </label>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/25 border border-blue-500/30 text-blue-600 rounded-xl transition-all text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>

          <button
            onClick={handleExportVerifiedPhones}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-600 rounded-xl transition-all text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Export Verified Phone Numbers
          </button>


          <button
            onClick={refreshData}
            className="flex items-center gap-2 px-4 py-2 bg-surfaceLight hover:bg-surface border border-borderLine rounded-xl text-textMain transition-all text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-xl mb-6 flex justify-between items-center border ${
          statusMessage.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-600' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
        }`}>
          <div>
            <p className="font-semibold text-sm">{statusMessage.title}</p>
            <p className="text-xs">{statusMessage.desc}</p>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-textMuted hover:text-textMain">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="glass p-6 rounded-2xl mb-8 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-textMain font-semibold">
            <Filter className="w-4 h-4 text-primary" />
            <span>Search & Filters</span>
          </div>
          {(district || stateFilter || serviceType || searchTerm) && (
            <button
              onClick={() => { clearFilters(); setSearchTerm(''); }}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 transition-colors font-medium"
            >
              <X className="w-3.5 h-3.5" />
              Clear Search & Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1">
            <label className="block text-xs text-textMuted mb-1 font-medium">Search User</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search Name, Email, Phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-surfaceLight border border-borderLine rounded-xl text-textMain text-sm focus:outline-none focus:border-primary/50"
              />
              <Search className="w-4 h-4 text-textMuted absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-textMuted mb-1 font-medium">District</label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full px-3 py-2 bg-surfaceLight border border-borderLine rounded-xl text-textMain text-sm focus:outline-none focus:border-primary/50 text-ellipsis"
            >
              <option value="">All Districts</option>
              {uniqueDistricts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-textMuted mb-1 font-medium">State</label>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full px-3 py-2 bg-surfaceLight border border-borderLine rounded-xl text-textMain text-sm focus:outline-none focus:border-primary/50 text-ellipsis"
            >
              <option value="">All States</option>
              {uniqueStates.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-textMuted mb-1 font-medium">Service Preference</label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full px-3 py-2 bg-surfaceLight border border-borderLine rounded-xl text-textMain text-sm focus:outline-none focus:border-primary/50"
            >
              <option value="">All Services</option>
              <option value="Online">Online</option>
              <option value="Home Visit">Home Visit</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-borderLine bg-surfaceLight/50 text-textMuted text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4 w-16 text-center">S.No</th>
                <th className="px-6 py-4">User Name</th>
                <th className="px-6 py-4">Auth & Contact</th>
                <th className="px-6 py-4">Auto-Detected Location</th>
                <th className="px-6 py-4">Session & Joined</th>
                <th className="px-6 py-4 text-center">Service Type</th>
                <th className="px-6 py-4 text-center w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderLine text-sm text-textMain">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-textMuted">
                    <div className="flex items-center justify-center gap-3">
                      <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                      <span>Loading user records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-textMuted">
                    No users found matching the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr key={user._id} className="hover:bg-surfaceLight/30 transition-colors">
                    <td className="px-6 py-4 text-center font-medium text-textMuted">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.profileImage ? (
                          <img
                            src={`http://localhost:5000${user.profileImage}`}
                            alt={user.name}
                            className="w-8 h-8 rounded-full object-cover border border-borderLine bg-surface"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primaryHover font-bold text-xs">
                            {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                          </div>
                        )}
                        <span className="font-semibold text-textMain">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-textMain">
                        <Mail className="w-3.5 h-3.5 text-textMuted flex-shrink-0" />
                        <span className="font-mono">{user.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-textMain">
                        <Phone className="w-3.5 h-3.5 text-textMuted flex-shrink-0" />
                        <span className="font-mono">{user.phoneNumber || 'N/A'}</span>
                        {user.phoneNumber && (
                          user.phoneVerified ? (
                            <span className="text-[10px] text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.2 rounded font-semibold inline-flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" /> Verified
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-semibold inline-flex items-center gap-0.5">
                              Unverified
                            </span>
                          )
                        )}
                      </div>
                      <div className="pt-0.5">
                        <span className={`inline-block text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                          user.authProvider === 'phone_otp' ? 'bg-amber-500/10 text-amber-700 border border-amber-500/20' :
                          user.authProvider === 'google' ? 'bg-blue-500/10 text-blue-700 border border-blue-500/20' :
                          'bg-slate-500/10 text-slate-700 border border-slate-500/20'
                        }`}>
                          {user.authProvider === 'phone_otp' ? 'Phone OTP' :
                           user.authProvider === 'google' ? 'Google' : 'Email/Password'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-textMuted max-w-[200px] truncate" title={formatLocation(user)}>
                      {formatLocation(user)}
                    </td>
                    <td className="px-6 py-4 space-y-1 text-xs text-textMuted">
                      <p><span className="font-medium text-textMain">Registered:</span> {new Date(user.createdAt).toLocaleDateString()}</p>
                      <p><span className="font-medium text-textMain">Last Login:</span> {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}</p>
                    </td>
                    <td className="px-6 py-4 text-center text-xs">
                      <span className={`inline-block font-semibold px-2.5 py-0.5 rounded-full border ${
                        user.serviceType === 'Online' ? 'bg-green-50 border-green-200 text-green-600' :
                        user.serviceType === 'Home Visit' ? 'bg-amber-50 border-amber-200 text-amber-600' :
                        user.serviceType === 'Hybrid' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' :
                        'bg-surfaceLight border-borderLine text-textMuted'
                      }`}>
                        {user.serviceType || 'Not Selected'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewDetails(user._id)}
                          title="View Details"
                          className="p-1.5 hover:bg-primary/10 hover:text-primaryHover border border-transparent hover:border-primary/20 rounded-lg text-textMuted transition-all"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(user)}
                          title="Edit Profile"
                          className="p-1.5 hover:bg-blue-50 hover:text-blue-600 border border-transparent hover:border-blue-200 rounded-lg text-textMuted transition-all"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmUser(user)}
                          title="Delete User"
                          className="p-1.5 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-200 rounded-lg text-textMuted transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW DETAILS MODAL */}
      {viewModalOpen && selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface border border-borderLine rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl relative flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-borderLine">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primaryHover font-bold">
                  {selectedUserDetail.user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-textMain">{selectedUserDetail.user.name}</h3>
                  <p className="text-xs text-textMuted">Registered Client Details</p>
                </div>
              </div>
              <button 
                onClick={() => setViewModalOpen(false)} 
                className="text-textMuted hover:text-textMain p-1 rounded-lg hover:bg-surfaceLight"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex flex-col md:flex-row overflow-hidden h-[60vh]">
              {/* Left Column - General Details */}
              <div className="w-full md:w-1/3 bg-surfaceLight/30 p-6 border-r border-borderLine overflow-y-auto space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase text-textMuted tracking-wider mb-3">General Details</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs">
                      <Mail className="w-4 h-4 text-textMuted flex-shrink-0" />
                      <span className="text-textMain break-all">{selectedUserDetail.user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Phone className="w-4 h-4 text-textMuted flex-shrink-0" />
                      <span className="text-textMain">Login Phone: {selectedUserDetail.user.phoneNumber || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar className="w-4 h-4 text-textMuted flex-shrink-0" />
                      <span className="text-textMain">Joined: {new Date(selectedUserDetail.user.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <MapPin className="w-4 h-4 text-textMuted flex-shrink-0" />
                      <span className="text-textMain leading-relaxed">{formatLocation(selectedUserDetail.user)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase text-textMuted tracking-wider mb-3">Onboarding Profile</h4>
                  <div className="space-y-2 text-xs">
                    <p><span className="text-textMuted font-medium">Service Preference:</span> <span className="font-semibold text-primaryHover">{selectedUserDetail.user.serviceType || 'Not Selected'}</span></p>
                    <p><span className="text-textMuted font-medium">Preferred Language:</span> <span className="text-textMain font-medium">{selectedUserDetail.user.preferredLanguage || 'English'}</span></p>
                    <p><span className="text-textMuted font-medium">Gender:</span> <span className="text-textMain font-medium">{selectedUserDetail.user.gender || 'Not Set'}</span></p>
                    <p><span className="text-textMuted font-medium">Age:</span> <span className="text-textMain font-medium">{selectedUserDetail.user.age ? `${selectedUserDetail.user.age} yrs` : 'N/A'}</span></p>
                    <p><span className="text-textMuted font-medium">Emergency Contact:</span> <span className="text-textMain font-mono font-medium">{selectedUserDetail.user.emergencyContact || 'N/A'}</span></p>
                    <p><span className="text-textMuted font-medium">Preferred Start Date:</span> <span className="text-textMain font-medium">{selectedUserDetail.user.startPlan ? new Date(selectedUserDetail.user.startPlan).toLocaleDateString() : 'N/A'}</span></p>
                    <p><span className="text-textMuted font-medium">Availability:</span> <span className="text-textMain font-medium">{selectedUserDetail.user.availableDays?.join(', ') || 'N/A'}</span></p>
                    <p><span className="text-textMuted font-medium">Heard From:</span> <span className="text-textMain font-medium">{selectedUserDetail.user.sourceWebsite || 'N/A'}</span></p>
                    <p className="italic text-textMuted mt-1">"{selectedUserDetail.user.fitnessGoal || 'No fitness goal stated'}"</p>
                  </div>
                </div>

                {selectedUserDetail.user.referredBy && (
                  <div>
                    <h4 className="text-xs font-bold uppercase text-textMuted tracking-wider mb-2">Referred By</h4>
                    <p className="text-xs font-semibold text-textMain">{selectedUserDetail.user.referredBy.name}</p>
                    <p className="text-[10px] text-textMuted">{selectedUserDetail.user.referredBy.email}</p>
                  </div>
                )}
              </div>

              {/* Right Column - Booking & Referral History Tabs */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Tabs Bar */}
                <div className="flex border-b border-borderLine bg-surfaceLight/20">
                  <button
                    onClick={() => setViewTab('bookings')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
                      viewTab === 'bookings' 
                        ? 'border-primary text-textMain bg-surface' 
                        : 'border-transparent text-textMuted hover:text-textMain'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    Bookings & Enquiries ({selectedUserDetail.bookings.length})
                  </button>
                  <button
                    onClick={() => setViewTab('referrals')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
                      viewTab === 'referrals' 
                        ? 'border-primary text-textMain bg-surface' 
                        : 'border-transparent text-textMuted hover:text-textMain'
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    Rewards & Referrals ({selectedUserDetail.referrals.length})
                  </button>
                </div>

                {/* Tab Pane Body */}
                <div className="flex-1 overflow-y-auto p-6">
                  {viewTab === 'bookings' && (
                    <div className="space-y-4">
                      {selectedUserDetail.bookings.length === 0 ? (
                        <p className="text-xs text-textMuted text-center py-10">No booking or enquiry history found for this user.</p>
                      ) : (
                        <div className="border border-borderLine rounded-xl overflow-hidden">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-surfaceLight/50 text-textMuted font-bold uppercase border-b border-borderLine">
                                <th className="p-3">Service</th>
                                <th className="p-3">Slot Details</th>
                                <th className="p-3 text-center">Type</th>
                                <th className="p-3 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-borderLine">
                              {selectedUserDetail.bookings.map((booking) => (
                                <tr key={booking._id} className="hover:bg-surfaceLight/20">
                                  <td className="p-3">
                                    <p className="font-semibold text-textMain">{booking.serviceName}</p>
                                    <p className="text-[10px] text-textMuted">{booking.mode}</p>
                                  </td>
                                  <td className="p-3 font-mono">
                                    <p>{new Date(booking.date).toLocaleDateString()}</p>
                                    <p className="text-[10px] text-textMuted">{booking.time}</p>
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className={`inline-block font-semibold px-2 py-0.5 rounded-full ${
                                      booking.bookingType?.toLowerCase() === 'demo' ? 'bg-primary/20 text-primaryHover' : 'bg-surfaceLight text-textMuted'
                                    }`}>
                                      {booking.bookingType}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center capitalize font-semibold">
                                    <span className={
                                      booking.status === 'confirmed' || booking.status === 'completed' 
                                        ? 'text-green-600' 
                                        : booking.status === 'cancelled' 
                                          ? 'text-red-500' 
                                          : 'text-yellow-600'
                                    }>
                                      {booking.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {viewTab === 'referrals' && (
                    <div className="space-y-6">
                      {/* Stats Widget */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-surfaceLight/30 border border-borderLine rounded-xl text-center">
                        <div>
                          <p className="text-[10px] uppercase text-textMuted font-bold tracking-wider">Referral Code</p>
                          <p className="text-sm font-bold text-textMain font-mono mt-0.5">{selectedUserDetail.user.referralCode || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-textMuted font-bold tracking-wider">Total Invites</p>
                          <p className="text-sm font-bold text-textMain mt-0.5">{selectedUserDetail.user.referralStats?.totalInvites || 0}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-textMuted font-bold tracking-wider">Total Joined</p>
                          <p className="text-sm font-bold text-textMain mt-0.5">{selectedUserDetail.user.referralStats?.totalJoined || 0}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-textMuted font-bold tracking-wider">Earned Rewards</p>
                          <p className="text-sm font-bold text-emerald-600 mt-0.5">₹{selectedUserDetail.user.referralStats?.totalEarned || 0}</p>
                        </div>
                      </div>

                      {/* Referred users list */}
                      <div>
                        <h4 className="text-xs font-bold text-textMain mb-3 flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-primary" />
                          <span>Referred Accounts</span>
                        </h4>
                        {selectedUserDetail.referrals.length === 0 ? (
                          <p className="text-xs text-textMuted text-center py-6 border border-dashed border-borderLine rounded-xl">This user hasn't referred anyone yet.</p>
                        ) : (
                          <div className="border border-borderLine rounded-xl overflow-hidden">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-surfaceLight/50 text-textMuted font-bold uppercase border-b border-borderLine">
                                  <th className="p-3">Name</th>
                                  <th className="p-3">Email Address</th>
                                  <th className="p-3 text-right">Signed Up Date</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-borderLine">
                                {selectedUserDetail.referrals.map((ref) => (
                                  <tr key={ref._id || ref.email} className="hover:bg-surfaceLight/20">
                                    <td className="p-3 font-semibold text-textMain">{ref.name || 'Invited User'}</td>
                                    <td className="p-3 font-mono text-textMuted">{ref.email}</td>
                                    <td className="p-3 text-right text-textMuted">
                                      {ref.createdAt ? new Date(ref.createdAt).toLocaleDateString() : 'N/A'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editModalOpen && editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface border border-borderLine rounded-2xl max-w-lg w-full shadow-2xl relative flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-borderLine">
              <h3 className="text-lg font-bold text-textMain">Edit Profile details</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-textMuted hover:text-textMain p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-textMuted mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-surfaceLight border border-borderLine rounded-xl text-textMain text-sm focus:outline-none focus:border-primary/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-textMuted mb-1">Email ID</label>
                  <input 
                    type="email" 
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-surfaceLight border border-borderLine rounded-xl text-textMain text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-textMuted mb-1">Login Phone Number</label>
                  <input 
                    type="text" 
                    value={editForm.phoneNumber}
                    onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-surfaceLight border border-borderLine rounded-xl text-textMain text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-textMuted mb-1">Service Preference</label>
                  <select 
                    value={editForm.serviceType}
                    onChange={(e) => setEditForm({ ...editForm, serviceType: e.target.value })}
                    className="w-full px-3 py-2 bg-surfaceLight border border-borderLine rounded-xl text-textMain text-sm focus:outline-none focus:border-primary/50"
                  >
                    <option value="">Not Selected</option>
                    <option value="Online">Online</option>
                    <option value="Home Visit">Home Visit</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-textMuted mb-1">Gender</label>
                  <select 
                    value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-surfaceLight border border-borderLine rounded-xl text-textMain text-sm focus:outline-none focus:border-primary/50"
                  >
                    <option value="">Not Selected</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-textMuted mb-1">Preferred Start Date</label>
                  <input 
                    type="date" 
                    value={editForm.startPlan}
                    onChange={(e) => setEditForm({ ...editForm, startPlan: e.target.value })}
                    className="w-full px-3 py-2 bg-surfaceLight border border-borderLine rounded-xl text-textMain text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-textMuted mb-1">Heard From (Referral Source)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Instagram, Friends"
                    value={editForm.sourceWebsite}
                    onChange={(e) => setEditForm({ ...editForm, sourceWebsite: e.target.value })}
                    className="w-full px-3 py-2 bg-surfaceLight border border-borderLine rounded-xl text-textMain text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-textMuted mb-1">Availability (comma-separated days)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Mon, Wed, Fri"
                  value={Array.isArray(editForm.availableDays) ? editForm.availableDays.join(', ') : editForm.availableDays}
                  onChange={(e) => setEditForm({ ...editForm, availableDays: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  className="w-full px-3 py-2 bg-surfaceLight border border-borderLine rounded-xl text-textMain text-sm focus:outline-none focus:border-primary/50"
                />
              </div>

              <div className="border-t border-borderLine pt-4 mt-2">
                <p className="text-xs font-bold text-textMain uppercase tracking-wider mb-2">Location Details</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-textMuted mb-1">Area / Locality</label>
                    <input 
                      type="text" 
                      value={editForm.area}
                      onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                      className="w-full px-3 py-2 bg-surfaceLight border border-borderLine rounded-xl text-textMain text-xs focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-textMuted mb-1">District</label>
                    <input 
                      type="text" 
                      value={editForm.district}
                      onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                      className="w-full px-3 py-2 bg-surfaceLight border border-borderLine rounded-xl text-textMain text-xs focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-textMuted mb-1">State</label>
                    <input 
                      type="text" 
                      value={editForm.state}
                      onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                      className="w-full px-3 py-2 bg-surfaceLight border border-borderLine rounded-xl text-textMain text-xs focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-textMuted mb-1">Pincode</label>
                    <input 
                      type="text" 
                      value={editForm.pincode}
                      onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
                      className="w-full px-3 py-2 bg-surfaceLight border border-borderLine rounded-xl text-textMain text-xs focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-semibold text-textMuted mb-1">Detailed Address</label>
                  <textarea 
                    value={editForm.address}
                    rows="2"
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full px-3 py-2 bg-surfaceLight border border-borderLine rounded-xl text-textMain text-xs focus:outline-none focus:border-primary/50 resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-borderLine mt-4">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 border border-borderLine text-textMuted rounded-xl hover:bg-surfaceLight transition-all text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-primaryHover text-black rounded-xl transition-all text-sm font-semibold shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface border border-borderLine rounded-2xl max-w-md w-full shadow-2xl p-6 relative">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center border border-red-200">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-lg font-bold">Delete Client Profile</h3>
            </div>
            
            <p className="text-sm text-textMain leading-relaxed mb-4">
              Are you sure you want to delete the profile of <span className="font-bold">{deleteConfirmUser.name}</span>? 
              This will remove them from the active clients directory.
            </p>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-6 text-xs text-amber-700 leading-relaxed">
              <strong>Note:</strong> This performs a soft-delete. Their historical bookings and transaction history will remain intact in the database for auditing.
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 border border-borderLine text-textMuted rounded-xl hover:bg-surfaceLight transition-all text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all text-sm font-semibold shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
