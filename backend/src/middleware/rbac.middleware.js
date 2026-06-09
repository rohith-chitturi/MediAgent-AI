/**
 * Role-Based Access Control middleware using fine-grained permissions.
 * Usage: requirePermission('PATIENT_VIEW_QUEUE', 'PATIENT_VIEW_OWN')
 */
const requirePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    // Super Admin bypasses all permission checks
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    const userPermissions = req.user.permissions || [];
    
    const hasPermission = requiredPermissions.some(perm => userPermissions.includes(perm));

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Missing required permission. Need one of: ${requiredPermissions.join(', ')}.`,
      });
    }

    next();
  };
};

/**
 * Ensures the requesting user belongs to the hospital they are accessing.
 * Super Admins bypass this check.
 */
const scopeToHospital = (req, res, next) => {
  if (req.user.role === 'SUPER_ADMIN') return next();

  const requestedHospitalId =
    req.params.hospitalId || req.body.hospitalId || req.query.hospitalId;

  if (requestedHospitalId && requestedHospitalId !== req.user.hospitalId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You do not belong to this hospital.',
    });
  }

  // Inject hospitalId from token for downstream use
  req.hospitalId = req.user.hospitalId;
  next();
};

/**
 * Ensures a doctor can only access resources associated with their own doctorId.
 * Super Admins and Hospital Admins bypass this check.
 */
const scopeToDoctor = (req, res, next) => {
  if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'HOSPITAL_ADMIN') {
    return next();
  }

  const requestedDoctorId = req.params.doctorId || req.body.doctorId || req.query.doctorId;
  
  if (requestedDoctorId && req.user.doctor && requestedDoctorId !== req.user.doctor.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own records.',
    });
  }

  next();
};

module.exports = { requirePermission, scopeToHospital, scopeToDoctor };
