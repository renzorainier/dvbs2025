"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaUsers,
  FaSpinner,
  FaXmark,
  FaPhone,
} from "react-icons/fa6";

const RTC_APP_ID = "d83eb8328dc441d4a539c602282cabd0"; // Replace with your actual Agora RTC App ID
const DEFAULT_CHANNEL_NAME = "my-simple-voice-channel";

const VoiceChatComponent = () => {
  const [micMuted, setMicMuted] = useState(true);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);
const [activeRemoteUids, setActiveRemoteUids] = useState(new Set());
  const [isRemoteUserSpeaking, setIsRemoteUserSpeaking] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startAnimation, setStartAnimation] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showEndCallUI, setShowEndCallUI] = useState(false);
  const [isOverEndCallArea, setIsOverEndCallArea] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [rippleCount, setRippleCount] = useState(3); // New state for ripple count

  const offset = useRef({ x: 0, y: 0 });
  const componentRef = useRef(null);
  const dragStartTime = useRef(0);
  const initialClientPos = useRef({ x: 0, y: 0 });

  const AgoraRTC = useRef(null);
  const rtcClient = useRef(null);
  const localAudioTrack = useRef(null);
  const rtcUid = useRef(Math.floor(Math.random() * 1000000));

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
    const setComponentPosition = () => {
      if (componentRef.current) {
        componentRef.current.offsetWidth; // Force a reflow

        const componentWidth = componentRef.current.offsetWidth;
        const componentHeight = componentRef.current.offsetHeight;
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        const targetX = screenWidth - componentWidth - 20; // 20px padding from right
        const targetY = screenHeight - componentHeight - 20; // 20px padding from bottom

        if (!startAnimation) {
          // Initial slide-in animation from off-screen right
          setPosition({ x: screenWidth, y: targetY });
          setTimeout(() => {
            setPosition({ x: targetX, y: targetY });
            setStartAnimation(true);
          }, 100);
        } else {
          // If already animated, just adjust to new target position
          setPosition((prev) => ({ x: targetX, y: targetY }));
        }
      }
    };

    setComponentPosition();
    window.addEventListener("resize", setComponentPosition);

    if (callEnded) {
      setComponentPosition();
    }

    return () => {
      window.removeEventListener("resize", setComponentPosition);
    };
  }, [componentRef.current, joined, startAnimation, callEnded]);

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

      rtcClient.current.enableAudioVolumeIndicator(250);

      rtcClient.current.on("user-joined", (user) => {
        console.log(`Remote user joined RTC: UID ${user.uid}`);
        setActiveRemoteUids((prevUids) => new Set(prevUids).add(user.uid));
      });

      rtcClient.current.on("user-published", async (user, mediaType) => {
        console.log(
          `Remote user published: UID ${user.uid}, Media Type: ${mediaType}`
        );
        await rtcClient.current.subscribe(user, mediaType);

        if (mediaType === "audio" && user.audioTrack) {
          user.audioTrack.play();
          console.log(`Subscribed and playing audio for RTC UID: ${user.uid}`);
        } else if (mediaType === "video" && user.videoTrack) {
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
      await localAudioTrack.current.setMuted(true);
      await localAudioTrack.current.setVolume(100);
      await rtcClient.current.publish(localAudioTrack.current);
      console.log("Local audio track created and published (muted initially).");

      setJoined(true);
      setMicMuted(true);
      setIsRemoteUserSpeaking(false);
      setCallEnded(false);
      // Removed: setShowDarkOverlay(true) from here
      // The overlay will now be controlled by micMuted

      const initialRemoteUids = rtcClient.current.remoteUsers.map(
        (user) => user.uid
      );
      setActiveRemoteUids(new Set(initialRemoteUids));
    } catch (error) {
      console.error("Failed to join RTC channel:", error);
      alert(`Failed to join voice chat: ${error.message}`);
      setJoined(false);
      setActiveRemoteUids(new Set());
      setIsRemoteUserSpeaking(false);
      setCallEnded(true);
      // Removed: setShowDarkOverlay(false) from here
    }
  }, [loading]);

  useEffect(() => {
    if (!loading && !joined && AgoraRTC.current && !callEnded) {
      joinChannel();
    }
  }, [loading, joined, joinChannel, callEnded]);

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
      setIsRemoteUserSpeaking(false);
      rtcClient.current = null;
      localAudioTrack.current = null;
      setCallEnded(true);
      // Removed: setShowDarkOverlay(false) from here
    }
  }, []);

  const startTalking = useCallback(async () => {
    if (localAudioTrack.current) {
      await localAudioTrack.current.setMuted(false);
      setMicMuted(false); // This will now control the overlay
      console.log("Microphone unmuted (talking).");
      playPressSound();
      setIsRemoteUserSpeaking(false);
    }
  }, [playPressSound]);

  const stopTalking = useCallback(async () => {
    if (localAudioTrack.current) {
      await localAudioTrack.current.setMuted(true);
      setMicMuted(true); // This will now control the overlay
      console.log("Microphone muted (stopped talking).");
    }
  }, []);

  const handleStart = useCallback((e) => {
    // Prevent dragging if a button within the component is clicked
    if (e.target.closest("button")) {
      return;
    }

    setIsDragging(true);
    setShowEndCallUI(true); // Still show the 'X' UI when dragging starts
    // Removed: setShowDarkOverlay(true) from here
    dragStartTime.current = Date.now();

    const clientX = e.type.startsWith("touch")
      ? e.touches[0].clientX
      : e.clientX;
    const clientY = e.type.startsWith("touch")
      ? e.touches[0].clientY
      : e.touches[0].clientY; // Fix for touch events

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

      const newPosition = {
        x: clientX - offset.current.x,
        y: clientY - offset.current.y,
      };
      setPosition(newPosition);

      const endCallAreaCenterX = window.innerWidth / 2;
      const endCallAreaCenterY = 60;
      const endCallAreaRadius = 40;

      const draggableCenterX =
        newPosition.x + (componentRef.current?.offsetWidth || 0) / 2;
      const draggableCenterY =
        newPosition.y + (componentRef.current?.offsetHeight || 0) / 2;

      const distance = Math.sqrt(
        Math.pow(draggableCenterX - endCallAreaCenterX, 2) +
          Math.pow(draggableCenterY - endCallAreaCenterY, 2)
      );

      const collisionThreshold =
        endCallAreaRadius +
        Math.min(
          componentRef.current?.offsetWidth || 0,
          componentRef.current?.offsetHeight || 0
        ) /
          3;
      setIsOverEndCallArea(distance < collisionThreshold);

      if (e.cancelable) {
        e.preventDefault();
      }
    },
    [isDragging]
  );

  const handleEnd = useCallback(
    (e) => {
      setIsDragging(false);
      setShowEndCallUI(false); // Hide the 'X' UI when dragging ends
      // Removed: setShowDarkOverlay logic from here, as it's now controlled by micMuted

      if (componentRef.current) {
        const componentRect = componentRef.current.getBoundingClientRect();
        const screenWidth = window.innerWidth;
        const componentWidth = componentRect.width;

        const currentX = position.x;
        const currentY = position.y;

        if (isOverEndCallArea) {
          console.log("Dropped in end call area. Ending call.");
          leaveChannel();
          const targetX = screenWidth - componentWidth - 20;
          const targetY = window.innerHeight - componentRect.height - 20;
          setPosition({ x: targetX, y: targetY });
          return;
        }

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
    [position, isOverEndCallArea, leaveChannel]
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

  const ACCENT_COLOR_HEX = "#7FCDFF";
  const ACCENT_COLOR_RGB = "127, 205, 255";
  const ACCENT_COLOR_HOVER_LIGHT = "#A0E0FF";

  return (
    <>
      {/* Dark Overlay - Now controlled by !micMuted */}
      {!micMuted &&
        joined && ( // Only show if mic is NOT muted AND we are joined
          <div
            className="fixed inset-0 bg-black transition-opacity duration-300"
            style={{ opacity: 0.6, zIndex: 45 }}></div>
        )}

      {/* End Call UI (the circular 'X' at the top) */}
      {showEndCallUI && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 z-40 shadow-xl`}
          style={{
            backgroundColor: isOverEndCallArea
              ? "rgba(255, 0, 0, 0.9)"
              : "#5C636E",
            color: "#EEEEEE",
            border: `2px solid ${isOverEndCallArea ? "#FF0000" : "#EEEEEE"}`,
            opacity: isOverEndCallArea ? 1 : 0.8,
            boxShadow: isOverEndCallArea
              ? "0 0 20px rgba(255, 0, 0, 0.7)"
              : "0 5px 15px -3px rgba(0,0,0,0.4)",
            zIndex: 51,
          }}>
          <FaXmark
            className={`w-12 h-12 transition-transform duration-200 ${
              isOverEndCallArea ? "scale-125 text-white" : ""
            }`}
          />
        </div>
      )}

      {/* Main Voice Chat Component (draggable) */}
      <div
        ref={componentRef}
        className={`fixed z-50 rounded-xl shadow-2xl transition-all duration-500 ease-out
                        w-auto h-auto min-w-[120px]
                        cursor-grab active:cursor-grabbing
                        ${
                          isRemoteUserSpeaking && micMuted
                            ? "animate-pulse-remote-speaking"
                            : ""
                        } `}
        style={{
          left: position.x,
          top: position.y,
          transition: startAnimation
            ? "left 0.7s ease-out, top 0.3s ease-out"
            : "none",
          backgroundColor: "#393E46",
          borderColor: "#EEEEEE",
          borderWidth: "1px",
          userSelect: "none",
          MozUserSelect: "none",
          WebkitUserSelect: "none",
          msUserSelect: "none",
          display: callEnded && !isDragging ? "none" : "block",
          zIndex: 50,
        }}
        onMouseDown={handleStart}
        onTouchStart={handleStart}>
        <div className="absolute inset-0 z-0"></div>

        {/* New: Ripple elements */}
        {!micMuted &&
          joined &&
          [...Array(rippleCount)].map((_, i) => (
            <div
              key={i}
              className="absolute inset-0 rounded-full animate-full-screen-pulse"
              style={{
                backgroundColor: `rgba(${ACCENT_COLOR_RGB}, 0.7)`,
                zIndex: -1, // Ensure it's behind the component
                animationDelay: `${i * 0.4}s`, // Stagger the animation
                transform: `scale(0)`, // Start small
              }}
            ></div>
          ))}

        <div
          className="relative flex flex-col p-4 z-10"
          style={{ color: "#EEEEEE" }}>
          <div className="flex flex-col items-center justify-center space-y-2">
            {loading ? (
              <>
                <FaSpinner
                  className="w-12 h-12 mb-2 animate-spin-slow"
                  style={{ color: ACCENT_COLOR_HEX }}
                />
                <p className="text-sm font-medium" style={{ color: "#EEEEEE" }}>
                  Connecting...
                </p>
              </>
            ) : (
              <>
                <div
                  className="flex items-center text-base font-semibold space-x-1"
                  style={{ color: "#EEEEEE" }}>
                  <FaUsers
                    className="w-4 h-4"
                    style={{ color: ACCENT_COLOR_HEX }}
                  />
                  <span>Users: {totalActiveUsers}</span>
                </div>

                <p
                  className="text-sm text-center font-medium"
                  style={{ color: "#EEEEEE" }}>
                  Press to talk
                </p>

                <button
                  onMouseDown={startTalking}
                  onMouseUp={stopTalking}
                  onTouchStart={startTalking}
                  onTouchEnd={stopTalking}
                  className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-base select-none transition-all duration-200 ease-in-out transform shadow-lg
                    ${!micMuted ? "animate-pulse-mic" : ""}
                  `}
                  style={{
                    backgroundColor: micMuted ? "#5C636E" : ACCENT_COLOR_HEX,
                    boxShadow: micMuted
                      ? "0 5px 15px -3px rgba(0, 0, 0, 0.4)"
                      : `0 8px 20px -5px rgba(${ACCENT_COLOR_RGB}, 0.6)`,
                    color: "#EEEEEE",
                    cursor: "pointer",
                    border: "2px solid transparent",
                  }}
                  aria-pressed={!micMuted}
                  aria-label={
                    micMuted ? "Hold to talk" : "Release to Stop Talking"
                  }
                  title={micMuted ? "Hold to Talk" : "Release to Stop Talking"}>
                  {micMuted ? (
                    <FaMicrophoneSlash
                      className="w-12 h-12 pointer-events-none select-none"
                      style={{ color: "#EEEEEE" }}
                    />
                  ) : (
                    <FaMicrophone
                      className="w-12 h-12 pointer-events-none select-none"
                      style={{ color: "#EEEEEE" }}
                    />
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        <audio ref={pressSoundRef} src="/press.wav" preload="auto" />
      </div>

      {/* Join Call Button - visible only when callEnded is true and not currently joined */}
      {callEnded && !joined && (
        <button
          onClick={joinChannel}
          className="fixed bottom-5 right-5 z-50 w-24 h-24 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg transition-all duration-300 ease-in-out hover:scale-105"
          style={{
            backgroundColor: ACCENT_COLOR_HEX,
            boxShadow: `0 8px 20px -5px rgba(${ACCENT_COLOR_RGB}, 0.6)`,
            color: "#EEEEEE",
            cursor: "pointer",
          }}>
          <FaPhone className="w-10 h-10" />
        </button>
      )}

      <style jsx>{`
        /* Existing CSS styles */
        @keyframes pulse-mic {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(${ACCENT_COLOR_RGB}, 0.7);
          }
          70% {
            transform: scale(1.05);
            box-shadow: 0 0 0 15px rgba(${ACCENT_COLOR_RGB}, 0);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(${ACCENT_COLOR_RGB}, 0);
          }
        }
        .animate-pulse-mic {
          animation: pulse-mic 1.5s infinite;
        }

        @keyframes pulse-remote-speaking {
          0% {
            border-color: rgba(${ACCENT_COLOR_RGB}, 0.3);
            box-shadow: 0 0 0 0 rgba(${ACCENT_COLOR_RGB}, 0.3);
          }
          50% {
            border-color: rgba(${ACCENT_COLOR_RGB}, 0.8);
            box-shadow: 0 0 0 25px rgba(${ACCENT_COLOR_RGB}, 0);
          }
          100% {
            border-color: rgba(${ACCENT_COLOR_RGB}, 0.3);
            box-shadow: 0 0 0 0 rgba(${ACCENT_COLOR_RGB}, 0);
          }
        }
        .animate-pulse-remote-speaking {
          animation: pulse-remote-speaking 2s infinite ease-out;
        }

        @keyframes spin-slow {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 2s linear infinite;
        }

        @keyframes ring-phone {
          0% {
            transform: rotate(0deg);
          }
          15% {
            transform: rotate(15deg);
          }
          30% {
            transform: rotate(-15deg);
          }
          45% {
            transform: rotate(10deg);
          }
          60% {
            transform: rotate(-10deg);
          }
          75% {
            transform: rotate(5deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }
        .animate-ring-phone {
          animation: ring-phone 2s ease-in-out infinite;
        }

        /* New: Full-screen pulse animation */
        @keyframes full-screen-pulse {
          0% {
            transform: scale(0);
            opacity: 0.7;
          }
          100% {
            transform: scale(9); /* Adjust this value to control how far it radiates */
            opacity: 0;
          }
        }

        .animate-full-screen-pulse {
          animation: full-screen-pulse 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
        }

        /* Direct CSS for button hover effects as they cannot be dynamically set in style prop directly for :hover pseudo-class */
        button {
          transition: background-color 0.2s ease-in-out,
            box-shadow 0.2s ease-in-out;
        }

        button[aria-pressed="false"]:hover {
          background-color: ${ACCENT_COLOR_HEX};
          box-shadow: 0 8px 20px -5px rgba(${ACCENT_COLOR_RGB}, 0.6);
        }

        button[aria-pressed="true"]:hover {
          background-color: ${ACCENT_COLOR_HOVER_LIGHT};
          box-shadow: 0 10px 25px -5px rgba(${ACCENT_COLOR_RGB}, 0.7);
        }
      `}</style>
    </>
  );
};

export default VoiceChatComponent;
