// front/src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import InterviewTranscription from "./pages/InterviewTranscription.jsx";
import Login from "./pages/Login.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import InterviewTypes from "./pages/InterviewTypes.jsx";
import EditInterviewType from "./pages/EditInterviewType.jsx";
import WithHeader from "./layouts/WithHeader.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Rotas protegidas */}
        <Route path="/"  element={<ProtectedRoute> <WithHeader> <Home /> </WithHeader> </ProtectedRoute>} />
        <Route path="/interview_transcription" element={<ProtectedRoute> <WithHeader> <InterviewTranscription /> </WithHeader> </ProtectedRoute>} />
        <Route path="/settings/interview_types" element={<ProtectedRoute> <WithHeader> <InterviewTypes /> </WithHeader> </ProtectedRoute>} />
        <Route path="/settings/interview_types/:id" element={<ProtectedRoute> <WithHeader> <EditInterviewType /> </WithHeader> </ProtectedRoute>} />
            
      </Routes>

    </BrowserRouter>
  );
}