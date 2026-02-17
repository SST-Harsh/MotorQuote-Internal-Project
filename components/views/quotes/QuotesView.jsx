'use client';

import {
  Download,
  Plus,
  FileText,
  User,
  Users,
  Car,
  DollarSign,
  Calendar,
  Briefcase,
  Eye,
  Edit2,
  Trash2,
  Phone,
  Mail,
  ChevronDown,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import DataTable from '../../common/DataTable';
import { useNotifications } from '../../../context/NotificationContext';
import { useAuth } from '../../../context/AuthContext';
import * as yup from 'yup';
import GenericFormModal from '../../common/FormModal';
import DetailViewModal from '../../common/DetailViewModal';
import Swal from 'sweetalert2';
import { useState, useEffect } from 'react';
import 'jspdf-autotable';

const quoteSchema = yup.object().shape({
  // Customer Info
  customerName: yup
    .string()
    .required('Customer Name is required')
    .min(2, 'Name must be at least 2 characters'),
  customerEmail: yup.string().email('Invalid email address').required('Customer Email is required'),
  customerPhone: yup
    .string()
    .matches(/^[0-9]{10}$/, 'Phone must be exactly 10 digits')
    .required('Phone Number is required'),

  // Vehicle Info
  year: yup
    .number()
    .typeError('Must be a number')
    .required('Year is required')
    .integer()
    .min(1900, 'Invalid year')
    .max(new Date().getFullYear() + 1, 'Future year not allowed'),
  make: yup.string().required('Make is required'),
  model: yup.string().required('Model is required'),
  vin: yup
    .string()
    .required('VIN is required')
    .length(17, 'VIN must be exactly 17 characters')
    .matches(/^[A-HJ-NPR-Z0-9]+$/i, 'VIN must be alphanumeric (excluding I, O, Q)'),

  // Pricing
  basePrice: yup
    .number()
    .typeError('Must be a number')
    .required('Base Price is required')
    .min(0, 'Price cannot be negative'),
  discount: yup
    .number()
    .typeError('Must be a number')
    .min(0, 'Cannot be negative')
    .max(100, 'Discount cannot exceed 100%')
    .default(0),
  tradeInValue: yup.number().typeError('Must be a number').min(0, 'Cannot be negative').default(0),
  financingOption: yup.string().required('Financing Option is required'),

  // Assignment
  dealer: yup.string().required('Dealership is required'),
  assignedSeller: yup.string().required('Assigned Seller is required'),

  // Meta
  // status: yup.string().required('Status is required'), // Status is often set automatically or defaults
  notes: yup.string().nullable(),
});

const initialQuotes = [
  {
    id: '#1052',
    vehicle: '2023 Tata Nexon EV',
    year: 2023,
    make: 'Tata',
    model: 'Nexon EV',
    vin: 'SAMPLEVIN12345678',
    customerName: 'Rahul Dravid',
    customerEmail: 'rahul@mail.com',
    customerPhone: '9876543210',
    dealer: 'Premium Motors',
    assignedSeller: 'John Doe',
    amount: '₹14,50,000',
    basePrice: 1450000,
    discount: 0,
    tradeInValue: 0,
    financingOption: 'Finance',
    status: 'Pending',
    date: '22 Dec, 2025',
  },
  {
    id: '#1051',
    vehicle: '2022 Hyundai Creta',
    year: 2022,
    make: 'Hyundai',
    model: 'Creta',
    vin: 'SAMPLEVIN87654321',
    customerName: 'Sania Mirza',
    customerEmail: 'sania@mail.com',
    customerPhone: '8765432109',
    dealer: 'Velocity Motors',
    assignedSeller: 'Jane Smith',
    amount: '₹11,20,000',
    basePrice: 1120000,
    discount: 0,
    tradeInValue: 0,
    financingOption: 'Cash',
    status: 'Approved',
    date: '21 Dec, 2025',
  },
  {
    id: '#1050',
    vehicle: '2021 Maruti Swift',
    year: 2021,
    make: 'Maruti',
    model: 'Swift',
    vin: 'SAMPLEVIN12345678',
    customerName: 'John Doe',
    customerEmail: 'john@mail.com',
    customerPhone: '1234567890',
    dealer: 'Premium Motors',
    assignedSeller: 'John Doe',
    amount: '₹12,50,000',
    basePrice: 1250000,
    discount: 0,
    tradeInValue: 0,
    financingOption: 'Finance',
    status: 'Pending',
    date: '20 Dec, 2025',
  },
  {
    id: '#1049',
    vehicle: '2020 Honda City',
    year: 2020,
    make: 'Honda',
    model: 'City',
    vin: 'SAMPLEVIN12345678',
    customerName: 'Jane Doe',
    customerEmail: 'jane@mail.com',
    customerPhone: '0987654321',
    dealer: 'Velocity Motors',
    assignedSeller: 'Jane Smith',
    amount: '₹10,80,000',
    basePrice: 1080000,
    discount: 0,
    tradeInValue: 0,
    financingOption: 'Cash',
    status: 'Pending',
    date: '19 Dec, 2025',
  },
];

export default function QuotesView({ userRole }) {
  const { user } = useAuth();
  const { createNotification } = useNotifications();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');

  const [quotes, setQuotes] = useState(initialQuotes);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  const [viewingQuote, setViewingQuote] = useState(null);

  // Derived state for display
  const displayedQuotes =
    userRole === 'dealer' && user?.dealership
      ? quotes.filter((q) => q.dealer === user.dealership)
      : quotes;

  useEffect(() => {
    const stored = localStorage.getItem('quotes_data_v1');
    if (stored) setQuotes(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (quotes !== initialQuotes) localStorage.setItem('quotes_data_v1', JSON.stringify(quotes));
  }, [quotes]);

  const [dealershipOptions, setDealershipOptions] = useState([]);
  const [sellerOptions, setSellerOptions] = useState([]);

  useEffect(() => {
    // Load Dealerships
    const storedDealers = localStorage.getItem('dealerships');
    if (storedDealers) {
      try {
        const dealers = JSON.parse(storedDealers);
        setDealershipOptions(dealers.map((d) => ({ value: d.name, label: d.name })));
      } catch (e) {
        console.error('Failed to parse dealerships', e);
      }
    } else {
      // Fallback mock options if no data found
      setDealershipOptions([
        { value: 'Premium Motors', label: 'Premium Motors' },
        { value: 'Velocity Motors', label: 'Velocity Motors' },
      ]);
    }

    // Load Sellers
    const storedSellers = localStorage.getItem('sellers_data');
    if (storedSellers) {
      try {
        const sellers = JSON.parse(storedSellers);
        // Filter active sellers maybe? For now just show all.
        setSellerOptions(sellers.map((s) => ({ value: s.name, label: s.name })));
      } catch (e) {
        console.error('Failed to parse sellers', e);
      }
    } else {
      // Fallback mock options
      setSellerOptions([
        { value: 'John Doe', label: 'John Doe' },
        { value: 'Jane Smith', label: 'Jane Smith' },
      ]);
    }
  }, [isAddModalOpen]);

  const handleSave = (formData) => {
    const price = Number(formData.basePrice) || 0;
    const discountPercent = Number(formData.discount) || 0;
    const discountAmount = (price * discountPercent) / 100;
    const tradeIn = Number(formData.tradeInValue) || 0;
    const finalVal = price - discountAmount - tradeIn;
    const finalAmount = finalVal.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });
    const vehicleTitle = `${formData.year} ${formData.make} ${formData.model}`;

    const payload = {
      ...formData,
      vehicle: vehicleTitle,
      amount: finalAmount,
      date: editingQuote
        ? editingQuote.date
        : new Date().toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
    };

    if (payload.id && quotes.some((q) => q.id === payload.id)) {
      setQuotes((prev) => prev.map((q) => (q.id === payload.id ? { ...q, ...payload } : q)));
      Swal.fire({
        icon: 'success',
        title: 'Updated!',
        text: `Quote ${payload.id} updated successfully.`,
        timer: 1500,
        showConfirmButton: false,
      });
    } else {
      const newQuote = { ...payload, id: `#${1000 + quotes.length + 1}` };
      setQuotes((prev) => [newQuote, ...prev]);

      // --- NOTIFICATION TRIGGER ---
      createNotification({
        title: 'New Quote Generated',
        message: `Quote ${newQuote.id} for ${vehicleTitle} has been created.`,
        type: 'info',
        targetRole: 'super_admin',
      });

      Swal.fire({
        icon: 'success',
        title: 'Created!',
        text: `Quote generated successfully.`,
        timer: 1500,
        showConfirmButton: false,
      });
    }
    setIsAddModalOpen(false);
    setEditingQuote(null);
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        setQuotes((prev) => prev.filter((q) => q.id !== id));
        Swal.fire('Deleted!', 'Quote has been removed.', 'success');
      }
    });
  };

  const handleStatusChange = (id, newStatus) => {
    Swal.fire({
      icon: 'success',
      title: 'Updated!',
      text: `Quote ${id} status changed to ${newStatus}.`,
      timer: 1500,
      showConfirmButton: false,
    });
    setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, status: newStatus } : q)));
  };

  const statusStyles = {
    pending:
      'bg-[rgb(var(--color-warning))/0.1] text-[rgb(var(--color-warning))] border-[rgb(var(--color-warning))/0.2]',
    approved:
      'bg-[rgb(var(--color-success))/0.1] text-[rgb(var(--color-success))] border-[rgb(var(--color-success))/0.2]',
    suspended:
      'bg-[rgb(var(--color-error))/0.1] text-[rgb(var(--color-error))] border-[rgb(var(--color-error))/0.2]',
  };

  const handleExport = async (type) => {
    const dataToExport = quotes.map((q) => ({
      ID: q.id,
      Vehicle: q.vehicle,
      Customer: q.customerName,
      Email: q.customerEmail,
      Phone: q.customerPhone,
      Dealership: q.dealer,
      Seller: q.assignedSeller,
      Amount: q.amount,
      Status: q.status,
      Date: q.date,
    }));

    if (type === 'csv') {
      // CSV Logic
      const headers = Object.keys(dataToExport[0]).join(',');
      const rows = dataToExport.map((obj) =>
        Object.values(obj)
          .map((v) => `"${v}"`)
          .join(',')
      );
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'motorquote_export.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (type === 'excel') {
      // Excel Logic
      try {
        const XLSX = await import('xlsx'); // Dynamic import to avoid SSR issues if any
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Quotes');
        XLSX.writeFile(workbook, 'motorquote_export.xlsx');
      } catch (err) {
        console.error('Excel export failed:', err);
        Swal.fire('Error', "Could not export to Excel. Is 'xlsx' installed?", 'error');
      }
    } else if (type === 'pdf') {
      try {
        const { jsPDF } = await import('jspdf');
        let autoTable;
        try {
          const mod = await import('jspdf-autotable');
          autoTable = mod.default || mod;
        } catch (e) {
          console.error('Autotable import error', e);
        }

        const doc = new jsPDF();

        // --- BRANDING ---
        // Primary Blue for Title
        doc.setFontSize(22);
        doc.setTextColor(37, 99, 235); // RGB for Blue-600 #2563eb
        doc.text('MotorQuote', 14, 20);

        // Subtitle
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100); // Gray
        doc.text('Vehicle Quotation Report', 14, 26);

        // Meta Info
        doc.setFontSize(9);
        doc.setTextColor(75, 85, 99); // Gray-600
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);

        const tableColumn = ['ID', 'Vehicle', 'Customer', 'Dealer', 'Amount', 'Status'];
        const tableRows = [];

        dataToExport.forEach((quote) => {
          const quoteData = [
            quote.ID,
            quote.Vehicle,
            quote.Customer,
            quote.Dealership,
            quote.Amount?.replace('₹', 'Rs. '), // Replace symbol for PDF compatibility
            quote.Status,
          ];
          tableRows.push(quoteData);
        });

        const options = {
          head: [tableColumn],
          body: tableRows,
          startY: 38,
          theme: 'striped',
          styles: {
            fontSize: 9,
            cellPadding: 3,
            lineColor: [229, 231, 235], // gray-200
            lineWidth: 0.1,
          },
          headStyles: {
            fillColor: [30, 64, 175], // Blue-800
            textColor: [255, 255, 255],
            fontStyle: 'bold',
          },
          alternateRowStyles: {
            fillColor: [239, 246, 255], // Blue-50
          },
        };

        if (typeof autoTable === 'function') {
          autoTable(doc, options);
        } else if (doc.autoTable) {
          doc.autoTable(options);
        } else {
          throw new Error('AutoTable plugin not loaded. Please reinstall dependencies.');
        }

        doc.save('motorquote_report.pdf');
      } catch (err) {
        console.error('PDF export failed:', err);
        Swal.fire('Error', `Could not export to PDF: ${err.message}`, 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--color-text))]">Quotes</h1>
          <p className="text-[rgb(var(--color-text))] text-sm">
            View and manage vehicle quotations
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setEditingQuote(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 bg-[rgb(var(--color-primary))] text-white px-4 py-2 rounded-lg hover:bg-[rgb(var(--color-primary-dark))] transition-colors shadow-lg shadow-[rgb(var(--color-primary)/0.3)]"
          >
            <Plus size={18} />
            <span>New Quote</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-2 bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text))] px-4 py-2 border border-[rgb(var(--color-border))] rounded-lg hover:bg-[rgb(var(--color-background))] transition-colors">
              <Download size={18} />
              <span>Export</span>
              <ChevronDown size={14} />
            </button>
            <div className="absolute right-0 top-full mt-2 w-40 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-xl shadow-xl overflow-hidden invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all z-20">
              <button
                onClick={() => handleExport('csv')}
                className="w-full text-left px-4 py-2.5 text-sm text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] hover:text-[rgb(var(--color-primary))] flex items-center gap-2"
              >
                <FileText size={16} /> CSV
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="w-full text-left px-4 py-2.5 text-sm text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] hover:text-[rgb(var(--color-success))] flex items-center gap-2"
              >
                <FileText size={16} /> Excel
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="w-full text-left px-4 py-2.5 text-sm text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] hover:text-[rgb(var(--color-error))] flex items-center gap-2"
              >
                <FileText size={16} /> PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        data={displayedQuotes}
        highlightId={highlightId}
        searchKeys={['id', 'vehicle', 'dealer', 'customerName']}
        filterOptions={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'Pending', label: 'Pending' },
              { value: 'Approved', label: 'Approved' },
              { value: 'Suspended', label: 'Suspended' },
            ],
          },
        ]}
        columns={[
          {
            header: 'Quote ID',
            accessor: 'id',
            sortable: true,
            className: 'font-semibold text-[rgb(var(--color-text))]',
          },
          {
            header: 'Vehicle Detail',
            accessor: 'vehicle',
            sortable: true,
            className: 'font-medium text-[rgb(var(--color-text))]',
          },
          {
            header: 'Customer',
            accessor: 'customerName',
            sortable: true,
            className: 'text-[rgb(var(--color-text))]',
          },
          {
            header: 'Dealership',
            accessor: 'dealer',
            sortable: true,
            className: 'text-[rgb(var(--color-text))]',
          },
          {
            header: 'Amount',
            accessor: 'amount',
            sortable: true,
            className: 'font-bold text-[rgb(var(--color-text))]',
          },
          {
            header: 'Status',
            accessor: (item) => (
              <select
                value={item.status}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => handleStatusChange(item.id, e.target.value)}
                className={`appearance-none cursor-pointer outline-none px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[item.status?.toLowerCase()] || 'bg-gray-100 text-gray-500'}`}
              >
                <option
                  value="Pending"
                  className="bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text))]"
                >
                  Pending
                </option>
                <option
                  value="Approved"
                  className="bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text))]"
                >
                  Approved
                </option>
                <option
                  value="Suspended"
                  className="bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text))]"
                >
                  Suspended
                </option>
              </select>
            ),
            sortable: true,
            className: 'text-center',
          },
          {
            header: 'Actions',
            accessor: (item) => (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewingQuote(item);
                  }}
                  className="p-1.5 text-[rgb(var(--color-text))] hover:text-[rgb(var(--color-info))] hover:bg-[rgb(var(--color-info)/0.1)] rounded-lg transition-colors"
                  title="View"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingQuote(item);
                    setIsAddModalOpen(true);
                  }}
                  className="p-1.5 text-[rgb(var(--color-text))] hover:text-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary)/0.1)] rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.id);
                  }}
                  className="p-1.5 text-[rgb(var(--color-text))] hover:text-[rgb(var(--color-error))] hover:bg-[rgb(var(--color-error)/0.1)] rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ),
            className: 'text-center',
          },
        ]}
      />

      {/* --- ADD/EDIT MODAL --- */}
      <GenericFormModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingQuote(null);
        }}
        onSave={handleSave}
        title={editingQuote ? 'Edit Quote' : 'Create New Quote'}
        subtitle="Please fill in all the details below to generate a new quote."
        initialData={editingQuote}
        validationSchema={quoteSchema}
        maxWidth="max-w-2xl"
        fields={[
          // Group: Customer
          {
            type: 'group',
            title: 'Customer Information',
            className:
              'grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-[rgb(var(--color-border))]',
            fields: [
              {
                name: 'customerName',
                label: 'Full Name',
                placeholder: 'John Smith',
                icon: User,
                className: 'col-span-1 space-y-1.5',
              },
              {
                name: 'customerEmail',
                label: 'Email',
                placeholder: 'john@email.com',
                icon: Mail,
                className: 'col-span-1 space-y-1.5',
              },
              {
                name: 'customerPhone',
                label: 'Phone Number',
                placeholder: '+1 (555) 123-4567',
                format: 'phone',
                maxLength: 10,
                icon: Phone,
                className: 'col-span-1 sm:col-span-2 space-y-1.5',
              },
            ],
          },
          // Group: Vehicle
          {
            type: 'group',
            title: 'Vehicle Information',
            className:
              'grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-[rgb(var(--color-border))]',
            fields: [
              {
                name: 'year',
                label: 'Year',
                placeholder: 'Select year',
                type: 'number',
                icon: Calendar,
                className: 'col-span-1 space-y-1.5',
              },
              {
                name: 'make',
                label: 'Make',
                placeholder: 'Select make',
                icon: Car,
                className: 'col-span-1 space-y-1.5',
                type: 'select',
                options: [
                  { value: 1, label: 'BMW' },
                  { value: 2, label: 'Audi' },
                  { value: 3, label: 'Mercedes' },
                ],
              },
              {
                name: 'model',
                label: 'Model',
                placeholder: 'X5, GLE, Q7...',
                icon: Car,
                className: 'col-span-1 space-y-1.5',
              },
              {
                name: 'vin',
                label: 'VIN Number',
                placeholder: '1HGBH41JXMN109186',
                maxLength: 17,
                icon: FileText,
                className: 'col-span-1 sm:col-span-3 space-y-1.5',
              },
            ],
          },
          // Group: Pricing
          {
            type: 'group',
            title: 'Pricing Details',
            className:
              'grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-[rgb(var(--color-border))]',
            fields: [
              {
                name: 'basePrice',
                label: 'Base Price',
                type: 'number',
                placeholder: '68500',
                icon: DollarSign,
                className: 'col-span-1 space-y-1.5',
              },
              {
                name: 'discount',
                label: 'Discount (%)',
                type: 'number',
                placeholder: '5',
                icon: DollarSign,
                className: 'col-span-1 space-y-1.5',
              },
              {
                name: 'tradeInValue',
                label: 'Trade-In Value',
                type: 'number',
                placeholder: '15000',
                icon: DollarSign,
                className: 'col-span-1 space-y-1.5',
              },
              {
                name: 'financingOption',
                label: 'Financing Option',
                type: 'select',
                icon: Briefcase,
                options: [
                  { value: 'Cash', label: 'Cash' },
                  { value: 'Finance', label: 'Finance' },
                  { value: 'Lease', label: 'Lease' },
                ],
                icon: Briefcase,
                className: 'col-span-1 space-y-1.5',
              },
            ],
          },
          // Group: Assignment
          {
            type: 'group',
            title: 'Assignment',
            className: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
            fields: [
              {
                name: 'dealer',
                label: 'Dealership',
                placeholder: 'Select dealership',
                type: 'select',
                options: dealershipOptions,
                icon: Briefcase,
                className: 'col-span-1 space-y-1.5',
              },
              {
                name: 'assignedSeller',
                label: 'Assigned Seller',
                placeholder: 'Select seller',
                type: 'select',
                options: sellerOptions,
                icon: User,
                className: 'col-span-1 space-y-1.5',
              },
              {
                name: 'notes',
                label: 'Additional Notes',
                type: 'textarea',
                placeholder: 'Any special requests or notes...',
                icon: null,
                className: 'col-span-2 space-y-1.5',
              },
            ],
          },
        ]}
      />

      <DetailViewModal
        isOpen={!!viewingQuote}
        onClose={() => setViewingQuote(null)}
        data={viewingQuote}
        title={`Quote Details ${viewingQuote?.id}`}
        onEdit={(q) => {
          setViewingQuote(null);
          setEditingQuote(q);
          setIsAddModalOpen(true);
        }}
        onDelete={handleDelete}
        sections={[
          {
            title: 'Customer Information',
            icon: User,
            fields: [
              { label: 'Name', key: 'customerName' },
              { label: 'Email', key: 'customerEmail' },
              { label: 'Phone', key: 'customerPhone' },
            ],
          },
          {
            title: 'Vehicle Details',
            icon: Car,
            fields: [
              { label: 'Vehicle', key: 'vehicle' },
              { label: 'VIN', key: 'vin' },
              { label: 'Year', key: 'year' },
            ],
          },
          {
            title: 'Pricing & Finance',
            icon: DollarSign,
            fields: [
              { label: 'Base Price', key: 'basePrice', format: 'currency' },
              { label: 'Discount', key: 'discount', format: 'currency' },
              { label: 'Final Amount', key: 'amount' }, // Already formatted
              { label: 'Financing', key: 'financingOption' },
            ],
          },
          {
            title: 'Assignment',
            icon: Briefcase,
            fields: [
              { label: 'Dealership', key: 'dealer' },
              { label: 'Seller', key: 'assignedSeller' },
              { label: 'Status', key: 'status' },
            ],
          },
        ]}
      />
    </div>
  );
}
