"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { io, Socket } from "socket.io-client";

type Message = {
  roomId: string;
  username: string;
  message: string;
  time: string;
  type?: "user" | "system";
};

type ThemeName =
  | "rose-night"
  | "moonlight"
  | "sunset-love"
  | "lavender-dream"
  | "cozy-rain";

type RoomMeta = {
  title: string;
  pinnedNote: string;
  mode: string;
  theme: ThemeName;
};

type FloatingReaction = {
  id: string;
  emoji: string;
  username?: string;
  time?: number;
  left?: number;
  duration?: number;
  size?: number;
};

type YouTubeVideo = {
  videoId: string;
  title: string;
  channelTitle: string;
  description?: string;
  thumbnail: string;
  publishedAt?: string;
  views?: string;
};

type ThemeConfig = {
  pageBackground: string;
  panelBackground: string;
  panelBorder: string;
  heroBadgeBackground: string;
  heroBadgeBorder: string;
  heroBadgeText: string;
  heroTitle: string;
  heroDescription: string;
  heroOrbOne: string;
  heroOrbTwo: string;
  heroAccentSoft: string;
  primaryButton: string;
  primaryShadow: string;
  secondaryButton: string;
  secondaryShadow: string;
  accentButton: string;
  accentShadow: string;
  dangerButton: string;
  dangerShadow: string;
  successButton: string;
  successShadow: string;
  inputBackground: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;
  mutedSurface: string;
  mutedSurfaceBorder: string;
  cardSurface: string;
  cardBorder: string;
  softText: string;
  strongText: string;
  subtleText: string;
  systemBubble: string;
  ownMessage: string;
  otherMessage: string;
  chipBackground: string;
  chipBorder: string;
  chipText: string;
  pinnedBackground: string;
  pinnedBorder: string;
  reactionGlow: string;
  videoShell: string;
};

