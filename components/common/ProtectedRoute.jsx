'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import Loader from './Loader';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ roles = [], children }) {
  const router = useRouter();
  const { user } = useAuth();
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    if (!user) {
      if (allowed !== false) {
        Cookies.remove('role');
        router.replace('/login');
        setAllowed(false);
      }
      return;
    }

    if (user) {
      if (roles.length && !roles.includes(user.role)) {
        if (allowed !== false) {
          router.replace('/unauthorized');
          setAllowed(false);
        }
        return;
      }
      if (allowed !== true) {
        setAllowed(true);
      }
    }
  }, [roles, router, user, allowed]);

  if (allowed === null)
    return (
      <div className="p-10 text-center">
        <Loader />
      </div>
    );

  if (allowed === false)
    return (
      <div className="p-10 text-center text-red-500">
        <Loader />
      </div>
    );

  return children;
}
