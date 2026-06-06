import { useState } from 'react';
import { apiClient } from '../lib/clientApi';
import { FullScreenLoader } from '../components/FullScreenLoader';

export function SecurityPage() {
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  async function updateAdminCreds() {
    if (!adminUser.trim()) {
      alert('Username is required.');
      return;
    }
    setAdminLoading(true);
    try {
      const data: any = { username: adminUser.trim() };
      if (adminPass.trim()) {
        data.password = adminPass.trim();
      }
      await apiClient.updateAdminCredentials(data);
      alert('Admin credentials updated successfully! You will need to log in again with your new credentials.');
      setAdminUser('');
      setAdminPass('');
    } catch (err: any) {
      alert(err.message || 'Failed to update credentials.');
    } finally {
      setAdminLoading(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      {adminLoading && <FullScreenLoader message="Updating credentials..." />}
      
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Security & Authentication</h2>
        <p className="text-sm text-slate-500">Manage administrator access credentials and security settings.</p>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Admin Credentials</h3>
              <p className="text-xs text-slate-500">Update your primary login username and password</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 sm:p-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-700">New Username</span>
                <input 
                  type="text"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 transition-colors focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-500/10" 
                  value={adminUser} 
                  onChange={e => setAdminUser(e.target.value)} 
                  placeholder="Enter new username" 
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-700">New Password</span>
                <input 
                  type="password" 
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 transition-colors focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-500/10" 
                  value={adminPass} 
                  onChange={e => setAdminPass(e.target.value)} 
                  placeholder="Leave blank to keep existing password" 
                />
              </label>
            </div>
            
            <div className="flex flex-col justify-center rounded-xl bg-slate-50 p-6 text-sm text-slate-600">
              <h4 className="mb-2 font-medium text-slate-900">Important Note</h4>
              <ul className="space-y-2 list-disc pl-4 marker:text-orange-400">
                <li>You will be required to log in again immediately after updating these credentials.</li>
                <li>Make sure to use a strong password if changing it.</li>
                <li>If you forget your credentials, you will need to manually reset them in the database or server environment variables.</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
            <button 
              onClick={updateAdminCreds} 
              disabled={adminLoading || !adminUser.trim()} 
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {adminLoading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SecurityPage;
