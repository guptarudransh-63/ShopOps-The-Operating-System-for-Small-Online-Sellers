const { ROLES } = require('../config/constants');

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.membership) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'No business membership found.' },
      });
    }

    if (!allowedRoles.includes(req.membership.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Access denied. Requires one of: ${allowedRoles.join(', ')}`,
        },
      });
    }

    next();
  };
};

const requireOwner = requireRole(ROLES.OWNER);
const requireStaffOrOwner = requireRole(ROLES.OWNER, ROLES.STAFF);

module.exports = {
  requireRole,
  requireOwner,
  requireStaffOrOwner,
};