const themes: Record<ThemeName, ThemeConfig> = {
  "rose-night": {
    pageBackground:
      "radial-gradient(circle at top left, rgba(244,114,182,0.18) 0%, transparent 24%), radial-gradient(circle at top right, rgba(192,132,252,0.18) 0%, transparent 26%), radial-gradient(circle at bottom center, rgba(251,113,133,0.14) 0%, transparent 28%), linear-gradient(135deg, #120816 0%, #1f1028 42%, #0f0615 100%)",
    panelBackground:
      "linear-gradient(180deg, rgba(30,12,43,0.92), rgba(12,6,24,0.94))",
    panelBorder: "1px solid rgba(255,255,255,0.08)",
    heroBadgeBackground: "rgba(244,114,182,0.12)",
    heroBadgeBorder: "1px solid rgba(251,113,133,0.20)",
    heroBadgeText: "#fbcfe8",
    heroTitle: "#fff1f7",
    heroDescription: "#f9a8d4",
    heroOrbOne: "rgba(244,114,182,0.14)",
    heroOrbTwo: "rgba(192,132,252,0.14)",
    heroAccentSoft: "rgba(251,113,133,0.14)",
    primaryButton: "linear-gradient(135deg, #fb7185, #e11d48)",
    primaryShadow: "0 12px 28px rgba(225,29,72,0.28)",
    secondaryButton: "linear-gradient(135deg, #c084fc, #9333ea)",
    secondaryShadow: "0 12px 24px rgba(147,51,234,0.24)",
    accentButton: "linear-gradient(135deg, #f472b6, #ec4899)",
    accentShadow: "0 12px 24px rgba(236,72,153,0.22)",
    dangerButton: "linear-gradient(135deg, #ef4444, #dc2626)",
    dangerShadow: "0 10px 24px rgba(220,38,38,0.22)",
    successButton: "linear-gradient(135deg, #22c55e, #15803d)",
    successShadow: "0 12px 24px rgba(21,128,61,0.25)",
    inputBackground: "rgba(20, 10, 31, 0.88)",
    inputBorder: "1px solid rgba(255,255,255,0.10)",
    inputText: "#fff7fb",
    inputPlaceholder: "#fbcfe8",
    mutedSurface: "rgba(14,7,22,0.92)",
    mutedSurfaceBorder: "1px solid rgba(255,255,255,0.06)",
    cardSurface: "rgba(255,255,255,0.08)",
    cardBorder: "1px solid rgba(255,255,255,0.08)",
    softText: "#ffe4ef",
    strongText: "#fff1f7",
    subtleText: "#fbcfe8",
    systemBubble: "rgba(255,255,255,0.06)",
    ownMessage: "linear-gradient(135deg, #ec4899, #db2777)",
    otherMessage:
      "linear-gradient(135deg, rgba(49,20,62,0.96), rgba(28,13,40,0.96))",
    chipBackground: "rgba(251,113,133,0.14)",
    chipBorder: "1px solid rgba(251,113,133,0.16)",
    chipText: "#ffe4ef",
    pinnedBackground:
      "linear-gradient(135deg, rgba(251,113,133,0.14), rgba(192,132,252,0.10))",
    pinnedBorder: "1px solid rgba(251,113,133,0.16)",
    reactionGlow: "drop-shadow(0 8px 18px rgba(244,114,182,0.35))",
    videoShell:
      "linear-gradient(180deg, rgba(20,7,24,1), rgba(39,17,49,1))",
  },
  moonlight: {
    pageBackground:
      "radial-gradient(circle at top left, rgba(96,165,250,0.16) 0%, transparent 24%), radial-gradient(circle at top right, rgba(167,139,250,0.16) 0%, transparent 26%), radial-gradient(circle at bottom center, rgba(148,163,184,0.12) 0%, transparent 28%), linear-gradient(135deg, #07111f 0%, #10192b 42%, #050913 100%)",
    panelBackground:
      "linear-gradient(180deg, rgba(12,22,41,0.92), rgba(7,12,24,0.94))",
    panelBorder: "1px solid rgba(191,219,254,0.10)",
    heroBadgeBackground: "rgba(96,165,250,0.12)",
    heroBadgeBorder: "1px solid rgba(147,197,253,0.18)",
    heroBadgeText: "#dbeafe",
    heroTitle: "#eff6ff",
    heroDescription: "#bfdbfe",
    heroOrbOne: "rgba(96,165,250,0.16)",
    heroOrbTwo: "rgba(167,139,250,0.14)",
    heroAccentSoft: "rgba(148,163,184,0.12)",
    primaryButton: "linear-gradient(135deg, #60a5fa, #2563eb)",
    primaryShadow: "0 12px 28px rgba(37,99,235,0.28)",
    secondaryButton: "linear-gradient(135deg, #a78bfa, #7c3aed)",
    secondaryShadow: "0 12px 24px rgba(124,58,237,0.22)",
    accentButton: "linear-gradient(135deg, #38bdf8, #0284c7)",
    accentShadow: "0 12px 24px rgba(2,132,199,0.22)",
    dangerButton: "linear-gradient(135deg, #ef4444, #dc2626)",
    dangerShadow: "0 10px 24px rgba(220,38,38,0.22)",
    successButton: "linear-gradient(135deg, #22c55e, #15803d)",
    successShadow: "0 12px 24px rgba(21,128,61,0.25)",
    inputBackground: "rgba(9, 16, 32, 0.88)",
    inputBorder: "1px solid rgba(191,219,254,0.10)",
    inputText: "#eff6ff",
    inputPlaceholder: "#bfdbfe",
    mutedSurface: "rgba(7,12,24,0.92)",
    mutedSurfaceBorder: "1px solid rgba(191,219,254,0.08)",
    cardSurface: "rgba(255,255,255,0.06)",
    cardBorder: "1px solid rgba(191,219,254,0.08)",
    softText: "#dbeafe",
    strongText: "#eff6ff",
    subtleText: "#bfdbfe",
    systemBubble: "rgba(255,255,255,0.05)",
    ownMessage: "linear-gradient(135deg, #3b82f6, #2563eb)",
    otherMessage:
      "linear-gradient(135deg, rgba(17,24,39,0.96), rgba(15,23,42,0.96))",
    chipBackground: "rgba(96,165,250,0.12)",
    chipBorder: "1px solid rgba(147,197,253,0.16)",
    chipText: "#dbeafe",
    pinnedBackground:
      "linear-gradient(135deg, rgba(96,165,250,0.14), rgba(167,139,250,0.10))",
    pinnedBorder: "1px solid rgba(147,197,253,0.16)",
    reactionGlow: "drop-shadow(0 8px 18px rgba(96,165,250,0.35))",
    videoShell:
      "linear-gradient(180deg, rgba(7,12,24,1), rgba(17,24,39,1))",
  },
  "sunset-love": {
    pageBackground:
      "radial-gradient(circle at top left, rgba(251,146,60,0.18) 0%, transparent 24%), radial-gradient(circle at top right, rgba(244,114,182,0.16) 0%, transparent 26%), radial-gradient(circle at bottom center, rgba(250,204,21,0.12) 0%, transparent 28%), linear-gradient(135deg, #1b0c0a 0%, #32110d 42%, #120707 100%)",
    panelBackground:
      "linear-gradient(180deg, rgba(49,18,16,0.92), rgba(24,9,8,0.94))",
    panelBorder: "1px solid rgba(254,215,170,0.10)",
    heroBadgeBackground: "rgba(251,146,60,0.12)",
    heroBadgeBorder: "1px solid rgba(253,186,116,0.18)",
    heroBadgeText: "#fed7aa",
    heroTitle: "#fff7ed",
    heroDescription: "#fdba74",
    heroOrbOne: "rgba(251,146,60,0.16)",
    heroOrbTwo: "rgba(244,114,182,0.14)",
    heroAccentSoft: "rgba(250,204,21,0.12)",
    primaryButton: "linear-gradient(135deg, #fb923c, #ea580c)",
    primaryShadow: "0 12px 28px rgba(234,88,12,0.28)",
    secondaryButton: "linear-gradient(135deg, #f472b6, #ec4899)",
    secondaryShadow: "0 12px 24px rgba(236,72,153,0.22)",
    accentButton: "linear-gradient(135deg, #f59e0b, #d97706)",
    accentShadow: "0 12px 24px rgba(217,119,6,0.22)",
    dangerButton: "linear-gradient(135deg, #ef4444, #dc2626)",
    dangerShadow: "0 10px 24px rgba(220,38,38,0.22)",
    successButton: "linear-gradient(135deg, #22c55e, #15803d)",
    successShadow: "0 12px 24px rgba(21,128,61,0.25)",
    inputBackground: "rgba(33, 12, 10, 0.88)",
    inputBorder: "1px solid rgba(254,215,170,0.10)",
    inputText: "#fff7ed",
    inputPlaceholder: "#fdba74",
    mutedSurface: "rgba(24,9,8,0.92)",
    mutedSurfaceBorder: "1px solid rgba(254,215,170,0.08)",
    cardSurface: "rgba(255,255,255,0.06)",
    cardBorder: "1px solid rgba(254,215,170,0.08)",
    softText: "#ffedd5",
    strongText: "#fff7ed",
    subtleText: "#fdba74",
    systemBubble: "rgba(255,255,255,0.05)",
    ownMessage: "linear-gradient(135deg, #f97316, #ea580c)",
    otherMessage:
      "linear-gradient(135deg, rgba(66,32,20,0.96), rgba(37,16,12,0.96))",
    chipBackground: "rgba(251,146,60,0.12)",
    chipBorder: "1px solid rgba(253,186,116,0.16)",
    chipText: "#ffedd5",
    pinnedBackground:
      "linear-gradient(135deg, rgba(251,146,60,0.14), rgba(244,114,182,0.10))",
    pinnedBorder: "1px solid rgba(253,186,116,0.16)",
    reactionGlow: "drop-shadow(0 8px 18px rgba(251,146,60,0.35))",
    videoShell:
      "linear-gradient(180deg, rgba(24,9,8,1), rgba(66,32,20,1))",
  },
  "lavender-dream": {
    pageBackground:
      "radial-gradient(circle at top left, rgba(196,181,253,0.18) 0%, transparent 24%), radial-gradient(circle at top right, rgba(244,114,182,0.16) 0%, transparent 26%), radial-gradient(circle at bottom center, rgba(216,180,254,0.12) 0%, transparent 28%), linear-gradient(135deg, #100916 0%, #20112c 42%, #0c0712 100%)",
    panelBackground:
      "linear-gradient(180deg, rgba(34,19,50,0.92), rgba(16,8,27,0.94))",
    panelBorder: "1px solid rgba(221,214,254,0.10)",
    heroBadgeBackground: "rgba(196,181,253,0.12)",
    heroBadgeBorder: "1px solid rgba(221,214,254,0.18)",
    heroBadgeText: "#ede9fe",
    heroTitle: "#faf5ff",
    heroDescription: "#ddd6fe",
    heroOrbOne: "rgba(196,181,253,0.16)",
    heroOrbTwo: "rgba(244,114,182,0.14)",
    heroAccentSoft: "rgba(216,180,254,0.12)",
    primaryButton: "linear-gradient(135deg, #c084fc, #9333ea)",
    primaryShadow: "0 12px 28px rgba(147,51,234,0.28)",
    secondaryButton: "linear-gradient(135deg, #f472b6, #ec4899)",
    secondaryShadow: "0 12px 24px rgba(236,72,153,0.22)",
    accentButton: "linear-gradient(135deg, #a78bfa, #7c3aed)",
    accentShadow: "0 12px 24px rgba(124,58,237,0.22)",
    dangerButton: "linear-gradient(135deg, #ef4444, #dc2626)",
    dangerShadow: "0 10px 24px rgba(220,38,38,0.22)",
    successButton: "linear-gradient(135deg, #22c55e, #15803d)",
    successShadow: "0 12px 24px rgba(21,128,61,0.25)",
    inputBackground: "rgba(22, 10, 35, 0.88)",
    inputBorder: "1px solid rgba(221,214,254,0.10)",
    inputText: "#faf5ff",
    inputPlaceholder: "#ddd6fe",
    mutedSurface: "rgba(16,8,27,0.92)",
    mutedSurfaceBorder: "1px solid rgba(221,214,254,0.08)",
    cardSurface: "rgba(255,255,255,0.06)",
    cardBorder: "1px solid rgba(221,214,254,0.08)",
    softText: "#f3e8ff",
    strongText: "#faf5ff",
    subtleText: "#ddd6fe",
    systemBubble: "rgba(255,255,255,0.05)",
    ownMessage: "linear-gradient(135deg, #c084fc, #a855f7)",
    otherMessage:
      "linear-gradient(135deg, rgba(52,31,80,0.96), rgba(24,12,40,0.96))",
    chipBackground: "rgba(196,181,253,0.12)",
    chipBorder: "1px solid rgba(221,214,254,0.16)",
    chipText: "#f3e8ff",
    pinnedBackground:
      "linear-gradient(135deg, rgba(196,181,253,0.14), rgba(244,114,182,0.10))",
    pinnedBorder: "1px solid rgba(221,214,254,0.16)",
    reactionGlow: "drop-shadow(0 8px 18px rgba(196,181,253,0.35))",
    videoShell:
      "linear-gradient(180deg, rgba(16,8,27,1), rgba(52,31,80,1))",
  },
  "cozy-rain": {
    pageBackground:
      "radial-gradient(circle at top left, rgba(45,212,191,0.14) 0%, transparent 24%), radial-gradient(circle at top right, rgba(59,130,246,0.14) 0%, transparent 26%), radial-gradient(circle at bottom center, rgba(148,163,184,0.12) 0%, transparent 28%), linear-gradient(135deg, #081317 0%, #10232b 42%, #061014 100%)",
    panelBackground:
      "linear-gradient(180deg, rgba(10,28,35,0.92), rgba(5,16,20,0.94))",
    panelBorder: "1px solid rgba(153,246,228,0.10)",
    heroBadgeBackground: "rgba(45,212,191,0.12)",
    heroBadgeBorder: "1px solid rgba(94,234,212,0.18)",
    heroBadgeText: "#ccfbf1",
    heroTitle: "#ecfeff",
    heroDescription: "#99f6e4",
    heroOrbOne: "rgba(45,212,191,0.14)",
    heroOrbTwo: "rgba(59,130,246,0.14)",
    heroAccentSoft: "rgba(148,163,184,0.12)",
    primaryButton: "linear-gradient(135deg, #14b8a6, #0f766e)",
    primaryShadow: "0 12px 28px rgba(15,118,110,0.28)",
    secondaryButton: "linear-gradient(135deg, #60a5fa, #2563eb)",
    secondaryShadow: "0 12px 24px rgba(37,99,235,0.22)",
    accentButton: "linear-gradient(135deg, #2dd4bf, #0f766e)",
    accentShadow: "0 12px 24px rgba(15,118,110,0.22)",
    dangerButton: "linear-gradient(135deg, #ef4444, #dc2626)",
    dangerShadow: "0 10px 24px rgba(220,38,38,0.22)",
    successButton: "linear-gradient(135deg, #22c55e, #15803d)",
    successShadow: "0 12px 24px rgba(21,128,61,0.25)",
    inputBackground: "rgba(8, 20, 25, 0.88)",
    inputBorder: "1px solid rgba(153,246,228,0.10)",
    inputText: "#ecfeff",
    inputPlaceholder: "#99f6e4",
    mutedSurface: "rgba(5,16,20,0.92)",
    mutedSurfaceBorder: "1px solid rgba(153,246,228,0.08)",
    cardSurface: "rgba(255,255,255,0.06)",
    cardBorder: "1px solid rgba(153,246,228,0.08)",
    softText: "#ccfbf1",
    strongText: "#ecfeff",
    subtleText: "#99f6e4",
    systemBubble: "rgba(255,255,255,0.05)",
    ownMessage: "linear-gradient(135deg, #14b8a6, #0f766e)",
    otherMessage:
      "linear-gradient(135deg, rgba(15,32,39,0.96), rgba(8,20,25,0.96))",
    chipBackground: "rgba(45,212,191,0.12)",
    chipBorder: "1px solid rgba(94,234,212,0.16)",
    chipText: "#ccfbf1",
    pinnedBackground:
      "linear-gradient(135deg, rgba(45,212,191,0.14), rgba(59,130,246,0.10))",
    pinnedBorder: "1px solid rgba(94,234,212,0.16)",
    reactionGlow: "drop-shadow(0 8px 18px rgba(45,212,191,0.35))",
    videoShell:
      "linear-gradient(180deg, rgba(5,16,20,1), rgba(15,32,39,1))",
  },
};

