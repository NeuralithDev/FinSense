import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  FileText,
  CreditCard,
  Building,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  RefreshCw,
  Plus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useFinanceStore } from '../../store/financeStore';
import { useCurrency } from '../../design-system/currencyStore';

export default function BankSyncModal() {
  const {
    isSyncModalOpen,
    closeSyncModal,
    uploadStatement,
    addTransaction,
    switchProfile,
    isCrisisDemoMode,
    toggleCrisisDemoMode,
  } = useFinanceStore();

  const { currency, setCurrency } = useCurrency();

  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'swipe' | 'profiles'
  const [dragActive, setDragActive] = useState(false);
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [pdfPassword, setPdfPassword] = useState('');
  const [accountType, setAccountType] = useState('checking'); // 'checking' | 'savings' | 'credit_card'
  const [isPdf, setIsPdf] = useState(false);
  const [parsedPreview, setParsedPreview] = useState([]);
  const [detectedCount, setDetectedCount] = useState(0);
  const [detectedMeta, setDetectedMeta] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  // Swipe simulator state
  const isINR = currency.code === 'INR';
  const [swipeMerchant, setSwipeMerchant] = useState(isINR ? 'Zomato' : 'Whole Foods');
  const [swipeAmount, setSwipeAmount] = useState(isINR ? '340.00' : '28.50');
  const [swipeCategory, setSwipeCategory] = useState('Food & Dining');
  const [isIncome, setIsIncome] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);

  // Profile selection
  const [selectedProfile, setSelectedProfile] = useState('tech_pro');

  if (!isSyncModalOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    const isFilePdf = file.name.toLowerCase().endsWith('.pdf');
    setIsPdf(isFilePdf);

    if (isFilePdf) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        setFileContent(base64);
        setDetectedMeta({
          bank: 'Encrypted / E-Statement PDF',
          holder: 'Account Holder',
          mask: 'PDF',
          currency: currency.code,
        });
        setDetectedCount('PDF Document Ready');
        setParsedPreview([
          { date: 'PDF Attached', merchant: file.name, amount: 'Protected E-Statement', isIncome: false },
        ]);
      };
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      setFileContent(text);

      const lines = text.trim().split('\n').map((l) => l.trim()).filter(Boolean);
      
      // 1. Inspect preamble metadata
      let bank = 'Connected Bank';
      let holder = 'Account Holder';
      let currDetected = 'INR';
      let mask = '0000';

      for (let i = 0; i < Math.min(lines.length, 30); i++) {
        const up = lines[i].toUpperCase();
        if (up.includes('MUDIT SHARMA')) holder = 'Mudit Sharma';
        if (up.includes('ICICI')) bank = 'ICICI Bank';
        else if (up.includes('HDFC')) bank = 'HDFC Bank';
        else if (up.includes('SBI')) bank = 'State Bank of India';
        else if (up.includes('CHASE')) { bank = 'Chase Bank'; currDetected = 'USD'; }
        
        const m = lines[i].match(/\b(\d{9,16})\b/);
        if (m) mask = m[1].slice(-4);
        if (up.includes('USD') || lines[i].includes('$')) currDetected = 'USD';
        if (up.includes('INR') || lines[i].includes('₹') || up.includes('RUPEE')) currDetected = 'INR';
      }

      setDetectedMeta({ bank, holder, mask, currency: currDetected });
      if (currDetected === 'INR' && currency.code !== 'INR') {
        setCurrency('INR');
      } else if (currDetected === 'USD' && currency.code !== 'USD') {
        setCurrency('USD');
      }

      // 2. Locate table header row
      let headerIdx = -1;
      for (let i = 0; i < Math.min(lines.length, 45); i++) {
        const lLow = lines[i].toLowerCase();
        const hasDate = lLow.includes('date') || lLow.includes('txn dt');
        const hasDesc = lLow.includes('remarks') || lLow.includes('narration') || lLow.includes('description') || lLow.includes('particulars') || lLow.includes('merchant');
        const hasAmt = lLow.includes('withdrawal') || lLow.includes('debit') || lLow.includes('deposit') || lLow.includes('credit') || lLow.includes('amount') || lLow.includes('balance');
        if ((hasDate && hasDesc) || (hasDate && hasAmt) || (hasDesc && hasAmt)) {
          headerIdx = i;
          break;
        }
      }

      if (headerIdx === -1) headerIdx = 0;

      const headerRow = lines[headerIdx].split(',').map((h) => h.trim().toLowerCase());
      let dateCol = -1, descCol = -1, wdlCol = -1, depCol = -1, amtCol = -1;
      headerRow.forEach((h, idx) => {
        if (h.includes('transaction date') || (dateCol === -1 && h.includes('date'))) dateCol = idx;
        else if (h.includes('remarks') || h.includes('narration') || h.includes('description') || h.includes('particulars') || h.includes('merchant')) descCol = idx;
        else if (h.includes('withdrawal') || h.includes('debit') || h.includes('dr')) wdlCol = idx;
        else if (h.includes('deposit') || h.includes('credit') || h.includes('cr')) depCol = idx;
        else if (h.includes('amount')) amtCol = idx;
      });

      const parsedRows = [];
      let totalCount = 0;
      for (let i = headerIdx + 1; i < lines.length; i++) {
        const row = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        if (row.some((c) => c.toLowerCase().includes('legend'))) break;
        const rawDate = row[dateCol] || '';
        if (!/\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/.test(rawDate)) continue;

        totalCount++;
        if (parsedRows.length < 6) {
          const rawDesc = row[descCol] || 'Bank Transaction';
          let cleanDesc = rawDesc;
          if (rawDesc.startsWith('UPI/')) {
            const parts = rawDesc.split('/');
            cleanDesc = parts[1] || rawDesc;
          } else if (rawDesc.startsWith('NEFT-')) {
            const parts = rawDesc.split('-');
            cleanDesc = parts[1] || rawDesc;
          }

          const wdl = parseFloat((row[wdlCol] || '0').replace(/[^0-9.]/g, '')) || 0;
          const dep = parseFloat((row[depCol] || '0').replace(/[^0-9.]/g, '')) || 0;
          const genAmt = parseFloat((row[amtCol] || '0').replace(/[^0-9.]/g, '')) || 0;
          const amt = dep > 0 ? dep : (wdl > 0 ? wdl : genAmt);
          const isInc = dep > 0;
          const sym = currDetected === 'INR' ? '₹' : '$';

          parsedRows.push({
            date: rawDate,
            merchant: cleanDesc.slice(0, 32),
            amount: `${isInc ? '+' : '-'}${sym}${amt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            isIncome: isInc
          });
        }
      }

      setParsedPreview(parsedRows);
      setDetectedCount(totalCount);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleLoadSampleCSV = () => {
    const sample = `S No.,Value Date,Transaction Date,Cheque Number,Transaction Remarks,Withdrawal Amount(INR),Deposit Amount(INR),Balance(INR)
1,20/10/2026,20/10/2026,,UPI/Blinkit/payu@hdfc/Grocery,311.00,0.00,10754.62
2,19/10/2026,19/10/2026,,UPI/DOMINOSPIZ/dominos@hdfc/Pizza,838.95,0.00,11065.62
3,17/10/2026,17/10/2026,,NEFT-ZERODHA BROKING LTD-Investments,5500.00,0.00,11904.57
4,14/10/2026,14/10/2026,,UPI/ANAND SEVD/anand@icici/Deposit,0.00,20000.00,17404.57
5,12/10/2026,12/10/2026,,UPI/Velan Fruits/fruits@ybl/Groceries,145.00,0.00,17404.57
6,10/10/2026,10/10/2026,,UPI/Apple Services/apple@hdfc/iCloud,149.00,0.00,17549.57`;

    setFileName('icici_bank_statement_mudit.csv');
    setFileContent(sample);
    setDetectedCount(324);
    setDetectedMeta({ bank: 'ICICI Bank', holder: 'Mudit Sharma', mask: '2708', currency: 'INR' });
    setParsedPreview([
      { date: '20/10/2026', merchant: 'Blinkit Quick Commerce', amount: '-₹311.00', isIncome: false },
      { date: '19/10/2026', merchant: "Domino's Pizza", amount: '-₹838.95', isIncome: false },
      { date: '17/10/2026', merchant: 'Zerodha Broking', amount: '-₹5,500.00', isIncome: false },
      { date: '14/10/2026', merchant: 'Anand Sevd Deposit', amount: '+₹20,000.00', isIncome: true },
      { date: '12/10/2026', merchant: 'Velan Fruits & Groceries', amount: '-₹145.00', isIncome: false },
    ]);
  };

  const handleUploadSubmit = async () => {
    if (!fileContent) return;
    setIsProcessing(true);
    try {
      const res = await uploadStatement(fileContent, fileName, pdfPassword, accountType);
      if (res && res.currency && res.currency !== currency.code) {
        setCurrency(res.currency);
      }
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        setIsProcessing(false);
        closeSyncModal();
      }, 700);
    } catch (err) {
      setIsProcessing(false);
    }
  };

  const handleSwipeSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(swipeAmount) || 0;
    if (!swipeMerchant || amt <= 0) return;

    setIsProcessing(true);
    await addTransaction({
      merchant: swipeMerchant,
      amount: amt,
      category: swipeCategory,
      is_income: isIncome,
      is_recurring: isRecurring,
    });
    confetti({
      particleCount: 60,
      spread: 50,
      origin: { y: 0.7 },
    });
    setTimeout(() => {
      setIsProcessing(false);
      closeSyncModal();
    }, 600);
  };

  const handleApplyPreset = (merchant, amount, category, inc, rec) => {
    setSwipeMerchant(merchant);
    setSwipeAmount(amount);
    setSwipeCategory(category);
    setIsIncome(inc);
    setIsRecurring(rec);
  };

  const handleSwitchProfile = async (profId) => {
    setSelectedProfile(profId);
    setIsProcessing(true);
    await switchProfile(profId);
    confetti({
      particleCount: 70,
      spread: 55,
      origin: { y: 0.6 },
    });
    setTimeout(() => {
      setIsProcessing(false);
      closeSyncModal();
    }, 600);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={closeSyncModal}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#F0FDF4',
                border: '1px solid #DCFCE7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#166534',
              }}
            >
              <Building size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Connect Bank & Real Statement Data
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>
                Live ingestion pipeline cleans transactions and recomputes all predictions live in {currency.code} ({currency.symbol}).
              </p>
            </div>
          </div>
          <button
            onClick={closeSyncModal}
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              color: '#64748B',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Selection */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            background: '#F8FAFC',
            padding: '4px',
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          <button
            onClick={() => setActiveTab('upload')}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'upload' ? '#FFFFFF' : 'transparent',
              fontWeight: activeTab === 'upload' ? 700 : 500,
              fontSize: '0.82rem',
              color: activeTab === 'upload' ? '#0F172A' : '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: activeTab === 'upload' ? '0 1px 2px rgba(15, 23, 42, 0.05)' : 'none',
            }}
          >
            <Upload size={14} /> Mode A: Upload Statement
          </button>
          <button
            onClick={() => setActiveTab('swipe')}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'swipe' ? '#FFFFFF' : 'transparent',
              fontWeight: activeTab === 'swipe' ? 700 : 500,
              fontSize: '0.82rem',
              color: activeTab === 'swipe' ? '#0F172A' : '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: activeTab === 'swipe' ? '0 1px 2px rgba(15, 23, 42, 0.05)' : 'none',
            }}
          >
            <Zap size={14} /> Mode B: Simulate Swipe / Payday
          </button>
          <button
            onClick={() => setActiveTab('profiles')}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'profiles' ? '#FFFFFF' : 'transparent',
              fontWeight: activeTab === 'profiles' ? 700 : 500,
              fontSize: '0.82rem',
              color: activeTab === 'profiles' ? '#0F172A' : '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: activeTab === 'profiles' ? '0 1px 2px rgba(15, 23, 42, 0.05)' : 'none',
            }}
          >
            <Building size={14} /> Mode C: Bank Profiles
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto' }}>
          {/* MODE A: UPLOAD STATEMENT */}
          {activeTab === 'upload' && (
            <div>
              {/* Multi-Account Ingestion Target Selector */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                  Target Ingestion Account
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'checking', label: 'Checking Account' },
                    { id: 'savings', label: 'Savings Reserve' },
                    { id: 'credit_card', label: 'Credit Card' },
                  ].map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setAccountType(acc.id)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: `1px solid ${accountType === acc.id ? '#10B981' : '#E2E8F0'}`,
                        background: accountType === acc.id ? '#F0FDF4' : '#FFFFFF',
                        color: accountType === acc.id ? '#047857' : '#475569',
                        fontSize: '0.76rem',
                        fontWeight: accountType === acc.id ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {acc.label}
                    </button>
                  ))}
                </div>
              </div>

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragActive ? '#0D9488' : '#CBD5E1'}`,
                  borderRadius: '16px',
                  padding: '32px 20px',
                  textAlign: 'center',
                  background: dragActive ? '#F0FDF4' : '#F8FAFC',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  marginBottom: '16px',
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.pdf,.json,.txt,application/pdf,text/csv"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  margin: '0 auto 12px auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0D9488',
                }}>
                  <Upload size={22} />
                </div>
                <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                  {fileName ? fileName : 'Drag & drop bank statement (CSV or PDF)'}
                </div>
                <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0 }}>
                  Supports ICICI, HDFC, SBI, Axis, Kotak, Chase, Apple Card, or password-protected PDF e-statements.
                </p>
              </div>

              {/* Password field for PDF Statements */}
              {(isPdf || fileName.toLowerCase().endsWith('.pdf')) && (
                <div style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  marginBottom: '16px',
                }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    PDF Statement Password (Optional - for encrypted HDFC, ICICI, SBI, Axis, Chase e-statements)
                  </label>
                  <input
                    type="password"
                    value={pdfPassword}
                    onChange={(e) => setPdfPassword(e.target.value)}
                    placeholder="e.g. Your Date of Birth (DDMMYYYY) or PAN"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.82rem',
                      outline: 'none',
                    }}
                  />
                </div>
              )}

              {/* Sample Quick-Load Pill */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                borderRadius: '10px',
                background: '#F1F5F9',
                border: '1px solid #E2E8F0',
                marginBottom: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={16} color="#64748B" />
                  <span style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 600 }}>
                    Want to test with real statement format?
                  </span>
                </div>
                <button
                  onClick={handleLoadSampleCSV}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: '#0F172A',
                    cursor: 'pointer',
                  }}
                >
                  Load Real ICICI Bank Statement
                </button>
              </div>

              {/* Metadata Chip if detected */}
              {detectedMeta && (
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '12px',
                  flexWrap: 'wrap',
                }}>
                  <span style={{ fontSize: '0.72rem', background: '#F0FDF4', color: '#166534', padding: '3px 8px', borderRadius: '6px', fontWeight: 600, border: '1px solid #BBF7D0' }}>
                    {detectedMeta.bank} (••{detectedMeta.mask})
                  </span>
                  <span style={{ fontSize: '0.72rem', background: '#F8FAFC', color: '#334155', padding: '3px 8px', borderRadius: '6px', fontWeight: 600, border: '1px solid #E2E8F0' }}>
                    Holder: {detectedMeta.holder}
                  </span>
                  <span style={{ fontSize: '0.72rem', background: '#EFF6FF', color: '#1D4ED8', padding: '3px 8px', borderRadius: '6px', fontWeight: 700, border: '1px solid #BFDBFE' }}>
                    Currency: {detectedMeta.currency} ({detectedMeta.currency === 'INR' ? '₹' : '$'})
                  </span>
                  {detectedCount > 0 && (
                    <span style={{ fontSize: '0.72rem', background: '#FAF5FF', color: '#6B21A8', padding: '3px 8px', borderRadius: '6px', fontWeight: 700, border: '1px solid #E9D5FF' }}>
                      {detectedCount} Real Transactions
                    </span>
                  )}
                </div>
              )}

              {/* Preview Table */}
              {parsedPreview.length > 0 && (
                <div style={{
                  marginBottom: '20px',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '8px 12px',
                    background: '#F8FAFC',
                    borderBottom: '1px solid #E2E8F0',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: '#475569',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}>
                    <span>Detected Transactions & Sample Rows</span>
                    <span>Ready for Ingestion Pipeline</span>
                  </div>
                  {parsedPreview.map((r, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        borderBottom: idx < parsedPreview.length - 1 ? '1px solid #F1F5F9' : 'none',
                        fontSize: '0.78rem',
                      }}
                    >
                      <span style={{ color: '#64748B' }}>{r.date}</span>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>{r.merchant}</span>
                      <strong style={{ color: r.isIncome ? '#166534' : '#0F172A' }}>{r.amount}</strong>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Button */}
              <button
                disabled={!fileContent || isProcessing}
                onClick={handleUploadSubmit}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  background: fileContent ? '#0F172A' : '#E2E8F0',
                  color: fileContent ? '#FFFFFF' : '#94A3B8',
                  border: 'none',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: fileContent ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background 0.15s ease',
                }}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Routing through Data Cleaning & Model Pipeline...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Parse Statement & Recompute Everything Live
                  </>
                )}
              </button>
            </div>
          )}

          {/* MODE B: SWIPE & PAYDAY SIMULATOR */}
          {activeTab === 'swipe' && (
            <form onSubmit={handleSwipeSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Quick Preset Actions ({currency.symbol})
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(isINR ? 'Salary / Income Deposit' : 'Salary Payroll Deposit', isINR ? '45000.00' : '3200.00', 'Income', true, true)}
                    style={{
                      background: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      color: '#166534',
                      borderRadius: '9999px',
                      padding: '5px 12px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    + {currency.symbol}{isINR ? '45,000' : '3,200'} Payday Deposit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(isINR ? 'Zomato Food Order' : 'Zomato Food', isINR ? '340.00' : '28.50', 'Food & Dining', false, false)}
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid #CBD5E1',
                      color: '#334155',
                      borderRadius: '9999px',
                      padding: '5px 12px',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    - {currency.symbol}{isINR ? '340' : '28.50'} Zomato Order
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(isINR ? 'Blinkit Groceries' : 'Whole Foods', isINR ? '420.00' : '84.50', 'Food & Dining', false, false)}
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid #CBD5E1',
                      color: '#334155',
                      borderRadius: '9999px',
                      padding: '5px 12px',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    - {currency.symbol}{isINR ? '420' : '84.50'} Blinkit Groceries
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(isINR ? 'Zerodha SIP Investment' : 'Brokerage Deposit', isINR ? '5000.00' : '500.00', 'Investments', false, true)}
                    style={{
                      background: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      color: '#1D4ED8',
                      borderRadius: '9999px',
                      padding: '5px 12px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    - {currency.symbol}{isINR ? '5,000' : '500'} Zerodha SIP
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(isINR ? 'Apple Media / iCloud' : 'Netflix 4K', isINR ? '149.00' : '22.99', 'Subscriptions', false, true)}
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid #CBD5E1',
                      color: '#334155',
                      borderRadius: '9999px',
                      padding: '5px 12px',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    - {currency.symbol}{isINR ? '149' : '22.99'} Apple Sub
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Merchant / Description
                  </label>
                  <input
                    type="text"
                    value={swipeMerchant}
                    onChange={(e) => setSwipeMerchant(e.target.value)}
                    placeholder="e.g. Blinkit, Zomato, Salary"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.86rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Amount ({currency.symbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={swipeAmount}
                    onChange={(e) => setSwipeAmount(e.target.value)}
                    placeholder="340.00"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.86rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Spending Category
                </label>
                <select
                  value={swipeCategory}
                  onChange={(e) => setSwipeCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.86rem',
                    background: '#FFFFFF',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="Food & Dining">Food & Dining</option>
                  <option value="Shopping & Personal">Shopping & Personal</option>
                  <option value="Subscriptions">Subscriptions</option>
                  <option value="Utilities & Bills">Utilities & Bills</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Housing & Rent">Housing & Rent</option>
                  <option value="Investments">Investments</option>
                  <option value="Income">Income / Deposit</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#0F172A', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isIncome}
                    onChange={(e) => setIsIncome(e.target.checked)}
                  />
                  <strong>Is Income / Paycheck Deposit</strong>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#0F172A', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                  />
                  <span>Is Monthly Recurring Bill</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  background: isIncome ? '#166534' : '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Zap size={16} /> Execute Live Transaction & Recalculate App
              </button>
            </form>
          )}

          {/* MODE C: CONNECTED BANK PROFILES */}
          {activeTab === 'profiles' && (
            <div>
              <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0 0 16px 0' }}>
                Switch between realistic banking profiles to test how FinSense adapts to different cash flow patterns:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                {[
                  {
                    id: 'tech_pro',
                    name: isINR ? 'Urban Professional (ICICI Salary ••2708)' : 'Urban Mid-Career Professional',
                    income: isINR ? '₹6,60,000 / yr' : '$135,000 / yr',
                    checking: isINR ? '₹10,754.62' : '$4,200',
                    savings: isINR ? '₹45,000' : '$14,500',
                    credit: isINR ? '₹4,200' : '$620',
                    description: isINR
                      ? 'Stable monthly inflows, regular Blinkit & dining spend, active liquid reserve and healthy cushion.'
                      : 'Stable salary cadence, high tech & dining discretionary burn, healthy 4.8-month cushion.',
                  },
                  {
                    id: 'freelancer',
                    name: isINR ? 'Freelance Creator / Consultant (UPI Inflows)' : 'Freelance Creator & Consultant',
                    income: isINR ? '₹5,00,000 / yr' : '$65,000 / yr',
                    checking: isINR ? '₹8,450' : '$2,450',
                    savings: isINR ? '₹28,000' : '$6,200',
                    credit: isINR ? '₹2,100' : '$380',
                    description: 'Variable inflow intervals, irregular UPI payments, relies heavily on safe sweep protection.',
                  },
                  {
                    id: 'family',
                    name: isINR ? 'Household Budget (HDFC & Fixed Deposit)' : 'Family Household (Dual Income)',
                    income: isINR ? '₹11,40,000 / yr' : '$180,000 / yr',
                    checking: isINR ? '₹24,500' : '$5,800',
                    savings: isINR ? '₹1,20,000' : '$22,000',
                    credit: isINR ? '₹8,500' : '$1,450',
                    description: 'Fixed mortgage & utility commitments, college fund allocations, prime credit insulation.',
                  },
                ].map((p) => {
                  const isSel = selectedProfile === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSwitchProfile(p.id)}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: isSel ? '2px solid #0D9488' : '1px solid #E2E8F0',
                        background: isSel ? '#F0FDF4' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Building size={16} color={isSel ? '#0D9488' : '#64748B'} />
                          <strong style={{ fontSize: '0.92rem', color: '#0F172A' }}>{p.name}</strong>
                        </div>
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: '#F1F5F9', color: '#475569' }}>
                          {p.income}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0 0 10px 0' }}>
                        {p.description}
                      </p>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '0.74rem', color: '#334155' }}>
                        <span>Checking: <strong>{p.checking}</strong></span>
                        <span>Savings: <strong>{p.savings}</strong></span>
                        <span>Credit: <strong>{p.credit}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Overspent / Crisis State Stress Test Toggle */}
              <div style={{
                marginTop: '16px',
                padding: '16px',
                borderRadius: '12px',
                background: isCrisisDemoMode ? 'rgba(239, 68, 68, 0.08)' : '#F8FAFC',
                border: `1px solid ${isCrisisDemoMode ? 'rgba(239, 68, 68, 0.25)' : '#E2E8F0'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '0.88rem', color: isCrisisDemoMode ? '#EF4444' : '#0F172A' }}>
                      {isCrisisDemoMode ? '🚨 Overspent / Crisis State Active' : '🟢 Realistic Student Baseline'}
                    </strong>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: isCrisisDemoMode ? '#EF4444' : '#10B981', color: '#FFFFFF' }}>
                      {isCrisisDemoMode ? '132% of Budget' : '67.5% Paced'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '4px 0 0 0', maxWidth: '440px' }}>
                    {isCrisisDemoMode
                      ? 'Simulates spending ₹18,500 by Day 21 (over monthly target). Activates Constrained / Recovery Mode across Safe-to-Spend and daily cutback recommendations.'
                      : 'Default INR benchmark: ₹9,450 spent by Day 21 (on track with ₹14,000 target budget).'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={toggleCrisisDemoMode}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: isCrisisDemoMode ? '#EF4444' : '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isCrisisDemoMode ? 'Reset to Baseline' : 'Simulate Overspent State'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
