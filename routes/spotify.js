import express from 'express';
import fetch from 'node-fetch';

import { connectDB } from '../db.js';
import TokenModel from '../models/token.js';

const router = express.Router();
const POLL_INTERVAL_MS = 5_000;

let pollInterval = null;
let previousTrackFingerprint = null;

router.get('/currently-playing', async function(req, res, next) {
  try {
    const result = await fetchCurrentlyPlaying();

    if (result.status === 204) {
      return res.status(204).send();
    }

    if (result.status !== 200 || !result.body) {
      return res
        .status(result.status)
        .json(result.body || { error: 'Unable to fetch currently playing track' });
    }

    return res.json(transformPlayback(result.body));
  } catch (error) {
    return next(error);
  }
});

router.post('/stream', async function(req, res, next) {
  try {
    const io = req.app.get('io');

    if (!io) {
      return res.status(500).json({ error: 'Socket server not initialized' });
    }

    await startPolling(io);

    return res.json({ status: 'streaming' });
  } catch (error) {
    return next(error);
  }
});

let token = null;
async function fetchCurrentlyPlaying() {
  if(!token || new Date(token.expiresAt) < new Date()) {
    await connectDB();
    token = await TokenModel.findOne({ provider: 'spotify' });
  }

  if (!token || !token.accessToken) {
    return { status: 404, body: { error: 'Spotify token not found' } };
  }

  const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing?additional_types=episode,track', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
      Accept: 'application/json'
    }
  });

  if (response.status === 204) {
    return { status: 204, body: null };
  }

  let body = null;

  try {
    body = await response.json();
  } catch (_) {
    // ignore body parse errors
  }

  return { status: response.status, body };
}


async function startPolling(io) {
  if (pollInterval) {
    return;
  }

  await emitCurrentTrack(io);

 
  pollInterval = setInterval(function() {
    if (io.connectedClients   > 0) {
      console.count('tick');
      emitCurrentTrack(io);
    }
  }, POLL_INTERVAL_MS);
}

async function emitCurrentTrack(io) {
  try {
    const result = await fetchCurrentlyPlaying();

    if (result.status !== 200 || !result.body) {
      return;
    }

    const payload = transformPlayback(result.body);

    if (!payload) {
      return;
    }

    const fingerprint = payload.trackId + ':' + (payload.progressMs || 0);

    if (fingerprint === previousTrackFingerprint) {
      return;
    }

    previousTrackFingerprint = fingerprint;
    io.emit('spotify:currently-playing', payload);
  } catch (error) {
    console.error('Error emitting Spotify playback data', error);
  }
}

function transformPlayback(data) {
  if (!data || !data.item) {
    return null;
  }

  const firstArtist = data.item.artists && data.item.artists.length > 0
    ? data.item.artists[0].name
    : null;

  const firstImage = data.item.album && data.item.album.images && data.item.album.images.length > 0
    ? data.item.album.images[0].url
    : data.item?.images?.[0]?.url || null;

  return {
    trackId: data.item.id || data.item.uri,
    title: data.item.name,
    artist: firstArtist,
    album: data.item.album ? data.item.album.name : null,
    image: firstImage,
    progressMs: data.progress_ms,
    isPlaying: data.is_playing,
    ...data
  };
}

export default router;
