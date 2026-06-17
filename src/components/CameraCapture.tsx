import { useState, useRef, useEffect } from 'react';
import { Camera, X, Check, RotateCcw, Trash2 } from 'lucide-react';
import type { PhotoType } from '@/types';
import { PHOTO_TYPE_LABELS } from '@/types';
import { capturePhoto, showToast, cn } from '@/utils';

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string, type: PhotoType) => void;
  photoType: PhotoType;
}

export default function CameraCapture({
  isOpen,
  onClose,
  onCapture,
  photoType,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    } else if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setIsReady(false);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, capturedImage]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          setIsReady(true);
        };
      }
    } catch (error) {
      console.error('Camera error:', error);
      showToast('无法访问摄像头，请检查权限设置');
      onClose();
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current || !isReady) return;

    try {
      const dataUrl = await capturePhoto(videoRef.current);
      setCapturedImage(dataUrl);
      stopCamera();
    } catch (error) {
      console.error('Capture error:', error);
      showToast('拍照失败，请重试');
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage, photoType);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center justify-between p-6 bg-black/50 text-white">
        <button
          onClick={onClose}
          className="p-3 rounded-xl hover:bg-white/10 transition-colors"
        >
          <X size={28} />
        </button>
        <h3 className="text-xl font-bold">
          拍摄{PHOTO_TYPE_LABELS[photoType]}
        </h3>
        <div className="w-14" />
      </div>

      <div className="flex-1 flex items-center justify-center bg-black relative">
        {capturedImage ? (
          <img
            src={capturedImage}
            alt="Captured"
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="p-8 bg-black/50 flex items-center justify-center gap-8">
        {capturedImage ? (
          <>
            <button
              onClick={handleRetake}
              className="btn-ghost flex-1 max-w-[200px]"
            >
              <RotateCcw size={28} />
              重拍
            </button>
            <button
              onClick={handleConfirm}
              className="btn-success flex-1 max-w-[200px]"
            >
              <Check size={28} />
              确认
            </button>
          </>
        ) : (
          <button
            onClick={handleCapture}
            disabled={!isReady}
            className={cn(
              'w-24 h-24 rounded-full bg-white flex items-center justify-center transition-all',
              isReady ? 'active:scale-95' : 'opacity-50 cursor-not-allowed'
            )}
          >
            <Camera size={40} className="text-neutral-800" />
          </button>
        )}
      </div>
    </div>
  );
}
