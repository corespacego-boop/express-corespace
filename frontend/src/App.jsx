import React, { useState, useEffect } from 'react';
import './index.css';

const API_BASE = import.meta.env.VITE_API_BASE || "https://express-corespace.getvoroa.com";

export default function App() {
  const [captchaImage, setCaptchaImage] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);
  const [loadingStep, setLoadingStep] = useState(false);

  // Form States
  const [netId, setNetId] = useState('');
  const [portalPassword, setPortalPassword] = useState('');
  const [captchaText, setCaptchaText] = useState('');
  const [academiaPassword, setAcademiaPassword] = useState('');

  // Flow Control States
  const [step, setStep] = useState(1); // 1: Login, 3: Dashboard
  const [errorMsg, setErrorMsg] = useState('');
  const [isAcadAvailable, setIsAcadAvailable] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [showAcadModal, setShowAcadModal] = useState(false);

  const fetchCaptcha = async () => {
    setLoadingCaptcha(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/captcha`);
      const data = await res.json();
      if (data.success && data.captcha_image) {
        setCaptchaImage(data.captcha_image);
        setSessionId(data.session_id);
      } else {
        setErrorMsg("Failed to load captcha from server.");
      }
    } catch (err) {
      setErrorMsg("Network error connecting to Corespace API.");
    } finally {
      setLoadingCaptcha(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  // Login & Fetch Data
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!netId || !portalPassword || !captchaText) {
      setErrorMsg("Please fill in Register No, Password, and Captcha.");
      return;
    }

    setLoadingStep(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE}/api/fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portal_netid: netId,
          portal_password: portalPassword,
          portal_captcha: captchaText,
          session_id: sessionId,
          academia_password: academiaPassword || undefined
        })
      });

      const data = await res.json();

      if (res.status === 200 && data.success) {
        setStudentData(data);
        setIsAcadAvailable(data.is_academia_available ?? true);
        setStep(3); // Directly go to Dashboard!
      } else {
        let rawDetail = data.detail;
        let displayError = "Portal login failed. Check credentials and captcha.";
        if (typeof rawDetail === 'object' && rawDetail !== null) {
          displayError = rawDetail.message || rawDetail.reason || displayError;
        } else if (typeof rawDetail === 'string') {
          displayError = rawDetail;
        }
        setErrorMsg(displayError);
        fetchCaptcha();
      }
    } catch (err) {
      setErrorMsg("Error communicating with Corespace API server.");
      fetchCaptcha();
    } finally {
      setLoadingStep(false);
    }
  };

  // Enrich with Academia
  const handleAcademiaEnrich = async (e) => {
    e.preventDefault();
    if (!academiaPassword) return;

    setLoadingStep(true);
    try {
      const res = await fetch(`${API_BASE}/api/fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portal_netid: netId,
          portal_password: portalPassword,
          portal_captcha: captchaText,
          session_id: sessionId,
          academia_password: academiaPassword
        })
      });
      const data = await res.json();
      if (res.status === 200 && data.success) {
        setStudentData(data);
        setShowAcadModal(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStep(false);
    }
  };

  const handleLogout = () => {
    setStudentData(null);
    setNetId('');
    setPortalPassword('');
    setAcademiaPassword('');
    setCaptchaText('');
    setStep(1);
    fetchCaptcha();
  };

  return (
    <>
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>

      <div className="container">
        <header>
          <div className="brand">
            <div className="brand-icon">C</div>
            <div className="brand-title">Corespace App</div>
          </div>
          <div className="server-status">
            <div className="status-dot"></div>
            <span>Connected to Live API</span>
          </div>
        </header>

        {/* LOGIN FORM */}
        {step === 1 && (
          <div className="auth-card">
            <h1 className="auth-title">Student Portal Login</h1>
            <p className="auth-subtitle">Fetch Attendance, Marks, Timetable & Profile</p>

            {errorMsg && <div className="alert-error">{errorMsg}</div>}

            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label>Register No / Portal NetID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. RA2111003010xxx"
                  value={netId}
                  onChange={(e) => setNetId(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Portal Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter portal password"
                  value={portalPassword}
                  onChange={(e) => setPortalPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Academia Password (Optional)</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter Academia password (if applicable)"
                  value={academiaPassword}
                  onChange={(e) => setAcademiaPassword(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Captcha</label>
                <div className="captcha-container">
                  {captchaImage ? (
                    <img src={captchaImage} alt="Captcha" className="captcha-img" />
                  ) : (
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {loadingCaptcha ? 'Loading captcha...' : 'No captcha'}
                    </span>
                  )}
                  <button
                    type="button"
                    className="refresh-btn"
                    onClick={fetchCaptcha}
                    disabled={loadingCaptcha}
                  >
                    🔄 Refresh
                  </button>
                </div>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter captcha characters"
                  value={captchaText}
                  onChange={(e) => setCaptchaText(e.target.value)}
                  required
                  autoComplete="off"
                />
              </div>

              <button type="submit" className="btn-submit" disabled={loadingStep}>
                {loadingStep ? <div className="spinner"></div> : "Login & Fetch All Data ➔"}
              </button>
            </form>
          </div>
        )}

        {/* DASHBOARD VIEW */}
        {step === 3 && studentData && (
          <div className="dashboard">
            <div className="nav-tabs">
              <button
                className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                👤 Profile
              </button>
              <button
                className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
                onClick={() => setActiveTab('attendance')}
              >
                📊 Attendance
              </button>
              <button
                className={`tab-btn ${activeTab === 'timetable' ? 'active' : ''}`}
                onClick={() => setActiveTab('timetable')}
              >
                📅 Timetable
              </button>
              <button
                className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
                onClick={() => setActiveTab('courses')}
              >
                📚 Enrolled Courses
              </button>
              <button
                className={`tab-btn ${activeTab === 'marks' ? 'active' : ''}`}
                onClick={() => setActiveTab('marks')}
              >
                📝 Internal Marks
              </button>
              <button className="tab-btn" onClick={handleLogout}>
                🚪 Logout
              </button>
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="card">
                <div className="profile-header">
                  <div className="avatar">
                    {(studentData.profile?.name || "S")[0].toUpperCase()}
                  </div>
                  <div className="profile-info">
                    <h2>{studentData.profile?.name || "Student"}</h2>
                    <p>{studentData.profile?.regNo || "Unknown Reg No"}</p>
                  </div>
                </div>
                <div className="info-grid">
                  <div className="info-item">
                    <div className="label">Register No</div>
                    <div className="value">{studentData.profile?.regNo || 'N/A'}</div>
                  </div>
                  <div className="info-item">
                    <div className="label">Department</div>
                    <div className="value">{studentData.profile?.dept || 'N/A'}</div>
                  </div>
                  <div className="info-item">
                    <div className="label">Batch</div>
                    <div className="value">{studentData.profile?.batch || 'N/A'}</div>
                  </div>
                  <div className="info-item">
                    <div className="label">Semester</div>
                    <div className="value">{studentData.profile?.semester || 'N/A'}</div>
                  </div>
                  <div className="info-item">
                    <div className="label">Section</div>
                    <div className="value">{studentData.profile?.section || 'N/A'}</div>
                  </div>
                  <div className="info-item">
                    <div className="label">Program</div>
                    <div className="value">{studentData.profile?.program || 'N/A'}</div>
                  </div>
                  <div className="info-item">
                    <div className="label">Mobile</div>
                    <div className="value">{studentData.profile?.mobile || 'N/A'}</div>
                  </div>
                  <div className="info-item">
                    <div className="label">Email</div>
                    <div className="value">{studentData.profile?.email || 'N/A'}</div>
                  </div>
                  <div className="info-item">
                    <div className="label">Advisor / Counselor</div>
                    <div className="value">{studentData.profile?.advisor || 'N/A'}</div>
                  </div>
                  <div className="info-item">
                    <div className="label">Blood Group</div>
                    <div className="value">{studentData.profile?.bloodGroup || 'N/A'}</div>
                  </div>
                  <div className="info-item">
                    <div className="label">Date of Birth</div>
                    <div className="value">{studentData.profile?.dob || 'N/A'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Attendance Tab */}
            {activeTab === 'attendance' && (
              <div className="attendance-grid">
                {(studentData.attendance || []).map((item, idx) => {
                  const pct = item.percent || 0;
                  const statusClass = pct >= 75 ? 'good' : pct >= 65 ? 'warning' : 'danger';
                  return (
                    <div className="att-card" key={idx}>
                      <div className="att-header">
                        <span className="att-code">{item.code}</span>
                        <span className={`att-percent ${statusClass}`}>{pct}%</span>
                      </div>
                      <div className="att-title">{item.title}</div>
                      <div className="progress-bar-bg">
                        <div
                          className={`progress-bar-fill ${statusClass}`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        ></div>
                      </div>
                      <div className="att-stats">
                        <span>Present: {item.present}</span>
                        <span>Conducted: {item.conducted}</span>
                        <span>Absent: {item.absent}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Timetable Tab */}
            {activeTab === 'timetable' && (
              <div className="card">
                {Object.keys(studentData.timetable?.portal || {}).length === 0 &&
                Object.keys(studentData.timetable?.academia || {}).length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No timetable data found.</p>
                ) : (
                  <div>
                    {/* Render Portal Timetable */}
                    {Object.keys(studentData.timetable?.portal || {}).length > 0 && (
                      <div style={{ marginBottom: '32px' }}>
                        <h2 style={{ marginBottom: '16px', color: 'var(--accent-purple)' }}>Portal Timetable</h2>
                        {Object.entries(studentData.timetable.portal).map(([day, slots], idx) => (
                          <div key={idx} style={{ marginBottom: '20px' }}>
                            <h3 style={{ marginBottom: '10px', color: 'var(--accent-cyan)' }}>{day}</h3>
                            <div className="info-grid">
                              {Object.entries(slots).map(([time, details], sIdx) => (
                                <div className="info-item" key={sIdx}>
                                  <div className="label">{time}</div>
                                  <div className="value">{details.name || details.code}</div>
                                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    📍 {details.room} | 👨‍🏫 {details.faculty}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Render Academia Master Timetable Grid */}
                    {Object.keys(studentData.timetable?.academia || {}).length > 0 && (
                      <div>
                        <h2 style={{ marginBottom: '16px', color: 'var(--accent-pink)' }}>Academia Master Timetable Grid</h2>
                        {Object.entries(studentData.timetable.academia).map(([day, slots], idx) => (
                          <div key={idx} style={{ marginBottom: '20px' }}>
                            <h3 style={{ marginBottom: '10px', color: 'var(--accent-pink)' }}>{day}</h3>
                            <div className="info-grid">
                              {Object.entries(slots).map(([time, details], sIdx) => (
                                <div className="info-item" key={sIdx}>
                                  <div className="label">{time}</div>
                                  <div className="value">{details.code || details.name}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Courses Tab */}
            {activeTab === 'courses' && (
              <div className="card">
                <h2 style={{ marginBottom: '16px', color: 'var(--accent-cyan)' }}>Enrolled Courses</h2>
                {Object.keys(studentData.courses || {}).length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No enrolled course details available.</p>
                ) : (
                  <div className="info-grid">
                    {Object.entries(studentData.courses).map(([code, details], idx) => (
                      <div className="info-item" key={idx}>
                        <div className="label">{code} ({details.type || 'Theory'})</div>
                        <div className="value">{details.name || details.title}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
                          👨‍🏫 {details.faculty}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          📍 Room: {details.room} | Slot: {details.slot}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Marks Tab */}
            {activeTab === 'marks' && (
              <div className="card">
                {(studentData.marks || []).length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No internal marks available.</p>
                ) : (
                  <div className="info-grid">
                    {studentData.marks.map((m, idx) => (
                      <div className="info-item" key={idx}>
                        <div className="label">{m.courseCode}</div>
                        <div className="value">{m.title}</div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--accent-cyan)', marginTop: '6px' }}>
                          Score: {m.performance}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
