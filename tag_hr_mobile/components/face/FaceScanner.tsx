import { REQUIRED_CAPTURE_FRAMES } from "@/lib/face/constants";

import { getErrorMessage } from "@/lib/face/errors";

import {
  BlinkLivenessTracker,
  checkEyesOpen,
  checkPoseLiveness,
  type DetectedFace,
} from "@/lib/face/liveness";

import {

  getCaptureEmbeddingVariants,

  verifyCaptureBatches,

} from "@/lib/face/verify";

import FaceScannerOverlay from "@/components/face/FaceScannerOverlay";

import { FaceScanPermission } from "@/components/face/FaceScanShell";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Dimensions, StyleSheet, View } from "react-native";

import {

  Camera,

  CommonResolutions,

  useCameraDevice,

  useCameraPermission,

  usePhotoOutput,

} from "react-native-vision-camera";

import {

  createFaceDetectorOutput,

  type Face,

} from "react-native-vision-camera-face-detector";



type Props = {

  referenceEmbeddings: number[][];

  userNik?: string;

  onVerified: (score: number) => void;

  onCancel: () => void;

  title?: string;

  subtitle?: string;

};



function mapFace(face: Face): DetectedFace {

  return {

    yawAngle: face.yawAngle,

    pitchAngle: face.pitchAngle,

    rollAngle: face.rollAngle,

    leftEyeOpenProbability: face.leftEyeOpenProbability,

    rightEyeOpenProbability: face.rightEyeOpenProbability,

    bounds: {

      width: face.bounds.width,

      height: face.bounds.height,

    },

  };

}



