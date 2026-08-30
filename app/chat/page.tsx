"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { io, Socket } from "socket.io-client";

type Message = {
  roomId: string;
  username: string;
  message: string;
  time: string;
  type?: "user" | "system";
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

function extractYouTubeVideoId(input: string) {
  const value = input.trim();

if (!value) return "";

if (/^[a-zA-Z0-9_-]{11}$/.test(value)) {
    return value;
  }

try {
    const url = new URL(value);

if (url.hostname.includes("youtube.com")) {
      return url.searchParams.get("v") || "";
    }

if (url.hostname.includes("youtu.be")) {
      return url.pathname.replace("/", "");
    }

return "";
  } catch {
    return "";
  }
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
  const [videoInput, setVideoInput] = useState("");
  const [videoId, setVideoId] = useState("");
  const [playerReady, setPlayerReady] = useState(false);
  const [roomUsers, setRoomUsers] = useState<string[]>([]);

const chatEndRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);
  const syncingRef = useRef(false);
  const socketRef = useRef<Socket | null>(null);

useEffect(() => {
    socketRef.current = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000"
    );

return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

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
    if (!socketRef.current) return;

socketRef.current.on("receive_message", (data: Message) => {
      setChat((prev) => [...prev, data]);
    });

socketRef.current.on("video_updated", (data: { videoId: string }) => {
      setVideoId(data.videoId);
      setVideoInput(data.videoId);
    });

socketRef.current.on("room_users", (users: string[]) => {
      setRoomUsers(users);
    });

socketRef.current.on(
      "sync_video_action",
      (data: { action: "play" | "pause" }) => {
        if (!playerRef.current) return;

syncingRef.current = true;

if (data.action === "play") {
          playerRef.current.playVideo();
        }

if (data.action === "pause") {
          playerRef.current.pauseVideo();
        }

setTimeout(() => {
          syncingRef.current = false;
        }, 500);
      }
    );

return () => {
      socketRef.current?.off("receive_message");
      socketRef.current?.off("video_updated");
      socketRef.current?.off("room_users");
      socketRef.current?.off("sync_video_action");
    };
  }, []);

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

const joinRoom = () => {
    if (!username.trim() || !roomId.trim()) return;

socketRef.current?.emit("join_room", { roomId, username });
    setJoined(true);
  };

const leaveRoom = () => {
    socketRef.current?.emit("leave_room", { roomId, username });

setJoined(false);
    setChat([]);
    setMessage("");
    setVideoId("");
    setVideoInput("");
    setRoomUsers([]);
    setCopyStatus("");

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
    setVideoInput("");
    setRoomUsers([]);
    window.history.pushState({}, "", `/chat?room=${newRoomId}`);
  };

const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopyStatus("Room ID copied!");
      setTimeout(() => setCopyStatus(""), 2000);
    } catch {
      setCopyStatus("Failed to copy Room ID");
    }
  };

const copyInviteLink = async () => {
    try {
      const inviteLink = `${window.location.origin}/chat?room=${roomId}`;
      await navigator.clipboard.writeText(inviteLink);
      setCopyStatus("Invite link copied!");
      setTimeout(() => setCopyStatus(""), 2000);
    } catch {
      setCopyStatus("Failed to copy invite link");
    }
  };

const loadVideo = () => {
    if (!joined) {
      alert("Join a room first");
      return;
    }

const extractedId = extractYouTubeVideoId(videoInput);

if (!extractedId) {
      alert("Please enter a valid YouTube link or video ID");
      return;
    }

socketRef.current?.emit("load_video", {
      roomId,
      videoId: extractedId,
      username,
    });
  };

const inputStyle = {
    padding: "16px 18px",
    borderRadius: "16px",
    border: "1px solid rgba(148, 163, 184, 0.16)",
    outline: "none",
    background: "rgba(2, 6, 23, 0.88)",
    color: "#f8fafc",
    fontSize: "14px",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)",
  } as const;

