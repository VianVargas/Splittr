import WalletConnect from "@/components/WalletConnect";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-white px-4 dark:bg-zinc-950">
      <header className="flex w-full max-w-3xl items-center justify-between py-4">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Splittr
        </h1>
        <WalletConnect />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center" />
    </div>
  );
}
