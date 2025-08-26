import React, { useState, useEffect } from "react";
import axios from "axios";

export default function FamilyTreeMalayalam() {
  const makeId = () =>
    `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const colors = ["#fef9c3", "#dbeafe", "#dcfce7", "#fde2e2", "#f3e8ff"];

  // Recursive node update helper
  const updateNode = (node, id, updater) => {
    if (node.id === id) return updater(node);
    return { ...node, children: node.children.map(c => updateNode(c, id, updater)) };
  };

  // Normalize tree from backend
  const normalizeTree = (nodes) =>
    (nodes || []).map((n) =>
      typeof n === "string"
        ? { id: makeId(), name: n, spouses: [], children: [], collapsed: true }
        : {
            id: n.id || makeId(),
            name: n.name || "",
            spouses: n.spouses || [],
            children: normalizeTree(n.children || []),
            collapsed: typeof n.collapsed === "boolean" ? n.collapsed : true,
          }
    );

  const [tree, setTree] = useState({
    id: makeId(),
    name: "",
    spouses: [],
    children: [],
    collapsed: false,
    father: "",
    mother: "",
  });

  // Fetch tree from backend
  useEffect(() => {
    axios
      .get("https://familytree-365c.onrender.com/family-tree")
      .then((res) => {
        const data = res.data || {};
        setTree({
          id: makeId(),
          name: "",
          spouses: [],
          children: normalizeTree(data.children || []),
          collapsed: false,
          father: data.father || "",
          mother: data.mother || "",
        });
      })
      .catch((err) => console.error("Failed to fetch family tree:", err));
  }, []);

  // Count members recursively
  const countMembers = (node) =>
    1 + (node.spouses?.length || 0) + node.children.reduce((sum, c) => sum + countMembers(c), 0);

  // Handlers
  const handleUpdateName = (id, name) =>
    setTree((prev) => updateNode(prev, id, (n) => ({ ...n, name })));

  const handleAddSpouse = (id) =>
    setTree((prev) => updateNode(prev, id, (n) => ({ ...n, spouses: [...n.spouses, ""] })));

  const handleUpdateSpouse = (id, idx, name) =>
    setTree((prev) =>
      updateNode(prev, id, (n) => ({
        ...n,
        spouses: n.spouses.map((s, i) => (i === idx ? name : s)),
      }))
    );

  const handleDeleteSpouse = (id, idx) =>
    setTree((prev) =>
      updateNode(prev, id, (n) => ({
        ...n,
        spouses: n.spouses.filter((_, i) => i !== idx),
      }))
    );

  const handleAddChild = (id) =>
    setTree((prev) =>
      updateNode(prev, id, (n) => ({
        ...n,
        children: [
          ...n.children,
          { id: makeId(), name: "", spouses: [], children: [], collapsed: false },
        ],
      }))
    );

  const handleDelete = (id) =>
    setTree((prev) => {
      if (prev.id === id) return { ...prev, children: [] }; // prevent deleting root
      const filterNode = (node) => ({
        ...node,
        children: node.children.filter((c) => c.id !== id).map(filterNode),
      });
      return filterNode(prev);
    });

  const handleToggle = (id) =>
    setTree((prev) => updateNode(prev, id, (n) => ({ ...n, collapsed: !n.collapsed })));

  const handleUpdateBackend = async () => {
    try {
      const res = await axios.post(
        "https://familytree-365c.onrender.com/update-family-tree",
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

  // Recursive Node Component
  const Node = ({ node, level }) => (
    <div style={{ borderLeft: "3px solid rgba(99,102,241,0.08)", marginLeft: 0, paddingLeft: 12 }}>
      <div style={{ background: colors[level % colors.length], borderRadius: 12, padding: 10, margin: "8px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => handleToggle(node.id)}>
            {node.collapsed ? "+" : "-"}
          </button>
          <input
            value={node.name}
            placeholder="പേര്"
            onChange={(e) => handleUpdateName(node.id, e.target.value)}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => handleAddSpouse(node.id)}>+ഭാ</button>
            <button onClick={() => handleAddChild(node.id)}>+കു</button>
            <button onClick={() => handleDelete(node.id)}>🗑</button>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#6b7280", marginLeft: 30 }}>
          ആകെ: {countMembers(node)}
        </div>
        {!node.collapsed && (
          <>
            {(node.spouses || []).map((s, i) => (
              <div key={i} style={{ marginLeft: 18, marginTop: 8 }}>
                <input
                  value={s}
                  placeholder="ഭാര്യ/ഭർത്താവ്"
                  onChange={(e) => handleUpdateSpouse(node.id, i, e.target.value)}
                  style={{ width: "85%" }}
                />
                <button onClick={() => handleDeleteSpouse(node.id, i)}>🗑</button>
              </div>
            ))}
            <div style={{ marginLeft: 6, marginTop: 8 }}>
              {node.children.map((c) => (
                <Node key={c.id} node={c} level={level + 1} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ padding: 20, fontFamily: "Inter, sans-serif", maxWidth: 940, margin: "8px auto" }}>
      <div style={{ marginBottom: 16, textAlign: "right" }}>
        <button onClick={handleUpdateBackend}>Update</button>
      </div>

      <div style={{ fontWeight: 700, fontSize: 20, textAlign: "center", marginBottom: 12 }}>
        ചാല അന്ത്രു ഹാജി കുടുംബ പരമ്പര (ആകെ അംഗങ്ങൾ: {countMembers(tree)})
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <input
          value={tree.father}
          onChange={(e) => setTree({ ...tree, father: e.target.value })}
          placeholder="പിതാവ്"
        />
        <input
          value={tree.mother}
          onChange={(e) => setTree({ ...tree, mother: e.target.value })}
          placeholder="ഭാര്യ"
        />
      </div>

      <Node node={tree} level={0} />
    </div>
  );
}
