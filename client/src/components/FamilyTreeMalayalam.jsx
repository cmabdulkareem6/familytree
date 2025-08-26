import React, { useState, useEffect } from "react";
import axios from "axios";

export default function FamilyTreeMalayalam() {
  const makeId = () =>
    `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const colors = ["#fef9c3", "#dbeafe", "#dcfce7", "#fde2e2", "#f3e8ff"];

  // Normalize tree and generate IDs only if missing
  const normalizeTree = (nodes) =>
    (nodes || []).map((n) =>
      typeof n === "string"
        ? {
            id: makeId(),
            name: n,
            spouses: [],
            children: [],
            collapsed: true,
          }
        : {
            id: n.id || makeId(),
            name: n.name || "",
            spouses: n.spouses || [],
            children: normalizeTree(n.children || []),
            collapsed: typeof n.collapsed === "boolean" ? n.collapsed : true,
          }
    );

  const [tree, setTree] = useState(() => ({
    father: "ചാല അന്ത്രു ഹാജി",
    mother: "ബീഫാത്തിമ",
    children: normalizeTree([
      {
        name: "അബ്ദുല്ല ഹാജി ചാല",
        spouses: ["ബീഫാത്തിമ", "ഉമ്മു സൽ്മ"],
        children: [
          "മുഹമ്മദ് കുഞ്ഞി ഹാജി ചാല (ബെലീച്ച)",
          "സുലൈമാൻ ചാല",
          "അബ്ദുൽ റഹ്‌മാൻ ചാല",
          "അഹമ്മദ് ചാല (ആമുച്ച)",
          "അബൂബക്കർ ചാലക്കുന്ന്",
          "മൊയ്‌ദീൻ ചാലക്കുന്ന്",
          "മഹമൂദ് ചാലക്കുന്ന്",
          "നഫീസ നായിമാർമൂല",
          "ആയിഷ നാലാം മൈൽ",
          "ഇബ്രാഹിം ചാലക്കുന്ന്",
          "ജമീല ചാലക്കുന്ന്",
          "സൈനുദ്ദിൻ ചാല",
        ],
      },
      {
        name: "മമ്മിച്ച ചാല",
        spouses: ["ബീഫാത്തിമ", "ബീഫാത്തിമ"],
        children: [
          "അബ്ദുല്ല ചാല (അദ്ദിന്ച്ച)",
          "ഖാലിദ് ചാല",
          "അഹമ്മദ് ചാല",
          "ഇബ്രാഹിം ചാല",
          "ഉമ്മർ ചാല",
          "ഇസ്മായിൽ ചാല",
          "നഫീസ ചാല",
          "ഖദീജ ചെമ്മനാട്",
          "ആയിഷ ചാല",
          "ജമീല ചെമ്മനാട്",
          "കുഞ്ഞിബി ആലംപാടി",
          "സാറ",
          "അസ്മ",
        ],
      },
      {
        name: "പോക്കർ സിലോൺ",
        spouses: ["അമീന"],
        children: [
          "അബ്ദുൽ റഹ്‌മാൻ",
          "ജസീമ",
          "ആയിഷ",
          "ജലേല",
          "ഫൗസുല",
          "ഫാഹിഷ",
          "മുഹമ്മദ്",
        ],
      },
      {
        name: "ഖാദർച്ച സിലോൺ",
        spouses: ["?"],
        children: [
          "മുഹമ്മദ് അലി",
          "ഖലീൽ",
          "മഹ്‌റൂഫ്",
          "അഷ്‌റഫ്",
          "റിഷാന",
          "റിനൂസ",
        ],
      },
      {
        name: "ആമുച്ച ചാല",
        spouses: ["ഉമ്മു ഹലീമ"],
        children: [
          "അബ്ദുൽ റഹ്‌മാൻ",
          "മുഹമ്മദ് കുഞ്ഞി ചാല",
          "അബ്ദുല്ല ചാല",
          "ഇബ്രാഹിം ചാല",
          "ബഷീർ ചാല",
          "ഫാത്തിമ ചാല",
          "ഖദീജ ചെർക്കള",
          "ആയിഷ",
        ],
      },
      {
        name: "ഇബ്രാഹിം ഹാജി ചാല",
        spouses: ["നഫീസ"],
        children: [
          "മുഹമ്മദ് കുഞ്ഞി ചാല",
          "ബീഫാത്തിമ റഹ്മത്ത് നഗർ ചാല",
          "സലാം ചാല",
          "സാലിഹ് ചാല",
          "സാദിഖ് ചാല",
          "ഷറഫുദ്ദീൻ ചാല",
        ],
      },
      {
        name: "നഫീസ",
        spouses: ["?"],
        children: ["മുഹമ്മദ് ചാല (മമ്മുച്ച)", "അബൂബക്കർ ചാല (ഔകുച്ച)"],
      },
      {
        name: "ആമിന ആലംപാടി (നീർച്ചാൽ)",
        spouses: ["ബെഡി അബ്ദുല്ല ഹാജി"],
        children: [
          "ഫാത്തിമ നീർച്ചാൽ",
          "മമ്മു നീർച്ചാൽ",
          "ആയിഷ ആലംപാടി",
          "ഹവ്വ ചാല",
          "സൈനബ മുട്ടത്തോടി",
          "റുഖിയ കല്ലക്കട്ട",
          "അബൂബക്കർ നീർച്ചാൽ",
          "സഫിയ ആദൂർ",
          "ആമു നീർച്ചാൽ",
        ],
      },
      {
        name: "ആസിയ ബെദിര",
        spouses: ["ബടുവൻ കുഞ്ഞി"],
        children: [
          "മഹ് മൂദ്",
          "അബ്ദുല്ല",
          "അബ്ദുൾ റഹിമാൻ",
          "സുലൈമാൻ",
          "ഇബ്രാഹിം",
          "ഹാരിസ് ഫൈസി",
          "അഹ്മദ് അലി",
          "ആയിശ",
          "നഫീസ",
          "ഫാത്തിമ",
          "ഹലീമ ഖദീജ",
        ],
      },
    ]),
  }));

//   // Fetch tree from backend once
//   useEffect(() => {
//     axios
//       .get("http://localhost:3000/family-tree")
//       .then((res) => {
//         setTree((prev) => ({
//           ...res.data,
//           children: normalizeTree(res.data.children),
//         }));
//       })
//       .catch((err) => console.error("Failed to fetch family tree:", err));
//   }, []);

  // Count members recursively
  const countMembers = (nodes) =>
    (nodes || []).reduce((sum, n) => sum + 1 + countMembers(n.children), 0);

  // Tree update helpers
  const updateName = (nodes, id, name) =>
    nodes.map((n) =>
      n.id === id
        ? { ...n, name }
        : { ...n, children: updateName(n.children, id, name) }
    );

  const addSpouse = (nodes, id) =>
    nodes.map((n) =>
      n.id === id
        ? { ...n, spouses: [...(n.spouses || []), ""] }
        : { ...n, children: addSpouse(n.children, id) }
    );

  const updateSpouse = (nodes, id, idx, name) =>
    nodes.map((n) => {
      if (n.id === id) {
        const copy = [...(n.spouses || [])];
        copy[idx] = name;
        return { ...n, spouses: copy };
      }
      return { ...n, children: updateSpouse(n.children, id, idx, name) };
    });

  const deleteSpouse = (nodes, id, idx) =>
    nodes.map((n) => {
      if (n.id === id) {
        const copy = [...(n.spouses || [])];
        copy.splice(idx, 1);
        return { ...n, spouses: copy };
      }
      return { ...n, children: deleteSpouse(n.children, id, idx) };
    });

  const addChildToNode = (nodes, id) =>
    nodes.map((n) =>
      n.id === id
        ? {
            ...n,
            children: [
              ...(n.children || []),
              {
                id: makeId(),
                name: "",
                spouses: [],
                children: [],
                collapsed: false,
              },
            ],
          }
        : { ...n, children: addChildToNode(n.children, id) }
    );

  const deleteNode = (nodes, id) =>
    nodes
      .filter((n) => n.id !== id)
      .map((n) => ({ ...n, children: deleteNode(n.children, id) }));

  const toggleCollapse = (nodes, id) =>
    nodes.map((n) =>
      n.id === id
        ? { ...n, collapsed: !n.collapsed }
        : { ...n, children: toggleCollapse(n.children, id) }
    );

  // Handlers
  const handleUpdateName = (id, name) =>
    setTree((prev) => ({ ...prev, children: updateName(prev.children, id, name) }));
  const handleAddSpouse = (id) =>
    setTree((prev) => ({ ...prev, children: addSpouse(prev.children, id) }));
  const handleUpdateSpouse = (id, idx, name) =>
    setTree((prev) => ({
      ...prev,
      children: updateSpouse(prev.children, id, idx, name),
    }));
  const handleDeleteSpouse = (id, idx) =>
    setTree((prev) => ({ ...prev, children: deleteSpouse(prev.children, id, idx) }));
  const handleAddChild = (id) =>
    setTree((prev) => ({ ...prev, children: addChildToNode(prev.children, id) }));
  const handleDelete = (id) =>
    setTree((prev) => ({ ...prev, children: deleteNode(prev.children, id) }));
  const handleToggle = (id) =>
    setTree((prev) => ({ ...prev, children: toggleCollapse(prev.children, id) }));

  const handleUpdateBackend = async () => {
    try {
      const res = await axios.post(
        "http://localhost:3000/update-family-tree",
        tree,
        { headers: { "Content-Type": "application/json" } }
      );
      setTree(res.data);
      alert("Family tree updated!");
    } catch (err) {
      console.error("Update failed:", err);
      alert("Update failed.");
    }
  };

  // Recursive Node component
  const Node = ({ node, level }) => (
    <div className="ft-node-branch">
      <div
        className="ft-node"
        style={{ backgroundColor: colors[level % colors.length] }}
      >
        <div className="ft-row">
          <button className="ft-btn ft-btn-gray" onClick={() => handleToggle(node.id)}>
            {node.collapsed ? "+" : "-"}
          </button>
          <input
            aria-label="പേര്"
            className="ft-input"
            value={node.name}
            placeholder="പേര്"
            onChange={(e) => handleUpdateName(node.id, e.target.value)}
          />
          <div className="ft-actions">
            <button className="ft-btn ft-btn-indigo" onClick={() => handleAddSpouse(node.id)}>
              +ഭാ
            </button>
            <button className="ft-btn ft-btn-green" onClick={() => handleAddChild(node.id)}>
              +കു
            </button>
            <button className="ft-btn ft-btn-red" onClick={() => handleDelete(node.id)}>
              🗑
            </button>
          </div>
        </div>

        <div style={{ fontSize: 12, color: "#6b7280", marginLeft: 30 }}>
          ആകെ: {1 + (node.spouses?.length || 0) + countMembers(node.children)}
        </div>

        {!node.collapsed && (
          <>
            {(node.spouses || []).map((s, i) => (
              <div key={i} className="ft-spouse">
                <div className="ft-row">
                  <input
                    aria-label={`ഭാര്യ/ഭർത്താവ് ${i + 1}`}
                    className="ft-input small"
                    value={s}
                    placeholder="ഭാര്യ/ഭർത്താവ്"
                    onChange={(e) => handleUpdateSpouse(node.id, i, e.target.value)}
                  />
                  <button className="ft-btn ft-btn-red" onClick={() => handleDeleteSpouse(node.id, i)}>
                    🗑
                  </button>
                </div>
              </div>
            ))}
            <div className="ft-children">
              {(node.children || []).map((c) => (
                <Node key={c.id} node={c} level={level + 1} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="ft-root">
      <style>{`
  :root { --bg: #f8fafc; --card: #ffffff; --accent: #4f46e5; --green: #10b981; --red: #ef4444; --gray:#6b7280; }
  .ft-root { 
    padding: 20px; 
    font-family: Inter, sans-serif; 
    max-width: 940px; 
    margin: 8px auto; 
    background: var(--bg); 
    min-height: 100vh; 
    box-sizing: border-box;
  }
  .ft-header { 
    text-align: center; 
    font-weight: 700; 
    font-size: 20px; 
    margin-bottom: 12px; 
  }
  .ft-controls { 
    display:flex; 
    gap:12px; 
    flex-wrap:wrap; 
    margin-bottom:12px; 
  }
  .ft-input { 
    padding: 8px 10px; 
    border-radius: 10px; 
    border: 1px solid #e6e7eb; 
    font-size: 14px; 
    box-sizing: border-box;
  }
  .ft-input.small { 
    width: 85%; 
  }
  .ft-row { 
    display:flex; 
    gap:8px; 
    align-items:center; 
    flex-wrap: wrap;
  }
  .ft-actions { 
    display:flex; 
    gap:8px; 
    flex-wrap:wrap; 
  }
  .ft-btn { 
    padding:6px 10px; 
    border-radius: 8px; 
    border: none; 
    cursor: pointer; 
    font-size:13px; 
    flex: none; 
  }
  .ft-btn-indigo { background: var(--accent); color: white; }
  .ft-btn-green { background: var(--green); color: white; }
  .ft-btn-red { background: var(--red); color: white; }
  .ft-btn-gray { background: var(--gray); color: white; }

  /* MAIN FIXES */
  .ft-node-branch { 
    border-left: 3px solid rgba(99,102,241,0.08); 
    margin-left: 0; /* remove cumulative margin-left */
    padding-left: 12px; 
    display: flex;
    flex-direction: column;
    max-width: 100%; /* prevent overflow */
    box-sizing: border-box;
    overflow-wrap: break-word; /* allow long names to wrap */
  }

  .ft-node { 
    border-radius: 12px; 
    padding: 10px; 
    margin: 8px 0; 
    word-break: break-word; /* wrap long content */
  }
  .ft-spouse { 
    margin-left: 18px; 
    margin-top: 8px; 
  }
  .ft-children { 
    margin-left: 6px; 
    margin-top: 8px; 
    display: flex; 
    flex-direction: column; 
    flex-wrap: wrap; 
    max-width: 100%;
  }

  @media screen and (max-width: 768px) {
    .ft-row { flex-direction: column; align-items: flex-start; }
    .ft-actions { flex-wrap: wrap; }
    .ft-input { width: 100%; }
    .ft-input.small { width: 100%; }
  }
`}</style>


      <div style={{ marginBottom: 16, textAlign: "right" }}>
        <button onClick={handleUpdateBackend} className="ft-btn ft-btn-green">
          Update
        </button>
      </div>

      <div className="ft-header">
        ചാല അന്ത്രു ഹാജി കുടുംബ പരമ്പര (ആകെ അംഗങ്ങൾ: {2 + countMembers(tree.children)})
      </div>

      <div className="ft-controls">
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
            പിതാവ്
          </label>
          <div className="ft-row">
            <input
              className="ft-input"
              value={tree.father}
              onChange={(e) => setTree({ ...tree, father: e.target.value })}
              placeholder="പിതാവ്"
            />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
            ഭാര്യ
          </label>
          <div className="ft-row">
            <input
              className="ft-input"
              value={tree.mother}
              onChange={(e) => setTree({ ...tree, mother: e.target.value })}
              placeholder="ഭാര്യ"
            />
          </div>
        </div>
      </div>

      <div>
        {(tree.children || []).map((child) => (
          <Node key={child.id} node={child} level={0} />
        ))}
      </div>
    </div>
  );
}
