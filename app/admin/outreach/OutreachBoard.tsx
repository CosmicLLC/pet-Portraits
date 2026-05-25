"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

interface Contact {
  id: string
  name: string
  channel: string
  handle: string
  email: string | null
  url: string | null
  niche: string | null
  followers: number | null
  priority: number
  subject: string | null
  body: string | null
  notes: string | null
  status: string
  sentAt: string | null
  repliedAt: string | null
  acceptedAt: string | null
  postedAt: string | null
}

type Filter = "all" | "pending" | "sent" | "replied" | "accepted" | "posted" | "passed" | "no_reply"

const STATUS_OPTIONS: { v: Contact["status"]; label: string; tone: string }[] = [
  { v: "pending", label: "Pending", tone: "bg-gray-100 text-gray-600" },
  { v: "sent", label: "Sent", tone: "bg-blue-100 text-blue-700" },
  { v: "replied", label: "Replied", tone: "bg-amber-100 text-amber-700" },
  { v: "accepted", label: "Accepted", tone: "bg-brand-green/10 text-brand-green" },
  { v: "posted", label: "Posted", tone: "bg-brand-gold/15 text-brand-gold" },
  { v: "passed", label: "Passed", tone: "bg-red-50 text-red-600" },
  { v: "no_reply", label: "No reply", tone: "bg-gray-100 text-gray-500" },
]

const CHANNEL_LABEL: Record<string, string> = {
  blogger: "📝 Blogger",
  instagram: "📷 Instagram",
  tiktok: "🎬 TikTok",
  podcast: "🎙️ Podcast",
  youtube: "▶️ YouTube",
  other: "🌐 Other",
}

const PRIORITY_LABEL: Record<number, { label: string; tone: string }> = {
  1: { label: "P1 · top fit", tone: "bg-brand-green/15 text-brand-green" },
  2: { label: "P2 · good fit", tone: "bg-gray-100 text-gray-600" },
  3: { label: "P3 · maybe", tone: "bg-gray-100 text-gray-400" },
}

export default function OutreachBoard() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [filter, setFilter] = useState<Filter>("all")
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Contact | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [seedMsg, setSeedMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/outreach${filter !== "all" ? `?status=${filter}` : ""}`)
      const data = await res.json()
      setContacts(data.contacts || [])
      setCounts(data.counts || {})
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    load()
  }, [load])

  const seed = useCallback(async () => {
    setSeedMsg("Seeding…")
    const res = await fetch("/api/admin/outreach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "seed" }),
    })
    const data = await res.json()
    setSeedMsg(`Seeded ${data.created} new contacts (${data.skipped} already existed).`)
    setTimeout(() => setSeedMsg(null), 4000)
    load()
  }, [load])

  const updateStatus = useCallback(
    async (id: string, status: string) => {
      await fetch("/api/admin/outreach", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })
      load()
      if (selected?.id === id) setSelected((s) => (s ? { ...s, status } : null))
    },
    [load, selected]
  )

  const removeContact = useCallback(
    async (id: string) => {
      if (!confirm("Delete this contact? This is permanent.")) return
      await fetch(`/api/admin/outreach?id=${id}`, { method: "DELETE" })
      setSelected(null)
      load()
    },
    [load]
  )

  const filteredCount = contacts.length
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <>
      {/* Pipeline header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <p className="text-xs font-display font-semibold uppercase tracking-wider text-gray-500">
            Pipeline · {totalCount} total
          </p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={seed}
              className="text-xs bg-brand-green/10 border border-brand-green/30 text-brand-green px-3 py-1.5 rounded-full hover:bg-brand-green/20"
            >
              + Seed 9 pet blogger drafts
            </button>
            <button
              onClick={() => setShowAdd((v) => !v)}
              className="text-xs bg-brand-green text-cream px-3 py-1.5 rounded-full font-semibold hover:bg-brand-green/90"
            >
              + Add influencer
            </button>
          </div>
        </div>
        {seedMsg && <p className="text-xs text-brand-green mb-2">{seedMsg}</p>}
        <div className="flex gap-2 flex-wrap">
          <FilterChip label="All" count={totalCount} active={filter === "all"} onClick={() => setFilter("all")} />
          {STATUS_OPTIONS.map((s) => (
            <FilterChip
              key={s.v}
              label={s.label}
              count={counts[s.v] || 0}
              active={filter === s.v}
              onClick={() => setFilter(s.v as Filter)}
            />
          ))}
        </div>
      </div>

      {/* Add influencer form */}
      {showAdd && (
        <AddInfluencerForm
          onAdded={() => {
            setShowAdd(false)
            load()
          }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {/* List */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">Loading…</div>
        ) : filteredCount === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            {totalCount === 0
              ? "No contacts yet. Click 'Seed 9 pet blogger drafts' to start."
              : "No contacts match this filter."}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {contacts.map((c) => {
              const status = STATUS_OPTIONS.find((s) => s.v === c.status)
              const pri = PRIORITY_LABEL[c.priority] || PRIORITY_LABEL[2]
              return (
                <li key={c.id} className="px-5 py-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-display text-base font-semibold text-gray-800 truncate">
                          {c.handle}
                        </p>
                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${status?.tone || "bg-gray-100 text-gray-500"}`}>
                          {status?.label || c.status}
                        </span>
                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${pri.tone}`}>
                          {pri.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">
                        {CHANNEL_LABEL[c.channel] || c.channel}
                        {c.name && c.name !== c.handle ? ` · ${c.name}` : null}
                        {c.followers ? ` · ${c.followers.toLocaleString()} followers` : null}
                        {c.email ? ` · ${c.email}` : null}
                      </p>
                      {c.niche && <p className="text-xs text-gray-400 truncate">{c.niche}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setSelected(c)}
                        className="text-xs bg-brand-green text-cream px-3 py-1.5 rounded-full font-semibold hover:bg-brand-green/90"
                      >
                        Open
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <ContactDetail
          contact={selected}
          onClose={() => setSelected(null)}
          onStatusChange={(s) => updateStatus(selected.id, s)}
          onDelete={() => removeContact(selected.id)}
        />
      )}
    </>
  )
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
        active
          ? "bg-brand-green text-cream border-brand-green"
          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
      }`}
    >
      {label} <span className="opacity-60">· {count}</span>
    </button>
  )
}

