module.exports.handleLogout = (req, res) => {
    
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Failed to log out. Please try again.');
        }
        res.redirect('/'); 
    });
};
