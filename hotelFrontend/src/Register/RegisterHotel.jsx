import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from '../services/authService';
import { hotelService } from '../services/hotelService';
import Head from "../head";
const RegisterHotel = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    countryCode: "+91",
    nic: "",
    username: "",
    password: ""
  });
  const [hotelForm, setHotelForm] = useState({
    hotelName: "",
    regNo: "",
    address: "",
    location: "",
    images: null,
    documents: null,
    acCount: 0,
    nonAcCount: 0,
    bedrooms: 1,
    livingrooms: 1,
    bathrooms: 1,
    diningrooms: 1,
    wifi: "10 mbp/s",
    unitsReady: 1,
    refrigerator: 1,
    television: 1
    ,
    acPrice: "",
    nonAcPrice: ""
  });
  const [userErrors, setUserErrors] = useState({});
  const [hotelErrors, setHotelErrors] = useState({});

  function validateUserForm() {
    const errors = {};
    if (!userForm.name) errors.name = "Name is required";
    if (!userForm.email) errors.email = "Email is required";
    if (!userForm.phone) errors.phone = "Phone is required";
    if (!userForm.country) errors.country = "Country is required";
    if (!userForm.countryCode) errors.countryCode = "Country code is required";
    if (!userForm.nic) errors.nic = "NIC is required";
    if (!userForm.username) errors.username = "Username is required";
    if (!userForm.password) errors.password = "Password is required";
    return errors;
  }
  function validateHotelForm() {
    const errors = {};
    if (!hotelForm.hotelName) errors.hotelName = "Hotel Name is required";
    if (!hotelForm.regNo) errors.regNo = "Registration No is required";
    if (!hotelForm.address) errors.address = "Address is required";
    if (!hotelForm.location) errors.location = "Location is required";
    if (!hotelForm.images) errors.images = "Images are required";
    if (!hotelForm.documents) errors.documents = "Documents are required";
    if (hotelForm.acCount < 0) errors.acCount = "AC rooms cannot be negative";
    if (hotelForm.nonAcCount < 0) errors.nonAcCount = "Non-AC rooms cannot be negative";
    if (!hotelForm.bedrooms) errors.bedrooms = "Bedrooms are required";
    if (!hotelForm.livingrooms) errors.livingrooms = "Living rooms are required";
    if (!hotelForm.bathrooms) errors.bathrooms = "Bathrooms are required";
    if (!hotelForm.diningrooms) errors.diningrooms = "Dining rooms are required";
    if (!hotelForm.wifi) errors.wifi = "WiFi speed is required";
    if (!hotelForm.unitsReady) errors.unitsReady = "Units ready is required";
    if (!hotelForm.refrigerator) errors.refrigerator = "Refrigerator is required";
    if (!hotelForm.television) errors.television = "Television is required";
    // Pricing by room type
    if (hotelForm.acPrice === "" || hotelForm.acPrice === null) errors.acPrice = 'AC room price is required';
    if (hotelForm.nonAcPrice === "" || hotelForm.nonAcPrice === null) errors.nonAcPrice = 'Non-AC room price is required';
    const ac = Number(hotelForm.acPrice);
    const non = Number(hotelForm.nonAcPrice);
    if ((hotelForm.acPrice !== "" && !Number.isFinite(ac)) || ac < 0) errors.acPrice = 'Enter a valid AC room price';
    if ((hotelForm.nonAcPrice !== "" && !Number.isFinite(non)) || non < 0) errors.nonAcPrice = 'Enter a valid Non-AC room price';
    if (Number.isFinite(ac) && Number.isFinite(non)) {
      if (ac <= 0) errors.acPrice = 'AC price must be greater than 0';
      if (non <= 0) errors.nonAcPrice = 'Non-AC price must be greater than 0';
      if (ac <= non) errors.acPrice = 'AC price must be greater than Non-AC price';
    }
    return errors;
  }

  function handleUserChange(e) {
    setUserForm({ ...userForm, [e.target.name]: e.target.value });
  }
  function handleHotelChange(e) {
    const { name, type, value, files } = e.target;
    setHotelForm({ ...hotelForm, [name]: type === "file" ? files[0] : value });
  }

  const navigate = useNavigate();
  async function handleSubmit(e) {
    e.preventDefault();
    const uErrors = validateUserForm();
    const hErrors = validateHotelForm();
    setUserErrors(uErrors);
    setHotelErrors(hErrors);
    
    if (Object.keys(uErrors).length === 0 && Object.keys(hErrors).length === 0) {
      setLoading(true);
      try {
        // First register the user as a hotel owner
        await authService.register({
          name: userForm.name,
          email: userForm.email,
          phone: userForm.phone,
          countryCode: userForm.countryCode,
          country: userForm.country,
          nic: userForm.nic,
          username: userForm.username,
          password: userForm.password,
          role: 'hotelOwner'
        });

        // Then create the hotel with the logged-in user
        const facilities = {
          bedrooms: hotelForm.bedrooms,
          livingrooms: hotelForm.livingrooms,
          bathrooms: hotelForm.bathrooms,
          diningrooms: hotelForm.diningrooms,
          wifi: hotelForm.wifi,
          unitsReady: hotelForm.unitsReady,
          refrigerator: hotelForm.refrigerator,
          television: hotelForm.television
        };
        const hotelData = {
          name: hotelForm.hotelName,
          location: hotelForm.location,
          address: hotelForm.address,
          registrationNo: hotelForm.regNo,
          priceAc: Number(hotelForm.acPrice),
          priceNonAc: Number(hotelForm.nonAcPrice),
          description: '',
          images: hotelForm.images ? [hotelForm.images] : [],
          documents: hotelForm.documents ? [hotelForm.documents] : [],
          acCount: Number(hotelForm.acCount) || 0,
          nonAcCount: Number(hotelForm.nonAcCount) || 0,
          facilities
        };

        await hotelService.createHotel(hotelData);
        
        // Redirect owner to their dashboard after successful registration
        navigate('/dashboard/owner');
        
        // Reset forms
        setUserForm({ name: "", email: "", phone: "", country: "", countryCode: "+94", nic: "", username: "", password: "" });
        setHotelForm({ hotelName: "", regNo: "", address: "", location: "", images: null, documents: null, acCount: 0, nonAcCount: 0, bedrooms: 1, livingrooms: 1, bathrooms: 1, diningrooms: 1, wifi: '10 mbp/s', unitsReady: 1, refrigerator: 1, television: 1, acPrice: '', nonAcPrice: '' });
        setShowPassword(false);
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Registration failed. Please try again.';
        setUserErrors({ submit: errorMsg });
        setHotelErrors({ submit: errorMsg });
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div className="bg-gray-100 min-h-screen w-full">
       <div className="fixed top-0 inset-x-0 z-50 bg-white ">
      <Head />
      </div>
      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden pt-15">
        <main className="grow">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
              {/* Title */}
              <div className="flex flex-wrap justify-between gap-3 text-center">
                <div className="flex flex-col gap-2 w-full">
                  <h1 className="text-gray-900 text-4xl font-black leading-tight tracking-[-0.033em]">
                    Register Your Hotel
                  </h1>
                  <p className="text-gray-500 text-base font-normal leading-normal">
                    Join our platform and start welcoming guests today. Please fill out the details below.
                  </p>
                </div>
              </div>

              {/* Owner Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
                <h2 className="text-gray-900 text-[22px] font-bold leading-tight tracking-[-0.015em] pb-6">
                  Owner Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                  <div className="flex flex-col">
                    <label className="text-gray-800 text-sm font-medium leading-normal pb-2" htmlFor="fullName">
                      Full Name
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      name="name"
                      value={userForm.name}
                      onChange={handleUserChange}
                      placeholder="Enter your full name"
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 focus:outline-0 focus:ring-2 focus:ring-blue-500/50 border border-gray-300 bg-gray-50 focus:border-blue-500 h-12 placeholder:text-gray-400 p-3 text-sm font-normal leading-normal"
                    />
                    {userErrors.name && <span className="text-red-500 text-xs">{userErrors.name}</span>}
                  </div>

                  <div className="flex flex-col">
                    <label className="text-gray-800 text-sm font-medium leading-normal pb-2" htmlFor="email">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="text"
                      name="email"
                      value={userForm.email}
                      onChange={handleUserChange}
                      placeholder="Enter your email"
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 focus:outline-0 focus:ring-2 focus:ring-blue-500/50 border border-gray-300 bg-gray-50 focus:border-blue-500 h-12 placeholder:text-gray-400 p-3 text-sm font-normal leading-normal"
                    />
                    {userErrors.email && <span className="text-red-500 text-xs">{userErrors.email}</span>}
                  </div>

                  <div className="flex flex-col">
                    <label className="text-gray-800 text-sm font-medium leading-normal pb-2" htmlFor="phone">
                      Phone Number
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="countryCode"
                        type="text"
                        name="countryCode"
                        value={userForm.countryCode}
                        onChange={handleUserChange}
                        placeholder="+91"
                        className="form-input flex w-24 min-w-0 rounded-lg text-gray-900 focus:outline-0 focus:ring-2 focus:ring-blue-500/50 border border-gray-300 bg-gray-50 focus:border-blue-500 h-12 placeholder:text-gray-400 p-3 text-sm font-normal leading-normal"
                      />
                      <input
                        id="phone"
                        type="text"
                        name="phone"
                        value={userForm.phone}
                        onChange={handleUserChange}
                        placeholder="Mobile number"
                        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 focus:outline-0 focus:ring-2 focus:ring-blue-500/50 border border-gray-300 bg-gray-50 focus:border-blue-500 h-12 placeholder:text-gray-400 p-3 text-sm font-normal leading-normal"
                      />
                    </div>
                    {userErrors.phone && <span className="text-red-500 text-xs">{userErrors.phone}</span>}
                    {userErrors.countryCode && <span className="text-red-500 text-xs">{userErrors.countryCode}</span>}
                  </div>

                  <div className="flex flex-col">
                    <label className="text-gray-800 text-sm font-medium leading-normal pb-2" htmlFor="country">
                      Country
                    </label>
                    <input
                      id="country"
                      type="text"
                      name="country"
                      value={userForm.country}
                      onChange={handleUserChange}
                      placeholder="Country Name"
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 focus:outline-0 focus:ring-2 focus:ring-blue-500/50 border border-gray-300 bg-gray-50 focus:border-blue-500 h-12 placeholder:text-gray-400 p-3 text-sm font-normal leading-normal"
                    />
                    {userErrors.country && <span className="text-red-500 text-xs">{userErrors.country}</span>}
                  </div>

                  <div className="flex flex-col">
                    <label className="text-gray-800 text-sm font-medium leading-normal pb-2" htmlFor="nic">
                      Adhar Card Number
                    </label>
                    <input
                      id="nic"
                      type="text"
                      name="nic"
                      value={userForm.nic}
                      onChange={handleUserChange}
                      placeholder="Enter your Adhar Card Number"
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 focus:outline-0 focus:ring-2 focus:ring-blue-500/50 border border-gray-300 bg-gray-50 focus:border-blue-500 h-12 placeholder:text-gray-400 p-3 text-sm font-normal leading-normal"
                    />
                    {userErrors.nic && <span className="text-red-500 text-xs">{userErrors.nic}</span>}
                  </div>

                  <div className="flex flex-col">
                    <label className="text-gray-800 text-sm font-medium leading-normal pb-2" htmlFor="username">
                      Username
                    </label>
                    <input
                      id="username"
                      type="text"
                      name="username"
                      value={userForm.username}
                      onChange={handleUserChange}
                      placeholder="Choose a username"
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 focus:outline-0 focus:ring-2 focus:ring-blue-500/50 border border-gray-300 bg-gray-50 focus:border-blue-500 h-12 placeholder:text-gray-400 p-3 text-sm font-normal leading-normal"
                    />
                    {userErrors.username && <span className="text-red-500 text-xs">{userErrors.username}</span>}
                  </div>

                  <div className="flex flex-col">
                    <label className="text-gray-800 text-sm font-medium leading-normal pb-2" htmlFor="password">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={userForm.password}
                        onChange={handleUserChange}
                        placeholder="Enter a strong password"
                        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 focus:outline-0 focus:ring-2 focus:ring-blue-500/50 border border-gray-300 bg-gray-50 focus:border-blue-500 h-12 placeholder:text-gray-400 p-3 pr-10 text-sm font-normal leading-normal"
                      />
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-gray-400" onClick={() => setShowPassword(!showPassword)}>
                        {/* eye icon simplified */}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </span>
                    </div>
                    {userErrors.password && <span className="text-red-500 text-xs">{userErrors.password}</span>}
                    {userErrors.submit && <div className="text-red-500 text-sm mt-2">{userErrors.submit}</div>}
                  </div>
                </div>
              </div>

              {/* Hotel Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
                <h2 className="text-gray-900 text-[22px] font-bold leading-tight tracking-[-0.015em] pb-6">
                  Hotel Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                  <div className="flex flex-col">
                    <label className="text-gray-800 text-sm font-medium leading-normal pb-2" htmlFor="hotelName">
                      Hotel Name
                    </label>
                    <input
                      id="hotelName"
                      type="text"
                      name="hotelName"
                      value={hotelForm.hotelName}
                      onChange={handleHotelChange}
                      placeholder="Enter hotel name"
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 focus:outline-0 focus:ring-2 focus:ring-blue-500/50 border border-gray-300 bg-gray-50 focus:border-blue-500 h-12 placeholder:text-gray-400 p-3 text-sm font-normal leading-normal"
                    />
                    {hotelErrors.hotelName && <span className="text-red-500 text-xs">{hotelErrors.hotelName}</span>}
                  </div>

                  <div className="flex flex-col">
                    <label className="text-gray-800 text-sm font-medium leading-normal pb-2" htmlFor="regNumber">
                      Hotel Registration Number
                    </label>
                    <input
                      id="regNumber"
                      type="text"
                      name="regNo"
                      value={hotelForm.regNo}
                      onChange={handleHotelChange}
                      placeholder="Enter registration number"
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 focus:outline-0 focus:ring-2 focus:ring-blue-500/50 border border-gray-300 bg-gray-50 focus:border-blue-500 h-12 placeholder:text-gray-400 p-3 text-sm font-normal leading-normal"
                    />
                    {hotelErrors.regNo && <span className="text-red-500 text-xs">{hotelErrors.regNo}</span>}
                  </div>

                  <div className="md:col-span-2 flex flex-col">
                    <label className="text-gray-800 text-sm font-medium leading-normal pb-2" htmlFor="address">
                      Hotel Address
                    </label>
                    <input
                      id="address"
                      type="text"
                      name="address"
                      value={hotelForm.address}
                      onChange={handleHotelChange}
                      placeholder="e.g. Gokhale nagar, Pune"
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 focus:outline-0 focus:ring-2 focus:ring-blue-500/50 border border-gray-300 bg-gray-50 focus:border-blue-500 h-12 placeholder:text-gray-400 p-3 text-sm font-normal leading-normal"
                    />
                    {hotelErrors.address && <span className="text-red-500 text-xs">{hotelErrors.address}</span>}
                  </div>

                  <div className="md:col-span-2 flex flex-col">
                    <label className="text-gray-800 text-sm font-medium leading-normal pb-2" htmlFor="location">
                      Location
                    </label>
                    <input
                      id="location"
                      type="text"
                      name="location"
                      value={hotelForm.location}
                      onChange={handleHotelChange}
                      placeholder="City, country"
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 focus:outline-0 focus:ring-2 focus:ring-blue-500/50 border border-gray-300 bg-gray-50 focus:border-blue-500 h-12 placeholder:text-gray-400 p-3 text-sm font-normal leading-normal"
                    />
                    {hotelErrors.location && <span className="text-red-500 text-xs">{hotelErrors.location}</span>}
                  </div>

                  <div className="flex flex-col">
                    <label className="text-gray-800 text-sm font-medium leading-normal pb-2" htmlFor="acRooms">
                      AC Rooms
                    </label>
                    <input
                      id="acRooms"
                      type="number"
                      min="0"
                      name="acCount"
                      value={hotelForm.acCount}
                      onChange={handleHotelChange}
                      placeholder="0"
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 focus:outline-0 focus:ring-2 focus:ring-blue-500/50 border border-gray-300 bg-gray-50 focus:border-blue-500 h-12 placeholder:text-gray-400 p-3 text-sm font-normal leading-normal"
                    />
                    {hotelErrors.acCount && <span className="text-red-500 text-xs">{hotelErrors.acCount}</span>}
                  </div>

                  <div className="flex flex-col">
                    <label className="text-gray-800 text-sm font-medium leading-normal pb-2" htmlFor="nonAcRooms">
                      Non-AC Rooms
                    </label>
                    <input
                      id="nonAcRooms"
                      type="number"
                      min="0"
                      name="nonAcCount"
                      value={hotelForm.nonAcCount}
                      onChange={handleHotelChange}
                      placeholder="0"
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 focus:outline-0 focus:ring-2 focus:ring-blue-500/50 border border-gray-300 bg-gray-50 focus:border-blue-500 h-12 placeholder:text-gray-400 p-3 text-sm font-normal leading-normal"
                    />
                    {hotelErrors.nonAcCount && <span className="text-red-500 text-xs">{hotelErrors.nonAcCount}</span>}
                  </div>

                  <div className="flex flex-col">
                    <label className="text-gray-800 text-sm font-medium leading-normal pb-2" htmlFor="acPrice">
                      AC Price (per night)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">₹</span>
                      <input
                        id="acPrice"
                        type="number"
                        min="0"
                        name="acPrice"
                        value={hotelForm.acPrice}
                        onChange={handleHotelChange}
                        placeholder="3500"
                        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 focus:outline-0 focus:ring-2 focus:ring-blue-500/50 border border-gray-300 bg-gray-50 focus:border-blue-500 h-12 placeholder:text-gray-400 p-3 pl-7 text-sm font-normal leading-normal"
                      />
                    </div>
                    {hotelErrors.acPrice && <span className="text-red-500 text-xs">{hotelErrors.acPrice}</span>}
                  </div>

                  <div className="flex flex-col">
                    <label className="text-gray-800 text-sm font-medium leading-normal pb-2" htmlFor="nonAcPrice">
                      Non-AC Price (per night)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">₹</span>
                      <input
                        id="nonAcPrice"
                        type="number"
                        min="0"
                        name="nonAcPrice"
                        value={hotelForm.nonAcPrice}
                        onChange={handleHotelChange}
                        placeholder="2500"
                        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 focus:outline-0 focus:ring-2 focus:ring-blue-500/50 border border-gray-300 bg-gray-50 focus:border-blue-500 h-12 placeholder:text-gray-400 p-3 pl-7 text-sm font-normal leading-normal"
                      />
                    </div>
                    {hotelErrors.nonAcPrice && <span className="text-red-500 text-xs">{hotelErrors.nonAcPrice}</span>}
                  </div>

                  <div className="md:col-span-2 p-6 rounded-lg bg-gray-50 border border-gray-200">
                    <div className="flex flex-col gap-6">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Hotel Images &amp; Documents</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Upload high-quality images of your hotel and the necessary registration documents.
                        </p>
                      </div>

                      <div className="flex flex-col gap-4">
                        <label
                          htmlFor="hotel-images"
                          className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l6-6 4 4 5-5 3 3" />
                            </svg>
                            <p className="mb-1 text-sm text-gray-500">
                              <span className="font-semibold">Click to upload hotel images</span>
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG, or GIF (max. 5MB)</p>
                            {hotelForm.images && <p className="text-xs text-gray-600 mt-2">Selected: {hotelForm.images.name}</p>}
                          </div>
                          <input id="hotel-images" type="file" name="images" onChange={handleHotelChange} className="hidden" />
                        </label>
                        {hotelErrors.images && <span className="text-red-500 text-xs">{hotelErrors.images}</span>}

                        <label
                          htmlFor="reg-document"
                          className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10M7 11h10M7 15h10" />
                            </svg>
                            <p className="mb-1 text-sm text-gray-500">
                              <span className="font-semibold">Click to upload registration document</span>
                            </p>
                            <p className="text-xs text-gray-500">PDF (max. 10MB)</p>
                            {hotelForm.documents && <p className="text-xs text-gray-600 mt-2">Selected: {hotelForm.documents.name}</p>}
                          </div>
                          <input id="reg-document" type="file" name="documents" onChange={handleHotelChange} className="hidden" />
                        </label>
                        {hotelErrors.documents && <span className="text-red-500 text-xs">{hotelErrors.documents}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {hotelErrors.submit && <div className="text-red-500 text-sm mt-2">{hotelErrors.submit}</div>}
              </div>

              {/* Submit */}
              <div className="flex flex-col items-center gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto flex min-w-[200px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-blue-600 text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="truncate">{loading ? 'Registering...' : 'Submit Registration'}</span>
                </button>
                <p className="text-xs text-gray-500 text-center">
                  By clicking "Submit", you agree to our
                  <a href="" className="text-blue-600 hover:underline">Terms of Service</a>
                  and
                  <a href="" className="text-blue-600 hover:underline">Privacy Policy</a>.
                </p>
                <div className="text-center">
                  <a href="login" className="text-blue-600 hover:underline">Already have an account? Login</a>
                </div>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default RegisterHotel;
