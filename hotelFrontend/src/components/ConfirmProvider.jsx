import React, { useCallback, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { registerAskConfirm } from '../utils/confirm';
import { showToast } from '../utils/toast';

export default function ConfirmProvider({ children }){
  const [current, setCurrent] = useState(null);

  useEffect(()=>{
    registerAskConfirm(({ message, title }) => new Promise((resolve) => {
      setCurrent({ id: Date.now() + Math.random(), message, title, resolve });
    }));
  }, []);

  const respond = useCallback((ok) => {
    if (!current) return;
    try { current.resolve(ok); } catch(e){ console.warn(e); }
    setCurrent(null);
  }, [current]);

  return (
    <>
      {children}
      {createPortal(
        current ? (
          <div style={{position:'fixed', left:0, top:0, right:0, bottom:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:'rgba(0,0,0,0.5)'}} className="backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all duration-300 animate-scale-in border border-gray-100">
              <div className="text-xl font-bold mb-3 text-gray-800">{current.title}</div>
              <div className="text-sm text-gray-600 mb-6 leading-relaxed">{current.message}</div>
              <div className="flex justify-end gap-3">
                <button className="px-5 py-2.5 rounded-xl border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 transform hover:scale-105" onClick={()=>respond(false)}>Cancel</button>
                <button className="px-5 py-2.5 rounded-xl bg-linear-to-r from-red-500 to-red-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105" onClick={()=>respond(true)}>Confirm</button>
              </div>
            </div>
          </div>
        ) : null,
        document.body
      )}
    </>
  );
}
