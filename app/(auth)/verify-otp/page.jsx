"use client";

import { useRef, useState, useEffect } from "react";
import Swal from "sweetalert2";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function VerifyOtpPage() {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [email, setEmail] = useState("");
  const inputRefs = useRef([]);

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("email");
    setEmail(value || "");

    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;

    const newOtp = [...otp];

    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 3 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 4).split("");
    if (pastedData.every(char => !isNaN(char))) {
      const newOtp = [...otp];
      pastedData.forEach((val, i) => {
        if (i < 4) newOtp[i] = val;
      });
      setOtp(newOtp);
      if (inputRefs.current[pastedData.length - 1]) {
        inputRefs.current[pastedData.length - 1].focus();
      }
    }
  };

  const handleVerify = () => {
    const otpString = otp.join("");

    if (otpString === "1234") {
      Swal.fire({
        title: "Verified!",
        text: "Redirecting to dashboard...",
        icon: "success",
        confirmButtonColor: "rgb(var(--color-primary))",
        timer: 1500,
        showConfirmButton: false,
      });

      const user = JSON.parse(localStorage.getItem("user"));

      setTimeout(() => {
        if (user?.role === "admin") {
          window.location.href = "/admin/dashboard";
        } else if (user?.role === "dealer") {
          window.location.href = "/dealer/dashboard";
        } else if (user?.role === "super_admin") {
          window.location.href = "/super-admin/dashboard";
        } else {
          window.location.href = "/dashboard";
        }
      }, 1500);
    } else {
      Swal.fire({
        title: "Invalid Code",
        text: "Please try again. (Hint: Use 1234)",
        icon: "error",
        confirmButtonColor: "rgb(var(--color-error))",
      });

      setOtp(["", "", "", ""]);
      inputRefs.current[0].focus();
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0B0F19] lg:bg-[rgb(var(--color-background))]">

      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0B0F19] text-white flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-gray-900 via-[#111827] to-[rgb(var(--color-primary))] opacity-90"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-[rgb(var(--color-primary))] rounded-lg flex items-center justify-center font-bold">M</div>
            <span className="text-xl font-semibold tracking-wide">MotorQuote</span>
          </div>
        </div>

        {/* Hero Text */}
        <div className="relative z-10 space-y-4 max-w-lg mb-20">
          <h1 className="text-4xl font-bold leading-tight">
            Two-Factor <br />
            <span className="text-[rgb(var(--color-success))]">Authentication.</span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            Adding an extra layer of security to your dealership data. Please verify your identity to continue.
          </p>
        </div>

        <div className="relative z-10 text-sm text-gray-500">
          © 2025 MotorQuote Ltd.
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-12 relative">

        <div className="lg:hidden absolute inset-0 z-0 bg-gradient-to-br from-[#0B0F19] to-[#1a1f35]"></div>

        <div className="w-full max-w-md bg-[rgb(var(--color-surface))] rounded-3xl shadow-2xl p-8 z-10 lg:bg-transparent lg:shadow-none lg:p-0 lg:rounded-none">

          {/* Back Link */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>

          <div className="text-center lg:text-left mb-8">
            <div className="w-12 h-12 bg-[rgb(var(--color-primary)/0.1)] rounded-full flex items-center justify-center text-[rgb(var(--color-primary))] mb-4 mx-auto lg:mx-0">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-2xl font-bold text-[rgb(var(--color-text))]">Verify it&apos;s you</h2>
            <p className="text-[rgb(var(--color-text-muted))] mt-2 text-sm">
              Enter the 4-digit code sent to <br className="lg:hidden" />
              <span className="font-semibold text-[rgb(var(--color-text))]">{email || "your email"}</span>
            </p>
          </div>

          {/* OTP INPUTS */}
          <div className="flex justify-center lg:justify-start gap-3 mb-8" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                type="text"
                maxLength={1}
                value={digit}
                ref={(el) => (inputRefs.current[i] = el)}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-14 h-14 text-center text-2xl font-bold rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))]
                        focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.2)] focus:border-[rgb(var(--color-primary))] focus:-translate-y-1 transition-all shadow-sm"
              />
            ))}
          </div>

          <button
            onClick={handleVerify}
            className="w-full h-12 bg-[rgb(var(--color-primary))] text-white font-medium rounded-lg shadow-lg shadow-[rgb(var(--color-primary)/0.2)] 
                hover:bg-[rgb(var(--color-primary-dark))] hover:shadow-[rgb(var(--color-primary)/0.4)] active:scale-[0.98] transition-all"
          >
            Verify & Continue
          </button>

          <p className="text-center text-sm text-[rgb(var(--color-text-muted))] mt-6">
            Didn&apos;t receive the code?{" "}
            <button className="text-[rgb(var(--color-primary))] font-semibold hover:underline">
              Resend Code
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}