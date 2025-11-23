import createDebug from 'debug';
import TokenModel from './models/token.js';
import CountModel from './models/count.js';

const debug = createDebug('now-playing:socket');

let tokenCountChangeStream = null;
let viewCountChangeStream = null;

async function getTokenCount() {
  try {
    return await TokenModel.countDocuments();
  } catch (error) {
    debug('Error getting token count:', error);
    return 0;
  }
}

async function emitTokenCount(io) {
  try {
    const count = await getTokenCount();
    io.emit('token:count', { count });
    debug('Emitted token count: %d', count);
  } catch (error) {
    debug('Error emitting token count:', error);
  }
}

export async function setupTokenCountWatcher(io) {
  try {
    // Get initial count
    await emitTokenCount(io);

    // Set up change stream to watch for document changes
    tokenCountChangeStream = TokenModel.watch([], {
      fullDocument: 'default'
    });

    tokenCountChangeStream.on('change', async function(change) {
      debug('Token collection changed:', change.operationType);
      // Emit updated count whenever there's a change
      await emitTokenCount(io);
    });

    tokenCountChangeStream.on('error', function(error) {
      debug('Token count change stream error:', error);
    });

    debug('Token count watcher initialized');
  } catch (error) {
    debug('Error setting up token count watcher:', error);
    // Fallback to polling if change streams aren't available
    setInterval(() => emitTokenCount(io), 5000);
  }
}

async function getViewCount() {
  try {
    const { count } = await CountModel.findOne({ id: 'page-views' })
    return count;
  } catch (error) {
    debug('Error getting view count:', error);
    return 0;
  }
}

async function emitViewCount(io) {
  try {
    const count = await getViewCount();
    io.emit('view:count', { count });
    debug('Emitted view count: %d', count);
  } catch (error) {
    debug('Error emitting view count:', error);
  }
}

export async function setupViewCountWatcher(io) {
  try {
    // Get initial count
    await emitViewCount(io);

    // Set up change stream to watch for document changes
    viewCountChangeStream = CountModel.watch([], {
      fullDocument: 'default'
    });

    viewCountChangeStream.on('change', async function(change) {
      debug('View collection changed:', change.operationType);
      // Emit updated count whenever there's a change
      await emitViewCount(io);
    });

    viewCountChangeStream.on('error', function(error) {
      debug('View count change stream error:', error);
    });

    debug('View count watcher initialized');
  } catch (error) {
    debug('Error setting up view count watcher:', error);
    // Fallback to polling if change streams aren't available
    setInterval(() => emitViewCount(io), 5000);
  }
}

export async function handleConnection(socket, io) {
  // Send current token count on connection
  const tokenCount = await getTokenCount();
  socket.emit('token:count', { count: tokenCount });
  debug('Sent initial token count to %s: %d', socket.id, tokenCount);

  // Send current view count on connection
  const viewCount = await getViewCount();
  socket.emit('view:count', { count: viewCount });
  debug('Sent initial view count to %s: %d', socket.id, viewCount);
}

