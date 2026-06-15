import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { haversineMeters } from '../../lib/geo';

export type TrackerStatus = 'idle' | 'requesting' | 'tracking' | 'paused' | 'denied';

export interface RecordedPoint {
  lat: number;
  lng: number;
  elevationM: number | null;
  speedMps: number | null;
  recordedAt: string;
}

export interface TrackResult {
  points: RecordedPoint[];
  movingSeconds: number;
  elapsedSeconds: number;
  startedAt: string;
  distanceM: number;
}

export interface Tracker {
  status: TrackerStatus;
  points: RecordedPoint[];
  distanceM: number;
  movingSeconds: number;
  error: string | null;
  start: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => TrackResult;
  reset: () => void;
}

export function useTracker(): Tracker {
  const [status, setStatus] = useState<TrackerStatus>('idle');
  const [points, setPoints] = useState<RecordedPoint[]>([]);
  const [distanceM, setDistanceM] = useState(0);
  const [movingSeconds, setMovingSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const subscription = useRef<Location.LocationSubscription | null>(null);
  const lastPoint = useRef<RecordedPoint | null>(null);
  const startedAt = useRef<string | null>(null);
  const startedMs = useRef<number>(0);
  const statusRef = useRef<TrackerStatus>('idle');
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pointsRef = useRef<RecordedPoint[]>([]);
  const distanceRef = useRef(0);
  const movingRef = useRef(0);

  const updateStatus = (next: TrackerStatus) => {
    statusRef.current = next;
    setStatus(next);
  };

  const handleLocation = (loc: Location.LocationObject) => {
    if (statusRef.current !== 'tracking') return;
    const point: RecordedPoint = {
      lat: loc.coords.latitude,
      lng: loc.coords.longitude,
      elevationM: loc.coords.altitude ?? null,
      speedMps: loc.coords.speed !== null && loc.coords.speed >= 0 ? loc.coords.speed : null,
      recordedAt: new Date(loc.timestamp).toISOString(),
    };
    if (lastPoint.current) {
      distanceRef.current += haversineMeters(
        lastPoint.current.lat,
        lastPoint.current.lng,
        point.lat,
        point.lng,
      );
      setDistanceM(distanceRef.current);
    }
    lastPoint.current = point;
    pointsRef.current = [...pointsRef.current, point];
    setPoints(pointsRef.current);
  };

  const startTimer = () => {
    if (timer.current) return;
    timer.current = setInterval(() => {
      if (statusRef.current === 'tracking') {
        movingRef.current += 1;
        setMovingSeconds(movingRef.current);
      }
    }, 1000);
  };

  const ensureSubscription = async (): Promise<boolean> => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      updateStatus('denied');
      setError('Location permission is required to record activities');
      return false;
    }
    if (!subscription.current) {
      subscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 5,
          timeInterval: 2000,
        },
        handleLocation,
      );
    }
    return true;
  };

  const cleanup = () => {
    if (subscription.current) {
      subscription.current.remove();
      subscription.current = null;
    }
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  };

  const start = async () => {
    setError(null);
    updateStatus('requesting');
    const ready = await ensureSubscription();
    if (!ready) return;
    startedAt.current = new Date().toISOString();
    startedMs.current = Date.now();
    updateStatus('tracking');
    startTimer();
  };

  const pause = () => {
    if (statusRef.current === 'tracking') {
      lastPoint.current = null;
      updateStatus('paused');
    }
  };

  const resume = () => {
    if (statusRef.current === 'paused') updateStatus('tracking');
  };

  const stop = (): TrackResult => {
    cleanup();
    const elapsedSeconds = startedMs.current
      ? Math.round((Date.now() - startedMs.current) / 1000)
      : movingRef.current;
    const result: TrackResult = {
      points: pointsRef.current,
      movingSeconds: movingRef.current,
      elapsedSeconds,
      startedAt: startedAt.current ?? new Date().toISOString(),
      distanceM: distanceRef.current,
    };
    updateStatus('idle');
    return result;
  };

  const reset = () => {
    cleanup();
    lastPoint.current = null;
    startedAt.current = null;
    startedMs.current = 0;
    pointsRef.current = [];
    distanceRef.current = 0;
    movingRef.current = 0;
    setPoints([]);
    setDistanceM(0);
    setMovingSeconds(0);
    setError(null);
    updateStatus('idle');
  };

  useEffect(() => cleanup, []);

  return { status, points, distanceM, movingSeconds, error, start, pause, resume, stop, reset };
}
