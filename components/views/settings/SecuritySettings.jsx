"use client";
import React, { useState } from 'react';
import { Shield, Lock, Eye, EyeOff } from "lucide-react";
import Swal from "sweetalert2";
import * as yup from "yup";
import { useAuth } from "../../../context/AuthContext";

export default function SecuritySettings() {
    const { user, updateProfile } = useAuth();
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
    const [showPasswordForm, setShowPasswordForm] = useState(false);

    // Form State
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [errors, setErrors] = useState({});
    const validationSchema = yup.object().shape({
        current: yup.string().required("Current password is required"),
        new: yup.string()
            .required("New password is required")
            .min(8, "Password must be at least 8 characters")
            .matches(/[A-Z]/, "Must contain at least one uppercase letter")
            .matches(/[a-z]/, "Must contain at least one lowercase letter")
            .matches(/[0-9]/, "Must contain at least one number")
            .matches(/[!@#$%^&*(),.?":{}|<>]/, "Must contain at least one special character"),
        confirm: yup.string()
            .oneOf([yup.ref('new'), null], "Passwords must match")
            .required("Confirm password is required")
    });

    const handle2FAToggle = () => {
        setTwoFactorEnabled(!twoFactorEnabled);
        Swal.fire({
            icon: 'success',
            title: !twoFactorEnabled ? '2FA Enabled' : '2FA Disabled',
            text: `Two-factor authentication has been ${!twoFactorEnabled ? 'enabled' : 'disabled'} for your account.`,
            timer: 1500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
        });
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswords(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const toggleVisibility = (field) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleSubmitPassword = async (e) => {
        e.preventDefault();
        setErrors({});

        try {

            await validationSchema.validate(passwords, { abortEarly: false });


            if (passwords.current !== user?.password) {
                setErrors(prev => ({ ...prev, current: "Incorrect current password" }));
                Swal.fire({
                    icon: 'error',
                    title: 'Incorrect Password',
                    text: 'The current password you entered is incorrect.',
                    timer: 3000,
                    showConfirmButton: false,
                    toast: true,
                    position: 'top-end'
                });
                return;
            }
            updateProfile({ password: passwords.new });
            Swal.fire({
                icon: 'success',
                title: 'Password Updated',
                text: 'Your password has been changed successfully.',
                timer: 2000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });

            setShowPasswordForm(false);
            setPasswords({ current: '', new: '', confirm: '' });

        } catch (err) {
            if (err instanceof yup.ValidationError) {
                const newErrors = {};
                err.inner.forEach(error => {
                    newErrors[error.path] = error.message;
                });
                setErrors(newErrors);
            }
        }
    };

    const renderPasswordInput = (name, label, placeholder) => (
        <div>
            <label className="block text-sm font-semibold text-[rgb(var(--color-text))] mb-1.5">{label}</label>
            <div className="relative group">
                <Lock
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))] group-focus-within:text-[rgb(var(--color-primary))] transition-colors"
                    size={18}
                />
                <input
                    type={showPasswords[name] ? "text" : "password"}
                    name={name}
                    placeholder={placeholder}
                    value={passwords[name]}
                    onChange={handlePasswordChange}
                    className={`w-full h-11 pl-10 pr-10 bg-[rgb(var(--color-background))] border rounded-lg text-[rgb(var(--color-text))] text-sm placeholder-[rgb(var(--color-text-muted))] 
                  focus:bg-[rgb(var(--color-surface))] focus:ring-4 focus:ring-[rgb(var(--color-primary)/0.1)] focus:border-[rgb(var(--color-primary))] outline-none transition-all
                  ${errors[name]
                            ? "border-[rgb(var(--color-error))] bg-[rgb(var(--color-error)/0.05)]"
                            : "border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-text-muted))]"}`}
                />
                <button
                    type="button"
                    onClick={() => toggleVisibility(name)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] transition-colors"
                >
                    {showPasswords[name] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>
            {errors[name] && (
                <p className="text-[rgb(var(--color-error))] text-xs mt-1.5 font-medium flex items-center gap-1">
                    ⚠️ {errors[name]}
                </p>
            )}
        </div>
    );

    return (
        <div className="bg-[rgb(var(--color-surface))] rounded-xl shadow-sm border border-[rgb(var(--color-border))] p-8">
            <h2 className="text-lg font-bold text-[rgb(var(--color-text))] mb-6 flex items-center gap-2">
                <Shield size={20} className="text-[rgb(var(--color-primary))]" />
                Security
            </h2>
            <div className="space-y-6">

                {/* 2FA Section */}
                <div className="flex items-center justify-between p-4 bg-[rgb(var(--color-background))] rounded-lg border border-[rgb(var(--color-border))]">
                    <div>
                        <h4 className="font-semibold text-[rgb(var(--color-text))] text-sm">Two-Factor Authentication</h4>
                        <p className="text-xs text-[rgb(var(--color-text-muted))]">Add an extra layer of security to your account.</p>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={twoFactorEnabled}
                            onChange={handle2FAToggle}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[rgb(var(--color-primary)/0.3)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[rgb(var(--color-primary))]"></div>
                    </div>
                </div>

                <div className="border-t border-[rgb(var(--color-border))]"></div>

                {/* Password Change Section */}
                <div>
                    {!showPasswordForm ? (
                        <button
                            onClick={() => setShowPasswordForm(true)}
                            className="text-[rgb(var(--color-primary))] font-medium hover:underline text-sm flex items-center gap-2"
                        >
                            <Lock size={16} /> Change Password
                        </button>
                    ) : (
                        <form onSubmit={handleSubmitPassword} className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-sm font-semibold text-[rgb(var(--color-text))]">Change Password</h4>
                                <button type="button" onClick={() => setShowPasswordForm(false)} className="text-xs text-[rgb(var(--color-error))] hover:underline">Cancel</button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {renderPasswordInput('current', 'Current Password', 'Enter current password')}
                                {renderPasswordInput('new', 'New Password', 'Enter new password')}
                                {renderPasswordInput('confirm', 'Confirm Password', 'Confirm new password')}
                            </div>

                            <div className="flex justify-end pt-2">
                                <button type="submit" className="bg-[rgb(var(--color-primary))] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[rgb(var(--color-primary-dark))] shadow-lg shadow-[rgb(var(--color-primary)/0.3)] transition-all">
                                    Update Password
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