const panelStyle = {
    background:
      "linear-gradient(180deg, rgba(15,23,42,0.88), rgba(2,6,23,0.9))",
    borderRadius: "26px",
    padding: "22px",
    border: "1px solid rgba(148, 163, 184, 0.12)",
    boxShadow: "0 24px 70px rgba(0,0,0,0.42)",
    backdropFilter: "blur(18px)",
  } as const;

return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(56,189,248,0.16) 0%, transparent 22%), radial-gradient(circle at top right, rgba(139,92,246,0.16) 0%, transparent 24%), linear-gradient(135deg, #020617 0%, #0b1120 45%, #020617 100%)",
        padding: "30px",
        fontFamily: "Inter, Arial, Helvetica, sans-serif",
        color: "#e2e8f0",
      }}
    >
      <div style={{ maxWidth: "1480px", margin: "0 auto" }}>
        <div
          style={{
            ...panelStyle,
            marginBottom: "26px",
            padding: "28px 30px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-40px",
              right: "-40px",
              width: "180px",
              height: "180px",
              borderRadius: "999px",
              background: "rgba(59,130,246,0.12)",
              filter: "blur(20px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-50px",
              left: "-30px",
              width: "200px",
              height: "200px",
              borderRadius: "999px",
              background: "rgba(139,92,246,0.12)",
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
                background: "rgba(59,130,246,0.12)",
                border: "1px solid rgba(96,165,250,0.18)",
                color: "#bfdbfe",
                fontSize: "13px",
                marginBottom: "16px",
              }}
            >
              Premium Watch Experience
            </div>

<h1
              style={{
                fontSize: "40px",
                fontWeight: 800,
                margin: 0,
                letterSpacing: "-0.8px",
                color: "#f8fafc",
              }}
            >
              Watch Party Room
            </h1>

<p
              style={{
                color: "#94a3b8",
                marginTop: "12px",
                marginBottom: 0,
                fontSize: "15px",
                maxWidth: "760px",
                lineHeight: "1.7",
              }}
            >
              Watch YouTube together, chat in real time, and enjoy a darker,
              cleaner, more premium shared room experience.
            </p>
          </div>
        </div>