function AddInfluencerForm({
  onAdded,
  onCancel,
}: {
  onAdded: () => void
  onCancel: () => void
}) {
  const [name, setName] = useState("")
  const [handle, setHandle] = useState("")
  const [channel, setChannel] = useState<"instagram" | "tiktok" | "blogger" | "podcast" | "youtube" | "other">("instagram")
  const [url, setUrl] = useState("")
  const [niche, setNiche] = useState("")
  const [followers, setFollowers] = useState("")
  const [email, setEmail] = useState("")
  const [petName, setPetName] = useState("")
  const [recentPost, setRecentPost] = useState("")
  const [busy, setBusy] = useState(false)

  // Auto-generate DM body when channel is IG/TikTok using the plan's template
  const dmBody = useMemo(() => {
    if (channel !== "instagram" && channel !== "tiktok") return ""
    const greeting = name ? `Hi ${name},` : `Hi,`
    const petRef = petName ? ` — your dog ${petName} ` : " — your pet "
    const postRef = recentPost ? `Saw your recent ${recentPost}. ` : "Been enjoying your feed. "
    return `${greeting}

I run pawmasterpiece.com — we turn pet photos into hand-styled portraits (watercolor, oil, Renaissance, line art) with a free 30-second preview. ${postRef}I'd love to send you a free portrait${petRef}in any style, no obligation to post.

If you do enjoy it, we offer your audience a 20% code and a 15%/8% affiliate split on anything they order through your link.

Either way, here's the link if you want to play with it: pawmasterpiece.com

Thanks for the work you do,
Erinc`
  }, [channel, name, petName, recentPost])

  const submit = useCallback(async () => {
    if (!name || !handle) return
    setBusy(true)
    try {
      await fetch("/api/admin/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          handle,
          channel,
          email: email || null,
          url: url || null,
          niche: niche || null,
          followers: followers ? parseInt(followers, 10) : null,
          subject: null,
          body: dmBody || null,
          priority: 2,
        }),
      })
      onAdded()
    } finally {
      setBusy(false)
    }
  }, [name, handle, channel, url, niche, followers, email, dmBody, onAdded])

  return (
    <div className="bg-white rounded-2xl border border-brand-green/30 p-5 mb-4">
      <p className="text-xs font-display font-semibold uppercase tracking-wider text-brand-green mb-3">
        Add an influencer or new contact
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="First name (e.g. Sarah)" className="text-sm px-3 py-2 rounded-lg border border-gray-200" />
        <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="Handle (e.g. @bertiethedog)" className="text-sm px-3 py-2 rounded-lg border border-gray-200" />
        <select value={channel} onChange={(e) => setChannel(e.target.value as never)} className="text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white">
          <option value="instagram">Instagram</option>
          <option value="tiktok">TikTok</option>
          <option value="blogger">Blogger</option>
          <option value="podcast">Podcast</option>
          <option value="youtube">YouTube</option>
          <option value="other">Other</option>
        </select>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Profile URL (optional)" className="text-sm px-3 py-2 rounded-lg border border-gray-200" />
        <input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Niche (dog mom, cat lover, etc.)" className="text-sm px-3 py-2 rounded-lg border border-gray-200" />
        <input value={followers} onChange={(e) => setFollowers(e.target.value)} placeholder="Followers (optional)" type="number" className="text-sm px-3 py-2 rounded-lg border border-gray-200" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" className="text-sm px-3 py-2 rounded-lg border border-gray-200" />
        <input value={petName} onChange={(e) => setPetName(e.target.value)} placeholder="Their pet's name (for DM personalization)" className="text-sm px-3 py-2 rounded-lg border border-gray-200" />
      </div>
      <input value={recentPost} onChange={(e) => setRecentPost(e.target.value)} placeholder="Recent post topic to reference (e.g. 'Halloween costume reel')" className="text-sm px-3 py-2 rounded-lg border border-gray-200 w-full mb-3" />
      {(channel === "instagram" || channel === "tiktok") && dmBody && (
        <div className="mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">DM preview (auto-generated)</p>
          <pre className="text-xs bg-cream p-3 rounded-lg whitespace-pre-wrap border border-gray-200 leading-relaxed">{dmBody}</pre>
        </div>
      )}
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5">Cancel</button>
        <button onClick={submit} disabled={!name || !handle || busy} className="text-xs bg-brand-green text-cream px-4 py-2 rounded-full font-semibold hover:bg-brand-green/90 disabled:opacity-50">
          {busy ? "Saving…" : "Add contact"}
        </button>
      </div>
    </div>
  )
}

