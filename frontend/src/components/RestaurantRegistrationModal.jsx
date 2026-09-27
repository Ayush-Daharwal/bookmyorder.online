import React, { useState, useEffect } from 'react';
import {
  X, CheckCircle2, ShieldCheck, Camera, Sparkles, Upload, AlertCircle,
  Building, MapPin, Phone, Mail, FileText, Lock, RefreshCw, Award, Check
} from 'lucide-react';
import { submitRestaurantApplicationApi } from '../services/api';

export default function RestaurantRegistrationModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccessPopup, setIsSuccessPopup] = useState(false);
  const [restoredDraftNotice, setRestoredDraftNotice] = useState(false);

  // OTP Verification States
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneOtpInput, setPhoneOtpInput] = useState('');
  
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailOtpInput, setEmailOtpInput] = useState('');

  const [aadharOtpSent, setAadharOtpSent] = useState(false);
  const [aadharVerified, setAadharVerified] = useState(false);
  const [aadharOtpInput, setAadharOtpInput] = useState('');

  // CAPTCHA State
  const [captchaNum1, setCaptchaNum1] = useState(7);
  const [captchaNum2, setCaptchaNum2] = useState(5);
  const [captchaInput, setCaptchaInput] = useState('');

  // Form Data State
  const [formData, setFormData] = useState({
    restaurantName: '',
    managerName: '',
    managerPhone: '',
    email: '',
    password: '',
    city: 'Bhopal', // Restricted to Bhopal
    address: '',
    foodType: 'Veg & Non-Veg', // 'Pure Veg', 'Pure Non-Veg', 'Veg & Non-Veg'
    category: 'casual_premium', // 'luxury', 'casual_premium', 'canteen'
    gstin: '',
    fssaiNumber: '',
    fssaiImage: '',
    fdaNumber: '',
    ownerAadhaar: '',
    photos: {
      cardBanner: '',
      front: '',
      tableSeating: '',
      kitchen: '',
      servedFood: '',
      menu: '',
    },
    terms: {
      detailsCorrect: false,
      noObjectionSharing: false,
      followPricingAndPrivacy: false,
      moralQueryHandling: false,
      fulfillOrdersAndBookings: false,
    },
  });

  const [saveToastMsg, setSaveToastMsg] = useState('');

  // Lock background body scroll when modal is open and restore on close
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      generateCaptcha();
      const savedDraft = localStorage.getItem('bmo_restaurant_reg_draft');
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          setFormData((prev) => ({
            ...prev,
            ...parsed,
            city: 'Bhopal',
          }));
          if (parsed.savedStep) setStep(parsed.savedStep);
          setRestoredDraftNotice(true);
        } catch (e) {
          console.error('Failed to parse saved draft:', e);
        }
      }
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isOpen]);

  const saveCurrentDraft = (currentStep = step) => {
    const draftToSave = { ...formData, savedStep: currentStep };
    delete draftToSave.photos;
    localStorage.setItem('bmo_restaurant_reg_draft', JSON.stringify(draftToSave));
  };

  const handleModalClose = () => {
    saveCurrentDraft(step);
    onClose();
  };

  // Auto-Save text fields to LocalStorage
  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      saveCurrentDraft(step);
      return updated;
    });
  };

  const handlePhotoChange = (photoKey, value) => {
    setFormData((prev) => ({
      ...prev,
      photos: {
        ...prev.photos,
        [photoKey]: value,
      },
    }));
  };

  // Direct File Upload & Camera Capture Handler with 50MB Limit
  const handleFileUpload = (photoKey, file) => {
    if (!file) return;
    const maxSizeBytes = 50 * 1024 * 1024; // 50MB limit per photo
    if (file.size > maxSizeBytes) {
      setErrorMessage(`File "${file.name}" exceeds the 50MB maximum size limit!`);
      return;
    }
    setErrorMessage('');
    const reader = new FileReader();
    reader.onload = (e) => {
      handlePhotoChange(photoKey, e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleTermToggle = (termKey) => {
    setFormData((prev) => ({
      ...prev,
      terms: {
        ...prev.terms,
        [termKey]: !prev.terms[termKey],
      },
    }));
  };

  const generateCaptcha = () => {
    const n1 = Math.floor(Math.random() * 9) + 1;
    const n2 = Math.floor(Math.random() * 9) + 1;
    setCaptchaNum1(n1);
    setCaptchaNum2(n2);
    setCaptchaInput('');
  };

  const clearDraft = () => {
    localStorage.removeItem('bmo_restaurant_reg_draft');
    setRestoredDraftNotice(false);
    setFormData({
      restaurantName: '',
      managerName: '',
      managerPhone: '',
      email: '',
      password: '',
      city: 'Bhopal',
      address: '',
      foodType: 'Veg & Non-Veg',
      category: 'casual_premium',
      gstin: '',
      fssaiNumber: '',
      fssaiImage: '',
      fdaNumber: '',
      ownerAadhaar: '',
      photos: {
        cardBanner: '',
        front: '',
        tableSeating: '',
        kitchen: '',
        servedFood: '',
        menu: '',
      },
      terms: {
        detailsCorrect: false,
        noObjectionSharing: false,
        followPricingAndPrivacy: false,
        moralQueryHandling: false,
        fulfillOrdersAndBookings: false,
      },
    });
    setStep(1);
  };

  // OTP Verification Handlers
  const handleVerifyPhoneOtp = () => {
    if (phoneOtpInput.trim() === '123456') {
      setPhoneVerified(true);
      setErrorMessage('');
    } else {
      setErrorMessage('Invalid Phone OTP! Use dummy code 123456 to verify.');
    }
  };

  const handleVerifyEmailOtp = () => {
    if (emailOtpInput.trim() === '889900') {
      setEmailVerified(true);
      setErrorMessage('');
    } else {
      setErrorMessage('Invalid Email OTP! Use dummy code 889900 to verify.');
    }
  };

  const handleVerifyAadharOtp = () => {
    if (aadharOtpInput.trim() === '654321') {
      setAadharVerified(true);
      setErrorMessage('');
    } else {
      setErrorMessage('Invalid Aadhaar OTP! Use dummy code 654321 to verify.');
    }
  };

  // Step Validation & Navigation
  const handleNextStep = () => {
    setErrorMessage('');
    if (step === 1) {
      if (!formData.managerName || !formData.managerPhone || !formData.email || !formData.password) {
        return setErrorMessage('Please fill in Manager Name, Phone, Email, and Password.');
      }
    } else if (step === 2) {
      if (!formData.restaurantName || !formData.address) {
        return setErrorMessage('Please enter Restaurant Name and Exact Address.');
      }
      if (formData.city.trim().toLowerCase() !== 'bhopal') {
        return setErrorMessage('Registration outside Bhopal is currently disabled as platform services are active only in Bhopal.');
      }
    } else if (step === 3) {
      if (!formData.ownerAadhaar) {
        return setErrorMessage("Owner's Aadhaar Number is required for verification.");
      }
    } else if (step === 4) {
      if (!formData.photos.cardBanner || !formData.photos.front || !formData.photos.tableSeating || !formData.photos.kitchen || !formData.photos.servedFood || !formData.photos.menu) {
        return setErrorMessage('Please attach all 6 photos required for registration (Max 50MB per photo).');
      }
    }
    setStep(step + 1);
  };

  // Final Application Submission
  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Validate Terms Checkboxes
    const allTermsAccepted = Object.values(formData.terms).every((val) => val === true);
    if (!allTermsAccepted) {
      return setErrorMessage('You must tick all 5 terms & conditions checkboxes to complete your registration.');
    }

    // Validate CAPTCHA
    if (parseInt(captchaInput) !== captchaNum1 + captchaNum2) {
      generateCaptcha();
      return setErrorMessage(`Incorrect CAPTCHA answer! Please solve ${captchaNum1} + ${captchaNum2}.`);
    }

    setLoading(true);
    try {
      const payload = {
        restaurantName: formData.restaurantName,
        managerName: formData.managerName,
        managerPhone: formData.managerPhone,
        email: formData.email,
        password: formData.password,
        city: 'Bhopal',
        address: formData.address,
        exactLocation: { address: formData.address, lat: 23.2599, lng: 77.4126 },
        foodType: formData.foodType,
        category: formData.category,
        gstin: formData.gstin,
        fssaiNumber: formData.fssaiNumber,
        fssaiImage: formData.fssaiImage,
        fdaNumber: formData.fdaNumber,
        ownerAadhaar: formData.ownerAadhaar,
        photos: formData.photos,
      };

      const res = await submitRestaurantApplicationApi(payload);
      if (res.data.success) {
        localStorage.removeItem('bmo_restaurant_reg_draft');
        localStorage.setItem('bmo_submitted_application', JSON.stringify(res.data.application));
        setIsSuccessPopup(true);
        if (onSuccess) onSuccess(res.data.application);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to submit application. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSave = () => {
    saveCurrentDraft(step);
    setSaveToastMsg('Progress Saved! You can close and resume application anytime.');
    setTimeout(() => setSaveToastMsg(''), 4000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-3 sm:p-6 overflow-hidden">
      
      {/* SUCCESS POPUP MODAL (Celebratory Animated Big Tick Badge) */}
      {isSuccessPopup ? (
        <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-200 text-center p-8 animate-in fade-in zoom-in duration-300">
          
          <div className="absolute top-0 inset-x-0 h-3 bg-gradient-to-r from-emerald-500 via-teal-400 to-forest-800"></div>

          <div className="relative mx-auto w-24 h-24 my-4 flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-700 text-white rounded-full shadow-xl shadow-emerald-500/30 border-4 border-emerald-100 animate-bounce">
            <CheckCircle2 className="w-16 h-16 stroke-[2.5]" />
            <span className="absolute -top-2 -right-2 text-2xl animate-spin">✨</span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
            Application Submitted Successfully! 🎉
          </h2>

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 my-4 space-y-2 text-left text-xs">
            <p className="font-extrabold text-emerald-950 text-sm flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Status: Pending Admin Approval
            </p>
            <p className="text-slate-700 leading-relaxed">
              You have successfully applied to get registered for the platform. It just needs admin approval to start. We will notify you once admin approves your registration.
            </p>
            <div className="pt-2 border-t border-emerald-200 text-slate-600 space-y-1">
              <p>📩 Notification Email: <strong className="text-slate-900">{formData.email}</strong></p>
              <p>📱 Notification SMS: <strong className="text-slate-900">{formData.managerPhone}</strong></p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsSuccessPopup(false);
              onClose();
            }}
            className="w-full py-3.5 rounded-xl bg-forest-900 hover:bg-forest-950 text-white font-extrabold shadow-lg shadow-forest-900/20 transition-all cursor-pointer"
          >
            Back to Partner Portal
          </button>
        </div>
      ) : (

        /* MULTI-STEP REGISTRATION FORM MODAL */
        <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden border border-sand-200 my-auto">
          
          {/* Header */}
          <div className="bg-forest-900 text-white p-5 sm:p-6 flex items-start justify-between relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div>
              <div className="flex items-center gap-2 text-terracotta-400 font-extrabold text-xs uppercase tracking-wider mb-1">
                <Building className="w-4 h-4" /> Partner Registration Wizard
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Register Your Restaurant with Us
              </h2>
              <p className="text-xs text-sand-300 mt-0.5 max-w-lg">
                Complete these steps to list your restaurant on BookMyOrder in Bhopal.
              </p>
            </div>

            <button
              onClick={handleModalClose}
              title="Save progress and close"
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs transition-all cursor-pointer border border-white/20 shadow-sm shrink-0"
            >
              <span className="hidden sm:inline">Save & Close</span>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Save Toast Banner */}
          {saveToastMsg && (
            <div className="bg-emerald-600 text-white px-6 py-2.5 text-xs font-bold flex items-center justify-between animate-in fade-in">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-white" /> {saveToastMsg}
              </span>
            </div>
          )}

          {/* Restored Draft Notice */}
          {restoredDraftNotice && !saveToastMsg && (
            <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2 font-semibold">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                Draft Restored! We loaded your previously saved application details.
              </div>
              <button
                onClick={clearDraft}
                className="text-[11px] font-bold text-terracotta-600 hover:underline cursor-pointer"
              >
                Clear & Start Fresh
              </button>
            </div>
          )}

          {/* Progress Bar & Wizard Step Indicators */}
          <div className="bg-sand-50 border-b border-sand-200 px-6 py-4 shrink-0">
            <div className="flex justify-between items-center text-xs font-extrabold text-slate-700 mb-2">
              <span>Step {step} of 5</span>
              <span className="text-forest-800">
                {step === 1 && '1. Manager & Account Setup'}
                {step === 2 && '2. Restaurant Identity & Location'}
                {step === 3 && '3. Verification & License Details'}
                {step === 4 && '4. 6 Required Photos (Live Captures)'}
                {step === 5 && '5. Terms, Conditions & Captcha'}
              </span>
            </div>
            <div className="w-full bg-sand-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-forest-800 h-full transition-all duration-300"
                style={{ width: `${(step / 5) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mx-6 mt-4 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 shrink-0">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Modal Content Form */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-6 sm:p-8 space-y-6 text-xs">
            
            {/* STEP 1: MANAGER & ACCOUNT SETUP */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl text-emerald-950 font-medium">
                  <p className="font-extrabold text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" /> OTP Verification Required
                  </p>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Manager contact details will be used for customer queries and official notification alerts.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Manager Full Name *</label>
                  <input
                    type="text"
                    value={formData.managerName}
                    onChange={(e) => handleInputChange('managerName', e.target.value)}
                    placeholder="e.g. Rajesh Sharma"
                    className="w-full px-4 py-3 rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-forest-800"
                  />
                </div>

                {/* Manager Phone with OTP */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Contact Number for Customer Queries & Special Wishes *</label>
                  <p className="text-[11px] text-slate-500 mb-1 font-medium">This contact number will be provided to customers for pre-booking queries, special dining wishes, and order support.</p>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={formData.managerPhone}
                      onChange={(e) => handleInputChange('managerPhone', e.target.value)}
                      placeholder="e.g. 9826012345"
                      className="w-full px-4 py-3 rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-forest-800"
                    />
                    <button
                      type="button"
                      onClick={() => setPhoneOtpSent(true)}
                      className="px-4 py-2 bg-sand-200 hover:bg-sand-300 text-slate-800 font-bold rounded-xl whitespace-nowrap cursor-pointer"
                    >
                      {phoneVerified ? 'Verified ✔' : 'Send Phone OTP'}
                    </button>
                  </div>
                  {phoneOtpSent && !phoneVerified && (
                    <div className="mt-2 p-2.5 bg-sky-50 border border-sky-200 rounded-xl space-y-1">
                      <p className="text-[11px] text-sky-900 font-bold">
                        📱 Dummy OTP Code: <span className="bg-sky-200 px-2 py-0.5 rounded font-mono text-xs">123456</span>
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={phoneOtpInput}
                          onChange={(e) => setPhoneOtpInput(e.target.value)}
                          placeholder="Enter OTP (123456)"
                          className="px-3 py-1.5 rounded-lg border border-sky-300 text-xs w-full"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyPhoneOtp}
                          className="px-3 py-1.5 bg-sky-600 text-white font-bold rounded-lg text-xs cursor-pointer"
                        >
                          Verify
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Manager Email with OTP */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Email Address *</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="e.g. manager@bhopalspicebistro.com"
                      className="w-full px-4 py-3 rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-forest-800"
                    />
                    <button
                      type="button"
                      onClick={() => setEmailOtpSent(true)}
                      className="px-4 py-2 bg-sand-200 hover:bg-sand-300 text-slate-800 font-bold rounded-xl whitespace-nowrap cursor-pointer"
                    >
                      {emailVerified ? 'Verified ✔' : 'Send Email OTP'}
                    </button>
                  </div>
                  {emailOtpSent && !emailVerified && (
                    <div className="mt-2 p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1">
                      <p className="text-[11px] text-indigo-900 font-bold">
                        📩 Dummy Email OTP: <span className="bg-indigo-200 px-2 py-0.5 rounded font-mono text-xs">889900</span>
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={emailOtpInput}
                          onChange={(e) => setEmailOtpInput(e.target.value)}
                          placeholder="Enter OTP (889900)"
                          className="px-3 py-1.5 rounded-lg border border-indigo-300 text-xs w-full"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyEmailOtp}
                          className="px-3 py-1.5 bg-indigo-600 text-white font-bold rounded-lg text-xs cursor-pointer"
                        >
                          Verify
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Account Password (For Partner Dashboard Sign-In) *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Set account password"
                    className="w-full px-4 py-3 rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-forest-800"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: RESTAURANT IDENTITY & LOCATION */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Restaurant Name *</label>
                  <input
                    type="text"
                    value={formData.restaurantName}
                    onChange={(e) => handleInputChange('restaurantName', e.target.value)}
                    placeholder="e.g. Sagar Gaire Fast Food & Restaurant"
                    className="w-full px-4 py-3 rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-forest-800 text-sm font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Food Type */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Food Type / Dietary Category *</label>
                    <select
                      value={formData.foodType}
                      onChange={(e) => handleInputChange('foodType', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-sand-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-forest-800"
                    >
                      <option value="Pure Veg">🟢 Pure Veg</option>
                      <option value="Pure Non-Veg">🔴 Pure Non-Veg</option>
                      <option value="Veg & Non-Veg">🟡 Veg & Non-Veg</option>
                    </select>
                  </div>

                  {/* City (Restricted to Bhopal) */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">City *</label>
                    <input
                      type="text"
                      disabled
                      value="Bhopal (Fixed)"
                      className="w-full px-4 py-3 rounded-xl border border-sand-200 bg-sand-100 text-slate-700 font-extrabold cursor-not-allowed"
                    />
                    <p className="text-[10px] text-amber-700 mt-1 font-semibold">
                      ⚠️ Registration outside Bhopal is not allowed currently as platform services are active only in Bhopal.
                    </p>
                  </div>
                </div>

                {/* Restaurant Category / Operational Type */}
                <div>
                  <label className="block font-bold text-slate-800 mb-2">Restaurant Category & Booking Model *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    
                    <div
                      onClick={() => handleInputChange('category', 'luxury')}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                        formData.category === 'luxury'
                          ? 'border-[#FF5722] bg-orange-50/60 shadow-md ring-2 ring-[#FF5722]'
                          : 'border-sand-200 hover:border-sand-300 bg-white'
                      }`}
                    >
                      <p className="font-extrabold text-forest-900 text-xs">✨ Luxury Fine Dining</p>
                      <p className="text-[10px] text-slate-600 mt-1">
                        Table booking is <strong>mandatory</strong> before ordering food.
                      </p>
                    </div>

                    <div
                      onClick={() => handleInputChange('category', 'casual_premium')}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                        formData.category === 'casual_premium'
                          ? 'border-[#FF5722] bg-orange-50/60 shadow-md ring-2 ring-[#FF5722]'
                          : 'border-sand-200 hover:border-sand-300 bg-white'
                      }`}
                    >
                      <p className="font-extrabold text-forest-900 text-xs">🍽️ Casual & Premium</p>
                      <p className="text-[10px] text-slate-600 mt-1">
                        No table booking necessary, but table can be pre-reserved in advance.
                      </p>
                    </div>

                    <div
                      onClick={() => handleInputChange('category', 'canteen')}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                        formData.category === 'canteen'
                          ? 'border-[#FF5722] bg-orange-50/60 shadow-md ring-2 ring-[#FF5722]'
                          : 'border-sand-200 hover:border-sand-300 bg-white'
                      }`}
                    >
                      <p className="font-extrabold text-forest-900 text-xs">🍱 Canteen & Food Stall</p>
                      <p className="text-[10px] text-slate-600 mt-1">
                        Small food outlets, no table reservation required, direct food ordering.
                      </p>
                    </div>

                  </div>
                </div>

                {/* Exact Location */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Exact Restaurant Location Address *</label>
                  <textarea
                    rows={3}
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="e.g. Plot 42, Zone 2, MP Nagar, Near DB City Mall, Bhopal, MP 462011"
                    className="w-full px-4 py-3 rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-forest-800"
                  />
                  <p className="text-[10px] text-slate-500 mt-1 italic">
                    📌 Note: Exact restaurant location cannot be changed without admin permission later.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 3: VERIFICATION & LICENSES */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in">
                {/* Owner's Aadhaar */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Owner's Aadhaar Number *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.ownerAadhaar}
                      onChange={(e) => handleInputChange('ownerAadhaar', e.target.value)}
                      placeholder="e.g. 4532-8901-2345"
                      className="w-full px-4 py-3 rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-forest-800"
                    />
                    <button
                      type="button"
                      onClick={() => setAadharOtpSent(true)}
                      className="px-4 py-2 bg-sand-200 hover:bg-sand-300 text-slate-800 font-bold rounded-xl whitespace-nowrap cursor-pointer"
                    >
                      {aadharVerified ? 'Verified ✔' : 'Verify Aadhaar OTP'}
                    </button>
                  </div>
                  {aadharOtpSent && !aadharVerified && (
                    <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                      <p className="text-[11px] text-emerald-900 font-bold">
                        🔐 Dummy Aadhaar OTP: <span className="bg-emerald-200 px-2 py-0.5 rounded font-mono text-xs">654321</span>
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={aadharOtpInput}
                          onChange={(e) => setAadharOtpInput(e.target.value)}
                          placeholder="Enter OTP (654321)"
                          className="px-3 py-1.5 rounded-lg border border-emerald-300 text-xs w-full"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyAadharOtp}
                          className="px-3 py-1.5 bg-emerald-700 text-white font-bold rounded-lg text-xs cursor-pointer"
                        >
                          Verify
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* GSTIN (Optional) */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">GSTIN Number (Optional)</label>
                    <input
                      type="text"
                      value={formData.gstin}
                      onChange={(e) => handleInputChange('gstin', e.target.value)}
                      placeholder="e.g. 23AAAAA0000A1Z5"
                      className="w-full px-4 py-3 rounded-xl border border-sand-300 focus:outline-none"
                    />
                  </div>

                  {/* FSSAI License (Optional) */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">FSSAI License Number (Optional)</label>
                    <input
                      type="text"
                      value={formData.fssaiNumber}
                      onChange={(e) => handleInputChange('fssaiNumber', e.target.value)}
                      placeholder="e.g. 11223344556677"
                      className="w-full px-4 py-3 rounded-xl border border-sand-300 focus:outline-none"
                    />
                  </div>
                </div>

                {/* FDA Approval Number (Optional) */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">FDA Approval Number (Optional)</label>
                  <input
                    type="text"
                    value={formData.fdaNumber}
                    onChange={(e) => handleInputChange('fdaNumber', e.target.value)}
                    placeholder="e.g. FDA-MP-89712"
                    className="w-full px-4 py-3 rounded-xl border border-sand-300 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* STEP 4: 6 REQUIRED PHOTOS WITH DIRECT CAMERA CAPTURES & FILE UPLOADS (MAX 50MB PER PHOTO) */}
            {step === 4 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs">
                  <p className="font-extrabold flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-amber-700" /> Live Photo Upload & Direct Camera Rules:
                  </p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Upload Banner Photo 1 from gallery/device. <strong>Photos 2 to 6 trigger direct camera capture</strong> from your device (Max size: <strong>50MB per photo</strong>).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Photo 1: Card Banner */}
                  <div className="p-3.5 border border-sand-200 rounded-2xl bg-sand-50 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-slate-800">1. Restaurant Card Banner</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Public Card</span>
                    </div>
                    <label className="block text-center py-2.5 px-3 bg-white border border-sand-300 rounded-xl cursor-pointer hover:bg-sand-100 transition-all font-bold text-slate-700 text-xs shadow-sm">
                      <span>Upload Banner Image (Max 50MB)</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload('cardBanner', e.target.files[0])}
                      />
                    </label>
                    {formData.photos.cardBanner && (
                      <img src={formData.photos.cardBanner} alt="Banner" className="w-full h-24 object-cover rounded-xl border border-sand-200" />
                    )}
                  </div>

                  {/* Photo 2: Front */}
                  <div className="p-3.5 border border-sand-200 rounded-2xl bg-sand-50 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-slate-800">2. Restaurant Front</span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                        <Camera className="w-3 h-3" /> Live Camera Only
                      </span>
                    </div>
                    <label className="block text-center py-2.5 px-3 bg-forest-900 text-white rounded-xl cursor-pointer hover:bg-forest-950 transition-all font-extrabold text-xs shadow-sm">
                      <span>📷 Capture Live Front Photo (Max 50MB)</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => handleFileUpload('front', e.target.files[0])}
                      />
                    </label>
                    {formData.photos.front && (
                      <img src={formData.photos.front} alt="Front" className="w-full h-24 object-cover rounded-xl border border-sand-200" />
                    )}
                  </div>

                  {/* Photo 3: Table Seating */}
                  <div className="p-3.5 border border-sand-200 rounded-2xl bg-sand-50 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-slate-800">3. Table Seating Area</span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                        <Camera className="w-3 h-3" /> Live Camera Only
                      </span>
                    </div>
                    <label className="block text-center py-2.5 px-3 bg-forest-900 text-white rounded-xl cursor-pointer hover:bg-forest-950 transition-all font-extrabold text-xs shadow-sm">
                      <span>📷 Capture Live Table Area Photo (Max 50MB)</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => handleFileUpload('tableSeating', e.target.files[0])}
                      />
                    </label>
                    {formData.photos.tableSeating && (
                      <img src={formData.photos.tableSeating} alt="Table" className="w-full h-24 object-cover rounded-xl border border-sand-200" />
                    )}
                  </div>

                  {/* Photo 4: Kitchen */}
                  <div className="p-3.5 border border-sand-200 rounded-2xl bg-sand-50 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-slate-800">4. Kitchen Place</span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                        <Camera className="w-3 h-3" /> Live Camera Only
                      </span>
                    </div>
                    <label className="block text-center py-2.5 px-3 bg-forest-900 text-white rounded-xl cursor-pointer hover:bg-forest-950 transition-all font-extrabold text-xs shadow-sm">
                      <span>📷 Capture Live Kitchen Photo (Max 50MB)</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => handleFileUpload('kitchen', e.target.files[0])}
                      />
                    </label>
                    {formData.photos.kitchen && (
                      <img src={formData.photos.kitchen} alt="Kitchen" className="w-full h-24 object-cover rounded-xl border border-sand-200" />
                    )}
                  </div>

                  {/* Photo 5: Served Food */}
                  <div className="p-3.5 border border-sand-200 rounded-2xl bg-sand-50 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-slate-800">5. 1 Plate Served Food</span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                        <Camera className="w-3 h-3" /> Live Camera Only
                      </span>
                    </div>
                    <label className="block text-center py-2.5 px-3 bg-forest-900 text-white rounded-xl cursor-pointer hover:bg-forest-950 transition-all font-extrabold text-xs shadow-sm">
                      <span>📷 Capture Live Food Plate Photo (Max 50MB)</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => handleFileUpload('servedFood', e.target.files[0])}
                      />
                    </label>
                    {formData.photos.servedFood && (
                      <img src={formData.photos.servedFood} alt="Food" className="w-full h-24 object-cover rounded-xl border border-sand-200" />
                    )}
                  </div>

                  {/* Photo 6: Menu Image */}
                  <div className="p-3.5 border border-sand-200 rounded-2xl bg-sand-50 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-slate-800">6. Menu Image</span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                        <Camera className="w-3 h-3" /> Live Camera Only
                      </span>
                    </div>
                    <label className="block text-center py-2.5 px-3 bg-forest-900 text-white rounded-xl cursor-pointer hover:bg-forest-950 transition-all font-extrabold text-xs shadow-sm">
                      <span>📷 Capture Live Menu Image (Max 50MB)</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => handleFileUpload('menu', e.target.files[0])}
                      />
                    </label>
                    {formData.photos.menu && (
                      <img src={formData.photos.menu} alt="Menu" className="w-full h-24 object-cover rounded-xl border border-sand-200" />
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* STEP 5: TERMS, CONDITIONS & CAPTCHA */}
            {step === 5 && (
              <form onSubmit={handleSubmitApplication} className="space-y-4 animate-in fade-in">
                <div className="p-4 bg-sand-50 border border-sand-200 rounded-2xl space-y-3 text-xs text-slate-800">
                  <p className="font-extrabold text-forest-900 border-b border-sand-200 pb-2 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-forest-800" /> Mandatory Partner Undertakings & Consent
                  </p>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.terms.detailsCorrect}
                      onChange={() => handleTermToggle('detailsCorrect')}
                      className="mt-0.5 rounded text-forest-800 focus:ring-forest-800"
                    />
                    <span>1. All the details filled by you are correct and belong to you.</span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.terms.noObjectionSharing}
                      onChange={() => handleTermToggle('noObjectionSharing')}
                      className="mt-0.5 rounded text-forest-800 focus:ring-forest-800"
                    />
                    <span>2. You have no objection sharing these your details with bookmyorder.online platform and its admin.</span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.terms.followPricingAndPrivacy}
                      onChange={() => handleTermToggle('followPricingAndPrivacy')}
                      className="mt-0.5 rounded text-forest-800 focus:ring-forest-800"
                    />
                    <span>3. You will follow the pricing details provided by platform and agree to our privacy policies.</span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.terms.moralQueryHandling}
                      onChange={() => handleTermToggle('moralQueryHandling')}
                      className="mt-0.5 rounded text-forest-800 focus:ring-forest-800"
                    />
                    <span>4. You always listen to queries and complaints raised by customer through platform and treat & reply them morally within time.</span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.terms.fulfillOrdersAndBookings}
                      onChange={() => handleTermToggle('fulfillOrdersAndBookings')}
                      className="mt-0.5 rounded text-forest-800 focus:ring-forest-800"
                    />
                    <span>5. You will fulfill all orders and needs registered in the platform.</span>
                  </label>
                </div>

                {/* CAPTCHA SECTION */}
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <p className="font-extrabold text-emerald-950 text-xs flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-emerald-700" /> Security CAPTCHA Check
                    </p>
                    <p className="text-[11px] text-emerald-800 mt-0.5">Solve simple math to prove human registration.</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-emerald-200/80 rounded-xl font-mono text-base font-black text-emerald-950 flex items-center gap-2">
                      <span>{captchaNum1} + {captchaNum2} =</span>
                      <button
                        type="button"
                        onClick={generateCaptcha}
                        title="Refresh CAPTCHA"
                        className="p-1 text-emerald-800 hover:text-emerald-950 cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>

                    <input
                      type="number"
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      placeholder="Result"
                      className="w-24 px-3 py-2 rounded-xl border border-emerald-300 text-center font-bold text-sm bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-forest-900 hover:bg-forest-950 text-white font-black text-sm shadow-xl shadow-forest-900/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>Submitting Application...</span>
                  ) : (
                    <>
                      <span>Register as Restaurant with Us</span>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </>
                  )}
                </button>
              </form>
            )}

          </div>

          {/* Modal Footer Controls */}
          <div className="bg-sand-50 border-t border-sand-200 px-6 py-4 flex justify-between items-center gap-3 shrink-0">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-5 py-2.5 rounded-xl border border-sand-300 hover:bg-sand-200 text-slate-700 font-bold transition-all cursor-pointer text-xs"
              >
                Back
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleManualSave}
                title="Save changes to continue anytime from this device"
                className="px-4 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 font-black transition-all cursor-pointer flex items-center gap-1.5 text-xs shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-amber-700" />
                <span>Save Changes</span>
              </button>

              {step < 5 && (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 rounded-xl bg-forest-900 hover:bg-forest-950 text-white font-extrabold transition-all cursor-pointer flex items-center gap-1.5 text-xs shadow-md"
                >
                  <span>Continue</span>
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
