import { motion } from 'framer-motion'
import {
  ArrowRight,
  ArrowUpRight,
  Braces,
  Crown,
  Dna,
  Flame,
  Ghost,
  Github,
  Share2,
  Sparkles,
  Swords,
  Trophy,
  Users,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const api = import.meta.env.VITE_BACKEND_URL || 'http://localhost:2001/api/v1'

const MARQUEE = [
  '1v1 duels',
  'battle royales',
  'server-verified MCQ',
  'developer DNA',
  'github wrapped',
  'leetcode grind',
  'live standings',
  'public proof',
]

const LOOP = [
  {
    n: '01',
    title: 'Connect GitHub',
    text: 'OAuth in seconds. DevArena reads your repos, languages, streaks and stars — never your code.',
  },
  {
    n: '02',
    title: 'Mint your DNA',
    text: 'Deterministic backend rules turn raw activity into a persona. Same data, same identity. No black box.',
  },
  {
    n: '03',
    title: 'Battle live',
    text: 'Drop a six-character code, gather rivals, and answer server-scored multiple-choice under pressure.',
  },
  {
    n: '04',
    title: 'Flex the proof',
    text: 'Wins, ranks and heat walls land on a public profile you can share anywhere.',
  },
]

const FEATURES = [
  { icon: Dna, title: 'Developer DNA', text: 'Architect, Night Owl, Polyglot — your persona, derived in the open.' },
  { icon: Swords, title: '1v1s & Royales', text: 'Duel one rival or survive an 8-developer free-for-all.' },
  { icon: Sparkles, title: 'Wrapped', text: 'Your year of building as an animated story with PNG export.' },
  { icon: Flame, title: 'Heat walls', text: 'GitHub pushes and LeetCode solves fused into glowing streak maps.' },
  { icon: Trophy, title: 'Rankings', text: 'Server-verified wins only. No selfies, no self-reported stats.' },
  { icon: Share2, title: 'Public proof', text: 'Shareable profiles and battle receipts for LinkedIn and beyond.' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0 },
}

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden text-text">
      {/* ── Nav ─────────────────────────────────────────── */}
      <motion.header
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="hover-target flex items-center gap-2 font-display text-xl font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-background shadow-glow">
              <Braces size={20} />
            </span>
            DevArena
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-textMuted md:flex">
            <Link to="/arena" className="hover-target transition hover:text-text">Arena</Link>
            <Link to="/leaderboard" className="hover-target transition hover:text-text">Rankings</Link>
            <Link to="/wrapped" className="hover-target transition hover:text-text">Wrapped</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className="hover-target hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-textMuted transition hover:text-text sm:block"
            >
              Explore demo
            </Link>
            <a
              href={`${api}/auth/github`}
              className="hover-target inline-flex items-center gap-2 rounded-xl bg-text px-4 py-2.5 text-sm font-bold text-background transition hover:brightness-110"
            >
              <Github size={16} />
              Sign in
            </a>
          </div>
        </div>
      </motion.header>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 pb-16 pt-28 sm:px-6">
        <div className="pointer-events-none absolute left-1/2 top-24 h-96 w-[42rem] max-w-full -translate-x-1/2 rounded-full bg-secondary/15 blur-[130px]" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="hover-target inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold tracking-[.2em] text-primary"
        >
          <Zap size={13} />
          SEASON 01 — PROOF OF SKILL
        </motion.div>

        <h1 className="mt-7 font-display font-extrabold leading-[.92] tracking-tight">
          <motion.span
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="block text-[13vw] sm:text-7xl lg:text-8xl"
          >
            YOUR COMMITS
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.37, ease: [0.22, 1, 0.36, 1] }}
            className="block bg-gradient-to-r from-primary via-emerald-200 to-secondary bg-clip-text text-[13vw] text-transparent sm:text-7xl lg:text-8xl"
          >
            ARE THE ARENA.
          </motion.span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-7 max-w-xl text-lg leading-8 text-textMuted"
        >
          DevArena turns GitHub history and LeetCode grind into a living battle
          record — then lets you defend it live against other developers.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.62 }}
          className="mt-9 flex flex-wrap items-center gap-3"
        >
          <a
            href={`${api}/auth/github`}
            className="hover-target group inline-flex items-center gap-2 rounded-2xl bg-primary px-7 py-4 font-bold text-background shadow-glow transition hover:brightness-110"
          >
            <Github size={19} />
            Connect GitHub
            <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
          </a>
          <Link
            to="/arena"
            className="hover-target inline-flex items-center gap-2 rounded-2xl border border-border bg-surface/70 px-7 py-4 font-semibold backdrop-blur transition hover:border-primary/50 hover:text-primary"
          >
            <Swords size={18} />
            Enter the Arena
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-14 grid max-w-2xl grid-cols-3 gap-6 border-t border-border/60 pt-7"
        >
          {[
            ['5', 'MCQs per battle'],
            ['8', 'player royales'],
            ['100%', 'server-verified'],
          ].map(([n, l]) => (
            <div key={l}>
              <p className="font-display text-3xl font-bold text-primary sm:text-4xl">{n}</p>
              <p className="mt-1 text-sm text-textMuted">{l}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[11px] font-bold tracking-[.3em] text-textSubtle md:flex"
        >
          SCROLL
          <span className="block h-8 w-px bg-gradient-to-b from-primary to-transparent" />
        </motion.div>
      </section>

      {/* ── Marquee ─────────────────────────────────────── */}
      <div className="relative overflow-hidden border-y border-border/60 bg-surface/50 py-4 backdrop-blur">
        <div className="animate-marquee flex w-max gap-10 whitespace-nowrap">
          {[...MARQUEE, ...MARQUEE].map((item, i) => (
            <span key={i} className="flex items-center gap-10 font-display text-sm font-bold uppercase tracking-[.25em] text-textMuted">
              {item}
              <Sparkles size={14} className="text-primary" />
            </span>
          ))}
        </div>
      </div>

      {/* ── The loop ────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-sm font-bold tracking-[.25em] text-primary">THE LOOP</p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl font-bold leading-tight sm:text-6xl">
            From quiet pushes to loud victories.
          </h2>
        </motion.div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LOOP.map((step, i) => (
            <motion.div
              key={step.n}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, delay: i * 0.1 }}
              className="hover-target group relative overflow-hidden rounded-3xl border border-border bg-surface/80 p-7 backdrop-blur transition-colors hover:border-primary/40"
            >
              <span className="font-display text-6xl font-extrabold text-border transition-colors group-hover:text-primary/40">
                {step.n}
              </span>
              <h3 className="mt-5 font-display text-xl font-bold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-textMuted">{step.text}</p>
              <div className="pointer-events-none absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-primary/0 blur-3xl transition-colors duration-500 group-hover:bg-primary/20" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Modes ───────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 sm:pb-32">
        <div className="grid gap-4 lg:grid-cols-2">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="hover-target group relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-surface to-surface p-9 sm:p-12"
          >
            <Ghost size={30} className="text-primary" />
            <h3 className="mt-6 font-display text-4xl font-bold sm:text-5xl">1 vs 1<br />Duels.</h3>
            <p className="mt-4 max-w-md leading-7 text-textMuted">
              You against one rival. One room code, five questions, sixty seconds
              of reputation on the line.
            </p>
            <Link to="/arena" className="mt-7 inline-flex items-center gap-2 font-bold text-primary">
              Start a duel <ArrowUpRight size={18} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Link>
          </motion.div>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="hover-target group relative overflow-hidden rounded-3xl border border-secondary/30 bg-gradient-to-br from-secondary/15 via-surface to-surface p-9 sm:p-12"
          >
            <Users size={30} className="text-secondary" />
            <h3 className="mt-6 font-display text-4xl font-bold sm:text-5xl">1 vs Many<br />Royales.</h3>
            <p className="mt-4 max-w-md leading-7 text-textMuted">
              Up to eight developers. Live standings. One survivor at the top of
              the leaderboard.
            </p>
            <Link to="/arena" className="mt-7 inline-flex items-center gap-2 font-bold text-secondary">
              Start a royale <ArrowUpRight size={18} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Arsenal ─────────────────────────────────────── */}
      <section className="border-t border-border/60 bg-surface/40 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-sm font-bold tracking-[.25em] text-primary">THE ARSENAL</p>
            <h2 className="mt-3 max-w-2xl font-display text-4xl font-bold leading-tight sm:text-6xl">
              Everything proof needs.
            </h2>
          </motion.div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
                className="hover-target rounded-3xl border border-border bg-background/60 p-7 transition-colors hover:border-primary/40"
              >
                <feature.icon size={22} className="text-primary" />
                <h3 className="mt-4 font-display text-lg font-bold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-textMuted">{feature.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          className="hover-target relative overflow-hidden rounded-[2.5rem] border border-primary/25 bg-gradient-to-br from-primary/15 via-surface to-secondary/15 px-8 py-16 text-center sm:px-16 sm:py-24"
        >
          <Crown size={34} className="mx-auto text-primary" />
          <h2 className="mx-auto mt-6 max-w-3xl font-display text-4xl font-bold leading-tight sm:text-6xl">
            Stop pushing to the void. Start collecting crowns.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-textMuted">
            Your work already tells a story. DevArena just gives it a scoreboard.
          </p>
          <a
            href={`${api}/auth/github`}
            className="hover-target mt-9 inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 font-bold text-background shadow-glow transition hover:brightness-110"
          >
            <Github size={19} />
            Connect GitHub — it&apos;s free
          </a>
          <p className="mt-4 text-xs text-textSubtle">OAuth-ready · tokens never touch the browser</p>
        </motion.div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-8 sm:px-6">
          <span className="flex items-center gap-2 font-display font-bold">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-sm text-background">{'</>'}</span>
            DevArena
          </span>
          <div className="flex gap-6 text-sm text-textMuted">
            <Link to="/arena" className="hover-target transition hover:text-text">Arena</Link>
            <Link to="/leaderboard" className="hover-target transition hover:text-text">Rankings</Link>
            <Link to="/dashboard" className="hover-target transition hover:text-text">Dashboard</Link>
          </div>
          <p className="text-xs text-textSubtle">Proof of skill, not just a profile.</p>
        </div>
      </footer>
    </div>
  )
}
