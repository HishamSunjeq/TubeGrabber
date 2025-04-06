const { exec } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

const CONFIG_FILE = path.join(__dirname, '..', 'config', 'settings.json');

// Ensure config directory exists
fs.ensureDirSync(path.join(__dirname, '..', 'config'));

// Initialize config file if it doesn't exist
if (!fs.existsSync(CONFIG_FILE)) {
  const defaultPath = path.join(os.homedir(), 'Downloads', 'YouTubeDownloader');
  fs.ensureDirSync(defaultPath);
  fs.writeJsonSync(CONFIG_FILE, { downloadPath: defaultPath });
}

// Get current download path
exports.getDownloadPath = async (req, res) => {
  try {
    const config = fs.readJsonSync(CONFIG_FILE);
    return res.json({
      success: true,
      downloadPath: config.downloadPath
    });
  } catch (err) {
    console.error('Error reading download path:', err);
    return res.status(500).json({ error: true, message: 'Failed to read download path' });
  }
};

// Set download path
exports.setDownloadPath = async (req, res) => {
  try {
    const { downloadPath } = req.body;
    
    if (!downloadPath) {
      return res.status(400).json({ error: true, message: 'Download path is required' });
    }

    // Create directory if it doesn't exist
    try {
      fs.ensureDirSync(downloadPath);
    } catch (err) {
      return res.status(400).json({ error: true, message: 'Invalid path or insufficient permissions' });
    }

    // Test if directory is writable
    try {
      fs.accessSync(downloadPath, fs.constants.W_OK);
    } catch (err) {
      return res.status(400).json({ error: true, message: 'Directory is not writable' });
    }

    // Save to config file
    fs.writeJsonSync(CONFIG_FILE, { downloadPath });

    return res.json({
      success: true,
      downloadPath
    });
  } catch (err) {
    console.error('Error setting download path:', err);
    return res.status(500).json({ error: true, message: 'Failed to set download path' });
  }
};

// Open the download folder
exports.openDownloadFolder = async (req, res) => {
  try {
    const config = fs.readJsonSync(CONFIG_FILE);
    const downloadPath = config.downloadPath;
    
    console.log('Attempting to open folder:', downloadPath);
    
    if (!fs.existsSync(downloadPath)) {
      // If the folder doesn't exist, create it
      try {
        fs.ensureDirSync(downloadPath);
        console.log('Created download folder:', downloadPath);
      } catch (err) {
        console.error('Error creating download folder:', err);
        return res.status(500).json({ error: true, message: 'Failed to create download folder' });
      }
    }
    
    // Open the folder using the default file explorer
    let command = '';
    if (process.platform === 'win32') {
      command = `explorer "${downloadPath}"`;
    } else if (process.platform === 'darwin') {
      command = `open "${downloadPath}"`;
    } else {
      command = `xdg-open "${downloadPath}"`;
    }
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Error executing command:', error);
        console.error('Command stderr:', stderr);
        return res.status(500).json({ error: true, message: `Failed to open download folder: ${error.message}` });
      }
      
      return res.json({
        success: true,
        message: 'Download folder opened'
      });
    });
  } catch (err) {
    console.error('Error reading config:', err);
    return res.status(500).json({ error: true, message: 'Failed to read download path configuration' });
  }
};
