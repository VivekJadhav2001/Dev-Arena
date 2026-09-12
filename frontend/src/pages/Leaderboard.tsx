import { Crown, Medal, Swords } from "lucide-react";
const people = [
  ["1", "Ananya Rao", "3,420", "18"],
  ["2", "Rahul Verma", "3,105", "16"],
  ["3", "Maya Singh", "2,860", "15"],
  ["24", "Vivek Jadhav", "1,480", "7"],
  ["25", "Arjun Shah", "1,460", "8"],
];
export default function Leaderboard() {
  return (
    <div>
      <p className="text-sm font-bold text-primary">GLOBAL RANKINGS</p>
      <h1 className="mt-1 font-display text-4xl font-bold">
        Builders earning their place.
      </h1>
      <p className="mt-2 text-textMuted">
        Rankings combine verified battle wins, badges, and sustained
        contribution.
      </p>
      <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="grid grid-cols-[60px_1fr_90px_90px] border-b border-border px-5 py-4 text-xs font-bold uppercase tracking-wider text-textSubtle">
          <span>Rank</span>
          <span>Developer</span>
          <span>XP</span>
          <span>Wins</span>
        </div>
        {people.map(([rank, name, xp, wins]) => (
          <div
            key={rank}
            className={`grid grid-cols-[60px_1fr_90px_90px] items-center px-5 py-4 ${name === "Vivek Jadhav" ? "bg-primary/10" : ""}`}
          >
            <span className="font-bold text-primary">
              {rank === "1" ? <Crown size={19} /> : rank}
            </span>
            <span className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary/60 font-bold">
                {name
                  .split(" ")
                  .map((x) => x[0])
                  .join("")}
              </span>
              <span>
                <b className="block">{name}</b>
                <small className="text-textMuted">
                  {name === "Vivek Jadhav"
                    ? "You · The Consistent Builder"
                    : "Arena contender"}
                </small>
              </span>
            </span>
            <b>{xp}</b>
            <span className="inline-flex items-center gap-1 text-textMuted">
              <Swords size={14} />
              {wins}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-2 text-sm text-textMuted">
        <Medal className="text-warning" size={18} />
        Battle wins and earned badges are server-verified before affecting rank.
      </div>
    </div>
  );
}
