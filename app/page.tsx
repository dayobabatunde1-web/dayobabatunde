import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LogiTrust | Welcome",
  description: "Welcome to LogiTrust, your delivery management dashboard.",
};

const featureCards = [
  { label: "Orders", value: "24/7", accent: "bg-blue-50 text-blue-700" },
  { label: "Riders", value: "Live", accent: "bg-sky-50 text-sky-700" },
  { label: "Tracking", value: "Instant", accent: "bg-indigo-50 text-indigo-700" },
  { label: "Support", value: "Built-in", accent: "bg-cyan-50 text-cyan-700" },
];

const highlights = [
  {
    title: "Track every delivery",
    body: "Generate and share secure tracking links so customers can follow their orders from pickup to delivery.",
  },
  {
    title: "Keep riders aligned",
    body: "Assign riders, monitor status, and keep dispatch information up to date in one dashboard.",
  },
  {
    title: "See your operations clearly",
    body: "Get a fast overview of active deliveries, completed orders, and current day-to-day performance.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#eff6ff,_#ffffff_42%,_#dbeafe_100%)] px-6 py-12 sm:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <section className="overflow-hidden rounded-[32px] border border-blue-100 bg-white/95 p-8 shadow-[0_25px_80px_rgba(59,130,246,0.18)] backdrop-blur sm:p-10">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-2xl">
              <p className="mb-4 inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                Welcome to LogiTrust
              </p>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Deliver with confidence, clarity, and a team that stays connected.
              </h1>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                From order intake to live customer updates, LogiTrust gives your delivery team a calm and dependable dashboard built for speed, visibility, and trust.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="/auth/signup"
                  className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Create account
                </a>
                <a
                  href="/auth/login"
                  className="rounded-full border border-blue-200 px-5 py-3 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50"
                >
                  Sign in
                </a>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:min-w-[360px]">
              {featureCards.map((item) => (
                <div key={item.label} className="rounded-[24px] border border-slate-100 bg-slate-50 px-4 py-5">
                  <p className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${item.accent}`}>
                    {item.label}
                  </p>
                  <p className="mt-3 text-2xl font-bold text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
          <div className="rounded-[28px] border border-blue-100 bg-white p-6 shadow-[0_20px_60px_rgba(59,130,246,0.1)] sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
              At a glance
            </p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">
              Built for dispatch teams that need speed and visibility.
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Your team can review current orders, manage rider assignments, and open live delivery links from a single place.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Orders", value: "Manage" },
                { label: "Riders", value: "Assign" },
                { label: "Tracking", value: "Share" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-blue-50 px-4 py-4 text-center">
                  <p className="text-xs font-semibold text-blue-700">{item.label}</p>
                  <p className="mt-2 text-lg font-bold text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-600 to-sky-500 p-6 text-white shadow-[0_25px_60px_rgba(37,99,235,0.22)] sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">
              Welcome message
            </p>
            <h2 className="mt-3 text-2xl font-bold">
              Your delivery operations, made simpler.
            </h2>
            <p className="mt-4 text-sm leading-7 text-blue-50">
              Welcome aboard! LogiTrust is designed to help your team move faster, communicate better, and deliver with confidence every single day.
            </p>
            <div className="mt-6 rounded-2xl bg-white/10 px-4 py-4">
              <p className="text-sm text-blue-50">
                “A calm dashboard for busy delivery teams, helping you stay ahead of every handoff.”
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {highlights.map((item) => (
            <div key={item.title} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
              <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.body}</p>
            </div>
          ))}
        </section>

        <section className="rounded-[28px] border border-blue-100 bg-white p-8 shadow-[0_20px_60px_rgba(59,130,246,0.08)] sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
                Why businesses trust LogiTrust
              </p>
              <h2 className="mt-3 text-2xl font-bold text-slate-900">
                A cleaner way to manage deliveries, keep customers informed, and move with confidence.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                LogiTrust combines live status updates, rider coordination, and customer tracking into one simple experience so your team can respond faster and communicate better.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { value: "99%", label: "tracking visibility" },
                { value: "24/7", label: "order visibility" },
                { value: "Faster", label: "handoff communication" },
                { value: "Reliable", label: "delivery updates" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-blue-50 px-4 py-4 text-center">
                  <p className="text-2xl font-bold text-slate-900">{item.value}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[30px] bg-gradient-to-r from-blue-700 to-sky-500 px-6 py-8 text-white shadow-[0_25px_70px_rgba(37,99,235,0.22)] sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">
                Ready to get started?
              </p>
              <h2 className="mt-3 text-2xl font-bold">
                Bring your delivery operations into one clear, modern dashboard.
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href="/auth/signup"
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                Create your account
              </a>
              <a
                href="/auth/login"
                className="rounded-full border border-white/60 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Sign in
              </a>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-blue-100 bg-white p-8 shadow-[0_20px_60px_rgba(59,130,246,0.08)] sm:p-10">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
              What customers say
            </p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">
              Teams love how easy it is to coordinate deliveries and keep customers informed.
            </h2>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              {
                quote: "LogiTrust helped us simplify dispatch and made customer updates feel effortless. Our team is much more organized now.",
                name: "Amina Yusuf",
                role: "Operations Lead",
              },
              {
                quote: "The tracking flow is clear, fast, and easy to share. It gave our clients more confidence and reduced follow-up questions.",
                name: "Samuel Ade",
                role: "Delivery Manager",
              },
            ].map((item) => (
              <div key={item.name} className="rounded-[24px] bg-slate-50 p-6">
                <p className="text-sm leading-7 text-slate-600">“{item.quote}”</p>
                <div className="mt-4">
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <p className="text-sm text-slate-500">{item.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
