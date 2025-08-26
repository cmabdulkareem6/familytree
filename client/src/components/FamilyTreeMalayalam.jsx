import React, { useReducer, useEffect, useState } from "react";
import axios from "axios";

const colors = ["#fef9c3", "#dbeafe", "#dcfce7", "#fde2e2", "#f3e8ff"];

const makeId = () => `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// Helper: recursively update node by id
const updateNode = (nodes, id, updater) =>
  nodes.map((n) =>
    n.id === id ? updater(n) : { ...n, children: updateNode(n.children || [], id, updater) }
  );

// Reducer
function treeReducer(state, action) {
  switch (action.type) {
    case "SET_TREE":
      return action.payload;
    case "UPDATE_NAME":
      return { ...state, children: updateNode(state.children, action.id, (n) => ({ ...n, name: action.name })) };
    case "ADD_CHILD":
      return {
        ...state,
        children: updateNode(state.children, action.id, (n) => ({
          ...n,
          children: [
            ...(n.children || []),
            { id: makeId(), name: "", spouses: [], children: [], collapsed: false },
          ],
        })),
      };
    case "DELETE_NODE":
      const deleteNode = (nodes, id) =>
        nodes
          .filter((n) => n.id !== id)
          .map((n) => ({ ...n, children: deleteNode(n.children, id) }));
      return { ...state, children: deleteNode(state.children, action.id) };
    case "TOGGLE_COLLAPSE":
      return {
        ...state,
        children: updateNode(state.children, action.id, (n) => ({ ...n, collapsed: !n.collapsed })),
      };
    case "ADD_SPOUSE":
      return {
        ...state,
        children: updateNode(state.children, action.id, (n) => ({ ...n, spouses: [...(n.spouses || []), ""] })),
      };
    case "UPDATE_SPOUSE":
      return {
        ...state,
        children: updateNode(state.children, action.id, (n) => {
          const copy = [...(n.spouses || [])];
          copy[action.idx] = action.name;
          return { ...n, spouses: copy };
        }),
      };
    case "DELETE_SPOUSE":
      return {
        ...state,
        children: updateNode(state.children, action.id, (n) => {
          const copy = [...(n.spouses || [])];
          copy.splice(action.idx, 1);
          return { ...n, spouses: copy };
        }),
      };
    default:
      return state;
  }
}

// Count members recursively
const countMembers = (nodes) =>
  (nodes || []).reduce((sum, n) => sum + 1 + (n.spouses?.length || 0) + countMembers(n.children), 0);

export default function FamilyTreeMalayalam() {
  const [tree, dispatch] = useReducer(treeReducer, { father: "", mother: "", children: [] });

  // Fetch tree
  useEffect(() => {
    axios
      .get("https://familytree-365c.onrender.com/family-tree")
      .then((res) => {
        const data = res.data || {};
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

        dispatch({
          type: "SET_TREE",
          payload: {
            father: data.father || "",
            mother: data.mother || "",
            children: normalizeTree(data.children || []),
          },
        });
      })
      .catch((err) => console.error("Failed to fetch family tree:", err));
  }, []);

  const handleUpdateBackend = async () => {
    try {
      const res = await axios.post("https://familytree-365c.onrender.com/update-family-tree", tree, {
        headers: { "Content-Type": "application/json" },
      });
      dispatch({ type: "SET_TREE", payload: res.data });
      alert("Family tree updated!");
    } catch (err) {
      console.error("Update failed:", err);
      alert("Update failed.");
    }
  };

  // Recursive Node component with local state for input
  const Node = ({ node, level }) => {
    const [name, setName] = useState(node.name);

    useEffect(() => setName(node.name), [node.name]);

    return (
      <div className="ft-node-branch">
        <div className="ft-node" style={{ backgroundColor: colors[level % colors.length] }}>
          <div className="ft-row">
            <button className="ft-btn ft-btn-gray" onClick={() => dispatch({ type: "TOGGLE_COLLAPSE", id: node.id })}>
              {node.collapsed ? "+" : "-"}
            </button>
            <input
              className="ft-input"
              value={name}
              placeholder="പേര്"
              onChange={(e) => setName(e.target.value)}
              onBlur={() => dispatch({ type: "UPDATE_NAME", id: node.id, name })}
            />
            <div className="ft-actions">
              <button className="ft-btn ft-btn-indigo" onClick={() => dispatch({ type: "ADD_SPOUSE", id: node.id })}>
                +ഭാ
              </button>
              <button className="ft-btn ft-btn-green" onClick={() => dispatch({ type: "ADD_CHILD", id: node.id })}>
                +കു
              </button>
              <button className="ft-btn ft-btn-red" onClick={() => dispatch({ type: "DELETE_NODE", id: node.id })}>
                🗑
              </button>
            </div>
          </div>

          <div style={{ fontSize: 12, color: "#6b7280", marginLeft: 30 }}>
            ആകെ: {1 + (node.spouses?.length || 0) + countMembers(node.children)}
          </div>

          {!node.collapsed && (
            <>
              {(node.spouses || []).map((s, i) => {
                const [spouseName, setSpouseName] = useState(s);
                useEffect(() => setSpouseName(s), [s]);
                return (
                  <div key={i} className="ft-spouse">
                    <div className="ft-row">
                      <input
                        className="ft-input small"
                        value={spouseName}
                        placeholder="ഭാര്യ/ഭർത്താവ്"
                        onChange={(e) => setSpouseName(e.target.value)}
                        onBlur={() => dispatch({ type: "UPDATE_SPOUSE", id: node.id, idx: i, name: spouseName })}
                      />
                      <button className="ft-btn ft-btn-red" onClick={() => dispatch({ type: "DELETE_SPOUSE", id: node.id, idx: i })}>
                        🗑
                      </button>
                    </div>
                  </div>
                );
              })}
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
  };

  return (
    <div className="ft-root">
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
          <label>പിതാവ്</label>
          <input
            className="ft-input"
            value={tree.father}
            onChange={(e) => dispatch({ type: "SET_TREE", payload: { ...tree, father: e.target.value } })}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>ഭാര്യ</label>
          <input
            className="ft-input"
            value={tree.mother}
            onChange={(e) => dispatch({ type: "SET_TREE", payload: { ...tree, mother: e.target.value } })}
          />
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
