import {
  alignFaceWithLandmarks,
  squareCropFace,
} from "@/lib/face/align";
import { resizeImage, type RgbImage } from "@/lib/face/image-utils";
import { FACE_INPUT_SIZE } from "@/lib/face/constants";
import type { Face as MlKitFace } from "@react-native-ml-kit/face-detection";
import type { Face as VcFace } from "react-native-vision-camera-face-detector";

type Point = { x: number; y: number };

type FaceLike = MlKitFace | VcFace;

function getFiveLandmarks(face: FaceLike): Point[] | null {
  const mlKit = face as MlKitFace;
  if (mlKit.landmarks?.leftEye?.position) {
    const lm = mlKit.landmarks;
    const leftEye = lm.leftEye?.position;
    const rightEye = lm.rightEye?.position;
    const nose = lm.noseBase?.position;
    const mouthLeft = lm.mouthLeft?.position;
    const mouthRight = lm.mouthRight?.position;
    if (leftEye && rightEye && nose && mouthLeft && mouthRight) {
      return [leftEye, rightEye, nose, mouthLeft, mouthRight];
    }
  }

  const vc = face as VcFace;
  const lm = vc.landmarks;
  if (lm?.LEFT_EYE && lm.RIGHT_EYE && lm.NOSE_BASE && lm.MOUTH_LEFT && lm.MOUTH_RIGHT) {
    return [
      { x: lm.LEFT_EYE.x, y: lm.LEFT_EYE.y },
      { x: lm.RIGHT_EYE.x, y: lm.RIGHT_EYE.y },
      { x: lm.NOSE_BASE.x, y: lm.NOSE_BASE.y },
      { x: lm.MOUTH_LEFT.x, y: lm.MOUTH_LEFT.y },
      { x: lm.MOUTH_RIGHT.x, y: lm.MOUTH_RIGHT.y },
    ];
  }

  return null;
}

function getFaceBounds(face: FaceLike) {
  const mlKit = face as MlKitFace;
  if (mlKit.frame?.left != null) {
    return {
      left: mlKit.frame.left,
      top: mlKit.frame.top,
      width: mlKit.frame.width,
      height: mlKit.frame.height,
    };
  }

  const vc = face as VcFace;
  return {
    left: vc.bounds.x,
    top: vc.bounds.y,
    width: vc.bounds.width,
    height: vc.bounds.height,
  };
}

export function prepareAlignedFaceImage(image: RgbImage, face: FaceLike): RgbImage {
  const landmarks = getFiveLandmarks(face);
  if (landmarks) {
    return alignFaceWithLandmarks(image, landmarks);
  }

  const bounds = getFaceBounds(face);
  const squared = squareCropFace(image, bounds);
  return resizeImage(squared, FACE_INPUT_SIZE);
}
