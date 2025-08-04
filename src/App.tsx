import { BrowserRouter, Routes, Route } from 'react-router-dom';
import InviteUserPage from './features/invite/InviteUserPage';
import { Toaster } from 'sonner';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/" element={<InviteUserPage />} />
        <Route path="/invite-user-dashboard" element={<InviteUserPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