const themeLabelMap: Record<ThemeName, string> = {
  "rose-night": "Rose Night",
  moonlight: "Moonlight",
  "sunset-love": "Sunset Love",
  "lavender-dream": "Lavender Dream",
  "cozy-rain": "Cozy Rain",
};

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8);
}

function formatViews(views?: string) {
  if (!views) return "";

const num = Number(views);
  if (Number.isNaN(num)) return views;

if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr views`;
  if (num >= 100000) return `${(num / 100000).toFixed(1)}L views`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K views`;
  return `${num} views`;
}

function ChatPageContent() {
  const searchParams = useSearchParams();
  const urlRoom = searchParams.get("room");

const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("room1");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<Message[]>([]);
  const [joined, setJoined] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [videoId, setVideoId] = useState("");
  const [playerReady, setPlayerReady] = useState(false);
  const [roomUsers, setRoomUsers] = useState<string[]>([]);
  const [roomMeta, setRoomMeta] = useState<RoomMeta>({
    title: "Private Date Room",
    pinnedNote: "",
    mode: "couple",
    theme: "rose-night",
  });
  const [roomTitleInput, setRoomTitleInput] = useState("Private Date Room");
  const [pinnedNoteInput, setPinnedNoteInput] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>("rose-night");
  const [joinError, setJoinError] = useState("");
  const [themeError, setThemeError] = useState("");
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>(
    []
  );

const [youtubeQuery, setYouTubeQuery] = useState("");
  const [youtubeResults, setYouTubeResults] = useState<YouTubeVideo[]>([]);
  const [trendingVideos, setTrendingVideos] = useState<YouTubeVideo[]>([]);
  const [youtubeLoading, setYouTubeLoading] = useState(false);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [youtubeError, setYouTubeError] = useState("");
  const [activeVideoLabel, setActiveVideoLabel] = useState("");

const chatEndRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);
  const syncingRef = useRef(false);
  const socketRef = useRef<Socket | null>(null);

