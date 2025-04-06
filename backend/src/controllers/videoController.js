const ytdlp = require('yt-dlp-exec');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const ffmpeg = require('fluent-ffmpeg');

// Utility function to validate YouTube URL
const isValidYoutubeUrl = (url) => {
  // Updated regex to include music.youtube.com and playlist URLs
  const pattern = /^(https?:\/\/)?(www\.|music\.)?(youtube\.com|youtu\.be)\/(.+)$/;
  return pattern.test(url);
};

// Utility function to check if URL is a playlist
const isPlaylistUrl = (url) => {
  return url.includes('playlist') || url.includes('list=');
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

    // Check if URL is a playlist
    const isPlaylist = isPlaylistUrl(url);

    // Create options for yt-dlp
    const ytdlpOptions = {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true,
    };

    // Add playlist-specific options
    if (isPlaylist) {
      // For playlists, we need to extract the first entry for preview
      ytdlpOptions.flatPlaylist = true;
      ytdlpOptions.playlistItems = '1';
    } else {
      // For single videos, we don't want playlist extraction
      ytdlpOptions.noPlaylist = true;
    }

    // Get video/playlist info using yt-dlp
    const info = await ytdlp(url, ytdlpOptions);
    
    // Extract relevant metadata
    const metadata = {
      videoId: info.id,
      title: info.title,
      lengthSeconds: parseInt(info.duration || 0),
      author: info.uploader || info.channel || 'Unknown',
      isPlaylist: isPlaylist,
      formats: {
        video: ['2160p', '1440p', '1080p', '720p', '480p', '360p', '240p', '144p'].filter(quality => 
          info.formats && info.formats.some(format => 
            format.height && (format.height === parseInt(quality.replace('p', '')))
          )
        ),
        videoFormats: ['mp4', 'webm', 'mkv'],
        audio: ['320kbps', '256kbps', '192kbps', '128kbps', '96kbps', '64kbps'],
        audioFormats: ['mp3', 'aac', 'm4a', 'opus', 'wav']
      }
    };

    // Add playlist-specific metadata if applicable
    if (isPlaylist) {
      // For YouTube Music playlists
      metadata.playlistId = info.playlist_id || info.id;
      metadata.playlistTitle = info.playlist_title || info.title;
      
      // Get playlist count - for YouTube Music we might need a separate call
      if (url.includes('music.youtube.com')) {
        try {
          // Make a separate call to get playlist info
          const playlistInfo = await ytdlp(url, {
            dumpSingleJson: true,
            flatPlaylist: true,
            skipDownload: true,
            noWarnings: true,
            noCallHome: true,
            noCheckCertificate: true,
          });
          
          metadata.playlistCount = playlistInfo.entries ? playlistInfo.entries.length : 'Unknown';
        } catch (err) {
          console.error('Error getting playlist count:', err);
          metadata.playlistCount = 'Unknown';
        }
      } else {
        metadata.playlistCount = info.playlist_count || 'Unknown';
      }
    }

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

    // Check if URL is a playlist
    const isPlaylist = isPlaylistUrl(url);

    // Create options for yt-dlp
    const ytdlpOptions = {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true,
    };

    // Add playlist-specific options
    if (isPlaylist) {
      // For playlists, we need to get info about all entries
      ytdlpOptions.flatPlaylist = true;
    } else {
      // For single videos, we don't want playlist extraction
      ytdlpOptions.noPlaylist = true;
    }

    // Get video/playlist info
    const info = await ytdlp(url, ytdlpOptions);
    
    // Create a unique download ID for tracking
    const downloadId = uuidv4();
    
    // Create download directory if it doesn't exist
    const downloadDir = path.join(__dirname, '../../downloads');
    await fs.ensureDir(downloadDir);
    
    // Handle playlist download
    if (isPlaylist) {
      // Create a sanitized folder name for the playlist
      const playlistTitle = (info.playlist_title || info.title || 'Playlist').replace(/[^\w\s]/gi, '');
      const playlistFolder = path.join(downloadDir, `${playlistTitle}`);
      
      // Create the playlist folder
      await fs.ensureDir(playlistFolder);
      
      // Prepare download options for the playlist
      const downloadOptions = {
        format: format,
        videoFormat: videoFormat,
        audioFormat: audioFormat,
        quality: quality,
        downloadId: downloadId,
        title: info.playlist_title || info.title,
        isPlaylist: true,
        playlistTitle: info.playlist_title || info.title,
        playlistCount: info.entries ? info.entries.length : 0,
        outputPath: playlistFolder,
        status: 'queued',
        progress: 0,
        url: url,
        createdAt: new Date().toISOString(),
        videos: []
      };
      
      // Add information about each video in the playlist
      if (info.entries && info.entries.length > 0) {
        downloadOptions.videos = info.entries.map((entry, index) => {
          const videoTitle = (entry.title || `Video ${index + 1}`).replace(/[^\w\s]/gi, '');
          const extension = format === 'audio' ? audioFormat : videoFormat;
          const fileName = `${videoTitle}.${extension}`;
          
          return {
            index: index + 1,
            videoId: entry.id,
            title: entry.title || `Video ${index + 1}`,
            fileName: fileName,
            status: 'queued',
            progress: 0
          };
        });
      }
      
      // Store download info in memory
      if (!global.activeDownloads) {
        global.activeDownloads = {};
      }
      global.activeDownloads[downloadId] = downloadOptions;
      
      // Start the playlist download process in the background
      setTimeout(() => {
        startPlaylistDownloadProcess(downloadOptions);
      }, 100);
      
      // Return the download ID and info to the client
      return res.status(200).json({ 
        error: false, 
        message: 'Playlist download started',
        downloadId: downloadId,
        title: downloadOptions.title,
        isPlaylist: true,
        playlistCount: downloadOptions.playlistCount,
        downloadOptions
      });
    } else {
      // Handle single video download (existing code)
      const videoTitle = info.title.replace(/[^\w\s]/gi, '');
      const fileId = uuidv4();
      const fileName = `${videoTitle}-${fileId}`;
      
      // Define the output file path
      const extension = format === 'audio' ? audioFormat : videoFormat;
      const outputPath = path.join(downloadDir, `${fileName}.${extension}`);
      
      // Prepare download options
      const downloadOptions = {
        format: format,
        videoFormat: videoFormat,
        audioFormat: audioFormat,
        quality: quality,
        downloadId: downloadId,
        title: info.title,
        fileName: `${fileName}.${extension}`,
        outputPath: outputPath,
        status: 'queued',
        progress: 0,
        url: url,
        createdAt: new Date().toISOString()
      };
      
      // Store download info in memory
      if (!global.activeDownloads) {
        global.activeDownloads = {};
      }
      global.activeDownloads[downloadId] = downloadOptions;
      
      // Start the download process in the background
      setTimeout(() => {
        startDownloadProcess(downloadOptions);
      }, 100);
      
      // Return the download ID and info to the client
      return res.status(200).json({ 
        error: false, 
        message: 'Download started',
        downloadId: downloadId,
        title: info.title,
        format: extension,
        downloadOptions
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

// Function to start the download process
async function startDownloadProcess(options) {
  try {
    const { url, format, quality, videoFormat, audioFormat, outputPath, downloadId } = options;
    
    // Update download status
    if (global.activeDownloads && global.activeDownloads[downloadId]) {
      global.activeDownloads[downloadId].status = 'downloading';
    }
    
    // Create yt-dlp arguments
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
        '--buffer-size', '64M',
        '--concurrent-fragments', '8',
        '--downloader', 'aria2c',
        '--downloader-args', 'aria2c:"-x 16 -s 16 -k 1M"',
        '-o', outputPath,
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
        '--buffer-size', '64M',
        '--concurrent-fragments', '8',
        '--downloader', 'aria2c',
        '--downloader-args', 'aria2c:"-x 16 -s 16 -k 1M"',
        '-o', outputPath,
        url
      ];
    }
    
    // Add progress output for parsing
    ytdlpArgs.push('--newline');
    ytdlpArgs.push('--progress-template', '%(progress.downloaded_bytes)s/%(progress.total_bytes)s');
    
    // Start the download process
    const { spawn } = require('child_process');
    const ytdlpProcess = spawn('yt-dlp', ytdlpArgs);
    
    // Track download progress
    ytdlpProcess.stdout.on('data', (data) => {
      const output = data.toString();
      
      // Try to parse progress information
      try {
        if (output.includes('/')) {
          const [downloaded, total] = output.trim().split('/').map(Number);
          if (!isNaN(downloaded) && !isNaN(total) && total > 0) {
            const progress = Math.round((downloaded / total) * 100);
            
            // Update download progress
            if (global.activeDownloads && global.activeDownloads[downloadId]) {
              global.activeDownloads[downloadId].progress = progress;
              global.activeDownloads[downloadId].downloadedBytes = downloaded;
              global.activeDownloads[downloadId].totalBytes = total;
            }
          }
        }
      } catch (err) {
        console.error('Error parsing progress:', err);
      }
    });
    
    ytdlpProcess.stderr.on('data', (data) => {
      console.error(`yt-dlp stderr: ${data}`);
    });
    
    ytdlpProcess.on('close', (code) => {
      if (code === 0) {
        // Download completed successfully
        if (global.activeDownloads && global.activeDownloads[downloadId]) {
          global.activeDownloads[downloadId].status = 'completed';
          global.activeDownloads[downloadId].progress = 100;
          global.activeDownloads[downloadId].completedAt = new Date().toISOString();
        }
        console.log(`Download completed: ${outputPath}`);
      } else {
        // Download failed
        if (global.activeDownloads && global.activeDownloads[downloadId]) {
          global.activeDownloads[downloadId].status = 'failed';
          global.activeDownloads[downloadId].error = `Process exited with code ${code}`;
        }
        console.error(`yt-dlp process exited with code ${code}`);
      }
    });
    
    // Store the process reference for potential cancellation
    if (global.activeDownloads && global.activeDownloads[downloadId]) {
      global.activeDownloads[downloadId].process = ytdlpProcess;
    }
    
  } catch (error) {
    console.error('Error starting download process:', error);
    if (global.activeDownloads && global.activeDownloads[downloadId]) {
      global.activeDownloads[downloadId].status = 'failed';
      global.activeDownloads[downloadId].error = error.message;
    }
  }
}

// Function to start the playlist download process
async function startPlaylistDownloadProcess(options) {
  try {
    const { url, format, quality, videoFormat, audioFormat, outputPath, downloadId, videos } = options;
    
    // Update download status
    if (global.activeDownloads && global.activeDownloads[downloadId]) {
      global.activeDownloads[downloadId].status = 'downloading';
    }
    
    // Create yt-dlp arguments for playlist download
    let ytdlpArgs = [];
    
    if (format === 'audio') {
      // For audio downloads
      ytdlpArgs = [
        '-x',
        '--audio-format', audioFormat,
        '--audio-quality', '0',
        '--yes-playlist',  // Download the playlist
        '--no-warnings',
        '--no-check-certificate',
        '--prefer-free-formats',
        '--buffer-size', '64M',
        '--concurrent-fragments', '8',
        '--downloader', 'aria2c',
        '--downloader-args', 'aria2c:"-x 16 -s 16 -k 1M"',
        // Output format: place each video in the playlist folder with its title
        // Use a filename sanitization pattern to avoid invalid characters
        '-o', path.join(outputPath, '%(title)s.%(ext)s').replace(/\\/g, '/'),
        url
      ];
    } else {
      // For video downloads
      const height = parseInt(quality.replace('p', ''));
      ytdlpArgs = [
        '-f', `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]`,
        '--merge-output-format', videoFormat,
        '--yes-playlist',  // Download the playlist
        '--no-warnings',
        '--no-check-certificate',
        '--prefer-free-formats',
        '--buffer-size', '64M',
        '--concurrent-fragments', '8',
        '--downloader', 'aria2c',
        '--downloader-args', 'aria2c:"-x 16 -s 16 -k 1M"',
        // Output format: place each video in the playlist folder with its title
        // Use a filename sanitization pattern to avoid invalid characters
        '-o', path.join(outputPath, '%(title)s.%(ext)s').replace(/\\/g, '/'),
        url
      ];
    }
    
    // Add progress output for parsing
    ytdlpArgs.push('--newline');
    ytdlpArgs.push('--progress-template', '%(progress.downloaded_bytes)s/%(progress.total_bytes)s');
    
    console.log('Starting playlist download with command:', 'yt-dlp', ytdlpArgs.join(' '));
    
    // Start the download process
    const { spawn } = require('child_process');
    const ytdlpProcess = spawn('yt-dlp', ytdlpArgs);
    
    // Track overall progress
    let totalProgress = 0;
    let currentVideoIndex = 0;
    let totalVideos = videos ? videos.length : 1;
    
    // Track download progress
    ytdlpProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('yt-dlp output:', output);
      
      // Try to parse progress information
      try {
        // Check for video title to track which video is being downloaded
        if (output.includes('[download]') && output.includes('Destination:')) {
          currentVideoIndex++;
          
          // Update the status in the active downloads
          if (global.activeDownloads && global.activeDownloads[downloadId] && 
              global.activeDownloads[downloadId].videos && 
              global.activeDownloads[downloadId].videos[currentVideoIndex - 1]) {
            global.activeDownloads[downloadId].videos[currentVideoIndex - 1].status = 'downloading';
          }
          
          console.log(`Downloading video ${currentVideoIndex} of ${totalVideos}`);
        }
        
        // Parse progress information
        if (output.includes('/')) {
          const [downloaded, total] = output.trim().split('/').map(Number);
          if (!isNaN(downloaded) && !isNaN(total) && total > 0) {
            const progress = Math.round((downloaded / total) * 100);
            
            // Update current video progress
            if (global.activeDownloads && global.activeDownloads[downloadId] && 
                global.activeDownloads[downloadId].videos && 
                global.activeDownloads[downloadId].videos[currentVideoIndex - 1]) {
              global.activeDownloads[downloadId].videos[currentVideoIndex - 1].progress = progress;
            }
            
            // Calculate overall progress based on completed videos + current progress
            const overallProgress = Math.round(
              ((currentVideoIndex - 1) * 100 + progress) / totalVideos
            );
            
            // Update download progress
            if (global.activeDownloads && global.activeDownloads[downloadId]) {
              global.activeDownloads[downloadId].progress = overallProgress;
              global.activeDownloads[downloadId].downloadedBytes = downloaded;
              global.activeDownloads[downloadId].totalBytes = total;
              global.activeDownloads[downloadId].currentVideo = currentVideoIndex;
              global.activeDownloads[downloadId].totalVideos = totalVideos;
            }
          }
        }
      } catch (err) {
        console.error('Error parsing progress:', err);
      }
    });
    
    ytdlpProcess.stderr.on('data', (data) => {
      console.error(`yt-dlp stderr: ${data}`);
    });
    
    ytdlpProcess.on('close', (code) => {
      if (code === 0) {
        // Download completed successfully
        if (global.activeDownloads && global.activeDownloads[downloadId]) {
          global.activeDownloads[downloadId].status = 'completed';
          global.activeDownloads[downloadId].progress = 100;
          global.activeDownloads[downloadId].completedAt = new Date().toISOString();
          
          // Mark all videos as completed
          if (global.activeDownloads[downloadId].videos) {
            global.activeDownloads[downloadId].videos.forEach(video => {
              video.status = 'completed';
              video.progress = 100;
            });
          }
        }
        console.log(`Playlist download completed: ${outputPath}`);
      } else {
        // Download failed
        if (global.activeDownloads && global.activeDownloads[downloadId]) {
          global.activeDownloads[downloadId].status = 'failed';
          global.activeDownloads[downloadId].error = `Process exited with code ${code}`;
        }
        console.error(`yt-dlp process exited with code ${code}`);
      }
    });
    
    // Store the process reference for potential cancellation
    if (global.activeDownloads && global.activeDownloads[downloadId]) {
      global.activeDownloads[downloadId].process = ytdlpProcess;
    }
    
  } catch (error) {
    console.error('Error starting playlist download process:', error);
    if (global.activeDownloads && global.activeDownloads[downloadId]) {
      global.activeDownloads[downloadId].status = 'failed';
      global.activeDownloads[downloadId].error = error.message;
    }
  }
}

