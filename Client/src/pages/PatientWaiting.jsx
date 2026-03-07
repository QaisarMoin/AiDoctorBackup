import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

// Status config — no underscore, matches DB ENUM exactly
const STATUS_CONFIG = {
  'in': {
    label: 'In Queue',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    dot: 'bg-gray-400',
    desc: 'Waiting to be seen',
    pulse: false,
  },
  'in progress': {
    label: 'With Doctor',
    color: 'bg-green-100 text-green-700 border-green-300',
    dot: 'bg-green-500',
    desc: 'Currently with doctor',
    pulse: true,
  },
  'hold': {
    label: 'On Hold',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    dot: 'bg-yellow-500',
    desc: 'Temporarily on hold',
    pulse: false,
  },
  'completed': {
    label: 'Done',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    dot: 'bg-blue-500',
    desc: 'Visit completed',
    pulse: false,
  },
  'cancelled': {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-600 border-red-300',
    dot: 'bg-red-400',
    desc: 'Visit cancelled',
    pulse: false,
  },
};

const ACTIVE_STATUSES = ['in', 'in progress', 'hold'];

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['in'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${cfg.color}`}>
      <span className={`w-2 h-2 rounded-full ${cfg.dot} ${cfg.pulse ? 'animate-pulse' : ''}`} />
      {cfg.label}
    </span>
  );
}

// Single memoized patient row
const QueueRow = React.memo(function QueueRow({ patient, isCurrentUser, position }) {
  const isActive = ACTIVE_STATUSES.includes(patient.status);
  // Show real name only for current user; others see "Patient-N" for privacy
  const displayName = isCurrentUser ? `${patient.name} (You)` : `Patient-${position}`;
  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300
      ${isCurrentUser
        ? 'border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md ring-2 ring-blue-300'
        : 'border-gray-100 bg-white hover:bg-gray-50'}
      ${!isActive ? 'opacity-60' : ''}`}>

      {/* Position badge */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
        ${isCurrentUser ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
        {position}
      </div>

      {/* Name + doctor */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-semibold truncate ${isCurrentUser ? 'text-blue-800' : 'text-gray-800'}`}>
            {displayName}
          </span>
          {isCurrentUser && (
            <span className="flex-shrink-0 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">You</span>
          )}
        </div>
        {isCurrentUser && patient.doctor_name && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            🩺 {patient.doctor_name}
          </p>
        )}
      </div>

      {/* Status badge */}
      <div className="flex-shrink-0">
        <StatusBadge status={patient.status} />
      </div>
    </div>
  );
}, (prev, next) =>
  prev.patient.status === next.patient.status &&
  prev.isCurrentUser === next.isCurrentUser &&
  prev.position === next.position
);

export default function PatientWaiting() {
  const [step, setStep] = useState('verify'); // 'verify' | 'queue' | 'denied'
  const [phone, setPhone] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [myInfo, setMyInfo] = useState(null);  // { patient_id, patient_name, clinic_id, doctor_id, queue_position, status }
  const [queue, setQueue] = useState([]);
  const [lastFetch, setLastFetch] = useState(null);
  const [countdown, setCountdown] = useState(10);
  const intervalRef = useRef(null);
  const prevQueueRef = useRef('');

  // Verify patient phone
  const handleVerify = async (e) => {
    e.preventDefault();
    setVerifyError('');
    if (!phone.trim()) { setVerifyError('Please enter your mobile number'); return; }
    setVerifying(true);
    try {
      const { data } = await axios.post(`${API_BASE}/api/queue/verify`, { phone: phone.trim() });
      if (data.success) {
        setMyInfo({
          patient_id:     data.data.patient_id,
          patient_name:   data.data.patient_name,
          clinic_id:      data.data.clinic_id,
          doctor_id:      data.data.doctor_id,      // ← now stored
          queue_position: data.data.queue_position,
          status:         data.data.status,
          doctor_name:    data.data.doctor_name,
        });
        setStep('queue');
      } else {
        setStep('denied');
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setStep('denied');
      } else {
        setVerifyError('Network error. Please try again.');
      }
    } finally {
      setVerifying(false);
    }
  };

  // Fetch queue from server — filtered by clinic + doctor
  const fetchQueue = useCallback(async (clinicId, doctorId) => {
    try {
      const params = doctorId ? `?doctor_id=${doctorId}` : '';
      const { data } = await axios.get(`${API_BASE}/api/queue/${clinicId}${params}`);
      if (data.success) {
        const newJson = JSON.stringify(data.data.queue);
        if (newJson !== prevQueueRef.current) {
          prevQueueRef.current = newJson;
          setQueue(data.data.queue);
        }
        setLastFetch(new Date());
      }
    } catch (err) {
      console.error('Queue fetch error:', err);
    }
  }, []);

  // Start polling once in queue step
  useEffect(() => {
    if (step !== 'queue' || !myInfo?.clinic_id) return;

    fetchQueue(myInfo.clinic_id, myInfo.doctor_id);

    intervalRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          fetchQueue(myInfo.clinic_id, myInfo.doctor_id);
          return 10;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [step, myInfo, fetchQueue]);

  // Memoize active + completed/cancelled split for rendering
  const { activeQueue, doneQueue, myPosition, waitingAhead } = useMemo(() => {
    const active = queue.filter(p => ACTIVE_STATUSES.includes(p.status));
    const done = queue.filter(p => !ACTIVE_STATUSES.includes(p.status));
    let myPos = null;
    let ahead = 0;

    active.forEach((p, idx) => {
      if (String(p.id) === String(myInfo?.patient_id)) {
        myPos = idx + 1;
      } else if (myPos === null) {
        ahead++;
      }
    });

    // Only show patients up to and including current user — hide those below
    const visibleActive = myPos !== null ? active.slice(0, myPos) : active;

    return { activeQueue: visibleActive, doneQueue: done, myPosition: myPos, waitingAhead: ahead };
  }, [queue, myInfo?.patient_id]);

  const myStatus = queue.find(p => String(p.id) === String(myInfo?.patient_id))?.status || myInfo?.status;
  const estimatedMinutes = waitingAhead * 5;

  /* ── RENDER ── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 flex flex-col items-center justify-start px-4 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 bg-opacity-20 rounded-2xl mb-4 border border-blue-400 border-opacity-30">
          <span className="text-3xl">🏥</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Patient Waiting Room</h1>
        <p className="text-blue-200 mt-2 text-sm">Check your position in the queue</p>
      </div>

      {/* STEP 1: Verify */}
      {step === 'verify' && (
        <div className="w-full max-w-md bg-white bg-opacity-10 backdrop-blur-md rounded-3xl border border-white border-opacity-20 p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-1">Enter your mobile number</h2>
          <p className="text-blue-200 text-sm mb-6">We'll check if you're registered for today's visit</p>
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <input
                type="tel"
                value={phone}
                onChange={e => { setPhone(e.target.value); setVerifyError(''); }}
                placeholder="e.g. 9876543210"
                className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-30 rounded-xl text-white placeholder-blue-300 text-lg tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                maxLength={15}
                autoFocus
              />
              {verifyError && <p className="text-red-300 text-xs mt-2">⚠️ {verifyError}</p>}
            </div>
            <button
              type="submit"
              disabled={verifying}
              className="w-full py-3 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white font-semibold rounded-xl transition-all active:scale-95 shadow-lg"
            >
              {verifying ? '⏳ Checking...' : 'Check My Queue Status →'}
            </button>
          </form>
        </div>
      )}

      {/* STEP 2: Access Denied */}
      {step === 'denied' && (
        <div className="w-full max-w-md bg-red-900 bg-opacity-40 backdrop-blur-md rounded-3xl border border-red-400 border-opacity-30 p-8 shadow-2xl text-center">
          <div className="text-5xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-red-200 mb-2">Access Denied</h2>
          <p className="text-red-300 text-sm mb-6">
            No appointment found for <span className="font-mono font-bold">{phone}</span> today.<br />
            Please check your number or contact the reception.
          </p>
          <button
            onClick={() => { setStep('verify'); setPhone(''); }}
            className="px-6 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-xl transition font-medium"
          >
            ← Try Again
          </button>
        </div>
      )}

      {/* STEP 3: Live Queue */}
      {step === 'queue' && (
        <div className="w-full max-w-2xl space-y-4">
          {/* My Status Card */}
          <div className={`rounded-3xl p-6 border shadow-xl
            ${myStatus === 'in progress'
              ? 'bg-gradient-to-r from-green-800 to-emerald-700 border-green-500'
              : myStatus === 'completed'
              ? 'bg-gradient-to-r from-blue-800 to-indigo-700 border-blue-400'
              : myStatus === 'cancelled'
              ? 'bg-gradient-to-r from-red-900 to-rose-800 border-red-500'
              : myStatus === 'hold'
              ? 'bg-gradient-to-r from-yellow-800 to-amber-700 border-yellow-500'
              : 'bg-gradient-to-r from-slate-800 to-slate-700 border-slate-500'}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-white text-opacity-70 text-xs uppercase tracking-widest mb-1">Hello,</p>
                <h2 className="text-2xl font-bold text-white">{myInfo?.patient_name}</h2>
                <div className="mt-2">
                  <StatusBadge status={myStatus || 'in'} />
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                {myPosition && (
                  <>
                    <p className="text-white text-opacity-60 text-xs uppercase tracking-widest">Your position</p>
                    <p className="text-5xl font-black text-white">#{myPosition}</p>
                  </>
                )}
                {myStatus === 'completed' && <p className="text-4xl mt-1">✅</p>}
                {myStatus === 'cancelled' && <p className="text-4xl mt-1">❌</p>}
              </div>
            </div>

            {/* Estimated wait */}
            {ACTIVE_STATUSES.includes(myStatus) && myStatus !== 'in progress' && waitingAhead > 0 && (
              <div className="mt-4 pt-4 border-t border-white border-opacity-20">
                <p className="text-white text-opacity-80 text-sm">
                  ⏱ Estimated wait: <span className="font-bold">~{estimatedMinutes} min</span>
                  <span className="ml-2 text-white text-opacity-50">({waitingAhead} patient{waitingAhead !== 1 ? 's' : ''} ahead)</span>
                </p>
              </div>
            )}
            {myStatus === 'in progress' && (
              <div className="mt-4 pt-4 border-t border-white border-opacity-20">
                <p className="text-white text-sm font-medium animate-pulse">🟢 You are currently with the doctor!</p>
              </div>
            )}
          </div>

          {/* Refresh info */}
          <div className="flex items-center justify-between px-1">
            <p className="text-blue-300 text-xs">
              {lastFetch ? `Last updated: ${lastFetch.toLocaleTimeString()}` : 'Loading...'}
            </p>
            <p className="text-blue-300 text-xs">
              🔄 Refreshing in <span className="font-bold text-white">{countdown}s</span>
            </p>
          </div>

          {/* Active queue list */}
          {activeQueue.length > 0 && (
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-3xl border border-white border-opacity-15 p-6 shadow-xl">
              <h3 className="text-white font-semibold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Today's Active Queue ({activeQueue.length})
              </h3>
              <div className="space-y-2">
                {activeQueue.map((p, idx) => (
                  <QueueRow
                    key={p.id}
                    patient={p}
                    position={idx + 1}
                    isCurrentUser={String(p.id) === String(myInfo?.patient_id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Done list (collapsed) */}
          {doneQueue.length > 0 && (
            <details className="bg-white bg-opacity-5 rounded-2xl border border-white border-opacity-10 p-4">
              <summary className="text-blue-300 text-sm cursor-pointer select-none font-medium">
                Completed / Cancelled ({doneQueue.length})
              </summary>
              <div className="space-y-2 mt-3">
                {doneQueue.map((p, idx) => (
                  <QueueRow
                    key={p.id}
                    patient={p}
                    position={idx + 1}
                    isCurrentUser={String(p.id) === String(myInfo?.patient_id)}
                  />
                ))}
              </div>
            </details>
          )}

          {/* Back */}
          <button
            onClick={() => { setStep('verify'); setPhone(''); setQueue([]); clearInterval(intervalRef.current); }}
            className="text-blue-300 hover:text-white text-sm transition mx-auto block mt-2"
          >
            ← Use a different number
          </button>
        </div>
      )}
    </div>
  );
}
