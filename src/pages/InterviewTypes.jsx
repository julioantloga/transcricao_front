import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_URL;

export default function InterviewTypes() {
  const [types, setTypes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    fetch(`${BASE_URL}/interview_types?user_id=${userId}`)
      .then((res) => res.json())
      .then((data) => setTypes(data.types || []));
  }, []);

  return (
    <div className="layout" style={{ padding: 24 }}>

      <div className="card">

        <h1>Tipos de Entrevista</h1>
        <button
            onClick={() => navigate("/settings/interview_types/new")}
            style={{ marginBottom: 16 }}
        >
            + Novo Tipo
        </button>
      </div>
      
      <div className="card">  
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
            <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>
                Tipos cadastrados
                </th>
                <th></th>
            </tr>
            </thead>
            <tbody>
            {types.map((t) => (
                <tr key={t.id}>
                <td style={{ padding: "8px 0" }}>{t.name}</td>
                <td>
                    <button onClick={() => navigate(`/settings/interview_types/${t.id}`)}>
                    Editar
                    </button>
                </td>
                </tr>
            ))}
            </tbody>
        </table>
    </div>    
</div>
  );
}
