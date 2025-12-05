import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import placeImg from "../assets/location/Shangri-La.png";
import { hotelService } from "../services/hotelService";
import { authService } from "../services/authService";
import getImageUrl from '../utils/getImageUrl';
import Spinner from '../components/Spinner';
import { formatINR } from '../utils/currency';
import Layout from '../Dashboard/components/Layout.jsx';

// --- Utility helpers (UTC-safe) -------------------------------------------------
const isoFromUTC = (date) => {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
const startOfMonthUTC = (year, month) => new Date(Date.UTC(year, month, 1));
const endOfMonthUTC = (year, month) => new Date(Date.UTC(year, month + 1, 0));
const addDaysUTC = (iso, days) => {
  const base = new Date(iso + 'T00:00:00Z');
  const shifted = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
  return isoFromUTC(shifted);
};

// --- Booking component ---------------------------------------------------------
const Booking = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hotelId = searchParams.get('hotelId');

  // booking state
  const [days, setDays] = useState(2);
  const [checkInDate, setCheckInDate] = useState(() => isoFromUTC(new Date()));
  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd, setRangeEnd] = useState(null);
  const [roomType, setRoomType] = useState('AC');
  const [roomsCount, setRoomsCount] = useState(1);
  // calendar popover state
  const [showCalendar, setShowCalendar] = useState(false);

  // data
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [availability, setAvailability] = useState(null);

  // calendar: array of months { year, month, loading, days: [{date, availableAc, availableNonAc, remaining}] }
  const [months, setMonths] = useState([]);
  const [viewIndex, setViewIndex] = useState(0);
  const loadingMonthsRef = useRef(new Set());

  // price
  const pricePerDay = useMemo(() => {
    if (!hotel) return 0;
    return roomType === 'AC' ? (hotel.priceAc || 0) : (hotel.priceNonAc || 0);
  }, [hotel, roomType]);
  const totalPrice = days * pricePerDay * roomsCount;
  const apiRoomType = useMemo(() => (roomType || '').toUpperCase().replace('-', '_'), [roomType]);

  // compute maximum available rooms across the selected range (minimum per-day availability)
  const maxAvailableForRange = useMemo(() => {
    if (!rangeStart || !rangeEnd) return null;
    let min = Infinity;
    const start = new Date(rangeStart + 'T00:00:00Z');
    const end = new Date(rangeEnd + 'T00:00:00Z');
    for (let dt = new Date(start); dt <= end; dt = new Date(dt.getTime() + 24*60*60*1000)) {
      const iso = isoFromUTC(dt);
      const m = months.find(mm => mm.days?.some(d => d.isoUTC === iso));
      const dayData = m ? (m.days || []).find(d => d.isoUTC === iso) : null;
      const availableRooms = roomType === 'AC' ? Number(dayData?.availableAc || 0) : Number(dayData?.availableNonAc || 0);
      if (availableRooms === 0) return 0; // fully booked for at least one day
      if (Number.isFinite(availableRooms)) min = Math.min(min, availableRooms);
    }
    return min === Infinity ? null : min;
  }, [rangeStart, rangeEnd, months, roomType]);

  // --- fetch hotel --------------------------------------------------------------
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    const fetchHotel = async () => {
      if (!hotelId) { setLoading(false); return; }
      try {
        const res = await hotelService.getHotel(hotelId);
        setHotel(res?.data || res);
      } catch (e) { console.error('getHotel failed', e); }
      finally { setLoading(false); }
    };

    fetchHotel();
  }, [hotelId, navigate]);

  // --- derive check-in and days from range if set ------------------------------
  useEffect(() => {
    if (rangeStart && rangeEnd) {
      setCheckInDate(rangeStart);
      const start = new Date(rangeStart + 'T00:00:00Z');
      const end = new Date(rangeEnd + 'T00:00:00Z');
      const diff = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
      setDays(diff);
    }
  }, [rangeStart, rangeEnd]);

  // --- derive range from check-in and days so calendar highlights accordingly --
  useEffect(() => {
    if (!checkInDate || !days) return;
    const desiredStart = checkInDate;
    const desiredEnd = addDaysUTC(checkInDate, Math.max(0, Number(days) - 1));
    if (rangeStart !== desiredStart || rangeEnd !== desiredEnd) {
      setRangeStart(desiredStart);
      setRangeEnd(desiredEnd);
    }

    // ensure the calendar view jumps to the selected check-in month
    const dt = new Date(checkInDate + 'T00:00:00Z');
    const y = dt.getUTCFullYear();
    const m = dt.getUTCMonth();
    const idx = months.findIndex(mm => mm.year === y && mm.month === m);
    if (idx !== -1) setViewIndex(idx);
  }, [checkInDate, days]);

  // --- availability for chosen date/days ---------------------------------------
  useEffect(() => {
    if (!hotelId || !checkInDate || !days) { setAvailability(null); return; }
    setAvailability({ loading: true });
    let mounted = true;
    (async () => {
      try {
        const res = await hotelService.checkAvailability(hotelId, checkInDate, days, apiRoomType);
        if (!mounted) return;
        setAvailability({ loading: false, data: res?.data || res });
      } catch (e) {
        console.error('checkAvailability failed', e);
        if (!mounted) return;
        setAvailability({ loading: false, error: true });
      }
    })();
    return () => { mounted = false; };
  }, [hotelId, checkInDate, days, apiRoomType]);

  // --- calendar loading --------------------------------------------------------
  useEffect(() => {
    if (!hotelId) return;
    if (months.length > 0) return; // already initialized

    const base = new Date();
    const initial = [];
    for (let i = 0; i < 12; i++) {
      const dt = new Date(base.getFullYear(), base.getMonth() + i, 1);
      initial.push({ year: dt.getFullYear(), month: dt.getMonth(), loading: true, days: [] });
    }
    setMonths(initial);
    setViewIndex(0);

    // load only the first few months initially to avoid flooding requests
    initial.slice(0, 3).forEach(m => loadMonth(m.year, m.month));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId]);

  const loadMonth = async (year, month) => {
    const key = `${year}-${month}`;
    if (loadingMonthsRef.current.has(key)) return; // already fetching
    loadingMonthsRef.current.add(key);
    // mark loading
    setMonths(prev => prev.map(m => (m.year === year && m.month === month ? { ...m, loading: true } : m)));

    const start = startOfMonthUTC(year, month);
    const end = endOfMonthUTC(year, month+1);

    try {
      const res = await hotelService.getCalendarAvailability(hotelId, isoFromUTC(start), isoFromUTC(end), roomType);
      const payload = res?.data || res;
      const days = (payload?.days || payload || []).map(item => ({ ...item }));

      const normalized = days.map(d => {
        const dt = new Date(d.date);
        return { ...d, isoUTC: isoFromUTC(new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()))) };
      });

      setMonths(prev => {
        const copy = [...prev];
        const idx = copy.findIndex(m => m.year === year && m.month === month);
        const monthObj = { year, month, loading: false, days: normalized };
        if (idx !== -1) copy[idx] = monthObj; else copy.push(monthObj);
        copy.sort((a,b) => (a.year - b.year) || (a.month - b.month));
        return copy;
      });
    } catch (e) {
      console.error('loadMonth failed', year, month, e);
      setMonths(prev => prev.map(m => (m.year === year && m.month === month ? ({ ...m, loading: false, days: [] }) : m)));
    }
    finally {
      loadingMonthsRef.current.delete(key);
    }
  };

  // --- reload calendar availability when room type changes --------------------
  useEffect(() => {
    if (!hotelId || months.length === 0) return;
    const current = months[viewIndex];
    if (current) loadMonth(current.year, current.month);
  }, [roomType, hotelId, viewIndex]);

  // --- lazy load the month when navigating calendar ---------------------------
  useEffect(() => {
    const m = months[viewIndex];
    if (!m) return;
    const needsLoad = (!m.days || m.days.length === 0) && !m.loading;
    if (needsLoad) loadMonth(m.year, m.month);
  }, [viewIndex, months]);

  const monthLabel = (m) => new Date(m.year, m.month, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' });

  const handleDateClick = (isoUTC, available) => {
    if (!available) return;
    // First click: start selection (1 day). Second click: set end and total nights.
    // Third click: start a new selection from the clicked day.
    if (!rangeStart) {
      setRangeStart(isoUTC);
      setRangeEnd(isoUTC);
      setCheckInDate(isoUTC);
      setDays(1);
    } else if (rangeStart && rangeEnd) {
      if (rangeStart === rangeEnd) {
        // Treat as second click: set end and compute total nights
        const start = rangeStart;
        const end = isoUTC < start ? start : isoUTC;
        const newStart = isoUTC < start ? isoUTC : start;
        const startDate = new Date(newStart + 'T00:00:00Z');
        const endDate = new Date(end + 'T00:00:00Z');
        const diffDays = Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1);
        setRangeStart(newStart);
        setRangeEnd(end);
        setCheckInDate(newStart);
        setDays(diffDays);
      } else {
        // Third click: start a fresh selection from clicked day
        setRangeStart(isoUTC);
        setRangeEnd(isoUTC);
        setCheckInDate(isoUTC);
        setDays(1);
      }
    }
    const idx = months.findIndex(m => m.days?.some(d => d.isoUTC === isoUTC));
    if (idx !== -1) setViewIndex(idx);
  };

  const getDayData = (monthObj, isoUTC) => {
    return (monthObj.days || []).find(d => d.isoUTC === isoUTC) || null;
  };

  const hotelImage = hotel?.mainImage ? getImageUrl(hotel.mainImage, placeImg) : placeImg;
  const hotelName = hotel?.name;
  const hotelLocation = hotel?.location;

  if (loading) return (
    <div className="w-full min-h-screen flex items-center justify-center"><Spinner label="Loading booking details..." /></div>
  );

  if (!hotel) return (
    <div className="w-full min-h-screen flex items-center justify-center"><div className="text-xl text-gray-400">Hotel not found.</div></div>
  );

  return (
    <Layout role="user" title="Book a Room" subtitle={`Booking at ${hotelName || 'Hotel'}`}>
      
      <div className="bg-linear-to-b from-white via-blue-50/30 to-white min-h-screen ">
                <div className="max-w-7xl mx-auto px-8 w-full">
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8 pt-10 pb-20">
        {/* Left column - image + calendar */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="rounded-xl overflow-hidden min-h-[220px] bg-gray-100">
            <div className="w-full h-64 bg-cover bg-center" style={{ backgroundImage: `url(${hotelImage})` }} />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-extrabold leading-tight">{hotelName}</h2>
                <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">{hotelLocation}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Starting from</div>
                <div className="text-xl font-bold">{formatINR(pricePerDay)} / night</div>
              </div>
            </div>
            <p className="mt-3 text-gray-700">Pick a check-in date from the calendar below.</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center relative justify-center mb-4">
              <div className="flex items-center  gap-2">
                <button onClick={() => setViewIndex(i => Math.max(0, i - 1))} className="p-2 rounded-full hover:bg-gray-100"><span>◀</span></button>
                <h3 className=" md:text-lg font-bold">{months[viewIndex] ? monthLabel(months[viewIndex]) : 'Loading...'}</h3>
                <button onClick={() => setViewIndex(i => Math.min(Math.max(0, months.length - 1), i + 1))} className="p-2 rounded-full hover:bg-gray-100"><span>▶</span></button>
              </div>
                <div className="hidden sm:flex absolute left-0 items-center gap-3  text-sm text-gray-600">
                 

                 <button type="button" onClick={() => setRoomType('AC')} className={`px-3 py-1 rounded-full    ${roomType==='AC' ? 'bg-blue-50 border-blue-600 text-blue-600' : 'bg-white border-gray-200 text-gray-700 hover:border-blue-600'}`}>AC</button>
                  <button type="button" onClick={() => setRoomType('Non-AC')} className={`px-3 py-1 rounded-full ${roomType==='Non-AC' ? 'bg-blue-50 border-blue-600 text-blue-600' : 'bg-white border-gray-200 text-gray-700 hover:border-blue-600'}`}>Non-AC</button>
              </div>

              <div className="hidden sm:flex absolute right-0 items-center gap-3  text-sm text-gray-600">
                
                <div className="px-3 py-1 rounded-full bg-green-50 border border-green-100">Available</div>
                <div className="px-3 py-1 rounded-full bg-red-50 border border-red-100">Full</div>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-sm mb-2 text-gray-500">
              {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d} className="font-medium">{d}</div>)}
            </div>

            <div>
              {months[viewIndex] ? (
                <div>
                  {months[viewIndex].loading ? (
                    <div className="text-gray-500">Loading month...</div>
                  ) : (
                    <div className="grid grid-cols-7 gap-2">
                      {(() => {
                        const m = months[viewIndex];
                        const first = startOfMonthUTC(m.year, m.month);
                        const pad = new Date(first).getUTCDay();
                        const cells = [];
                        for (let i = 0; i < pad; i++) cells.push(<div key={`pad-${i}`} className="h-10"/>);

                        const daysInMonth = new Date(Date.UTC(m.year, m.month + 1, 0)).getUTCDate();
                        const todayIso = isoFromUTC(new Date());
                        for (let d = 1; d <= daysInMonth; d++) {
                          const dateUTC = new Date(Date.UTC(m.year, m.month, d));
                          const isoUTC = isoFromUTC(dateUTC);

                          const dayData = getDayData(m, isoUTC);
                          const isPast = isoUTC < todayIso;
                          const available = !isPast && (roomType === 'AC' ? (Number(dayData?.availableAc) > 0) : (Number(dayData?.availableNonAc) > 0));
                          const isToday = isoUTC === isoFromUTC(new Date());
                          const inRange = !isPast && (rangeStart && rangeEnd ? (isoUTC >= rangeStart && isoUTC <= rangeEnd) : (isoUTC === rangeStart));

                          const baseClass = `h-10 flex flex-col items-center justify-center text-[12px] rounded-md border transition-all cursor-pointer`;
                          let className = baseClass;
                          if (isPast) {
                            className += ' bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed';
                          } else {
                            const availabilityClass = inRange
                              ? 'border-blue-300 text-blue-800'
                              : (available ? 'border-green-200 text-green-800' : 'border-red-200 text-red-700');
                            const rangeClass = inRange ? 'bg-blue-100' : (available ? 'bg-green-50' : 'bg-red-50');
                            className += ` ${rangeClass} ${availabilityClass}`;
                          }

                          cells.push(
                            <div key={isoUTC} title={`${isoUTC} • AC ${dayData?.availableAc ?? '-'} / Non-AC ${dayData?.availableNonAc ?? '-'}`} onClick={() => { if (!isPast) handleDateClick(isoUTC, available); }} className={className}>
                              <div className={`text-xs md:text-sm ${isToday ? 'font-semibold' : ''}`}>{String(d).padStart(2, '0')}</div>
                              <div className="text-[8px] md:text-[10px] mt-1">{isPast ? '—' : (available ? (roomType === 'AC' ? (dayData?.availableAc ?? '-') : (dayData?.availableNonAc ?? '-')) + ' left' : 'Full')}</div>
                            </div>
                          );
                        }

                        return cells;
                      })()}
                    </div>
                  )}
                </div>
              ) : <div className="text-gray-400">No calendar loaded.</div>}
            </div>
          </div>
        </div>

        {/* Right column - sticky controls */}
        <aside className="lg:col-span-2">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-24">
            <div className="flex flex-col gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Room Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setRoomType('AC')} className={`w-full py-2 px-4 rounded-lg border font-semibold text-sm ${roomType==='AC' ? 'bg-blue-50 border-blue-600 text-blue-600' : 'bg-white border-gray-200 text-gray-700 hover:border-blue-600'}`}>AC</button>
                  <button type="button" onClick={() => setRoomType('Non-AC')} className={`w-full py-2 px-4 rounded-lg border font-semibold text-sm ${roomType==='Non-AC' ? 'bg-blue-50 border-blue-600 text-blue-600' : 'bg-white border-gray-200 text-gray-700 hover:border-blue-600'}`}>Non-AC</button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Number of Days</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setDays(prev => Math.max(1, prev - 1))} className="w-9 h-9 rounded-full border border-gray-300 hover:bg-gray-100">-</button>
                  <div className="w-12 text-center font-semibold">{days}</div>
                  <button onClick={() => setDays(prev => prev + 1)} className="w-9 h-9 rounded-full border border-gray-300 hover:bg-gray-100">+</button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Number of Rooms</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRoomsCount(prev => Math.max(1, prev - 1))}
                    disabled={roomsCount <= 1}
                    className={`w-9 h-9 rounded-full border border-gray-300 ${roomsCount <= 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                    aria-label="Decrease rooms"
                  >-</button>
                  <div className="w-12 text-center font-semibold">{roomsCount}</div>
                  <button
                    onClick={() => setRoomsCount(prev => prev + 1)}
                    disabled={maxAvailableForRange !== null ? roomsCount >= maxAvailableForRange : false}
                    className={`w-9 h-9 rounded-full border border-gray-300 ${maxAvailableForRange !== null && roomsCount >= maxAvailableForRange ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                    aria-label="Increase rooms"
                  >+</button>
                </div>
              </div>

              {/* Check-in Date Selector (modern popover) */}
             <div className="relative">
  <label className="flex flex-col w-full">
    <span className="text-gray-900 text-sm font-medium pb-1.5">
      Check-in Date
    </span>
    <div className="relative flex w-full items-stretch">
      <input
        className="form-input w-full h-11 md:h-12 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm md:text-base text-gray-900 placeholder:text-gray-500 shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/50 cursor-pointer transition"
        placeholder="Select a date"
        value={(() => {
          const dt = new Date(checkInDate + "T00:00:00Z");
          return dt.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          });
        })()}
        readOnly
        onClick={() => setShowCalendar(true)}
        tabIndex={0}
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <span className="material-symbols-outlined text-gray-500 text-xl">
          calendar_today
        </span>
      </div>
    </div>
  </label>

  {/* Calendar Popover */}
  {showCalendar && (
    <div className="absolute z-50 mt-2 right-0 w-[260px] sm:w-[280px] rounded-2xl border border-gray-200 bg-white p-3 shadow-xl animate-fade-in">
      <div className="flex flex-col gap-3">
        {/* Calendar Header */}
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-full hover:bg-gray-100 transition"
            onClick={() => setViewIndex((i) => Math.max(0, i - 1))}
          >
            <span
              className="material-symbols-outlined text-gray-700"
              style={{ fontSize: 20 }}
            >
              chevron_left
            </span>
          </button>
          <p className="flex-1 text-center text-sm font-semibold text-gray-900">
            {months[viewIndex] ? monthLabel(months[viewIndex]) : ""}
          </p>
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-full hover:bg-gray-100 transition"
            onClick={() =>
              setViewIndex((i) =>
                Math.min(Math.max(0, months.length - 1), i + 1)
              )
            }
          >
            <span
              className="material-symbols-outlined text-gray-700"
              style={{ fontSize: 20 }}
            >
              chevron_right
            </span>
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
            <p
              key={d}
              className="flex h-7 items-center justify-center text-[11px] font-semibold text-gray-500"
            >
              {d}
            </p>
          ))}
          {/* Dates */}
          {(() => {
            const m = months[viewIndex];
            if (!m) return null;
            const first = startOfMonthUTC(m.year, m.month);
            const pad = new Date(first).getUTCDay();
            const cells = [];
            for (let i = 0; i < pad; i++)
              cells.push(<div key={`pad-${i}`} className="h-8" />);

            const daysInMonth = new Date(
              Date.UTC(m.year, m.month + 1, 0)
            ).getUTCDate();
            const todayIso = isoFromUTC(new Date());

            for (let d = 1; d <= daysInMonth; d++) {
              const dateUTC = new Date(Date.UTC(m.year, m.month, d));
              const isoUTC = isoFromUTC(dateUTC);
              const dayData = getDayData(m, isoUTC);
              const isPast = isoUTC < todayIso;
              const available =
                !isPast &&
                (roomType === "AC"
                  ? Number(dayData?.availableAc) > 0
                  : Number(dayData?.availableNonAc) > 0);
              const isToday = isoUTC === isoFromUTC(new Date());
              const inRange =
                !isPast &&
                (rangeStart && rangeEnd
                  ? isoUTC >= rangeStart && isoUTC <= rangeEnd
                  : isoUTC === rangeStart);

              let className =
                "flex h-8 w-8 mx-auto items-center justify-center text-xs md:text-sm rounded-full transition ";

              if (isPast) {
                className +=
                  "bg-gray-100 text-gray-400 cursor-not-allowed";
              } else if (inRange) {
                className +=
                  "bg-blue-400 text-white font-semibold shadow-sm";
              } else if (available) {
                className +=
                  "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer";
              } else {
                className +=
                  "bg-red-50 text-red-500 cursor-not-allowed";
              }

              // if (isToday && !inRange && available) {
              //   className += " ring-1 ring-blue/40";
              // }

              cells.push(
                <button
                  key={isoUTC}
                  className={className}
                  onClick={() => {
                    if (!isPast && available) {
                      setRangeStart(isoUTC);
                      setRangeEnd(isoUTC);
                      setCheckInDate(isoUTC);
                      setDays(1);
                      setShowCalendar(false);
                    }
                  }}
                  disabled={isPast || !available}
                  tabIndex={-1}
                >
                  {d}
                </button>
              );
            }
            return cells;
          })()}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-2 pt-3">
        <button
          type="button"
          className="h-9 px-3 rounded-lg bg-gray-100 text-gray-800 text-xs md:text-sm font-medium hover:bg-gray-200 transition"
          onClick={() => {
            setShowCalendar(false);
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )}
</div>


              <hr className="border-gray-200" />

              <div className="space-y-3">
                <div className="flex justify-between text-sm text-gray-600"><span>{formatINR(pricePerDay)} x {days} nights x {roomsCount} rooms</span><span>{formatINR(totalPrice)}</span></div>
                <div className="flex justify-between text-sm text-gray-600"><span>Taxes & Fees</span><span>-</span></div>
                <div className="flex justify-between font-bold text-lg text-gray-900"><span>Total Price</span><span>{formatINR(totalPrice)}</span></div>
              </div>

              {availability && !availability.loading && availability.data && availability.data.available === false ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 text-yellow-800">Unavailable for selected dates</div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-800">{availability && !availability.loading ? 'Available - Few rooms left' : 'Availability unknown'}</div>
              )}

              <div className="flex flex-col gap-3">
                <button className="w-full rounded-lg h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold" onClick={async () => {
                  setError('');
                  if (!hotelId) { setError('Missing hotel information. Please go back and select a hotel again.'); return; }
                  const nights = Number(days);
                  if (!Number.isFinite(nights) || nights < 1) { setError('Please select at least 1 day.'); return; }
                  if (!Number.isFinite(roomsCount) || roomsCount < 1) { setError('Please select at least 1 room.'); return; }
                  if (!checkInDate) { setError('Please choose a check-in date.'); return; }

                  try {
                    setChecking(true);
                    const resp = await hotelService.checkAvailability(hotelId, checkInDate, days, apiRoomType);
                    const payload = resp?.data || resp;
                    if (payload && payload.available === false) {
                      const dates = payload.dates || (payload.date ? [payload.date] : []);
                      if (dates.length > 0) {
                        const formattedDates = dates.map(d => {
                          const dt = new Date(d);
                          const dd = String(dt.getDate()).padStart(2, '0');
                          const mm = String(dt.getMonth() + 1).padStart(2, '0');
                          const yyyy = dt.getFullYear();
                          return `${dd}/${mm}/${yyyy}`;
                        });
                        let formatted;
                        if (formattedDates.length === 1) formatted = formattedDates[0];
                        else if (formattedDates.length === 2) formatted = `${formattedDates[0]} and ${formattedDates[1]}`;
                        else formatted = `${formattedDates.slice(0, -1).join(', ')} and ${formattedDates[formattedDates.length - 1]}`;
                        setError(`Hotel is fully booked for ${formatted}. Please select another day.`);
                        return;
                      }
                      setError('Hotel is not available for the selected stay. Please choose another date.');
                      return;
                    }

                    // Final validation: ensure sufficient rooms available for each day in selected range
                    if (rangeStart && rangeEnd) {
                      const start = new Date(rangeStart + 'T00:00:00Z');
                      const end = new Date(rangeEnd + 'T00:00:00Z');
                      for (let dt = new Date(start); dt <= end; dt = new Date(dt.getTime() + 24*60*60*1000)) {
                        const iso = isoFromUTC(dt);
                        const m = months.find(mm => mm.days?.some(d => d.isoUTC === iso));
                        const dayData = m ? (m.days || []).find(d => d.isoUTC === iso) : null;
                        const availableRooms = roomType === 'AC' ? Number(dayData?.availableAc || 0) : Number(dayData?.availableNonAc || 0);
                        if (availableRooms < roomsCount) {
                          setError(`Only ${availableRooms} rooms available on ${iso}. Please reduce rooms or change dates.`);
                          return;
                        }
                      }
                    }

                    navigate('/payment', { state: { days, checkInDate, totalPrice, hotelId, hotelName, hotelLocation, roomType, roomsCount } });
                  } catch (err) {
                    console.error('Availability check failed', err);
                    setError(err.response?.data?.message || 'Availability check failed. Please try again.');
                  } finally { setChecking(false); }
                }} disabled={(() => {
                  if (checking) return true;
                  if (rangeStart && rangeEnd) {
                    const start = new Date(rangeStart + 'T00:00:00Z');
                    const end = new Date(rangeEnd + 'T00:00:00Z');
                    for (let dt = new Date(start); dt <= end; dt = new Date(dt.getTime() + 24*60*60*1000)) {
                      const iso = isoFromUTC(dt);
                      const m = months.find(mm => mm.days?.some(d => d.isoUTC === iso));
                      const dayData = m ? (m.days || []).find(d => d.isoUTC === iso) : null;
                      const availableRooms = roomType === 'AC' ? Number(dayData?.availableAc || 0) : Number(dayData?.availableNonAc || 0);
                      if (availableRooms < roomsCount) return true;
                    }
                  }
                  if (availability && !availability.loading && availability.data && availability.data.available === false) return true;
                  return false;
                })()} aria-busy={checking}>{checking ? 'Checking...' : 'Book Now'}</button>

                <button className="w-full rounded-lg h-12 bg-white border border-gray-300" onClick={() => hotelId ? navigate(`/hoteldetails?id=${hotelId}`) : navigate('/home')}>Cancel</button>
              </div>

              {error && <div className="text-red-600 mt-2 bg-red-50 p-3 rounded-md border border-red-100">{error}</div>}

              {rangeStart && rangeEnd && (() => {
                const start = new Date(rangeStart + 'T00:00:00Z');
                const end = new Date(rangeEnd + 'T00:00:00Z');
                for (let dt = new Date(start); dt <= end; dt = new Date(dt.getTime() + 24*60*60*1000)) {
                  const iso = isoFromUTC(dt);
                  const m = months.find(mm => mm.days?.some(d => d.isoUTC === iso));
                  const dayData = m ? (m.days || []).find(d => d.isoUTC === iso) : null;
                  const availableRooms = roomType === 'AC' ? Number(dayData?.availableAc || 0) : Number(dayData?.availableNonAc || 0);
                  if (availableRooms < roomsCount) {
                    return <div className="text-yellow-800 mt-2 bg-yellow-50 p-3 rounded-xl border border-yellow-200">Only {availableRooms} rooms available on ({iso}).</div>;
                  }
                }
                return null;
              })()}

            </div>
          </div>
        </aside>
      </main>
      </div>
      </div>

      {checking && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center z-50">
          <div className="bg-white px-5 py-3 rounded-xl shadow-lg border border-gray-100 text-[#1a237e] font-medium"><Spinner label="Checking availability..." /></div>
        </div>
      )}
   </Layout>
  );
};

export default Booking;
