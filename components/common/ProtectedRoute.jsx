"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Loader from "../dashboard/(ReusableDashboardComponents)/Loader";

export default function ProtectedRoute({ roles = [], children }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
      Cookies.remove("role");
      router.replace("/login");
      setAllowed(false);
      return;
    }

    if (roles.length && !roles.includes(user.role)) {
      router.replace("/unauthorized");
      setAllowed(false);
      return;
    }

    setAllowed(true);
  }, [roles, router]);

  if (allowed === null) return <div className="p-10 text-center"><Loader/></div>;

  if (allowed === false) return <div className="p-10 text-center text-red-500"><Loader/></div>;

  return children;
}
