import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#070707",
          color: "#f2c46d",
          fontSize: 280,
          fontWeight: 700,
          letterSpacing: "-0.03em"
        }}
      >
        C
      </div>
    ),
    size
  );
}
