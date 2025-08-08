import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchInvitedUsers,
  resendInviteUser,
  updateUser,
  fetchProjects,
  fetchRoles,
  InviteUser,
  searchInvitedUsers,
} from './inviteSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectItem } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { AppDispatch, RootState } from '../../app/store';
import { FaEdit, FaRedo } from 'react-icons/fa';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';
import axios from 'axios';

enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export default function InviteUserPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { users, projects, loading: userLoading } = useSelector((state: RootState) => state.invite);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [project, setProject] = useState('');

  const itemsPerPage = 10;

  const safeProjects: { uuid: string; name: string }[] = Array.isArray(projects)
    ? projects.map((p: any) => ({ uuid: p.uuid ?? p.id, name: p.displayName ?? p.name }))
    : (projects as any)?.data?.map((p: any) => ({ uuid: p.uuid ?? p.id, name: p.displayName ?? p.name })) ?? [];

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchRoles());
  }, [dispatch]);

useEffect(() => {
  console.log('debouncedSearch', debouncedSearch);
  if (debouncedSearch) {
    console.log('Dispatching searchInvitedUsers...');
    dispatch(
      searchInvitedUsers({
        page: currentPage,
        limit: itemsPerPage,
        query: debouncedSearch,
      })
    );
  } else {
    console.log('Dispatching fetchInvitedUsers...');
    dispatch(
      fetchInvitedUsers({
        page: currentPage,
        limit: itemsPerPage,
      })
    );
  }
}, [debouncedSearch, currentPage, dispatch]);


// useEffect(() => {
//   dispatch(fetchInvitedUsers({
//     page: currentPage,
//     limit: itemsPerPage,
//   }));
// }, [dispatch, currentPage]);

// const debouncedSearch = useDebounce(searchTerm, 500);

// useEffect(() => {
// dispatch(searchInvitedUsers({
//   page: currentPage,
//   limit: itemsPerPage,
//   query: debouncedSearch,
// }));
// }, [debouncedSearch, currentPage, dispatch]);

  const handleInvite = async () => {
    if (!email || !role || !project) {
      toast.error('Lengkapi semua field.');
      return;
    }

    const emails = email.split(',').map((e) => e.trim()).filter(Boolean);

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
        setEmail('');
        setRole('');
        setProject('');
        dispatch(fetchInvitedUsers({ page: currentPage, limit: itemsPerPage }));
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
          role: user.role,
        })
      ).unwrap();
      toast.success('Undangan berhasil dikirim ulang!');
    } catch (err) {
      toast.error('Gagal mengirim ulang undangan.');
      console.error(err);
    }
  };

  const handleEditUser = async (user: InviteUser) => {
    const newEmail = prompt('Masukkan email baru:', user.email);
    const newRole = prompt('Masukkan role baru (super_admin/admin/member):', user.role);

    if (newRole && !Object.values(UserRole).includes(newRole as UserRole)) {
      alert('Role tidak valid!');
      return;
    }

    const payload: { uuid: string; email?: string; role?: UserRole } = { uuid: user.uuid };
    if (newEmail && newEmail !== user.email) payload.email = newEmail;
    if (newRole && newRole !== user.role) payload.role = newRole as UserRole;

    if (!payload.email && !payload.role) {
      alert('Tidak ada perubahan.');
      return;
    }

    try {
      await dispatch(updateUser(payload)).unwrap();
      alert('User berhasil diperbarui.');
      dispatch(fetchInvitedUsers({ page: currentPage, limit: itemsPerPage }));
    } catch {
      alert('Gagal memperbarui user.');
    }
  };

  const filteredUsers = users?.data ?? [];
  const totalPages = users?.totalPages ?? 1;

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
                  {safeProjects.map((proj) => (
                     <SelectItem key={proj.uuid} value={proj.uuid}>{proj.name}</SelectItem>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1">Email</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" />
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

        <Card>
          <CardContent className="px-6 pt-6 pb-0">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h6 className="text-lg font-semibold text-gray-800">List of all users</h6>
              <Input
                placeholder="⌕ Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                    <th className="px-6 py-3">#</th>
                    <th className="px-6 py-3">UUID</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y">
                  {userLoading ? (
                    <tr><td colSpan={5} className="text-center py-6">Loading...</td></tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-6">No users found.</td></tr>
                  ) : (
                    filteredUsers.map((user, index) => (
                      <tr key={user.uuid}>
                        <td className="px-6 py-4">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                        <td className="px-6 py-4">{user.uuid}</td>
                        <td className="px-6 py-4">{user.email}</td>
                        <td className="px-6 py-4">{user.role}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center space-x-2">
                            <button onClick={() => handleResendInvite(user)} className="text-blue-600"><FaRedo /></button>
                            <button onClick={() => handleEditUser(user)} className="text-yellow-600"><FaEdit /></button>
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
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}>&lt;</button>
                <span>{currentPage}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}>&gt;</button>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-center mt-4">
              <Button className="w-full md:w-48 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleInvite} disabled={userLoading || !email || !role || !project}>
                Submit
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

