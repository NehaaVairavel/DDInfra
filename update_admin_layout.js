const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/admin/AdminLayout.jsx', 'utf8');

const sidebarGroupComponent = `
/* ─── Sidebar Group (Expandable) ─── */
const SidebarGroup = ({ icon: Icon, label, subItems, onSubItemClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full gap-3 px-4 py-3 mx-3 rounded-2xl transition-all duration-300 group relative sidebar-hover text-[#64748B] hover:text-[#111827] cursor-pointer"
        style={{ width: "calc(100% - 24px)", border: "none", background: "transparent" }}
      >
        <div className="flex items-center gap-3">
          <Icon size={17} className="shrink-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-[#111827]" />
          <span className="admin-sidebar-label">{label}</span>
        </div>
        <ChevronDown size={14} className={\`transition-transform duration-300 \${isOpen ? "rotate-180" : ""}\`} />
      </button>
      <div
        className={\`overflow-hidden transition-all duration-300 ease-in-out\`}
        style={{ maxHeight: isOpen ? "200px" : "0", opacity: isOpen ? 1 : 0 }}
      >
        <div className="pl-12 pr-4 py-1 flex flex-col gap-1">
          {subItems.map((item, idx) => (
            <NavLink
              key={idx}
              to={item.path}
              onClick={onSubItemClick}
              className={({ isActive }) =>
                \`block py-2 px-3 rounded-xl text-[12px] font-medium transition-colors \${
                  isActive ? "bg-[#FEF9EC] text-[#F5B301]" : "text-[#64748B] hover:text-[#111827] hover:bg-slate-50"
                }\`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
};
`;

code = code.replace(
  '/* ─── Main AdminLayout ─── */',
  sidebarGroupComponent + '\n/* ─── Main AdminLayout ─── */'
);

code = code.replace(
  '{ icon: Wrench, label: "Parts", path: "/admin/parts" },',
  `{ 
      icon: Wrench, 
      label: "Parts", 
      subItems: [
        { label: "Parts List", path: "/admin/parts" },
        { label: "Add New Part", path: "/admin/add-part" },
      ]
    },`
);

// We must also handle the rendering logic in the menuItems.map
code = code.replace(
  '{menuItems.map((item) => (',
  `{menuItems.map((item, i) => item.subItems ? (
            <SidebarGroup
              key={item.label}
              icon={item.icon}
              label={item.label}
              subItems={item.subItems}
              onSubItemClick={() => setSidebarOpen(false)}
            />
          ) : (`
);

code = code.replace(
  'badge={item.badge}\n            />\n          ))}',
  'badge={item.badge}\n            />\n          ))}'
); // Wait, need to properly close the ternary expression

const replaceMapTarget = `          {menuItems.map((item) => (
            <SidebarItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              path={item.path}
              onClick={() => setSidebarOpen(false)}
              badge={item.badge}
            />
          ))}`;

const replaceMapReplacement = `          {menuItems.map((item) => 
            item.subItems ? (
              <SidebarGroup
                key={item.label}
                icon={item.icon}
                label={item.label}
                subItems={item.subItems}
                onSubItemClick={() => setSidebarOpen(false)}
              />
            ) : (
              <SidebarItem
                key={item.label}
                icon={item.icon}
                label={item.label}
                path={item.path}
                onClick={() => setSidebarOpen(false)}
                badge={item.badge}
              />
            )
          )}`;

code = code.replace(replaceMapTarget, replaceMapReplacement);

fs.writeFileSync('frontend/src/components/admin/AdminLayout.jsx', code);
console.log('Done transforming AdminLayout.jsx');