const activeTheme = themes[selectedTheme];
  const apiBase = (
    process.env.NEXT_PUBLIC_SOCKET_URL || "https://server-g8eq.onrender.com"
  ).trim();

useEffect(() => {
    socketRef.current = io(apiBase);

return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [apiBase]);

useEffect(() => {
    if (urlRoom) {
      setRoomId(urlRoom);
    }
  }, [urlRoom]);

useEffect(() => {
    const existingScript = document.getElementById("youtube-iframe-api");

if (!existingScript) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }

window.onYouTubeIframeAPIReady = () => {
      setPlayerReady(true);
    };

if (window.YT && window.YT.Player) {
      setPlayerReady(true);
    }
  }, []);

useEffect(() => {
    fetchTrendingVideos();
  }, []);

useEffect(() => {
    if (!socketRef.current) return;

const handleReceiveMessage = (data: Message) => {
      setChat((prev) => [...prev, data]);
    };

const handleVideoUpdated = (data: { videoId: string; loadedBy?: string }) => {
      setVideoId(data.videoId);

const matchedVideo =
        youtubeResults.find((item) => item.videoId === data.videoId) ||
        trendingVideos.find((item) => item.videoId === data.videoId);

if (matchedVideo) {
        setActiveVideoLabel(matchedVideo.title);
      }
    };

const handleRoomUsers = (users: string[]) => {
      setRoomUsers(users);
    };

const handleRoomMeta = (meta: RoomMeta) => {
      setRoomMeta(meta);
      setRoomTitleInput(meta.title || "Private Date Room");
      setPinnedNoteInput(meta.pinnedNote || "");
      setSelectedTheme(meta.theme || "rose-night");
      setThemeError("");
    };

const handleRoomJoinError = (data: { message: string }) => {
      setJoinError(data.message || "Unable to join this room.");
      setJoined(false);
    };

const handleThemeUpdateError = (data: { message: string }) => {
      setThemeError(data.message || "Failed to update theme.");
    };

const handleReactionReceived = (reaction: FloatingReaction) => {
      const enrichedReaction: FloatingReaction = {
        ...reaction,
        left: Math.floor(Math.random() * 76) + 10,
        duration: Math.floor(Math.random() * 3) + 4,
        size: Math.floor(Math.random() * 18) + 24,
      };

setFloatingReactions((prev) => [...prev, enrichedReaction]);

window.setTimeout(() => {
        setFloatingReactions((prev) =>
          prev.filter((item) => item.id !== enrichedReaction.id)
        );
      }, ((enrichedReaction.duration || 5) + 0.2) * 1000);
    };

const handleSyncVideoAction = (data: { action: "play" | "pause" }) => {
      if (!playerRef.current) return;

syncingRef.current = true;

if (data.action === "play") {
        playerRef.current.playVideo();
      }

if (data.action === "pause") {
        playerRef.current.pauseVideo();
      }

window.setTimeout(() => {
        syncingRef.current = false;
      }, 500);
    };

socketRef.current.on("receive_message", handleReceiveMessage);
    socketRef.current.on("video_updated", handleVideoUpdated);
    socketRef.current.on("room_users", handleRoomUsers);
    socketRef.current.on("room_meta", handleRoomMeta);
    socketRef.current.on("room_join_error", handleRoomJoinError);
    socketRef.current.on("theme_update_error", handleThemeUpdateError);
    socketRef.current.on("reaction_received", handleReactionReceived);
    socketRef.current.on("sync_video_action", handleSyncVideoAction);

return () => {
      socketRef.current?.off("receive_message", handleReceiveMessage);
      socketRef.current?.off("video_updated", handleVideoUpdated);
      socketRef.current?.off("room_users", handleRoomUsers);
      socketRef.current?.off("room_meta", handleRoomMeta);
      socketRef.current?.off("room_join_error", handleRoomJoinError);
      socketRef.current?.off("theme_update_error", handleThemeUpdateError);
      socketRef.current?.off("reaction_received", handleReactionReceived);
      socketRef.current?.off("sync_video_action", handleSyncVideoAction);
    };
  }, [youtubeResults, trendingVideos]);

useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

useEffect(() => {
    if (!playerReady || !videoId) return;
    if (!window.YT || !window.YT.Player) return;

if (playerRef.current) {
      try {
        playerRef.current.cueVideoById(videoId);
      } catch (error) {
        console.log("Error cueing video:", error);
      }
      return;
    }

playerRef.current = new window.YT.Player("youtube-player", {
      height: "100%",
      width: "100%",
      videoId,
      playerVars: {
        autoplay: 0,
        rel: 0,
      },
      events: {
        onReady: () => {},
        onStateChange: (event: any) => {
          if (!joined || syncingRef.current) return;

if (event.data === window.YT.PlayerState.PLAYING) {
            socketRef.current?.emit("video_action", {
              roomId,
              action: "play",
              username,
            });
          }

if (event.data === window.YT.PlayerState.PAUSED) {
            socketRef.current?.emit("video_action", {
              roomId,
              action: "pause",
              username,
            });
          }
        },
      },
    });
  }, [playerReady, videoId, joined, roomId, username]);

async function fetchTrendingVideos() {
    try {
      setTrendingLoading(true);
      setYouTubeError("");

console.log("Trending API Base:", apiBase);

const response = await fetch(`${apiBase}/api/youtube/trending`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

const contentType = response.headers.get("content-type") || "";
      const rawText = await response.text();

if (!contentType.includes("application/json")) {
        throw new Error(
          `Trending endpoint returned non-JSON response. Status: ${response.status}`
        );
      }

let data: any;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error("Invalid JSON returned from trending endpoint");
      }

if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load trending videos");
      }

setTrendingVideos(data.videos || []);
    } catch (error: any) {
      setYouTubeError(error.message || "Failed to load trending videos");
    } finally {
      setTrendingLoading(false);
    }
  }

