import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_URL;

export default function EditInterviewType() {
  const { id } = useParams();
  const isNew = id === "new";
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [competencies, setCompetencies] = useState([]);
  const [category, setCategory] = useState("cultura");

  useEffect(() => {
    if (!isNew) {
      fetch(`${BASE_URL}/interview_types/${id}`)
        .then((res) => res.json())
        .then((data) => {
          setName(data.type.name);
          setCategory(data.type.category || "cultura");
          setCompetencies(data.competencies);
        });
    }
  }, []);

  function handleAddCompetency() {
    setCompetencies([
      ...competencies,
      { name: "", description: "", insuficiente: "", abaixo_do_esperado: "", dentro_expectativas: "", excepcional: "" }
    ]);
  }

  async function handleSave() {
    const userId = localStorage.getItem("userId");

    // criar tipo se novo
    let typeId = id;
    if (isNew) {
      const res = await fetch(`${BASE_URL}/interview_types`, {
        
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, name, category })
      });
      const data = await res.json();
      typeId = data.type.id;
    } else {
      console.log(category);  
      await fetch(`${BASE_URL}/interview_types/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category })
      });
    }

    // garantir que cada competência existente seja inserida/atualizada
    for (const comp of competencies) {
      if (comp.id) {
        await fetch(`${BASE_URL}/competencies/${comp.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(comp)
        });
      } else {
        await fetch(`${BASE_URL}/interview_types/${typeId}/competencies`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(comp)
        });
      }
    }

    navigate("/settings/interview_types");
  }

    return (
    <div className="layout" style={{ padding: 24 }}>

      <div className="card">  
      
        <h1>{isNew ? "Novo Tipo de Entrevista" : "Editar Tipo de Entrevista"}</h1>
      
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div> 
            <h3>Nome do Tipo</h3>
            <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            />
        </div>

        <div> 
          <h3 style={{ marginTop: 24 }}>Categoria</h3>
          <select
            className="input"
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            <option value="cultura">Cultura</option>
            <option value="tecnica">Técnica</option>
            <option value="gestor_lider">Gestor / Liderança</option>
          </select>
        </div>
        <div>
          <h3 style={{ width: "100%", marginTop: 32 }}>Competências</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
              <thead>
              <tr>
                  <th>Nome</th>
                  <th>Descrição</th>
                  <th>Insuficiente</th>
                  <th>Abaixo do Esperado</th>
                  <th>Dentro das Expectativas</th>
                  <th>Excepcional</th>
                  <th></th>
              </tr>
              </thead>
              <tbody>
              {competencies.map((comp, index) => (
                  <tr key={index}>
                  <td><textarea
                      type="text"
                      value={comp.name}
                      onChange={(e) => {
                      const arr = [...competencies];
                      arr[index].name = e.target.value;
                      setCompetencies(arr);
                      }}
                      className="input_text"
                  /></td>

                  <td><textarea
                      type="text"
                      value={comp.description}
                      onChange={(e) => {
                      const arr = [...competencies];
                      arr[index].description = e.target.value;
                      setCompetencies(arr);
                      }}
                      className="input_text"
                  /></td>

                  <td><textarea
                      type="text"
                      value={comp.insuficiente}
                      onChange={(e) => {
                      const arr = [...competencies];
                      arr[index].insuficiente = e.target.value;
                      setCompetencies(arr);
                      }}
                      className="input_text"
                  /></td>

                  <td><textarea
                      type="text"
                      value={comp.abaixo_do_esperado}
                      onChange={(e) => {
                      const arr = [...competencies];
                      arr[index].abaixo_do_esperado = e.target.value;
                      setCompetencies(arr);
                      }}
                      className="input_text"
                  /></td>

                  <td><textarea
                      type="text"
                      value={comp.dentro_expectativas}
                      onChange={(e) => {
                      const arr = [...competencies];
                      arr[index].dentro_expectativas = e.target.value;
                      setCompetencies(arr);
                      }}
                      className="input_text"
                  /></td>

                  <td><textarea
                      type="text"
                      value={comp.excepcional}
                      onChange={(e) => {
                      const arr = [...competencies];
                      arr[index].excepcional = e.target.value;
                      setCompetencies(arr);
                      }}
                      className="input_text"
                  /></td>

                  <td>
                      <button
                      onClick={() => {
                          const arr = [...competencies];
                          arr.splice(index, 1);
                          setCompetencies(arr);
                      }}
                      >
                      ✖
                      </button>
                  </td>
                  </tr>
              ))}
              </tbody>
          </table>

          {/* ✅ Mostrar aviso se não houver competências */}
          {competencies.length === 0 && (
          <div className="card" style={{ color: "var(--muted)", marginBottom: 32 }}>
              Nenhuma competência adicionada.
          </div>
          )}    

          <button onClick={handleAddCompetency}>
              + Adicionar Competência
          </button>
        </div>
      </div>      


      <div style={{ marginTop: 24 }}>
        <button onClick={handleSave}>
          Salvar Tipo
        </button>
        <button
          style={{ marginLeft: 12 }}
          onClick={() => navigate("/settings/interview_types")}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
