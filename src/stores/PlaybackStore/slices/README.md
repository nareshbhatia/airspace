# PlaybackStore slices

## Merge order (`createPlaybackStore.ts`)

1. **`elapsedTimeSlice`** — `elapsedMs` and internal `_tick`
2. **`playbackControlSlice`** — `isPlaying`, `play`, `pause`, `reset`

`reset` in the control slice also clears `elapsedMs` (cross-slice write via immer draft).

## Public vs internal

| Method                   | Slice       | Caller             |
| ------------------------ | ----------- | ------------------ |
| `play`, `pause`, `reset` | control     | `DroneServiceImpl` |
| `_tick`                  | elapsedTime | `DroneServiceImpl` |

Components read `isPlaying` and `elapsedMs` only; playback commands go through `DroneService`.

## Control flow

```
User clicks "Play" → Component calls DroneService.play()
  → DroneServiceImpl starts the RxJS interval
  → DroneServiceImpl calls playbackStore.getState().play() to update UI state
```

The service is the source of truth for what is actually running. This store reflects that state for the React layer.
