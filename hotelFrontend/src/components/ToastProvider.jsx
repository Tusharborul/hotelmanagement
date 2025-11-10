import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { registerAddToast } from '../utils/toast';

function Toast({ t, onRemove }) {
  const { id, message, type } = t;
  useEffect(()=>{
    const timer = setTimeout(()=> onRemove(id), t.duration || 4000);
    return ()=>clearTimeout(timer);
  }, [id, onRemove, t.duration]);
  const bg = type === 'error' ? 'bg-red-600' : type === 'success' ? 'bg-green-600' : type === 'warning' ? 'bg-yellow-600' : 'bg-gray-800';
  return (
    <div className={`text-white text-sm px-3 py-2 rounded shadow ${bg} max-w-xs wrap-break-word`}>{message}</div>
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
