const ytdlp = require('yt-dlp-exec');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const ffmpeg = require('fluent-ffmpeg');

// Utility function to validate YouTube URL
const isValidYoutubeUrl = (url) => {
  const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
  return pattern.test(url);
};

// Fetch metadata for a YouTube video
exports.fetchMetadata = async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: true, message: 'URL is required' });
    }

    if (!isValidYoutubeUrl(url)) {
      return res.status(400).json({ error: true, message: 'Invalid YouTube URL' });
    }

    // Get video info using yt-dlp
    const info = await ytdlp(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true,
    });
    
    // Extract relevant metadata
    const metadata = {
      videoId: info.id,
      title: info.title,
      lengthSeconds: parseInt(info.duration),
      author: info.uploader,
      formats: {
        video: ['720p', '480p', '360p', '240p', '144p'].filter(quality => 
          info.formats.some(format => 
            format.height && (format.height === parseInt(quality.replace('p', '')))
          )
        ),
        audio: ['128kbps']
      }
    };

    // If no video formats were found, add default 720p
    if (metadata.formats.video.length === 0) {
      metadata.formats.video = ['720p'];
    }

    return res.status(200).json({ error: false, metadata });
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return res.status(500).json({ 
      error: true, 
      message: 'Failed to fetch video metadata' 
    });
  }
};

// Process video download
exports.processVideo = async (req, res) => {
  try {
    const { url, format = 'mp4', quality = '720p' } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: true, message: 'URL is required' });
    }

    if (!isValidYoutubeUrl(url)) {
      return res.status(400).json({ error: true, message: 'Invalid YouTube URL' });
    }

    // Get video info
    const info = await ytdlp(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true,
    });
    
    const videoTitle = info.title.replace(/[^\w\s]/gi, '');
    const fileId = uuidv4();
    const fileName = `${videoTitle}-${fileId}`;
    
    // Set file paths based on format
    let filePath;
    let downloadUrl;
    
    if (format === 'mp3') {
      // For audio downloads
      filePath = path.join(__dirname, `../../uploads/audio/${fileName}.mp3`);
      downloadUrl = `/downloads/audio/${fileName}.mp3`;
      
      // Download as audio using yt-dlp
      await ytdlp(url, {
        extractAudio: true,
        audioFormat: 'mp3',
        audioQuality: 2, // 0 is best, 9 is worst
        output: filePath,
        noWarnings: true,
        noCallHome: true,
        noCheckCertificate: true,
        preferFreeFormats: true,
        youtubeSkipDashManifest: true,
      });
      
      console.log(`Audio download completed: ${fileName}.mp3`);
      
      // Schedule file deletion after 24 hours
      setTimeout(() => {
        fs.remove(filePath)
          .then(() => console.log(`Deleted file: ${filePath}`))
          .catch(err => console.error(`Error deleting file: ${filePath}`, err));
      }, 24 * 60 * 60 * 1000); // 24 hours
      
      return res.status(200).json({ 
        error: false, 
        message: 'Audio processing completed',
        downloadUrl,
        title: videoTitle,
        format: 'mp3'
      });
    } else {
      // For video downloads
      filePath = path.join(__dirname, `../../uploads/videos/${fileName}.mp4`);
      downloadUrl = `/downloads/videos/${fileName}.mp4`;
      
      // Get the appropriate format based on quality
      const height = parseInt(quality.replace('p', ''));
      
      // Download video using yt-dlp
      await ytdlp(url, {
        format: `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]`,
        mergeOutputFormat: 'mp4',
        output: filePath,
        noWarnings: true,
        noCallHome: true,
        noCheckCertificate: true,
        preferFreeFormats: true,
        youtubeSkipDashManifest: true,
      });
      
      console.log(`Video download completed: ${fileName}.mp4`);
      
      // Schedule file deletion after 24 hours
      setTimeout(() => {
        fs.remove(filePath)
          .then(() => console.log(`Deleted file: ${filePath}`))
          .catch(err => console.error(`Error deleting file: ${filePath}`, err));
      }, 24 * 60 * 60 * 1000); // 24 hours
      
      return res.status(200).json({ 
        error: false, 
        message: 'Video processing completed',
        downloadUrl,
        title: videoTitle,
        format: 'mp4'
      });
    }
  } catch (error) {
    console.error('Error processing video:', error);
    return res.status(500).json({ 
      error: true, 
      message: 'Failed to process video download' 
    });
  }
};
