'use client';
import React, { useState, useEffect } from 'react';
import {
  Save,
  Plus,
  Trash2,
  Edit2,
  Move,
  FileText,
  HelpCircle,
  Shield,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import cmsService from '../../../services/cmsService';
import Loader from '../../common/Loader';
import FormModal from '../../common/FormModal';
import DataTable from '../../common/DataTable';
import Swal from 'sweetalert2';
import * as yup from 'yup';
import TabNavigation from '@/components/common/TabNavigation';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'clean'],
  ],
};

const faqSchema = yup.object().shape({
  title: yup.string().required('Question is required'),
  content: yup.string().required('Answer is required'),
  displayOrder: yup
    .number()
    .typeError('Must be a number')
    .min(0, 'Must be positive')
    .required('Order is required'),
});

export default function ContentManagerView() {
  const [activeTab, setActiveTab] = useState('faq');
  const [loading, setLoading] = useState(false);

  // FAQ State
  const [faqs, setFaqs] = useState([]);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  // Singleton Content State (Terms/Privacy)
  const [singletonData, setSingletonData] = useState({ title: '', content: '' });
  const [isSingletonDirty, setIsSingletonDirty] = useState(false);

  const loadContent = React.useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'faq') {
        const data = await cmsService.getFAQs();
        setFaqs(data);
      } else if (activeTab === 'terms') {
        const data = await cmsService.getTerms();
        setSingletonData(data);
        setIsSingletonDirty(false);
      } else if (activeTab === 'privacy') {
        const data = await cmsService.getPrivacy();
        setSingletonData(data);
        setIsSingletonDirty(false);
      }
    } catch (error) {
      console.error('Failed to load content', error);
      Swal.fire('Error', 'Failed to load content', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const handleSaveFaq = async (formData) => {
    try {
      if (editingFaq) {
        await cmsService.updateFAQ(editingFaq.id, { ...formData, isActive: true });
        Swal.fire('Updated', 'FAQ updated successfully', 'success');
      } else {
        await cmsService.createFAQ({ ...formData, isActive: true });
        Swal.fire('Created', 'FAQ created successfully', 'success');
      }
      setIsFaqModalOpen(false);
      setEditingFaq(null);
      loadContent();
    } catch (error) {
      console.error('Save FAQ failed', error);
      Swal.fire('Error', 'Could not save FAQ', 'error');
    }
  };

  const handleDeleteFaq = async (id) => {
    Swal.fire({
      title: 'Delete FAQ?',
      text: 'This cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'rgb(var(--color-error))',
      cancelButtonColor: 'rgb(var(--color-text-muted))',
      confirmButtonText: 'Yes, delete it',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await cmsService.deleteFAQ(id);
          Swal.fire('Deleted', 'FAQ removed.', 'success');
          loadContent();
        } catch (error) {
          Swal.fire('Error', 'Could not delete FAQ', 'error');
        }
      }
    });
  };

  const handleSingletonChange = (field, value) => {
    setSingletonData((prev) => ({ ...prev, [field]: value }));
    setIsSingletonDirty(true);
  };

  const handleSaveSingleton = async () => {
    try {
      let savedData;
      if (activeTab === 'terms') {
        savedData = await cmsService.saveTerms(singletonData);
      } else {
        savedData = await cmsService.savePrivacy(singletonData);
      }
      setSingletonData(savedData);
      setIsSingletonDirty(false);
      Swal.fire('Saved', 'Content updated successfully', 'success');
    } catch (error) {
      console.error('Save failed', error);
      Swal.fire('Error', 'Could not save content', 'error');
    }
  };

  if (loading && !faqs.length && !singletonData.id) return <Loader />;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--color-text))]">
            Web Content Management
          </h1>
          <p className="text-[rgb(var(--color-text-muted))] text-sm">
            Manage FAQs, Terms & Conditions, and Privacy Policy.
          </p>
        </div>

        {['terms', 'privacy'].includes(activeTab) && (
          <button
            onClick={handleSaveSingleton}
            disabled={!isSingletonDirty}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium
                             ${
                               isSingletonDirty
                                 ? 'bg-[rgb(var(--color-primary))] text-white hover:bg-[rgb(var(--color-primary-dark))] shadow-lg'
                                 : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                             }`}
          >
            <Save size={18} />
            <span>Save Changes</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={[
          { key: 'faq', label: 'FAQs', icon: HelpCircle },
          { key: 'terms', label: 'Terms & Conditions', icon: FileText },
          { key: 'privacy', label: 'Privacy Policy', icon: Shield },
        ]}
      />

      <div className="bg-[rgb(var(--color-surface))] rounded-2xl border border-[rgb(var(--color-border))] shadow-sm min-h-[500px]">
        {/* FAQ View */}
        {activeTab === 'faq' && (
          <div className="p-0">
            <DataTable
              data={faqs}
              searchKeys={['title', 'content']}
              extraControls={
                <button
                  onClick={() => {
                    setEditingFaq(null);
                    setIsFaqModalOpen(true);
                  }}
                  className="flex items-center gap-2 bg-[rgb(var(--color-primary))] text-white px-4 py-2 rounded-xl border border-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary-dark))] transition-all text-sm font-bold shadow-sm whitespace-nowrap"
                >
                  <Plus size={16} />
                  <span>Add FAQ</span>
                </button>
              }
              columns={[
                {
                  header: 'Order',
                  accessor: 'displayOrder',
                  className: 'w-20 text-center font-mono text-gray-500',
                },
                {
                  header: 'Question',
                  accessor: (row) => (
                    <div>
                      <p className="font-semibold text-[rgb(var(--color-text))]">{row.title}</p>
                      <p className="text-xs text-[rgb(var(--color-text-muted))] line-clamp-1">
                        {row.content?.replace(/<[^>]*>?/gm, '')}
                      </p>
                    </div>
                  ),
                },
                {
                  header: 'Actions',
                  accessor: (row) => (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingFaq(row);
                          setIsFaqModalOpen(true);
                        }}
                        className="p-1.5 text-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary))]/5 rounded"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteFaq(row.id)}
                        className="p-1.5 text-[rgb(var(--color-error))] hover:bg-[rgb(var(--color-error))]/5 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        )}

        {/* Editor View (Terms/Privacy) */}
        {['terms', 'privacy'].includes(activeTab) && (
          <div className="flex flex-col h-[70vh]">
            <div className="p-6 pb-0 space-y-4">
              <div>
                <label className="text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wide">
                  Document Title
                </label>
                <input
                  type="text"
                  value={singletonData.title || ''}
                  onChange={(e) => handleSingletonChange('title', e.target.value)}
                  className="w-full mt-2 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-lg px-4 py-3 font-semibold text-[rgb(var(--color-text))] focus:ring-2 focus:ring-[rgb(var(--color-primary))]"
                  placeholder="Enter document title (e.g. Terms of Service)"
                />
              </div>
            </div>
            <div className="flex-1 p-6 flex flex-col quill-wrapper">
              <label className="text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wide mb-2">
                Content Body
              </label>
              <ReactQuill
                theme="snow"
                value={singletonData.content || ''}
                onChange={(val) => handleSingletonChange('content', val)}
                modules={modules}
                className="flex-1 flex flex-col bg-[rgb(var(--color-background))] rounded-lg overflow-hidden border border-[rgb(var(--color-border))]"
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
                flex: 1;
                display: flex;
                flex-direction: column;
              }
              .quill-wrapper .ql-editor {
                padding: 20px;
                flex: 1;
                overflow-y: auto;
              }
            `}</style>
          </div>
        )}
      </div>

      {/* FAQ Modal */}
      <FormModal
        isOpen={isFaqModalOpen}
        onClose={() => setIsFaqModalOpen(false)}
        onSave={handleSaveFaq}
        title={editingFaq ? 'Edit FAQ' : 'Add New FAQ'}
        initialData={editingFaq}
        validationSchema={faqSchema}
        fields={[
          { name: 'title', label: 'Question', placeholder: 'e.g. How do I reset my password?' },
          {
            name: 'content',
            label: 'Answer',
            type: 'textarea',
            placeholder: 'Enter the answer here...',
          },
          { name: 'displayOrder', label: 'Display Order', type: 'number', placeholder: '0' },
        ]}
      />
    </div>
  );
}
