import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from '../services/authService';
import { hotelService } from '../services/hotelService';
import bedroom from "../assets/Details/ic_bedroom.png";
import livingroom from "../assets/Details/ic_livingroom.png";
import bathroom from "../assets/Details/bathroom.png";
import diningroom from "../assets/Details/ic_diningroom.png";
import wifi from "../assets/Details/ic_wifi.png";
import unit from "../assets/Details/ic_ac.png";
import fridge from "../assets/Details/ic_kulkas.png";
import tv from "../assets/Details/ic_tv.png";

const RegisterHotel = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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
    bedrooms: 1,
    livingrooms: 1,
    bathrooms: 1,
    diningrooms: 1,
    wifi: "10 mbp/s",
    unitsReady: 1,
    refrigerator: 1,
    television: 1
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
    if (!hotelForm.bedrooms) errors.bedrooms = "Bedrooms are required";
    if (!hotelForm.livingrooms) errors.livingrooms = "Living rooms are required";
    if (!hotelForm.bathrooms) errors.bathrooms = "Bathrooms are required";
    if (!hotelForm.diningrooms) errors.diningrooms = "Dining rooms are required";
    if (!hotelForm.wifi) errors.wifi = "WiFi speed is required";
    if (!hotelForm.unitsReady) errors.unitsReady = "Units ready is required";
    if (!hotelForm.refrigerator) errors.refrigerator = "Refrigerator is required";
    if (!hotelForm.television) errors.television = "Television is required";
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
        // First register the user
        await authService.register({
          name: userForm.name,
          email: userForm.email,
          phone: userForm.phone,
          countryCode: '+94',
          country: userForm.country,
          username: userForm.username,
          password: userForm.password
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
          location: userForm.country,
          address: hotelForm.address,
          registrationNo: hotelForm.regNo,
          ownerNIC: userForm.nic,
          price: 200, // Default price
          description: '',
          images: hotelForm.images ? [hotelForm.images] : [],
          documents: hotelForm.documents ? [hotelForm.documents] : [],
          facilities
        };

        await hotelService.createHotel(hotelData);
        
        // Redirect to complete hotel register page
        navigate('/completehotelregister');
        
        // Reset forms
        setUserForm({ name: "", email: "", phone: "", country: "", nic: "", username: "", password: "" });
        setHotelForm({ hotelName: "", regNo: "", address: "", images: null, documents: null, facilities: "" });
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
              {userErrors.submit && <div className="text-red-500 text-sm mt-2">{userErrors.submit}</div>}
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-2">
                <div className="flex flex-col items-center">
                  <label className="flex flex-col items-center text-sm font-medium mb-1">
                    <img src={bedroom} alt="Bedroom" className="w-8 h-8 mb-1" />
                    <span>Bedrooms</span>
                  </label>
                  <input type="number" min="0" name="bedrooms" value={hotelForm.bedrooms} onChange={handleHotelChange} className="border rounded-md px-2 py-2 outline-none w-24 text-center" />
                </div>
                <div className="flex flex-col items-center">
                  <label className="flex flex-col items-center text-sm font-medium mb-1">
                    <img src={livingroom} alt="Living Room" className="w-8 h-8 mb-1" />
                    <span>Living Rooms</span>
                  </label>
                  <input type="number" min="0" name="livingrooms" value={hotelForm.livingrooms} onChange={handleHotelChange} className="border rounded-md px-2 py-2 outline-none w-24 text-center" />
                </div>
                <div className="flex flex-col items-center">
                  <label className="flex flex-col items-center text-sm font-medium mb-1">
                    <img src={bathroom} alt="Bathroom" className="w-8 h-8 mb-1" />
                    <span>Bathrooms</span>
                  </label>
                  <input type="number" min="0" name="bathrooms" value={hotelForm.bathrooms} onChange={handleHotelChange} className="border rounded-md px-2 py-2 outline-none w-24 text-center" />
                </div>
                <div className="flex flex-col items-center">
                  <label className="flex flex-col items-center text-sm font-medium mb-1">
                    <img src={diningroom} alt="Dining Room" className="w-8 h-8 mb-1" />
                    <span>Dining Rooms</span>
                  </label>
                  <input type="number" min="0" name="diningrooms" value={hotelForm.diningrooms} onChange={handleHotelChange} className="border rounded-md px-2 py-2 outline-none w-24 text-center" />
                </div>
                <div className="flex flex-col items-center">
                  <label className="flex flex-col items-center text-sm font-medium mb-1">
                    <img src={wifi} alt="WiFi" className="w-8 h-8 mb-1" />
                    <span>WiFi Speed</span>
                  </label>
                  <input type="text" name="wifi" value={hotelForm.wifi} onChange={handleHotelChange} className="border rounded-md px-2 py-2 outline-none w-24 text-center" placeholder="e.g. 10 mbp/s" />
                </div>
                <div className="flex flex-col items-center">
                  <label className="flex flex-col items-center text-sm font-medium mb-1">
                    <img src={unit} alt="Unit Ready" className="w-8 h-8 mb-1" />
                    <span>Units Ready</span>
                  </label>
                  <input type="number" min="0" name="unitsReady" value={hotelForm.unitsReady} onChange={handleHotelChange} className="border rounded-md px-2 py-2 outline-none w-24 text-center" />
                </div>
                <div className="flex flex-col items-center">
                  <label className="flex flex-col items-center text-sm font-medium mb-1">
                    <img src={fridge} alt="Refrigerator" className="w-8 h-8 mb-1" />
                    <span>Refrigerator</span>
                  </label>
                  <input type="number" min="0" name="refrigerator" value={hotelForm.refrigerator} onChange={handleHotelChange} className="border rounded-md px-2 py-2 outline-none w-24 text-center" />
                </div>
                <div className="flex flex-col items-center">
                  <label className="flex flex-col items-center text-sm font-medium mb-1">
                    <img src={tv} alt="Television" className="w-8 h-8 mb-1" />
                    <span>Television</span>
                  </label>
                  <input type="number" min="0" name="television" value={hotelForm.television} onChange={handleHotelChange} className="border rounded-md px-2 py-2 outline-none w-24 text-center" />
                </div>
              </div>
              {hotelErrors.facilities && <span className="text-red-500 text-xs">{hotelErrors.facilities}</span>}
              {hotelErrors.submit && <div className="text-red-500 text-sm mt-2">{hotelErrors.submit}</div>}

              <div className="mt-6">
                <button className="bg-blue-600 text-white font-semibold rounded-lg px-8 py-2 shadow-lg hover:bg-blue-700 transition focus:outline-none w-full disabled:opacity-50 disabled:cursor-not-allowed" type="submit" disabled={loading}>
                  {loading ? 'Registering...' : 'Register'}
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
