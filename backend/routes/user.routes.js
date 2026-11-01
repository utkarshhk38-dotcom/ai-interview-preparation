import express from 'express';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Get user profile
 */
router.get('/profile/:userId', async (req, res) => {
  const { userId } = req.params;
  const supabase = req.app.locals.supabase;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * Update user profile
 */
router.post('/profile/:userId', async (req, res) => {
  const { userId } = req.params;
  const profileData = req.body;
  const supabase = req.app.locals.supabase;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * Upload profile photo
 */
router.post('/upload-avatar', upload.single('avatar'), async (req, res) => {
  const supabase = req.app.locals.supabase;
  console.log('📸 Avatar upload request received');
  
  try {
    const { userId } = req.body;
    const file = req.file;

    console.log('👤 UserID:', userId);
    console.log('📄 File:', file ? `${file.originalname} (${file.mimetype})` : 'Missing');

    if (!file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    // Convert to base64 for demo purposes
    const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    const { error } = await supabase
      .from('profiles')
      .update({
        avatar_url: base64Image,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Profile photo updated successfully',
      avatarUrl: base64Image
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to upload photo' });
  }
});

export default router;