// Get download status
exports.getDownloadStatus = async (req, res) => {
  try {
    const { downloadId } = req.params;
    
    if (!downloadId) {
      return res.status(400).json({ error: true, message: 'Download ID is required' });
    }
    
    // Check if download exists
    if (!global.activeDownloads || !global.activeDownloads[downloadId]) {
      return res.status(404).json({ error: true, message: 'Download not found' });
    }
    
    // Return download status
    return res.status(200).json({ 
      error: false, 
      download: global.activeDownloads[downloadId]
    });
    
  } catch (error) {
    console.error('Error getting download status:', error);
    return res.status(500).json({ 
      error: true, 
      message: 'Failed to get download status' 
    });
  }
};

// Download file
exports.downloadFile = async (req, res) => {
  try {
    const { downloadId } = req.params;
    
    if (!downloadId) {
      return res.status(400).json({ error: true, message: 'Download ID is required' });
    }
    
    // Check if download exists
    if (!global.activeDownloads || !global.activeDownloads[downloadId]) {
      return res.status(404).json({ error: true, message: 'Download not found' });
    }
    
    const download = global.activeDownloads[downloadId];
    
    // Check if download is completed
    if (download.status !== 'completed') {
      return res.status(400).json({ 
        error: true, 
        message: `Download is not ready (status: ${download.status})` 
      });
    }
    
    // Check if file exists
    if (!await fs.pathExists(download.outputPath)) {
      return res.status(404).json({ error: true, message: 'Download file not found' });
    }
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(download.fileName)}"`);
    
    // Stream the file to the client
    const fileStream = fs.createReadStream(download.outputPath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Error downloading file:', error);
    return res.status(500).json({ 
      error: true, 
      message: 'Failed to download file' 
    });
  }
};

