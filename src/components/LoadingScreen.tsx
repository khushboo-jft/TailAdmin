import { Spin } from "antd";

export default function LoadingScreen() {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background:'#F5F7FA'
      }}
    >
      <Spin size="large" />
    </div>
  );
}
