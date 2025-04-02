# YTClipDownloader

A web-based SaaS application that allows users to download YouTube videos or audio files by pasting a URL, with customizable options for format, time range, and playlist support.

## Features

- Download YouTube videos in various formats (MP4, WEBM)
- Download audio in multiple formats (MP3, M4A, WAV)
- Select specific time ranges to download
- Support for playlist downloads
- Simple, intuitive user interface

## Project Structure

```
YTClipDownloader/
├── backend/         # Express.js server
├── frontend/        # React.js application
├── .gitignore       # Git ignore file
├── prd.md           # Product Requirements Document
├── todo.md          # Development To-Do List
└── README.md        # This file
```

## Setup Instructions

### Prerequisites

- Node.js (v16+)
- npm or yarn
- ffmpeg
- yt-dlp

### Backend Setup

```bash
cd backend
npm install
npm start
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

## Development Status

This project is currently in development following the phases outlined in the [todo.md](./todo.md) file.

## Legal Disclaimer

This application is intended for personal use only. Downloading copyrighted content may violate YouTube's Terms of Service. Only download content that you have the right to download, such as your own content or content licensed under Creative Commons.
