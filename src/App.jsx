// front/src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import InterviewTranscription from "./pages/InterviewTranscription.jsx";
import Login from "./pages/Login.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import InterviewTypes from "./pages/InterviewTypes.jsx";
import EditInterviewType from "./pages/EditInterviewType.jsx";
import WithHeader from "./layouts/WithHeader.jsx";
import Jobs from "./pages/Jobs.jsx";
import EditJob from "./pages/EditJob.jsx";
import InterviewScripts from "./pages/InterviewScripts.jsx";
import EditInterviewScript from "./pages/EditInterviewScript.jsx";
import ConfigMenu from "./pages/ConfigMenu.jsx";
import JobProfile from "./pages/JobProfile.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Rotas protegidas */}
        <Route path="/" element={<ProtectedRoute><WithHeader><Jobs /></WithHeader></ProtectedRoute>} />
        <Route path="/interviews"  element={<ProtectedRoute> <WithHeader> <Home /> </WithHeader> </ProtectedRoute>} />
        <Route path="/interview_transcription" element={<ProtectedRoute> <WithHeader> <InterviewTranscription /> </WithHeader> </ProtectedRoute>} />
        <Route path="/settings/interview_types" element={<ProtectedRoute> <WithHeader> <InterviewTypes /> </WithHeader> </ProtectedRoute>} />
        <Route path="/settings/interview_types/:id" element={<ProtectedRoute> <WithHeader> <EditInterviewType /> </WithHeader> </ProtectedRoute>} />
        <Route path="/jobs" element={<ProtectedRoute><WithHeader><Jobs /></WithHeader></ProtectedRoute>} />
        <Route path="/jobs/:id" element={<ProtectedRoute><WithHeader><EditJob /></WithHeader></ProtectedRoute>} />
        <Route path="/job_profile" element={<ProtectedRoute><WithHeader><JobProfile /></WithHeader></ProtectedRoute>} />
        <Route path="/settings/interview_scripts" element={<ProtectedRoute><WithHeader><InterviewScripts /></WithHeader></ProtectedRoute>} />
        <Route path="/settings/interview_scripts/:id" element={<ProtectedRoute><WithHeader><EditInterviewScript /></WithHeader></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><WithHeader><ConfigMenu /></WithHeader></ProtectedRoute>} />    
      </Routes>

    </BrowserRouter>
  );
}