// Cancel download
exports.cancelDownload = async (req, res) => {
  try {
    const { downloadId } = req.params;
    
    if (!downloadId) {
      return res.status(400).json({ error: true, message: 'Download ID is required' });
    }
    
    // Check if download exists
    if (!global.activeDownloads || !global.activeDownloads[downloadId]) {
      return res.status(404).json({ error: true, message: 'Download not found' });
    }
    
    const download = global.activeDownloads[downloadId];
    
    // Kill the download process if it's running
    if (download.process && typeof download.process.kill === 'function') {
      download.process.kill();
    }
    
    // Update download status
    download.status = 'cancelled';
    download.cancelledAt = new Date().toISOString();
    
    // Clean up the partial file if it exists
    try {
      if (await fs.pathExists(download.outputPath)) {
        await fs.unlink(download.outputPath);
      }
    } catch (err) {
      console.error('Error deleting partial file:', err);
    }
    
    return res.status(200).json({ 
      error: false, 
      message: 'Download cancelled successfully' 
    });
    
  } catch (error) {
    console.error('Error cancelling download:', error);
    return res.status(500).json({ 
      error: true, 
      message: 'Failed to cancel download' 
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
        '--buffer-size', '64M',
        '--concurrent-fragments', '8',
        '--downloader', 'aria2c',
        '--downloader-args', 'aria2c:"-x 16 -s 16 -k 1M"',
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
        '--buffer-size', '64M',
        '--concurrent-fragments', '8',
        '--downloader', 'aria2c',
        '--downloader-args', 'aria2c:"-x 16 -s 16 -k 1M"',
        '-o', '-', // Output to stdout
        url
      ];
    }
    
    // Add progress output for parsing
    ytdlpArgs.push('--newline');
    ytdlpArgs.push('--progress-template', '%(progress.downloaded_bytes)s/%(progress.total_bytes)s');
    
    // Start the download process and pipe directly to response
    const { spawn } = require('child_process');
    const ytdlpProcess = spawn('yt-dlp', ytdlpArgs);
    
    // Set up a progress tracker
    let downloadedBytes = 0;
    let lastLoggedBytes = 0;
    const progressInterval = setInterval(() => {
      // Only log if there's actual progress (bytes have increased)
      if (downloadedBytes > lastLoggedBytes) {
        console.log(`Downloaded: ${downloadedBytes} bytes`);
        lastLoggedBytes = downloadedBytes;
      }
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
