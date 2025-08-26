import React, { useState, useEffect } from "react";
import axios from "axios";

export default function FamilyTreeMalayalam() {
  const makeId = () => `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const colors = ["#fef9c3", "#dbeafe", "#dcfce7", "#fde2e2", "#f3e8ff"];

  const normalizeTree = (nodes) =>
    (nodes || []).map((n) =>
      typeof n === "string"
        ? { id: makeId(), name: n, spouses: [], children: [], collapsed: true }
        : {
            id: n.id || makeId(),
            name: n.name || "",
            spouses: n.spouses || [],
            children: normalizeTree(n.children),
            collapsed: n.collapsed ?? true,
          }
    );

  const [tree, setTree] = useState({});

  useEffect(() => {
    axios
      .get("https://familytree-365c.onrender.com/family-tree")
      .then((res) => setTree({ ...res.data, children: normalizeTree(res.data.children) }))
      .catch((err) => console.error(err));
  }, []);

  const countMembers = (nodes) =>
    (nodes || []).reduce((sum, n) => sum + 1 + (n.spouses?.length || 0) + countMembers(n.children), 0);

  const updateTree = (nodes, callback) => nodes.map((n) => callback(n, n.children));

  const updateName = (nodes, id, name) =>
    nodes.map((n) =>
      n.id === id ? { ...n, name } : { ...n, children: updateName(n.children, id, name) }
    );

  const addSpouse = (nodes, id) =>
    nodes.map((n) =>
      n.id === id ? { ...n, spouses: [...n.spouses, ""] } : { ...n, children: addSpouse(n.children, id) }
    );

  const updateSpouse = (nodes, id, idx, name) =>
    nodes.map((n) =>
      n.id === id ? { ...n, spouses: n.spouses.map((s, i) => (i === idx ? name : s)) } : { ...n, children: updateSpouse(n.children, id, idx, name) }
    );

  const deleteSpouse = (nodes, id, idx) =>
    nodes.map((n) =>
      n.id === id ? { ...n, spouses: n.spouses.filter((_, i) => i !== idx) } : { ...n, children: deleteSpouse(n.children, id, idx) }
    );

  const addChildToNode = (nodes, id) =>
    nodes.map((n) =>
      n.id === id
        ? { ...n, children: [...n.children, { id: makeId(), name: "", spouses: [], children: [], collapsed: false }] }
        : { ...n, children: addChildToNode(n.children, id) }
    );

  const deleteNode = (nodes, id) =>
    nodes.filter((n) => n.id !== id).map((n) => ({ ...n, children: deleteNode(n.children, id) }));

  const toggleCollapse = (nodes, id) =>
    nodes.map((n) => (n.id === id ? { ...n, collapsed: !n.collapsed } : { ...n, children: toggleCollapse(n.children, id) }));

  const handleUpdateBackend = async () => {
    try {
      const res = await axios.post("https://familytree-365c.onrender.com/update-family-tree", tree);
      setTree(res.data);
      alert("Family tree updated!");
    } catch (err) {
      console.error(err);
      alert("Update failed.");
    }
  };

  const Node = ({ node, level }) => (
    <div className="ft-node-branch">
      <div className="ft-node" style={{ backgroundColor: colors[level % colors.length] }}>
        <div className="ft-row">
          <button className="ft-btn ft-btn-gray" onClick={() => setTree({ ...tree, children: toggleCollapse(tree.children, node.id) })}>
            {node.collapsed ? "+" : "-"}
          </button>
          <input className="ft-input" value={node.name} placeholder="പേര്" onChange={(e) => setTree({ ...tree, children: updateName(tree.children, node.id, e.target.value) })} />
          <div className="ft-actions">
            <button className="ft-btn ft-btn-indigo" onClick={() => setTree({ ...tree, children: addSpouse(tree.children, node.id) })}>+ഭാ</button>
            <button className="ft-btn ft-btn-green" onClick={() => setTree({ ...tree, children: addChildToNode(tree.children, node.id) })}>+കു</button>
            <button className="ft-btn ft-btn-red" onClick={() => setTree({ ...tree, children: deleteNode(tree.children, node.id) })}>🗑</button>
          </div>
        </div>

        <div style={{ fontSize: 12, color: "#6b7280", marginLeft: 30 }}>
          ആകെ: {1 + (node.spouses?.length || 0) + countMembers(node.children)}
        </div>

        {!node.collapsed && (
          <>
            {node.spouses.map((s, i) => (
              <div key={i} className="ft-spouse">
                <div className="ft-row">
                  <input className="ft-input small" value={s} placeholder="ഭാര്യ/ഭർത്താവ്" onChange={(e) => setTree({ ...tree, children: updateSpouse(tree.children, node.id, i, e.target.value) })} />
                  <button className="ft-btn ft-btn-red" onClick={() => setTree({ ...tree, children: deleteSpouse(tree.children, node.id, i) })}>🗑</button>
                </div>
              </div>
            ))}
            <div className="ft-children">
              {node.children.map((c) => <Node key={c.id} node={c} level={level + 1} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="ft-root">
      <div style={{ marginBottom: 16, textAlign: "right" }}>
        <button onClick={handleUpdateBackend} className="ft-btn ft-btn-green">Update</button>
      </div>

      <div className="ft-header">
        ചാല അന്ത്രു ഹാജി കുടുംബ പരമ്പര (ആകെ അംഗങ്ങൾ: {2 + countMembers(tree.children)})
      </div>

      <div className="ft-controls">
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>പിതാവ്</label>
          <input className="ft-input" value={tree.father} placeholder="പിതാവ്" onChange={(e) => setTree({ ...tree, father: e.target.value })} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>ഭാര്യ</label>
          <input className="ft-input" value={tree.mother} placeholder="ഭാര്യ" onChange={(e) => setTree({ ...tree, mother: e.target.value })} />
        </div>
      </div>

      <div>
        {(tree.children || []).map((child) => <Node key={child.id} node={child} level={0} />)}
      </div>
    </div>
  );
}
