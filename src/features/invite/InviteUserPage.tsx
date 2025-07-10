import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchInvitedUsers,
  sendInvite,
  deleteUser,
  resendInvite,
  updateUserRole,
} from './inviteSlice';
import { fetchProjects } from './projectSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectItem } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { AppDispatch, RootState } from '../../app/store';
import { FaTrash, FaEdit, FaRedo, FaSearch } from 'react-icons/fa';
import { toast } from 'sonner';



export default function InviteUserPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { users, loading: userLoading } = useSelector((state: RootState) => state.invite);
  const { projects, loading: projectLoading } = useSelector((state: RootState) => state.project);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [project, setProject] = useState('');

  const itemsPerPage = 10;

  useEffect(() => {
    dispatch(fetchInvitedUsers());
    dispatch(fetchProjects());
  }, [dispatch]);

  const filteredUsers = users.filter((user) => {
    const keyword = searchTerm.toLowerCase();
    return (
      user.name.toLowerCase().includes(keyword) ||
      user.email.toLowerCase().includes(keyword) ||
      user.uuid.toLowerCase().includes(keyword)
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

  try {
    await dispatch(sendInvite({ email, role, project })).unwrap();

    toast.success('User berhasil diundang.');
    setEmail('');
    setRole('');
    setProject('');
  } catch (err) {
    toast.error('Gagal mengundang user.');
  }
};


  const handleResendInvite = async (uuid: string) => {
    try {
      await dispatch(resendInvite(uuid)).unwrap();
      alert('Undangan berhasil dikirim ulang!');
    } catch {
      alert('Gagal mengirim ulang undangan.');
    }
  };

  const handleEditRole = async (uuid: string) => {
    const newRole = prompt('Masukkan role baru (admin/member):');
    if (!newRole || (newRole !== 'admin' && newRole !== 'member')) {
      alert('Role tidak valid!');
      return;
    }

    try {
      await dispatch(updateUserRole({ uuid, role: newRole })).unwrap();
      alert('Role berhasil diperbarui.');
    } catch {
      alert('Gagal memperbarui role.');
    }
  };

  const handleDeleteUser = async (uuid: string) => {
    const confirmed = confirm('Yakin ingin menghapus user ini?');
    if (!confirmed) return;
    try {
      await dispatch(deleteUser(uuid)).unwrap();
      alert('User berhasil dihapus.');
    } catch {
      alert('Gagal menghapus user.');
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
                  {projectLoading ? (
                    <SelectItem value="" disabled>Loading projects...</SelectItem>
                  ) : (
                    <>
                      <SelectItem value="">Select project</SelectItem>
                      {projects.map((proj) => (
                        <SelectItem key={proj.id} value={proj.name}>{proj.name}</SelectItem>
                      ))}
                    </>
                  )}
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
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </Select>
              </div>
            </div>
          </CardContent>
         </Card>

        <Card>
          <CardContent className="px-6 pt-6 pb-0">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h6 className="text-lg font-semibold text-gray-800">List of all user</h6>
              <div className="relative w-full md:w-64">
               <Input
                placeholder="⌕ Search..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full md:w-64"/>
              </div>
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
                  {paginatedUsers.map((user, index) => (
                    <tr key={user.uuid}>
                      <td className="px-6 py-4"><input type="checkbox" /></td>
                      <td className="px-6 py-4">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td className="px-6 py-4">{user.uuid}</td>
                      <td className="px-6 py-4">{user.name}</td>
                      <td className="px-6 py-4">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 inline-flex text-xs font-semibold rounded-full ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <button title="Resend Invite" onClick={() => handleResendInvite(user.uuid)} className="text-blue-600"><FaRedo /></button>
                          <button title="Edit Role" onClick={() => handleEditRole(user.uuid)} className="text-yellow-600"><FaEdit /></button>
                          <button title="Delete User" onClick={() => handleDeleteUser(user.uuid)} className="text-red-600"><FaTrash /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex flex-col md:flex-row justify-between items-center border-t">
              <div className="text-sm text-gray-500 mb-2 md:mb-0">
                Showing {paginatedUsers.length} of {users.length} entries
              </div>
              <div className="flex items-center space-x-1">
                <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>&lt;</button>
                <span className="px-3 py-1">{currentPage}</span>
                <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>&gt;</button>
              </div>
            </div>

            <div className="flex justify-center mt-4">
              <Button
                className="w-full md:w-48 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={userLoading || !email || !role || !project}
                onClick={handleInvite}>
                Submit
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
