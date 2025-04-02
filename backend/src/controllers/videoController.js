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
        video: ['2160p', '1440p', '1080p', '720p', '480p', '360p', '240p', '144p'].filter(quality => 
          info.formats.some(format => 
            format.height && (format.height === parseInt(quality.replace('p', '')))
          )
        ),
        videoFormats: ['mp4', 'webm', 'mkv'],
        audio: ['320kbps', '256kbps', '192kbps', '128kbps', '96kbps', '64kbps'],
        audioFormats: ['mp3', 'aac', 'm4a', 'opus', 'wav']
      }
    };

    // If no video formats were found, add default formats
    if (metadata.formats.video.length === 0) {
      metadata.formats.video = ['1080p', '720p', '480p', '360p'];
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
    const { url, format = 'video', quality = '720p', videoFormat = 'mp4', audioFormat = 'mp3' } = req.body;
    
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
    
    // Generate direct download command
    let ytdlpCommand = '';
    let outputFormat = '';
    
    if (format === 'audio') {
      // For audio downloads
      outputFormat = audioFormat;
      ytdlpCommand = `yt-dlp -x --audio-format ${audioFormat} --audio-quality 0 -o "%(title)s.%(ext)s" "${url}"`;
    } else {
      // For video downloads
      outputFormat = videoFormat;
      const height = parseInt(quality.replace('p', ''));
      ytdlpCommand = `yt-dlp -f "bestvideo[height<=${height}]+bestaudio/best[height<=${height}]" --merge-output-format ${videoFormat} -o "%(title)s.%(ext)s" "${url}"`;
    }
    
    return res.status(200).json({ 
      error: false, 
      message: 'Download command generated',
      directDownload: true,
      command: ytdlpCommand,
      title: info.title,
      format: outputFormat,
      url: url,
      quality: quality,
      downloadOptions: {
        format: format,
        videoFormat: videoFormat,
        audioFormat: audioFormat,
        quality: quality
      }
    });
  } catch (error) {
    console.error('Error processing video:', error);
    return res.status(500).json({ 
      error: true, 
      message: 'Failed to process video download' 
    });
  }
};

// Direct download endpoint
exports.directDownload = async (req, res) => {
  try {
    // Support both GET and POST requests
    const params = req.method === 'GET' ? req.query : req.body;
    const { url, format, quality, videoFormat, audioFormat } = params;
    
    if (!url) {
      return res.status(400).json({ error: true, message: 'URL is required' });
    }

    if (!isValidYoutubeUrl(url)) {
      return res.status(400).json({ error: true, message: 'Invalid YouTube URL' });
    }
    
    // Get video info to determine filename
    const info = await ytdlp(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true,
    });
    
    // Create a sanitized filename
    const videoTitle = info.title.replace(/[^\w\s]/gi, '');
    const extension = format === 'audio' ? audioFormat : videoFormat;
    const filename = `${videoTitle}.${extension}`;
    
    // Calculate approximate file size
    let estimatedSize = 0;
    if (format === 'audio') {
      // Estimate audio size based on duration and bitrate
      // Assuming average bitrate values in kbps
      const bitrates = {
        'mp3': 192,
        'aac': 256,
        'm4a': 256,
        'opus': 128,
        'wav': 1411
      };
      
      const bitrate = bitrates[audioFormat] || 192; // Default to 192kbps
      estimatedSize = Math.round((info.duration * bitrate * 1000) / 8); // Size in bytes
    } else {
      // Estimate video size based on resolution and duration
      // Approximate bitrates for different resolutions (in kbps)
      const videoBitrates = {
        '144p': 100,
        '240p': 300,
        '360p': 500,
        '480p': 1000,
        '720p': 2500,
        '1080p': 5000,
        '1440p': 10000,
        '2160p': 20000
      };
      
      const bitrate = videoBitrates[quality] || 2500; // Default to 720p bitrate
      estimatedSize = Math.round((info.duration * bitrate * 1000) / 8); // Size in bytes
    }
    
    // Set response headers for streaming with the correct filename and size
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    if (estimatedSize > 0) {
      res.setHeader('Content-Length', estimatedSize);
    }
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-cache');
    
    // Create yt-dlp process with optimized arguments
    let ytdlpArgs = [];
    
    if (format === 'audio') {
      // For audio downloads
      ytdlpArgs = [
        '-x',
        '--audio-format', audioFormat,
        '--audio-quality', '0',
        '--no-playlist',
        '--no-warnings',
        '--no-check-certificate',
        '--prefer-free-formats',
        '--buffer-size', '64M', // Increased buffer size for faster downloads
        '--concurrent-fragments', '8', // Download multiple fragments at once
        '--downloader', 'aria2c', // Use aria2c for faster downloads if available
        '--downloader-args', 'aria2c:"-x 16 -s 16 -k 1M"', // aria2c optimization
        '-o', '-', // Output to stdout
        url
      ];
    } else {
      // For video downloads
      const height = parseInt(quality.replace('p', ''));
      ytdlpArgs = [
        '-f', `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]`,
        '--merge-output-format', videoFormat,
        '--no-playlist',
        '--no-warnings',
        '--no-check-certificate',
        '--prefer-free-formats',
        '--buffer-size', '64M', // Increased buffer size for faster downloads
        '--concurrent-fragments', '8', // Download multiple fragments at once
        '--downloader', 'aria2c', // Use aria2c for faster downloads if available
        '--downloader-args', 'aria2c:"-x 16 -s 16 -k 1M"', // aria2c optimization
        '-o', '-', // Output to stdout
        url
      ];
    }
    
    // Start the download process and pipe directly to response
    const { spawn } = require('child_process');
    const ytdlpProcess = spawn('yt-dlp', ytdlpArgs);
    
    // Set up a progress tracker
    let downloadedBytes = 0;
    const progressInterval = setInterval(() => {
      console.log(`Downloaded: ${downloadedBytes} bytes`);
    }, 1000);
    
    // Pipe the output to the response with a transform stream to track progress
    const { Transform } = require('stream');
    const progressStream = new Transform({
      transform(chunk, encoding, callback) {
        downloadedBytes += chunk.length;
        this.push(chunk);
        callback();
      }
    });
    
    ytdlpProcess.stdout.pipe(progressStream).pipe(res);
    
    ytdlpProcess.stderr.on('data', (data) => {
      console.error(`yt-dlp stderr: ${data}`);
    });
    
    ytdlpProcess.on('close', (code) => {
      clearInterval(progressInterval);
      
      if (code !== 0) {
        console.error(`yt-dlp process exited with code ${code}`);
        if (!res.headersSent) {
          res.status(500).json({ error: true, message: 'Download failed' });
        }
      }
      console.log(`Download completed and sent to client: ${downloadedBytes} bytes`);
    });
    
    // Handle client disconnect
    req.on('close', () => {
      clearInterval(progressInterval);
      ytdlpProcess.kill();
      console.log('Client disconnected, download canceled');
    });
    
  } catch (error) {
    console.error('Error with direct download:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: true, message: 'Failed to process direct download' });
    }
  }
};
