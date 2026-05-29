// ============================================================
// GENERATED FIRST-PASS SCAFFOLD (AI-generated baseline)
// ============================================================
// This file represents the raw output from Qwen Code scaffold
// generation (Prompt 5) BEFORE human review and refactoring.
// This is a documentation artifact — excluded from compilation.
//
// Known issues in this version:
// - Generic component naming ("Card" instead of "StatCard")
// - Inline styles instead of design tokens
// - No semantic HTML (divs everywhere)
// - No accessibility attributes
// - Emoji icons instead of SVGs
// - No responsive considerations
// - No dark mode support
// - Hardcoded data mixed into components
// - No TypeScript interfaces
// - No empty state handling
// ============================================================

export default function DashboardPage() {
  const stats = [
    { label: "Total Revenue", value: "$45,231", change: "+20.1%", up: true },
    { label: "Subscriptions", value: "+2,350", change: "+180.1%", up: true },
    { label: "Sales", value: "+12,234", change: "+19%", up: true },
    { label: "Active Now", value: "+573", change: "-2.5%", up: false },
  ];

  const revenue = [
    { month: "Jan", value: 4000 },
    { month: "Feb", value: 3000 },
    { month: "Mar", value: 5000 },
    { month: "Apr", value: 4500 },
    { month: "May", value: 6000 },
    { month: "Jun", value: 5500 },
  ];

  const activity = [
    { name: "Olivia Martin", action: "Upgraded to Pro plan", time: "2 min ago" },
    { name: "Jackson Lee", action: "Submitted a support ticket", time: "15 min ago" },
    { name: "Isabella Nguyen", action: "Completed onboarding", time: "1 hr ago" },
    { name: "William Kim", action: "Exported analytics report", time: "3 hr ago" },
    { name: "Sofia Davis", action: "Invited 2 team members", time: "5 hr ago" },
  ];

  const maxRevenue = Math.max(...revenue.map((d) => d.value));

  return (
    <div style={{ padding: "32px", maxWidth: "1280px", margin: "0 auto" }}>
      <h2 style={{ fontSize: "28px", fontWeight: "bold" }}>Dashboard</h2>
      <p style={{ color: "#71717a" }}>
        Welcome back! Here's what's happening with your platform.
      </p>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginTop: "24px" }}>
        {stats.map((stat) => (
          <div
            key={stat.label}
            style={{
              border: "1px solid #e4e4e7",
              borderRadius: "8px",
              padding: "24px",
              background: "#fff",
            }}
          >
            <p style={{ fontSize: "13px", color: "#71717a" }}>{stat.label}</p>
            <p style={{ fontSize: "26px", fontWeight: "bold", marginTop: "8px" }}>
              {stat.value}
            </p>
            <p style={{ color: stat.up ? "green" : "red", fontSize: "12px", marginTop: "8px" }}>
              {stat.up ? "↑" : "↓"} {stat.change} vs last month
            </p>
          </div>
        ))}
      </div>

      {/* Revenue + Chart */}
      <div style={{ display: "grid", gridTemplateColumns: "4fr 3fr", gap: "24px", marginTop: "24px" }}>
        <div style={{ border: "1px solid #e4e4e7", borderRadius: "8px", padding: "24px", background: "#fff" }}>
          <h3 style={{ fontSize: "17px", fontWeight: "600" }}>Revenue Overview</h3>
          <p style={{ fontSize: "13px", color: "#71717a" }}>Monthly revenue trend</p>
          <div style={{ marginTop: "16px" }}>
            {revenue.map((item) => (
              <div key={item.month} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <span style={{ width: "48px", fontSize: "13px", color: "#71717a" }}>{item.month}</span>
                <div style={{ flex: 1, background: "#f4f4f5", borderRadius: "6px", height: "32px" }}>
                  <div
                    style={{
                      width: `${(item.value / maxRevenue) * 100}%`,
                      height: "100%",
                      background: "#18181b",
                      borderRadius: "6px",
                    }}
                  />
                </div>
                <span style={{ width: "80px", textAlign: "right", fontSize: "13px", fontWeight: "600" }}>
                  ${item.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ border: "1px solid #e4e4e7", borderRadius: "8px", padding: "24px", background: "#fff" }}>
          <h3 style={{ fontSize: "17px", fontWeight: "600" }}>Performance Chart</h3>
          <div
            style={{
              height: "256px",
              border: "2px dashed #e4e4e7",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "16px",
            }}
          >
            <p style={{ color: "#a1a1aa" }}>Chart integration pending</p>
          </div>
        </div>
      </div>

      {/* Activity + Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "24px" }}>
        <div style={{ border: "1px solid #e4e4e7", borderRadius: "8px", padding: "24px", background: "#fff" }}>
          <h3 style={{ fontSize: "17px", fontWeight: "600" }}>Recent Activity</h3>
          {activity.map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "16px 0",
                borderBottom: i < activity.length - 1 ? "1px solid #e4e4e7" : "none",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "#f4f4f5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                {item.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "13px", fontWeight: "500" }}>{item.name}</p>
                <p style={{ fontSize: "12px", color: "#71717a" }}>{item.action}</p>
              </div>
              <span style={{ fontSize: "11px", color: "#a1a1aa" }}>{item.time}</span>
            </div>
          ))}
        </div>
        <div style={{ border: "1px solid #e4e4e7", borderRadius: "8px", padding: "24px", background: "#fff" }}>
          <h3 style={{ fontSize: "17px", fontWeight: "600" }}>Quick Actions</h3>
          <p style={{ fontSize: "13px", color: "#71717a" }}>Common tasks and shortcuts</p>
          <div style={{ display: "flex", gap: "12px", marginTop: "16px", flexWrap: "wrap" }}>
            <button style={{ padding: "8px 16px", border: "1px solid #e4e4e7", borderRadius: "8px", background: "#fff", cursor: "pointer" }}>
              ➕ Add User
            </button>
            <button style={{ padding: "8px 16px", border: "1px solid #e4e4e7", borderRadius: "8px", background: "#fff", cursor: "pointer" }}>
              📄 Create Report
            </button>
            <button style={{ padding: "8px 16px", border: "1px solid #e4e4e7", borderRadius: "8px", background: "#fff", cursor: "pointer" }}>
              ✉️ Send Invoice
            </button>
            <button style={{ padding: "8px 16px", border: "1px solid #e4e4e7", borderRadius: "8px", background: "#fff", cursor: "pointer" }}>
              ⚙️ View Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
