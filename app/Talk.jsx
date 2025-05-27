import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaWalkieTalkie,
  FaUsers,
} from "react-icons/fa6";

const RTC_APP_ID = "a1dd237f3234425fbbea62593bfbf9ad"; // Replace with your actual Agora RTC App ID
const DEFAULT_CHANNEL_NAME = "my-simple-voice-channel";

const VoiceChatComponent = () => {
  const [micMuted, setMicMuted] = useState(true);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeRemoteUids, setActiveRemoteUids] = useState(new Set());
  const [isRemoteUserSpeaking, setIsRemoteUserSpeaking] = useState(false); // New state for remote speaking
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startAnimation, setStartAnimation] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });
  const componentRef = useRef(null);
  const dragStartTime = useRef(0);
  const initialClientPos = useRef({ x: 0, y: 0 });

  const AgoraRTC = useRef(null);
  const rtcClient = useRef(null);
  const localAudioTrack = useRef(null);
  const rtcUid = useRef(Math.floor(Math.random() * 2032));

  const pressSoundRef = useRef(null);

  const playPressSound = useCallback(() => {
    if (pressSoundRef.current) {
      pressSoundRef.current.currentTime = 0;
      pressSoundRef.current
        .play()
        .catch((e) => console.error("Error playing press sound:", e));
    }
  }, []);

  useEffect(() => {
    const setInitialPosition = () => {
      if (componentRef.current) {
        const componentWidth = componentRef.current.offsetWidth;
        const componentHeight = componentRef.current.offsetHeight;
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        const targetX = screenWidth - componentWidth - 20;
        const targetY = screenHeight - componentHeight - 20;

        setPosition({ x: -componentWidth, y: targetY });

        setTimeout(() => {
          setPosition({ x: targetX, y: targetY });
          setStartAnimation(true);
        }, 100);
      }
    };

    setInitialPosition();
    window.addEventListener("resize", setInitialPosition);

    return () => {
      window.removeEventListener("resize", setInitialPosition);
    };
  }, [componentRef.current]);

  useEffect(() => {
    const loadAgoraRTC = async () => {
      if (typeof window !== "undefined") {
        try {
          const rtcMod = await import("agora-rtc-sdk-ng");
          AgoraRTC.current = rtcMod.default;
          console.log("Agora RTC SDK loaded dynamically.");
          setLoading(false);
        } catch (error) {
          console.error("Failed to load Agora RTC SDK:", error);
          setLoading(false);
        }
      }
    };
    loadAgoraRTC();

    return () => {
      if (joined) {
        leaveChannel();
      }
    };
  }, [joined]);

  const joinChannel = useCallback(async () => {
    if (!AgoraRTC.current || loading) {
      console.warn("Agora RTC SDK not loaded yet or still loading.");
      return;
    }

    try {
      console.log("Initializing RTC client...");
      rtcClient.current = AgoraRTC.current.createClient({
        mode: "rtc",
        codec: "vp8",
      });

      // Enable volume indications
      rtcClient.current.enableAudioVolumeIndicator(250); // Interval in ms (e.g., 250ms)

      rtcClient.current.on("user-joined", (user) => {
        console.log(`Remote user joined RTC: UID ${user.uid}`);
        setActiveRemoteUids((prevUids) => new Set(prevUids).add(user.uid));
      });

    rtcClient.current.on("user-published", async (user, mediaType) => {
        console.log(
          `Remote user published: UID ${user.uid}, Media Type: ${mediaType}`
        );
        // Subscribe to the remote user's media
        await rtcClient.current.subscribe(user, mediaType);

        if (mediaType === "audio" && user.audioTrack) {
          user.audioTrack.play();
          console.log(`Subscribed and playing audio for RTC UID: ${user.uid}`);
        } else if (mediaType === "video" && user.videoTrack) {
          // Handle video tracks if you have them, e.g., create a player element
          // user.videoTrack.play(YOUR_VIDEO_ELEMENT_ID);
          console.log(`Subscribed to video for RTC UID: ${user.uid}`);
        }
      });
      rtcClient.current.on("user-left", (user) => {
        console.log(`Remote user left RTC: UID ${user.uid}`);
        setActiveRemoteUids((prevUids) => {
          const newUids = new Set(prevUids);
          newUids.delete(user.uid);
          return newUids;
        });
      });

      rtcClient.current.on("user-unpublished", (user) => {
        console.log(`Remote user unpublished: UID ${user.uid}`);
      });

      // Event for volume indications: detect if any remote user is speaking
      rtcClient.current.on("volume-indicator", (volumes) => {
        const isAnyRemoteSpeaking = volumes.some(
          (volume) => volume.uid !== rtcUid.current && volume.level > 5
        );
        setIsRemoteUserSpeaking(isAnyRemoteSpeaking);
      });

      console.log(
        `Joining RTC channel '${DEFAULT_CHANNEL_NAME}' with UID ${rtcUid.current}...`
      );
      await rtcClient.current.join(
        RTC_APP_ID,
        DEFAULT_CHANNEL_NAME,
        null,
        rtcUid.current
      );
      console.log("RTC channel joined successfully.");

      localAudioTrack.current =
        await AgoraRTC.current.createMicrophoneAudioTrack();
      await localAudioTrack.current.setMuted(true); // Start muted
      await localAudioTrack.current.setVolume(100);
      await rtcClient.current.publish(localAudioTrack.current);
      console.log("Local audio track created and published (muted initially).");

      setJoined(true);
      setMicMuted(true);
      setIsRemoteUserSpeaking(false); // Reset on join

      const initialRemoteUids = rtcClient.current.remoteUsers.map(
        (user) => user.uid
      );
      setActiveRemoteUids(new Set(initialRemoteUids));
    } catch (error) {
      console.error("Failed to join RTC channel:", error);
      alert(`Failed to join voice chat: ${error.message}`);
      setJoined(false);
      setActiveRemoteUids(new Set());
      setIsRemoteUserSpeaking(false); // Reset on error
    }
  }, [loading]);

  useEffect(() => {
    if (!loading && !joined) {
      joinChannel();
    }
  }, [loading, joined, joinChannel]);

  const leaveChannel = useCallback(async () => {
    console.log("Leaving channel...");
    try {
      localAudioTrack.current?.stop();
      localAudioTrack.current?.close();
      await rtcClient.current?.unpublish();
      await rtcClient.current?.leave();
      console.log("Left channel successfully.");
    } catch (error) {
      console.error("Error leaving channel:", error);
    } finally {
      setJoined(false);
      setMicMuted(true);
      setActiveRemoteUids(new Set());
      setIsRemoteUserSpeaking(false); // Reset on leave
      rtcClient.current = null;
      localAudioTrack.current = null;
    }
  }, []);

  const startTalking = useCallback(async () => {
    if (localAudioTrack.current) {
      await localAudioTrack.current.setMuted(false);
      setMicMuted(false);
      console.log("Microphone unmuted (talking).");
      playPressSound();
      // When local user talks, immediately stop remote speaking animation
      setIsRemoteUserSpeaking(false);
    }
  }, [playPressSound]);

  const stopTalking = useCallback(async () => {
    if (localAudioTrack.current) {
      await localAudioTrack.current.setMuted(true);
      setMicMuted(true);
      console.log("Microphone muted (stopped talking).");
      // The volume-indicator event will naturally re-evaluate isRemoteUserSpeaking
    }
  }, []);

  const handleStart = useCallback((e) => {
    if (e.target.closest("button")) {
      return;
    }

    setIsDragging(true);
    dragStartTime.current = Date.now();
    const clientX = e.type.startsWith("touch")
      ? e.touches[0].clientX
      : e.clientX;
    const clientY = e.type.startsWith("touch")
      ? e.touches[0].clientY
      : e.clientY;

    initialClientPos.current = { x: clientX, y: clientY };

    if (componentRef.current) {
      offset.current = {
        x: clientX - componentRef.current.getBoundingClientRect().left,
        y: clientY - componentRef.current.getBoundingClientRect().top,
      };
    }
  }, []);

  const handleMove = useCallback(
    (e) => {
      if (!isDragging) return;
      const clientX = e.type.startsWith("touch")
        ? e.touches[0].clientX
        : e.clientX;
      const clientY = e.type.startsWith("touch")
        ? e.touches[0].clientY
        : e.clientY;

      setPosition({
        x: clientX - offset.current.x,
        y: clientY - offset.current.y,
      });
      if (e.cancelable) {
        e.preventDefault();
      }
    },
    [isDragging]
  );

  const handleEnd = useCallback(
    (e) => {
      setIsDragging(false);

      const dragDuration = Date.now() - dragStartTime.current;
      const CLICK_THRESHOLD_MS = 200;
      const DRAG_THRESHOLD_PX = 5;

      const clientX = e.type.startsWith("touchend")
        ? e.changedTouches[0].clientX
        : e.clientX;
      const clientY = e.type.startsWith("touchend")
        ? e.changedTouches[0].clientY
          ? e.changedTouches[0].clientY
          : e.clientY
        : e.clientY;

      const movedDistance = Math.sqrt(
        Math.pow(clientX - initialClientPos.current.x, 2) +
          Math.pow(clientY - initialClientPos.current.y, 2)
      );

      if (componentRef.current) {
        const componentRect = componentRef.current.getBoundingClientRect();
        const screenWidth = window.innerWidth;
        const componentWidth = componentRect.width;

        const currentX = position.x;
        const currentY = position.y;

        let newX;
        if (currentX + componentWidth / 2 < screenWidth / 2) {
          newX = 20;
        } else {
          newX = screenWidth - componentWidth - 20;
        }

        let newY = Math.max(
          20,
          Math.min(currentY, window.innerHeight - componentRect.height - 20)
        );

        setPosition({ x: newX, y: newY });
      }
    },
    [position]
  );

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchmove", handleMove, { passive: false });
      window.addEventListener("touchend", handleEnd);
    } else {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  const totalActiveUsers = activeRemoteUids.size + (joined ? 1 : 0);

  return (
    <div
      ref={componentRef}
      className={`fixed z-50 rounded-xl shadow-2xl transition-all duration-500 ease-out
                   w-30 h-auto
                   bg-gray-800 border border-gray-700
                   ${joined ? "bg-opacity-95" : "bg-opacity-90"}
                   cursor-grab active:cursor-grabbing
                   ${isRemoteUserSpeaking && micMuted ? "animate-pulse-mic-whole" : ""} `}
      style={{
        left: position.x,
        top: position.y,
        transition: startAnimation ? "left 0.7s ease-out, top 0.3s ease-out" : "none",
      }}
      onMouseDown={handleStart}
      onTouchStart={handleStart}
    >
      <div className="absolute inset-0 z-0"></div>

      <div className="relative flex flex-col p-4 text-white z-10">
        {joined ? (
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="flex items-center text-gray-300 text-base font-semibold space-x-1">
              <FaUsers className="w-4 h-4 text-blue-400" />
              <span>Users: {totalActiveUsers}</span>
            </div>

            <p className="text-sm text-gray-300 text-center">Press to talk</p>

            <button
              onMouseDown={startTalking}
              onMouseUp={stopTalking}
              onTouchStart={startTalking}
              onTouchEnd={stopTalking}
              className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-base select-none transition-all duration-200 ease-in-out transform ${
                micMuted
                  ? "bg-gray-600 hover:bg-gray-500 shadow-lg shadow-gray-900/50"
                  : "bg-green-600 hover:bg-green-700 shadow-xl shadow-green-900/50 animate-pulse-mic"
              } `}
              aria-pressed={!micMuted}
              aria-label={micMuted ? "Hold to talk" : "Release to Stop Talking"}
              title={micMuted ? "Hold to Talk" : "Release to Stop Talking"}
            >
              {micMuted ? (
                <FaMicrophoneSlash className="w-12 h-12 text-gray-300 pointer-events-none select-none" />
              ) : (
                <FaMicrophone className="w-12 h-12 text-white pointer-events-none select-none" />
              )}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-4">
            <FaWalkieTalkie className="w-12 h-12 text-gray-400 mb-2 animate-bounce" />
            <p className="text-sm text-gray-400">Connecting voice chat...</p>
          </div>
        )}
      </div>

      {/* Audio element for press sound */}
      <audio ref={pressSoundRef} src="/press.wav" preload="auto" />

      <style jsx>{`
        @keyframes pulse-mic {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
          }
          70% {
            transform: scale(1.05);
            box-shadow: 0 0 0 15px rgba(34, 197, 94, 0);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
          }
        }
        .animate-pulse-mic {
          animation: pulse-mic 1.5s infinite;
        }

        /* Define a new animation for the whole component if you want a different visual */
        /* For this request, we'll reuse the pulse-mic animation with a new class name */
        .animate-pulse-mic-whole {
            animation: pulse-mic 1.5s infinite; /* Reusing the same animation */
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
        .animate-bounce {
          animation: bounce 1s infinite;
        }
      `}</style>
    </div>
  );
};

export default VoiceChatComponent;