{!joined ? (
          <div
            style={{
              ...panelStyle,
              display: "grid",
              gridTemplateColumns: "1fr 1fr auto auto",
              gap: "14px",
              marginBottom: "26px",
            }}
          >
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={inputStyle}
            />

<input
              type="text"
              placeholder="Enter room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              style={inputStyle}
            />

<button
              onClick={createNewRoom}
              style={{
                padding: "16px 18px",
                background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                color: "white",
                border: "none",
                borderRadius: "16px",
                cursor: "pointer",
                fontWeight: 700,
                boxShadow: "0 12px 28px rgba(109,40,217,0.32)",
              }}
            >
              New Room
            </button>

<button
              onClick={joinRoom}
              style={{
                padding: "16px 22px",
                background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                color: "white",
                border: "none",
                borderRadius: "16px",
                cursor: "pointer",
                fontWeight: 700,
                boxShadow: "0 12px 28px rgba(29,78,216,0.32)",
              }}
            >
              Join
            </button>
          </div>
        ) : (
          <div
            style={{
              ...panelStyle,
              marginBottom: "26px",
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
                  background:
                    "linear-gradient(135deg, rgba(37,99,235,0.18), rgba(59,130,246,0.08))",
                  color: "#dbeafe",
                  padding: "10px 14px",
                  borderRadius: "999px",
                  fontSize: "14px",
                  border: "1px solid rgba(96,165,250,0.2)",
                }}
              >
                Joined as <strong>{username}</strong>
              </span>

<span
                style={{
                  background:
                    "linear-gradient(135deg, rgba(14,165,233,0.18), rgba(6,182,212,0.08))",
                  color: "#bae6fd",
                  padding: "10px 14px",
                  borderRadius: "999px",
                  fontSize: "14px",
                  border: "1px solid rgba(34,211,238,0.18)",
                }}
              >
                Room: <strong>{roomId}</strong>
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
                  padding: "11px 15px",
                  background: "rgba(30,41,59,0.9)",
                  color: "white",
                  border: "1px solid rgba(148,163,184,0.14)",
                  borderRadius: "13px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Copy Room ID
              </button>

<button
                onClick={copyInviteLink}
                style={{
                  padding: "11px 15px",
                  background: "linear-gradient(135deg, #06b6d4, #0284c7)",
                  color: "white",
                  border: "none",
                  borderRadius: "13px",
                  cursor: "pointer",
                  fontWeight: 700,
                  boxShadow: "0 10px 24px rgba(2,132,199,0.26)",
                }}
              >
                Copy Invite Link
              </button>

<button
                onClick={createNewRoom}
                style={{
                  padding: "11px 15px",
                  background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                  color: "white",
                  border: "none",
                  borderRadius: "13px",
                  cursor: "pointer",
                  fontWeight: 700,
                  boxShadow: "0 10px 24px rgba(124,58,237,0.24)",
                }}
              >
                Create New Room
              </button>

<button
                onClick={leaveRoom}
                style={{
                  padding: "11px 15px",
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  color: "white",
                  border: "none",
                  borderRadius: "13px",
                  cursor: "pointer",
                  fontWeight: 700,
                  boxShadow: "0 10px 24px rgba(220,38,38,0.24)",
                }}
              >
                Leave Room
              </button>
            </div>

{copyStatus && (
              <div
                style={{
                  color: "#86efac",
                  fontSize: "14px",
                  background: "rgba(34,197,94,0.08)",
                  border: "1px solid rgba(34,197,94,0.18)",
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

<div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1.1fr 290px",
            gap: "24px",
            alignItems: "start",
          }}
        >
          <div style={panelStyle}>
            <h2
              style={{
                fontSize: "23px",
                fontWeight: 800,
                marginBottom: "16px",
                color: "#f8fafc",
              }}
            >
              Shared Video
            </h2>

<div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "12px",
                marginBottom: "18px",
              }}
            >
              <input
                type="text"
                placeholder="Paste YouTube link or video ID"
                value={videoInput}
                onChange={(e) => setVideoInput(e.target.value)}
                style={inputStyle}
              />

<button
                onClick={loadVideo}
                style={{
                  padding: "16px 20px",
                  background: "linear-gradient(135deg, #f43f5e, #e11d48)",
                  color: "white",
                  border: "none",
                  borderRadius: "16px",
                  cursor: "pointer",
                  fontWeight: 700,
                  boxShadow: "0 12px 28px rgba(225,29,72,0.28)",
                }}
              >
                Load Video
              </button>
            </div>

<div
              style={{
                width: "100%",
                aspectRatio: "16 / 9",
                background:
                  "linear-gradient(180deg, rgba(2,6,23,1), rgba(15,23,42,1))",
                borderRadius: "22px",
                overflow: "hidden",
                border: "1px solid rgba(148,163,184,0.08)",
                boxShadow:
                  "inset 0 0 0 1px rgba(255,255,255,0.02), 0 14px 34px rgba(0,0,0,0.28)",
              }}
            >
              {videoId ? (
                <div
                  id="youtube-player"
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    color: "#94a3b8",
                    padding: "24px",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: "20px",
                        marginBottom: "8px",
                        color: "#e2e8f0",
                        fontWeight: 700,
                      }}
                    >
                      No video loaded yet
                    </p>
                    <p style={{ fontSize: "14px", color: "#94a3b8" }}>
                      Paste a YouTube URL or video ID to start watching with
                      everyone in the room.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

<div
            style={{
              ...panelStyle,
              height: "fit-content",
            }}
          >
            <h2
              style={{
                fontSize: "23px",
                fontWeight: 800,
                marginBottom: "16px",
                color: "#f8fafc",
              }}
            >
              Live Chat
            </h2>

<div
              style={{
                height: "430px",
                overflowY: "auto",
                background: "rgba(2,6,23,0.92)",
                borderRadius: "20px",
                padding: "16px",
                marginBottom: "16px",
                border: "1px solid rgba(148,163,184,0.08)",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)",
              }}
            >
              {chat.length === 0 ? (
                <p style={{ color: "#64748b", margin: 0 }}>
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
                          color: "#94a3b8",
                          fontSize: "12px",
                          background: "rgba(148,163,184,0.08)",
                          padding: "8px 10px",
                          borderRadius: "999px",
                          width: "fit-content",
                          marginInline: "auto",
                          border: "1px solid rgba(148,163,184,0.06)",
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
                            ? "linear-gradient(135deg, #2563eb, #1d4ed8)"
                            : "linear-gradient(135deg, rgba(30,41,59,0.96), rgba(15,23,42,0.96))",
                          color: "white",
                          padding: "13px 15px",
                          borderRadius: isOwnMessage
                            ? "20px 20px 8px 20px"
                            : "20px 20px 20px 8px",
                          boxShadow: "0 10px 24px rgba(0,0,0,0.24)",
                          border: isOwnMessage
                            ? "1px solid rgba(96,165,250,0.22)"
                            : "1px solid rgba(148,163,184,0.08)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "12px",
                            color: isOwnMessage ? "#dbeafe" : "#93c5fd",
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
                            color: "#f8fafc",
                            wordBreak: "break-word",
                          }}
                        >
                          {msg.message}
                        </div>

<div
                          style={{
                            fontSize: "11px",
                            color: "#cbd5e1",
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

<div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "12px",
              }}
            >
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
                  padding: "16px 22px",
                  background: joined
                    ? "linear-gradient(135deg, #22c55e, #15803d)"
                    : "#475569",
                  color: "white",
                  border: "none",
                  borderRadius: "16px",
                  cursor: joined ? "pointer" : "not-allowed",
                  fontWeight: 700,
                  boxShadow: joined
                    ? "0 12px 24px rgba(21,128,61,0.25)"
                    : "none",
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
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h2
                style={{
                  fontSize: "21px",
                  fontWeight: 800,
                  margin: 0,
                  color: "#f8fafc",
                }}
              >
                Users in Room
              </h2>

<span
                style={{
                  padding: "6px 12px",
                  borderRadius: "999px",
                  background: "rgba(59,130,246,0.14)",
                  color: "#bfdbfe",
                  fontSize: "13px",
                  border: "1px solid rgba(96,165,250,0.18)",
                }}
              >
                {roomUsers.length} members
              </span>
            </div>

<div
              style={{
                background: "rgba(2,6,23,0.92)",
                borderRadius: "20px",
                padding: "14px",
                border: "1px solid rgba(148,163,184,0.08)",
              }}
            >
              {roomUsers.length === 0 ? (
                <p style={{ color: "#64748b", margin: 0 }}>No users yet</p>
              ) : (
                roomUsers.map((user, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "15px",
                      background:
                        user === username
                          ? "linear-gradient(135deg, #1d4ed8, #2563eb)"
                          : "linear-gradient(135deg, rgba(17,24,39,0.96), rgba(15,23,42,0.96))",
                      color: "white",
                      marginBottom: "10px",
                      fontSize: "14px",
                      fontWeight: 700,
                      border:
                        user === username
                          ? "1px solid rgba(96,165,250,0.22)"
                          : "1px solid rgba(148,163,184,0.08)",
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
      fallback={<div style={{ color: "white", padding: "20px" }}>Loading...</div>}
    >
      <ChatPageContent />
    </Suspense>
  );
}
