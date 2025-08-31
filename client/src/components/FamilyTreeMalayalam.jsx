import React, { useReducer, useEffect, useState } from "react";
import axios from "axios";
import DownloadFamilyTreeExcel from "./DownloadFamilyTreeExcel";

const colors = [
  "#fef08a", // warm yellow
  "#93c5fd", // sky blue
  "#86efac", // mint green
  "#fda4af", // rose pink
  "#c4b5fd", // soft violet
  "#fca5a5", // coral red
  "#5eead4", // teal
  "#f9a8d4", // magenta pink
  "#a5f3fc", // light cyan
  "#fcd34d", // amber
];



const makeId = () => `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const updateNode = (nodes, id, updater) =>
  (nodes || []).map((n) =>
    n.id === id
      ? updater(n)
      : { ...n, children: updateNode(n.children || [], id, updater) }
  );

function treeReducer(state, action) {
  switch (action.type) {
    case "SET_TREE":
      return action.payload;
    case "UPDATE_NAME":
      return {
        ...state,
        children: updateNode(state.children, action.id, (n) => ({
          ...n,
          name: action.name,
        })),
      };
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
        (nodes || [])
          .filter((n) => n.id !== id)
          .map((n) => ({ ...n, children: deleteNode(n.children, id) }));
      return { ...state, children: deleteNode(state.children, action.id) };
    case "TOGGLE_COLLAPSE":
      return {
        ...state,
        children: updateNode(state.children, action.id, (n) => ({
          ...n,
          collapsed: !n.collapsed,
        })),
      };
    case "ADD_SPOUSE":
      return {
        ...state,
        children: updateNode(state.children, action.id, (n) => ({
          ...n,
          spouses: [...(n.spouses || []), ""],
        })),
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

const countMembers = (nodes) =>
  (nodes || []).reduce(
    (sum, n) => sum + 1 + (n.spouses?.length || 0) + countMembers(n.children),
    0
  );

export default function FamilyTreeMalayalam() {
  const [tree, dispatch] = useReducer(treeReducer, {
    father: "",
    mother: "",
    children: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios
      .get("https://familytree-365c.onrender.com/family-tree")
      .then((res) => {
        const data = res.data || {};
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
                  collapsed:
                    typeof n.collapsed === "boolean" ? n.collapsed : true,
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
      .catch((err) => console.error("Failed to fetch family tree:", err))
      .finally(() => setLoading(false));
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
      <div className="ft-loading">
        <div className="ft-spinner"></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }`}</style>
      </div>
    );
  }

  const Node = ({ node, level }) => {
    const [name, setName] = useState(node.name);
    useEffect(() => setName(node.name), [node.name]);

    const toggle = () =>
      dispatch({ type: "TOGGLE_COLLAPSE", id: node.id });

    return (
      <div className="ft-node-branch">
        <div
          className="ft-node"
          style={{ backgroundColor: colors[level % colors.length] }}
        >
          <div className="ft-row">
            <button className="ft-toggle" onClick={toggle} aria-label="Toggle">
              {node.collapsed ? "+" : "-"}
            </button>

            <input
              className="ft-input grow"
              value={name}
              placeholder="പേര്"
              onChange={(e) => setName(e.target.value)}
              onBlur={() =>
                dispatch({ type: "UPDATE_NAME", id: node.id, name })
              }
            />

            <div className="ft-actions">
              <button
                className="ft-btn ft-btn-indigo"
                onClick={() => dispatch({ type: "ADD_SPOUSE", id: node.id })}
                title="Add spouse"
              >
                ❤ Spouse
              </button>
              <button
                className="ft-btn ft-btn-green"
                onClick={() => dispatch({ type: "ADD_CHILD", id: node.id })}
                title="Add child"
              >
                + Child
              </button>
              <button
                className="ft-btn ft-btn-red"
                onClick={() => dispatch({ type: "DELETE_NODE", id: node.id })}
                title="Delete"
              >
                🗑 Delete
              </button>
            </div>
          </div>

          <div className="ft-badge">
            ആകെ: {1 + (node.spouses?.length || 0) + countMembers(node.children)}
          </div>

          {!node.collapsed && (
            <>
              {(node.spouses || []).map((s, i) => (
                <div key={i} className="ft-spouse">
                  <div className="ft-row">
                    {/* no hook-in-loop: bind directly to state via dispatch */}
                    <input
                      className="ft-input small"
                      value={s}
                      placeholder="Husband/Wife"
                      onChange={(e) =>
                        dispatch({
                          type: "UPDATE_SPOUSE",
                          id: node.id,
                          idx: i,
                          name: e.target.value,
                        })
                      }
                    />
                    <button
                      className="ft-btn ft-btn-red"
                      onClick={() =>
                        dispatch({
                          type: "DELETE_SPOUSE",
                          id: node.id,
                          idx: i,
                        })
                      }
                    >
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
  };

  return (
    <div className="ft-root">
      <style>{`
        :root {
          --bg: #f6f7fb;
          --surface: #ffffff;
          --border: #e6e7eb;
          --text: #0f172a;
          --muted: #6b7280;
          --accent: #4f46e5;
          --green: #16a34a;
          --red: #ef4444;
          --gray: #64748b;
          --ring: rgba(79,70,229,0.25);
          --shadow: 0 6px 20px rgba(2,6,23,0.06);
        }

        * { box-sizing: border-box; }
        .grow { flex: 1 1 auto; min-width: 180px; }

        .ft-root {
          padding: 28px 16px 60px;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji";
          max-width: 980px;
          margin: 0 auto;
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
        }

        .ft-header {
          background: linear-gradient(135deg, #eef2ff, #fff);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 16px 18px;
          font-weight: 700;
          font-size: 18px;
          text-align: center;
          margin: 6px 0 16px;
          box-shadow: var(--shadow);
        }

        .ft-toolbar {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          align-items: center;
          background: var(--surface);
          border: 1px solid var(--border);
          padding: 10px;
          border-radius: 12px;
          box-shadow: var(--shadow);
          margin-bottom: 14px;
          position: sticky;
          top: 8px;
          z-index: 5;
        }

        .ft-controls {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 14px;
          box-shadow: var(--shadow);
          margin-bottom: 14px;
        }
        .ft-controls label {
          display: block;
          font-size: 12px;
          color: var(--muted);
          margin-bottom: 6px;
        }

        .ft-input {
          width: 100%;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid var(--border);
          font-size: 14px;
          background: #fff;
          outline: none;
          transition: border-color .15s ease, box-shadow .15s ease, background .15s ease;
        }
        .ft-input:hover { background: #fafafa; }
        .ft-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 4px var(--ring);
        }
        .ft-input.small { max-width: 420px; }

        .ft-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }

        .ft-actions { display: flex; gap: 8px; }

        .ft-btn {
          padding: 8px 12px;
          border-radius: 10px;
          border: 1px solid transparent;
          cursor: pointer;
          font-size: 13px;
          line-height: 1;
          transition: transform .04s ease, background .15s ease, box-shadow .15s ease, border-color .15s ease;
          box-shadow: 0 1px 0 rgba(2,6,23,.04);
          user-select: none;
        }
        .ft-btn:hover { box-shadow: 0 4px 14px rgba(2,6,23,.08); transform: translateY(-1px); }
        .ft-btn:active { transform: translateY(0); }
        .ft-btn-indigo { background: var(--accent); color: #fff; }
        .ft-btn-indigo:hover { background: #4338ca; }
        .ft-btn-green { background: var(--green); color: #fff; }
        .ft-btn-green:hover { background: #15803d; }
        .ft-btn-red { background: var(--red); color: #fff; }
        .ft-btn-red:hover { background: #dc2626; }
        .ft-btn-gray { background: var(--gray); color: #fff; }
        .ft-btn-gray:hover { background: #475569; }

        .ft-toggle {
          width: 30px;
          height: 30px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          line-height: 1;
          cursor: pointer;
          transition: box-shadow .15s ease, transform .04s ease, background .15s ease;
        }
        .ft-toggle:hover { background: #f8fafc; box-shadow: 0 4px 14px rgba(2,6,23,.08); transform: translateY(-1px); }
        .ft-toggle:active { transform: translateY(0); }

        .ft-node-branch {
          border-left: 3px solid rgba(79,70,229,0.12);
          margin-left: 0;
          padding-left: 14px;
          display: flex;
          flex-direction: column;
          max-width: 100%;
          overflow-wrap: break-word;
        }

        .ft-node {
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 12px;
          margin: 10px 0;
          box-shadow: var(--shadow);
          word-break: break-word;
          background-clip: padding-box;
        }

        .ft-badge {
          display: inline-block;
          margin: 6px 0 0 40px;
          font-size: 12px;
          color: var(--muted);
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 4px 10px;
        }

        .ft-spouse { margin-left: 40px; margin-top: 8px; }
        .ft-children { margin-left: 10px; margin-top: 8px; display: flex; flex-direction: column; max-width: 100%; }

        .ft-loading {
          display: flex; justify-content: center; align-items: center; height: 100vh; background: var(--bg);
        }
        .ft-spinner {
          width: 44px; height: 44px; border: 4px solid #e5e7eb; border-top: 4px solid var(--accent); border-radius: 50%; animation: spin 1s linear infinite;
        }

        @media (max-width: 768px) {
          .ft-controls { grid-template-columns: 1fr; }
          .ft-input.small { width: 100%; max-width: none; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="ft-toolbar">
        <button onClick={handleUpdateBackend} className="ft-btn ft-btn-green">
          🔄 Update
        </button>
        <DownloadFamilyTreeExcel tree={tree} />
      </div>

      {/* Header */}
      <div className="ft-header">
        ചാല അന്ത്രു ഹാജി കുടുംബ പരമ്പര (ആകെ അംഗങ്ങൾ: {2 + countMembers(tree.children)})
      </div>

      {/* Controls */}
      <div className="ft-controls">
        <div>
          <label>പിതാവ്</label>
          <input
            className="ft-input"
            value={tree.father}
            onChange={(e) =>
              dispatch({
                type: "SET_TREE",
                payload: { ...tree, father: e.target.value },
              })
            }
          />
        </div>
        <div>
          <label>ഭാര്യ</label>
          <input
            className="ft-input"
            value={tree.mother}
            onChange={(e) =>
              dispatch({
                type: "SET_TREE",
                payload: { ...tree, mother: e.target.value },
              })
            }
          />
        </div>
      </div>

      {/* Tree */}
      <div>
        {(tree.children || []).map((child) => (
          <Node key={child.id} node={child} level={0} />
        ))}
      </div>
    </div>
  );
}
