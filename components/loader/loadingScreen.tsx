"use client";

import Image from "next/image";

interface LoadingScreenProps {
  variant?: "signin" | "dashboard";
}

export function LoadingScreen({
  variant = "dashboard",
}: LoadingScreenProps) {
  const message =
    variant === "signin"
      ? "Signing you in..."
      : "Loading your workspace...";

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#14120B",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "24px",
        overflow: "hidden",
      }}
    >
      {/* Soft floating logo */}
      <div className="logo-wrap">
        <Image
          src="/codedolphinn.svg"
          alt="CodeDolphin"
          width={58}
          height={58}
          priority
        />
      </div>

      {/* Elegant shimmer text */}
      <p className="shimmer-text" data-text={message}>
        {message}
      </p>

      <style jsx>{`
        .logo-wrap {
          position: relative;
          animation: float 3.5s ease-in-out infinite;
          opacity: 0.95;
        }

        .logo-wrap::after {
          content: "";
          position: absolute;
          inset: -18px;
          border-radius: 999px;
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.08),
            transparent 70%
          );
          filter: blur(18px);
          z-index: -1;
        }

        .shimmer-text {
  position: relative;
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.02em;

  /* Static visible text */
  color: rgba(255, 255, 255, 0.42);

  overflow: hidden;
}

.shimmer-text::after {
  content: attr(data-text);

  position: absolute;
  inset: 0;

  color: transparent;

  background: linear-gradient(
    110deg,
    transparent 0%,
    transparent 40%,
    rgba(255, 255, 255, 0.95) 50%,
    transparent 60%,
    transparent 100%
  );

  background-size: 220px 100%;
  background-repeat: no-repeat;

  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  animation: shimmer 2.6s linear infinite;
}

@keyframes shimmer {
  from {
    background-position: -220px 0;
  }
  to {
    background-position: 220px 0;
  }
}
      `}</style>
    </div>
  );
}