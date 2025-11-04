import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const RegisterHotel = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    nic: "",
    username: "",
    password: ""
  });
  const [hotelForm, setHotelForm] = useState({
    hotelName: "",
    regNo: "",
    address: "",
    images: null,
    documents: null,
    facilities: ""
  });
  const [userErrors, setUserErrors] = useState({});
  const [hotelErrors, setHotelErrors] = useState({});

  function validateUserForm() {
    const errors = {};
    if (!userForm.name) errors.name = "Name is required";
    if (!userForm.email) errors.email = "Email is required";
    if (!userForm.phone) errors.phone = "Phone is required";
    if (!userForm.country) errors.country = "Country is required";
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
    if (!hotelForm.images) errors.images = "Images are required";
    if (!hotelForm.documents) errors.documents = "Documents are required";
    if (!hotelForm.facilities) errors.facilities = "Facilities are required";
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
  function handleSubmit(e) {
    e.preventDefault();
    const uErrors = validateUserForm();
    const hErrors = validateHotelForm();
    setUserErrors(uErrors);
    setHotelErrors(hErrors);
    if (Object.keys(uErrors).length === 0 && Object.keys(hErrors).length === 0) {
      // Redirect to complete hotel register page
      navigate('/completehotelregister');
      // Optionally reset forms
      setUserForm({ name: "", email: "", phone: "", country: "", nic: "", username: "", password: "" });
      setHotelForm({ hotelName: "", regNo: "", address: "", images: null, documents: null, facilities: "" });
      setShowPassword(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-6xl p-8">
        <form className="flex flex-col lg:flex-row gap-8" onSubmit={handleSubmit}>
          {/* Left: User Registration */}
          <div className="flex-1 pr-0 lg:pr-8 lg:border-r lg:border-gray-200">
            <div className="text-[40px] font-bold mb-8">
              <span className="text-blue-600">Lanka</span>
              <span className="text-gray-900">Stay.</span>
            </div>
            <div className="flex flex-col gap-4">
              <label className="font-semibold">Name</label>
              <input type="text" name="name" value={userForm.name} onChange={handleUserChange} placeholder="Enter your name" className="border rounded-md px-4 py-2 outline-none" />
              {userErrors.name && <span className="text-red-500 text-xs">{userErrors.name}</span>}

              <label className="font-semibold">E-mail</label>
              <input type="text" name="email" value={userForm.email} onChange={handleUserChange} placeholder="name@gmail.com" className="border rounded-md px-4 py-2 outline-none" />
              {userErrors.email && <span className="text-red-500 text-xs">{userErrors.email}</span>}

              <label className="font-semibold">Phone No</label>
              <input type="text" name="phone" value={userForm.phone} onChange={handleUserChange} placeholder="With Country Code" className="border rounded-md px-4 py-2 outline-none" />
              {userErrors.phone && <span className="text-red-500 text-xs">{userErrors.phone}</span>}

              <label className="font-semibold">Country</label>
              <input type="text" name="country" value={userForm.country} onChange={handleUserChange} placeholder="Country Name" className="border rounded-md px-4 py-2 outline-none" />
              {userErrors.country && <span className="text-red-500 text-xs">{userErrors.country}</span>}

              <label className="font-semibold">NIC</label>
              <input type="text" name="nic" value={userForm.nic} onChange={handleUserChange} placeholder="National Identity Card" className="border rounded-md px-4 py-2 outline-none" />
              {userErrors.nic && <span className="text-red-500 text-xs">{userErrors.nic}</span>}

              <label className="font-semibold">Username</label>
              <input type="text" name="username" value={userForm.username} onChange={handleUserChange} placeholder="Username" className="border rounded-md px-4 py-2 outline-none" />
              {userErrors.username && <span className="text-red-500 text-xs">{userErrors.username}</span>}

              <label className="font-semibold">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} name="password" value={userForm.password} onChange={handleUserChange} placeholder="6+ characters" className="border rounded-md px-4 py-2 w-full outline-none" />
                <span className="absolute right-3 top-3 cursor-pointer text-gray-400" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M9.88 9.88A3 3 0 0012 15a3 3 0 002.12-5.12M15 15a3 3 0 01-4.24-4.24" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </span>
              </div>
              {userErrors.password && <span className="text-red-500 text-xs">{userErrors.password}</span>}
              </div>
            </div>

            {/* Right: Hotel Registration */}
          <div className="flex-1 pl-0 lg:pl-8">
            <div className="text-[28px] font-bold mb-8">Register Your Hotel</div>
            <div className="flex flex-col gap-4">
              <label className="font-semibold">Hotel Name</label>
              <input type="text" name="hotelName" value={hotelForm.hotelName} onChange={handleHotelChange} placeholder="Full Name" className="border rounded-md px-4 py-2 outline-none" />
              {hotelErrors.hotelName && <span className="text-red-500 text-xs">{hotelErrors.hotelName}</span>}

              <label className="font-semibold">Registration No</label>
              <input type="text" name="regNo" value={hotelForm.regNo} onChange={handleHotelChange} placeholder="PVT(Ltd)" className="border rounded-md px-4 py-2 outline-none" />
              {hotelErrors.regNo && <span className="text-red-500 text-xs">{hotelErrors.regNo}</span>}

              <label className="font-semibold">Address</label>
              <input type="text" name="address" value={hotelForm.address} onChange={handleHotelChange} placeholder="Location" className="border rounded-md px-4 py-2 outline-none" />
              {hotelErrors.address && <span className="text-red-500 text-xs">{hotelErrors.address}</span>}


              <label className="font-semibold">Upload Images</label>
              <div className="relative">
                <input
                  type="file"
                  name="images"
                  id="images"
                  onChange={handleHotelChange}
                  className="hidden"
                />
                <label htmlFor="images" className="cursor-pointer border rounded-md px-4 py-2 bg-gray-50 hover:bg-blue-50 text-gray-700 font-medium w-full block text-ellipsis overflow-hidden whitespace-nowrap">
                  {hotelForm.images ? hotelForm.images.name : "Choose image file"}
                </label>
              </div>
              {hotelErrors.images && <span className="text-red-500 text-xs">{hotelErrors.images}</span>}

              <label className="font-semibold">Upload Documents</label>
              <div className="relative">
                <input
                  type="file"
                  name="documents"
                  id="documents"
                  onChange={handleHotelChange}
                  className="hidden"
                />
                <label htmlFor="documents" className="cursor-pointer border rounded-md px-4 py-2 bg-gray-50 hover:bg-blue-50 text-gray-700 font-medium w-full block text-ellipsis overflow-hidden whitespace-nowrap">
                  {hotelForm.documents ? hotelForm.documents.name : "Choose document file"}
                </label>
              </div>
              {hotelErrors.documents && <span className="text-red-500 text-xs">{hotelErrors.documents}</span>}

              <label className="font-semibold">Facilities</label>
              <input type="text" name="facilities" value={hotelForm.facilities} onChange={handleHotelChange} placeholder="Describe" className="border rounded-md px-4 py-2 outline-none" />
              {hotelErrors.facilities && <span className="text-red-500 text-xs">{hotelErrors.facilities}</span>}

              <div className="mt-6">
                <button className="bg-blue-600 text-white font-semibold rounded-lg px-8 py-2 shadow-lg hover:bg-blue-700 transition focus:outline-none w-full" type="submit">
                  Register
                </button>
                <div className="text-center mt-3">
                  <a href="login" className="text-black underline">Login</a>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterHotel;