export default function FaceScanner({

  referenceEmbeddings,

  userNik,

  onVerified,

  onCancel,

  title,

  subtitle,

}: Props) {

  const { width: windowWidth, height: windowHeight } = Dimensions.get("window");

  const device = useCameraDevice("front");

  const { hasPermission, requestPermission } = useCameraPermission();

  const photoOutput = usePhotoOutput({

    targetResolution: CommonResolutions.VGA_4_3,

    containerFormat: "jpeg",

    quality: 0.88,

    qualityPrioritization: "quality",

  });



  const [statusMessage, setStatusMessage] = useState("Mempersiapkan kamera...");

  const [captureCount, setCaptureCount] = useState(0);

  const [isProcessing, setIsProcessing] = useState(false);

  const [livenessOk, setLivenessOk] = useState(false);

  const [blinkOk, setBlinkOk] = useState(false);

  const [cameraReady, setCameraReady] = useState(false);

  const [autoCapturePaused, setAutoCapturePaused] = useState(false);



  const captureBatchesRef = useRef<number[][][]>([]);

  const lastCaptureAtRef = useRef(0);

  const stableSinceRef = useRef<number | null>(null);

  const processingRef = useRef(false);

  const capturingRef = useRef(false);

  const cooldownUntilRef = useRef(0);

  const failedRoundsRef = useRef(0);

  const blinkTrackerRef = useRef(new BlinkLivenessTracker());

  const handleFacesDetectedRef = useRef<(faces: Face[]) => void>(() => {});

  const handleFaceErrorRef = useRef<(error: Error) => void>(() => {});



  const MAX_FAILED_ROUNDS = 5;

  const CAPTURE_COOLDOWN_MS = 1500;

  const FAIL_COOLDOWN_MS = 2500;

  const STABLE_FACE_MS = 600;



  const markCameraReady = useCallback(() => {

    setCameraReady(true);

    setStatusMessage("Hadapkan wajah ke kamera");

  }, []);



  useEffect(() => {

    if (!hasPermission) {

      void requestPermission();

    }

  }, [hasPermission, requestPermission]);



  useEffect(() => {

    if (cameraReady) return;



    const timeout = setTimeout(() => {

      setStatusMessage(

        "Kamera belum merespons. Tutup aplikasi lain yang memakai kamera, lalu coba lagi.",

      );

    }, 10000);



    return () => clearTimeout(timeout);

  }, [cameraReady]);



  const processCapture = useCallback(

    async (uri: string) => {

      if (processingRef.current) return;

      processingRef.current = true;

      setIsProcessing(true);

      setStatusMessage("Memverifikasi wajah...");



      try {

        cooldownUntilRef.current = Date.now() + CAPTURE_COOLDOWN_MS;



        const variants = await getCaptureEmbeddingVariants(uri);

        captureBatchesRef.current.push(variants);

        const sampleCount = captureBatchesRef.current.length;

        setCaptureCount(sampleCount);



        setStatusMessage("Membandingkan dengan foto profil...");

        const result = await verifyCaptureBatches(

          captureBatchesRef.current,

          referenceEmbeddings,

          { nik: userNik },

        );



        if (!result.verified) {

          failedRoundsRef.current += 1;

          captureBatchesRef.current = [];

          setCaptureCount(0);

          stableSinceRef.current = null;

          cooldownUntilRef.current = Date.now() + FAIL_COOLDOWN_MS;



          if (failedRoundsRef.current >= MAX_FAILED_ROUNDS) {

            setAutoCapturePaused(true);

            setStatusMessage(

              `${result.message} Sesuaikan pencahayaan atau perbarui foto profil, lalu coba lagi.`,

            );

            return;

          }



          setStatusMessage(result.message);

          return;

        }



        failedRoundsRef.current = 0;

        onVerified(result.score);

      } catch (error) {

        failedRoundsRef.current += 1;

        captureBatchesRef.current = [];

        setCaptureCount(0);

        stableSinceRef.current = null;

        cooldownUntilRef.current = Date.now() + FAIL_COOLDOWN_MS;

        setStatusMessage(getErrorMessage(error, "Verifikasi gagal."));

      } finally {

        processingRef.current = false;

        setIsProcessing(false);

      }

    },

    [onVerified, referenceEmbeddings, userNik],

  );



  const resetCaptureState = useCallback(() => {

    captureBatchesRef.current = [];

    setCaptureCount(0);

    stableSinceRef.current = null;

    failedRoundsRef.current = 0;

    cooldownUntilRef.current = 0;

    blinkTrackerRef.current.reset();

    setBlinkOk(false);

    setAutoCapturePaused(false);

    setStatusMessage("Hadapkan wajah ke kamera");

  }, []);



  const tryCapture = useCallback(async () => {

    const now = Date.now();

    if (

      processingRef.current ||

      capturingRef.current ||

      autoCapturePaused ||

      !cameraReady ||

      now < cooldownUntilRef.current ||

      captureBatchesRef.current.length >= REQUIRED_CAPTURE_FRAMES

    ) {

      return;

    }



    if (now - lastCaptureAtRef.current < CAPTURE_COOLDOWN_MS) return;

    lastCaptureAtRef.current = now;

    capturingRef.current = true;



    try {

      const photoFile = await photoOutput.capturePhotoToFile(

        { flashMode: "off" },

        {},

      );

      const uri = photoFile.filePath.startsWith("file://")

        ? photoFile.filePath

        : `file://${photoFile.filePath}`;

      await processCapture(uri);

    } catch {

      cooldownUntilRef.current = Date.now() + FAIL_COOLDOWN_MS;

      setStatusMessage("Gagal mengambil foto. Coba lagi.");

    } finally {

      capturingRef.current = false;

    }

  }, [autoCapturePaused, cameraReady, photoOutput, processCapture]);



  const handleFacesDetected = useCallback(

    (faces: Face[]) => {

      const now = Date.now();

      if (

        processingRef.current ||

        capturingRef.current ||

        autoCapturePaused ||

        now < cooldownUntilRef.current ||

        captureBatchesRef.current.length >= REQUIRED_CAPTURE_FRAMES

      ) {

        return;

      }



      if (faces.length === 0) {

        stableSinceRef.current = null;

        setLivenessOk(false);

        if (!isProcessing) {

          setStatusMessage("Hadapkan wajah ke kamera");

        }

        return;

      }



      if (faces.length > 1) {

        stableSinceRef.current = null;

        setLivenessOk(false);

        setStatusMessage("Hanya satu wajah yang boleh terlihat");

        return;

      }



      const mapped = mapFace(faces[0]);

      const pose = checkPoseLiveness(mapped, windowWidth);

      if (!pose.ok) {

        blinkTrackerRef.current.reset();

        setBlinkOk(false);

        setLivenessOk(false);

        if (!isProcessing) {

          setStatusMessage(pose.message);

        }

        stableSinceRef.current = null;

        return;

      }



      if (!blinkTrackerRef.current.isDone()) {

        const blink = blinkTrackerRef.current.update(mapped);

        setBlinkOk(blink.ok);

        setLivenessOk(false);

        if (!isProcessing) {

          setStatusMessage(blink.message);

        }

        stableSinceRef.current = null;

        return;

      }



      const eyes = checkEyesOpen(mapped);

      setBlinkOk(true);

      setLivenessOk(eyes.ok);

      if (!isProcessing) {

        setStatusMessage(eyes.ok ? "Tahan sebentar..." : eyes.message);

      }



      if (!eyes.ok || !cameraReady) {

        stableSinceRef.current = null;

        return;

      }



      if (stableSinceRef.current == null) {

        stableSinceRef.current = now;

        return;

      }



      if (now - stableSinceRef.current >= STABLE_FACE_MS) {

        void tryCapture();

        stableSinceRef.current = null;

      }

    },

    [autoCapturePaused, cameraReady, isProcessing, tryCapture, windowWidth],

  );



  const handleFaceError = useCallback((error: Error) => {

    setStatusMessage(

      getErrorMessage(error, "Deteksi wajah gagal. Coba tutup dan buka ulang scan."),

    );

  }, []);



  handleFacesDetectedRef.current = handleFacesDetected;

  handleFaceErrorRef.current = handleFaceError;



  const faceOutput = useMemo(

    () =>

      createFaceDetectorOutput({

        onFacesDetected: (faces) => handleFacesDetectedRef.current(faces),

        onError: (error) => handleFaceErrorRef.current(error),

        runClassifications: true,

        runLandmarks: true,

        performanceMode: "fast",

        minFaceSize: 0.12,

        autoMode: true,

        windowWidth,

        windowHeight,

        cameraFacing: "front",

      }),

    [windowWidth, windowHeight],

  );



  const outputs = useMemo(

    () => [faceOutput, photoOutput],

    [faceOutput, photoOutput],

  );



  if (!hasPermission) {

    return (

      <FaceScanPermission

        title="Akses Kamera Diperlukan"

        message="Izinkan kamera untuk verifikasi identitas saat presensi. Data wajah diproses di perangkat Anda."

        primaryLabel="Izinkan Kamera"

        onPrimary={requestPermission}

        onCancel={onCancel}

      />

    );

  }



  if (!device) {

    return (

      <FaceScanPermission

        title="Kamera Tidak Tersedia"

        message="Kamera depan tidak ditemukan di perangkat ini."

        primaryLabel="Kembali"

        onPrimary={onCancel}

        onCancel={onCancel}

      />

    );

  }



  return (

    <View style={styles.container}>

      <Camera

        style={StyleSheet.absoluteFill}

        device={device}

        isActive

        outputs={outputs}

        onStarted={markCameraReady}

        onPreviewStarted={markCameraReady}

        onStopped={() => {

          setCameraReady(false);

          setStatusMessage("Mempersiapkan kamera...");

        }}

        onError={(error) => {

          setStatusMessage(

            getErrorMessage(error, "Kamera mengalami error. Coba buka ulang scan."),

          );

        }}

      />



      <FaceScannerOverlay

        windowWidth={windowWidth}

        windowHeight={windowHeight}

        statusMessage={statusMessage}

        livenessOk={livenessOk}

        blinkOk={blinkOk}

        isProcessing={isProcessing}

        cameraReady={cameraReady}

        autoCapturePaused={autoCapturePaused}

        captureCount={captureCount}

        title={title}

        subtitle={subtitle}

        onCancel={onCancel}

        onRetry={resetCaptureState}

      />

    </View>

  );

}



const styles = StyleSheet.create({

  container: {

    flex: 1,

    backgroundColor: "#000",

  },

});


