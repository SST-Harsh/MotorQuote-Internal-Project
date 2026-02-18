export const logAuditEntry = (action, userObj, details, severity = 'Info', category = 'System') => {
  try {
    if (typeof window === 'undefined') return;

    const storedLogs = JSON.parse(localStorage.getItem('audit_logs') || '[]');

    const newLog = {
      id: `LOG-${Date.now()}`,
      action: action,
      user: userObj?.name || userObj?.email || 'Unknown',
      role: userObj?.role ? userObj.role.charAt(0).toUpperCase() + userObj.role.slice(1) : 'N/A',
      category: category,
      severity: severity,
      details: details,
      timestamp: new Date().toLocaleString(),
    };

    const updatedLogs = [newLog, ...storedLogs].slice(0, 100);
    localStorage.setItem('audit_logs', JSON.stringify(updatedLogs));
  } catch (e) {
    console.error('Audit Log Error:', e);
  }
};
