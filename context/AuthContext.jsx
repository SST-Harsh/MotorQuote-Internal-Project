'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usersDB, simulateDelay } from '../utils/fakeAuth';
import Cookies from 'js-cookie';
import Swal from 'sweetalert2';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
      } catch (error) {
        console.error('Failed to parse user from localStorage', error);
        return null;
      }
    }
    return null;
  });

  const router = useRouter();

  // Seed the mock DB on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedDB = localStorage.getItem('mock_users_db');
      if (!storedDB) {
        localStorage.setItem('mock_users_db', JSON.stringify(usersDB));
      }
    }
  }, []);

  const login = async (email, password, rememberMe = false) => {
    await simulateDelay(1000);

    // Get latest users from "DB"
    const storedDB = localStorage.getItem('mock_users_db');
    const currentUsersDB = storedDB ? JSON.parse(storedDB) : usersDB;

    const foundUser = currentUsersDB.find((u) => u.email === email && u.password === password);

    if (foundUser) {
      const expires = rememberMe ? 7 : 1;
      Cookies.set('role', foundUser.role, { expires: expires });
      localStorage.setItem('user', JSON.stringify(foundUser));

      setUser(foundUser);

      // Check Global 2FA Settings
      const globalConfig = JSON.parse(localStorage.getItem('global_system_config') || '{}');
      const security = globalConfig.security || { twoFA: { admin: false, dealer: false } };

      let requires2FA = false;
      if (foundUser.role === 'admin' && security.twoFA.admin) requires2FA = true;
      if (foundUser.role === 'super_admin' && security.twoFA.admin) requires2FA = true; // Treating Super Admin as Admin for 2FA
      if (foundUser.role === 'dealer' && security.twoFA.dealer) requires2FA = true;

      // Override if user has specific flag (legacy dealer)
      if (foundUser.requires2FA) requires2FA = true;

      // Log Audit Entry
      const storedLogs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
      const newLog = {
        id: `LOG-${Date.now()}`,
        action: 'Login Success',
        user: foundUser.name || foundUser.email,
        role: foundUser.role.charAt(0).toUpperCase() + foundUser.role.slice(1),
        category: 'Auth',
        severity: 'Info',
        details: 'User logged in successfully.',
        timestamp: new Date().toLocaleString(),
      };
      localStorage.setItem('audit_logs', JSON.stringify([newLog, ...storedLogs].slice(0, 100))); // Keep last 100 logs

      return { success: true, role: foundUser.role, requires2FA };
    } else {
      // Log Failed Audit Entry
      const storedLogs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
      const newLog = {
        id: `LOG-${Date.now()}`,
        action: 'Login Failed',
        user: email || 'Unknown',
        role: 'N/A',
        category: 'Auth',
        severity: 'Critical',
        details: `Failed login attempt for email: ${email}`,
        timestamp: new Date().toLocaleString(),
      };
      localStorage.setItem('audit_logs', JSON.stringify([newLog, ...storedLogs].slice(0, 100)));

      throw new Error('Invalid Email or Password');
    }
  };

  const logout = () => {
    Swal.fire({
      icon: 'success',
      title: 'Logged Out',
      text: 'See you soon!',
      timer: 1500,
      showConfirmButton: false,
      position: 'top-end',
      toast: true,
      background: '#fff',
      color: '#000',
    });
    Cookies.remove('role');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  const updateProfile = (updates) => {
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);

    try {
      // 1. Update current session
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // 2. Update "Persistent DB"
      const storedDB = localStorage.getItem('mock_users_db');
      if (storedDB) {
        const db = JSON.parse(storedDB);
        const index = db.findIndex((u) => u.email === user.email);
        if (index !== -1) {
          db[index] = { ...db[index], ...updates };
          localStorage.setItem('mock_users_db', JSON.stringify(db));
        }
      }
    } catch (error) {
      console.error('Failed to save user to localStorage:', error);
      Swal.fire({
        icon: 'warning',
        title: 'Storage Full',
        text: 'Your profile changes were applied but could not be saved to storage. They will reset on refresh.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 5000,
      });
    }
    return updatedUser;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