function ContactDetail({
  contact,
  onClose,
  onStatusChange,
  onDelete,
}: {
  contact: Contact
  onClose: () => void
  onStatusChange: (status: string) => void
  onDelete: () => void
}) {
  const [copyMsg, setCopyMsg] = useState<string | null>(null)

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyMsg(`${what} copied`)
      setTimeout(() => setCopyMsg(null), 1500)
    } catch {
      setCopyMsg("Copy failed — select and copy manually")
    }
  }

  const status = STATUS_OPTIONS.find((s) => s.v === contact.status)
  const sendUrl = contact.email
    ? `mailto:${contact.email}?subject=${encodeURIComponent(contact.subject || "")}&body=${encodeURIComponent(contact.body || "")}`
    : contact.url

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-4 sticky top-0 bg-white">
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-2xl text-brand-green leading-tight">{contact.handle}</h2>
            <p className="text-xs text-gray-500 mt-1">
              {CHANNEL_LABEL[contact.channel] || contact.channel}
              {contact.name && contact.name !== contact.handle ? ` · ${contact.name}` : null}
              {contact.followers ? ` · ${contact.followers.toLocaleString()} followers` : null}
            </p>
            {contact.url && (
              <a href={contact.url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-green hover:underline mt-1 inline-block">
                Open profile ↗
              </a>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status switcher */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">Status</p>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s.v}
                  onClick={() => onStatusChange(s.v)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                    contact.status === s.v
                      ? "bg-brand-green text-cream font-semibold"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {contact.sentAt && (
              <p className="text-xs text-gray-400 mt-2">
                Sent {new Date(contact.sentAt).toLocaleDateString()}
                {contact.repliedAt ? ` · Replied ${new Date(contact.repliedAt).toLocaleDateString()}` : ""}
                {contact.acceptedAt ? ` · Accepted ${new Date(contact.acceptedAt).toLocaleDateString()}` : ""}
                {contact.postedAt ? ` · Posted ${new Date(contact.postedAt).toLocaleDateString()}` : ""}
              </p>
            )}
          </div>

          {/* Email or DM payload */}
          {contact.email && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Email</p>
                <button onClick={() => copy(contact.email!, "Email")} className="text-xs text-brand-green hover:underline">
                  Copy
                </button>
              </div>
              <code className="block text-sm bg-cream px-3 py-2 rounded-lg break-all">{contact.email}</code>
            </div>
          )}

          {contact.subject && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Subject</p>
                <button onClick={() => copy(contact.subject!, "Subject")} className="text-xs text-brand-green hover:underline">
                  Copy
                </button>
              </div>
              <code className="block text-sm bg-cream px-3 py-2 rounded-lg">{contact.subject}</code>
            </div>
          )}

          {contact.body && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  {contact.channel === "instagram" || contact.channel === "tiktok" ? "DM" : "Email body"}
                </p>
                <button onClick={() => copy(contact.body!, "Body")} className="text-xs text-brand-green hover:underline">
                  Copy
                </button>
              </div>
              <pre className="text-sm bg-cream px-4 py-3 rounded-lg whitespace-pre-wrap leading-relaxed border border-gray-100">{contact.body}</pre>
            </div>
          )}

          {contact.notes && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Personalization notes</p>
              <p className="text-sm text-gray-600 leading-relaxed">{contact.notes}</p>
            </div>
          )}

          {/* Quick actions */}
          <div className="pt-3 border-t border-gray-100 flex flex-wrap gap-2">
            {contact.email && (
              <a
                href={sendUrl ?? "#"}
                target={contact.email ? undefined : "_blank"}
                rel="noopener noreferrer"
                className="text-xs bg-brand-green text-cream px-4 py-2 rounded-full font-semibold hover:bg-brand-green/90"
              >
                Open in email client ↗
              </a>
            )}
            {!contact.email && contact.url && (
              <a
                href={contact.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-brand-green text-cream px-4 py-2 rounded-full font-semibold hover:bg-brand-green/90"
              >
                Open contact form ↗
              </a>
            )}
            <button onClick={() => onStatusChange("sent")} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-2 rounded-full font-semibold hover:bg-blue-100">
              Mark as sent
            </button>
            <button onClick={onDelete} className="text-xs text-red-600 hover:underline ml-auto">
              Delete
            </button>
          </div>

          {copyMsg && (
            <p className="text-xs text-brand-green text-center pt-2">{copyMsg}</p>
          )}
        </div>
      </div>
    </div>
  )
}
