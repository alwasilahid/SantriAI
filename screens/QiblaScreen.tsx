import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass, MapPin, Navigation, RefreshCw, Smartphone } from 'lucide-react';

const KAABA_COORDS = { lat: 21.422487, lng: 39.826206 };

const QiblaScreen: React.FC = () => {
  const navigate = useNavigate();
  
  // State
  const [heading, setHeading] = useState<number>(0); // Arah hadap HP (0 = Utara)
  const [qiblaBearing, setQiblaBearing] = useState<number>(0); // Sudut Ka'bah dari Utara
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [calibrationMode, setCalibrationMode] = useState(false);

  // --- 1. CALCULATE QIBLA ANGLE ---
  const calculateQibla = (lat: number, lng: number) => {
    const PI = Math.PI;
    const lat1 = (lat * PI) / 180;
    const lng1 = (lng * PI) / 180;
    const lat2 = (KAABA_COORDS.lat * PI) / 180;
    const lng2 = (KAABA_COORDS.lng * PI) / 180;

    const dLng = lng2 - lng1;
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    
    let brng = Math.atan2(y, x);
    brng = (brng * 180) / PI;
    brng = (brng + 360) % 360; // Normalize to 0-360

    return brng;
  };

  // --- 2. GET LOCATION ---
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });
          const bearing = calculateQibla(latitude, longitude);
          setQiblaBearing(bearing);
        },
        (err) => {
          setError("Izin lokasi diperlukan untuk menghitung arah Ka'bah secara akurat.");
          // Fallback Jakarta default if denied
          setQiblaBearing(295); 
        },
        { enableHighAccuracy: true }
      );
    } else {
      setError("Perangkat tidak mendukung Geolocation.");
    }
  }, []);

  // --- 3. HANDLE DEVICE ORIENTATION (COMPASS) ---
  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    let compass = 0;
    
    // iOS (WebKit) Specific
    if ((event as any).webkitCompassHeading) {
      compass = (event as any).webkitCompassHeading;
    } 
    // Android / Standard
    else if (event.alpha !== null) {
      compass = Math.abs(event.alpha - 360);
    }

    setHeading(compass);
  }, []);

  const requestAccess = async () => {
    // iOS 13+ requires permission request
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') {
          setPermissionGranted(true);
          window.addEventListener('deviceorientation', handleOrientation);
        } else {
          setError("Izin akses sensor kompas ditolak.");
        }
      } catch (e) {
        setError("Gagal meminta izin sensor.");
      }
    } else {
      // Non-iOS or older devices usually don't need explicit permission request function
      setPermissionGranted(true);
      window.addEventListener('deviceorientation', handleOrientation);
    }
  };

  useEffect(() => {
    // Try auto-connect for Android
    if (!permissionGranted && !(typeof (DeviceOrientationEvent as any).requestPermission === 'function')) {
        window.addEventListener('deviceorientation', handleOrientation);
        setPermissionGranted(true);
    }
    
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [handleOrientation, permissionGranted]);

  // --- VISUAL CALCULATION ---
  // We rotate the Compass Dial opposite to Heading so North stays North visually.
  // The Qibla Needle rotates relative to the Dial.
  
  // Logic:
  // Dial Rotation = -heading
  // Qibla Marker Rotation (Inside Dial) = qiblaBearing (Fixed relative to North on the dial)
  
  // Simplified for UI: Rotate the whole disk so the Qibla Needle points UP when aligned.
  // Needle Offset = qiblaBearing - heading. 
  // If (qiblaBearing - heading) is 0, we are facing Qibla.

  const isAligned = Math.abs(heading - qiblaBearing) < 5 || Math.abs((heading - qiblaBearing) + 360) < 5;

  // Haptic Feedback when aligned
  useEffect(() => {
    if (isAligned && navigator.vibrate) {
        navigator.vibrate(50);
    }
  }, [isAligned]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm px-4 py-3 flex items-center gap-3 transition-colors">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
          <Compass size={20} className="text-santri-green" />
          Arah Kiblat
        </h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        
        {/* Permission Request (iOS mostly) */}
        {!permissionGranted && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                <Smartphone size={48} className="text-white mb-4 animate-pulse" />
                <h3 className="text-xl font-bold text-white mb-2">Izin Kompas Diperlukan</h3>
                <p className="text-slate-300 text-sm mb-6">Izinkan akses sensor gerak agar kompas dapat bekerja dengan akurat di perangkat Anda.</p>
                <button 
                  onClick={requestAccess}
                  className="px-6 py-3 bg-santri-green text-white rounded-full font-bold shadow-lg active:scale-95 transition-transform"
                >
                    Izinkan Sensor
                </button>
            </div>
        )}

        {/* Location Info */}
        <div className="absolute top-4 left-0 right-0 px-6 flex justify-between items-start z-10">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                    <MapPin size={14} className="text-red-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Posisi Anda</span>
                </div>
                <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                    {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "Mencari Lokasi..."}
                </p>
            </div>
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-right">
                <div className="flex items-center gap-2 mb-1 justify-end">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Sudut Kiblat</span>
                    <Navigation size={14} className="text-santri-green" />
                </div>
                <p className="text-xs font-mono font-bold text-santri-green dark:text-santri-gold">
                    {qiblaBearing.toFixed(1)}°
                </p>
            </div>
        </div>

        {/* COMPASS UI */}
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
            
            {/* Outer Ring (Static decoration) */}
            <div className={`absolute inset-0 rounded-full border-4 ${isAligned ? 'border-santri-green shadow-[0_0_30px_rgba(0,128,0,0.5)]' : 'border-slate-200 dark:border-slate-700'} transition-all duration-500`}></div>
            <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                <div className="w-1 h-4 bg-red-500 rounded-full"></div>
            </div>

            {/* Rotating Dial (The Compass Plate) */}
            <div 
                className="w-full h-full rounded-full relative transition-transform duration-300 ease-out will-change-transform bg-white dark:bg-slate-800 shadow-2xl border border-slate-100 dark:border-slate-700"
                style={{ transform: `rotate(${-heading}deg)` }}
            >
                {/* Cardinal Points */}
                <span className="absolute top-4 left-1/2 -translate-x-1/2 font-bold text-red-500">N</span>
                <span className="absolute bottom-4 left-1/2 -translate-x-1/2 font-bold text-slate-400">S</span>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">E</span>
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">W</span>

                {/* Degree Ticks */}
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                    <div 
                        key={deg}
                        className="absolute w-full h-full left-0 top-0"
                        style={{ transform: `rotate(${deg}deg)` }}
                    >
                        <div className="w-0.5 h-2 bg-slate-300 dark:bg-slate-600 mx-auto mt-2"></div>
                    </div>
                ))}

                {/* KAABA POINTER (The Target) */}
                {/* This pointer is fixed RELATIVE TO NORTH on the dial. */}
                <div 
                    className="absolute w-full h-full left-0 top-0 transition-opacity duration-500"
                    style={{ transform: `rotate(${qiblaBearing}deg)` }}
                >
                    <div className="flex flex-col items-center pt-8">
                        {/* Kaaba Icon / Arrow */}
                        <div className={`transition-all duration-300 ${isAligned ? 'scale-125' : 'scale-100'}`}>
                             <div className="w-8 h-8 bg-black border-2 border-santri-gold rounded-md relative flex items-center justify-center shadow-lg">
                                <div className="w-full h-[1px] bg-santri-gold absolute top-2"></div>
                             </div>
                             {/* Arrow Body */}
                             <div className={`w-1 h-20 mx-auto mt-2 rounded-full ${isAligned ? 'bg-santri-green' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Center Pivot */}
            <div className="absolute w-4 h-4 bg-slate-200 dark:bg-slate-600 rounded-full border-2 border-white dark:border-slate-800 z-20"></div>
        </div>

        {/* Status Text */}
        <div className="mt-12 text-center">
            {isAligned ? (
                <div className="animate-bounce">
                    <h2 className="text-2xl font-bold text-santri-green dark:text-santri-gold mb-1">KIBLAT DITEMUKAN</h2>
                    <p className="text-slate-500 text-sm">Arah hadap sudah sesuai.</p>
                </div>
            ) : (
                <>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">
                        {Math.round(heading)}°
                    </h2>
                    <p className="text-slate-400 text-sm">Putar badan Anda mencari ikon Ka'bah</p>
                </>
            )}
        </div>

        {/* Error Message */}
        {error && (
            <div className="absolute bottom-20 px-4 py-2 bg-red-100 text-red-600 text-xs rounded-lg text-center max-w-[80%]">
                {error}
            </div>
        )}

        {/* Calibration Tip */}
        <button 
           onClick={() => setCalibrationMode(!calibrationMode)}
           className="absolute bottom-6 flex items-center gap-2 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
           <RefreshCw size={12} /> 
           {calibrationMode ? "Sembunyikan Tips" : "Akurasi Rendah? Kalibrasi"}
        </button>

        {calibrationMode && (
            <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 z-40 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
                <RefreshCw size={48} className="text-santri-green mb-4 animate-spin-slow" />
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">Kalibrasi Kompas</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm mb-6 leading-relaxed">
                    Gerakkan HP Anda membentuk angka <strong>8</strong> (delapan) di udara beberapa kali untuk mengkalibrasi sensor magnetometer. Jauhkan dari benda logam atau magnet.
                </p>
                <button 
                   onClick={() => setCalibrationMode(false)}
                   className="px-6 py-2 bg-slate-200 dark:bg-slate-800 rounded-full text-sm font-bold text-slate-700 dark:text-slate-300"
                >
                   Selesai
                </button>
            </div>
        )}

      </div>
    </div>
  );
};

export default QiblaScreen;