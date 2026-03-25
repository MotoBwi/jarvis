/**
 * Process Lock Manager for J.A.R.V.I.S. Daemon
 *
 * Uses flock()-based advisory locks to prevent duplicate daemon instances.
 * Unlike PID-based checks, flock locks are automatically released by the OS
 * when the process dies (even on SIGKILL, OOM, or crash), making this
 * container-safe and race-free.
 */

import { join } from 'node:path';
import { homedir } from 'node:os';
import {
  constants,
  existsSync,
  readFileSync,
  unlinkSync,
  mkdirSync,
  openSync,
  closeSync,
  writeSync,
  ftruncateSync,
} from 'node:fs';
import { dlopen, FFIType } from 'bun:ffi';

const JARVIS_DIR = join(homedir(), '.jarvis');
const LOG_DIR = join(JARVIS_DIR, 'logs');
const LOCK_PATH = join(JARVIS_DIR, 'jarvis.pid');
const LOG_PATH = join(LOG_DIR, 'jarvis.log');

// ── flock() via Bun FFI ──────────────────────────────────────────────

// Use platform-specific library: libc.so.6 on Linux, libSystem on macOS
type LibC = {
  symbols: {
    flock: (fd: number, operation: number) => number;
  };
};
let libc: LibC | null = null;

try {
  // Try Linux first
  const result = dlopen('libc.so.6', {
    flock: { args: [FFIType.i32, FFIType.i32], returns: FFIType.i32 },
  });
  libc = result as unknown as LibC;
} catch {
  // Try macOS (libSystem.B.dylib)
  try {
    const result = dlopen('libSystem.B.dylib', {
      flock: { args: [FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    });
    libc = result as unknown as LibC;
  } catch {
    console.warn('[PID] flock() not available on this platform, using fallback locking');
  }
}

const LOCK_EX = 2;  // Exclusive lock
const LOCK_NB = 4;  // Non-blocking
const LOCK_UN = 8;  // Unlock

// ── Lock state ───────────────────────────────────────────────────────

// The open FD that holds the flock — kept alive for the process lifetime.
// When the process exits (normally, SIGKILL, OOM, crash), the OS closes it
// and the advisory lock is automatically released.
let lockFd: number | null = null;

// ── Public API ───────────────────────────────────────────────────────

/**
 * Acquire an exclusive lock on the lock file and write the PID.
 * Returns true if the lock was acquired, false if another instance holds it.
 */
export function acquireLock(pid: number): boolean {
  // Fallback: simple file-based locking if flock is not available
  const libcLib = libc;
  if (!libcLib) {
    return acquireLockFallback(pid);
  }

  try {
    mkdirSync(JARVIS_DIR, { recursive: true });

    // Open (or create) the lock file — don't truncate before locking
    const fd = openSync(LOCK_PATH, constants.O_WRONLY | constants.O_CREAT, 0o644);

    // Try non-blocking exclusive lock
    const flock = libcLib.symbols.flock;
    const result = flock(fd, LOCK_EX | LOCK_NB);
    if (result !== 0) {
      closeSync(fd);
      return false;
    }

    // Lock acquired — truncate and write PID for display purposes
    ftruncateSync(fd, 0);
    writeSync(fd, String(pid));

    // Keep the FD open — closing it would release the lock
    lockFd = fd;
    return true;
  } catch (err) {
    console.error(`[PID] Failed to acquire lock: ${err}`);
    return false;
  }
}

/**
 * Fallback lock implementation for platforms without flock support (macOS fallback)
 */
function acquireLockFallback(pid: number): boolean {
  try {
    mkdirSync(JARVIS_DIR, { recursive: true });

    // Check if lock file exists and is still valid
    if (existsSync(LOCK_PATH)) {
      const content = readFileSync(LOCK_PATH, 'utf-8').trim();
      const existingPid = parseInt(content, 10);
      if (!isNaN(existingPid) && existingPid > 0) {
        // Check if process is still running
        try {
          process.kill(existingPid, 0); // Signal 0 just checks if process exists
          return false; // Process is running, can't acquire lock
        } catch {
          // Process doesn't exist, can acquire lock
        }
      }
    }

    // Create lock file
    const fd = openSync(LOCK_PATH, constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC, 0o644);
    writeSync(fd, String(pid));
    closeSync(fd);
    lockFd = fd;
    return true;
  } catch (err) {
    console.error(`[PID] Failed to acquire fallback lock: ${err}`);
    return false;
  }
}

/**
 * Check if the daemon lock is currently held.
 * Returns the PID if locked (daemon running), null otherwise.
 */
export function isLocked(): number | null {
  if (!existsSync(LOCK_PATH)) return null;

  // Use fallback method if flock is not available
  const libcLib = libc;
  if (!libcLib) {
    return isLockedFallback();
  }

  let fd: number;
  try {
    fd = openSync(LOCK_PATH, constants.O_RDONLY);
  } catch {
    return null;
  }

  try {
    // Try non-blocking exclusive lock to probe
    const flock = libcLib.symbols.flock;
    const result = flock(fd, LOCK_EX | LOCK_NB);
    if (result === 0) {
      // Lock acquired — no daemon running. Release immediately.
      flock(fd, LOCK_UN);
      closeSync(fd);
      return null;
    }
    // Lock held by another process — daemon is running
    closeSync(fd);
    const pid = readPid();

    // Container safety: if PID is 1 and we're inside a container,
    // the lock file is stale from a previous container lifecycle
    if (pid === 1 && isInsideContainer()) {
      releaseLock();
      return null;
    }

    return pid;
  } catch {
    try { closeSync(fd); } catch { /* already closed */ }
    return null;
  }
}

/**
 * Fallback lock check for platforms without flock
 */
function isLockedFallback(): number | null {
  const pid = readPid();
  if (pid === null) return null;

  // Check if process is still running
  try {
    process.kill(pid, 0);
    return pid; // Process is running
  } catch {
    // Process doesn't exist, lock is stale
    return null;
  }
}

/**
 * Release the lock (close the FD) and remove the lock file.
 */
export function releaseLock(): void {
  if (lockFd !== null) {
    try {
      closeSync(lockFd);
    } catch {
      // Already closed
    }
    lockFd = null;
  }
  try {
    if (existsSync(LOCK_PATH)) unlinkSync(LOCK_PATH);
  } catch { /* ignore */ }
}

/**
 * Read the PID from the lock file. Returns null if no file or invalid content.
 */
export function readPid(): number | null {
  if (!existsSync(LOCK_PATH)) return null;
  try {
    const content = readFileSync(LOCK_PATH, 'utf-8').trim();
    const pid = parseInt(content, 10);
    if (isNaN(pid) || pid <= 0) return null;
    return pid;
  } catch {
    return null;
  }
}

/**
 * Get the lock file path (for display purposes).
 */
export function getPidPath(): string {
  return LOCK_PATH;
}

/**
 * Get the log file path. Creates the log directory if needed.
 */
export function getLogPath(): string {
  mkdirSync(LOG_DIR, { recursive: true });
  return LOG_PATH;
}

/**
 * Get the log directory path.
 */
export function getLogDir(): string {
  return LOG_DIR;
}

// ── Helpers ──────────────────────────────────────────────────────────

function isInsideContainer(): boolean {
  if (existsSync('/.dockerenv')) return true;
  try {
    return readFileSync('/proc/1/cgroup', 'utf-8').includes('docker');
  } catch {
    return false;
  }
}
