import AppHeader from "../components/AppHeader.jsx";

export default function WithHeader({ children }) {
  return (
    <>
      <AppHeader />
      <div style={{ paddingTop: 96 }}>{children}</div>
    </>
  );
}
