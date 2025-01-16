export const authorizeAdmin = (req, res, next) => {
  try {
    const { access_level } = req.user; // Ambil access_level dari payload user

    if (access_level !== 'administrator') {
      return res.status(403).json({ error: 'Access denied. Administrator only.' });
    }

    next(); // Lanjut ke handler jika access_level administrator
  } catch (error) {
    res.status(500).json({ error: 'Authorization failed.' });
  }
};
