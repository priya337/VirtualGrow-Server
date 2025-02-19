export const deleteUserProfile = async (req, res) => {
    try {
      // Access the authenticated user via req.user (populated by protect middleware)
      const userId = req.user.id;
      
      // Perform the deletion logic (e.g., remove user from database)
      await User.findByIdAndDelete(userId); // Assuming you're using Mongoose
  
      res.status(200).json({ message: 'Profile deleted successfully' });
    } catch (error) {
      console.error('Error deleting profile:', error);
      res.status(500).json({ message: 'Server error deleting profile' });
    }
  };
  