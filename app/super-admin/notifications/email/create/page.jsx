"use client";
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import { ArrowLeft, Save, X, Eye, Send as SendIcon, Info, Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const modules = {
    toolbar: [
        [{ 'header': [1, 2, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
        ['link', 'image'],
        ['clean']
    ],
};

const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image'
];

const SYSTEM_FOOTER = `
<br/>
<hr/>
<p style="font-size: 10px; color: #666; font-family: sans-serif;">
    This is a system-generated email from MotorQuote.<br/>
    Please do not reply.
</p>
`;

const StatusBadge = ({ status }) => {
    const styles = {
        'Active': 'bg-green-100 text-green-700 border-green-200',
        'Draft': 'bg-yellow-100 text-yellow-700 border-yellow-200',
        'Disabled': 'bg-gray-100 text-gray-500 border-gray-200',
        'System Locked': 'bg-red-50 text-red-600 border-red-200'
    };
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${styles[status] || styles['Draft']}`}>
            {status}
        </span>
    );
};

export default function CreateEmailTemplate() {
    const searchParams = useSearchParams();
    const templateId = searchParams.get('id');

    const [templateData, setTemplateData] = useState({
        name: '',
        subject: '',
        category: 'Onboarding',
        type: 'Welcome Email',
        status: 'Draft',
        audience: 'All Users',
        triggerEvent: 'Manual / Broadcast',
        body: 'Hi {{first_name}},\n\nThanks for joining MotorQuote.',
    });

    const [showPreviewModal, setShowPreviewModal] = useState(false);

    const router = useRouter();

    useEffect(() => {
        if (templateId) {
            const storedTemplates = JSON.parse(localStorage.getItem('emailTemplates') || '[]');
            const existing = storedTemplates.find(t => t.id === templateId);
            if (existing) {
                setTemplateData(existing);
            }
        }
    }, [templateId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setTemplateData(prev => {
            const newData = { ...prev, [name]: value };

            if (name === 'triggerEvent') {
                const triggerMap = {
                    'Dealer Onboarded': 'Dealers Only',
                    'Quote Generated': 'User & Dealer',
                    'Quote Approved': 'User & Dealer',
                    'Policy Issued': 'User & Dealer',
                    'Manual / Broadcast': 'All Users'
                };
                newData.audience = triggerMap[value] || 'All Users';
            }

            return newData;
        });
    };

    const handleBodyChange = (value) => {
        setTemplateData(prev => ({ ...prev, body: value }));
    };

    const getPreviewHtml = () => {
        let previewHtml = templateData.body + SYSTEM_FOOTER;

        const dummyData = {
            '{{first_name}}': 'John',
            '{{last_name}}': 'Doe',
            '{{email}}': 'john.doe@example.com',
            '{{dealership_name}}': 'Best Cars LLC',
            '{{manager_name}}': 'Mike Ross',
            '{{quote_id}}': 'Q-12345',
            '{{vehicle_model}}': 'Toyota Camry',
            '{{price}}': '$25,000',
            '{{reset_password_link}}': '<a href="#" style="color:blue">Reset Password</a>',
            '{{login_link}}': '<a href="#" style="color:blue">Login Now</a>',
        };

        Object.keys(dummyData).forEach(tag => {
            previewHtml = previewHtml.replaceAll(tag, dummyData[tag]);
        });

        return previewHtml;
    };

    const handlePreview = () => {
        setShowPreviewModal(true);
    };

    const handleSendTest = () => {
        Swal.fire({
            title: 'Send Test Email',
            text: `Sending this template to your logged-in email?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Send Test',
            confirmButtonColor: 'rgb(var(--color-primary))',
            showLoaderOnConfirm: true,
            preConfirm: () => {
                return new Promise(resolve => setTimeout(resolve, 1000));
            }
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire('Sent!', 'Test email has been sent successfully.', 'success');
            }
        });
    };

    const handleSave = () => {
        if (!templateData.name || !templateData.subject) {
            Swal.fire('Error', 'Please fill in Template Name and Subject', 'error');
            return;
        }

        if (templateData.status === 'Active') {
            Swal.fire({
                title: 'Activate Template?',
                html: `
                    <p class="mb-2">You are about to make this template <strong>Active</strong>.</p>
                    <ul class="text-left text-sm bg-gray-50 p-3 rounded mb-4 list-disc pl-5">
                        <li><strong>Trigger:</strong> ${templateData.triggerEvent}</li>
                        <li><strong>Audience:</strong> ${templateData.audience}</li>
                    </ul>
                    <p class="text-xs text-red-500 font-bold">Please ensure all content is correct.</p>
                `,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, Activate & Save',
                confirmButtonColor: '#22c55e'
            }).then((result) => {
                if (result.isConfirmed) {
                    processSave();
                }
            });
        } else {
            processSave();
        }
    };

    const processSave = () => {
        const existingTemplates = JSON.parse(localStorage.getItem('emailTemplates') || '[]');
        let updatedTemplates;

        if (templateId) {
            updatedTemplates = existingTemplates.map(t =>
                t.id === templateId
                    ? { ...templateData, id: templateId, lastUpdated: new Date().toISOString(), lastModifiedBy: 'Super Admin' }
                    : t
            );
        } else {
            const newTemplate = {
                id: Date.now().toString(),
                ...templateData,
                lastUpdated: new Date().toISOString(),
                lastModifiedBy: 'Super Admin',
            };
            updatedTemplates = [newTemplate, ...existingTemplates];
        }

        localStorage.setItem('emailTemplates', JSON.stringify(updatedTemplates));

        Swal.fire({
            title: 'Saved!',
            text: `Template ${templateId ? 'updated' : 'created'} successfully.`,
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        }).then(() => {
            router.push('/super-admin/notifications/email');
        });
    };

    const isLocked = templateData.status === 'System Locked';

    return (
        <div className="min-h-screen bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/super-admin/notifications/email" className="p-2 rounded-lg hover:bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-muted))] transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold ">Create New Template</h1>
                        {isLocked && <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded uppercase"><Lock size={12} /> Locked</span>}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleSendTest} className="px-4 py-2 rounded-lg border border-[rgb(var(--color-border))] text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-surface))] transition-colors text-sm font-medium flex items-center gap-2">
                        <SendIcon size={16} />
                        Test Email
                    </button>
                    <button onClick={handlePreview} className="px-4 py-2 rounded-lg border border-[rgb(var(--color-primary))] text-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary))/0.1] transition-colors text-sm font-medium flex items-center gap-2">
                        <Eye size={16} />
                        Preview
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 rounded-lg text-white transition-colors text-sm font-medium flex items-center gap-2 bg-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary-dark))]">
                        <Save size={16} />
                        Save Template
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
                {/* Main Form Area */}
                <div className="flex-1 bg-[rgb(var(--color-surface))] rounded-xl border border-[rgb(var(--color-border))] p-6 space-y-6 overflow-y-auto">

                    {isLocked && (
                        <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-start gap-3">
                            <Lock className="text-red-500 mt-0.5" size={16} />
                            <div>
                                <h3 className="text-sm font-bold text-red-700">System Locked Template</h3>
                                <p className="text-xs text-red-600 mt-1">
                                    This template is critical for system operations. Trigger, Audience, and Status cannot be changed.
                                    You may only edit the content.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Top Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--color-text-muted))]">Template Name</label>
                            <input
                                type="text"
                                name="name"
                                value={templateData.name}
                                onChange={handleInputChange}
                                placeholder="e.g. New Member Welcome"
                                className="w-full bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[rgb(var(--color-primary))] transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--color-text-muted))]">Subject Line</label>
                            <input
                                type="text"
                                name="subject"
                                value={templateData.subject}
                                onChange={handleInputChange}
                                placeholder="e.g. Welcome to MotorQuote!"
                                className="w-full bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[rgb(var(--color-primary))] transition-colors"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4 bg-[rgb(var(--color-background))] rounded-lg border border-[rgb(var(--color-border))]">

                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--color-text-muted))]">Status</label>
                            <select
                                name="status"
                                value={templateData.status}
                                onChange={handleInputChange}
                                disabled={isLocked}
                                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[rgb(var(--color-primary))] transition-all appearance-none font-medium cursor-pointer 
                                ${templateData.status === 'Active' ? 'text-green-700 ' :
                                        templateData.status === 'Draft' ? 'text-yellow-700 ' :
                                            templateData.status === 'Disabled' ? 'text-gray-500 ' :
                                                templateData.status === 'System Locked' ? 'text-red-600 ' :
                                                    'text-[rgb(var(--color-text))] '}`}
                            >
                                <option value="Draft">Draft</option>
                                <option value="Active">Active</option>
                                <option value="Disabled">Disabled</option>
                                <option value="System Locked">System Locked</option>
                            </select>
                        </div>


                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--color-text-muted))]">Trigger Event</label>
                            <select
                                name="triggerEvent"
                                value={templateData.triggerEvent}
                                onChange={handleInputChange}
                                disabled={isLocked}
                                className="w-full bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[rgb(var(--color-primary))] transition-colors appearance-none"
                            >
                                <option>Manual / Broadcast</option>
                                <option>Dealer Onboarded</option>
                                <option>Quote Generated</option>
                                <option>Quote Approved</option>
                                <option>Policy Issued</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--color-text-muted))]">Target Audience</label>
                            <div className="w-full bg-gray-100 border border-[rgb(var(--color-border))] rounded-lg px-3 py-2 text-sm text-[rgb(var(--color-text-muted))] cursor-not-allowed flex items-center gap-2">
                                <Info size={14} />
                                {templateData.audience}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--color-text-muted))]">Category</label>
                            <select
                                name="category"
                                value={templateData.category}
                                onChange={handleInputChange}
                                disabled={isLocked}
                                className="w-full bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[rgb(var(--color-primary))] transition-colors appearance-none"
                            >
                                <option>Onboarding</option>
                                <option>Marketing</option>
                                <option>Alerts</option>
                                <option>Payments</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2 flex-1 flex flex-col min-h-[400px]">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--color-text-muted))]">Email Body</label>
                            <span className="text-[10px] text-[rgb(var(--color-text-muted))] bg-yellow-50 px-2 py-1 rounded border border-yellow-200">
                                System footer will be appended automatically.
                            </span>
                        </div>

                        <div className="flex-1 bg-[rgb(var(--color-background))] rounded-xl border border-[rgb(var(--color-border))] overflow-hidden flex flex-col quill-wrapper relative">
                            <ReactQuill
                                theme="snow"
                                value={templateData.body}
                                onChange={handleBodyChange}
                                modules={modules}
                                formats={formats}
                                className="flex-1 flex flex-col h-full border-none"
                            />
                        </div>
                        <style jsx global>{`
                            .quill-wrapper .ql-toolbar {
                                border: none !important;
                                border-bottom: 1px solid rgb(var(--color-border)) !important;
                                background: rgb(var(--color-surface));
                            }
                            .quill-wrapper .ql-container {
                                border: none !important;
                                font-family: inherit;
                                font-size: 14px;
                                }
                            .quill-wrapper .ql-editor {
                                padding: 16px;
                                min-height: 200px;
                            }
                        `}</style>
                    </div>
                </div>
            </div>
            {showPreviewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-[rgb(var(--color-surface))] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-[rgb(var(--color-border))]">
                            <h2 className="text-lg font-bold">Email Preview</h2>
                            <button onClick={() => setShowPreviewModal(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto bg-gray-100 p-8">
                            <div className="max-w-[600px] mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
                                <div className="border-b border-gray-200 p-6">
                                    <h1 className="text-xl font-bold text-gray-900 mb-4">{templateData.subject || '(No Subject)'}</h1>
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                            M
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-baseline justify-between">
                                                <p className="font-bold text-gray-900 text-sm">MotorQuote <span className="font-normal text-gray-500">&lt;notifications@motorquote.com&gt;</span></p>
                                                <span className="text-xs text-gray-400">10:30 AM (Just now)</span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5">to John Doe</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 prose prose-sm max-w-none text-gray-800 font-sans leading-relaxed" dangerouslySetInnerHTML={{ __html: getPreviewHtml() }} />
                            </div>
                        </div>
                        <div className="p-4 border-t border-[rgb(var(--color-border))] bg-gray-50 flex justify-end">
                            <button
                                onClick={() => setShowPreviewModal(false)}
                                className="px-4 py-2 bg-[rgb(var(--color-primary))] text-white text-sm font-bold rounded-lg hover:bg-[rgb(var(--color-primary-dark))] transition-colors"
                            >
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
