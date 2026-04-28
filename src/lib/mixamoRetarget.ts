import * as THREE from 'three'
import type { VRM, VRMHumanBoneName } from '@pixiv/three-vrm'

// Mixamo bone name → VRM humanoid bone name
const MIXAMO_VRM: Record<string, VRMHumanBoneName> = {
  mixamorigHips:          'hips',
  mixamorigSpine:         'spine',
  mixamorigSpine1:        'chest',
  mixamorigSpine2:        'upperChest',
  mixamorigNeck:          'neck',
  mixamorigHead:          'head',
  mixamorigLeftShoulder:  'leftShoulder',
  mixamorigLeftArm:       'leftUpperArm',
  mixamorigLeftForeArm:   'leftLowerArm',
  mixamorigLeftHand:      'leftHand',
  mixamorigRightShoulder: 'rightShoulder',
  mixamorigRightArm:      'rightUpperArm',
  mixamorigRightForeArm:  'rightLowerArm',
  mixamorigRightHand:     'rightHand',
  mixamorigLeftUpLeg:     'leftUpperLeg',
  mixamorigLeftLeg:       'leftLowerLeg',
  mixamorigLeftFoot:      'leftFoot',
  mixamorigLeftToeBase:   'leftToes',
  mixamorigRightUpLeg:    'rightUpperLeg',
  mixamorigRightLeg:      'rightLowerLeg',
  mixamorigRightFoot:     'rightFoot',
  mixamorigRightToeBase:  'rightToes',
}

/**
 * Retarget a Mixamo FBX AnimationClip to a VRM humanoid skeleton.
 *
 * Coordinate system:
 *   VRM 0.x — scene already rotated π around Y by rotateVRM0, bone local spaces
 *              are in the original +Z-forward frame → no quaternion correction needed.
 *   VRM 1.0 — model faces -Z natively; bone spaces are -Z-forward.
 *              Converting +Z→-Z quaternions via conjugation by 180° Y rotation
 *              simplifies to negating the X and Z components: (x,y,z,w)→(-x,y,-z,w).
 *
 * Non-hips position tracks are dropped to avoid unwanted root-motion drift.
 */
export function retargetMixamoClip(clip: THREE.AnimationClip, vrm: VRM): THREE.AnimationClip {
  const isVrm0 = (vrm.meta as any)?.metaVersion === '0'
  const tracks: THREE.KeyframeTrack[] = []

  for (const track of clip.tracks) {
    const dot = track.name.lastIndexOf('.')
    if (dot === -1) continue
    const mixamoName = track.name.slice(0, dot)
    const prop       = track.name.slice(dot + 1)

    const vrmBone = MIXAMO_VRM[mixamoName]
    if (!vrmBone) continue
    const node = vrm.humanoid.getRawBoneNode(vrmBone)
    if (!node) continue

    const targetName = `${node.name}.${prop}`
    const values     = new Float32Array(track.values)

    if (prop === 'quaternion') {
      if (!isVrm0) {
        for (let i = 0; i < values.length; i += 4) {
          values[i]     *= -1  // negate x
          values[i + 2] *= -1  // negate z
        }
      }
      tracks.push(new THREE.QuaternionKeyframeTrack(targetName, track.times, values))

    } else if (prop === 'position' && vrmBone === 'hips') {
      if (!isVrm0) {
        for (let i = 0; i < values.length; i += 3) {
          values[i]     *= -1  // negate x
          values[i + 2] *= -1  // negate z
        }
      }
      tracks.push(new THREE.VectorKeyframeTrack(targetName, track.times, values))
    }
  }

  return new THREE.AnimationClip('mixamo', clip.duration, tracks)
}
