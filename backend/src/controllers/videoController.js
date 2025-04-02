const ytdl = require('ytdl-core');
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

    const info = await ytdl.getInfo(url);
    
    // Extract relevant metadata
    const metadata = {
      videoId: info.videoDetails.videoId,
      title: info.videoDetails.title,
      lengthSeconds: parseInt(info.videoDetails.lengthSeconds),
      author: info.videoDetails.author.name,
      formats: {
        video: ['720p', '480p', '360p', '240p', '144p'].filter(quality => 
          info.formats.some(format => 
            format.qualityLabel && format.qualityLabel.includes(quality)
          )
        ),
        audio: ['128kbps']
      }
    };

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
    const info = await ytdl.getInfo(url);
    const videoTitle = info.videoDetails.title.replace(/[^\w\s]/gi, '');
    const fileId = uuidv4();
    const fileName = `${videoTitle}-${fileId}`;
    
    // Set file paths based on format
    let filePath;
    let downloadUrl;
    
    if (format === 'mp3') {
      // For audio downloads
      filePath = path.join(__dirname, `../../uploads/audio/${fileName}.mp3`);
      downloadUrl = `/downloads/audio/${fileName}.mp3`;
      
      // Download as audio
      const audioStream = ytdl(url, { 
        quality: 'highestaudio',
        filter: 'audioonly'
      });
      
      // Convert to MP3 using ffmpeg
      ffmpeg(audioStream)
        .audioBitrate(128)
        .save(filePath)
        .on('end', () => {
          console.log(`Audio download completed: ${fileName}.mp3`);
          
          // Schedule file deletion after 24 hours
          setTimeout(() => {
            fs.remove(filePath)
              .then(() => console.log(`Deleted file: ${filePath}`))
              .catch(err => console.error(`Error deleting file: ${filePath}`, err));
          }, 24 * 60 * 60 * 1000); // 24 hours
        });
      
      return res.status(200).json({ 
        error: false, 
        message: 'Audio processing started',
        downloadUrl,
        title: videoTitle,
        format: 'mp3'
      });
    } else {
      // For video downloads
      filePath = path.join(__dirname, `../../uploads/videos/${fileName}.mp4`);
      downloadUrl = `/downloads/videos/${fileName}.mp4`;
      
      // Get the appropriate format based on quality
      const videoFormat = ytdl.chooseFormat(info.formats, { 
        quality: quality === '720p' ? 'highest' : quality 
      });
      
      // Download video
      ytdl(url, { format: videoFormat })
        .pipe(fs.createWriteStream(filePath))
        .on('finish', () => {
          console.log(`Video download completed: ${fileName}.mp4`);
          
          // Schedule file deletion after 24 hours
          setTimeout(() => {
            fs.remove(filePath)
              .then(() => console.log(`Deleted file: ${filePath}`))
              .catch(err => console.error(`Error deleting file: ${filePath}`, err));
          }, 24 * 60 * 60 * 1000); // 24 hours
        });
      
      return res.status(200).json({ 
        error: false, 
        message: 'Video processing started',
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
