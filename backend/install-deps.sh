#!/bin/bash

# Update package list
apt-get update

# Install yt-dlp
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
chmod a+rx /usr/local/bin/yt-dlp

# Install aria2c
apt-get install -y aria2

# Install ffmpeg
apt-get install -y ffmpeg
