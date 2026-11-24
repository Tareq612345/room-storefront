/**
 * @file src/modules/admin/components/AdminPortalClient.tsx
 * @purpose Dedicated ROOM Admin & Owner Portal: Login by username/email, 48h single-use invite generator, profile editor, and detailed controls for Store, Universes, Catalog, Loadouts, PageSections, and Cairo Shipping.
 */

"use client";

import {
  Check,
  Copy,
  KeyRound,
  LayoutDashboard,
  Layers,
  LogOut,
  MapPin,
  Package,
  Palette,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
  Truck,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type AdminTab =
  | "overview"
  | "store"
  | "universes"
  | "catalog"
  | "loadouts"
  | "sections"
  | "shipping"
  | "team"
  | "profile";

interface LocalAdminAccount {
  id: string;
  email: string;
  username: string;
  name: string;
  role: "OWNER" | "ADMIN" | "STAFF";
  password: string;
}

interface LocalInvite {
  id: string;
  email: string;
  role: "ADMIN" | "STAFF";
  token: string;
  expiresAt: string;
  usedAt: string | null;
}

const INITIAL_OWNERS: LocalAdminAccount[] = [
  {
    id: "owner_tareq",
    email: "tareq612345@gmail.com",
    username: "tareq",
    name: "Tareq (Owner)",
    role: "OWNER",
    password: "RoomOwner#2026",
  },
  {
    id: "owner_adegddn",
    email: "adegddn@gmail.com",
    username: "adegddn",
    name: "Partner (Owner)",
    role: "OWNER",
    password: "RoomOwner#2026",
  },
];

const INITIAL_UNIVERSES = [
  { id: "univ_cars", slug: "cars", name: "GARAGE & CARS", tagline: "Midnight Touge & Supercar Bedroom Loadouts", accentColor: "#d92323", isActive: true },
  { id: "univ_gaming", slug: "gaming", name: "GAMING ARENA", tagline: "Obsidian RGB & Next-Gen Battle Stations", accentColor: "#6366f1", isActive: true },
  { id: "univ_anime", slug: "anime", name: "ANIME REALM", tagline: "Shonen Arcs, Katana & Neo-Tokyo Vibes", accentColor: "#c94b99", isActive: true },
];

const INITIAL_PRODUCTS = [
  { id: "prod_touge", name: "Midnight Touge Carbon Bedsheet", universe: "cars", price: 1450, stock: 18, isFreshDrop: true },
  { id: "prod_ranked", name: "Obsidian Ranked Arena Bedsheet", universe: "gaming", price: 1390, stock: 12, isFreshDrop: true },
  { id: "prod_eclipse", name: "Neo-Tokyo Eclipse Bedsheet", universe: "anime", price: 1550, stock: 9, isFreshDrop: true },
  { id: "prod_apex", name: "Apex GT Twin Pillowcase Pair", universe: "cars", price: 590, stock: 0, isFreshDrop: true },
];

const INITIAL_ZONES = [
  { id: "z1", name: "New Cairo (5th Settlement / Rehab)", fee: 65, freeThreshold: 2500, days: "1-2 Days", active: true },
  { id: "z2", name: "Nasr City & Heliopolis", fee: 60, freeThreshold: 2500, days: "1-2 Days", active: true },
  { id: "z3", name: "Maadi & Zamalek", fee: 65, freeThreshold: 2500, days: "1-2 Days", active: true },
  { id: "z4", name: "6th of October & Sheikh Zayed", fee: 85, freeThreshold: 3000, days: "2-3 Days", active: true },
];

const INITIAL_SECTIONS = [
  { id: "s1", type: "UNIVERSE_QUICK_BAR", title: "3-Card Universe Showcase", visible: true },
  { id: "s2", type: "NEW_ARRIVALS", title: "Fresh Drops", visible: true },
  { id: "s3", type: "FEATURED_BUNDLES", title: "Signature Loadouts", visible: true },
  { id: "s4", type: "FLASH_DEALS", title: "Midnight Flash Deals", visible: false },
  { id: "s5", type: "CUSTOMER_SETUPS", title: "Cairo Room Setups", visible: false },
];

const STORAGE_ACCOUNTS_KEY = "room_admin_accounts_v1";
const STORAGE_INVITES_KEY = "room_admin_invites_v1";
const STORAGE_SESSION_KEY = "room_admin_session_v1";

export function AdminPortalClient() {
  const [accounts, setAccounts] = useState<LocalAdminAccount[]>(INITIAL_OWNERS);
  const [invites, setInvites] = useState<LocalInvite[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Login form
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  // Dashboard state
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [storeName, setStoreName] = useState("ROOM");
  const [whatsapp, setWhatsapp] = useState("+201000000000");
  const [defaultAccent, setDefaultAccent] = useState("#ffffff");

  const [universes, setUniverses] = useState(INITIAL_UNIVERSES);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [zones, setZones] = useState(INITIAL_ZONES);
  const [sections, setSections] = useState(INITIAL_SECTIONS);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "STAFF">("ADMIN");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Profile form
  const [profileName, setProfileName] = useState("");
  const [profileUsername, setProfileUsername] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileNewPassword, setProfileNewPassword] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    try {
      const savedAccounts = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
      if (savedAccounts) {
        setAccounts(JSON.parse(savedAccounts) as LocalAdminAccount[]);
      } else {
        localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(INITIAL_OWNERS));
      }

      const savedInvites = localStorage.getItem(STORAGE_INVITES_KEY);
      if (savedInvites) {
        setInvites(JSON.parse(savedInvites) as LocalInvite[]);
      }

      const savedSession = localStorage.getItem(STORAGE_SESSION_KEY);
      if (savedSession) {
        setCurrentUserId(savedSession);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const currentUser = accounts.find((a) => a.id === currentUserId) ?? null;

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name);
      setProfileUsername(currentUser.username);
      setProfileEmail(currentUser.email);
    }
  }, [currentUser]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const idClean = identifier.trim().toLowerCase();
    const found = accounts.find(
      (a) =>
        (a.email.toLowerCase() === idClean ||
          a.username.toLowerCase() === idClean) &&
        a.password === password
    );

    if (!found) {
      setLoginError("Invalid username/email or password");
      return;
    }

    setCurrentUserId(found.id);
    localStorage.setItem(STORAGE_SESSION_KEY, found.id);
    setPassword("");
  };

  const handleLogout = () => {
    setCurrentUserId(null);
    localStorage.removeItem(STORAGE_SESSION_KEY);
  };

  const handleCreateInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    const token = Array.from(crypto.getRandomValues(new Uint8Array(18)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const newInvite: LocalInvite = {
      id: `inv_${Date.now()}`,
      email: inviteEmail.trim().toLowerCase(),
      role: inviteRole,
      token,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      usedAt: null,
    };

    const next = [newInvite, ...invites];
    setInvites(next);
    localStorage.setItem(STORAGE_INVITES_KEY, JSON.stringify(next));
    setInviteEmail("");
  };

  const getInviteUrl = (token: string) => {
    if (typeof window === "undefined") return `/admin/invite/?token=${token}`;
    const base = window.location.pathname.replace(/\/admin\/?$/, "");
    return `${window.location.origin}${base}/admin/invite/?token=${token}`;
  };

  const handleCopyInvite = (token: string) => {
    navigator.clipboard.writeText(getInviteUrl(token));
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 1800);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const updated = accounts.map((acc) =>
      acc.id === currentUser.id
        ? {
            ...acc,
            name: profileName.trim() || acc.name,
            username: profileUsername.trim() || acc.username,
            email: profileEmail.trim().toLowerCase() || acc.email,
            password:
              profileNewPassword.trim().length >= 6
                ? profileNewPassword.trim()
                : acc.password,
          }
        : acc
    );

    setAccounts(updated);
    localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(updated));
    setProfileNewPassword("");
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  // ============================================================================
  // LOGIN VIEW
  // ============================================================================
  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05030a] px-4 text-white">
        <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#0c0916]/95 p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-semibold tracking-[0.16em]">
                ROOM ADMIN
              </h1>
              <p className="text-xs text-white/55">
                Sign in with Username or Email
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/70">
                Username or Email
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="tareq or tareq612345@gmail.com"
                required
                className="h-11 w-full rounded-xl border border-white/15 bg-black/60 px-4 text-sm text-white placeholder:text-white/35 focus:border-white/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/70">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-11 w-full rounded-xl border border-white/15 bg-black/60 px-4 text-sm text-white placeholder:text-white/35 focus:border-white/50 focus:outline-none"
              />
            </div>

            {loginError ? (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {loginError}
              </p>
            ) : null}

            <button
              type="submit"
              className="h-11 w-full rounded-full bg-white text-xs font-bold uppercase tracking-[0.18em] text-black transition-opacity hover:opacity-90"
            >
              Enter Control Center
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-[11px] text-white/60">
            <p className="font-semibold text-white/85">Seeded Owners:</p>
            <p className="mt-1 font-mono">
              tareq612345@gmail.com (user: <span className="text-white">tareq</span>)
            </p>
            <p className="font-mono">
              adegddn@gmail.com (user: <span className="text-white">adegddn</span>)
            </p>
            <p className="mt-1 text-white/45">
              Initial password: <span className="font-mono text-white/75">RoomOwner#2026</span> (change in Profile)
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // ADMIN CONTROL CENTER
  // ============================================================================
  const navItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: "store", label: "Store & Theme", icon: <Palette className="h-4 w-4" /> },
    { id: "universes", label: "Universes", icon: <Sparkles className="h-4 w-4" /> },
    { id: "catalog", label: "Catalog & Stock", icon: <Package className="h-4 w-4" /> },
    { id: "sections", label: "Home Builder", icon: <Layers className="h-4 w-4" /> },
    { id: "shipping", label: "Cairo Shipping", icon: <Truck className="h-4 w-4" /> },
    { id: "team", label: "Owners & Invites", icon: <Users className="h-4 w-4" /> },
    { id: "profile", label: "My Profile", icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <div className="flex min-h-screen bg-[#05030a] text-white">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-[#080611] p-5 md:flex">
        <div className="flex items-center justify-between">
          <span className="font-serif text-lg font-semibold tracking-[0.2em]">
            ROOM ADMIN
          </span>
          <span className="rounded-full border border-amber-400/35 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">
            {currentUser.role}
          </span>
        </div>

        <nav className="mt-8 flex-1 space-y-1.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-colors ${
                activeTab === item.id
                  ? "bg-white text-black"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="border-t border-white/10 pt-4 space-y-2">
          <Link
            href="/"
            className="block rounded-xl border border-white/15 px-3 py-2 text-center text-xs font-semibold text-white/80 hover:bg-white/5"
          >
            View Storefront →
          </Link>
          <Link
            href="/schema/"
            className="block rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-center text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20"
          >
            DB Schema Explorer →
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        {/* Top Mobile Nav */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 md:hidden">
          <span className="font-serif text-base font-semibold tracking-widest">
            ROOM ADMIN
          </span>
          <div className="flex flex-wrap gap-1.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                  activeTab === item.id
                    ? "bg-white text-black"
                    : "border border-white/15 text-white/75"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* TAB: OVERVIEW */}
        {activeTab === "overview" ? (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-semibold">
                Welcome back, {currentUser.name}
              </h2>
              <p className="mt-1 text-xs text-white/55">
                Signed in as @{currentUser.username} ({currentUser.email}) •{" "}
                {currentUser.role}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Active Universes", value: universes.filter((u) => u.isActive).length },
                { label: "Catalog Products", value: products.length },
                { label: "Cairo Shipping Zones", value: zones.filter((z) => z.active).length },
                { label: "Owners & Admins", value: accounts.length },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-[#0d0a16] p-5"
                >
                  <p className="text-xs text-white/55">{stat.label}</p>
                  <p className="mt-2 font-serif text-3xl font-semibold text-white">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* TAB: STORE & THEME */}
        {activeTab === "store" ? (
          <div className="max-w-xl space-y-5">
            <h2 className="font-serif text-2xl font-semibold">Store &amp; Theme Tokens</h2>
            <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0d0a16] p-6">
              <div>
                <label className="mb-1 block text-xs text-white/65">Store Name</label>
                <input
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="h-10 w-full rounded-xl border border-white/15 bg-black/50 px-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/65">WhatsApp Order Number</label>
                <input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="h-10 w-full rounded-xl border border-white/15 bg-black/50 px-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/65">Home Default Accent</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={defaultAccent}
                    onChange={(e) => setDefaultAccent(e.target.value)}
                    className="h-10 w-14 rounded-lg border border-white/15 bg-transparent"
                  />
                  <span className="font-mono text-xs text-white/75">{defaultAccent}</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* TAB: UNIVERSES */}
        {activeTab === "universes" ? (
          <div className="space-y-5">
            <h2 className="font-serif text-2xl font-semibold">Universes Control</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {universes.map((u) => (
                <div
                  key={u.id}
                  className="rounded-2xl border border-white/10 bg-[#0d0a16] p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-white/55">/{u.slug}</span>
                    <input
                      type="color"
                      value={u.accentColor}
                      onChange={(e) =>
                        setUniverses((prev) =>
                          prev.map((x) =>
                            x.id === u.id ? { ...x, accentColor: e.target.value } : x
                          )
                        )
                      }
                      className="h-7 w-10 rounded border border-white/15 bg-transparent"
                    />
                  </div>
                  <input
                    value={u.name}
                    onChange={(e) =>
                      setUniverses((prev) =>
                        prev.map((x) =>
                          x.id === u.id ? { ...x, name: e.target.value } : x
                        )
                      )
                    }
                    className="h-9 w-full rounded-lg border border-white/15 bg-black/50 px-3 text-sm font-semibold"
                  />
                  <input
                    value={u.tagline}
                    onChange={(e) =>
                      setUniverses((prev) =>
                        prev.map((x) =>
                          x.id === u.id ? { ...x, tagline: e.target.value } : x
                        )
                      )
                    }
                    className="h-9 w-full rounded-lg border border-white/15 bg-black/50 px-3 text-xs text-white/80"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* TAB: CATALOG & STOCK */}
        {activeTab === "catalog" ? (
          <div className="space-y-5">
            <h2 className="font-serif text-2xl font-semibold">Catalog &amp; Vaulted Stock</h2>
            <div className="space-y-3">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0d0a16] p-4"
                >
                  <div>
                    <h3 className="text-sm font-semibold">{p.name}</h3>
                    <p className="font-mono text-xs text-white/50">Universe: {p.universe}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-white/60">
                      EGP
                      <input
                        type="number"
                        value={p.price}
                        onChange={(e) =>
                          setProducts((prev) =>
                            prev.map((x) =>
                              x.id === p.id ? { ...x, price: Number(e.target.value) } : x
                            )
                          )
                        }
                        className="ml-2 h-8 w-24 rounded-lg border border-white/15 bg-black/50 px-2 text-xs text-white"
                      />
                    </label>
                    <label className="text-xs text-white/60">
                      Stock
                      <input
                        type="number"
                        value={p.stock}
                        onChange={(e) =>
                          setProducts((prev) =>
                            prev.map((x) =>
                              x.id === p.id ? { ...x, stock: Number(e.target.value) } : x
                            )
                          )
                        }
                        className="ml-2 h-8 w-20 rounded-lg border border-white/15 bg-black/50 px-2 text-xs text-white"
                      />
                    </label>
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${
                        p.stock <= 0
                          ? "bg-zinc-700 text-white"
                          : "bg-emerald-500/20 text-emerald-300"
                      }`}
                    >
                      {p.stock <= 0 ? "Vaulted" : "In Stock"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* TAB: HOME BUILDER */}
        {activeTab === "sections" ? (
          <div className="max-w-2xl space-y-5">
            <h2 className="font-serif text-2xl font-semibold">Homepage Section Builder</h2>
            <div className="space-y-2.5">
              {sections.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0d0a16] px-5 py-3.5"
                >
                  <div>
                    <p className="text-sm font-semibold">{s.title}</p>
                    <p className="font-mono text-[11px] text-white/45">{s.type}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setSections((prev) =>
                        prev.map((x) =>
                          x.id === s.id ? { ...x, visible: !x.visible } : x
                        )
                      )
                    }
                    className={`rounded-full px-4 py-1.5 text-xs font-bold ${
                      s.visible
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-white/10 text-white/50"
                    }`}
                  >
                    {s.visible ? "Visible" : "Hidden"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* TAB: CAIRO SHIPPING */}
        {activeTab === "shipping" ? (
          <div className="space-y-5">
            <h2 className="font-serif text-2xl font-semibold">Cairo &amp; New Cairo Shipping Zones</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {zones.map((z) => (
                <div
                  key={z.id}
                  className="rounded-2xl border border-white/10 bg-[#0d0a16] p-5 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-cyan-300" />
                    <h3 className="text-sm font-semibold">{z.name}</h3>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs">
                    <label className="text-white/60">
                      Fee (EGP)
                      <input
                        type="number"
                        value={z.fee}
                        onChange={(e) =>
                          setZones((prev) =>
                            prev.map((x) =>
                              x.id === z.id ? { ...x, fee: Number(e.target.value) } : x
                            )
                          )
                        }
                        className="ml-2 h-8 w-20 rounded-lg border border-white/15 bg-black/50 px-2 text-white"
                      />
                    </label>
                    <label className="text-white/60">
                      Free Above
                      <input
                        type="number"
                        value={z.freeThreshold}
                        onChange={(e) =>
                          setZones((prev) =>
                            prev.map((x) =>
                              x.id === z.id
                                ? { ...x, freeThreshold: Number(e.target.value) }
                                : x
                            )
                          )
                        }
                        className="ml-2 h-8 w-24 rounded-lg border border-white/15 bg-black/50 px-2 text-white"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* TAB: TEAM, OWNERS & 48H INVITES */}
        {activeTab === "team" ? (
          <div className="space-y-8">
            <div>
              <h2 className="font-serif text-2xl font-semibold">Owners &amp; Admin Team</h2>
              <p className="mt-1 text-xs text-white/55">
                Invite a new admin by email to generate a 48-hour single-use onboarding link.
              </p>
            </div>

            {/* Invite Form */}
            <form
              onSubmit={handleCreateInvite}
              className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-[#0d0a16] p-5"
            >
              <div className="flex-1 min-w-[220px]">
                <label className="mb-1.5 block text-xs font-semibold text-white/70">
                  Admin Email
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="new-admin@example.com"
                  className="h-10 w-full rounded-xl border border-white/15 bg-black/50 px-3 text-sm text-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-white/70">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "ADMIN" | "STAFF")}
                  className="h-10 rounded-xl border border-white/15 bg-black/50 px-3 text-sm text-white"
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="STAFF">STAFF</option>
                </select>
              </div>

              <button
                type="submit"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-5 text-xs font-bold uppercase tracking-wider text-black hover:opacity-90"
              >
                <UserPlus className="h-4 w-4" />
                Generate 48h Invite Link
              </button>
            </form>

            {/* Generated Single-Use Links */}
            {invites.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/60">
                  Single-Use Invite Links (Valid 48 Hours)
                </h3>
                {invites.map((inv) => {
                  const expired = new Date(inv.expiresAt).getTime() < Date.now();
                  return (
                    <div
                      key={inv.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0d0a16] p-4"
                    >
                      <div>
                        <p className="text-sm font-semibold">{inv.email}</p>
                        <p className="text-xs text-white/50">
                          Role: {inv.role} • Expires:{" "}
                          {new Date(inv.expiresAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {inv.usedAt ? (
                          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                            Used
                          </span>
                        ) : expired ? (
                          <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-300">
                            Expired
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleCopyInvite(inv.token)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-500/15 px-4 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/25"
                          >
                            {copiedToken === inv.token ? (
                              <>
                                <Check className="h-3.5 w-3.5" /> Copied Link
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" /> Copy Invite Link
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {/* Active Team List */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/60">
                Active Accounts ({accounts.length})
              </h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0d0a16] p-4"
                  >
                    <div className="flex items-center gap-3">
                      <UserCheck className="h-5 w-5 text-white/70" />
                      <div>
                        <p className="text-sm font-semibold">{acc.name}</p>
                        <p className="font-mono text-xs text-white/55">
                          @{acc.username} • {acc.email}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full border border-amber-400/35 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                      {acc.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {/* TAB: MY PROFILE (Set Username, Email, Password) */}
        {activeTab === "profile" ? (
          <div className="max-w-xl space-y-5">
            <div>
              <h2 className="font-serif text-2xl font-semibold">My Profile &amp; Username</h2>
              <p className="mt-1 text-xs text-white/55">
                Set a custom username so you can sign in with Username + Password without needing your email.
              </p>
            </div>

            <form
              onSubmit={handleSaveProfile}
              className="space-y-4 rounded-2xl border border-white/10 bg-[#0d0a16] p-6"
            >
              <div>
                <label className="mb-1 block text-xs text-white/65">Display Name</label>
                <input
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  required
                  className="h-10 w-full rounded-xl border border-white/15 bg-black/50 px-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-white/65">
                  Username (Login without Email)
                </label>
                <input
                  value={profileUsername}
                  onChange={(e) => setProfileUsername(e.target.value)}
                  required
                  pattern="^[a-zA-Z0-9_]+$"
                  className="h-10 w-full rounded-xl border border-white/15 bg-black/50 px-3 font-mono text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-white/65">Email</label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  required
                  className="h-10 w-full rounded-xl border border-white/15 bg-black/50 px-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1.5 text-xs text-white/65">
                  <KeyRound className="h-3.5 w-3.5" />
                  New Password (leave blank to keep current)
                </label>
                <input
                  type="password"
                  value={profileNewPassword}
                  onChange={(e) => setProfileNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="h-10 w-full rounded-xl border border-white/15 bg-black/50 px-3 text-sm"
                />
              </div>

              <button
                type="submit"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-6 text-xs font-bold uppercase tracking-wider text-black hover:opacity-90"
              >
                {profileSaved ? (
                  <>
                    <Check className="h-4 w-4" /> Saved
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> Save Profile
                  </>
                )}
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
}
