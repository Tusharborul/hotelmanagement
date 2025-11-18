import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { registerAddToast } from '../utils/toast';

function Toast({ t, onRemove }) {
  const { id, message, type } = t;
  useEffect(()=>{
    const timer = setTimeout(()=> onRemove(id), t.duration || 4000);
    return ()=>clearTimeout(timer);
  }, [id, onRemove, t.duration]);
  const bg = type === 'error' ? 'bg-linear-to-r from-red-500 to-red-600' : type === 'success' ? 'bg-linear-to-r from-green-500 to-green-600' : type === 'warning' ? 'bg-linear-to-r from-yellow-500 to-yellow-600' : 'bg-linear-to-r from-gray-700 to-gray-800';
  return (
    <div className={`text-white text-sm px-5 py-3 rounded-xl shadow-lg hover:shadow-2xl ${bg} max-w-sm wrap-break-word transform transition-all duration-300 hover:scale-105 cursor-pointer animate-slide-in-right`}>
      <div className="flex items-center gap-2">
        {type === 'success' && <span className="text-xl">✓</span>}
        {type === 'error' && <span className="text-xl">✕</span>}
        {type === 'warning' && <span className="text-xl">⚠</span>}
        <span>{message}</span>
      </div>
    </div>
  );
}

export default function ToastProvider({ children }){
  const [toasts, setToasts] = useState([]);

  useEffect(()=>{
    registerAddToast((t)=>{
      setToasts(prev => [...prev, t]);
    });
  }, []);

  const remove = (id) => setToasts(prev => prev.filter(t=>t.id !== id));

  return (
    <>
      {children}
      {createPortal(
        <div style={{position:'fixed', right:16, bottom:16, zIndex:9999, display:'flex', flexDirection:'column', gap:8}}>
          {toasts.map(t => (
            <div key={t.id} onClick={()=>remove(t.id)}>
              <Toast t={t} onRemove={remove} />
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}