async function searchYouTubeVideos() {
    if (!youtubeQuery.trim()) return;

try {
      setYouTubeLoading(true);
      setYouTubeError("");

console.log("Search API Base:", apiBase);

const response = await fetch(
        `${apiBase}/api/youtube/search?q=${encodeURIComponent(youtubeQuery)}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

const contentType = response.headers.get("content-type") || "";
      const rawText = await response.text();

if (!contentType.includes("application/json")) {
        throw new Error(
          `Search endpoint returned non-JSON response. Status: ${response.status}`
        );
      }

let data: any;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error("Invalid JSON returned from search endpoint");
      }

if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to search videos");
      }

setYouTubeResults(data.videos || []);
    } catch (error: any) {
      setYouTubeError(error.message || "Failed to search videos");
    } finally {
      setYouTubeLoading(false);
    }
  }

const loadSelectedVideo = (video: YouTubeVideo) => {
    if (!joined) {
      alert("Join a private room first");
      return;
    }

setVideoId(video.videoId);
    setActiveVideoLabel(video.title);

socketRef.current?.emit("load_video", {
      roomId,
      videoId: video.videoId,
      username,
    });
  };

const joinRoom = () => {
    if (!username.trim() || !roomId.trim()) return;

setJoinError("");
    socketRef.current?.emit("join_room", { roomId, username });
    setJoined(true);
  };

const leaveRoom = () => {
    socketRef.current?.emit("leave_room", { roomId, username });

setJoined(false);
    setChat([]);
    setMessage("");
    setVideoId("");
    setRoomUsers([]);
    setCopyStatus("");
    setJoinError("");
    setThemeError("");
    setActiveVideoLabel("");
    setRoomMeta({
      title: "Private Date Room",
      pinnedNote: "",
      mode: "couple",
      theme: "rose-night",
    });
    setRoomTitleInput("Private Date Room");
    setPinnedNoteInput("");
    setSelectedTheme("rose-night");
    setFloatingReactions([]);

if (playerRef.current) {
      try {
        playerRef.current.stopVideo();
      } catch (error) {
        console.log("Error stopping video:", error);
      }
    }
  };

const sendMessage = () => {
    if (!message.trim() || !username.trim() || !joined) return;

const messageData: Message = {
      roomId,
      username,
      message,
      time: new Date().toLocaleTimeString(),
      type: "user",
    };

socketRef.current?.emit("send_message", messageData);
    setMessage("");
  };

const createNewRoom = () => {
    const newRoomId = generateRoomId();

setRoomId(newRoomId);
    setChat([]);
    setJoined(false);
    setCopyStatus("");
    setVideoId("");
    setRoomUsers([]);
    setJoinError("");
    setThemeError("");
    setActiveVideoLabel("");
    setRoomMeta({
      title: "Private Date Room",
      pinnedNote: "",
      mode: "couple",
      theme: "rose-night",
    });
    setRoomTitleInput("Private Date Room");
    setPinnedNoteInput("");
    setSelectedTheme("rose-night");
    setFloatingReactions([]);

window.history.pushState({}, "", `/chat?room=${newRoomId}`);
  };

const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopyStatus("Private room ID copied 💖");
      window.setTimeout(() => setCopyStatus(""), 2000);
    } catch {
      setCopyStatus("Failed to copy room ID");
    }
  };

const copyInviteLink = async () => {
    try {
      const inviteLink = `${window.location.origin}/chat?room=${roomId}`;
      await navigator.clipboard.writeText(inviteLink);
      setCopyStatus("Date invite link copied ✨");
      window.setTimeout(() => setCopyStatus(""), 2000);
    } catch {
      setCopyStatus("Failed to copy invite link");
    }
  };

const saveRoomTitle = () => {
    if (!joined) return;

socketRef.current?.emit("update_room_title", {
      roomId,
      title: roomTitleInput,
      username,
    });
  };

const savePinnedNote = () => {
    if (!joined) return;

socketRef.current?.emit("update_pinned_note", {
      roomId,
      note: pinnedNoteInput,
      username,
    });
  };

const saveRoomTheme = () => {
    if (!joined) return;

setThemeError("");

socketRef.current?.emit("update_room_theme", {
      roomId,
      theme: selectedTheme,
      username,
    });
  };

const sendReaction = (emoji: string) => {
    if (!joined) return;

socketRef.current?.emit("send_reaction", {
      roomId,
      emoji,
      username,
    });
  };

const roomSubtitle = useMemo(() => {
    if (roomUsers.length === 0) return "Waiting for your person to join";
    if (roomUsers.length === 1) return "One heart in the room";
    return "Both of you are here";
  }, [roomUsers.length]);

const inputStyle = {
    padding: "16px 18px",
    borderRadius: "18px",
    border: activeTheme.inputBorder,
    outline: "none",
    background: activeTheme.inputBackground,
    color: activeTheme.inputText,
    fontSize: "14px",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)",
    width: "100%",
  } as const;

const panelStyle = {
    background: activeTheme.panelBackground,
    borderRadius: "28px",
    padding: "22px",
    border: activeTheme.panelBorder,
    boxShadow: "0 28px 80px rgba(0,0,0,0.38)",
    backdropFilter: "blur(18px)",
  } as const;

const actionButtonStyle = {
    padding: "12px 16px",
    border: "none",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: 700,
    color: "white",
  } as const;

const renderVideoCard = (video: YouTubeVideo, showViews = false) => (
    <button
      key={video.videoId}
      onClick={() => loadSelectedVideo(video)}
      disabled={!joined}
      style={{
        width: "100%",
        textAlign: "left",
        background: activeTheme.mutedSurface,
        border: activeTheme.mutedSurfaceBorder,
        borderRadius: "18px",
        padding: "10px",
        display: "flex",
        gap: "12px",
        cursor: joined ? "pointer" : "not-allowed",
        marginBottom: "12px",
      }}
    >
      <img
        src={video.thumbnail}
        alt={video.title}
        style={{
          width: "120px",
          height: "72px",
          objectFit: "cover",
          borderRadius: "12px",
          flexShrink: 0,
        }}
      />
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            color: activeTheme.strongText,
            fontSize: "14px",
            fontWeight: 700,
            lineHeight: "1.4",
            marginBottom: "6px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {video.title}
        </div>
        <div
          style={{
            color: activeTheme.subtleText,
            fontSize: "12px",
            marginBottom: "6px",
          }}
        >
          {video.channelTitle}
        </div>
        {showViews && video.views && (
          <div
            style={{
              color: activeTheme.softText,
              fontSize: "12px",
            }}
          >
            {formatViews(video.views)}
          </div>
        )}
      </div>
    </button>
  );

return (
    <div
      style={{
        minHeight: "100vh",
        background: activeTheme.pageBackground,
        padding: "24px",
        fontFamily: "Inter, Arial, Helvetica, sans-serif",
        color: activeTheme.strongText,
        transition: "background 0.35s ease, color 0.35s ease",
      }}
    >
      <style>{`
        @keyframes floatHeart {
          0% {
            transform: translateY(0px) scale(0.9);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          100% {
            transform: translateY(-260px) scale(1.2);
            opacity: 0;
          }
        }

@keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 0 rgba(255,255,255,0.0);
          }
          50% {
            box-shadow: 0 0 30px rgba(255,255,255,0.08);
          }
        }

.date-room-grid {
          display: grid;
          grid-template-columns: 1.55fr 1fr 340px;
          gap: 24px;
          align-items: start;
        }

.join-grid {
          display: grid;
          grid-template-columns: 1fr 1fr auto auto;
          gap: 14px;
        }

.chat-input-grid,
        .title-note-actions,
        .theme-select-grid,
        .youtube-search-grid {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
        }

input::placeholder,
        textarea::placeholder {
          color: ${activeTheme.inputPlaceholder};
        }

select {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
        }

@media (max-width: 1180px) {
          .date-room-grid {
            grid-template-columns: 1fr;
          }
        }

@media (max-width: 860px) {
          .join-grid,
          .chat-input-grid,
          .title-note-actions,
          .theme-select-grid,
          .youtube-search-grid {
            grid-template-columns: 1fr;
          }
        }

@media (max-width: 640px) {
          .page-shell {
            padding: 14px !important;
          }

.hero-title {
            font-size: 30px !important;
          }

.panel-pad {
            padding: 18px !important;
          }
        }
      `}</style>

<div className="page-shell" style={{ maxWidth: "1520px", margin: "0 auto" }}>
        <div
          className="panel-pad"
          style={{
            ...panelStyle,
            marginBottom: "24px",
            padding: "30px",
            position: "relative",
            overflow: "hidden",
            animation: "pulseGlow 4s ease-in-out infinite",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-40px",
              right: "-20px",
              width: "190px",
              height: "190px",
              borderRadius: "999px",
              background: activeTheme.heroOrbOne,
              filter: "blur(22px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-60px",
              left: "-20px",
              width: "220px",
              height: "220px",
              borderRadius: "999px",
              background: activeTheme.heroOrbTwo,
              filter: "blur(24px)",
            }}
          />

<div style={{ position: "relative", zIndex: 1 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 14px",
                borderRadius: "999px",
                background: activeTheme.heroBadgeBackground,
                border: activeTheme.heroBadgeBorder,
                color: activeTheme.heroBadgeText,
                fontSize: "13px",
                marginBottom: "16px",
              }}
            >
              Couple Date-Night Premium Room
            </div>

<h1
              className="hero-title"
              style={{
                fontSize: "42px",
                fontWeight: 800,
                margin: 0,
                letterSpacing: "-0.8px",
                color: activeTheme.heroTitle,
              }}
            >
              {joined ? roomMeta.title : "Private Watch Date"}
            </h1>

<p
              style={{
                color: activeTheme.heroDescription,
                marginTop: "12px",
                marginBottom: 0,
                fontSize: "15px",
                maxWidth: "820px",
                lineHeight: "1.8",
              }}
            >
              A cozy shared room for two — search YouTube inside the app, watch
              together, chat in real time, pin sweet notes, choose a romantic
              theme, and make your night feel more special than normal screen
              sharing.
            </p>

{joined && (
              <div
                style={{
                  marginTop: "18px",
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    padding: "10px 14px",
                    borderRadius: "999px",
                    background: activeTheme.cardSurface,
                    color: activeTheme.softText,
                    border: activeTheme.cardBorder,
                    fontSize: "14px",
                  }}
                >
                  Room ID: <strong>{roomId}</strong>
                </span>

<span
                  style={{
                    padding: "10px 14px",
                    borderRadius: "999px",
                    background: activeTheme.chipBackground,
                    color: activeTheme.chipText,
                    border: activeTheme.chipBorder,
                    fontSize: "14px",
                  }}
                >
                  {roomSubtitle}
                </span>

<span
                  style={{
                    padding: "10px 14px",
                    borderRadius: "999px",
                    background: activeTheme.cardSurface,
                    color: activeTheme.softText,
                    border: activeTheme.cardBorder,
                    fontSize: "14px",
                  }}
                >
                  Theme: <strong>{themeLabelMap[selectedTheme]}</strong>
                </span>
              </div>
            )}
          </div>
        </div>

{!joined ? (
          <div
            className="join-grid panel-pad"
            style={{
              ...panelStyle,
              marginBottom: "24px",
            }}
          >
            <input
              type="text"
              placeholder="Enter your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={inputStyle}
            />

<input
              type="text"
              placeholder="Enter private room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              style={inputStyle}
            />

<button
              onClick={createNewRoom}
              style={{
                ...actionButtonStyle,
                padding: "16px 18px",
                background: activeTheme.secondaryButton,
                boxShadow: activeTheme.secondaryShadow,
              }}
            >
              New Room
            </button>

<button
              onClick={joinRoom}
              style={{
                ...actionButtonStyle,
                padding: "16px 22px",
                background: activeTheme.primaryButton,
                boxShadow: activeTheme.primaryShadow,
              }}
            >
              Join Date Room
            </button>

{joinError && (
              <div
                style={{
                  gridColumn: "1 / -1",
                  color: "#fecdd3",
                  fontSize: "14px",
                  background: "rgba(190,24,93,0.12)",
                  border: "1px solid rgba(251,113,133,0.18)",
                  padding: "12px 14px",
                  borderRadius: "14px",
                }}
              >
                {joinError}
              </div>
            )}
          </div>
        ) : (
          <div
            className="panel-pad"
            style={{
              ...panelStyle,
              marginBottom: "24px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  background: activeTheme.chipBackground,
                  color: activeTheme.chipText,
                  padding: "10px 14px",
                  borderRadius: "999px",
                  fontSize: "14px",
                  border: activeTheme.chipBorder,
                }}
              >
                Joined as <strong>{username}</strong>
              </span>

<span
                style={{
                  background: activeTheme.cardSurface,
                  color: activeTheme.softText,
                  padding: "10px 14px",
                  borderRadius: "999px",
                  fontSize: "14px",
                  border: activeTheme.cardBorder,
                }}
              >
                Private mode • {roomUsers.length}/2 joined
              </span>
            </div>

<div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={copyRoomId}
                style={{
                  ...actionButtonStyle,
                  background: activeTheme.cardSurface,
                  border: activeTheme.cardBorder,
                }}
              >
                Copy Room ID
              </button>

<button
                onClick={copyInviteLink}
                style={{
                  ...actionButtonStyle,
                  background: activeTheme.accentButton,
                  boxShadow: activeTheme.accentShadow,
                }}
              >
                Copy Invite Link
              </button>

<button
                onClick={createNewRoom}
                style={{
                  ...actionButtonStyle,
                  background: activeTheme.secondaryButton,
                  boxShadow: activeTheme.secondaryShadow,
                }}
              >
                Create New Room
              </button>

<button
                onClick={leaveRoom}
                style={{
                  ...actionButtonStyle,
                  background: activeTheme.dangerButton,
                  boxShadow: activeTheme.dangerShadow,
                }}
              >
                Leave Room
              </button>
            </div>

{copyStatus && (
              <div
                style={{
                  color: activeTheme.softText,
                  fontSize: "14px",
                  background: activeTheme.heroAccentSoft,
                  border: activeTheme.chipBorder,
                  padding: "10px 12px",
                  borderRadius: "12px",
                  width: "fit-content",
                }}
              >
                {copyStatus}
              </div>
            )}
          </div>
        )}

<div className="date-room-grid">
          <div style={panelStyle} className="panel-pad">
            <h2
              style={{
                fontSize: "24px",
                fontWeight: 800,
                marginBottom: "16px",
                color: activeTheme.strongText,
              }}
            >
              Shared Date Screen
            </h2>

<div className="theme-select-grid" style={{ marginBottom: "12px" }}>
              <select
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value as ThemeName)}
                style={{
                  ...inputStyle,
                  cursor: joined ? "pointer" : "not-allowed",
                }}
                disabled={!joined}
              >
                {(Object.keys(themeLabelMap) as ThemeName[]).map((themeName) => (
                  <option
                    key={themeName}
                    value={themeName}
                    style={{ color: "#111827" }}
                  >
                    {themeLabelMap[themeName]}
                  </option>
                ))}
              </select>

<button
                onClick={saveRoomTheme}
                disabled={!joined}
                style={{
                  ...actionButtonStyle,
                  background: joined ? activeTheme.secondaryButton : "#6b7280",
                  boxShadow: joined ? activeTheme.secondaryShadow : "none",
                  cursor: joined ? "pointer" : "not-allowed",
                }}
              >
                Apply Theme
              </button>
            </div>

{themeError && (
              <div
                style={{
                  marginBottom: "12px",
                  color: "#fecdd3",
                  fontSize: "14px",
                  background: "rgba(190,24,93,0.12)",
                  border: "1px solid rgba(251,113,133,0.18)",
                  padding: "12px 14px",
                  borderRadius: "14px",
                }}
              >
                {themeError}
              </div>
            )}

<div
              className="title-note-actions"
              style={{ marginBottom: "12px" }}
            >
              <input
                type="text"
                placeholder="Set your room title"
                value={roomTitleInput}
                onChange={(e) => setRoomTitleInput(e.target.value)}
                style={inputStyle}
                maxLength={60}
              />

<button
                onClick={saveRoomTitle}
                disabled={!joined}
                style={{
                  ...actionButtonStyle,
                  background: joined ? activeTheme.accentButton : "#6b7280",
                  boxShadow: joined ? activeTheme.accentShadow : "none",
                  cursor: joined ? "pointer" : "not-allowed",
                }}
              >
                Save Title
              </button>
            </div>

<div
              className="title-note-actions"
              style={{ marginBottom: "18px" }}
            >
              <input
                type="text"
                placeholder="Pin a sweet note..."
                value={pinnedNoteInput}
                onChange={(e) => setPinnedNoteInput(e.target.value)}
                style={inputStyle}
                maxLength={180}
              />

<button
                onClick={savePinnedNote}
                disabled={!joined}
                style={{
                  ...actionButtonStyle,
                  background: joined ? activeTheme.secondaryButton : "#6b7280",
                  boxShadow: joined ? activeTheme.secondaryShadow : "none",
                  cursor: joined ? "pointer" : "not-allowed",
                }}
              >
                Save Note
              </button>
            </div>

{roomMeta.pinnedNote && (
              <div
                style={{
                  marginBottom: "18px",
                  padding: "16px 18px",
                  borderRadius: "18px",
                  background: activeTheme.pinnedBackground,
                  border: activeTheme.pinnedBorder,
                  color: activeTheme.softText,
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: activeTheme.subtleText,
                    marginBottom: "6px",
                    fontWeight: 700,
                  }}
                >
                  Pinned love note
                </div>
                <div style={{ fontSize: "15px", lineHeight: "1.7" }}>
                  {roomMeta.pinnedNote}
                </div>
              </div>
            )}

<div className="youtube-search-grid" style={{ marginBottom: "18px" }}>
              <input
                type="text"
                placeholder="Search YouTube inside your app"
                value={youtubeQuery}
                onChange={(e) => setYouTubeQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    searchYouTubeVideos();
                  }
                }}
                style={inputStyle}
              />

<button
                onClick={searchYouTubeVideos}
                style={{
                  ...actionButtonStyle,
                  padding: "16px 20px",
                  background: activeTheme.primaryButton,
                  boxShadow: activeTheme.primaryShadow,
                }}
              >
                {youtubeLoading ? "Searching..." : "Search"}
              </button>
            </div>

{youtubeError && (
              <div
                style={{
                  marginBottom: "18px",
                  color: "#fecdd3",
                  fontSize: "14px",
                  background: "rgba(190,24,93,0.12)",
                  border: "1px solid rgba(251,113,133,0.18)",
                  padding: "12px 14px",
                  borderRadius: "14px",
                }}
              >
                {youtubeError}
              </div>
            )}

{activeVideoLabel && (
              <div
                style={{
                  marginBottom: "14px",
                  padding: "12px 14px",
                  borderRadius: "14px",
                  background: activeTheme.cardSurface,
                  border: activeTheme.cardBorder,
                  color: activeTheme.softText,
                  fontSize: "14px",
                }}
              >
                Now selected: <strong>{activeVideoLabel}</strong>
              </div>
            )}

<div
              style={{
                marginBottom: "16px",
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              {["❤️", "😘", "🥺", "🫶", "💫", "🌙"].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => sendReaction(emoji)}
                  disabled={!joined}
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "999px",
                    border: activeTheme.cardBorder,
                    background: activeTheme.cardSurface,
                    color: "white",
                    fontSize: "20px",
                    cursor: joined ? "pointer" : "not-allowed",
                    boxShadow: "0 10px 22px rgba(0,0,0,0.18)",
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>

<div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "16 / 9",
                background: activeTheme.videoShell,
                borderRadius: "24px",
                overflow: "hidden",
                border: activeTheme.cardBorder,
                boxShadow:
                  "inset 0 0 0 1px rgba(255,255,255,0.02), 0 16px 38px rgba(0,0,0,0.28)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 1,
                }}
              >
                <div
                  id="youtube-player"
                  style={{
                    width: "100%",
                    height: "100%",
                    display: videoId ? "block" : "none",
                  }}
                />

{!videoId && (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      color: activeTheme.subtleText,
                      padding: "24px",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: "22px",
                          marginBottom: "10px",
                          color: activeTheme.strongText,
                          fontWeight: 700,
                        }}
                      >
                        No video loaded yet
                      </p>
                      <p
                        style={{
                          fontSize: "14px",
                          color: activeTheme.subtleText,
                          maxWidth: "460px",
                          lineHeight: "1.7",
                        }}
                      >
                        Search videos below and click any result to start your
                        cozy private watch date together.
                      </p>
                    </div>
                  </div>
                )}
              </div>

<div
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  zIndex: 3,
                  overflow: "hidden",
                }}
              >
                {floatingReactions.map((reaction) => (
                  <div
                    key={reaction.id}
                    style={{
                      position: "absolute",
                      bottom: "18px",
                      left: `${reaction.left}%`,
                      fontSize: `${reaction.size}px`,
                      animation: `floatHeart ${reaction.duration}s linear forwards`,
                      pointerEvents: "none",
                      filter: activeTheme.reactionGlow,
                      willChange: "transform, opacity",
                    }}
                  >
                    {reaction.emoji}
                  </div>
                ))}
              </div>
            </div>
          </div>

<div style={panelStyle} className="panel-pad">
            <h2
              style={{
                fontSize: "23px",
                fontWeight: 800,
                marginBottom: "16px",
                color: activeTheme.strongText,
              }}
            >
              Live Chat
            </h2>

<div
              style={{
                height: "430px",
                overflowY: "auto",
                background: activeTheme.mutedSurface,
                borderRadius: "22px",
                padding: "16px",
                marginBottom: "16px",
                border: activeTheme.mutedSurfaceBorder,
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)",
              }}
            >
              {chat.length === 0 ? (
                <p style={{ color: activeTheme.subtleText, margin: 0 }}>
                  No messages yet...
                </p>
              ) : (
                chat.map((msg, index) => {
                  if (msg.type === "system") {
                    return (
                      <div
                        key={index}
                        style={{
                          textAlign: "center",
                          marginBottom: "14px",
                          color: activeTheme.subtleText,
                          fontSize: "12px",
                          background: activeTheme.systemBubble,
                          padding: "8px 10px",
                          borderRadius: "999px",
                          width: "fit-content",
                          marginInline: "auto",
                          border: "1px solid rgba(255,255,255,0.04)",
                        }}
                      >
                        {msg.message} • {msg.time}
                      </div>
                    );
                  }

const isOwnMessage = msg.username === username;

return (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        justifyContent: isOwnMessage ? "flex-end" : "flex-start",
                        marginBottom: "12px",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "85%",
                          background: isOwnMessage
                            ? activeTheme.ownMessage
                            : activeTheme.otherMessage,
                          color: "white",
                          padding: "13px 15px",
                          borderRadius: isOwnMessage
                            ? "20px 20px 8px 20px"
                            : "20px 20px 20px 8px",
                          boxShadow: "0 10px 24px rgba(0,0,0,0.24)",
                          border: isOwnMessage
                            ? activeTheme.chipBorder
                            : activeTheme.cardBorder,
                        }}
                      >
                        <div
                          style={{
                            fontSize: "12px",
                            color: activeTheme.softText,
                            marginBottom: "5px",
                            fontWeight: 700,
                          }}
                        >
                          {msg.username}
                        </div>

<div
                          style={{
                            fontSize: "14px",
                            lineHeight: "1.55",
                            color: "#fff",
                            wordBreak: "break-word",
                          }}
                        >
                          {msg.message}
                        </div>

<div
                          style={{
                            fontSize: "11px",
                            color: activeTheme.softText,
                            marginTop: "8px",
                            textAlign: "right",
                          }}
                        >
                          {msg.time}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

<div className="chat-input-grid">
              <input
                type="text"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
                style={inputStyle}
              />

<button
                onClick={sendMessage}
                disabled={!joined}
                style={{
                  ...actionButtonStyle,
                  padding: "16px 22px",
                  background: joined ? activeTheme.successButton : "#475569",
                  boxShadow: joined ? activeTheme.successShadow : "none",
                  cursor: joined ? "pointer" : "not-allowed",
                }}
              >
                Send
              </button>
            </div>
          </div>

<div
            style={{
              ...panelStyle,
              height: "fit-content",
            }}
            className="panel-pad"
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
                gap: "10px",
              }}
            >
              <h2
                style={{
                  fontSize: "21px",
                  fontWeight: 800,
                  margin: 0,
                  color: activeTheme.strongText,
                }}
              >
                Discover Videos
              </h2>

<span
                style={{
                  padding: "6px 12px",
                  borderRadius: "999px",
                  background: activeTheme.chipBackground,
                  color: activeTheme.chipText,
                  fontSize: "13px",
                  border: activeTheme.chipBorder,
                }}
              >
                {roomUsers.length}/2
              </span>
            </div>

<div
              style={{
                background: activeTheme.mutedSurface,
                borderRadius: "22px",
                padding: "14px",
                border: activeTheme.mutedSurfaceBorder,
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: activeTheme.subtleText,
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  fontWeight: 700,
                }}
              >
                Room status
              </div>

<div
                style={{
                  color: activeTheme.strongText,
                  fontSize: "15px",
                  fontWeight: 700,
                  marginBottom: "8px",
                }}
              >
                {roomMeta.title}
              </div>

<div
                style={{
                  color: activeTheme.subtleText,
                  fontSize: "13px",
                  lineHeight: "1.7",
                  marginBottom: "10px",
                }}
              >
                {roomSubtitle}. Private couple mode is active, so only your two
                seats are available.
              </div>

<div
                style={{
                  color: activeTheme.softText,
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                Current theme: {themeLabelMap[selectedTheme]}
              </div>
            </div>

<div
              style={{
                background: activeTheme.mutedSurface,
                borderRadius: "22px",
                padding: "14px",
                border: activeTheme.mutedSurfaceBorder,
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  color: activeTheme.strongText,
                  fontSize: "15px",
                  fontWeight: 800,
                  marginBottom: "12px",
                }}
              >
                Trending Now
              </div>

{trendingLoading ? (
                <p style={{ color: activeTheme.subtleText, margin: 0 }}>
                  Loading trending videos...
                </p>
              ) : trendingVideos.length === 0 ? (
                <p style={{ color: activeTheme.subtleText, margin: 0 }}>
                  No trending videos found
                </p>
              ) : (
                trendingVideos.slice(0, 4).map((video) =>
                  renderVideoCard(video, true)
                )
              )}
            </div>

<div
              style={{
                background: activeTheme.mutedSurface,
                borderRadius: "22px",
                padding: "14px",
                border: activeTheme.mutedSurfaceBorder,
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  color: activeTheme.strongText,
                  fontSize: "15px",
                  fontWeight: 800,
                  marginBottom: "12px",
                }}
              >
                Search Results
              </div>

{youtubeLoading ? (
                <p style={{ color: activeTheme.subtleText, margin: 0 }}>
                  Searching videos...
                </p>
              ) : youtubeResults.length === 0 ? (
                <p style={{ color: activeTheme.subtleText, margin: 0 }}>
                  Search anything like romantic songs, movies, reels, podcasts,
                  or trailers.
                </p>
              ) : (
                youtubeResults.slice(0, 6).map((video) =>
                  renderVideoCard(video)
                )
              )}
            </div>

<div
              style={{
                background: activeTheme.mutedSurface,
                borderRadius: "22px",
                padding: "14px",
                border: activeTheme.mutedSurfaceBorder,
              }}
            >
              {roomUsers.length === 0 ? (
                <p style={{ color: activeTheme.subtleText, margin: 0 }}>
                  No users yet
                </p>
              ) : (
                roomUsers.map((user, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "16px",
                      background:
                        user === username
                          ? activeTheme.ownMessage
                          : activeTheme.otherMessage,
                      color: "white",
                      marginBottom: "10px",
                      fontSize: "14px",
                      fontWeight: 700,
                      border:
                        user === username
                          ? activeTheme.chipBorder
                          : activeTheme.cardBorder,
                      boxShadow: "0 10px 22px rgba(0,0,0,0.18)",
                    }}
                  >
                    {user} {user === username ? "(You)" : ""}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div style={{ color: "white", padding: "20px" }}>Loading...</div>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}
