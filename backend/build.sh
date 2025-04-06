#!/bin/bash

# Update package list
apt-get update

# Install system dependencies
apt-get install -y aria2 ffmpeg curl

# Install yt-dlp
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
chmod a+rx /usr/local/bin/yt-dlp

# Create necessary directories
mkdir -p uploads/videos uploads/audio

# Install npm dependencies
npm ci
