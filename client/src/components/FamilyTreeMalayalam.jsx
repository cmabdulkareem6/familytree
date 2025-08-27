import React, { useReducer, useEffect, useState } from "react";
import axios from "axios";


const colors = ["#fef9c3", "#dbeafe", "#dcfce7", "#fde2e2", "#f3e8ff"];
const makeId = () => `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;


const updateNode = (nodes, id, updater) =>
  nodes.map((n) =>
    n.id === id ? updater(n) : { ...n, children: updateNode(n.children || [], id, updater) }
  );


function treeReducer(state, action) {
  switch (action.type) {
    case "SET_TREE": return action.payload;
    case "UPDATE_NAME":
      return { ...state, children: updateNode(state.children, action.id, n => ({ ...n, name: action.name })) };
    case "ADD_CHILD":
      return { ...state, children: updateNode(state.children, action.id, n => ({ ...n, children: [...(n.children || []), { id: makeId(), name: "", spouses: [], children: [], collapsed: false }] })) };
    case "DELETE_NODE":
      const deleteNode = (nodes, id) =>
        nodes.filter(n => n.id !== id).map(n => ({ ...n, children: deleteNode(n.children, id) }));
      return { ...state, children: deleteNode(state.children, action.id) };
    case "TOGGLE_COLLAPSE":
      return { ...state, children: updateNode(state.children, action.id, n => ({ ...n, collapsed: !n.collapsed })) };
    case "ADD_SPOUSE":
      return { ...state, children: updateNode(state.children, action.id, n => ({ ...n, spouses: [...(n.spouses || []), ""] })) };
    case "UPDATE_SPOUSE":
      return { ...state, children: updateNode(state.children, action.id, n => { const copy = [...(n.spouses || [])]; copy[action.idx] = action.name; return { ...n, spouses: copy }; }) };
    case "DELETE_SPOUSE":
      return { ...state, children: updateNode(state.children, action.id, n => { const copy = [...(n.spouses || [])]; copy.splice(action.idx, 1); return { ...n, spouses: copy }; }) };
    default: return state;
  }
}


const countMembers = (nodes) =>
  (nodes || []).reduce((sum, n) => sum + 1 + (n.spouses?.length || 0) + countMembers(n.children), 0);


export default function FamilyTreeMalayalam() {
  const [tree, dispatch] = useReducer(treeReducer, { father: "", mother: "", children: [] });
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    setLoading(true);
    axios.get("https://familytree-365c.onrender.com/family-tree").then(res => {
      const data = res.data || {};
      const normalizeTree = nodes => (nodes || []).map(n => typeof n === "string" ? { id: makeId(), name: n, spouses: [], children: [], collapsed: true } : { id: n.id || makeId(), name: n.name || "", spouses: n.spouses || [], children: normalizeTree(n.children || []), collapsed: typeof n.collapsed === "boolean" ? n.collapsed : true });
      dispatch({ type: "SET_TREE", payload: { father: data.father || "", mother: data.mother || "", children: normalizeTree(data.children || []) } });
    }).catch(err => console.error("Failed to fetch family tree:", err)).finally(() => setLoading(false));
  }, []);


  const handleUpdateBackend = async () => {
    const password = prompt("Enter password to update family tree:");
    if (password === "ah2211") {
      try {
        setLoading(true);
        const res = await axios.post(
          "https://familytree-365c.onrender.com/update-family-tree",
          tree,
          { headers: { "Content-Type": "application/json" } }
        );
        dispatch({ type: "SET_TREE", payload: res.data });
        alert("Family tree updated!");
      } catch (err) {
        console.error("Update failed:", err);
        alert("Update failed.");
      } finally {
        setLoading(false);
      }
    } else {
      alert("Incorrect password!");
    }
  };


  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div style={{ width: 40, height: 40, border: "4px solid #e5e7eb", borderTop: "4px solid #4f46e5", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }`}</style>
      </div>
    );
  }

  const Node = ({ node, level }) => {
    const [name, setName] = useState(node.name);
    useEffect(() => setName(node.name), [node.name]);

    return (
      <div className="ft-node-branch">
        <div className="ft-node" style={{ backgroundColor: colors[level % colors.length] }}>
          <div className="ft-row">
            <button className="ft-btn ft-btn-gray" onClick={() => dispatch({ type: "TOGGLE_COLLAPSE", id: node.id })}>{node.collapsed ? "+" : "-"}</button>
            <input className="ft-input" value={name} placeholder="പേര്" onChange={e => setName(e.target.value)} onBlur={() => dispatch({ type: "UPDATE_NAME", id: node.id, name })} />
            <div className="ft-actions">
              <button className="ft-btn ft-btn-indigo" onClick={() => dispatch({ type: "ADD_SPOUSE", id: node.id })}>+❤</button>
              <button className="ft-btn ft-btn-green" onClick={() => dispatch({ type: "ADD_CHILD", id: node.id })}>+👨🏻‍🦱</button>
              <button className="ft-btn ft-btn-red" onClick={() => dispatch({ type: "DELETE_NODE", id: node.id })}>🗑</button>
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginLeft: 30 }}>ആകെ: {1 + (node.spouses?.length || 0) + countMembers(node.children)}</div>

          {!node.collapsed && <>
            {(node.spouses || []).map((s, i) => {
              const [spouseName, setSpouseName] = useState(s);
              useEffect(() => setSpouseName(s), [s]);
              return (
                <div key={i} className="ft-spouse">
                  <div className="ft-row">
                    <input className="ft-input small" value={spouseName} placeholder="Husband/Wife" onChange={e => setSpouseName(e.target.value)} onBlur={() => dispatch({ type: "UPDATE_SPOUSE", id: node.id, idx: i, name: spouseName })} />
                    <button className="ft-btn ft-btn-red" onClick={() => dispatch({ type: "DELETE_SPOUSE", id: node.id, idx: i })}>🗑</button>
                  </div>
                </div>
              )
            })}
            <div className="ft-children">
              {(node.children || []).map(c => <Node key={c.id} node={c} level={level + 1} />)}
            </div>
          </>}
        </div>
      </div>
    );
  };

  return (
    <div className="ft-root">
      <style>{`
        :root { --bg: #f8fafc; --card: #ffffff; --accent: #4f46e5; --green: #10b981; --red: #ef4444; --gray:#6b7280; }
        .ft-root { padding: 20px; font-family: Inter, sans-serif; max-width: 940px; margin: 8px auto; background: var(--bg); min-height: 100vh; box-sizing: border-box; }
        .ft-header { text-align: center; font-weight: 700; font-size: 20px; margin-bottom: 12px; }
        .ft-controls { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:12px; }
        .ft-input { padding: 8px 10px; border-radius: 10px; border: 1px solid #e6e7eb; font-size: 14px; box-sizing: border-box; }
        .ft-input.small { width: 85%; }
        .ft-row { display:flex; gap:8px; align-items:center; flex-wrap: wrap; }
        .ft-actions { display:flex; gap:8px; flex-wrap:wrap; }
        .ft-btn { padding:6px 10px; border-radius: 8px; border: none; cursor: pointer; font-size:13px; flex: none; }
        .ft-btn-indigo { background: var(--accent); color: white; }
        .ft-btn-green { background: var(--green); color: white; }
        .ft-btn-red { background: var(--red); color: white; }
        .ft-btn-gray { background: var(--gray); color: white; }
        .ft-node-branch { border-left: 3px solid rgba(99,102,241,0.08); margin-left: 0; padding-left: 12px; display: flex; flex-direction: column; max-width: 100%; box-sizing: border-box; overflow-wrap: break-word; }
        .ft-node { border-radius: 12px; padding: 10px; margin: 8px 0; word-break: break-word; }
        .ft-spouse { margin-left: 18px; margin-top: 8px; }
        .ft-children { margin-left: 6px; margin-top: 8px; display: flex; flex-direction: column; flex-wrap: wrap; max-width: 100%; }
        @media screen and (max-width: 768px) { .ft-row { flex-direction: column; align-items: flex-start; } .ft-actions { flex-wrap: wrap; } .ft-input { width: 100%; } .ft-input.small { width: 100%; } }
      `}</style>

      <div style={{ marginBottom: 16, textAlign: "right" }}>
        <button onClick={handleUpdateBackend} className="ft-btn ft-btn-green">Update</button>
      </div>

      <div className="ft-header">
        ചാല അന്ത്രു ഹാജി കുടുംബ പരമ്പര (ആകെ അംഗങ്ങൾ: {2 + countMembers(tree.children)})
      </div>

      <div className="ft-controls">
        <div style={{ flex: 1 }}>
          <label>പിതാവ്</label>
          <input className="ft-input" value={tree.father} onChange={e => dispatch({ type: "SET_TREE", payload: { ...tree, father: e.target.value } })} />
        </div>
        <div style={{ flex: 1 }}>
          <label>ഭാര്യ</label>
          <input className="ft-input" value={tree.mother} onChange={e => dispatch({ type: "SET_TREE", payload: { ...tree, mother: e.target.value } })} />
        </div>
      </div>

      <div>
        {(tree.children || []).map(child => <Node key={child.id} node={child} level={0} />)}
      </div>
    </div>
  );
}
