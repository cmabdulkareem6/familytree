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
        ? { id: makeId(), name: n, spouses: [], children: [], collapsed: true }
        : {
            id: n.id || makeId(),
            name: n.name || "",
            spouses: n.spouses || [],
            children: normalizeTree(n.children || []),
            collapsed: typeof n.collapsed === "boolean" ? n.collapsed : true,
          }
    );

  const [tree, setTree] = useState({});

  // Fetch tree from backend
  useEffect(() => {
    axios
      .get("https://familytree-365c.onrender.com/family-tree")
      .then((res) =>
        setTree({
          ...res.data,
          children: normalizeTree(res.data.children),
        })
      )
      .catch((err) => console.error("Failed to fetch family tree:", err));
  }, []);

  // Count members recursively
  const countMembers = (nodes) =>
    (nodes || []).reduce(
      (sum, n) => sum + 1 + (n.spouses?.length || 0) + countMembers(n.children),
      0
    );

  // Tree update helpers with immutable updates
  const updateName = (nodes, id, name) =>
    nodes.map((n) =>
      n.id === id
        ? { ...n, name }
        : n.children?.length
        ? { ...n, children: updateName(n.children, id, name) }
        : n
    );

  const addSpouse = (nodes, id) =>
    nodes.map((n) =>
      n.id === id
        ? { ...n, spouses: [...(n.spouses || []), ""] }
        : n.children?.length
        ? { ...n, children: addSpouse(n.children, id) }
        : n
    );

  const updateSpouse = (nodes, id, idx, name) =>
    nodes.map((n) =>
      n.id === id
        ? { ...n, spouses: n.spouses.map((s, i) => (i === idx ? name : s)) }
        : n.children?.length
        ? { ...n, children: updateSpouse(n.children, id, idx, name) }
        : n
    );

  const deleteSpouse = (nodes, id, idx) =>
    nodes.map((n) =>
      n.id === id
        ? { ...n, spouses: n.spouses.filter((_, i) => i !== idx) }
        : n.children?.length
        ? { ...n, children: deleteSpouse(n.children, id, idx) }
        : n
    );

  const addChildToNode = (nodes, id) =>
    nodes.map((n) =>
      n.id === id
        ? {
            ...n,
            children: [
              ...(n.children || []),
              { id: makeId(), name: "", spouses: [], children: [], collapsed: false },
            ],
          }
        : n.children?.length
        ? { ...n, children: addChildToNode(n.children, id) }
        : n
    );

  const deleteNode = (nodes, id) =>
    nodes
      .filter((n) => n.id !== id)
      .map((n) => (n.children?.length ? { ...n, children: deleteNode(n.children, id) } : n));

  const toggleCollapse = (nodes, id) =>
    nodes.map((n) =>
      n.id === id
        ? { ...n, collapsed: !n.collapsed }
        : n.children?.length
        ? { ...n, children: toggleCollapse(n.children, id) }
        : n
    );

  // Handlers
  const handleUpdateName = (id, name) => setTree(prev => ({ ...prev, children: updateName(prev.children, id, name) }));
  const handleAddSpouse = (id) => setTree(prev => ({ ...prev, children: addSpouse(prev.children, id) }));
  const handleUpdateSpouse = (id, idx, name) => setTree(prev => ({ ...prev, children: updateSpouse(prev.children, id, idx, name) }));
  const handleDeleteSpouse = (id, idx) => setTree(prev => ({ ...prev, children: deleteSpouse(prev.children, id, idx) }));
  const handleAddChild = (id) => setTree(prev => ({ ...prev, children: addChildToNode(prev.children, id) }));
  const handleDelete = (id) => setTree(prev => ({ ...prev, children: deleteNode(prev.children, id) }));
  const handleToggle = (id) => setTree(prev => ({ ...prev, children: toggleCollapse(prev.children, id) }));
  const handleFatherChange = (value) => setTree(prev => ({ ...prev, father: value }));
  const handleMotherChange = (value) => setTree(prev => ({ ...prev, mother: value }));

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

  // Memoized Node component to prevent unnecessary re-renders
  const Node = React.memo(
    ({ node, level, handlers }) => {
      const { handleToggle, handleUpdateName, handleAddSpouse, handleAddChild, handleDelete, handleUpdateSpouse, handleDeleteSpouse } = handlers;

      return (
        <div className="ft-node-branch">
          <div className="ft-node" style={{ backgroundColor: colors[level % colors.length] }}>
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
                <button className="ft-btn ft-btn-indigo" onClick={() => handleAddSpouse(node.id)}>+ഭാ</button>
                <button className="ft-btn ft-btn-green" onClick={() => handleAddChild(node.id)}>+കു</button>
                <button className="ft-btn ft-btn-red" onClick={() => handleDelete(node.id)}>🗑</button>
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
                      <button className="ft-btn ft-btn-red" onClick={() => handleDeleteSpouse(node.id, i)}>🗑</button>
                    </div>
                  </div>
                ))}
                <div className="ft-children">
                  {(node.children || []).map((c) => (
                    <Node key={c.id} node={c} level={level + 1} handlers={handlers} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      );
    },
    (prevProps, nextProps) => prevProps.node === nextProps.node // Only re-render if node object changes
  );

  const handlers = { handleToggle, handleUpdateName, handleAddSpouse, handleAddChild, handleDelete, handleUpdateSpouse, handleDeleteSpouse };

  return (
    <div className="ft-root">
      {/* --- Styles --- */}
      <style>{/* Your existing CSS here */}</style>

      <div style={{ marginBottom: 16, textAlign: "right" }}>
        <button onClick={handleUpdateBackend} className="ft-btn ft-btn-green">Update</button>
      </div>

      <div className="ft-header">
        ചാല അന്ത്രു ഹാജി കുടുംബ പരമ്പര (ആകെ അംഗങ്ങൾ: {2 + countMembers(tree.children)})
      </div>

      <div className="ft-controls">
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>പിതാവ്</label>
          <div className="ft-row">
            <input
              className="ft-input"
              value={tree.father}
              onChange={(e) => handleFatherChange(e.target.value)}
              placeholder="പിതാവ്"
            />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>ഭാര്യ</label>
          <div className="ft-row">
            <input
              className="ft-input"
              value={tree.mother}
              onChange={(e) => handleMotherChange(e.target.value)}
              placeholder="ഭാര്യ"
            />
          </div>
        </div>
      </div>

      <div>
        {(tree.children || []).map((child) => (
          <Node key={child.id} node={child} level={0} handlers={handlers} />
        ))}
      </div>
    </div>
  );
}
