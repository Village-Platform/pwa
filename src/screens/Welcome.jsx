import { S } from "../lib/strings.js";

// First launch only (Android WelcomeScreen): the splash artwork with "start" and "I have an account".
const KEY = "aghour.welcomeDone";
export const welcomeDone = () => localStorage.getItem(KEY) === "1";

export default function Welcome({ onDone }) {
  const finish = (login) => {
    localStorage.setItem(KEY, "1");
    onDone(login);
  };
  return (
    <div className="fixed inset-0 bg-[#0B3727]">
      <img src="/brand/welcome_splash.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-x-0 top-[60%] px-7 flex flex-col items-center text-center">
        <p className="text-[#F4ECD9]/90 text-lg font-bold">{S.welcomeTitle}</p>
        <button
          onClick={() => finish(false)}
          className="mt-4 h-14 w-full max-w-sm rounded-xl bg-gold text-black text-lg font-extrabold active:opacity-80"
        >
          {S.startNow}
        </button>
        <button onClick={() => finish(true)} className="mt-2 py-2 font-bold text-gold">
          {S.haveAccountLogin}
        </button>
      </div>
    </div>
  );
}
