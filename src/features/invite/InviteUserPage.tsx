import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchInvitedUsers,
  sendInvite,
  resendInviteUser,
  updateUser,
  fetchProjects,
  fetchRoles,
  InviteUser,
  normalizeRole,
} from './inviteSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectItem } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { AppDispatch, RootState } from '../../app/store';
import { FaEdit, FaRedo } from 'react-icons/fa';
import { toast } from 'sonner';
import axios from 'axios';

enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export default function InviteUserPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { users, projects, loading: userLoading } = useSelector(
    (state: RootState) => state.invite
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');        
  const [project, setProject] = useState(''); 

const safeProjects: { uuid: string; name: string }[] = Array.isArray(projects)
  ? projects.map((p: any) => ({
      uuid: p.uuid ?? p.id,              
      name: p.displayName ?? p.name,    
    }))
  : (projects as any)?.data?.map((p: any) => ({
      uuid: p.uuid ?? p.id,
      name: p.displayName ?? p.name,
    })) ?? [];

  const itemsPerPage = 10;

  useEffect(() => {
    dispatch(fetchInvitedUsers());
    dispatch(fetchProjects());
    dispatch(fetchRoles());
  }, [dispatch]);

  const filteredUsers = (users ?? []).filter((user) => {
    const keyword = searchTerm.toLowerCase();
    const name = user?.name ?? '';
    const email = user?.email ?? '';
    const uuid = user?.uuid ?? '';

    return (
      name.toLowerCase().includes(keyword) ||
      email.toLowerCase().includes(keyword) ||
      uuid.toLowerCase().includes(keyword)
    );
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

const handleInvite = async () => {
  if (!email || !role || !project) {
    toast.error('Lengkapi semua field.');
    return;
  }

  const emails = email
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);

  const payload = {
    emails,
    role: role as UserRole, 
    projectUuid: project,
  };

  try {
    const res = await axios.post(
      'http://localhost:5001/api/v1/invite-user-dashboard/invite',
      payload
    );

    if (res.data.success) {
      toast.success('✅ Invite berhasil dikirim!');
      setEmail(''); // Reset input email biar lebih UX friendly
      setRole('');
      setProject('');
    } else {
      toast.error('❌ Invite gagal: ' + res.data.message);
    }
  } catch (err: any) {
    toast.error('❌ Error kirim invite');
    console.error(err);
  }
};

const handleResendInvite = async (user: InviteUser) => {
  try {
    await dispatch(
      resendInviteUser({
        emails: [user.email],
        projectUuid: user.projectUuid,
        role: user.role, // ✅ kirim role asli
      })
    ).unwrap();

    toast.success('Undangan berhasil dikirim ulang!');
  } catch (err) {
    toast.error('Gagal mengirim ulang undangan.');
    console.error(err);
  }
};


const handleEditUser = async (user: InviteUser) => {
  const newName = prompt(
    'Masukkan nama baru (biarkan kosong jika tidak ingin mengubah):',
    user.name
  );
  const newEmail = prompt(
    'Masukkan email baru (biarkan kosong jika tidak ingin mengubah):',
    user.email
  );
  const newRole = prompt(
    'Masukkan role baru (super_admin/admin/member) (biarkan kosong jika tidak ingin mengubah):',
    user.role
  );

  if (newRole && !Object.values(UserRole).includes(newRole as UserRole)) {
    alert('Role tidak valid!');
    return;
  }

  const payload: {
    uuid: string;
    name?: string;
    email?: string;
    role?: UserRole;
  } = { uuid: user.uuid };

  if (newName && newName !== user.name) payload.name = newName;
  if (newEmail && newEmail !== user.email) payload.email = newEmail;
  if (newRole && newRole !== user.role) payload.role = newRole as UserRole;

  if (!payload.name && !payload.email && !payload.role) {
    alert('Tidak ada perubahan.');
    return;
  }

  try {
    await dispatch(updateUser(payload)).unwrap();
    alert('User berhasil diperbarui.');
  } catch {
    alert('Gagal memperbarui user.');
  }
};

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Card className="mb-6">
          <CardContent className="p-6">
            <h5 className="text-2xl font-semibold text-gray-800 mb-4">Invite User</h5>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1">Project</label>
                <Select value={project} onValueChange={setProject}>
                  <SelectItem value="">Select project</SelectItem>
                  {safeProjects.map((proj: { uuid: string; name: string }) => (
                    <SelectItem key={proj.uuid} value={proj.uuid}>
                      {proj.name ?? 'No Name'}
                    </SelectItem>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1">Email</label>
                <Input
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1">Role</label>
                <Select value={role} onValueChange={setRole}>
                  <SelectItem value="">Select role</SelectItem>
                  <SelectItem value={UserRole.SUPER_ADMIN}>Super Admin</SelectItem>
                  <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                  <SelectItem value={UserRole.MEMBER}>Member</SelectItem>
                </Select>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* ==== SEARCH & LIST ==== */}
        <Card>
          <CardContent className="px-6 pt-6 pb-0">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h6 className="text-lg font-semibold text-gray-800">List of all users</h6>
              <Input
                placeholder="⌕ Search..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full md:w-64"
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3"><input type="checkbox" /></th>
                    <th className="px-6 py-3">NO</th>
                    <th className="px-6 py-3">UUID</th>
                    <th className="px-6 py-3">Nama</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y">
                  {userLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-6">
                        Loading data...
                      </td>
                    </tr>
                  ) : paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-6">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user, index) => (
                      <tr key={user.uuid}>
                        <td className="px-6 py-4"><input type="checkbox" /></td>
                        <td className="px-6 py-4">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                        <td className="px-6 py-4">{user.uuid}</td>
                        <td className="px-6 py-4">{user.name}</td>
                        <td className="px-6 py-4">{user.email}</td>
                        <td className="px-6 py-4">{user.role}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center space-x-2">
                          <button
                            title="Resend Invite"
                            onClick={() => handleResendInvite(user)}
                            className="text-blue-600">
                            <FaRedo />
                            </button>
                            <button
                              title="Edit User"
                              onClick={() => handleEditUser(user)}
                              className="text-yellow-600"
                            >
                              <FaEdit />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-gray-50 px-6 py-4 flex flex-col md:flex-row justify-between items-center border-t">
              <div className="text-sm text-gray-500 mb-2 md:mb-0">
                Showing {paginatedUsers.length} of {users.length} entries
              </div>
              <div className="flex items-center space-x-1">
                <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                  &lt;
                </button>
                <span className="px-3 py-1">{currentPage}</span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  &gt;
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center mt-4">
            <Button
              className="w-full md:w-48 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={userLoading || !email || !role || !project}
              onClick={handleInvite} >
              Submit
            </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
