/**
 * Role-Based Access Control middleware factory.
 * Usage: authorize('HOSPITAL_ADMIN', 'SUPER_ADMIN')
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}.`,
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

module.exports = { authorize, scopeToHospital };
