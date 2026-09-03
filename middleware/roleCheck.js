exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

exports.isCitizen = (req, res, next) => {
  if (req.user.role !== 'citizen') {
    return res.status(403).json({ success: false, message: 'Citizen access required' });
  }
  next();
};

exports.isUniversityRep = (req, res, next) => {
  if (req.user.role !== 'university_rep' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'University representative access required' });
  }
  next();
};

exports.isIndustryRep = (req, res, next) => {
  if (req.user.role !== 'industry_rep' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Industry representative access required' });
  }
  next();
};
