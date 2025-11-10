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
          <div style={{position:'fixed', left:0, top:0, right:0, bottom:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:'rgba(0,0,0,0.4)'}}>
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
              <div className="text-lg font-semibold mb-2">{current.title}</div>
              <div className="text-sm text-gray-700 mb-4">{current.message}</div>
              <div className="flex justify-end gap-2">
                <button className="px-4 py-2 rounded border" onClick={()=>respond(false)}>Cancel</button>
                <button className="px-4 py-2 rounded bg-red-600 text-white" onClick={()=>respond(true)}>OK</button>
              </div>
            </div>
          </div>
        ) : null,
        document.body
      )}
    </>
  );
}
